import { useState } from 'react';
import { Download, Loader2, Save, X, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Category = 'engines' | 'cars' | 'flowers' | 'other';
type StockStatus = 'preorder' | 'in_stock' | 'out_of_stock';

interface ScrapedProduct {
  handle: string;
  title: string;
  description: string;
  short_desc: string;
  source_price: number;
  source_currency: string;
  sku: string;
  images: string[];
  tags: string[];
  source_url: string;
}

interface ImportDraft {
  sku: string;
  slug: string;
  title: string;
  short_desc: string;
  description: string;
  price_eur: string;
  deposit_eur: string;
  stock_status: StockStatus;
  category: Category;
  images: string[];
  tags: string[];
  source_url: string;
  source_price: number;
  source_currency: string;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export function ProductImporter() {
  const [urls, setUrls] = useState('');
  const [scraping, setScraping] = useState(false);
  const [rate, setRate] = useState('1'); // USD → EUR multiplier applied when scraping
  const [drafts, setDrafts] = useState<ImportDraft[]>([]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);

  const handleScrape = async () => {
    const urlList = urls
      .split(/\r?\n/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urlList.length === 0) {
      toast.error('Įveskite bent vieną nuorodą');
      return;
    }

    const multiplier = Math.max(0, Number.parseFloat(rate) || 1);

    setScraping(true);
    const collected: ImportDraft[] = [...drafts];
    let ok = 0;

    for (const url of urlList) {
      try {
        const { data, error } = await supabase.functions.invoke('scrape-product', {
          body: { url },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Nepavyko nuskaityti');

        const p: ScrapedProduct = data.product;
        const priceEur = Math.round(p.source_price * multiplier * 100) / 100;
        collected.push({
          sku: p.sku,
          slug: slugify(p.handle || p.title),
          title: p.title,
          short_desc: p.short_desc,
          description: p.description,
          price_eur: priceEur.toFixed(2),
          deposit_eur: (Math.round(priceEur * 0.2 * 100) / 100).toFixed(2),
          stock_status: 'preorder',
          category: 'engines',
          images: p.images,
          tags: p.tags,
          source_url: p.source_url,
          source_price: p.source_price,
          source_currency: p.source_currency,
        });
        ok++;
      } catch (e: any) {
        console.error('Scrape failed for', url, e);
        toast.error(`Nepavyko: ${url} – ${e.message}`);
      }
    }

    setDrafts(collected);
    setScraping(false);
    if (ok > 0) {
      toast.success(`Nuskaityta ${ok} produkt${ok === 1 ? 'as' : 'ai'}`);
      setUrls('');
    }
  };

  const updateDraft = (idx: number, patch: Partial<ImportDraft>) => {
    setDrafts((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  const removeDraft = (idx: number) => {
    setDrafts((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeImage = (idx: number, imgIdx: number) => {
    setDrafts((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, images: d.images.filter((_, j) => j !== imgIdx) } : d)),
    );
  };

  const saveDraft = async (idx: number) => {
    const d = drafts[idx];
    const price = Number.parseFloat(d.price_eur);
    const deposit = Number.parseFloat(d.deposit_eur);

    if (!d.title.trim() || !d.sku.trim() || !d.slug.trim()) {
      toast.error('Užpildykite pavadinimą, SKU ir slug');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('Neteisinga kaina');
      return;
    }

    setSavingIdx(idx);
    try {
      const { data, error } = await supabase.functions.invoke('admin', {
        body: {
          action: 'create_product',
          sku: d.sku.trim(),
          slug: d.slug.trim(),
          title: d.title.trim(),
          short_desc: d.short_desc || null,
          description: d.description || null,
          price_eur: price,
          deposit_eur: Number.isFinite(deposit) ? deposit : 0,
          stock_status: d.stock_status,
          status: 'active',
          category: d.category,
          images: d.images,
          badges: [],
          tags: d.tags,
          inventory_qty: d.stock_status === 'in_stock' ? 1 : 0,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Klaida');
      toast.success(`Sukurta: ${d.title}`);
      removeDraft(idx);
    } catch (e: any) {
      console.error(e);
      toast.error(`Nepavyko išsaugoti: ${e.message}`);
    } finally {
      setSavingIdx(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Importuoti produktus iš MouldKing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="urls">Produktų nuorodos (po vieną eilutėje)</Label>
            <Textarea
              id="urls"
              placeholder={'https://mouldkingcorp.com/products/10250-lfa-v10-engine-model-building-set\nhttps://mouldkingcorp.com/products/...'}
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Palaikomos „Shopify" tipo parduotuvių nuorodos (pvz., mouldkingcorp.com).
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="rate">USD → EUR kursas</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-32"
              />
            </div>
            <Button onClick={handleScrape} disabled={scraping}>
              {scraping ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Nuskaityti
            </Button>
          </div>
        </CardContent>
      </Card>

      {drafts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Peržiūra ({drafts.length})</h3>
          {drafts.map((d, idx) => (
            <Card key={`${d.source_url}-${idx}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="min-w-0">
                  <CardTitle className="text-base truncate">{d.title || 'Be pavadinimo'}</CardTitle>
                  <a
                    href={d.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                  >
                    <LinkIcon className="w-3 h-3" />
                    {d.source_url}
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    Šaltinio kaina: {d.source_price} {d.source_currency}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeDraft(idx)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Pavadinimas</Label>
                    <Input value={d.title} onChange={(e) => updateDraft(idx, { title: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>SKU</Label>
                    <Input value={d.sku} onChange={(e) => updateDraft(idx, { sku: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Slug</Label>
                    <Input value={d.slug} onChange={(e) => updateDraft(idx, { slug: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Kategorija</Label>
                    <Select value={d.category} onValueChange={(v) => updateDraft(idx, { category: v as Category })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engines">Varikliai</SelectItem>
                        <SelectItem value="cars">Automobiliai</SelectItem>
                        <SelectItem value="flowers">Gėlės</SelectItem>
                        <SelectItem value="other">Kita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Kaina (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={d.price_eur}
                      onChange={(e) => updateDraft(idx, { price_eur: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Užstatas (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={d.deposit_eur}
                      onChange={(e) => updateDraft(idx, { deposit_eur: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>Sandėlio būsena</Label>
                    <Select value={d.stock_status} onValueChange={(v) => updateDraft(idx, { stock_status: v as StockStatus })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preorder">Pre-order</SelectItem>
                        <SelectItem value="in_stock">Sandėlyje</SelectItem>
                        <SelectItem value="out_of_stock">Išparduota</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Trumpas aprašymas</Label>
                  <Textarea
                    value={d.short_desc}
                    onChange={(e) => updateDraft(idx, { short_desc: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Aprašymas</Label>
                  <Textarea
                    value={d.description}
                    onChange={(e) => updateDraft(idx, { description: e.target.value })}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nuotraukos ({d.images.length})</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {d.images.map((src, imgIdx) => (
                      <div key={imgIdx} className="relative group rounded-lg overflow-hidden border bg-muted">
                        <img src={src} alt="" loading="lazy" className="w-full h-24 object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx, imgIdx)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          aria-label="Pašalinti"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {d.images.length === 0 && (
                      <p className="text-xs text-muted-foreground col-span-full">Nuotraukų nerasta</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pastaba: nuotraukos importuojamos kaip nuorodos į šaltinio serverį. Norėdami perkelti į savo saugyklą, po sukūrimo redaguokite produktą.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => saveDraft(idx)} disabled={savingIdx === idx}>
                    {savingIdx === idx ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Sukurti produktą
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
