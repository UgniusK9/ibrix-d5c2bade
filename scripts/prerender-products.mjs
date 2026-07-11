#!/usr/bin/env node
/**
 * Build-time prerender for /produktas/:slug pages.
 *
 * Runs AFTER `vite build`. For each active product in Supabase, writes
 * `dist/produktas/<slug>/index.html` — a copy of the SPA shell with
 * per-product <title>, meta description, canonical, og:*, twitter:*
 * and Product JSON-LD injected into <head>.
 *
 * Vercel serves existing static files before the SPA rewrite, so these
 * files are used automatically for crawlers and direct hits, while the
 * React app still hydrates on top of them exactly as before.
 *
 * Fully isolated: no runtime app code is touched. If Supabase env is
 * missing or the fetch fails, we skip prerendering and leave the SPA
 * fallback in place.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");
const SITE_URL = (process.env.SITE_URL || "https://ibrix.lt").replace(/\/$/, "");

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

function htmlEscape(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function firstImage(images) {
  if (!images) return null;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") return first.url || first.src || null;
  }
  return null;
}

function truncate(str, max = 160) {
  const s = String(str ?? "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

async function fetchProducts() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[prerender] Supabase env not set; skipping product prerender.");
    return [];
  }
  const fields = [
    "slug", "title", "short_desc", "description",
    "price_eur", "sale_price_eur", "sku",
    "stock_status", "inventory_qty", "images", "updated_at",
  ].join(",");
  const url = `${SUPABASE_URL}/rest/v1/products?select=${fields}&status=eq.active`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) {
    console.warn(`[prerender] Supabase fetch failed (${res.status}); skipping.`);
    return [];
  }
  return await res.json();
}

function availability(p) {
  if (p.stock_status === "preorder") return "https://schema.org/PreOrder";
  if ((p.inventory_qty ?? 0) <= 0) return "https://schema.org/OutOfStock";
  return "https://schema.org/InStock";
}

function buildHead(p) {
  const url = `${SITE_URL}/produktas/${p.slug}`;
  const title = `${p.title} | IBRIX`;
  const desc = truncate(p.short_desc || p.description || `${p.title} — IBRIX konstruktorius.`);
  const image = firstImage(p.images);
  const price = Number(p.sale_price_eur ?? p.price_eur ?? 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: desc,
    ...(image ? { image } : {}),
    ...(p.sku ? { sku: p.sku } : {}),
    brand: { "@type": "Brand", name: "IBRIX" },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "EUR",
      price: price.toFixed(2),
      availability: availability(p),
      seller: { "@type": "Organization", name: "IBRIX" },
    },
  };

  return [
    `<title>${htmlEscape(title)}</title>`,
    `<meta name="description" content="${htmlEscape(desc)}" />`,
    `<link rel="canonical" href="${htmlEscape(url)}" />`,
    `<meta property="og:type" content="product" />`,
    `<meta property="og:title" content="${htmlEscape(title)}" />`,
    `<meta property="og:description" content="${htmlEscape(desc)}" />`,
    `<meta property="og:url" content="${htmlEscape(url)}" />`,
    image ? `<meta property="og:image" content="${htmlEscape(image)}" />` : "",
    `<meta property="product:price:amount" content="${price.toFixed(2)}" />`,
    `<meta property="product:price:currency" content="EUR" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${htmlEscape(title)}" />`,
    `<meta name="twitter:description" content="${htmlEscape(desc)}" />`,
    image ? `<meta name="twitter:image" content="${htmlEscape(image)}" />` : "",
    `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
  ].filter(Boolean).join("\n    ");
}

/**
 * Rewrite the SPA shell's <head>:
 *  - strip the generic <title> and <meta name="description">
 *  - strip any generic og:*/twitter:*/canonical the shell ships with
 *  - inject the product-specific block just before </head>
 *
 * We deliberately DO NOT touch <script>, <link rel="stylesheet">, or
 * anything else — Vite's built shell must load unchanged so hydration
 * works exactly like the SPA route.
 */
function injectHead(shell, headBlock) {
  let html = shell;
  html = html.replace(/\s*<title>[\s\S]*?<\/title>/i, "");
  html = html.replace(
    /\s*<meta\s+name=["']description["'][^>]*>/gi, ""
  );
  html = html.replace(
    /\s*<meta\s+property=["'](?:og:[^"']+)["'][^>]*>/gi, ""
  );
  html = html.replace(
    /\s*<meta\s+name=["']twitter:[^"']+["'][^>]*>/gi, ""
  );
  html = html.replace(
    /\s*<link\s+rel=["']canonical["'][^>]*>/gi, ""
  );
  return html.replace(/<\/head>/i, `    ${headBlock}\n  </head>`);
}

async function main() {
  if (!existsSync(DIST)) {
    console.warn("[prerender] dist/ not found; skipping.");
    return;
  }
  const shellPath = resolve(DIST, "index.html");
  if (!existsSync(shellPath)) {
    console.warn("[prerender] dist/index.html not found; skipping.");
    return;
  }
  const shell = readFileSync(shellPath, "utf8");

  const products = await fetchProducts();
  if (products.length === 0) {
    console.log("[prerender] No products to prerender.");
    return;
  }

  let written = 0;
  for (const p of products) {
    if (!p.slug) continue;
    const html = injectHead(shell, buildHead(p));
    const outDir = resolve(DIST, "produktas", p.slug);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, "index.html"), html, "utf8");
    written++;
  }
  console.log(`[prerender] Wrote ${written} product page(s) under dist/produktas/.`);
}

main().catch((err) => {
  console.error("[prerender] Failed:", err);
  process.exit(0); // never fail the build; SPA fallback still works
});