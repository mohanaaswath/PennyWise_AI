import { useState, useCallback, useRef } from 'react';
import { Message, Conversation } from '@/types/chat';
import { createMessage, generateTitle, streamAIResponse, isImageRequest, extractImagePrompt, generateImage } from '@/lib/chatUtils';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useSettings';

export const useChat = () => {
  const { toast } = useToast();
  const { playSound } = useSettings();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const createConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      isPinned: false,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    return newConversation;
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (id === activeConversationId && filtered.length > 0) {
        setActiveConversationId(filtered[0].id);
      } else if (filtered.length === 0) {
        setActiveConversationId(null);
      }
      return filtered;
    });
  }, [activeConversationId]);

  const togglePin = useCallback((id: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === id ? { ...conv, isPinned: !conv.isPinned } : conv
    ));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!activeConversationId || isStreaming) return;

    const userMessage = createMessage('user', content);
    
    // Get current messages for API call
    const currentMessages = activeConversation?.messages || [];
    const apiMessages = [...currentMessages, userMessage].map(m => ({
      role: m.role,
      content: m.content
    }));

    // Update local state
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

    // Play send sound
    playSound('send');

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

      // Play receive sound
      playSound('receive');

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
      } else {
        console.error('Error generating response:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
        playSound('error');
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
  }, [activeConversationId, activeConversation, isStreaming, streamingContent, toast, playSound]);

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
