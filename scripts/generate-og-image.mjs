#!/usr/bin/env node
/**
 * Regenerates the social share card used as og:image / twitter:image.
 *
 * This is a MANUAL script — it is not part of the build. Run it only when the
 * card design, the hero product or the trust points change:
 *
 *   node scripts/generate-og-image.mjs
 *
 * It writes two throwaway files into design/ (gitignored):
 *   design/og-card.svg   — the rendered card, for eyeballing
 *   design/og-card.html  — harness used to rasterize
 *
 * They deliberately do NOT live in public/, because everything in public/ is
 * copied into dist/ and deployed — a rasterizer page and a 460 KB SVG have no
 * business being on the live site. The only shipped artifact is
 * public/og-image.jpg.
 *
 * Rasterizing needs a browser because there is no image library in this
 * project and social platforms do not accept SVG for og:image. Open
 * design/og-card.html, and it downloads og-image.jpg at 1200x630 — save it
 * over public/og-image.jpg.
 *
 * The card design itself lives in this file, so the script is the source of
 * truth; the generated files are disposable.
 *
 * The hero product is fetched live from Supabase by SKU so the card always
 * uses the real catalogue image rather than a stale copy.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DESIGN = resolve(ROOT, "design");

/** Hero product. Change this SKU to feature a different model. */
const HERO_SKU = "10168";

const NAVY = "#0f2544";
const ORANGE = "#e57200";
const PANEL = "#ffffff";

const HEADLINE_1 = "MOULD KING";
const HEADLINE_2 = "konstruktoriai";
const TAGLINE = "Mechaniniai modeliai, kurie juda";
const BADGE = "Oficialus atstovas Lietuvoje";
const POINTS = [
  "Nemokamas pristatymas Lietuvoje",
  "14 dienų grąžinimas",
  "Trūkstamos detalės nemokamai",
];

function loadDotEnv() {
  const path = resolve(ROOT, ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n\r]*)"?\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadDotEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function xmlEscape(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

async function fetchHeroImage() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase env not set; cannot fetch hero product.");
  }
  const url = `${SUPABASE_URL}/rest/v1/products?select=sku,title,images&sku=eq.${HERO_SKU}`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase fetch failed (${res.status})`);
  const rows = await res.json();
  if (!rows.length) throw new Error(`No product with SKU ${HERO_SKU}`);

  const first = rows[0].images?.[0];
  if (!first) throw new Error(`Product ${HERO_SKU} has no images`);

  // Shopify CDN resizes via ?width=, keeping the embedded base64 reasonable.
  const sized = `${first}${first.includes("?") ? "&" : "?"}width=760`;
  const img = await fetch(sized);
  if (!img.ok) throw new Error(`Hero image fetch failed (${img.status})`);
  const buf = Buffer.from(await img.arrayBuffer());
  console.log(`[og] hero: ${rows[0].title} (${buf.length} bytes)`);
  return buf.toString("base64");
}

function buildSvg(heroBase64) {
  const font = "Segoe UI, Arial, Helvetica, sans-serif";
  const points = POINTS.map((text, i) => {
    const y = 410 + i * 42;
    return `  <rect x="72" y="${y}" width="9" height="9" fill="${ORANGE}"/>
  <text x="97" y="${y + 9}" font-family="${font}" font-size="22" fill="#c8d8ee">${xmlEscape(text)}</text>`;
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${NAVY}"/>
  <rect x="700" y="0" width="500" height="630" fill="${PANEL}"/>
  <rect x="694" y="0" width="6" height="630" fill="${ORANGE}"/>
  <image x="726" y="55" width="448" height="448" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/png;base64,${heroBase64}"/>
  <rect x="72" y="86" width="330" height="42" rx="21" fill="${ORANGE}"/>
  <text x="99" y="113" font-family="${font}" font-size="20" font-weight="600" fill="#ffffff">${xmlEscape(BADGE)}</text>
  <text x="72" y="216" font-family="${font}" font-size="62" font-weight="700" fill="#ffffff">${xmlEscape(HEADLINE_1)}</text>
  <text x="72" y="288" font-family="${font}" font-size="62" font-weight="700" fill="#ffffff">${xmlEscape(HEADLINE_2)}</text>
  <text x="72" y="352" font-family="${font}" font-size="27" fill="#9db4d4">${xmlEscape(TAGLINE)}</text>
${points}
  <text x="72" y="576" font-family="${font}" font-size="34" font-weight="700" fill="#ffffff" letter-spacing="3">IBRIX</text>
  <text x="196" y="576" font-family="${font}" font-size="22" fill="#7f9ac0">ibrix.lt</text>
</svg>`;
}

function buildHarness(svg) {
  const b64 = Buffer.from(svg, "utf8").toString("base64");
  return `<!doctype html>
<meta charset="utf-8">
<title>og-image rasterizer</title>
<body style="font:14px system-ui;padding:24px">
<p>Rasterizing to 1200x630 JPEG. The download starts automatically — save it as <code>public/og-image.jpg</code>.</p>
<img id="src" style="display:none" src="data:image/svg+xml;base64,${b64}">
<canvas id="c" width="1200" height="630" style="width:600px;height:315px;border:1px solid #ccc"></canvas>
<script>
const img = document.getElementById('src');
function draw(){
  const c = document.getElementById('c');
  const ctx = c.getContext('2d');
  ctx.fillStyle = '${NAVY}';
  ctx.fillRect(0,0,1200,630);
  ctx.drawImage(img,0,0,1200,630);
  const a = document.createElement('a');
  a.href = c.toDataURL('image/jpeg', 0.92);
  a.download = 'og-image.jpg';
  a.textContent = 'Download og-image.jpg';
  document.body.appendChild(a);
  a.click();
}
if (img.complete) draw(); else img.onload = draw;
</script>
</body>`;
}

async function main() {
  const hero = await fetchHeroImage();
  const svg = buildSvg(hero);
  mkdirSync(DESIGN, { recursive: true });
  writeFileSync(resolve(DESIGN, "og-card.svg"), svg, "utf8");
  writeFileSync(resolve(DESIGN, "og-card.html"), buildHarness(svg), "utf8");
  console.log("[og] wrote design/og-card.svg");
  console.log("[og] open design/og-card.html, then save the download over public/og-image.jpg");
}

main().catch((err) => {
  console.error("[og] Failed:", err.message);
  process.exit(1);
});
