import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=utf-8',
};

const SITE_URL = 'https://ibrix.lt';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch all active products
    const { data: products, error } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    const today = new Date().toISOString().split('T')[0];

    // Static pages
    const staticPages = [
      { loc: '', priority: '1.0', changefreq: 'daily' },
      { loc: '/varikliai', priority: '0.9', changefreq: 'daily' },
      { loc: '/apie', priority: '0.7', changefreq: 'monthly' },
      { loc: '/kontaktai', priority: '0.7', changefreq: 'monthly' },
      { loc: '/pristatymas', priority: '0.6', changefreq: 'monthly' },
      { loc: '/garantija', priority: '0.6', changefreq: 'monthly' },
      { loc: '/grazinimai', priority: '0.6', changefreq: 'monthly' },
      { loc: '/pagalba', priority: '0.6', changefreq: 'monthly' },
      { loc: '/privatumo-politika', priority: '0.4', changefreq: 'yearly' },
      { loc: '/slapukai-politika', priority: '0.4', changefreq: 'yearly' },
      { loc: '/taisykles', priority: '0.4', changefreq: 'yearly' },
    ];

    // Build sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages
    for (const page of staticPages) {
      sitemap += `  <url>
    <loc>${SITE_URL}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Add product pages
    if (products && products.length > 0) {
      for (const product of products) {
        const lastmod = product.updated_at 
          ? new Date(product.updated_at).toISOString().split('T')[0]
          : today;
        
        sitemap += `  <url>
    <loc>${SITE_URL}/produktas/${product.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }

    sitemap += `</urlset>`;

    console.log(`Generated sitemap with ${staticPages.length} static pages and ${products?.length || 0} products`);

    return new Response(sitemap, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`,
      { headers: corsHeaders }
    );
  }
});
