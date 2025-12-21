import { useState, useCallback, useRef } from 'react';
import { Message, Conversation } from '@/types/chat';
import { createNewConversation, createMessage, generateTitle, simulateAIResponse, generateId } from '@/lib/chatUtils';

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const initial = createNewConversation();
    return [initial];
  });
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    return conversations[0]?.id || null;
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const createConversation = useCallback(() => {
    const newConversation = createNewConversation();
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
      if (filtered.length === 0) {
        const newConv = createNewConversation();
        setActiveConversationId(newConv.id);
        return [newConv];
      }
      if (id === activeConversationId) {
        setActiveConversationId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeConversationId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!activeConversationId || isStreaming) return;

    const userMessage = createMessage('user', content);
    
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

    setIsStreaming(true);
    setStreamingContent('');
    abortControllerRef.current = new AbortController();

    try {
      let fullResponse = '';
      await simulateAIResponse(
        content,
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
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // User stopped generation
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
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  }, [activeConversationId, isStreaming, streamingContent]);

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

    const lastUserMessage = messages[lastUserMessageIndex];
    
    // Remove messages after the last user message
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
      await simulateAIResponse(
        lastUserMessage.content,
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
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  }, [activeConversation, activeConversationId, isStreaming, streamingContent]);

  return {
    conversations,
    activeConversation,
    activeConversationId,
    isStreaming,
    streamingContent,
    createConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    stopGeneration,
    regenerateResponse,
  };
};
