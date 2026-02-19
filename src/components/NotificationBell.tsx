import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
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

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const stored = localStorage.getItem(`read_notifications_${user.id}`);
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)));
      }
    }
  }, [user]);

  useEffect(() => {
    const unread = notifications.filter(n => !readIds.has(n.id)).length;
    setUnreadCount(unread);
  }, [notifications, readIds]);

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

  if (!user) return null;

  return (
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
      <DialogContent className="w-[calc(100%-2rem)] max-w-md p-0 gap-0 rounded-xl max-h-[70vh] flex flex-col bg-card border-border shadow-xl">
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
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
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
              {notifications.map((notification) => {
                const isUnread = !readIds.has(notification.id);
                return (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
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
                          <h4 className="font-bold text-foreground text-sm truncate">
                            {notification.title}
                          </h4>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {format(new Date(notification.created_at), 'MMM dd')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
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
  );
}
