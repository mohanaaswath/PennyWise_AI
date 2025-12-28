import { useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { StreamingMessage } from '@/components/chat/StreamingMessage';
import { PennywiseLogo } from '@/components/PennywiseLogo';

const CodeHelp = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    activeConversation,
    isStreaming,
    streamingContent,
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border p-4">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Button>
        </Link>
      </header>
      
      <main className="flex flex-1 flex-col">
        {/* Header Section */}
        <div className="flex flex-col items-center p-8">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
            <PennywiseLogo size="lg" />
          </div>
          
          <h1 className="mb-4 text-3xl font-bold text-foreground">Code Help</h1>
          <p className="mb-8 max-w-md text-center text-muted-foreground">
            Need help with programming? I can debug, explain, or help you write code in any language.
          </p>
          
          {!hasMessages && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-medium text-foreground">Debug Code</h3>
                <p className="text-sm text-muted-foreground">Find and fix errors</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-medium text-foreground">Explain Code</h3>
                <p className="text-sm text-muted-foreground">Understand how it works</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-medium text-foreground">Write Code</h3>
                <p className="text-sm text-muted-foreground">Build new features</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-medium text-foreground">Code Review</h3>
                <p className="text-sm text-muted-foreground">Improve your code</p>
              </div>
            </div>
          )}
        </div>

        {/* Messages Area */}
        {hasMessages && (
          <div className="flex-1 overflow-y-auto px-4 pb-32">
            {activeConversation.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isStreaming && streamingContent && (
              <StreamingMessage content={streamingContent} />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

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

export default CodeHelp;
