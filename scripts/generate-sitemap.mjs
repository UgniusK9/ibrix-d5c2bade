#!/usr/bin/env node
/**
 * Build-time sitemap generator.
 * Queries Supabase for active products and writes public/sitemap.xml.
 * Runs automatically before `vite build` via the npm `prebuild` hook.
 *
 * Reads env from process.env, falling back to a local .env file so it works
 * both locally and on Vercel (where env vars come from the dashboard).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SITE_URL = process.env.SITE_URL || "https://ibrix.lt";

function loadDotEnv() {
  const path = resolve(ROOT, ".env");
  if (!existsSync(path)) return;
  const src = readFileSync(path, "utf8");
  for (const line of src.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n\r]*)"?\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadDotEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const staticPages = [
  { loc: "", priority: "1.0", changefreq: "daily" },
  { loc: "/produktai/visi", priority: "0.9", changefreq: "daily" },
  { loc: "/produktai/varikliai", priority: "0.9", changefreq: "daily" },
  { loc: "/pre-order", priority: "0.8", changefreq: "weekly" },
  { loc: "/dovanu-kuponai", priority: "0.7", changefreq: "monthly" },
  { loc: "/apie", priority: "0.7", changefreq: "monthly" },
  { loc: "/kontaktai", priority: "0.7", changefreq: "monthly" },
  { loc: "/pristatymas", priority: "0.6", changefreq: "monthly" },
  { loc: "/garantija", priority: "0.6", changefreq: "monthly" },
  { loc: "/grazinimai", priority: "0.6", changefreq: "monthly" },
  { loc: "/pagalba", priority: "0.6", changefreq: "monthly" },
  { loc: "/trukstamos-detales", priority: "0.5", changefreq: "monthly" },
  { loc: "/palyginti", priority: "0.5", changefreq: "weekly" },
  { loc: "/atsiliepimai", priority: "0.5", changefreq: "weekly" },
  { loc: "/privatumo-politika", priority: "0.4", changefreq: "yearly" },
  { loc: "/slapukai", priority: "0.4", changefreq: "yearly" },
  { loc: "/taisykles", priority: "0.4", changefreq: "yearly" },
];

async function fetchProducts() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[sitemap] Supabase env not set; writing static-only sitemap.");
    return [];
  }
  const url = `${SUPABASE_URL}/rest/v1/products?select=slug,updated_at&status=eq.active`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) {
    console.warn(`[sitemap] Supabase fetch failed (${res.status}); static-only.`);
    return [];
  }
  return await res.json();
}

function xmlEscape(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  }[c]));
}

function buildSitemap(products) {
  const today = new Date().toISOString().split("T")[0];
  const urls = [
    ...staticPages.map((p) => ({
      loc: `${SITE_URL}${p.loc}`,
      lastmod: today,
      changefreq: p.changefreq,
      priority: p.priority,
    })),
    ...products.map((p) => ({
      loc: `${SITE_URL}/produktas/${p.slug}`,
      lastmod: (p.updated_at ? new Date(p.updated_at) : new Date())
        .toISOString()
        .split("T")[0],
      changefreq: "weekly",
      priority: "0.8",
    })),
  ];

  const body = urls
    .map(
      (u) => `  <url>
    <loc>${xmlEscape(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

async function main() {
  const products = await fetchProducts();
  const xml = buildSitemap(products);
  const out = resolve(ROOT, "public", "sitemap.xml");
  writeFileSync(out, xml, "utf8");
  console.log(
    `[sitemap] Wrote ${out} — ${staticPages.length} static + ${products.length} products.`
  );
}

main().catch((err) => {
  console.error("[sitemap] Generation failed:", err);
  process.exit(0); // don't fail the build; keep any existing sitemap.xml
});