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
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

type Category = 'engines' | 'cars' | 'flowers' | 'other';
type StockStatus = 'preorder' | 'in_stock' | 'out_of_stock';

interface ScrapedProduct {
  handle: string;
  title: string;
  title_en?: string | null;
  description: string;
  description_en?: string | null;
  short_desc: string;
  short_desc_en?: string | null;
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
  title_en: string;
  short_desc: string;
  short_desc_en: string;
  description: string;
  description_en: string;
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

// Heuristic category detection based on scraped title, tags, description and source URL.
// Matches Lithuanian and English keywords so it works before/after translation.
const detectCategory = (p: {
  title?: string;
  description?: string;
  short_desc?: string;
  tags?: string[];
  source_url?: string;
}): Category => {
  const hay = [
    p.title,
    p.short_desc,
    p.description,
    p.source_url,
    ...(p.tags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const has = (re: RegExp) => re.test(hay);

  // Engines: check first because engine models often mention car brands too.
  if (has(/\b(engine|variklis|varikli|motor|v\d{1,2}|w\d{1,2}|inline|boxer|rotary)\b/))
    return 'engines';

  // Flowers / bouquets / botanical sets.
  if (has(/\b(flower|floral|bouquet|rose|orchid|bonsai|plant|gėlė|gele|geliu|puokšt|puokst|botanic)\b/))
    return 'flowers';

  // Cars & road vehicles.
  if (
    has(
      /\b(car|cars|automobil|automobiliai|vehicle|vehicles|supercar|hypercar|hyper-car|roadster|coupe|sedan|suv|truck|pickup|rc|technic-vehicles|racing|race-car|sport-car|sports-car)\b/,
    )
  )
    return 'cars';

  return 'other';
};

export function ProductImporter() {
  const { t } = useTranslation();
  const [urls, setUrls] = useState('');
  const [scraping, setScraping] = useState(false);
  const [rate, setRate] = useState('1'); // USD → EUR multiplier applied when scraping
  const [translate, setTranslate] = useState(true);
  const [limit, setLimit] = useState('50');
  const [drafts, setDrafts] = useState<ImportDraft[]>([]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [scrapeStatus, setScrapeStatus] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [inStockSkus, setInStockSkus] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');

  const handleScrape = async () => {
    const urlList = urls
      .split(/\r?\n/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urlList.length === 0) {
      toast.error(t('admProducts.photoEnterUrl'));
      return;
    }

    const multiplier = Math.max(0, Number.parseFloat(rate) || 1);

    setScraping(true);
    const collected: ImportDraft[] = [...drafts];
    const seen = new Set<string>(
      collected.map((d) => d.source_url || d.slug || d.sku).filter(Boolean),
    );
    let ok = 0;

    const appendProducts = (products: ScrapedProduct[]) => {
      let added = 0;
      for (const p of products) {
        const key = p.source_url || p.handle || p.sku;
        if (key && seen.has(key)) continue;
        if (key) seen.add(key);
        const priceEur = Math.round(p.source_price * multiplier * 100) / 100;
        collected.push({
          sku: p.sku,
          slug: slugify(p.handle || p.title),
          title: p.title,
          title_en: p.title_en || '',
          short_desc: p.short_desc,
          short_desc_en: p.short_desc_en || '',
          description: p.description,
          description_en: p.description_en || '',
          price_eur: priceEur.toFixed(2),
          deposit_eur: (Math.round(priceEur * 0.2 * 100) / 100).toFixed(2),
          stock_status: 'preorder',
          category: detectCategory(p),
          images: p.images,
          tags: p.tags,
          source_url: p.source_url,
          source_price: p.source_price,
          source_currency: p.source_currency,
        });
        ok++;
        added++;
      }
      setDrafts([...collected]);
      return added;
    };

    for (const url of urlList) {
      try {
        const targetLimit = Math.min(Math.max(1, Number.parseInt(limit, 10) || 50), 250);
        const isCollection = /\/collections\//.test(url);
        const batchLimit = isCollection ? (translate ? 6 : 30) : 1;
        let page = 1;
        let remaining = isCollection ? targetLimit : 1;

        while (remaining > 0) {
          setScrapeStatus(
            isCollection
              ? t('admProducts.impScrapingColl', { ok, total: targetLimit })
              : t('admProducts.photoScrapingOne'),
          );

          // Retry the same page a few times on transient upstream throttles (503/429).
          let data: any = null;
          let lastErr: any = null;
          for (let attempt = 0; attempt < 4; attempt++) {
            const res = await supabase.functions.invoke('scrape-product', {
              body: { url, translate, limit: Math.min(batchLimit, remaining), page },
            });
            if (!res.error && res.data?.success) { data = res.data; break; }
            lastErr = res.error || new Error(res.data?.error || t('admProducts.impScrapeError'));
            const msg = String(lastErr?.message || '');
            const transient = /503|429|laikinai|per daug/i.test(msg);
            if (!transient) break;
            setScrapeStatus(t('admProducts.impSourceBusy', { num: attempt + 1 }));
            await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
          }
          if (!data) {
            console.warn('Skipping page', page, 'for', url, lastErr);
            toast.error(t('admProducts.impSkippedPage', { page, msg: lastErr?.message || t('admProducts.impGenericError') }));
            page += 1;
            continue;
          }

          const list: ScrapedProduct[] = Array.isArray(data.products)
            ? data.products
            : data.product
              ? [data.product]
              : [];
          const added = appendProducts(list);

          remaining -= added;
          if (!isCollection || !data.hasMore || list.length === 0) break;
          // If an entire page was duplicates, we've looped back — stop.
          if (isCollection && added === 0) break;
          page = Number(data.nextPage) || page + 1;
        }
      } catch (e: any) {
        console.error('Scrape failed for', url, e);
        toast.error(t('admProducts.photoScrapeFail', { url, msg: e.message }));
      }
    }

    setDrafts(collected);
    setScraping(false);
    setScrapeStatus('');
    if (ok > 0) {
      toast.success(ok === 1 ? t('admProducts.impScrapedOne', { num: ok }) : t('admProducts.impScrapedMany', { num: ok }));
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
      toast.error(t('admProducts.impFillRequired'));
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast.error(t('admProducts.impBadPrice'));
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
          title_en: d.title_en.trim() || null,
          short_desc: d.short_desc || null,
          short_desc_en: d.short_desc_en || null,
          description: d.description || null,
          description_en: d.description_en || null,
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
      if (!data?.success) throw new Error(data?.error || t('common.error'));
      toast.success(t('admProducts.impCreated', { title: d.title }));
      removeDraft(idx);
    } catch (e: any) {
      console.error(e);
      toast.error(t('admProducts.impSaveFail', { msg: e.message }));
    } finally {
      setSavingIdx(null);
    }
  };

  const normalizeSku = (s: string) => s.trim().toUpperCase();

  // Match a draft to a user-provided SKU token. MouldKing SKUs are typically
  // numeric like "10250" but sometimes have suffixes ("13163S"). Accept a
  // match when either the draft SKU equals the token, or when the draft SKU
  // starts with the token (so "10250" matches "10250-LFA-V10-...").
  const skuMatches = (draftSku: string, token: string) => {
    const a = normalizeSku(draftSku);
    const b = normalizeSku(token);
    if (!a || !b) return false;
    return a === b || a.startsWith(b) || a.startsWith(`${b}-`);
  };

  const parsedInStock = (() => {
    const raw = inStockSkus.trim();
    if (!raw) {
      return { valid: [] as string[], invalid: [] as string[], matched: [] as string[], unmatched: [] as string[] };
    }
    // Split by whitespace / commas / semicolons / newlines. Accept SKUs like
    // "10224", "13163S". A valid SKU token must contain at least 3 digits.
    const tokens = raw
      .split(/[\s,;]+/)
      .map((t) => t.replace(/^[.\)\]]+|[.\)\]]+$/g, '').trim())
      .filter(Boolean);

    const valid: string[] = [];
    const invalid: string[] = [];
    for (const t of tokens) {
      // ignore bare list numbering like "1." or "11" if too short (< 3 digits)
      const digits = (t.match(/\d/g) || []).length;
      if (/^[A-Za-z0-9\-]+$/.test(t) && digits >= 3) {
        valid.push(normalizeSku(t));
      } else {
        invalid.push(t);
      }
    }

    const matched: string[] = [];
    const unmatched: string[] = [];
    for (const sku of valid) {
      if (drafts.some((d) => skuMatches(d.sku, sku))) matched.push(sku);
      else unmatched.push(sku);
    }
    return { valid, invalid, matched, unmatched };
  })();

