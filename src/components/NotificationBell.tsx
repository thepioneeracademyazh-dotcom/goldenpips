import { useState, useEffect } from 'react';
import { Bell, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  body: string;
  created_at: string;
  target_audience: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const stored = localStorage.getItem(`read_notifications_${user.id}`);
      if (stored) setReadIds(new Set(JSON.parse(stored)));
      const hidden = localStorage.getItem(`hidden_notifications_${user.id}`);
      if (hidden) setHiddenIds(new Set(JSON.parse(hidden)));
    }
  }, [user]);

  useEffect(() => {
    const visible = notifications.filter(n => !hiddenIds.has(n.id));
    const unread = visible.filter(n => !readIds.has(n.id)).length;
    setUnreadCount(unread);
  }, [notifications, readIds, hiddenIds]);

  const fetchNotifications = async () => {
    try {
      const targetAudiences = ['all'];
      if (user?.isPremium) {
        targetAudiences.push('premium');
      } else {
        targetAudiences.push('free');
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .in('target_audience', targetAudiences)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = (id: string) => {
    const newReadIds = new Set(readIds);
    newReadIds.add(id);
    setReadIds(newReadIds);
    if (user) {
      localStorage.setItem(
        `read_notifications_${user.id}`,
        JSON.stringify(Array.from(newReadIds))
      );
    }
  };

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadIds(allIds);
    if (user) {
      localStorage.setItem(
        `read_notifications_${user.id}`,
        JSON.stringify(Array.from(allIds))
      );
    }
  };

  const hideNotification = (id: string) => {
    const newHidden = new Set(hiddenIds);
    newHidden.add(id);
    setHiddenIds(newHidden);
    if (user) {
      localStorage.setItem(
        `hidden_notifications_${user.id}`,
        JSON.stringify(Array.from(newHidden))
      );
    }
    setDeleteTarget(null);
  };

  const visibleNotifications = notifications.filter(n => !hiddenIds.has(n.id));

  if (!user) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5 text-foreground" />
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 bg-primary text-primary-foreground text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="w-full h-full max-w-none max-h-none m-0 p-0 gap-0 rounded-none flex flex-col bg-card border-none shadow-none data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom">
          <div className="p-4 pb-3 flex-shrink-0 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <DialogTitle className="text-foreground text-base font-bold">Notifications</DialogTitle>
                {unreadCount > 0 && (
                  <Badge className="h-5 min-w-[20px] px-1.5 bg-primary text-primary-foreground text-[10px] font-bold">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-primary text-xs h-7 px-2"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>
          
          <ScrollArea className="flex-1 overflow-auto">
            {visibleNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="p-3 rounded-full bg-muted mb-3">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground text-sm">No notifications yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll see alerts here when new signals arrive
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {visibleNotifications.map((notification) => {
                  const isUnread = !readIds.has(notification.id);
                  const isExpanded = expandedId === notification.id;
                  return (
                    <div
                      key={notification.id}
                      onClick={() => {
                        markAsRead(notification.id);
                        setExpandedId(isExpanded ? null : notification.id);
                      }}
                      className={`px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                        isUnread ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                          isUnread ? 'bg-primary' : 'bg-transparent'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-foreground text-sm">
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(notification.created_at), 'MMM dd')}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(notification.id);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
                            {notification.body}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="w-[calc(100%-2rem)] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove notification?</AlertDialogTitle>
            <AlertDialogDescription>
              This notification will be hidden from your list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && hideNotification(deleteTarget)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
