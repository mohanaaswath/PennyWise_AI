import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, Conversation } from '@/types/chat';
import { createMessage, generateTitle, streamAIResponse, isImageRequest, extractImagePrompt, generateImage } from '@/lib/chatUtils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useChat = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // Load conversations from database
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) {
        setConversations([]);
        setActiveConversationId(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (convError) throw convError;

        if (convData && convData.length > 0) {
          // Load messages for all conversations
          const { data: msgData, error: msgError } = await supabase
            .from('messages')
            .select('*')
            .in('conversation_id', convData.map(c => c.id))
            .order('created_at', { ascending: true });

          if (msgError) throw msgError;

          const conversationsWithMessages: Conversation[] = convData.map(conv => ({
            id: conv.id,
            title: conv.title,
            isPinned: conv.is_pinned,
            createdAt: new Date(conv.created_at),
            updatedAt: new Date(conv.updated_at),
            messages: (msgData || [])
              .filter(m => m.conversation_id === conv.id)
              .map(m => {
                // Parse image URL from stored content
                let content = m.content;
                let imageUrl: string | undefined;
                
                const imageMatch = m.content.match(/^\[IMAGE:(data:image\/[^;]+;base64,[^\]]+)\]/);
                if (imageMatch) {
                  imageUrl = imageMatch[1];
                  content = m.content.replace(imageMatch[0], '');
                }
                
                return {
                  id: m.id,
                  role: m.role as 'user' | 'assistant',
                  content,
                  timestamp: new Date(m.created_at),
                  imageUrl,
                };
              })
          }));

          setConversations(conversationsWithMessages);
          setActiveConversationId(conversationsWithMessages[0].id);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, [user]);

  const createConversation = useCallback(async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your conversations.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({ user_id: user.id, title: 'New Chat' })
        .select()
        .single();

      if (error) throw error;

      const newConversation: Conversation = {
        id: data.id,
        title: data.title,
        isPinned: data.is_pinned,
        messages: [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);
      return newConversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create conversation.",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast]);

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConversations(prev => {
        const filtered = prev.filter(c => c.id !== id);
        if (id === activeConversationId && filtered.length > 0) {
          setActiveConversationId(filtered[0].id);
        } else if (filtered.length === 0) {
          setActiveConversationId(null);
        }
        return filtered;
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation.",
        variant: "destructive",
      });
    }
  }, [activeConversationId, toast]);

  const togglePin = useCallback(async (id: string) => {
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_pinned: !conversation.isPinned })
        .eq('id', id);

      if (error) throw error;

      setConversations(prev => prev.map(conv => 
        conv.id === id ? { ...conv, isPinned: !conv.isPinned } : conv
      ));
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: "Error",
        description: "Failed to update pin status.",
        variant: "destructive",
      });
    }
  }, [conversations, toast]);

  const sendMessage = useCallback(async (content: string) => {
    if (!activeConversationId || isStreaming) return;

    const userMessage = createMessage('user', content);
    
    // Get current messages for API call
    const currentMessages = activeConversation?.messages || [];
    const apiMessages = [...currentMessages, userMessage].map(m => ({
      role: m.role,
      content: m.content
    }));

    // Optimistic update
    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConversationId) {
        const updatedMessages = [...conv.messages, userMessage];
        return {
          ...conv,
          messages: updatedMessages,
          title: conv.messages.length === 0 ? generateTitle(updatedMessages) : conv.title,
          updatedAt: new Date(),
        };
      }
      return conv;
    }));

    // Save user message to database
    try {
      await supabase.from('messages').insert({
        id: userMessage.id,
        conversation_id: activeConversationId,
        role: 'user',
        content: content
      });

      // Update title if first message
      if (currentMessages.length === 0) {
        const newTitle = generateTitle([...currentMessages, userMessage]);
        await supabase
          .from('conversations')
          .update({ title: newTitle, updated_at: new Date().toISOString() })
          .eq('id', activeConversationId);
      }
    } catch (error) {
      console.error('Error saving user message:', error);
    }

    // Check if this is an image generation request
    if (isImageRequest(content)) {
      setIsStreaming(true);
      setStreamingContent('🎨 Generating image...');

      try {
        const imagePrompt = extractImagePrompt(content);
        const { imageUrl, description } = await generateImage(imagePrompt);
        
        const assistantMessage = createMessage(
          'assistant', 
          description || `Here's the image I generated for "${imagePrompt}"`,
          imageUrl
        );
        
        setConversations(prev => prev.map(conv => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              messages: [...conv.messages, assistantMessage],
              updatedAt: new Date(),
            };
          }
          return conv;
        }));

        // Save assistant message with image URL in content
        await supabase.from('messages').insert({
          id: assistantMessage.id,
          conversation_id: activeConversationId,
          role: 'assistant',
          content: `[IMAGE:${imageUrl}]${assistantMessage.content}`
        });

        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', activeConversationId);

      } catch (error) {
        console.error('Error generating image:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate image';
        toast({
          title: "Image Generation Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsStreaming(false);
        setStreamingContent('');
      }
      return;
    }

    // Regular text response

    setIsStreaming(true);
    setStreamingContent('');
    abortControllerRef.current = new AbortController();

    try {
      let fullResponse = '';
      await streamAIResponse(
        apiMessages,
        (chunk) => {
          fullResponse += chunk;
          setStreamingContent(fullResponse);
        },
        abortControllerRef.current.signal
      );

      const assistantMessage = createMessage('assistant', fullResponse);
      
      setConversations(prev => prev.map(conv => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, assistantMessage],
            updatedAt: new Date(),
          };
        }
        return conv;
      }));

      // Save assistant message to database
      await supabase.from('messages').insert({
        id: assistantMessage.id,
        conversation_id: activeConversationId,
        role: 'assistant',
        content: fullResponse
      });

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeConversationId);

    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        const partialMessage = createMessage('assistant', streamingContent || 'Response was stopped.');
        setConversations(prev => prev.map(conv => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              messages: [...conv.messages, partialMessage],
              updatedAt: new Date(),
            };
          }
          return conv;
        }));

        // Save partial message
        await supabase.from('messages').insert({
          id: partialMessage.id,
          conversation_id: activeConversationId,
          role: 'assistant',
          content: partialMessage.content
        });
      } else {
        console.error('Error generating response:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  }, [activeConversationId, activeConversation, isStreaming, streamingContent, toast]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const regenerateResponse = useCallback(async () => {
    if (!activeConversation || isStreaming) return;

    const messages = activeConversation.messages;
    if (messages.length < 2) return;

    // Find the last user message
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }

    if (lastUserMessageIndex === -1) return;

    const apiMessages = messages.slice(0, lastUserMessageIndex + 1).map(m => ({
      role: m.role,
      content: m.content
    }));

    // Delete messages after last user message from database
    const messagesToDelete = messages.slice(lastUserMessageIndex + 1).map(m => m.id);
    if (messagesToDelete.length > 0) {
      await supabase.from('messages').delete().in('id', messagesToDelete);
    }

    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConversationId) {
        return {
          ...conv,
          messages: messages.slice(0, lastUserMessageIndex + 1),
          updatedAt: new Date(),
        };
      }
      return conv;
    }));

    setIsStreaming(true);
    setStreamingContent('');
    abortControllerRef.current = new AbortController();

    try {
      let fullResponse = '';
      await streamAIResponse(
        apiMessages,
        (chunk) => {
          fullResponse += chunk;
          setStreamingContent(fullResponse);
        },
        abortControllerRef.current.signal
      );

      const assistantMessage = createMessage('assistant', fullResponse);
      
      setConversations(prev => prev.map(conv => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            messages: [...conv.messages.slice(0, lastUserMessageIndex + 1), assistantMessage],
            updatedAt: new Date(),
          };
        }
        return conv;
      }));

      await supabase.from('messages').insert({
        id: assistantMessage.id,
        conversation_id: activeConversationId,
        role: 'assistant',
        content: fullResponse
      });

    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        const partialMessage = createMessage('assistant', streamingContent || 'Response was stopped.');
        setConversations(prev => prev.map(conv => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              messages: [...conv.messages, partialMessage],
              updatedAt: new Date(),
            };
          }
          return conv;
        }));

        await supabase.from('messages').insert({
          id: partialMessage.id,
          conversation_id: activeConversationId,
          role: 'assistant',
          content: partialMessage.content
        });
      } else {
        console.error('Error regenerating response:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  }, [activeConversation, activeConversationId, isStreaming, streamingContent, toast]);

  return {
    conversations,
    activeConversation,
    activeConversationId,
    isStreaming,
    streamingContent,
    isLoading,
    createConversation,
    selectConversation,
    deleteConversation,
    togglePin,
    sendMessage,
    stopGeneration,
    regenerateResponse,
  };
};
