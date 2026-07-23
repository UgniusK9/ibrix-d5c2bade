import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Public scraper: fetches Shopify-style product JSON from a product OR collection URL.
// Optionally translates title/description to Lithuanian via Lovable AI Gateway.

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

function parseShopifyUrl(url: string):
  | { kind: 'product'; origin: string; handle: string }
  | { kind: 'collection'; origin: string; handle: string }
  | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    const pIdx = parts.findIndex((p) => p === 'products');
    if (pIdx !== -1 && parts[pIdx + 1]) {
      return { kind: 'product', origin: u.origin, handle: parts[pIdx + 1].split('?')[0] };
    }
    const cIdx = parts.findIndex((p) => p === 'collections');
    if (cIdx !== -1 && parts[cIdx + 1]) {
      return { kind: 'collection', origin: u.origin, handle: parts[cIdx + 1].split('?')[0] };
    }
    return null;
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

async function translateToLithuanian(fields: { title: string; short: string; long: string }) {
  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) return null;
  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': key,
        'X-Lovable-AIG-SDK': 'edge-function-fetch',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content:
              'You translate product copy from English to natural, fluent Lithuanian. Preserve line breaks, bullet points (•), numbers, units and model/brand names (e.g. LFA V10, MOULD KING). Do NOT add commentary. Return ONLY strict JSON with keys: title, short, long.',
          },
          { role: 'user', content: JSON.stringify(fields) },
        ],
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) {
      console.error('[TRANSLATE]', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Model occasionally emits invalid escape sequences; strip lone backslashes and retry.
      try {
        parsed = JSON.parse(content.replace(/\\(?!["\\/bfnrtu])/g, ''));
      } catch (e) {
        console.error('[TRANSLATE] JSON parse failed', e);
        return null;
      }
    }
    return {
      title: typeof parsed.title === 'string' ? parsed.title : fields.title,
      short: typeof parsed.short === 'string' ? parsed.short : fields.short,
      long: typeof parsed.long === 'string' ? parsed.long : fields.long,
    };
  } catch (e) {
    console.error('[TRANSLATE] error', e);
    return null;
  }
}

async function fetchProductByHandle(origin: string, handle: string) {
  const jsonUrl = `${origin}/products/${handle}.json`;
  const res = await fetch(jsonUrl, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${jsonUrl}`);
  const payload = await res.json();
  return payload?.product;
}

async function normalizeProduct(p: any, sourceUrl: string, translate: boolean) {
  const variant = Array.isArray(p.variants) && p.variants[0] ? p.variants[0] : null;
  const price = Number.parseFloat(variant?.price ?? '0') || 0;
  const images: string[] = Array.isArray(p.images)
    ? p.images.map((img: any) => img?.src).filter((s: any) => typeof s === 'string')
    : [];

  let title = String(p.title || '').trim();
  let description = stripHtml(String(p.body_html || ''));
  let shortDesc = description.split('\n').find((l: string) => l.trim().length > 0)?.slice(0, 240) || '';

  if (translate && (title || description)) {
    const t = await translateToLithuanian({ title, short: shortDesc, long: description });
    if (t) {
      title = t.title;
      shortDesc = t.short;
      description = t.long;
    }
  }

  return {
    handle: p.handle,
    title,
    description,
    short_desc: shortDesc,
    source_price: price,
    source_currency: 'USD',
    sku: (variant?.sku && String(variant.sku)) || String(p.handle || '').toUpperCase(),
    images,
    vendor: p.vendor || null,
    product_type: p.product_type || null,
    tags: typeof p.tags === 'string' ? p.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    source_url: sourceUrl,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { url, translate = false } = body;
    const requestedLimit = Math.max(1, Number.parseInt(String(body.limit ?? '50'), 10) || 50);
    const page = Math.max(1, Number.parseInt(String(body.page ?? '1'), 10) || 1);
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'URL yra būtinas' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = parseShopifyUrl(url);
    if (!parsed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nepavyko atpažinti URL (turi būti /products/<handle> arba /collections/<handle>)',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (parsed.kind === 'product') {
      const p = await fetchProductByHandle(parsed.origin, parsed.handle);
      if (!p) {
        return new Response(JSON.stringify({ success: false, error: 'Netikėtas atsakymo formatas' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const product = await normalizeProduct(p, url, !!translate);
      return new Response(JSON.stringify({ success: true, products: [product], hasMore: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // COLLECTION: one small page per request. The admin UI loops pages so large
    // catalogs never keep a single edge invocation open long enough to timeout.
    const perRequestCap = translate ? 6 : 30;
    const perPage = Math.min(requestedLimit, perRequestCap);
    const cUrl = `${parsed.origin}/collections/${parsed.handle}/products.json?limit=${perPage}&page=${page}`;
    const r = await fetch(cUrl, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (!r.ok) {
      console.error(`[SCRAPE COLLECTION] ${cUrl} → ${r.status}`);
      return new Response(JSON.stringify({ success: false, error: `Kolekcijos nuskaitymas nepavyko (HTTP ${r.status})` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pl = await r.json();
    const items: any[] = Array.isArray(pl?.products) ? pl.products : [];

    const products: any[] = [];
    const BATCH = translate ? 5 : 15;
    for (let i = 0; i < items.length; i += BATCH) {
      const chunk = items.slice(i, i + BATCH);
      const results = await Promise.all(
        chunk.map(async (p) => {
          const srcUrl = `${parsed.origin}/products/${p.handle}`;
          try {
            return await normalizeProduct(p, srcUrl, !!translate);
          } catch (e) {
            console.error('normalize failed for', p?.handle, e);
            return null;
          }
        }),
      );
      for (const r of results) if (r) products.push(r);
    }

    return new Response(
      JSON.stringify({
        success: true,
        products,
        collection: parsed.handle,
        total: products.length,
        page,
        nextPage: page + 1,
        hasMore: items.length === perPage,
        perPage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e: any) {
    console.error('[SCRAPE] Error:', e);
    return new Response(JSON.stringify({ success: false, error: e.message || 'Klaida' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});