import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Conversation = () => {
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
      
      <main className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
        
        <h1 className="mb-4 text-3xl font-bold text-foreground">Conversation</h1>
        <p className="mb-8 max-w-md text-center text-muted-foreground">
          Let's have a friendly chat! I'm here to listen, discuss ideas, or just keep you company.
        </p>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-medium text-foreground">Casual Chat</h3>
            <p className="text-sm text-muted-foreground">Talk about anything</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-medium text-foreground">Discuss Ideas</h3>
            <p className="text-sm text-muted-foreground">Explore thoughts together</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-medium text-foreground">Get Advice</h3>
            <p className="text-sm text-muted-foreground">Thoughtful suggestions</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-medium text-foreground">Learn Together</h3>
            <p className="text-sm text-muted-foreground">Discuss new topics</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Conversation;
