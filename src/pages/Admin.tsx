import { useState, useEffect } from 'react';
import { Plus, Users, TrendingUp, Bell, Edit, Trash2, Save, Loader2, Crown, User, Ban, CheckCircle, UserX, Quote } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SignalCard } from '@/components/SignalCard';
import { toast } from 'sonner';
import { Signal, SignalType, SignalStatus, Profile, Subscription, Notification, DailyQuote } from '@/types';
import { format } from 'date-fns';

interface UserWithSub {
  profile: Profile;
  subscription: Subscription | null;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('signals');
  const [signals, setSignals] = useState<Signal[]>([]);
  const [users, setUsers] = useState<UserWithSub[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [quotes, setQuotes] = useState<DailyQuote[]>([]);
  const [showSignalDialog, setShowSignalDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [editingSignal, setEditingSignal] = useState<Signal | null>(null);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingPush, setSendingPush] = useState(false);

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
    target_audience: 'premium',
  });

  // Quote form state
  const [quoteForm, setQuoteForm] = useState({
    quote: '',
    author: '',
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

      // Fetch notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (notificationsError) throw notificationsError;
      setNotifications(notificationsData as Notification[]);

      // Fetch quotes
      const { data: quotesData, error: quotesError } = await supabase
        .from('daily_quotes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (quotesError) throw quotesError;
      setQuotes(quotesData as DailyQuote[]);
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

  const handleSaveNotification = async () => {
    if (!notificationForm.title || !notificationForm.body) {
      toast.error('Please fill in title and message');
      return;
    }

    setSaving(true);
    try {
      if (editingNotification) {
        const { error } = await supabase
          .from('notifications')
          .update({
            title: notificationForm.title,
            body: notificationForm.body,
            target_audience: notificationForm.target_audience,
          })
          .eq('id', editingNotification.id);

        if (error) throw error;
        toast.success('Notification updated!');
      } else {
        const { error } = await supabase
          .from('notifications')
          .insert({
            title: notificationForm.title,
            body: notificationForm.body,
            target_audience: notificationForm.target_audience,
            sent_by: user!.id,
          });

        if (error) throw error;
        
        // Send push notification
        setSendingPush(true);
        try {
          const { data, error: pushError } = await supabase.functions.invoke('send-notification', {
            body: {
              title: notificationForm.title,
              body: notificationForm.body,
              targetAudience: notificationForm.target_audience,
            },
          });
          
          if (pushError) {
            console.error('Push notification error:', pushError);
            toast.warning('Notification saved but push failed to send');
          } else {
            toast.success(`Notification sent to ${data?.sent || 0} devices!`);
          }
        } catch (pushErr) {
          console.error('Push error:', pushErr);
          toast.warning('Notification saved but push delivery failed');
        } finally {
          setSendingPush(false);
        }
      }

      setShowNotificationDialog(false);
      resetNotificationForm();
      fetchData();
    } catch (error) {
      console.error('Error saving notification:', error);
      toast.error('Failed to save notification');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuote = async () => {
    if (!quoteForm.quote) {
      toast.error('Please enter a quote');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('daily_quotes')
        .insert({
          quote: quoteForm.quote,
          author: quoteForm.author || null,
          created_by: user!.id,
        });

      if (error) throw error;
      toast.success('Quote published for 24 hours!');
      setShowQuoteDialog(false);
      setQuoteForm({ quote: '', author: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving quote:', error);
      toast.error('Failed to save quote');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('daily_quotes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Quote deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast.error('Failed to delete quote');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Notification deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
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

  const handleBlockUser = async (userId: string, block: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_blocked: block,
          blocked_at: block ? new Date().toISOString() : null,
          blocked_reason: block ? 'Blocked by admin' : null,
        })
        .eq('user_id', userId);

      if (error) throw error;
      toast.success(block ? 'User blocked' : 'User unblocked');
      fetchData();
    } catch (error) {
      console.error('Error updating user block status:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Delete user's subscription first
      await supabase.from('subscriptions').delete().eq('user_id', userId);
      
      // Delete user's roles
      await supabase.from('user_roles').delete().eq('user_id', userId);
      
      // Delete user's profile
      const { error } = await supabase.from('profiles').delete().eq('user_id', userId);

      if (error) throw error;
      toast.success('User data deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
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

  const resetNotificationForm = () => {
    setNotificationForm({
      title: '',
      body: '',
      target_audience: 'premium',
    });
    setEditingNotification(null);
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

  const openEditNotification = (notification: Notification) => {
    setNotificationForm({
      title: notification.title,
      body: notification.body,
      target_audience: notification.target_audience,
    });
    setEditingNotification(notification);
    setShowNotificationDialog(true);
  };

  const premiumUsersCount = users.filter(u => 
    u.subscription?.status === 'premium' && 
    (!u.subscription.expires_at || new Date(u.subscription.expires_at) > new Date())
  ).length;

  const blockedUsersCount = users.filter(u => u.profile.is_blocked).length;

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
    <AppLayout showLogo={false} headerTitle="Admin Panel" headerSubtitle="Manage signals & users">
      {/* Sticky Header Section */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-xl border-b border-border px-4 pt-4 pb-3 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <Card className="card-trading p-3 text-center">
            <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{signals.length}</p>
            <p className="text-[10px] text-muted-foreground">Signals</p>
          </Card>
          <Card className="card-trading p-3 text-center">
            <Users className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{users.length}</p>
            <p className="text-[10px] text-muted-foreground">Users</p>
          </Card>
          <Card className="card-trading p-3 text-center">
            <Crown className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{premiumUsersCount}</p>
            <p className="text-[10px] text-muted-foreground">Premium</p>
          </Card>
          <Card className="card-trading p-3 text-center">
            <Ban className="w-4 h-4 text-destructive mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{blockedUsersCount}</p>
            <p className="text-[10px] text-muted-foreground">Blocked</p>
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

          <Dialog open={showNotificationDialog} onOpenChange={(open) => {
            setShowNotificationDialog(open);
            if (!open) resetNotificationForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 border-primary/30">
                <Bell className="w-4 h-4 mr-2" />
                Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>{editingNotification ? 'Edit Notification' : 'Send Notification'}</DialogTitle>
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
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select 
                    value={notificationForm.target_audience} 
                    onValueChange={(v) => setNotificationForm({ ...notificationForm, target_audience: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="premium">Premium Only</SelectItem>
                      <SelectItem value="free">Free Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full gradient-gold text-primary-foreground"
                  onClick={handleSaveNotification}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
                  {editingNotification ? 'Update Notification' : 'Send Notification'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quote Dialog */}
        <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full border-primary/30">
              <Quote className="w-4 h-4 mr-2" />
              Add Daily Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add Daily Quote</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Quote</Label>
                <Textarea
                  value={quoteForm.quote}
                  onChange={(e) => setQuoteForm({ ...quoteForm, quote: e.target.value })}
                  placeholder="Enter motivational quote..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Author (optional)</Label>
                <Input
                  value={quoteForm.author}
                  onChange={(e) => setQuoteForm({ ...quoteForm, author: e.target.value })}
                  placeholder="Author name"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This quote will be visible for 24 hours from now.
              </p>
              <Button 
                className="w-full gradient-gold text-primary-foreground"
                onClick={handleSaveQuote}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Quote className="w-4 h-4 mr-2" />}
                Publish Quote
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tabs in sticky header */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-muted/50">
            <TabsTrigger value="signals" className="flex-1">Signals</TabsTrigger>
            <TabsTrigger value="users" className="flex-1">Users</TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1">Alerts</TabsTrigger>
            <TabsTrigger value="quotes" className="flex-1">Quotes</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Scrollable Content */}
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="signals" className="mt-0 space-y-4">
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

          <TabsContent value="users" className="mt-0 space-y-3">
            {users.map(({ profile, subscription }) => {
              const isPremium = subscription?.status === 'premium' && 
                (!subscription.expires_at || new Date(subscription.expires_at) > new Date());
              const isBlocked = profile.is_blocked;

              return (
                <Card key={profile.id} className={`card-trading p-4 ${isBlocked ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isBlocked ? 'bg-destructive/20' : 
                        isPremium ? 'bg-primary/20' : 'bg-muted'
                      }`}>
                        {isBlocked ? (
                          <Ban className="w-4 h-4 text-destructive" />
                        ) : isPremium ? (
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
                        className={
                          isBlocked 
                            ? 'bg-destructive/20 text-destructive border-destructive/30'
                            : isPremium 
                              ? 'bg-primary/20 text-primary border-primary/30' 
                              : 'bg-muted text-muted-foreground'
                        }
                      >
                        {isBlocked ? 'Blocked' : isPremium ? 'Premium' : 'Free'}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 px-2">
                            Manage
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          {!isPremium && !isBlocked && (
                            <DropdownMenuItem 
                              onClick={() => handleManualUpgrade(profile.user_id)}
                              className="cursor-pointer"
                            >
                              <Crown className="w-4 h-4 mr-2 text-primary" />
                              Upgrade to Premium
                            </DropdownMenuItem>
                          )}
                          
                          {isBlocked ? (
                            <DropdownMenuItem 
                              onClick={() => handleBlockUser(profile.user_id, false)}
                              className="cursor-pointer"
                            >
                              <CheckCircle className="w-4 h-4 mr-2 text-success" />
                              Unblock User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleBlockUser(profile.user_id, true)}
                              className="cursor-pointer text-destructive"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Block User
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onSelect={() => {
                              if (confirm('This will delete the user\'s profile, subscription, and roles. This action cannot be undone. Continue?')) {
                                handleDeleteUser(profile.user_id);
                              }
                            }}
                            className="cursor-pointer text-destructive"
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="notifications" className="mt-0 space-y-3">
            {notifications.length === 0 ? (
              <Card className="card-trading p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No notifications yet</p>
              </Card>
            ) : (
              notifications.map(notification => (
                <Card key={notification.id} className="card-trading p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground text-sm truncate">
                          {notification.title}
                        </h4>
                        <Badge variant="outline" className="text-xs capitalize">
                          {notification.target_audience}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(notification.created_at), 'MMM dd, yyyy • HH:mm')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => openEditNotification(notification)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this notification.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="quotes" className="mt-0 space-y-3">
            {quotes.length === 0 ? (
              <Card className="card-trading p-8 text-center">
                <Quote className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No quotes yet</p>
              </Card>
            ) : (
              quotes.map(quote => {
                const isActive = new Date(quote.expires_at) > new Date();
                return (
                  <Card key={quote.id} className={`card-trading p-4 ${!isActive ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant="outline" 
                            className={isActive 
                              ? 'bg-success/20 text-success border-success/30' 
                              : 'bg-muted text-muted-foreground'
                            }
                          >
                            {isActive ? 'Active' : 'Expired'}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground italic">"{quote.quote}"</p>
                        {quote.author && (
                          <p className="text-xs text-primary mt-1">— {quote.author}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Expires: {format(new Date(quote.expires_at), 'MMM dd, yyyy • HH:mm')}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Quote</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this quote.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteQuote(quote.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}