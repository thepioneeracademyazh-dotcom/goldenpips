import { differenceInHours, startOfDay, differenceInCalendarDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types';

interface PremiumBadgeWithDaysProps {
  user: User;
}

export function PremiumBadgeWithDays({ user }: PremiumBadgeWithDaysProps) {
  const getTimeLeft = () => {
    if (!user.isPremium || !user.subscription?.expires_at) return null;
    const expiryDate = new Date(user.subscription.expires_at);
    const now = new Date();
    
    // Use calendar days (midnight-based) for clearer understanding
    const calendarDays = differenceInCalendarDays(expiryDate, now);
    
    if (calendarDays > 0) {
      return { value: calendarDays, unit: 'day', label: `${calendarDays} day${calendarDays !== 1 ? 's' : ''} left` };
    }
    
    // Last day: show remaining hours
    const hours = differenceInHours(expiryDate, now);
    if (hours > 0) {
      return { value: hours, unit: 'hour', label: `${hours}h left today` };
    }
    
    return { value: 0, unit: 'expired', label: 'Expires today' };
  };

  const timeLeft = getTimeLeft();

  if (user.isPremium) {
    return (
      <div className="flex items-center gap-1.5">
        <Badge 
          variant="outline" 
          className="bg-primary/20 text-primary border-primary/30 font-semibold"
        >
          👑 Premium
        </Badge>
        {timeLeft !== null && (
          <Badge 
            variant="outline" 
            className={`text-xs font-medium ${
              (timeLeft.unit === 'hour' || timeLeft.unit === 'expired' || (timeLeft.unit === 'day' && timeLeft.value <= 3))
                ? 'bg-destructive/20 text-destructive border-destructive/30' 
                : timeLeft.value <= 7 
                  ? 'bg-warning/20 text-warning border-warning/30'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {timeLeft.label}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className="bg-muted text-muted-foreground font-medium"
    >
      Free
    </Badge>
  );
}
