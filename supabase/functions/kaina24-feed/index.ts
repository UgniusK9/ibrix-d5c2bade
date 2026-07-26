import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = 'https://ibrix.lt';
const STORE_NAME = 'IBRIX.lt';
const COMPANY = 'IBRIX';
const BRAND = 'MOULD KING';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Map our category slugs/names to human-readable Lithuanian names
function mapCategory(category: string): string {
  const map: Record<string, string> = {
    engines: 'Varikliai',
    sports_cars: 'Sportiniai automobiliai',
    trucks: 'Sunkvežimiai',
    motorcycles: 'Motociklai',
    aircraft: 'Orlaiviai',
    ships: 'Laivai',
    tanks: 'Tankai',
    buildings: 'Pastatai',
    trains: 'Traukiniai',
    robots: 'Robotai',
    animals: 'Gyvūnai',
    flowers: 'Gėlės',
    other: 'Kiti konstruktoriai',
  };
  return map[category] ?? category;
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: products, error } = await supabase
      .from('products')
      .select('id, sku, slug, title, short_desc, description, category, stock_status, price_eur, sale_price_eur, images, inventory_qty, preorder_eta_weeks_min, preorder_eta_weeks_max, details_json')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Collect unique categories
    const categorySet = new Set<string>();
    for (const p of (products ?? [])) categorySet.add(p.category ?? 'other');
    const categories = Array.from(categorySet);
    const categoryIds: Record<string, number> = {};
    categories.forEach((c, i) => { categoryIds[c] = i + 1; });

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${now}">
  <shop>
    <name>${escapeXml(STORE_NAME)}</name>
    <company>${escapeXml(COMPANY)}</company>
    <url>${SITE_URL}</url>
    <currencies>
      <currency id="EUR" rate="1"/>
    </currencies>
    <categories>
`;

    for (const cat of categories) {
      xml += `      <category id="${categoryIds[cat]}">${escapeXml(mapCategory(cat))}</category>\n`;
    }

    xml += `    </categories>
    <delivery-options>
      <option cost="0" days="2" order-before="14"/>
    </delivery-options>
    <offers>
`;

    for (const p of (products ?? [])) {
      const images: string[] = Array.isArray(p.images) ? p.images : [];
      const mainImage = images[0] ?? '';
      const extraImages = images.slice(1, 10);

      const inStock = p.stock_status === 'in_stock';
      const isPreorder = p.stock_status === 'preorder';
      const available = inStock || isPreorder;

      const price = p.sale_price_eur && p.sale_price_eur < p.price_eur
        ? Number(p.sale_price_eur).toFixed(2)
        : Number(p.price_eur).toFixed(2);
      const oldPrice = p.sale_price_eur && p.sale_price_eur < p.price_eur
        ? Number(p.price_eur).toFixed(2)
        : null;

      const productUrl = `${SITE_URL}/produktas/${p.slug}`;
      const catId = categoryIds[p.category ?? 'other'] ?? 1;

      const desc = escapeXml(
        (p.short_desc ?? p.description ?? p.title ?? '').trim()
      );
      const title = escapeXml((p.title ?? '').trim());
      const sku = escapeXml(p.sku ?? '');

      const detailsCount = (p.details_json as any)?.detailsCount as number | undefined;

      // Delivery days: in_stock = 2, preorder = ETA range
      const etaMin = p.preorder_eta_weeks_min ? p.preorder_eta_weeks_min * 7 : 60;
      const etaMax = p.preorder_eta_weeks_max ? p.preorder_eta_weeks_max * 7 : 70;
      const deliveryDays = inStock ? '2' : `${etaMin}-${etaMax}`;

      xml += `      <offer id="${sku}" available="${available ? 'true' : 'false'}">
        <url>${escapeXml(productUrl)}</url>
        <price>${price}</price>
`;
      if (oldPrice) {
        xml += `        <oldprice>${oldPrice}</oldprice>\n`;
      }
      xml += `        <currencyId>EUR</currencyId>
        <categoryId>${catId}</categoryId>
`;
      if (mainImage) {
        xml += `        <picture>${escapeXml(mainImage)}</picture>\n`;
      }
      for (const img of extraImages) {
        xml += `        <picture>${escapeXml(img)}</picture>\n`;
      }
      xml += `        <delivery>true</delivery>
        <delivery-options>
          <option cost="0" days="${deliveryDays}" order-before="14"/>
        </delivery-options>
        <name>${title}</name>
        <vendor>${BRAND}</vendor>
        <model>${sku}</model>
        <description><![CDATA[${(p.short_desc ?? p.description ?? p.title ?? '').trim()}]]></description>
        <manufacturer_warranty>true</manufacturer_warranty>
        <condition>new</condition>
`;
      if (inStock && p.inventory_qty != null) {
        xml += `        <stock_quantity>${p.inventory_qty}</stock_quantity>\n`;
      }
      if (isPreorder) {
        xml += `        <pickup>false</pickup>\n`;
      }
      if (detailsCount) {
        xml += `        <param name="Dalių skaičius" unit="vnt.">${detailsCount}</param>\n`;
      }
      xml += `        <param name="Gamintojas">${BRAND}</param>
        <param name="SKU">${sku}</param>
      </offer>
`;
    }

    xml += `    </offers>
  </shop>
</yml_catalog>`;

    console.log(`Kaina24 feed: ${products?.length ?? 0} products`);

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (err) {
    console.error('Kaina24 feed error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
});
