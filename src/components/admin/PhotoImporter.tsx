import { useState } from 'react';
import { Camera, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ScrapedProduct {
  sku: string;
  title: string;
  images: string[];
  handle: string;
  source_url: string;
}

interface PhotoRow {
  sku: string;
  scrapedTitle: string;
  newImages: string[];
  dbProductId: string | null;
  dbTitle: string | null;
  currentImages: string[];
  status: 'pending' | 'applying' | 'applied' | 'not_found';
}

export function PhotoImporter() {
  const [urls, setUrls] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState('');
  const [rows, setRows] = useState<PhotoRow[]>([]);
  const [applyingAll, setApplyingAll] = useState(false);

  const handleScrape = async () => {
    const urlList = urls.split(/\r?\n/).map((u) => u.trim()).filter((u) => u.length > 0);
    if (urlList.length === 0) {
      toast.error('Įveskite bent vieną nuorodą');
      return;
    }

    setScraping(true);
    const collected: ScrapedProduct[] = [];
    const seen = new Set<string>();

    for (const url of urlList) {
      try {
        const isCollection = /\/collections\//.test(url);
        let page = 1;

        while (true) {
          setScrapeStatus(
            isCollection ? `Nuskaitoma... ${collected.length} produktų` : 'Nuskaitomas produktas...',
          );

          let data: any = null;
          for (let attempt = 0; attempt < 4; attempt++) {
            const res = await supabase.functions.invoke('scrape-product', {
              body: { url, translate: false, limit: 30, page },
            });
            if (!res.error && res.data?.success) { data = res.data; break; }
            const msg = String(res.error?.message || res.data?.error || '');
            if (!/503|429/.test(msg)) break;
            await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
          }

          if (!data) break;

          const list: ScrapedProduct[] = Array.isArray(data.products)
            ? data.products
            : data.product ? [data.product] : [];

          for (const p of list) {
            if (!p.sku) continue;
            if (seen.has(p.sku)) continue;
            seen.add(p.sku);
            collected.push(p);
          }

          if (!isCollection || !data.hasMore || list.length === 0) break;
          page = Number(data.nextPage) || page + 1;
        }
      } catch (e: any) {
        toast.error(`Nepavyko: ${url} – ${e.message}`);
      }
    }

    setScrapeStatus('Ieškoma duomenų bazėje...');

    const skus = collected.map((p) => p.sku).filter(Boolean);
    if (skus.length === 0) {
      toast.error('Nerasta jokių produktų su SKU');
      setScraping(false);
      setScrapeStatus('');
      return;
    }

    const { data: dbProducts, error } = await supabase
      .from('products')
      .select('id, title, sku, images')
      .in('sku', skus);

    if (error) {
      toast.error(`DB klaida: ${error.message}`);
      setScraping(false);
      setScrapeStatus('');
      return;
    }

    const dbBySku = new Map<string, { id: string; title: string; images: string[] }>();
    for (const p of (dbProducts ?? [])) {
      dbBySku.set(p.sku, {
        id: p.id,
        title: p.title,
        images: Array.isArray(p.images) ? p.images : [],
      });
    }

    const newRows: PhotoRow[] = collected
      .filter((p) => p.images.length > 0)
      .map((p) => {
        const db = dbBySku.get(p.sku);
        return {
          sku: p.sku,
          scrapedTitle: p.title,
          newImages: p.images,
          dbProductId: db?.id ?? null,
          dbTitle: db?.title ?? null,
          currentImages: db?.images ?? [],
          status: db ? 'pending' : 'not_found',
        } satisfies PhotoRow;
      });

    setRows(newRows);
    setScraping(false);
    setScrapeStatus('');
    setUrls('');

    const matched = newRows.filter((r) => r.status === 'pending').length;
    const notFound = newRows.filter((r) => r.status === 'not_found').length;
    if (matched > 0 || notFound > 0) {
      toast.success(`${matched} produktų paruošta atnaujinti${notFound > 0 ? `, ${notFound} nerasta DB` : ''}`);
    }
  };

  const applyRow = async (idx: number) => {
    const row = rows[idx];
    if (!row.dbProductId) return;

    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, status: 'applying' as const } : r)));

    const { error } = await supabase
      .from('products')
      .update({ images: row.newImages } as any)
      .eq('id', row.dbProductId);

    if (error) {
      toast.error(`Klaida (${row.sku}): ${error.message}`);
      setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, status: 'pending' as const } : r)));
    } else {
      setRows((prev) =>
        prev.map((r, i) =>
          i === idx ? { ...r, currentImages: row.newImages, status: 'applied' as const } : r,
        ),
      );
    }
  };

  const applyAll = async () => {
    const pending = rows.map((r, i) => i).filter((i) => rows[i].status === 'pending');
    if (pending.length === 0) return;
    setApplyingAll(true);
    for (const i of pending) {
      await applyRow(i);
    }
    setApplyingAll(false);
    toast.success('Visos nuotraukos atnaujintos');
  };

  const pendingCount = rows.filter((r) => r.status === 'pending').length;
  const appliedCount = rows.filter((r) => r.status === 'applied').length;
  const notFoundCount = rows.filter((r) => r.status === 'not_found').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Importuoti nuotraukas</h2>
        <p className="text-muted-foreground mt-1">
          Įveskite MouldKing katalogo arba produkto nuorodas. Sistema suranda produktus pagal SKU ir atnaujina nuotraukas.
        </p>
      </div>

      <div className="space-y-3">
        <Label>MouldKing nuorodos (po vieną eilutėje)</Label>
        <Textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder={
            'https://mouldkingcorp.com/collections/mini-sports-car\nhttps://mouldkingcorp.com/products/mould-king-27005'
          }
          rows={4}
          className="font-mono text-sm"
        />
        <Button onClick={handleScrape} disabled={scraping || !urls.trim()}>
          {scraping ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {scrapeStatus || 'Nuskaitoma...'}
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Nuskaityti nuotraukas
            </>
          )}
        </Button>
      </div>

      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {pendingCount > 0 && <span>{pendingCount} laukia · </span>}
              {appliedCount > 0 && <span className="text-green-600">{appliedCount} atnaujinta · </span>}
              {notFoundCount > 0 && <span className="text-destructive">{notFoundCount} nerasta</span>}
            </p>
            {pendingCount > 0 && (
              <Button onClick={applyAll} disabled={applyingAll} size="sm">
                {applyingAll ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Atnaujinti visus ({pendingCount})
              </Button>
            )}
          </div>

          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">SKU</th>
                  <th className="text-left p-3 font-medium">Produktas DB</th>
                  <th className="text-left p-3 font-medium">Rasta nuotr.</th>
                  <th className="text-left p-3 font-medium">Dabar DB</th>
                  <th className="text-left p-3 font-medium">Statusas</th>
                  <th className="text-right p-3 font-medium">Veiksmas</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={`${row.sku}-${idx}`} className="border-b last:border-0">
                    <td className="p-3 font-mono font-medium">{row.sku}</td>
                    <td className="p-3">
                      {row.dbTitle ? (
                        <span className="line-clamp-1 max-w-xs text-sm">{row.dbTitle}</span>
                      ) : (
                        <span className="text-muted-foreground italic text-sm">{row.scrapedTitle}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{row.newImages.length}</span>
                        {row.newImages[0] && (
                          <img
                            src={row.newImages[0]}
                            alt=""
                            className="w-8 h-8 object-cover rounded border"
                          />
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{row.currentImages.length}</td>
                    <td className="p-3">
                      {row.status === 'not_found' && (
                        <span className="text-destructive flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Nerasta
                        </span>
                      )}
                      {row.status === 'pending' && (
                        <span className="text-muted-foreground">Laukia</span>
                      )}
                      {row.status === 'applying' && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {row.status === 'applied' && (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Atnaujinta
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {row.status === 'pending' && (
                        <Button size="sm" variant="outline" onClick={() => applyRow(idx)}>
                          Pritaikyti
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
