import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Facebook / Meta Commerce Manager product catalogue feed (CSV).
// Column names follow the Commerce Manager spec, NOT Google Merchant Center —
// pick "Commerce Manager" as the format when adding the data source.
//
// Query params:
//   ?stock=in_stock   only warehouse stock
//   ?stock=preorder   only pre-orders
//   (default: everything active)

const SITE_URL = 'https://ibrix.lt';
const BRAND = 'MOULD KING';
const CURRENCY = 'EUR';

// Keeps the 1-cent checkout test product out of a live sales channel.
const MIN_PRICE_EUR = 1;

// Pre-orders hold no physical stock; this is what Meta may sell against.
const PREORDER_QTY = 5;

// Meta limits: title 200 chars, description 9999.
const MAX_TITLE = 200;
const MAX_DESC = 9999;

function csvCell(value: unknown): string {
  const s = String(value ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function stripHtml(input: string): string {
  return String(input ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#3[49];/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(s: string, max: number): string {
  const t = String(s ?? '').trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

function humanizeSlug(slug: string): string {
  const s = String(slug ?? '').trim();
  if (!s) return 'Konstruktoriai';
  const words = s.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function absoluteUrl(url: string): string {
  const u = String(url ?? '').trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`;
}

// Source images are 2000x2000 PNGs averaging 1.5 MB. Meta downloads every one of
// them, so the raw catalogue is ~6 GB of fetches and ingestion crawls. Shopify's
// CDN resizes on the fly, and 1024px is Meta's recommended catalogue size —
// roughly a third of the bytes for no visible quality loss.
const IMAGE_WIDTH = 1024;

function sizedImage(url: string): string {
  const u = absoluteUrl(url);
  if (!u) return '';
  if (!/(^|\.)cdn\.shopify\.com/i.test(new URL(u).hostname)) return u;
  if (/[?&]width=/i.test(u)) return u;
  return `${u}${u.includes('?') ? '&' : '?'}width=${IMAGE_WIDTH}`;
}

// Piece counts live in the title ("... Konstruktorius | 1,203 dalių").
const PIECES_RE = /\|\s*([\d.,\s]+?)\s*dali[ųu]\s*$/i;

function piecesFromTitle(title: string): number {
  const m = String(title ?? '').match(PIECES_RE);
  if (!m) return 0;
  const n = parseInt(m[1].replace(/[.,\s]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

// Commerce Manager column order.
const COLUMNS = [
  'id',
  'title',
  'description',
  'availability',
  'condition',
  'price',
  'sale_price',
  'link',
  'image_link',
  'additional_image_link',
  'brand',
  'quantity_to_sell_on_facebook',
  'product_type',
  'custom_label_0',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const stockFilter = new URL(req.url).searchParams.get('stock');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: catRows, error: catErr } = await supabase
      .from('categories')
      .select('id, name');
    if (catErr) throw catErr;

    const catNameById = new Map<string, string>();
    for (const c of (catRows ?? [])) {
      if (c.id && c.name) catNameById.set(c.id, c.name);
    }

    let query = supabase
      .from('products')
      .select('id, sku, slug, title, short_desc, description, category, category_id, stock_status, price_eur, sale_price_eur, images, inventory_qty')
      .eq('status', 'active');

    if (stockFilter === 'in_stock' || stockFilter === 'preorder') {
      query = query.eq('stock_status', stockFilter);
    } else {
      query = query.in('stock_status', ['in_stock', 'preorder']);
    }

    const { data: products, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    const rows = (products ?? []).filter(p => Number(p.price_eur) >= MIN_PRICE_EUR);

    const lines: string[] = [COLUMNS.join(',')];
    let skipped = 0;

    for (const p of rows) {
      const images: string[] = (Array.isArray(p.images) ? p.images : [])
        .map((i: unknown) => sizedImage(typeof i === 'string' ? i : (i as { url?: string })?.url ?? ''))
        .filter(Boolean);

      // image_link is required by Meta — a row without one is rejected anyway.
      if (images.length === 0) { skipped++; continue; }

      const inStock = p.stock_status === 'in_stock';
      const qty = inStock ? (p.inventory_qty ?? 0) : PREORDER_QTY;
      if (inStock && qty <= 0) { skipped++; continue; }

      const hasSale = p.sale_price_eur != null && Number(p.sale_price_eur) < Number(p.price_eur);

      // Meta wants the regular price in `price` and the discount in `sale_price`.
      const price = `${Number(p.price_eur).toFixed(2)} ${CURRENCY}`;
      const salePrice = hasSale ? `${Number(p.sale_price_eur).toFixed(2)} ${CURRENCY}` : '';

      // Description is required; fall back through the fields we have.
      const description = truncate(
        stripHtml(p.description || p.short_desc || p.title || ''),
        MAX_DESC
      ) || truncate(String(p.title ?? ''), MAX_DESC);

      const productType = (p.category_id ? catNameById.get(p.category_id) : null)
        ?? humanizeSlug(p.category ?? '');

      const pieces = piecesFromTitle(p.title ?? '');

      const record: Record<string, string> = {
        id: String(p.sku || p.id),
        title: truncate(p.title ?? '', MAX_TITLE),
        description,
        // Meta's docs are inconsistent on whether "preorder" is accepted here;
        // "available for order" is valid in every published spec and carries the
        // same meaning (orderable, not currently in the warehouse). An invalid
        // value gets the whole row rejected, so use the one that always works.
        availability: inStock ? 'in stock' : 'available for order',
        condition: 'new',
        price,
        sale_price: salePrice,
        link: `${SITE_URL}/produktas/${p.slug}`,
        image_link: images[0],
        // Meta allows 20 extra images, but each is another download during
        // ingestion; 5 is plenty for carousel/collection ads.
        additional_image_link: images.slice(1, 6).join(','),
        brand: BRAND,
        quantity_to_sell_on_facebook: String(qty),
        product_type: productType,
        custom_label_0: pieces > 0 ? `${pieces} dalių` : '',
      };

      lines.push(COLUMNS.map(c => csvCell(record[c])).join(','));
    }

    // CRLF is the RFC 4180 record separator and the safest for Meta's parser.
    const csv = lines.join('\r\n') + '\r\n';

    console.log(`Facebook feed: ${lines.length - 1} products (${skipped} skipped, filter=${stockFilter ?? 'all'})`);

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'inline; filename="ibrix-facebook-feed.csv"',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (err) {
    console.error('Facebook feed error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
});
