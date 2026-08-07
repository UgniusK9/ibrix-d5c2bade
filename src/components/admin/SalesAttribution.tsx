import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';

type Period = '24h' | '7d' | '30d' | '90d';

interface Row {
  key: string;
  orders: number;
  revenue: number;
}

interface AttributionData {
  summary: { orders: number; revenue: number; attributed: number; attributedShare: number };
  bySource: Row[];
  byCampaign: Row[];
  byContent: Row[];
}

const eur = (n: number) =>
  new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' }).format(n);

function Breakdown({
  title,
  hint,
  rows,
  total,
}: {
  title: string;
  hint: string;
  rows: Row[];
  total: number;
}) {
  return (
    <Card className="p-6">
      <h3 className="font-heading font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{hint}</p>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          Nėra duomenų už šį laikotarpį.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const share = total > 0 ? (row.revenue / total) * 100 : 0;
            return (
              <div key={row.key}>
                <div className="flex items-baseline justify-between gap-4 mb-1">
                  <span className="text-sm font-medium truncate">{row.key}</span>
                  <span className="text-sm tabular-nums whitespace-nowrap">
                    {eur(row.revenue)}
                    <span className="text-muted-foreground ml-2">
                      {row.orders} užs.
                    </span>
                  </span>
                </div>
                <div className="h-2 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.max(share, 1)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function SalesAttribution() {
  const [period, setPeriod] = useState<Period>('30d');
  const [data, setData] = useState<AttributionData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke('admin', {
        body: { action: 'get_attribution', period },
      });
      if (error) throw error;
      setData(res);
    } catch (e) {
      console.error('Failed to load attribution:', e);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const periods: Period[] = ['24h', '7d', '30d', '90d'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-heading text-2xl font-bold">Iš kur ateina pardavimai</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Skaičiuojama iš užsakymų, ne iš pikselių — reklamos blokatoriai šių
            duomenų nepaslepia.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {periods.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={p === period ? 'default' : 'outline'}
              onClick={() => setPeriod(p)}
            >
              {p}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <Card className="p-8 text-center text-muted-foreground">Kraunama…</Card>
      ) : !data ? (
        <Card className="p-8 text-center text-muted-foreground">
          Nepavyko įkelti duomenų.
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <div className="text-sm text-muted-foreground">Pajamos</div>
              <div className="text-2xl font-semibold mt-1">
                {eur(data.summary.revenue)}
              </div>
            </Card>
            <Card className="p-5">
              <div className="text-sm text-muted-foreground">Užsakymai</div>
              <div className="text-2xl font-semibold mt-1">
                {data.summary.orders}
              </div>
            </Card>
            <Card className="p-5">
              <div className="text-sm text-muted-foreground">
                Su žinomu šaltiniu
              </div>
              <div className="text-2xl font-semibold mt-1">
                {Math.round(data.summary.attributedShare * 100)}%
                <span className="text-sm text-muted-foreground font-normal ml-2">
                  {data.summary.attributed}/{data.summary.orders}
                </span>
              </div>
            </Card>
          </div>

          {data.summary.orders > 0 && data.summary.attributedShare < 0.5 && (
            <Card className="p-4 border-yellow-500/30 bg-yellow-500/5">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium">
                    Daugiau nei pusė užsakymų be šaltinio.
                  </span>{' '}
                  Dažniausia priežastis — nuorodos be UTM žymų. Naudokite
                  pažymėtas nuorodas socialiniuose tinkluose.
                </div>
              </div>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Breakdown
              title="Pagal šaltinį"
              hint="TikTok, Facebook, tiesioginiai apsilankymai"
              rows={data.bySource}
              total={data.summary.revenue}
            />
            <Breakdown
              title="Pagal kampaniją"
              hint="utm_campaign reikšmės"
              rows={data.byCampaign}
              total={data.summary.revenue}
            />
          </div>

          <Breakdown
            title="Pagal turinį"
            hint="utm_content — kuris konkretus video ar įrašas atnešė pardavimą"
            rows={data.byContent}
            total={data.summary.revenue}
          />

          {data.summary.orders === 0 && (
            <Card className="p-6">
              <div className="flex gap-3">
                <TrendingUp className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  Kol kas užsakymų nėra. Kai tik atsiras pirmas apmokėtas
                  užsakymas iš pažymėtos nuorodos, jis pasirodys čia.
                  <Badge variant="outline" className="ml-2">
                    laukiama duomenų
                  </Badge>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
