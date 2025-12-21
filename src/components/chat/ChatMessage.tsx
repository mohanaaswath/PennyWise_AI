import { useState } from 'react';
import { Copy, Check, User, Bot } from 'lucide-react';
import { Message } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/chatUtils';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export const ChatMessage = ({ message, isStreaming = false }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'group animate-fade-in px-4 py-6 md:px-8',
        isUser ? 'bg-chat-user' : 'bg-chat-assistant'
      )}
    >
      <div className="mx-auto flex max-w-3xl gap-4">
        {/* Avatar */}
        <div
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-accent text-accent-foreground'
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-medium">
              {isUser ? 'You' : 'Assistant'}
            </span>
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-foreground leading-relaxed">
              {message.content}
              {isStreaming && (
                <span className="ml-1 inline-flex gap-1">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Copy Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className={cn(
            'h-8 w-8 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100',
            copied && 'opacity-100'
          )}
        >
          {copied ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
};
