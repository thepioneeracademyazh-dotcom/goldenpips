import { useState } from 'react';
import { Crown, Check, Loader2, ExternalLink, Clock, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const premiumFeatures = [
  'Unlimited access to all trading signals',
  'Real-time signal notifications',
  'Entry, Stop Loss, Take Profit details',
  'Signal history & performance stats',
  'Priority support',
];

export default function SubscriptionPage() {
  const { user, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);

  const isFirstTimeUser = user?.subscription?.is_first_time_user ?? true;
  const price = isFirstTimeUser ? 25 : 49;
  const isPremium = user?.isPremium;
  const expiresAt = user?.subscription?.expires_at;

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      return;
    }

    setLoading(true);
    
    try {
      // Call the edge function to create payment
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          userId: user.id,
          amount: price,
          currency: 'USDT',
        },
      });

      if (error) throw error;

      if (data?.paymentUrl) {
        // Redirect to NOWPayments checkout
        window.open(data.paymentUrl, '_blank');
        toast.success('Payment page opened. Complete your payment to activate premium.');
      } else {
        throw new Error('Failed to create payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout showLogo={false} headerTitle="Subscription" headerSubtitle="Unlock premium trading signals">
      <div className="p-4 space-y-6">

        {/* Current Status */}
        {user && (
          <Card className="card-trading border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isPremium ? 'bg-primary/20' : 'bg-muted'}`}>
                    <Crown className={`w-5 h-5 ${isPremium ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {isPremium ? 'Premium Member' : 'Free Plan'}
                    </p>
                    {isPremium && expiresAt && (
                      <p className="text-xs text-muted-foreground">
                        Expires {format(new Date(expiresAt), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={isPremium 
                    ? 'bg-primary/20 text-primary border-primary/30' 
                    : 'bg-muted text-muted-foreground'
                  }
                >
                  {isPremium ? 'Active' : 'Free'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Premium Plan Card */}
        <Card className="card-trading border-primary/30 relative overflow-hidden">
          {/* Glow effect */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
          
          <CardHeader className="text-center relative">
            <div className="mx-auto p-3 rounded-2xl gradient-gold w-fit mb-2 glow-gold">
              <Crown className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Premium</CardTitle>
            <CardDescription>Full access to all features</CardDescription>
            
            {/* Price */}
            <div className="pt-4">
              {isFirstTimeUser && (
                <Badge className="mb-2 bg-success/20 text-success border-success/30">
                  First-time discount!
                </Badge>
              )}
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-gradient-gold">${price}</span>
                <span className="text-muted-foreground">USDT</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {isFirstTimeUser ? (
                  <>
                    <span className="line-through text-muted-foreground/50">$49</span>
                    {' '}per month after first month
                  </>
                ) : (
                  'per month'
                )}
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4 relative">
            {/* Features */}
            <ul className="space-y-3">
              {premiumFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="p-1 rounded-full bg-primary/20">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Payment Info */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Secure payment via NOWPayments</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Instant activation after payment</span>
              </div>
            </div>

            {/* Subscribe Button */}
            {isPremium ? (
              <Button className="w-full" disabled>
                <Check className="w-4 h-4 mr-2" />
                Already Subscribed
              </Button>
            ) : (
              <Button 
                className="w-full gradient-gold text-primary-foreground font-semibold glow-gold-sm"
                onClick={handleSubscribe}
                disabled={loading || !user}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Subscribe Now
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}

            {!user && (
              <p className="text-center text-sm text-muted-foreground">
                Please sign in to subscribe
              </p>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Pay with USDT (BEP20) • 30-day subscription
            </p>
          </CardContent>
        </Card>

        {/* FAQ or Info */}
        <Card className="card-trading">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-2">How it works</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>1. Click "Subscribe Now" to open payment page</li>
              <li>2. Send {price} USDT (BEP20) to the provided address</li>
              <li>3. Your account is automatically upgraded once payment is confirmed</li>
              <li>4. Enjoy 30 days of premium access!</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
