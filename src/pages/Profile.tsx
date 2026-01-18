import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Crown, LogOut, ChevronRight, Bell, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user, signOut, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.profile?.full_name || '');
  const [saving, setSaving] = useState(false);
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

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <AppLayout>
      <div className="p-4 space-y-6 safe-area-top">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground text-sm">Manage your account</p>
        </div>

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
