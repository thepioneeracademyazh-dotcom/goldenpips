import { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { DailyQuote as DailyQuoteType } from '@/types';

export function DailyQuote() {
  const [quote, setQuote] = useState<DailyQuoteType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuote();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('daily-quote-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_quotes',
        },
        () => {
          fetchQuote();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchQuote = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_quotes')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setQuote(data as DailyQuoteType | null);
    } catch (error) {
      console.error('Error fetching quote:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !quote) return null;

  return (
    <Card className="card-trading p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex gap-3">
        <div className="p-2 rounded-lg bg-primary/20 h-fit">
          <Quote className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground italic leading-relaxed">
            "{quote.quote}"
          </p>
          {quote.author && (
            <p className="text-xs text-primary mt-2 font-medium">
              — {quote.author}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
