import { ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CreativeWriting = () => {
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
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        
        <h1 className="mb-4 text-3xl font-bold text-foreground">Creative Writing</h1>
        <p className="mb-8 max-w-md text-center text-muted-foreground">
          Let me help you craft stories, poems, scripts, and more. Share your ideas and I'll bring them to life with words.
        </p>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-medium text-foreground">Story Ideas</h3>
            <p className="text-sm text-muted-foreground">Generate unique plot ideas</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-medium text-foreground">Poetry</h3>
            <p className="text-sm text-muted-foreground">Create poems in any style</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-medium text-foreground">Character Development</h3>
            <p className="text-sm text-muted-foreground">Build compelling characters</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-medium text-foreground">Dialogue Writing</h3>
            <p className="text-sm text-muted-foreground">Craft natural conversations</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreativeWriting;
