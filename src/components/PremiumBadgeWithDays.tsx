import { differenceInHours, differenceInCalendarDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types';
import { Crown, Clock } from 'lucide-react';

interface PremiumBadgeWithDaysProps {
  user: User;
  compact?: boolean;
}

export function PremiumBadgeWithDays({ user, compact = false }: PremiumBadgeWithDaysProps) {
  const getTimeLeft = () => {
    if (!user.isPremium || !user.subscription?.expires_at) return null;
    const expiryDate = new Date(user.subscription.expires_at);
    const now = new Date();
    const calendarDays = differenceInCalendarDays(expiryDate, now);

    if (calendarDays > 0) {
      return { value: calendarDays, label: `${calendarDays}d`, isUrgent: calendarDays <= 3, isWarning: calendarDays <= 7 };
    }

    const hours = differenceInHours(expiryDate, now);
    if (hours > 0) {
      return { value: hours, label: `${hours}h`, isUrgent: true, isWarning: true };
    }

    return { value: 0, label: 'Today', isUrgent: true, isWarning: true };
  };

  const timeLeft = getTimeLeft();

  if (user.isPremium) {
    if (compact) {
      return (
        <Badge 
          variant="outline" 
          className="bg-primary/15 text-primary border-primary/25 font-bold text-[11px] px-2 py-0.5 gap-1 shrink-0"
        >
          <Crown className="w-3 h-3" />
          {timeLeft ? timeLeft.label : 'Pro'}
        </Badge>
      );
    }

    return (
      <div className="flex items-center gap-1.5">
        <Badge 
          variant="outline" 
          className="bg-primary/15 text-primary border-primary/25 font-bold text-xs px-2.5 py-0.5 gap-1"
        >
          <Crown className="w-3.5 h-3.5" />
          Premium
        </Badge>
        {timeLeft !== null && (
          <Badge 
            variant="outline" 
            className={`text-[11px] font-semibold px-2 py-0.5 gap-1 ${
              timeLeft.isUrgent
                ? 'bg-destructive/15 text-destructive border-destructive/25' 
                : timeLeft.isWarning 
                  ? 'bg-warning/15 text-warning border-warning/25'
                  : 'bg-muted/80 text-muted-foreground border-border'
            }`}
          >
            <Clock className="w-3 h-3" />
            {timeLeft.label}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className="bg-muted/80 text-muted-foreground border-border font-medium text-xs px-2.5 py-0.5"
    >
      Free
    </Badge>
  );
}
