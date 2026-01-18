import { useState, useEffect } from 'react';
import { Plus, Users, TrendingUp, Bell, Edit, Trash2, Save, X, Loader2, Crown, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SignalCard } from '@/components/SignalCard';
import { toast } from 'sonner';
import { Signal, SignalType, SignalStatus, Profile, Subscription } from '@/types';
import { format } from 'date-fns';

interface UserWithSub {
  profile: Profile;
  subscription: Subscription | null;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [users, setUsers] = useState<UserWithSub[]>([]);
  const [showSignalDialog, setShowSignalDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [editingSignal, setEditingSignal] = useState<Signal | null>(null);
  const [saving, setSaving] = useState(false);

  // Signal form state
  const [signalForm, setSignalForm] = useState({
    signal_type: 'buy' as SignalType,
    entry_price: '',
    stop_loss: '',
    take_profit_1: '',
    take_profit_2: '',
    notes: '',
  });

  // Notification form state
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    body: '',
  });

  useEffect(() => {
    if (user?.isAdmin) {
      fetchData();
    }
  }, [user?.isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch signals
      const { data: signalsData, error: signalsError } = await supabase
        .from('signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (signalsError) throw signalsError;
      setSignals(signalsData as Signal[]);

      // Fetch users with subscriptions
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch subscriptions
      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select('*');

      if (subsError) throw subsError;

      // Combine profiles with subscriptions
      const usersWithSubs = (profilesData as Profile[]).map(profile => ({
        profile,
        subscription: (subsData as Subscription[]).find(s => s.user_id === profile.user_id) || null,
      }));

      setUsers(usersWithSubs);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSignal = async () => {
    if (!user) return;

    const { signal_type, entry_price, stop_loss, take_profit_1, take_profit_2, notes } = signalForm;

    if (!entry_price || !stop_loss || !take_profit_1 || !take_profit_2) {
      toast.error('Please fill in all price fields');
      return;
    }

    setSaving(true);
    try {
      const signalData = {
        signal_type,
        entry_price: parseFloat(entry_price),
        stop_loss: parseFloat(stop_loss),
        take_profit_1: parseFloat(take_profit_1),
        take_profit_2: parseFloat(take_profit_2),
        notes: notes || null,
        created_by: user.id,
      };

      if (editingSignal) {
        const { error } = await supabase
          .from('signals')
          .update(signalData)
          .eq('id', editingSignal.id);

        if (error) throw error;
        toast.success('Signal updated!');
      } else {
        const { error } = await supabase
          .from('signals')
          .insert(signalData);

        if (error) throw error;
        toast.success('Signal created!');
      }

      setShowSignalDialog(false);
      resetSignalForm();
      fetchData();
    } catch (error) {
      console.error('Error saving signal:', error);
      toast.error('Failed to save signal');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSignal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this signal?')) return;

    try {
      const { error } = await supabase
        .from('signals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Signal deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting signal:', error);
      toast.error('Failed to delete signal');
    }
  };

  const handleUpdateSignalStatus = async (id: string, status: SignalStatus) => {
    try {
      const { error } = await supabase
        .from('signals')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast.success('Status updated');
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleSendNotification = async () => {
    if (!notificationForm.title || !notificationForm.body) {
      toast.error('Please fill in title and message');
      return;
    }

    setSaving(true);
    try {
      // Save notification record
      const { error } = await supabase
        .from('notifications')
        .insert({
          title: notificationForm.title,
          body: notificationForm.body,
          target_audience: 'premium',
          sent_by: user!.id,
        });

      if (error) throw error;

      // TODO: Trigger actual FCM push notification via edge function
      toast.success('Notification sent to premium users!');
      setShowNotificationDialog(false);
      setNotificationForm({ title: '', body: '' });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setSaving(false);
    }
  };

  const handleManualUpgrade = async (userId: string) => {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'premium',
          is_first_time_user: false,
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
      toast.success('User upgraded to premium!');
      fetchData();
    } catch (error) {
      console.error('Error upgrading user:', error);
      toast.error('Failed to upgrade user');
    }
  };

  const resetSignalForm = () => {
    setSignalForm({
      signal_type: 'buy',
      entry_price: '',
      stop_loss: '',
      take_profit_1: '',
      take_profit_2: '',
      notes: '',
    });
    setEditingSignal(null);
  };

  const openEditSignal = (signal: Signal) => {
    setSignalForm({
      signal_type: signal.signal_type,
      entry_price: signal.entry_price.toString(),
      stop_loss: signal.stop_loss.toString(),
      take_profit_1: signal.take_profit_1.toString(),
      take_profit_2: signal.take_profit_2.toString(),
      notes: signal.notes || '',
    });
    setEditingSignal(signal);
    setShowSignalDialog(true);
  };

  const premiumUsersCount = users.filter(u => 
    u.subscription?.status === 'premium' && 
    (!u.subscription.expires_at || new Date(u.subscription.expires_at) > new Date())
  ).length;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 space-y-6 safe-area-top">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">Manage signals & users</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="card-trading p-3 text-center">
            <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{signals.length}</p>
            <p className="text-xs text-muted-foreground">Signals</p>
          </Card>
          <Card className="card-trading p-3 text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{users.length}</p>
            <p className="text-xs text-muted-foreground">Users</p>
          </Card>
          <Card className="card-trading p-3 text-center">
            <Crown className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{premiumUsersCount}</p>
            <p className="text-xs text-muted-foreground">Premium</p>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Dialog open={showSignalDialog} onOpenChange={(open) => {
            setShowSignalDialog(open);
            if (!open) resetSignalForm();
          }}>
            <DialogTrigger asChild>
              <Button className="flex-1 gradient-gold text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                New Signal
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>{editingSignal ? 'Edit Signal' : 'Create New Signal'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Signal Type</Label>
                  <Select 
                    value={signalForm.signal_type} 
                    onValueChange={(v) => setSignalForm({ ...signalForm, signal_type: v as SignalType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Entry Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={signalForm.entry_price}
                      onChange={(e) => setSignalForm({ ...signalForm, entry_price: e.target.value })}
                      placeholder="2650.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stop Loss</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={signalForm.stop_loss}
                      onChange={(e) => setSignalForm({ ...signalForm, stop_loss: e.target.value })}
                      placeholder="2640.00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Take Profit 1</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={signalForm.take_profit_1}
                      onChange={(e) => setSignalForm({ ...signalForm, take_profit_1: e.target.value })}
                      placeholder="2660.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Take Profit 2</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={signalForm.take_profit_2}
                      onChange={(e) => setSignalForm({ ...signalForm, take_profit_2: e.target.value })}
                      placeholder="2670.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={signalForm.notes}
                    onChange={(e) => setSignalForm({ ...signalForm, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>
                <Button 
                  className="w-full gradient-gold text-primary-foreground"
                  onClick={handleSaveSignal}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {editingSignal ? 'Update Signal' : 'Create Signal'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 border-primary/30">
                <Bell className="w-4 h-4 mr-2" />
                Send Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Send Push Notification</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                    placeholder="New Signal Alert!"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={notificationForm.body}
                    onChange={(e) => setNotificationForm({ ...notificationForm, body: e.target.value })}
                    placeholder="A new XAUUSD signal is available..."
                    rows={3}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This will be sent to all {premiumUsersCount} premium users
                </p>
                <Button 
                  className="w-full gradient-gold text-primary-foreground"
                  onClick={handleSendNotification}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
                  Send to Premium Users
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="signals">
          <TabsList className="w-full bg-muted/50">
            <TabsTrigger value="signals" className="flex-1">Signals</TabsTrigger>
            <TabsTrigger value="users" className="flex-1">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="signals" className="mt-4 space-y-4">
            {signals.length === 0 ? (
              <Card className="card-trading p-8 text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No signals yet</p>
              </Card>
            ) : (
              signals.map(signal => (
                <div key={signal.id} className="relative">
                  <SignalCard signal={signal} isPremium={true} />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Select 
                      value={signal.status} 
                      onValueChange={(v) => handleUpdateSignalStatus(signal.id, v as SignalStatus)}
                    >
                      <SelectTrigger className="h-8 w-24 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="tp1_hit">TP1 Hit</SelectItem>
                        <SelectItem value="tp2_hit">TP2 Hit</SelectItem>
                        <SelectItem value="sl_hit">SL Hit</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => openEditSignal(signal)}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteSignal(signal.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-4 space-y-3">
            {users.map(({ profile, subscription }) => {
              const isPremium = subscription?.status === 'premium' && 
                (!subscription.expires_at || new Date(subscription.expires_at) > new Date());

              return (
                <Card key={profile.id} className="card-trading p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isPremium ? 'bg-primary/20' : 'bg-muted'}`}>
                        {isPremium ? (
                          <Crown className="w-4 h-4 text-primary" />
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {profile.full_name || profile.email}
                        </p>
                        <p className="text-xs text-muted-foreground">{profile.email}</p>
                        {subscription?.expires_at && (
                          <p className="text-xs text-muted-foreground">
                            Expires: {format(new Date(subscription.expires_at), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={isPremium 
                          ? 'bg-primary/20 text-primary border-primary/30' 
                          : 'bg-muted text-muted-foreground'
                        }
                      >
                        {isPremium ? 'Premium' : 'Free'}
                      </Badge>
                      {!isPremium && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-xs border-primary/30 text-primary"
                          onClick={() => handleManualUpgrade(profile.user_id)}
                        >
                          Upgrade
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
