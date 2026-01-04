import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, DollarSign, ShoppingCart, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DailyData {
  date: string;
  deposits: number;
  balances: number;
  refunds: number;
  total: number;
  orders: number;
}

const formatPrice = (value: number) => {
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function AnalyticsCharts() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '365d'>('30d');
  const [chartData, setChartData] = useState<DailyData[]>([]);

  const loadChartData = async () => {
    setLoading(true);
    try {
      const periodDays = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }[period] || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Fetch payments data
      const { data: payments, error } = await supabase
        .from('payments')
        .select('type, status, amount_eur, created_at')
        .eq('status', 'succeeded')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Fetch orders data
      const { data: orders } = await supabase
        .from('orders')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString());

      // Aggregate by day
      const dailyMap: Record<string, DailyData> = {};

      // Initialize all days in period
      for (let i = 0; i < periodDays; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyMap[dateStr] = {
          date: dateStr,
          deposits: 0,
          balances: 0,
          refunds: 0,
          total: 0,
          orders: 0,
        };
      }

      // Aggregate payments
      payments?.forEach(p => {
        const dateStr = new Date(p.created_at).toISOString().split('T')[0];
        if (dailyMap[dateStr]) {
          if (p.type === 'deposit') {
            dailyMap[dateStr].deposits += p.amount_eur;
          } else if (p.type === 'balance') {
            dailyMap[dateStr].balances += p.amount_eur;
          } else if (p.type === 'refund') {
            dailyMap[dateStr].refunds += p.amount_eur;
          }
          dailyMap[dateStr].total = dailyMap[dateStr].deposits + dailyMap[dateStr].balances - dailyMap[dateStr].refunds;
        }
      });

      // Aggregate orders
      orders?.forEach(o => {
        const dateStr = new Date(o.created_at).toISOString().split('T')[0];
        if (dailyMap[dateStr]) {
          dailyMap[dateStr].orders += 1;
        }
      });

      // Convert to array and sort by date
      const sortedData = Object.values(dailyMap).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setChartData(sortedData);
    } catch (e) {
      console.error('Failed to load chart data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChartData();
  }, [period]);

  const formatDateLabel = (date: string) => {
    const d = new Date(date);
    if (period === '7d') {
      return d.toLocaleDateString('lt-LT', { weekday: 'short', day: 'numeric' });
    }
    return d.toLocaleDateString('lt-LT', { month: 'short', day: 'numeric' });
  };

  const totalRevenue = chartData.reduce((sum, d) => sum + d.total, 0);
  const totalOrders = chartData.reduce((sum, d) => sum + d.orders, 0);
  const totalDeposits = chartData.reduce((sum, d) => sum + d.deposits, 0);
  const totalBalances = chartData.reduce((sum, d) => sum + d.balances, 0);
  const totalRefunds = chartData.reduce((sum, d) => sum + d.refunds, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold">Grafikai</h3>
          <p className="text-sm text-muted-foreground">Pajamų ir užsakymų tendencijos</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dienos</SelectItem>
              <SelectItem value="30d">30 dienų</SelectItem>
              <SelectItem value="90d">90 dienų</SelectItem>
              <SelectItem value="365d">1 metai</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={loadChartData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Pajamos (neto)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Užsakymai
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Depozitai / Likučiai
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">
                  <span className="text-green-600">{formatPrice(totalDeposits)}</span>
                  {' / '}
                  <span className="text-blue-600">{formatPrice(totalBalances)}</span>
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Grąžinimai
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">{formatPrice(totalRefunds)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">Pajamos pagal dieną</CardTitle>
              <CardDescription>Depozitai, likučiai ir grąžinimai</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDateLabel}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tickFormatter={(v) => `€${v}`}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [formatPrice(value), name]}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('lt-LT')}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="deposits" 
                      name="Depozitai"
                      stackId="1"
                      stroke="hsl(142 76% 36%)" 
                      fill="hsl(142 76% 36% / 0.3)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="balances" 
                      name="Likučiai"
                      stackId="1"
                      stroke="hsl(217 91% 60%)" 
                      fill="hsl(217 91% 60% / 0.3)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="refunds" 
                      name="Grąžinimai"
                      stroke="hsl(0 84% 60%)" 
                      fill="hsl(0 84% 60% / 0.3)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Orders Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">Užsakymai pagal dieną</CardTitle>
              <CardDescription>Naujų užsakymų skaičius</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDateLabel}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      formatter={(value: number) => [value, 'Užsakymai']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('lt-LT')}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar 
                      dataKey="orders" 
                      name="Užsakymai"
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
