// Pure on purpose: no imports, so Node's own test runner checks it
// (node --test src/lib/productTitle.test.ts).

// Titles are imported from supplier feeds as
// "MOULD KING 24130 Red Rose Bouquet Konstruktorius | 894 dalių".
// Shoppers read the model name first; brand, model number and piece count
// are shown beside it, so they are split off here. A title that does not
// follow the pattern comes back unchanged.
export function getDisplayTitle(title: string, sku?: string): { name: string; brand: string | null; pieces: number | null } {
  // No \b after the word: JS treats "ų" as a non-letter, so \b never matches there.
  const piecesPattern = /\s*\|\s*([\d.,\s]+?)\s*(dalių|dalys|detalių|detalės|pieces|pcs)(?=\s|$).*$/i;
  // Most imported products carry the piece count only here, so keep it.
  const piecesMatch = title.match(piecesPattern);
  const pieces = piecesMatch ? Number(piecesMatch[1].replace(/[^\d]/g, '')) || null : null;
  let name = title.replace(piecesPattern, '');
  let brand: string | null = null;
  const brandMatch = name.match(/^(mould\s*king)\s+/i);
  if (brandMatch) {
    brand = 'Mould King';
    name = name.slice(brandMatch[0].length);
  }
  if (sku && name.startsWith(`${sku} `)) name = name.slice(sku.length + 1);
  // Some feeds put an adjective in front: "Racing Plane Žaislinis Konstruktorius"
  // (toy building set), "V8 Engine Kaladėlių Konstruktorius" (block building set).
  // Both words go, or every language shows "Racing Plane Žaislinis".
  name = name.replace(/\s+(?:(?:žaislinis|kaladėlių)\s+)?(konstruktorius|building set|building blocks)$/i, '').trim();
  return { name: name || title, brand, pieces };
}

/** The name alone. Safe to call twice: a clean name passes through unchanged. */
export function cleanTitle(title: string, sku?: string): string {
  return getDisplayTitle(title, sku).name;
}
