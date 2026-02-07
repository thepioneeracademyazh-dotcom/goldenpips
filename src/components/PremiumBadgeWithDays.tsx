import { differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types';

interface PremiumBadgeWithDaysProps {
  user: User;
}

export function PremiumBadgeWithDays({ user }: PremiumBadgeWithDaysProps) {
  const getDaysLeft = () => {
    if (!user.isPremium || !user.subscription?.expires_at) return null;
    const expiryDate = new Date(user.subscription.expires_at);
    const days = differenceInDays(expiryDate, new Date());
    return days > 0 ? days : 0;
  };

  const daysLeft = getDaysLeft();

  if (user.isPremium) {
    return (
      <div className="flex items-center gap-1.5">
        <Badge 
          variant="outline" 
          className="bg-primary/20 text-primary border-primary/30 font-semibold"
        >
          👑 Premium
        </Badge>
        {daysLeft !== null && (
          <Badge 
            variant="outline" 
            className={`text-xs font-medium ${
              daysLeft <= 3 
                ? 'bg-destructive/20 text-destructive border-destructive/30' 
                : daysLeft <= 7 
                  ? 'bg-warning/20 text-warning border-warning/30'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {daysLeft}d left
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
