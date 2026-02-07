import { useEffect, useState } from 'react';
import { Receipt, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PaymentHistory } from '@/types';
import { format } from 'date-fns';

export default function PaymentHistoryPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data as PaymentHistory[]);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'finished':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'failed':
      case 'expired':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'finished':
        return <Badge className="bg-success/20 text-success border-success/30">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-muted-foreground">Expired</Badge>;
      case 'pending':
        return <Badge className="bg-warning/20 text-warning border-warning/30">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AppLayout showLogo={false} headerTitle="Payment History" headerSubtitle="Your transaction records">
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="py-12">
            <LoadingSpinner />
          </div>
        ) : payments.length === 0 ? (
          <Card className="card-trading">
            <CardContent className="p-8 text-center">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">No Payments Yet</h3>
              <p className="text-sm text-muted-foreground">
                Your payment history will appear here after you make a purchase.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <Card key={payment.id} className="card-trading">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getStatusIcon(payment.status)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          ${payment.amount} {payment.currency}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(payment.created_at), 'MMM dd, yyyy • HH:mm')}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(payment.status)}
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network</span>
                      <span className="text-foreground">{payment.network}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gateway</span>
                      <span className="text-foreground capitalize">{payment.payment_gateway}</span>
                    </div>
                    {payment.payment_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment ID</span>
                        <span className="text-foreground font-mono text-xs">
                          {payment.payment_id.slice(0, 12)}...
                        </span>
                      </div>
                    )}
                    {payment.tx_hash && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Transaction</span>
                        <a 
                          href={`https://bscscan.com/tx/${payment.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary flex items-center gap-1 text-xs"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
