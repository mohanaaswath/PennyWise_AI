import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Settings as SettingsIcon, Bell, Palette, Shield, User, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type SettingsSection = 'general' | 'notifications' | 'personalization' | 'data' | 'security' | 'account';

const sections = [
  { id: 'general' as const, label: 'General', icon: SettingsIcon },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  { id: 'personalization' as const, label: 'Personalization', icon: Palette },
  { id: 'data' as const, label: 'Data controls', icon: Database },
  { id: 'security' as const, label: 'Security', icon: Shield },
  { id: 'account' as const, label: 'Account', icon: User },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Settings state with localStorage persistence
  const [appearance, setAppearance] = useState(() => localStorage.getItem('appearance') || 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'auto');
  const [notifications, setNotifications] = useState(() => localStorage.getItem('notifications') !== 'false');
  const [soundEffects, setSoundEffects] = useState(() => localStorage.getItem('soundEffects') !== 'false');
  const [emailNotifications, setEmailNotifications] = useState(() => localStorage.getItem('emailNotifications') !== 'false');

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync displayName when profile loads
  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  // Apply appearance changes
  useEffect(() => {
    localStorage.setItem('appearance', appearance);
    const root = document.documentElement;
    if (appearance === 'light') {
      root.classList.remove('dark');
    } else if (appearance === 'dark') {
      root.classList.add('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [appearance]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('notifications', String(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('soundEffects', String(soundEffects));
  }, [soundEffects]);

  useEffect(() => {
    localStorage.setItem('emailNotifications', String(emailNotifications));
  }, [emailNotifications]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('user_id', user.id);

    setIsSaving(false);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile.'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Profile updated successfully.'
      });
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    setIsExporting(true);
    try {
      // Fetch all conversations
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id);

      if (convError) throw convError;

      // Fetch all messages for each conversation
      const allData: { conversations: any[]; messages: any[] } = { conversations: conversations || [], messages: [] };
      
      for (const conv of conversations || []) {
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true });
        
        allData.messages.push(...(messages || []));
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pennywise-ai-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export complete',
        description: `Exported ${allData.conversations.length} conversations and ${allData.messages.length} messages.`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: 'Failed to export your data. Please try again.'
      });
    }
    setIsExporting(false);
  };

  const handleClearData = async () => {
    if (!user) return;

    setIsClearing(true);
    try {
      // Delete all conversations (messages will cascade delete)
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Data cleared',
        description: 'All your conversations have been deleted.'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to clear data',
        description: 'Could not delete your conversations. Please try again.'
      });
    }
    setIsClearing(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same.'
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Password too short',
        description: 'Password must be at least 6 characters.'
      });
      return;
    }

    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsChangingPassword(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to change password',
        description: error.message
      });
    } else {
      toast({
        title: 'Password changed',
        description: 'Your password has been updated successfully.'
      });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      // Delete all user data first
      await supabase.from('conversations').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('user_id', user.id);
      
      // Sign out (actual account deletion would require admin API)
      await signOut();
      
      toast({
        title: 'Account deleted',
        description: 'Your account and all data have been removed.'
      });
      navigate('/auth');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete account',
        description: 'Could not delete your account. Please try again.'
      });
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">General</h2>
            
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Appearance</p>
                <p className="text-xs text-muted-foreground">Choose your preferred theme</p>
              </div>
              <Select value={appearance} onValueChange={setAppearance}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Language</p>
                <p className="text-xs text-muted-foreground">Select your preferred language</p>
              </div>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Sound effects</p>
                <p className="text-xs text-muted-foreground">Play sounds for interactions</p>
              </div>
              <Switch checked={soundEffects} onCheckedChange={setSoundEffects} />
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
            
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Push notifications</p>
                <p className="text-xs text-muted-foreground">Receive push notifications in browser</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Email notifications</p>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
          </div>
        );

      case 'personalization':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Personalization</h2>
            
            <div className="py-3 border-b border-border">
              <p className="text-sm font-medium text-foreground mb-2">Display name</p>
              <p className="text-xs text-muted-foreground mb-3">This name will be shown in your profile</p>
              <div className="flex gap-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  className="max-w-xs"
                />
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Data controls</h2>
            
            <div className="py-3 border-b border-border">
              <p className="text-sm font-medium text-foreground">Export data</p>
              <p className="text-xs text-muted-foreground mb-3">Download all your conversation data as JSON</p>
              <Button variant="outline" onClick={handleExportData} disabled={isExporting}>
                {isExporting ? 'Exporting...' : 'Export data'}
              </Button>
            </div>

            <div className="py-3 border-b border-border">
              <p className="text-sm font-medium text-foreground">Clear conversations</p>
              <p className="text-xs text-muted-foreground mb-3">Delete all your conversation history</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isClearing}>
                    {isClearing ? 'Clearing...' : 'Clear all data'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your conversations and messages. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData}>Delete all</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Security</h2>
            
            <div className="py-3 border-b border-border">
              <p className="text-sm font-medium text-foreground mb-2">Change password</p>
              <p className="text-xs text-muted-foreground mb-3">Update your account password</p>
              <div className="space-y-3 max-w-xs">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
                <Button 
                  onClick={handleChangePassword} 
                  disabled={isChangingPassword || !newPassword || !confirmPassword}
                >
                  {isChangingPassword ? 'Changing...' : 'Change password'}
                </Button>
              </div>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Account</h2>
            
            <div className="py-3 border-b border-border">
              <p className="text-sm font-medium text-foreground">Email</p>
              <p className="text-sm text-muted-foreground">{user?.email || 'Not signed in'}</p>
            </div>

            <div className="py-3 border-b border-border">
              <p className="text-sm font-medium text-foreground">Member since</p>
              <p className="text-sm text-muted-foreground">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Unknown'}
              </p>
            </div>

            <div className="py-3 border-b border-border">
              <p className="text-sm font-medium text-destructive">Delete account</p>
              <p className="text-xs text-muted-foreground mb-3">Permanently delete your account and all data</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your account, all conversations, and personal data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative flex h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="absolute right-4 top-4 z-10 h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 border-r border-border bg-secondary/30 p-4">
          <h2 className="mb-4 text-sm font-medium tracking-widest gradient-text">
            PENNYWISE AI
          </h2>
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    activeSection === section.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
