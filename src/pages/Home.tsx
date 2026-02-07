import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Crown, ArrowRight, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { SignalCard } from '@/components/SignalCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { DailyQuote } from '@/components/DailyQuote';
import { SubscriptionExpiryAlert } from '@/components/SubscriptionExpiryAlert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Signal } from '@/types';
import { format } from 'date-fns';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [latestSignal, setLatestSignal] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ activeSignals: 0, successRate: 0 });

  useEffect(() => {
    fetchLatestSignal();
    fetchStats();

    // Subscribe to real-time signal changes
    const channel = supabase
      .channel('home-signals-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'signals',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // New signal becomes the latest
            setLatestSignal(payload.new as Signal);
            fetchStats();
          } else if (payload.eventType === 'UPDATE') {
            // Update if it's the current latest signal
            setLatestSignal(prev => 
              prev?.id === payload.new.id ? payload.new as Signal : prev
            );
            fetchStats();
          } else if (payload.eventType === 'DELETE') {
            // If deleted signal was the latest, refetch
            setLatestSignal(prev => {
              if (prev?.id === payload.old.id) {
                fetchLatestSignal();
                return null;
              }
              return prev;
            });
            fetchStats();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLatestSignal = async () => {
    try {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setLatestSignal(data as Signal);
    } catch (error) {
      console.error('Error fetching latest signal:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get active signals count
      const { count: activeCount } = await supabase
        .from('signals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get successful signals (TP1 or TP2 hit) from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: allSignals } = await supabase
        .from('signals')
        .select('status')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .neq('status', 'active');

      const successfulCount = allSignals?.filter(
        s => s.status === 'tp1_hit' || s.status === 'tp2_hit'
      ).length || 0;
      
      const totalClosed = allSignals?.length || 0;
      const successRate = totalClosed > 0 ? Math.round((successfulCount / totalClosed) * 100) : 85;

      setStats({
        activeSignals: activeCount || 0,
        successRate,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 space-y-6">
        {/* Welcome Card */}
        <Card className="card-trading p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative">
            <h1 className="text-xl font-bold text-foreground mb-1">
              {user ? `Welcome, ${user.profile?.full_name || user.email.split('@')[0]}!` : 'Welcome to Golden Pips'}
            </h1>
            <p className="text-muted-foreground text-sm mb-4">
              Premium Gold (XAUUSD) Trading Signals
            </p>
            
            {/* Stats */}
            <div className="flex gap-4">
              <div className="flex-1 bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary">{stats.activeSignals}</p>
                <p className="text-xs text-muted-foreground">Active Signals</p>
              </div>
              <div className="flex-1 bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-success">{stats.successRate}%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Daily Motivational Quote */}
        <DailyQuote />

        {/* Subscription Expiry Alert */}
        <SubscriptionExpiryAlert />
        
        {/* Premium Upsell (for non-premium users) */}
        {user && !user.isPremium && (
          <Card 
            className="card-trading p-4 border-primary/30 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate('/subscription')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl gradient-gold">
                <Crown className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Upgrade to Premium</h3>
                <p className="text-sm text-muted-foreground">
                  Unlock all signals • First month only $25
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        )}

        {/* Not signed in prompt */}
        {!user && (
          <Card 
            className="card-trading p-4 border-primary/30 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate('/auth')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl gradient-gold">
                <TrendingUp className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Get Started</h3>
                <p className="text-sm text-muted-foreground">
                  Create an account to access trading signals
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        )}

        {/* Latest Signal */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Latest Signal</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/signals')}
              className="text-primary hover:text-primary/80"
            >
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {loading ? (
            <div className="py-8">
              <LoadingSpinner />
            </div>
          ) : latestSignal ? (
            <SignalCard 
              signal={latestSignal} 
              isPremium={user?.isPremium || false}
              isLocked={!user?.isPremium}
            />
          ) : (
            <Card className="card-trading p-8 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No signals yet</p>
              <p className="text-sm text-muted-foreground">Check back soon!</p>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Card 
            className="card-trading p-4 cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate('/signals')}
          >
            <TrendingUp className="w-8 h-8 text-primary mb-2" />
            <h3 className="font-medium text-foreground">All Signals</h3>
            <p className="text-xs text-muted-foreground">View signal history</p>
          </Card>
          <Card 
            className="card-trading p-4 cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate('/subscription')}
          >
            <Crown className="w-8 h-8 text-primary mb-2" />
            <h3 className="font-medium text-foreground">Subscription</h3>
            <p className="text-xs text-muted-foreground">Manage your plan</p>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
