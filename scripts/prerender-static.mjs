#!/usr/bin/env node
/**
 * Build-time prerender for non-product routes.
 *
 * Runs AFTER `vite build`, alongside prerender-products.mjs. Writes
 * `dist/<route>/index.html` — a copy of the SPA shell with per-route
 * <title>, meta description, canonical and og / twitter tags injected.
 *
 * Why this exists: social crawlers (facebookexternalhit, TikTok, WhatsApp,
 * Telegram, LinkedIn, Discord) do not execute JavaScript, so the tags that
 * SEOHead renders via react-helmet never reach them. Product pages were
 * already covered by prerender-products.mjs; every other route fell back to
 * the generic shell, meaning `/`, `/produktai/visi` and `/pre-order` all
 * shared one identical share card and one identical <title> in search.
 *
 * The homepage is deliberately NOT written here — it is served from
 * dist/index.html, whose tags already describe the homepage.
 *
 * Fully isolated: no runtime app code is touched, and a failure never fails
 * the build (the SPA fallback still works exactly as before).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");
const SITE_URL = (process.env.SITE_URL || "https://ibrix.lt").replace(/\/$/, "");

/**
 * Per-route SEO copy, shared with the runtime RouteSEO component so the tags
 * crawlers see and the tags client-side navigation sets cannot drift apart.
 */
const pages = JSON.parse(
  readFileSync(resolve(ROOT, "src", "config", "seoPages.json"), "utf8")
).pages;

// Guide articles are prerendered too — they are the pages most likely to be
// found through search and shared, so their head tags must be crawler-visible.
const articles = JSON.parse(
  readFileSync(resolve(ROOT, "src", "content", "articles.json"), "utf8")
).articles.map((a) => ({
  loc: `/patarimai/${a.slug}`,
  title: a.title,
  desc: a.description,
  type: "article",
}));

function htmlEscape(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

/**
 * Reuse whatever og:image the built shell already ships with, so this script
 * never hardcodes an asset path that might not exist.
 */
function shellOgImage(shell) {
  const m = shell.match(
    /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
  );
  return m ? m[1] : null;
}

function buildHead(page, ogImage) {
  const url = `${SITE_URL}${page.loc}`;
  const title = `${page.title} | IBRIX`;
  // react-helmet-async only manages tags carrying data-rh. Marking the
  // prerendered tags means Helmet REPLACES them once React mounts instead of
  // appending a second description/canonical alongside them.
  const rh = 'data-rh="true"';

  return [
    `<title>${htmlEscape(title)}</title>`,
    `<meta ${rh} name="description" content="${htmlEscape(page.desc)}" />`,
    `<link ${rh} rel="canonical" href="${htmlEscape(url)}" />`,
    `<meta ${rh} property="og:type" content="${page.type === "article" ? "article" : "website"}" />`,
    `<meta ${rh} property="og:title" content="${htmlEscape(title)}" />`,
    `<meta ${rh} property="og:description" content="${htmlEscape(page.desc)}" />`,
    `<meta ${rh} property="og:url" content="${htmlEscape(url)}" />`,
    `<meta ${rh} property="og:site_name" content="IBRIX" />`,
    `<meta ${rh} property="og:locale" content="lt_LT" />`,
    ogImage ? `<meta ${rh} property="og:image" content="${htmlEscape(ogImage)}" />` : "",
    `<meta ${rh} name="twitter:card" content="summary_large_image" />`,
    `<meta ${rh} name="twitter:title" content="${htmlEscape(title)}" />`,
    `<meta ${rh} name="twitter:description" content="${htmlEscape(page.desc)}" />`,
    ogImage ? `<meta ${rh} name="twitter:image" content="${htmlEscape(ogImage)}" />` : "",
  ].filter(Boolean).join("\n    ");
}

/**
 * Same head rewrite as prerender-products.mjs: strip the shell's generic tags,
 * inject the route-specific block. <script> and <link rel="stylesheet"> are
 * left untouched so the React app boots identically.
 */
function injectHead(shell, headBlock) {
  let html = shell;
  html = html.replace(/\s*<title>[\s\S]*?<\/title>/i, "");
  html = html.replace(/\s*<meta\s+name=["']description["'][^>]*>/gi, "");
  html = html.replace(/\s*<meta\s+property=["'](?:og:[^"']+)["'][^>]*>/gi, "");
  html = html.replace(/\s*<meta\s+name=["']twitter:[^"']+["'][^>]*>/gi, "");
  html = html.replace(/\s*<link\s+rel=["']canonical["'][^>]*>/gi, "");
  return html.replace(/<\/head>/i, `    ${headBlock}\n  </head>`);
}

async function main() {
  const shellPath = resolve(DIST, "index.html");
  if (!existsSync(shellPath)) {
    console.warn("[prerender-static] dist/index.html not found; skipping.");
    return;
  }
  const shell = readFileSync(shellPath, "utf8");
  const ogImage = shellOgImage(shell);

  let written = 0;
  for (const page of [...pages, ...articles]) {
    const html = injectHead(shell, buildHead(page, ogImage));
    const outDir = resolve(DIST, page.loc.replace(/^\//, ""));
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, "index.html"), html, "utf8");
    written++;
  }
  console.log(
    `[prerender-static] Wrote ${written} page(s) under dist/ (${pages.length} static + ${articles.length} article).`
  );
}

main().catch((err) => {
  console.error("[prerender-static] Failed:", err);
  process.exit(0); // never fail the build; SPA fallback still works
});