  const handleBulkUpload = async () => {
    const inStockTokens = parsedInStock.valid;

    setBulkUploading(true);
    let success = 0;
    let failed = 0;
    const remaining: ImportDraft[] = [];

    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i];
      const isInStock = inStockTokens.some((tok) => skuMatches(d.sku, tok));
      const stock_status: StockStatus = isInStock ? 'in_stock' : 'preorder';
      const price = Number.parseFloat(d.price_eur);
      const deposit = Number.parseFloat(d.deposit_eur);

      setBulkStatus(t('admProducts.impUploading', { num: i + 1, total: drafts.length, title: d.title }));

      if (!d.title.trim() || !d.sku.trim() || !d.slug.trim() || !Number.isFinite(price) || price <= 0) {
        failed++;
        remaining.push(d);
        continue;
      }

      try {
        const { data, error } = await supabase.functions.invoke('admin', {
          body: {
            action: 'create_product',
            sku: d.sku.trim(),
            slug: d.slug.trim(),
            title: d.title.trim(),
            title_en: d.title_en.trim() || null,
            short_desc: d.short_desc || null,
            short_desc_en: d.short_desc_en || null,
            description: d.description || null,
            description_en: d.description_en || null,
            price_eur: price,
            deposit_eur: Number.isFinite(deposit) ? deposit : 0,
            stock_status,
            status: 'active',
            category: d.category,
            images: d.images,
            badges: [],
            tags: d.tags,
            inventory_qty: stock_status === 'in_stock' ? 1 : 0,
          },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || t('common.error'));
        success++;
      } catch (e: any) {
        console.error('Bulk save failed for', d.title, e);
        failed++;
        remaining.push(d);
      }
    }

