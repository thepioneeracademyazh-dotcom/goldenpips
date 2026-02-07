import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Users, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface PaymentRecord {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  payment_gateway: string;
}

interface RevenueData {
  totalRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  last30DaysRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  recentPayments: PaymentRecord[];
  averageOrderValue: number;
  monthOverMonthGrowth: number;
}

export function RevenueStats() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RevenueData | null>(null);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      // Fetch all payments
      const { data: payments, error } = await supabase
        .from('payment_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      const allPayments = (payments || []) as PaymentRecord[];
      
      // Filter successful payments (confirmed/finished)
      const successfulPayments = allPayments.filter(
        p => p.status === 'confirmed' || p.status === 'finished'
      );
      
      const pendingPayments = allPayments.filter(p => p.status === 'pending');
      const failedPayments = allPayments.filter(
        p => p.status === 'failed' || p.status === 'expired'
      );

      // Calculate revenues
      const totalRevenue = successfulPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      
      const thisMonthPayments = successfulPayments.filter(p => {
        const date = new Date(p.created_at);
        return date >= thisMonthStart && date <= thisMonthEnd;
      });
      const thisMonthRevenue = thisMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      const lastMonthPayments = successfulPayments.filter(p => {
        const date = new Date(p.created_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      });
      const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      const last30DaysPayments = successfulPayments.filter(
        p => new Date(p.created_at) >= thirtyDaysAgo
      );
      const last30DaysRevenue = last30DaysPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      // Calculate growth
      const monthOverMonthGrowth = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : thisMonthRevenue > 0 ? 100 : 0;

      // Average order value
      const averageOrderValue = successfulPayments.length > 0 
        ? totalRevenue / successfulPayments.length 
        : 0;

      setData({
        totalRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
        last30DaysRevenue,
        totalTransactions: allPayments.length,
        successfulTransactions: successfulPayments.length,
        pendingTransactions: pendingPayments.length,
        failedTransactions: failedPayments.length,
        recentPayments: allPayments.slice(0, 10),
        averageOrderValue,
        monthOverMonthGrowth,
      });
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="card-trading p-8 text-center">
        <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Unable to load revenue data</p>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'finished':
        return <Badge className="bg-success/20 text-success border-success/30 text-xs">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-muted-foreground text-xs">Expired</Badge>;
      case 'pending':
        return <Badge className="bg-warning/20 text-warning border-warning/30 text-xs">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="card-trading">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-foreground">${data.totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.successfulTransactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="card-trading">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-success/20">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <span className="text-xs text-muted-foreground">This Month</span>
            </div>
            <p className="text-2xl font-bold text-foreground">${data.thisMonthRevenue.toFixed(2)}</p>
            <div className="flex items-center gap-1 mt-1">
              {data.monthOverMonthGrowth >= 0 ? (
                <ArrowUpRight className="w-3 h-3 text-success" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-destructive" />
              )}
              <span className={`text-xs ${data.monthOverMonthGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                {Math.abs(data.monthOverMonthGrowth).toFixed(1)}% vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-trading">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-muted">
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">Last 30 Days</span>
            </div>
            <p className="text-2xl font-bold text-foreground">${data.last30DaysRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: ${data.averageOrderValue.toFixed(2)}/order
            </p>
          </CardContent>
        </Card>

        <Card className="card-trading">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">Transactions</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.totalTransactions}</p>
            <div className="flex gap-2 mt-1 text-xs">
              <span className="text-success">{data.successfulTransactions} ✓</span>
              <span className="text-warning">{data.pendingTransactions} ⏳</span>
              <span className="text-destructive">{data.failedTransactions} ✗</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Month Comparison */}
      <Card className="card-trading">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Month Comparison</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Last Month</p>
              <p className="text-lg font-semibold text-foreground">${data.lastMonthRevenue.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <div className={`p-2 rounded-full ${data.monthOverMonthGrowth >= 0 ? 'bg-success/20' : 'bg-destructive/20'}`}>
                {data.monthOverMonthGrowth >= 0 ? (
                  <ArrowUpRight className={`w-5 h-5 text-success`} />
                ) : (
                  <ArrowDownRight className={`w-5 h-5 text-destructive`} />
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">This Month</p>
              <p className="text-lg font-semibold text-foreground">${data.thisMonthRevenue.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="card-trading">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {data.recentPayments.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {data.recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      ${payment.amount} {payment.currency}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(payment.created_at), 'MMM dd, yyyy • HH:mm')}
                    </p>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
