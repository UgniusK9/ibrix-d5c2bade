import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = 'https://ibrix.lt';
const STORE_NAME = 'ibrix.lt';
const BRAND = 'MOULD KING';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function mapAvailability(stock: string): string {
  if (stock === 'in_stock') return 'in stock';
  if (stock === 'preorder') return 'preorder';
  return 'out of stock';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: products, error } = await supabase
      .from('products')
      .select('id, sku, slug, title, short_desc, category, stock_status, price_eur, sale_price_eur, images, updated_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const now = new Date().toUTCString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(STORE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>MOULD KING konstruktoriai – oficialus platintojas Lietuvoje</description>
    <lastBuildDate>${now}</lastBuildDate>
`;

    for (const p of (products ?? [])) {
      const images: string[] = Array.isArray(p.images) ? p.images : [];
      const mainImage = images[0] ?? '';
      const additionalImages = images.slice(1, 11); // g: allows up to 10 additional

      const price = `${Number(p.price_eur).toFixed(2)} EUR`;
      const salePrice = p.sale_price_eur ? `${Number(p.sale_price_eur).toFixed(2)} EUR` : null;
      const availability = mapAvailability(p.stock_status);
      const productUrl = `${SITE_URL}/produktas/${p.slug}`;
      const description = escapeXml((p.short_desc ?? p.title ?? '').trim());
      const title = escapeXml((p.title ?? '').trim());
      const mpn = escapeXml(p.sku ?? '');

      xml += `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(mainImage)}</g:image_link>
`;
      for (const img of additionalImages) {
        xml += `      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>\n`;
      }
      xml += `      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
`;
      if (salePrice) {
        xml += `      <g:sale_price>${salePrice}</g:sale_price>\n`;
      }
      xml += `      <g:condition>new</g:condition>
      <g:brand>${BRAND}</g:brand>
      <g:mpn>${mpn}</g:mpn>
      <g:identifier_exists>no</g:identifier_exists>
    </item>
`;
    }

    xml += `  </channel>\n</rss>`;

    console.log(`Generated product feed with ${products?.length ?? 0} products`);

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('Product feed error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
});
