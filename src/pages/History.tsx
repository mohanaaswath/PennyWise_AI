import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Search, Calendar, Pin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ConversationWithPreview {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  preview?: string;
  messageCount?: number;
}

export default function History() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationWithPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    setIsLoading(true);
    
    // Load conversations with message count and preview
    const { data: convs, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load conversations.'
      });
      setIsLoading(false);
      return;
    }

    // Load previews for each conversation
    const convsWithPreviews = await Promise.all(
      (convs || []).map(async (conv) => {
        const { data: messages } = await supabase
          .from('messages')
          .select('content, role')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true })
          .limit(1);

        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id);

        return {
          ...conv,
          preview: messages?.[0]?.content?.slice(0, 100) || 'No messages',
          messageCount: count || 0
        };
      })
    );

    setConversations(convsWithPreviews);
    setIsLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete conversation.'
      });
    } else {
      setConversations(prev => prev.filter(c => c.id !== id));
      toast({
        title: 'Deleted',
        description: 'Conversation deleted.'
      });
    }
  };

  const handleSelect = (id: string) => {
    navigate(`/?conversation=${id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.preview?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter(c => c.is_pinned);
  const regularConversations = filteredConversations.filter(c => !c.is_pinned);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium tracking-widest gradient-text">
              PENNYWISE AI
            </h2>
            <span className="text-muted-foreground">/</span>
            <h1 className="font-display text-xl font-semibold text-foreground">Chat History</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-foreground">No conversations found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try a different search term' : 'Start a new chat to see it here'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pinned */}
            {pinnedConversations.length > 0 && (
              <div>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Pin className="h-4 w-4" />
                  Pinned
                </h2>
                <div className="space-y-2">
                  {pinnedConversations.map((conv) => (
                    <ConversationCard
                      key={conv.id}
                      conversation={conv}
                      onSelect={handleSelect}
                      onDelete={handleDelete}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Conversations */}
            {regularConversations.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                  All Conversations
                </h2>
                <div className="space-y-2">
                  {regularConversations.map((conv) => (
                    <ConversationCard
                      key={conv.id}
                      conversation={conv}
                      onSelect={handleSelect}
                      onDelete={handleDelete}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ConversationCard({
  conversation,
  onSelect,
  onDelete,
  formatDate
}: {
  conversation: ConversationWithPreview;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  formatDate: (date: string) => string;
}) {
  return (
    <div
      onClick={() => onSelect(conversation.id)}
      className={cn(
        'group cursor-pointer rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/50'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 flex-shrink-0 text-primary" />
            <h3 className="truncate font-medium text-foreground">
              {conversation.title}
            </h3>
            {conversation.is_pinned && (
              <Pin className="h-3 w-3 text-primary" />
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {conversation.preview}
          </p>
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(conversation.updated_at)}
            </span>
            <span>{conversation.messageCount} messages</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => onDelete(conversation.id, e)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
