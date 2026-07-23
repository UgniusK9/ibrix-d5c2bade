import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Public scraper: fetches Shopify-style product JSON from a given product URL
// and returns normalized fields for pre-filling the admin create-product form.

function extractHandle(url: string): { origin: string; handle: string } | null {
  try {
    const u = new URL(url);
    // Expected: /products/<handle> possibly with trailing segments/query
    const parts = u.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex((p) => p === 'products');
    if (idx === -1 || !parts[idx + 1]) return null;
    const handle = parts[idx + 1].split('?')[0];
    return { origin: u.origin, handle };
  } catch {
    return null;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'URL yra būtinas' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = extractHandle(url);
    if (!parsed) {
      return new Response(JSON.stringify({ success: false, error: 'Nepavyko atpažinti produkto URL (turi būti /products/<handle>)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const jsonUrl = `${parsed.origin}/products/${parsed.handle}.json`;
    const res = await fetch(jsonUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[SCRAPE] ${jsonUrl} → ${res.status}: ${text.slice(0, 200)}`);
      return new Response(
        JSON.stringify({ success: false, error: `Nepavyko gauti produkto duomenų (HTTP ${res.status})` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const payload = await res.json();
    const p = payload?.product;
    if (!p) {
      return new Response(JSON.stringify({ success: false, error: 'Netikėtas atsakymo formatas' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const variant = Array.isArray(p.variants) && p.variants[0] ? p.variants[0] : null;
    const priceStr: string = variant?.price ?? '0';
    const price = Number.parseFloat(priceStr) || 0;
    const images: string[] = Array.isArray(p.images)
      ? p.images.map((img: any) => img?.src).filter((s: any) => typeof s === 'string')
      : [];

    const description = stripHtml(String(p.body_html || ''));
    const shortDesc = description.split('\n').find((l: string) => l.trim().length > 0)?.slice(0, 240) || '';

    const result = {
      handle: p.handle,
      title: String(p.title || '').trim(),
      description,
      short_desc: shortDesc,
      source_price: price, // in the store's currency (usually USD for mouldkingcorp)
      source_currency: 'USD',
      sku: (variant?.sku && String(variant.sku)) || String(p.handle || '').toUpperCase(),
      images,
      vendor: p.vendor || null,
      product_type: p.product_type || null,
      tags: typeof p.tags === 'string' ? p.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      source_url: url,
    };

    return new Response(JSON.stringify({ success: true, product: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[SCRAPE] Error:', e);
    return new Response(JSON.stringify({ success: false, error: e.message || 'Klaida' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
