import { useState } from 'react';
import { Copy, Check, User, Download } from 'lucide-react';
import { Message } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/chatUtils';
import { cn } from '@/lib/utils';
import { PennywiseLogo } from '@/components/PennywiseLogo';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export const ChatMessage = ({ message, isStreaming = false }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadImage = () => {
    if (message.imageUrl) {
      const link = document.createElement('a');
      link.href = message.imageUrl;
      link.download = `pennywise-ai-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
          {isUser ? <User className="h-4 w-4" /> : <PennywiseLogo size="sm" />}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-medium">
              {isUser ? 'You' : 'Pennywise AI'}
            </span>
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          
          {/* Image Display */}
          {message.imageUrl && (
            <div className="mb-4 relative group/image">
              <div className={cn(
                "relative overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all",
                !imageLoaded && "animate-pulse min-h-[200px]"
              )}>
                <img 
                  src={message.imageUrl} 
                  alt="Generated image" 
                  className={cn(
                    "max-w-full max-h-[512px] rounded-xl object-contain transition-opacity duration-300",
                    imageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={() => setImageLoaded(true)}
                />
                {imageLoaded && (
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover/image:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleDownloadImage}
                      className="gap-2 bg-background/80 backdrop-blur-sm hover:bg-background"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          
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
