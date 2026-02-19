import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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
      // Load read notifications from localStorage
      const stored = localStorage.getItem(`read_notifications_${user.id}`);
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)));
      }
    }
  }, [user]);

  useEffect(() => {
    // Calculate unread count
    const unread = notifications.filter(n => !readIds.has(n.id)).length;
    setUnreadCount(unread);
  }, [notifications, readIds]);

  const fetchNotifications = async () => {
    try {
      // Get notifications based on user's premium status
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
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
      </SheetTrigger>
      <SheetContent className="w-[340px] sm:w-[380px] bg-card border-border" style={{ height: 'auto', maxHeight: '70vh', top: '60px', bottom: 'auto', borderRadius: '0.75rem' }}>
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-foreground">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-primary text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No notifications yet</p>
              <p className="text-sm text-muted-foreground">
                You'll see alerts here when new signals arrive
              </p>
            </div>
          ) : (
            <div className="space-y-3 pr-4">
              {notifications.map((notification) => {
                const isUnread = !readIds.has(notification.id);
                return (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      isUnread 
                        ? 'bg-primary/5 border-primary/20' 
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                        isUnread ? 'bg-primary' : 'bg-transparent'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(notification.created_at), 'MMM dd, h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
