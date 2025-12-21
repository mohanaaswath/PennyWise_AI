import { Bot } from 'lucide-react';

interface StreamingMessageProps {
  content: string;
}

export const StreamingMessage = ({ content }: StreamingMessageProps) => {
  return (
    <div className="animate-fade-in bg-chat-assistant px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-3xl gap-4">
        {/* Avatar */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Bot className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-medium">Assistant</span>
            <span className="text-xs text-muted-foreground">typing...</span>
          </div>
          
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-foreground leading-relaxed">
              {content}
              <span className="ml-1 inline-flex gap-1">
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
            </p>
          </div>
        </div>

        {/* Placeholder for alignment */}
        <div className="h-8 w-8 flex-shrink-0" />
      </div>
    </div>
  );
};
