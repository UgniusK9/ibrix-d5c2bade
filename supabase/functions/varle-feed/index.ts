import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Varlė.lt marketplace XML feed.
// Schema: https://zinynas.varle.lt/en/marketplace/xml-structure-and-instructions
// Template: varle_xml_mp_(1a_1) — <root> → <categories> + <products>
//
// Query params:
//   ?stock=in_stock   only warehouse stock (skips pre-orders)
//   ?stock=preorder   only pre-orders
//   (default: everything active)

const SITE_URL = 'https://ibrix.lt';
const BRAND = 'MOULD KING';

// Statutory minimum warranty for new goods sold to consumers in Lithuania.
const WARRANTY_MONTHS = 24;

// Pre-orders have no physical stock; this is the quantity Varlė is allowed to sell
// against while the batch is in transit.
const PREORDER_QTY = 5;

// Guard against test/placeholder rows reaching a live marketplace. The 1-cent
// checkout test product is active in the catalogue and must never be sellable
// on Varlė.
const MIN_PRICE_EUR = 1;

function escapeXml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Nested CDATA terminators must be split or the document breaks.
function cdata(str: string): string {
  return `<![CDATA[${String(str ?? '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

// Fallback only — real names come from the `categories` table. The legacy
// `category` enum is a slug, so sending it raw would show Varlė "tankai-ir-sarvuociai".
function humanizeSlug(slug: string): string {
  const s = String(slug ?? '').trim();
  if (!s) return 'Kiti konstruktoriai';
  const words = s.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// Piece counts live in the product title ("... Konstruktorius | 1,203 dalių"),
// not in details_json, which is empty across the catalogue.
const PIECES_RE = /\|\s*([\d.,\s]+?)\s*dali[ųu]\s*$/i;

function piecesFromTitle(title: string): number {
  const m = String(title ?? '').match(PIECES_RE);
  if (!m) return 0;
  const n = parseInt(m[1].replace(/[.,\s]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

function absoluteUrl(url: string): string {
  const u = String(url ?? '').trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  return `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`;
}

// Source images are 2000x2000 PNGs averaging 1.5 MB. Shopify's CDN resizes on the
// fly, so asking for 1024px cuts roughly two thirds of the bytes the importer
// has to pull, with no visible quality loss.
const IMAGE_WIDTH = 1024;

function sizedImage(url: string): string {
  const u = absoluteUrl(url);
  if (!u) return '';
  if (!/(^|\.)cdn\.shopify\.com/i.test(new URL(u).hostname)) return u;
  if (/[?&]width=/i.test(u)) return u;
  return `${u}${u.includes('?') ? '&' : '?'}width=${IMAGE_WIDTH}`;
}

// Varlė wants HTML in <description>. Wrap plain text so it renders as a paragraph.
function toHtml(text: string): string {
  const t = String(text ?? '').trim();
  if (!t) return '';
  if (/<[a-z][\s\S]*>/i.test(t)) return t;
  return t
    .split(/\n{2,}/)
    .map(p => `<p>${escapeXml(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

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

    // Proper Lithuanian names (with diacritics) live in `categories`; the
    // `category` enum on products is only a slug.
    const { data: catRows, error: catErr } = await supabase
      .from('categories')
      .select('id, slug, name');
    if (catErr) throw catErr;

    const catNameById = new Map<string, string>();
    for (const c of (catRows ?? [])) {
      if (c.id && c.name) catNameById.set(c.id, c.name);
    }

    let query = supabase
      .from('products')
      .select('id, sku, slug, title, short_desc, description, category, category_id, stock_status, price_eur, sale_price_eur, images, inventory_qty, preorder_eta_weeks_min, preorder_eta_weeks_max, details_json')
      .eq('status', 'active');

    if (stockFilter === 'in_stock' || stockFilter === 'preorder') {
      query = query.eq('stock_status', stockFilter);
    } else {
      query = query.in('stock_status', ['in_stock', 'preorder']);
    }

    const { data: products, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    const rows = (products ?? []).filter(p => Number(p.price_eur) >= MIN_PRICE_EUR);

    // Resolve each product to a display name, preferring the categories table.
    const nameFor = (p: { category_id?: string | null; category?: string | null }) =>
      (p.category_id ? catNameById.get(p.category_id) : null) ?? humanizeSlug(p.category ?? '');

    // Flat category list — Varlė recommends sending the final category only.
    const categoryIds: Record<string, number> = {};
    for (const p of rows) {
      const n = nameFor(p);
      if (!(n in categoryIds)) categoryIds[n] = Object.keys(categoryIds).length + 1;
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <categories>\n`;

    for (const [name, id] of Object.entries(categoryIds)) {
      xml += `    <category>\n`;
      xml += `      <id>${id}</id>\n`;
      xml += `      <parent></parent>\n`;
      xml += `      <name>${cdata(name)}</name>\n`;
      xml += `    </category>\n`;
    }

    xml += `  </categories>\n  <products>\n`;

    let skipped = 0;

    for (const p of rows) {
      const images: string[] = (Array.isArray(p.images) ? p.images : [])
        .map((i: unknown) => sizedImage(typeof i === 'string' ? i : (i as { url?: string })?.url ?? ''))
        .filter(Boolean);

      // Varlė requires at least one photo — a product without one would be rejected.
      if (images.length === 0) { skipped++; continue; }

      const inStock = p.stock_status === 'in_stock';

      const hasSale = p.sale_price_eur != null && Number(p.sale_price_eur) < Number(p.price_eur);
      const price = (hasSale ? Number(p.sale_price_eur) : Number(p.price_eur)).toFixed(2);
      const priceOld = hasSale ? Number(p.price_eur).toFixed(2) : null;

      const qty = inStock ? (p.inventory_qty ?? 0) : PREORDER_QTY;
      if (inStock && qty <= 0) { skipped++; continue; }

      // Spec asks for working days. Pre-order ETA is stored in weeks (~5 working days each).
      const wMin = p.preorder_eta_weeks_min ?? 8;
      const wMax = p.preorder_eta_weeks_max ?? 10;
      const deliveryText = inStock ? '1-2 d. d.' : `${wMin * 5}-${wMax * 5} d. d.`;

      const descHtml = toHtml(p.description || p.short_desc || p.title || '');
      const pieces = piecesFromTitle(p.title ?? '');

      // No EAN column exists yet; read it from details_json so the feed starts
      // emitting barcodes the moment that data is filled in.
      const dj = (p.details_json ?? {}) as Record<string, unknown>;
      const barcode = String(dj.ean ?? dj.barcode ?? '').trim();

      const catId = categoryIds[nameFor(p)] ?? 1;
      const productId = p.sku || p.id;

      xml += `    <product>\n`;
      xml += `      <id>${escapeXml(productId)}</id>\n`;
      xml += `      <categories>\n        <category>${catId}</category>\n      </categories>\n`;
      xml += `      <title>${cdata(p.title ?? '')}</title>\n`;
      xml += `      <description>${cdata(descHtml)}</description>\n`;
      xml += `      <price>${price}</price>\n`;
      xml += `      <delivery_text>${escapeXml(deliveryText)}</delivery_text>\n`;
      xml += `      <images>\n`;
      for (const img of images.slice(0, 10)) {
        xml += `        <image>${cdata(img)}</image>\n`;
      }
      xml += `      </images>\n`;
      xml += `      <quantity>${qty}</quantity>\n`;

      if (barcode) {
        xml += `      <barcode_format>EAN</barcode_format>\n`;
        xml += `      <barcode>${escapeXml(barcode)}</barcode>\n`;
      }

      xml += `      <model>${cdata(p.sku ?? '')}</model>\n`;
      xml += `      <manufacturer>${cdata(BRAND)}</manufacturer>\n`;

      if (pieces > 0) {
        xml += `      <attributes>\n`;
        xml += `        <attribute title="Dalių skaičius">${cdata(String(pieces))}</attribute>\n`;
        xml += `      </attributes>\n`;
      }

      xml += `      <url>${cdata(`${SITE_URL}/produktas/${p.slug}`)}</url>\n`;
      if (priceOld) {
        xml += `      <price_old>${priceOld}</price_old>\n`;
      }
      xml += `      <warranty>${WARRANTY_MONTHS}</warranty>\n`;
      xml += `    </product>\n`;
    }

    xml += `  </products>\n</root>\n`;

    console.log(`Varle feed: ${rows.length - skipped} products (${skipped} skipped, filter=${stockFilter ?? 'all'})`);

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (err) {
    console.error('Varle feed error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
});
