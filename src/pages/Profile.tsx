import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Crown, LogOut, ChevronRight, Bell, Shield, Loader2, HelpCircle, FileText, Share2, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { InstallButton } from '@/components/InstallPWA';
export default function ProfilePage() {
  const { user, signOut, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.profile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('user_id', user.id);

      if (error) throw error;
      
      await refreshUserData();
      setIsEditing(false);
      toast.success('Profile updated!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      navigate('/auth');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'GoldenPips',
      text: 'Check out GoldenPips - Premium trading signals for forex traders!',
      url: window.location.origin
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('Failed to share');
      }
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      toast.success('Password changed successfully!');
      setShowPasswordDialog(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <AppLayout showLogo={false} headerTitle="Profile" headerSubtitle="Manage your account">
      <div className="p-4 space-y-6">

        {/* Profile Card */}
        <Card className="card-trading">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <User className="w-10 h-10 text-primary" />
              </div>
              
              {isEditing ? (
                <div className="w-full space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1 gradient-gold text-primary-foreground"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-foreground">
                    {user.profile?.full_name || 'Set your name'}
                  </h2>
                  <p className="text-muted-foreground text-sm">{user.email}</p>
                  
                  <Badge 
                    className={`mt-3 ${user.isPremium 
                      ? 'bg-primary/20 text-primary border-primary/30' 
                      : 'bg-muted text-muted-foreground'
                    }`}
                    variant="outline"
                  >
                    {user.isPremium ? '👑 Premium Member' : 'Free Plan'}
                  </Badge>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-3 text-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subscription Info */}
        {user.subscription && (
          <Card 
            className="card-trading cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate('/subscription')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${user.isPremium ? 'bg-primary/20' : 'bg-muted'}`}>
                    <Crown className={`w-5 h-5 ${user.isPremium ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Subscription</p>
                    <p className="text-xs text-muted-foreground">
                      {user.isPremium && user.subscription.expires_at
                        ? `Expires ${format(new Date(user.subscription.expires_at), 'MMM dd, yyyy')}`
                        : user.isPremium ? 'Active' : 'Upgrade to premium'
                      }
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings */}
        <Card className="card-trading">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-foreground">Settings</h3>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive signal alerts</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            {/* Change Password */}
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
              <DialogTrigger asChild>
                <div className="flex items-center justify-between py-2 cursor-pointer hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Change Password</p>
                      <p className="text-xs text-muted-foreground">Update your password</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button 
                    className="w-full gradient-gold text-primary-foreground"
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                  >
                    {changingPassword ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4 mr-2" />
                    )}
                    Change Password
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Links */}
        <Card className="card-trading">
          <CardContent className="p-4 space-y-1">
            <h3 className="font-semibold text-foreground mb-3">More</h3>
            
            <div 
              className="flex items-center justify-between py-3 cursor-pointer hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors"
              onClick={() => navigate('/help')}
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Help Center</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            
            <div 
              className="flex items-center justify-between py-3 cursor-pointer hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors"
              onClick={() => navigate('/privacy')}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Privacy Policy</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Share & Install App */}
        <Card className="card-trading">
          <CardContent className="p-4 space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Share App</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Share GoldenPips with friends and family
              </p>
              <Button onClick={handleShareApp} variant="outline" className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Share GoldenPips
              </Button>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Install App</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Install on your device for the best experience
              </p>
              <InstallButton />
            </div>
          </CardContent>
        </Card>

        {/* Admin Access */}
        {user.isAdmin && (
          <Card 
            className="card-trading border-primary/30 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate('/admin')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Admin Panel</p>
                    <p className="text-xs text-muted-foreground">Manage signals & users</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logout */}
        <Button 
          variant="outline" 
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4 mr-2" />
          )}
          Sign Out
        </Button>
      </div>
    </AppLayout>
  );
}
