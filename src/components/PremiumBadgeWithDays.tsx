import { differenceInDays, differenceInHours } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types';

interface PremiumBadgeWithDaysProps {
  user: User;
}

export function PremiumBadgeWithDays({ user }: PremiumBadgeWithDaysProps) {
  const getTimeLeft = () => {
    if (!user.isPremium || !user.subscription?.expires_at) return null;
    const expiryDate = new Date(user.subscription.expires_at);
    const days = differenceInDays(expiryDate, new Date());
    if (days >= 1) return { value: days, unit: 'd' };
    const hours = differenceInHours(expiryDate, new Date());
    return { value: Math.max(hours, 0), unit: 'h' };
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
              (timeLeft.unit === 'h' || (timeLeft.unit === 'd' && timeLeft.value <= 3))
                ? 'bg-destructive/20 text-destructive border-destructive/30' 
                : timeLeft.value <= 7 
                  ? 'bg-warning/20 text-warning border-warning/30'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {timeLeft.value}{timeLeft.unit} left
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
