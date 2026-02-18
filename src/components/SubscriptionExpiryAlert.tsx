import { useEffect, useState } from 'react';
import { AlertTriangle, Crown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { differenceInDays, differenceInHours } from 'date-fns';

export function SubscriptionExpiryAlert() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [hoursLeft, setHoursLeft] = useState<number | null>(null);

  useEffect(() => {
    if (user?.isPremium && user?.subscription?.expires_at) {
      const expiryDate = new Date(user.subscription.expires_at);
      const days = differenceInDays(expiryDate, new Date());
      const hours = differenceInHours(expiryDate, new Date());
      setDaysLeft(days);
      setHoursLeft(hours);
    }
  }, [user]);

  // Don't show if not premium, no expiry info, dismissed, or more than 7 days left
  if (!user?.isPremium || daysLeft === null || dismissed || daysLeft > 7) {
    return null;
  }

  // Different urgency levels
  const isUrgent = daysLeft <= 3;

  return (
    <Alert 
      className={`relative border ${
        isUrgent 
          ? 'border-destructive/50 bg-destructive/10' 
          : 'border-warning/50 bg-warning/10'
      }`}
    >
      <AlertTriangle className={`h-4 w-4 ${isUrgent ? 'text-destructive' : 'text-warning'}`} />
      <AlertTitle className={isUrgent ? 'text-destructive' : 'text-warning'}>
        {daysLeft <= 0 && (hoursLeft ?? 0) <= 0
          ? 'Subscription Expired!' 
          : daysLeft < 1
            ? `Subscription expires in ${hoursLeft}h!`
            : daysLeft === 1 
              ? 'Subscription expires tomorrow!' 
              : `Subscription expires in ${daysLeft} days`}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm text-muted-foreground mb-3">
          {daysLeft <= 0 
            ? 'Renew now to continue accessing premium signals.'
            : 'Renew your subscription to maintain uninterrupted access to premium trading signals.'}
        </p>
        <Button 
          size="sm" 
          onClick={() => navigate('/subscription')}
          className={isUrgent 
            ? 'bg-destructive hover:bg-destructive/90' 
            : 'gradient-gold text-primary-foreground'
          }
        >
          <Crown className="w-4 h-4 mr-2" />
          Renew Now
        </Button>
      </AlertDescription>
      <button 
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/50 transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </Alert>
  );
}
