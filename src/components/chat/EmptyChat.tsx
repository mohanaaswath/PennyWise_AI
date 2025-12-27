import { Bot, Sparkles, Zap, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EmptyChat = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <h2 className="mb-6 text-sm font-medium tracking-widest text-primary">
        PENNYWISE AI
      </h2>
      
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-glow">
        <Bot className="h-10 w-10 text-primary" />
      </div>
      
      <h1 className="mb-2 text-2xl font-semibold text-foreground">
        How can I help you today?
      </h1>
      <p className="mb-8 text-center text-muted-foreground">
        Start a conversation or try one of these suggestions
      </p>

      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <Link to="/creative-writing">
          <SuggestionCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Creative Writing"
            description="Help me write a story or poem"
          />
        </Link>
        <Link to="/problem-solving">
          <SuggestionCard
            icon={<Zap className="h-5 w-5" />}
            title="Problem Solving"
            description="Explain a complex concept simply"
          />
        </Link>
        <Link to="/conversation">
          <SuggestionCard
            icon={<MessageSquare className="h-5 w-5" />}
            title="Conversation"
            description="Let's have a friendly chat"
          />
        </Link>
        <Link to="/code-help">
          <SuggestionCard
            icon={<Bot className="h-5 w-5" />}
            title="Code Help"
            description="Debug or explain some code"
          />
        </Link>
      </div>
    </div>
  );
};

interface SuggestionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const SuggestionCard = ({ icon, title, description }: SuggestionCardProps) => {
  return (
    <div className="group cursor-pointer rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-glow">
      <div className="mb-2 flex items-center gap-2 text-primary">
        {icon}
        <span className="font-medium">{title}</span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};
