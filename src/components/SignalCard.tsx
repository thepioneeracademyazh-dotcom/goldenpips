import { Lock, TrendingUp, TrendingDown, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Signal } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SignalCardProps {
  signal: Signal;
  isPremium: boolean;
  isLocked?: boolean;
}

export function SignalCard({ signal, isPremium, isLocked = false }: SignalCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const isBuy = signal.signal_type === 'buy';
  const statusColors: Record<string, string> = {
    active: 'bg-primary/20 text-primary border-primary/30',
    tp1_hit: 'bg-success/20 text-success border-success/30',
    tp2_hit: 'bg-success/20 text-success border-success/30',
    sl_hit: 'bg-destructive/20 text-destructive border-destructive/30',
    closed: 'bg-muted text-muted-foreground border-muted',
  };

  const copyToClipboard = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast.success(`${field} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const PriceRow = ({ label, value, field }: { label: string; value: number; field: string }) => (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono font-semibold text-foreground">
          {isLocked ? '••••••' : value.toFixed(2)}
        </span>
        {!isLocked && (
          <button
            onClick={() => copyToClipboard(value.toFixed(2), field)}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            {copiedField === field ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Card className={cn(
      'card-trading p-4 relative overflow-hidden transition-all duration-300',
      isLocked && 'select-none'
    )}>
      {/* Top gradient accent */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1',
        isBuy ? 'bg-buy' : 'bg-sell'
      )} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            isBuy ? 'bg-buy/20' : 'bg-sell/20'
          )}>
            {isBuy ? (
              <TrendingUp className="w-5 h-5 text-buy" />
            ) : (
              <TrendingDown className="w-5 h-5 text-sell" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn(
                'font-bold text-lg',
                isBuy ? 'text-buy' : 'text-sell'
              )}>
                {signal.signal_type.toUpperCase()}
              </span>
              <span className="text-muted-foreground text-sm">XAUUSD</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {format(new Date(signal.created_at), 'MMM dd, yyyy • HH:mm')}
            </span>
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={cn('capitalize', statusColors[signal.status])}
        >
          {signal.status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Price Details */}
      {isLocked ? (
        <div className="relative">
          <div className="blur-sm opacity-50">
            <PriceRow label="Entry Price" value={0} field="entry" />
            <PriceRow label="Stop Loss" value={0} field="sl" />
            <PriceRow label="Take Profit 1" value={0} field="tp1" />
            <PriceRow label="Take Profit 2" value={0} field="tp2" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm rounded-lg">
            <Lock className="w-8 h-8 text-primary mb-2" />
            <p className="text-sm font-medium text-foreground">Premium Content</p>
            <p className="text-xs text-muted-foreground">Upgrade to unlock</p>
          </div>
        </div>
      ) : (
        <div>
          <PriceRow label="Entry Price" value={signal.entry_price} field="entry" />
          <PriceRow label="Stop Loss" value={signal.stop_loss} field="sl" />
          <PriceRow label="Take Profit 1" value={signal.take_profit_1} field="tp1" />
          <PriceRow label="Take Profit 2" value={signal.take_profit_2} field="tp2" />
        </div>
      )}

      {/* Notes */}
      {!isLocked && signal.notes && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground">{signal.notes}</p>
        </div>
      )}
    </Card>
  );
}
