import { useState, useRef, useEffect } from 'react';
import { Send, Square, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onStopGeneration: () => void;
  onRegenerateResponse: () => void;
  isStreaming: boolean;
  canRegenerate: boolean;
}

export const ChatInput = ({
  onSendMessage,
  onStopGeneration,
  onRegenerateResponse,
  isStreaming,
  canRegenerate,
}: ChatInputProps) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl px-4 py-4">
        {/* Action Buttons */}
        <div className="mb-3 flex items-center justify-center gap-2">
          {isStreaming ? (
            <Button
              onClick={onStopGeneration}
              variant="outline"
              size="sm"
              className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              <Square className="h-3 w-3 fill-current" />
              Stop Generating
            </Button>
          ) : (
            canRegenerate && (
              <Button
                onClick={onRegenerateResponse}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate Response
              </Button>
            )
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-end gap-2 rounded-xl border border-border bg-secondary/50 p-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message..."
              className="min-h-[24px] max-h-[200px] flex-1 resize-none border-0 bg-transparent p-2 text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
              rows={1}
              disabled={isStreaming}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isStreaming}
              className="h-10 w-10 flex-shrink-0 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Press Enter to send, Shift + Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
};
