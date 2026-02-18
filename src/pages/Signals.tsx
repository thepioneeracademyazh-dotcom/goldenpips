import { useEffect, useState } from 'react';
import { Filter, TrendingUp } from 'lucide-react';
import { subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { SignalCard } from '@/components/SignalCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Signal, SignalStatus } from '@/types';

export default function SignalsPage() {
  const { user } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'buy' | 'sell'>('all');

  useEffect(() => {
    fetchSignals();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('signals-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'signals',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSignals(prev => [payload.new as Signal, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setSignals(prev => 
              prev.map(s => s.id === payload.new.id ? payload.new as Signal : s)
            );
          } else if (payload.eventType === 'DELETE') {
            setSignals(prev => prev.filter(s => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSignals = async () => {
    try {
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSignals(data as Signal[]);
    } catch (error) {
      console.error('Error fetching signals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSignals = signals.filter(signal => {
    // Status filter
    if (filter === 'active' && signal.status !== 'active') return false;
    if (filter === 'closed' && signal.status === 'active') return false;
    
    // Type filter
    if (typeFilter !== 'all' && signal.signal_type !== typeFilter) return false;
    
    return true;
  });

  const activeCount = signals.filter(s => s.status === 'active').length;
  const closedCount = signals.filter(s => s.status !== 'active').length;

  return (
    <AppLayout showLogo={false} headerTitle="Signals" headerSubtitle="Last 30 days" showLiveBadge>
      {/* Sticky Filter Section */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-3 space-y-3">
        {/* Stats Badge */}
        <div className="flex justify-end">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            {signals.length} signals
          </Badge>
        </div>

        {/* Status Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="w-full bg-muted/50">
            <TabsTrigger value="all" className="flex-1">
              All ({signals.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1">
              Active ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="closed" className="flex-1">
              Closed ({closedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Type Filter */}
        <div className="flex gap-2">
          <Button
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('all')}
            className={typeFilter === 'all' ? 'gradient-gold text-primary-foreground' : ''}
          >
            All Types
          </Button>
          <Button
            variant={typeFilter === 'buy' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('buy')}
            className={typeFilter === 'buy' ? 'bg-buy hover:bg-buy/90 text-white' : 'border-buy/30 text-buy'}
          >
            Buy Only
          </Button>
          <Button
            variant={typeFilter === 'sell' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('sell')}
            className={typeFilter === 'sell' ? 'bg-sell hover:bg-sell/90 text-white' : 'border-sell/30 text-sell'}
          >
            Sell Only
          </Button>
        </div>
      </div>

      <div className="p-4">

        {/* Signals List */}
        {loading ? (
          <div className="py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredSignals.length === 0 ? (
          <Card className="card-trading p-8 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No signals found</p>
            <p className="text-sm text-muted-foreground">
              {filter !== 'all' || typeFilter !== 'all' 
                ? 'Try changing your filters'
                : 'Check back later for new signals'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4 pb-4">
            {filteredSignals.map(signal => (
              <SignalCard
                key={signal.id}
                signal={signal}
                isPremium={user?.isPremium || false}
                isLocked={!user?.isPremium}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
