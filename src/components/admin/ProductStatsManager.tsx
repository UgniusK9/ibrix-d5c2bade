import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, TrendingUp, Eye, EyeOff } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Product {
  id: string;
  title: string;
  slug: string;
}

interface ViewRow {
  product_id: string;
  created_at: string;
}

interface DailyPoint {
  date: string;
  views: number;
}

interface ProductStats {
  product_id: string;
  title: string;
  total_views: number;
}

const RANGES = [
  { id: "7", label: "7 d." },
  { id: "30", label: "30 d." },
  { id: "90", label: "90 d." },
];

export function ProductStatsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [chartData, setChartData] = useState<DailyPoint[]>([]);
  const [allStats, setAllStats] = useState<ProductStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadAggregateStats();
  }, [rangeDays]);

  useEffect(() => {
    if (selectedProductId) loadChart();
  }, [selectedProductId, rangeDays]);

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, title, slug")
      .eq("status", "active")
      .order("title");
    if (data) {
      setProducts(data);
      if (data.length > 0 && !selectedProductId) setSelectedProductId(data[0].id);
    }
  };

  const loadAggregateStats = async () => {
    setLoading(true);
    const since = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString();
    const { data: views } = await supabase
      .from("product_views")
      .select("product_id")
      .gte("created_at", since);

    const counts = new Map<string, number>();
    (views || []).forEach((v: any) => {
      counts.set(v.product_id, (counts.get(v.product_id) || 0) + 1);
    });

    const { data: prods } = await supabase
      .from("products")
      .select("id, title")
      .eq("status", "active");

    const stats: ProductStats[] = (prods || []).map((p: any) => ({
      product_id: p.id,
      title: p.title,
      total_views: counts.get(p.id) || 0,
    }));
    stats.sort((a, b) => b.total_views - a.total_views);
    setAllStats(stats);
    setLoading(false);
  };

  const loadChart = async () => {
    // Start from local midnight (rangeDays-1) days ago, so today's bucket is included
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (rangeDays - 1));

    const { data } = await supabase
      .from("product_views")
      .select("created_at")
      .eq("product_id", selectedProductId)
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: true });

    // Bucket by day (inclusive of today)
    const buckets = new Map<string, number>();
    for (let i = 0; i < rangeDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, 0);
    }
    (data || []).forEach((row: any) => {
      const key = row.created_at.slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + 1);
    });
    const points: DailyPoint[] = Array.from(buckets.entries()).map(([date, views]) => ({
      date: date.slice(5),
      views,
    }));
    setChartData(points);
  };

  const top5 = useMemo(() => allStats.slice(0, 5), [allStats]);
  const bottom5 = useMemo(() => allStats.slice(-5).reverse(), [allStats]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Peržiūrų tendencijos
            </CardTitle>
            <Tabs value={String(rangeDays)} onValueChange={(v) => setRangeDays(Number(v))}>
              <TabsList>
                {RANGES.map((r) => (
                  <TabsTrigger key={r.id} value={r.id}>{r.label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 max-w-md">
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Pasirinkite konstruktorių" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="h-72 w-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} className="text-xs" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="w-4 h-4 text-primary" />
              Daugiausiai peržiūrų ({rangeDays} d.)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Konstruktorius</TableHead>
                  <TableHead className="text-right">Peržiūros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top5.map((s) => (
                  <TableRow key={s.product_id}>
                    <TableCell className="font-medium">{s.title}</TableCell>
                    <TableCell className="text-right">{s.total_views}</TableCell>
                  </TableRow>
                ))}
                {top5.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                      Nėra duomenų
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <EyeOff className="w-4 h-4 text-muted-foreground" />
              Mažiausiai peržiūrų ({rangeDays} d.)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Konstruktorius</TableHead>
                  <TableHead className="text-right">Peržiūros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bottom5.map((s) => (
                  <TableRow key={s.product_id}>
                    <TableCell className="font-medium">{s.title}</TableCell>
                    <TableCell className="text-right">{s.total_views}</TableCell>
                  </TableRow>
                ))}
                {bottom5.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                      Nėra duomenų
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
