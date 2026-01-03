import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users, ArrowUpRight, ExternalLink, Eye, MousePointerClick, CreditCard, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface KPIData {
  totalRevenue: number;
  depositRevenue: number;
  balanceRevenue: number;
  ordersCount: number;
  aov: number;
  refundsCount: number;
  refundsTotal: number;
}

interface FunnelData {
  view_item: number;
  add_to_cart: number;
  begin_checkout: number;
  deposit_paid: number;
  balance_paid: number;
}

interface TopProduct {
  product_id: string;
  title: string;
  views: number;
  adds_to_cart: number;
  purchases: number;
}

interface IntegrationStatus {
  ga4_last_event: string | null;
  meta_last_event: string | null;
}

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin', {
        body: { action: 'get_analytics', period }
      });

      if (error) throw error;
      
      if (data) {
        setKpi(data.kpi || null);
        setFunnel(data.funnel || null);
        setTopProducts(data.topProducts || []);
        setIntegrationStatus(data.integrationStatus || null);
      }
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const getFunnelConversion = (from: number, to: number) => {
    if (from === 0) return '0%';
    return `${((to / from) * 100).toFixed(1)}%`;
  };

  const funnelSteps = funnel ? [
    { label: 'Peržiūros', value: funnel.view_item, icon: Eye },
    { label: 'Į krepšelį', value: funnel.add_to_cart, icon: ShoppingCart },
    { label: 'Pradėjo checkout', value: funnel.begin_checkout, icon: MousePointerClick },
    { label: 'Depozitas sumokėtas', value: funnel.deposit_paid, icon: CreditCard },
    { label: 'Pilnai apmokėta', value: funnel.balance_paid, icon: CheckCircle },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold">Analitika</h2>
          <p className="text-sm text-muted-foreground">Duomenys iš DB (first-party)</p>
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
            </SelectContent>
          </Select>
          
          <Button onClick={loadAnalytics} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atnaujinti
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Kraunama...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Pajamos (viso)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatPrice(kpi?.totalRevenue || 0)}</p>
                <div className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">Depozitai: {formatPrice(kpi?.depositRevenue || 0)}</span>
                  <br />
                  <span className="text-blue-600">Likučiai: {formatPrice(kpi?.balanceRevenue || 0)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Užsakymai
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{kpi?.ordersCount || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Vidutinis užsakymas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatPrice(kpi?.aov || 0)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Grąžinimai
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">{kpi?.refundsCount || 0}</p>
                <p className="text-xs text-muted-foreground">{formatPrice(kpi?.refundsTotal || 0)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">Konversijų piltuvėlis</CardTitle>
              <CardDescription>Iš DB events lentelės</CardDescription>
            </CardHeader>
            <CardContent>
              {funnel ? (
                <div className="flex flex-col md:flex-row items-stretch gap-2">
                  {funnelSteps.map((step, index) => {
                    const Icon = step.icon;
                    const prevValue = index > 0 ? funnelSteps[index - 1].value : step.value;
                    const conversion = index > 0 ? getFunnelConversion(prevValue, step.value) : '100%';
                    
                    return (
                      <div key={step.label} className="flex-1 flex flex-col">
                        <div className="bg-muted/50 rounded-lg p-4 text-center flex-1">
                          <Icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-2xl font-bold">{step.value}</p>
                          <p className="text-xs text-muted-foreground">{step.label}</p>
                        </div>
                        {index > 0 && (
                          <div className="text-center py-1">
                            <Badge variant="outline" className={parseFloat(conversion) > 50 ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}>
                              {conversion}
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nėra duomenų</p>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">Top produktai</CardTitle>
              <CardDescription>Pagal view_item / add_to_cart / purchase</CardDescription>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <div className="space-y-3">
                  {topProducts.map((product, index) => (
                    <div key={product.product_id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium">{product.title}</p>
                          <p className="text-xs text-muted-foreground">ID: {product.product_id.slice(0, 8)}...</p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-semibold">{product.views}</p>
                          <p className="text-xs text-muted-foreground">peržiūros</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{product.adds_to_cart}</p>
                          <p className="text-xs text-muted-foreground">krepšelis</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-green-600">{product.purchases}</p>
                          <p className="text-xs text-muted-foreground">pirkimai</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nėra duomenų</p>
              )}
            </CardContent>
          </Card>

          {/* Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">Integracijų statusas</CardTitle>
              <CardDescription>GA4 ir Meta Pixel įvykių indikatoriai</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Google Analytics 4</p>
                    <Button variant="outline" size="sm" asChild>
                      <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Atidaryti
                      </a>
                    </Button>
                  </div>
                  {integrationStatus?.ga4_last_event ? (
                    <div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Aktyvus
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Paskutinis: {new Date(integrationStatus.ga4_last_event).toLocaleString('lt-LT')}
                      </p>
                    </div>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
                      Nėra įvykių
                    </Badge>
                  )}
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Meta Pixel</p>
                    <Button variant="outline" size="sm" asChild>
                      <a href="https://business.facebook.com/events_manager" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Atidaryti
                      </a>
                    </Button>
                  </div>
                  {integrationStatus?.meta_last_event ? (
                    <div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Aktyvus
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Paskutinis: {new Date(integrationStatus.meta_last_event).toLocaleString('lt-LT')}
                      </p>
                    </div>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
                      Nėra įvykių
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
