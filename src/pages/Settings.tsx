import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Settings as SettingsIcon, Bell, Palette, Shield, User, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [isSaving, setIsSaving] = useState(false);

  // Settings state
  const [appearance, setAppearance] = useState('system');
  const [accentColor, setAccentColor] = useState('default');
  const [language, setLanguage] = useState('auto');
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);

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

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">General</h2>
            
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Appearance</p>
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
                <p className="text-sm font-medium text-foreground">Accent color</p>
              </div>
              <Select value={accentColor} onValueChange={setAccentColor}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Language</p>
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
                <p className="text-xs text-muted-foreground">Receive push notifications</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </div>
        );

      case 'personalization':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Personalization</h2>
            
            <div className="py-3 border-b border-border">
              <p className="text-sm font-medium text-foreground mb-2">Display name</p>
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
              <p className="text-xs text-muted-foreground mb-3">Download all your conversation data</p>
              <Button variant="outline">Export data</Button>
            </div>

            <div className="py-3 border-b border-border">
              <p className="text-sm font-medium text-foreground">Clear conversations</p>
              <p className="text-xs text-muted-foreground mb-3">Delete all your conversation history</p>
              <Button variant="destructive">Clear all data</Button>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Security</h2>
            
            <div className="py-3 border-b border-border">
              <p className="text-sm font-medium text-foreground">Change password</p>
              <p className="text-xs text-muted-foreground mb-3">Update your account password</p>
              <Button variant="outline">Change password</Button>
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
              <p className="text-sm font-medium text-destructive">Delete account</p>
              <p className="text-xs text-muted-foreground mb-3">Permanently delete your account and all data</p>
              <Button variant="destructive">Delete account</Button>
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
