import { Plus, MessageSquare, Trash2, PanelLeftClose, PanelLeft, Settings, LogOut, User } from 'lucide-react';
import { Conversation } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

// Group conversations by time period
const groupConversations = (conversations: Conversation[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const groups: { [key: string]: Conversation[] } = {
    'Today': [],
    'Yesterday': [],
    '7 Days': [],
    '30 Days': [],
    'Older': []
  };

  conversations.forEach(conv => {
    const date = new Date(conv.updatedAt);
    if (date >= today) {
      groups['Today'].push(conv);
    } else if (date >= yesterday) {
      groups['Yesterday'].push(conv);
    } else if (date >= weekAgo) {
      groups['7 Days'].push(conv);
    } else if (date >= monthAgo) {
      groups['30 Days'].push(conv);
    } else {
      groups['Older'].push(conv);
    }
  });

  return groups;
};

export const ChatSidebar = ({
  conversations,
  activeConversationId,
  isOpen,
  onToggle,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ChatSidebarProps) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const groupedConversations = groupConversations(conversations);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to sign out. Please try again.'
      });
    } else {
      navigate('/auth');
    }
  };

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (profile?.display_name) {
      return profile.display_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  return (
    <>
      {/* Toggle button when sidebar is closed */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="fixed left-4 top-4 z-50 h-10 w-10 rounded-lg bg-secondary/80 backdrop-blur-sm hover:bg-secondary"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full w-72 flex-shrink-0 border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-sidebar-border p-4">
            <Button
              onClick={onNewConversation}
              className="flex-1 justify-start gap-2 bg-primary/10 text-primary hover:bg-primary/20"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="ml-2 h-10 w-10 text-muted-foreground hover:text-foreground"
            >
              <PanelLeftClose className="h-5 w-5" />
            </Button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
            {Object.entries(groupedConversations).map(([period, convs]) => {
              if (convs.length === 0) return null;
              
              return (
                <div key={period} className="mb-4">
                  <p className="mb-2 px-3 text-xs font-medium text-muted-foreground">
                    {period}
                  </p>
                  <div className="space-y-1">
                    {convs.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={cn(
                          'group relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                          activeConversationId === conversation.id
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                        )}
                        onClick={() => onSelectConversation(conversation.id)}
                      >
                        <MessageSquare className="h-4 w-4 flex-shrink-0" />
                        <p className="min-w-0 flex-1 truncate text-sm">
                          {conversation.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conversation.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* User Profile Footer */}
          <div className="border-t border-sidebar-border p-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-sidebar-foreground">
                        {getDisplayName()}
                      </p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => navigate('/auth')}
              >
                <User className="h-4 w-4" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