    setDrafts(remaining);
    setBulkUploading(false);
    setBulkStatus('');
    setBulkOpen(false);
    setInStockSkus('');
    if (success > 0) toast.success(success === 1 ? t('admProducts.impUploadedOne', { num: success }) : t('admProducts.impUploadedMany', { num: success }));
    if (failed > 0) toast.error(t('admProducts.impBulkFail', { num: failed }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            {t('admProducts.impTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="urls">{t('admProducts.impLinksLabel')}</Label>
            <Textarea
              id="urls"
              placeholder={'https://mouldkingcorp.com/collections/technic-vehicles\nhttps://mouldkingcorp.com/products/10250-lfa-v10-engine-model-building-set'}
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {t('admProducts.impLinksHint')}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate">{t('admProducts.impRateLabel')}</Label>
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
            <div className="space-y-2">
              <Label htmlFor="limit">{t('admProducts.impLimitLabel')}</Label>
              <Input
                id="limit"
                type="number"
                min="1"
                max="250"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-24"
              />
            </div>
            <div className="flex items-center gap-2 h-10">
              <Switch id="translate" checked={translate} onCheckedChange={setTranslate} />
              <Label htmlFor="translate" className="cursor-pointer">{t('admProducts.impTranslateLabel')}</Label>
            </div>
            <Button onClick={handleScrape} disabled={scraping}>
              {scraping ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {t('admProducts.impScrapeBtn')}
            </Button>
          </div>
          {scrapeStatus && (
            <p className="text-sm text-muted-foreground">{scrapeStatus}</p>
          )}
          {translate && (
            <p className="text-xs text-muted-foreground">
              {t('admProducts.impTranslateHint')}
            </p>
          )}
        </CardContent>
      </Card>

      {drafts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('admProducts.impPreview', { num: drafts.length })}</h3>
            <Button onClick={() => setBulkOpen(true)} disabled={bulkUploading}>
              <Save className="w-4 h-4 mr-2" />
              {t('admProducts.impUploadAll', { num: drafts.length })}
            </Button>
          </div>
          {drafts.map((d, idx) => (
            <Card key={`${d.source_url}-${idx}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="min-w-0">
                  <CardTitle className="text-base truncate">{d.title || t('admProducts.impUntitled')}</CardTitle>
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
                    {t('admProducts.impSourcePrice', { price: d.source_price, currency: d.source_currency })}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeDraft(idx)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>{t('admCommon.name')}</Label>
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
                    <Label>{t('products.category')}</Label>
                    <Select value={d.category} onValueChange={(v) => updateDraft(idx, { category: v as Category })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engines">{t('products.engines')}</SelectItem>
                        <SelectItem value="cars">{t('products.cars')}</SelectItem>
                        <SelectItem value="flowers">{t('admProducts.impCatFlowers')}</SelectItem>
                        <SelectItem value="other">{t('products.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>{t('admProducts.impPriceLabel')}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={d.price_eur}
                      onChange={(e) => updateDraft(idx, { price_eur: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{t('admProducts.impDepositLabel')}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={d.deposit_eur}
                      onChange={(e) => updateDraft(idx, { deposit_eur: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>{t('admProducts.impStockLabel')}</Label>
                    <Select value={d.stock_status} onValueChange={(v) => updateDraft(idx, { stock_status: v as StockStatus })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preorder">Pre-order</SelectItem>
                        <SelectItem value="in_stock">{t('products.inStockLabel')}</SelectItem>
                        <SelectItem value="out_of_stock">{t('products.outOfStock')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>{t('admProducts.impShortDesc')}</Label>
                  <Textarea
                    value={d.short_desc}
                    onChange={(e) => updateDraft(idx, { short_desc: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t('products.description')}</Label>
                  <Textarea
                    value={d.description}
                    onChange={(e) => updateDraft(idx, { description: e.target.value })}
                    rows={6}
                  />
                </div>
                <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
                  <div>
                    <p className="text-sm font-semibold">{t('admProducts.pmEnSection')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('admProducts.pmEnHint')}</p>
                  </div>
                  <div className="space-y-1">
                    <Label>{t('admProducts.pmTitleEn')}</Label>
                    <Input value={d.title_en} onChange={(e) => updateDraft(idx, { title_en: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>{t('admProducts.pmShortEn')}</Label>
                    <Textarea
                      value={d.short_desc_en}
                      onChange={(e) => updateDraft(idx, { short_desc_en: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{t('admProducts.pmFullDescEn')}</Label>
                    <Textarea
                      value={d.description_en}
                      onChange={(e) => updateDraft(idx, { description_en: e.target.value })}
                      rows={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('admProducts.impPhotos', { num: d.images.length })}</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {d.images.map((src, imgIdx) => (
                      <div key={imgIdx} className="relative group rounded-lg overflow-hidden border bg-muted">
                        <img src={src} alt="" loading="lazy" className="w-full h-24 object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx, imgIdx)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          aria-label={t('common.remove')}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {d.images.length === 0 && (
                      <p className="text-xs text-muted-foreground col-span-full">{t('admProducts.impNoPhotos')}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('admProducts.impPhotosNote')}
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => saveDraft(idx)} disabled={savingIdx === idx}>
                    {savingIdx === idx ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {t('admProducts.impCreateProduct')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={bulkOpen} onOpenChange={(o) => !bulkUploading && setBulkOpen(o)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admProducts.impInStockTitle')}</DialogTitle>
            <DialogDescription>
              {t('admProducts.impInStockDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="in-stock-skus">{t('admProducts.impInStockSkus')}</Label>
            <Textarea
              id="in-stock-skus"
              value={inStockSkus}
              onChange={(e) => setInStockSkus(e.target.value)}
              placeholder={'10224\n10250\n13163S'}
              rows={8}
              className="font-mono text-sm"
              disabled={bulkUploading}
            />
            <p className="text-xs text-muted-foreground">
              {t('admProducts.impInStockHint')}
            </p>
          </div>
          {inStockSkus.trim() && (
            <div className="rounded-md border p-3 space-y-1 text-sm">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  {t('admProducts.impDetectedSku')} <strong>{parsedInStock.valid.length}</strong>
                </span>
                <span className="text-green-600">
                  {t('admProducts.impMatched')} <strong>{parsedInStock.matched.length}</strong>
                </span>
                {parsedInStock.unmatched.length > 0 && (
                  <span className="text-amber-600">
                    {t('admProducts.impUnmatched')} <strong>{parsedInStock.unmatched.length}</strong>
                  </span>
                )}
                {parsedInStock.invalid.length > 0 && (
                  <span className="text-destructive">
                    {t('admProducts.impInvalidFmt')} <strong>{parsedInStock.invalid.length}</strong>
                  </span>
                )}
              </div>
              {parsedInStock.unmatched.length > 0 && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">{t('admProducts.impShowMismatched', { num: parsedInStock.unmatched.length })}</summary>
                  <ul className="mt-1 list-disc pl-5 break-all">
                    {parsedInStock.unmatched.slice(0, 20).map((u) => (
                      <li key={u}>{u}</li>
                    ))}
                    {parsedInStock.unmatched.length > 20 && <li>…</li>}
                  </ul>
                </details>
              )}
              {parsedInStock.invalid.length > 0 && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">{t('admProducts.impShowInvalid', { num: parsedInStock.invalid.length })}</summary>
                  <ul className="mt-1 list-disc pl-5 break-all">
                    {parsedInStock.invalid.slice(0, 20).map((u, i) => (
                      <li key={`${u}-${i}`}>{u}</li>
                    ))}
                    {parsedInStock.invalid.length > 20 && <li>…</li>}
                  </ul>
                </details>
              )}
            </div>
          )}
          {bulkStatus && <p className="text-sm text-muted-foreground">{bulkStatus}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)} disabled={bulkUploading}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                if (parsedInStock.invalid.length > 0) {
                  toast.error(t('admProducts.impInvalidEntries', { num: parsedInStock.invalid.length }));
                  return;
                }
                if (parsedInStock.unmatched.length > 0) {
                  const ok = window.confirm(
                    t('admProducts.impMismatchConfirm', { num: parsedInStock.unmatched.length }),
                  );
                  if (!ok) return;
                }
                handleBulkUpload();
              }}
              disabled={bulkUploading}
            >
              {bulkUploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {drafts.length === 1 ? t('admProducts.impUploadOne', { num: drafts.length }) : t('admProducts.impUploadMany', { num: drafts.length })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
