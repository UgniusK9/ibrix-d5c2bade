import { useState, useEffect, useMemo } from 'react';
import { Loader2, TrendingUp, DollarSign, Percent, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Product {
  id: string;
  sku: string;
  title: string;
  price_eur: number;
  sale_price_eur: number | null;
  cost_price_eur: number | null;
  stock_status: string;
  status: string;
}

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export function ProfitMarginReport() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('admin', {
          body: { action: 'list_products' }
        });

        if (error) throw error;
        if (data?.products) {
          setProducts(data.products.filter((p: Product) => p.status === 'active'));
        }
      } catch (e) {
        console.error('Failed to load products:', e);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Calculate profit data for each product
  const profitData = useMemo(() => {
    return products.map(product => {
      const sellingPrice = product.sale_price_eur && product.sale_price_eur < product.price_eur 
        ? product.sale_price_eur 
        : product.price_eur;
      const costPrice = product.cost_price_eur || 0;
      const profit = sellingPrice - costPrice;
      const margin = costPrice > 0 ? (profit / sellingPrice) * 100 : 0;

      return {
        ...product,
        sellingPrice,
        costPrice,
        profit,
        margin,
        hasCost: costPrice > 0,
      };
    });
  }, [products]);

  // Calculate totals
  const totals = useMemo(() => {
    const withCost = profitData.filter(p => p.hasCost);
    
    const totalRevenue = profitData.reduce((sum, p) => sum + p.sellingPrice, 0);
    const totalCost = withCost.reduce((sum, p) => sum + p.costPrice, 0);
    const totalProfit = withCost.reduce((sum, p) => sum + p.profit, 0);
    const avgMargin = withCost.length > 0 
      ? withCost.reduce((sum, p) => sum + p.margin, 0) / withCost.length 
      : 0;
    
    return {
      totalRevenue,
      totalCost,
      totalProfit,
      avgMargin,
      productCount: products.length,
      withCostCount: withCost.length,
    };
  }, [profitData, products]);

  // Chart data - top 10 by profit
  const chartData = useMemo(() => {
    return profitData
      .filter(p => p.hasCost)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10)
      .map(p => ({
        name: p.title.length > 20 ? p.title.substring(0, 20) + '...' : p.title,
        profit: p.profit,
        margin: p.margin,
      }));
  }, [profitData]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Konstruktoriai</p>
                <p className="text-2xl font-bold">{totals.productCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bendra pajamų suma</p>
                <p className="text-2xl font-bold">{formatPrice(totals.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bendras pelnas</p>
                <p className="text-2xl font-bold text-green-600">{formatPrice(totals.totalProfit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Percent className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vid. marža</p>
                <p className="text-2xl font-bold">{totals.avgMargin.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 10 pagal pelną</CardTitle>
            <CardDescription>Pelningiausi konstruktoriai</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={(v) => `€${v}`} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => [formatPrice(value), 'Pelnas']}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.profit > 0 ? '#22c55e' : '#ef4444'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pelno ir maržos ataskaita</CardTitle>
          <CardDescription>
            Visi aktyvūs konstruktoriai ({totals.withCostCount} iš {totals.productCount} turi savikainą)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Pavadinimas</TableHead>
                  <TableHead className="text-right">Savikaina</TableHead>
                  <TableHead className="text-right">Kaina</TableHead>
                  <TableHead className="text-right">Akcijos kaina</TableHead>
                  <TableHead className="text-right">Pelnas</TableHead>
                  <TableHead className="text-right">Marža</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profitData.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{product.title}</TableCell>
                    <TableCell className="text-right">
                      {product.hasCost ? formatPrice(product.costPrice) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatPrice(product.price_eur)}</TableCell>
                    <TableCell className="text-right">
                      {product.sale_price_eur ? (
                        <span className="text-orange-600">{formatPrice(product.sale_price_eur)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.hasCost ? (
                        <span className={product.profit >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {formatPrice(product.profit)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.hasCost ? (
                        <Badge variant={product.margin >= 30 ? 'default' : product.margin >= 15 ? 'secondary' : 'destructive'}>
                          {product.margin.toFixed(1)}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
