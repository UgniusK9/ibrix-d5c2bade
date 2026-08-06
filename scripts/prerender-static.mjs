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
 * Per-route SEO copy. `loc` matches the paths in generate-sitemap.mjs.
 * Titles get " | IBRIX" appended automatically, so keep them short.
 */
const pages = [
  {
    loc: "/produktai/visi",
    title: "Visi MOULD KING konstruktoriai",
    desc: "Visas MOULD KING konstruktorių asortimentas Lietuvoje — automobiliai, varikliai, gėlių puokštės ir techniniai modeliai. Oficialus atstovas, nemokamas pristatymas.",
  },
  {
    loc: "/produktai/varikliai",
    title: "Variklių modeliai ir konstruktoriai",
    desc: "Judantys variklių modeliai — V8, V12, boxer ir rotaciniai. Techniniai konstruktoriai su veikiančiais stūmokliais mechanikos entuziastams.",
  },
  {
    loc: "/pre-order",
    title: "Kaip veikia pre-order",
    desc: "Pre-order paaiškintas paprastai: rezervuojate konstruktorių su avansu, matote aiškų pristatymo terminą ir sumokate likutį prieš išsiuntimą.",
  },
  {
    loc: "/dovanu-kuponai",
    title: "Dovanų kuponai",
    desc: "IBRIX dovanų kuponas — tinkama dovana konstruktorių mėgėjui. Pasirinktos vertės kuponas atkeliauja el. paštu ir galioja visam asortimentui.",
  },
  {
    loc: "/apie",
    title: "Apie mus",
    desc: "IBRIX — oficialus MOULD KING konstruktorių atstovas Lietuvoje. Kas mes esame, kodėl renkamės MOULD KING ir kaip padedame lietuviškai.",
  },
  {
    loc: "/kontaktai",
    title: "Kontaktai",
    desc: "Susisiekite su IBRIX — el. paštas, telefonas ir atsakymai į klausimus apie užsakymus, pristatymą bei konstruktorius. Padedame lietuviškai.",
  },
  {
    loc: "/pristatymas",
    title: "Pristatymas",
    desc: "Nemokamas pristatymas į paštomatus visoje Lietuvoje. Sužinokite pristatymo terminus, būdus ir kaip sekti savo siuntą.",
  },
  {
    loc: "/garantija",
    title: "Garantija",
    desc: "Garantija IBRIX konstruktoriams — ką dengia, kiek galioja ir kaip pateikti prašymą, jei su gaminiu kažkas negerai.",
  },
  {
    loc: "/grazinimai",
    title: "Grąžinimai",
    desc: "14 dienų grąžinimo teisė be papildomų klausimų. Kaip grąžinti konstruktorių, per kiek grąžiname pinigus ir kas apmoka siuntimą.",
  },
  {
    loc: "/pagalba",
    title: "Pagalba ir DUK",
    desc: "Atsakymai į dažniausiai užduodamus klausimus apie užsakymus, pre-order, apmokėjimą, pristatymą ir grąžinimus.",
  },
  {
    loc: "/trukstamos-detales",
    title: "Trūkstamos detalės — nemokamai",
    desc: "Trūksta detalės iš rinkinio? Atsiųsime trūkstamas detales nemokamai. Užpildykite formą ir nurodykite rinkinio numerį.",
  },
  {
    loc: "/palyginti",
    title: "Palyginti konstruktorius",
    desc: "Palyginkite MOULD KING konstruktorius greta — detalių skaičius, kaina, matmenys ir savybės vienoje lentelėje.",
  },
  {
    loc: "/atsiliepimai",
    title: "Klientų atsiliepimai",
    desc: "Ką apie IBRIX sako klientai Lietuvoje — atsiliepimai apie konstruktorių kokybę, pristatymo greitį ir aptarnavimą.",
  },
  {
    loc: "/privatumo-politika",
    title: "Privatumo politika",
    desc: "Kaip IBRIX renka, naudoja ir saugo jūsų asmens duomenis pagal BDAR.",
  },
  {
    loc: "/slapukai",
    title: "Slapukų politika",
    desc: "Kokius slapukus naudoja ibrix.lt, kam jie reikalingi ir kaip pakeisti savo sutikimo nustatymus.",
  },
  {
    loc: "/taisykles",
    title: "Pirkimo taisyklės",
    desc: "IBRIX pirkimo–pardavimo taisyklės: užsakymo sudarymas, apmokėjimas, pristatymas, grąžinimai ir šalių atsakomybė.",
  },
];

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

  return [
    `<title>${htmlEscape(title)}</title>`,
    `<meta name="description" content="${htmlEscape(page.desc)}" />`,
    `<link rel="canonical" href="${htmlEscape(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${htmlEscape(title)}" />`,
    `<meta property="og:description" content="${htmlEscape(page.desc)}" />`,
    `<meta property="og:url" content="${htmlEscape(url)}" />`,
    `<meta property="og:site_name" content="IBRIX" />`,
    `<meta property="og:locale" content="lt_LT" />`,
    ogImage ? `<meta property="og:image" content="${htmlEscape(ogImage)}" />` : "",
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${htmlEscape(title)}" />`,
    `<meta name="twitter:description" content="${htmlEscape(page.desc)}" />`,
    ogImage ? `<meta name="twitter:image" content="${htmlEscape(ogImage)}" />` : "",
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
  for (const page of pages) {
    const html = injectHead(shell, buildHead(page, ogImage));
    const outDir = resolve(DIST, page.loc.replace(/^\//, ""));
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, "index.html"), html, "utf8");
    written++;
  }
  console.log(`[prerender-static] Wrote ${written} static page(s) under dist/.`);
}

main().catch((err) => {
  console.error("[prerender-static] Failed:", err);
  process.exit(0); // never fail the build; SPA fallback still works
});
