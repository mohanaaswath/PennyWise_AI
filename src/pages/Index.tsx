import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { StreamingMessage } from '@/components/chat/StreamingMessage';
import { EmptyChat } from '@/components/chat/EmptyChat';
import { cn } from '@/lib/utils';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
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
  } = useChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, streamingContent]);

  const hasMessages = activeConversation && activeConversation.messages.length > 0;
  const canRegenerate = hasMessages && activeConversation.messages.some(m => m.role === 'assistant');

  const handleSuggestionSend = async (message: string) => {
    if (!activeConversationId) {
      const newConv = await createConversation();
      if (newConv) {
        // Small delay to ensure state is updated
        setTimeout(() => sendMessage(message), 100);
      }
    } else {
      sendMessage(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSelectConversation={selectConversation}
        onNewConversation={createConversation}
        onDeleteConversation={deleteConversation}
        onTogglePin={togglePin}
      />

      {/* Main Content */}
      <main
        className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          sidebarOpen ? 'ml-72' : 'ml-0'
        )}
      >
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {hasMessages ? (
            <div className="pb-32">
              {activeConversation.messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isStreaming && streamingContent && (
                <StreamingMessage content={streamingContent} />
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <EmptyChat onSendMessage={handleSuggestionSend} />
          )}
        </div>

        {/* Input Area */}
        <ChatInput
          onSendMessage={sendMessage}
          onStopGeneration={stopGeneration}
          onRegenerateResponse={regenerateResponse}
          isStreaming={isStreaming}
          canRegenerate={canRegenerate}
        />
      </main>
    </div>
  );
};

export default Index;
