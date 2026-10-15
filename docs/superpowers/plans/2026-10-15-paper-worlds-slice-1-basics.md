# Paper Worlds, Slice 1 (Basics) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One branch with the 4 Oct product-page work merged in, clean product names everywhere a shopper reads one, and the 1-cent test product gone from every listing.

**Architecture:** Merge `feat/ui-pdp` into `redesign` with per-file rules (the two branches share the 14 Sep WIP; most "conflicts" are line endings). Move the pure title cleaner into `src/lib/productTitle.ts` so it can be tested with Node's built-in runner, and route every visible title through one function. Hide the test product by SKU in one helper used by every public product query and both build scripts.

**Tech Stack:** React 18 + Vite + TypeScript, Supabase JS, react-i18next, Node 24 (`node --test`, type stripping), Playwright (`e2e/`, system Chrome).

**Spec:** `docs/superpowers/specs/2026-10-15-paper-worlds-design.md` (Slice 1 in section 3).

## Global Constraints

- No new runtime dependency. `e2e/` keeps its own `package.json` (never the site's).
- Visitor-facing text has no spaced em/en dashes (" – ", " — "); numeric ranges like "8–10" stay.
- Line endings: files in this repo are CRLF in the working tree; never rewrite a whole file's endings (no `sed -i` on Windows).
- The test product stays reachable by its direct link (`/produktas/test-checkout-1-cent`): the go-live payment test buys it.
- Hide by SKU (`TEST-001`, prefix `TEST`), never by title: "Ferrari Testarossa" is a real product.
- Commits: plain sentence subject like the repo's history, body says why, ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A cart saved before this change** (localStorage holds raw titles like "MOULD KING 24124 Spring Whisper Bouquet Floral Konstruktorius | 1,040 dalių") must show the clean name in the drawer and at checkout. Pinned in Task 2 (`getDisplayTitle` is idempotent) and Task 3 (cart renders through it).
2. **English visitors** must see the cleaned English title, not the cleaned Lithuanian one. Pinned in Task 2 (`getProductName` with `title_en`).
3. **Ferrari Testarossa** (sku `27012S`) must stay in the catalogue and search. Pinned in Task 4 (unit + e2e).
4. **Searching "test"** in the header must not offer the test product. Pinned in Task 4 (e2e).
5. **The direct link** to the test product must still open its page. Pinned in Task 4 (e2e).

---

### Task 1: Merge `feat/ui-pdp` into `redesign`

**Files:**
- Modify (merge resolution): the 18 files listed below.
- Create (outside the repo, not committed): `C:/Users/Darius/AppData/Local/Temp/claude/D--Cinderpaw-Agent/318be7de-3f19-4216-a3a2-efc66fc8e18a/scratchpad/resolve-conflicts.py`

**Interfaces:**
- Produces: `getDisplayTitle`, `getDeliveryWindow`, `formatDeliveryWindow`, `getChristmasFit` in `src/hooks/useProducts.ts`; the `e2e/` suite; the cropped logo files.

- [ ] **Step 1: Check the starting point**

Run: `git -C "D:/WEBSITES/Metro website" status --short` → only `?? .claude/...` lines.
Run: `git -C "D:/WEBSITES/Metro website" log --oneline -1` → `981c31e Design: Paper Worlds ...`

- [ ] **Step 2: Start the merge**

```bash
cd "D:/WEBSITES/Metro website" && git merge --no-ff --no-commit feat/ui-pdp
```
Expected: `CONFLICT` lines for 18 files, "Automatic merge failed".

- [ ] **Step 3: Write the resolver** (keeps one side per conflict block, byte-exact, CRLF preserved)

```python
# resolve-conflicts.py  usage: python -I resolve-conflicts.py ours|theirs FILE...
import sys, re, pathlib
side = sys.argv[1]
pat = re.compile(rb'<<<<<<< [^\r\n]*\r?\n(.*?)=======\r?\n(.*?)>>>>>>> [^\r\n]*\r?\n', re.S)
for f in sys.argv[2:]:
    p = pathlib.Path(f); b = p.read_bytes()
    out, n = pat.subn(lambda m: m.group(1) if side == 'ours' else m.group(2), b)
    assert n > 0, f'no conflict block in {f}'
    p.write_bytes(out); print(f, n, side)
```

- [ ] **Step 4: Files where both branches made the same change (line endings only) or where `redesign` is newer: keep `redesign` (ours)**

```bash
python -I "C:/Users/Darius/AppData/Local/Temp/claude/D--Cinderpaw-Agent/318be7de-3f19-4216-a3a2-efc66fc8e18a/scratchpad/resolve-conflicts.py" ours \
  src/integrations/supabase/types.ts supabase/functions/admin/index.ts src/stores/cartStore.ts \
  src/pages/Wishlist.tsx src/data/mockProducts.ts supabase/functions/scrape-product/index.ts \
  scripts/prerender-products.mjs src/components/home/HeroSection.tsx src/components/home/HeroVideo.tsx
```
(HeroSection/HeroVideo are replaced in Slice 2; prerender keeps the dash-free fallback.)

- [ ] **Step 5: Files where `feat/ui-pdp` adds the 4 Oct features: keep `feat/ui-pdp` (theirs) per block**

```bash
python -I "C:/Users/Darius/AppData/Local/Temp/claude/D--Cinderpaw-Agent/318be7de-3f19-4216-a3a2-efc66fc8e18a/scratchpad/resolve-conflicts.py" theirs \
  src/components/home/LegoStyleProductCard.tsx src/components/home/ProductsSection.tsx \
  src/components/products/ProductCard.tsx src/pages/Produktai.tsx src/pages/Produktas.tsx \
  src/components/layout/Footer.tsx
```

- [ ] **Step 6: The two locale files, by hand**

In `src/i18n/locales/en.ts`, block 1 becomes (redesign's dash-free `cancelAnytime`, the new keys from `feat/ui-pdp` with their dashes replaced):
```ts
    cancelAnytime: 'Cancel anytime before shipping, full refund',
    estDelivery: 'Estimated delivery',
    beforeChristmas: 'Arrives before Christmas',
    afterChristmas: 'Arrives after Christmas',
    ageFrom: 'Ages {{age}}+',
    model: 'Model',
    brand: 'Brand',
    piecesCountShort: '{{n}} pieces',
    payByBank: 'Pay by bank transfer: Swedbank, SEB, Luminor, Revolut and more.',
    returnsPolicyLink: '14-day returns: terms',
    reviewsCount_one: '{{count}} review',
    reviewsCount_other: '{{count}} reviews',
```
Block 2 keeps redesign: `pmEnHint: "Shown when the site language is English. If empty, the Lithuanian version is shown.",`

In `src/i18n/locales/lt.ts`, block 1:
```ts
    cancelAnytime: 'Atšaukti galima bet kada iki išsiuntimo, grąžiname pilną sumą',
    estDelivery: 'Numatomas pristatymas',
    beforeChristmas: 'Spės iki Kalėdų',
    afterChristmas: 'Pristatysime po Kalėdų',
    ageFrom: 'Nuo {{age}} m.',
    model: 'Modelis',
    brand: 'Gamintojas',
    piecesCountShort: '{{n}} detalių',
    payByBank: 'Apmokėjimas per banką: Swedbank, SEB, Luminor, Revolut ir kt.',
    returnsPolicyLink: '14 d. grąžinimas: sąlygos',
    reviewsCount_one: '{{count}} atsiliepimas',
    reviewsCount_few: '{{count}} atsiliepimai',
    reviewsCount_many: '{{count}} atsiliepimo',
    reviewsCount_other: '{{count}} atsiliepimų',
```
Block 2 keeps redesign: `pmEnHint: "Rodoma kai svetainės kalba yra anglų. Jei tuščia, rodoma lietuviška versija.",`
Edit with an editor that keeps CRLF (the Edit tool, or the resolver then a byte-level replace).

- [ ] **Step 7: `src/content/articles.json` comment line**

Keep `feat/ui-pdp`'s longer comment (it documents the `en` blocks) with the dash replaced:
`... Adding an entry here is enough: routes, sitemap and prerendering all pick it up automatically. Each article carries an \"en\" block ...`

- [ ] **Step 8: Remove the spaced dashes the merge brought in**

Run (counts spaced em/en dashes in visitor-facing text):
```bash
git show redesign:src/i18n/locales/en.ts | grep -c " [–—] "; grep -c " [–—] " src/i18n/locales/en.ts
git show redesign:src/i18n/locales/lt.ts | grep -c " [–—] "; grep -c " [–—] " src/i18n/locales/lt.ts
git show redesign:src/content/articles.json | grep -c " [–—] "; grep -c " [–—] " src/content/articles.json
```
For every line the merged file has beyond `redesign`'s count, replace the spaced dash with a comma, colon or full stop as the sentence needs (byte-level edit, CRLF kept). Re-run: merged counts equal `redesign`'s.

- [ ] **Step 9: Nothing left unresolved; it compiles and builds**

```bash
git diff --name-only --diff-filter=U            # expected: empty
grep -rln "^<<<<<<<\|^>>>>>>>" src scripts supabase e2e   # expected: empty
npx tsc --noEmit -p tsconfig.app.json           # expected: no output
npx vite build --outDir "C:/Users/Darius/AppData/Local/Temp/claude/D--Cinderpaw-Agent/318be7de-3f19-4216-a3a2-efc66fc8e18a/scratchpad/ibrix-dist" --emptyOutDir   # expected: "built in"
```
If `tsc` reports `getEtaString` missing in `Produktas.tsx`, add it back to that file's `@/hooks/useProducts` import.

- [ ] **Step 10: Install the e2e runner once and take the baseline**

```bash
cd e2e && npm install && cd ..
npm run dev    # background; serves http://localhost:8080
cd e2e && npx playwright test
```
Expected: every test passes except `catalogue shows no test products to shoppers` (fails until Task 4).

- [ ] **Step 11: Commit the merge**

```bash
git add -A src scripts supabase e2e docs index.html public
git status --short    # only the intended files staged; .claude/ stays untracked
git commit -F- <<'EOF'
Merge feat/ui-pdp: product page, clean titles, logo, Satoshi, shopper tests

The 4 Oct branch started from the 14 Sep working tree that redesign also
committed, so most conflicts were the same change with different line
endings (redesign kept). Product page, cards, footer and the new keys
come from feat/ui-pdp; the 5 Oct copy pass (no spaced dashes) wins in
the text, and the dashes the 4 Oct strings carried are replaced.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 2: One tested place for product names

**Files:**
- Create: `src/lib/productTitle.ts`
- Create: `src/lib/productTitle.test.ts`
- Modify: `src/hooks/useProducts.ts` (move `getDisplayTitle` out, re-export it, add `getProductName`)

**Interfaces:**
- Produces: `getDisplayTitle(title: string, sku?: string): { name: string; brand: string | null; pieces: number | null }` and `cleanTitle(title: string, sku?: string): string` from `src/lib/productTitle.ts`; `getProductName(product: Pick<Product, 'title' | 'title_en' | 'sku'>, lang?: string): string` from `src/hooks/useProducts.ts`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/productTitle.test.ts — run with: node --test src/lib/productTitle.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDisplayTitle, cleanTitle } from './productTitle.ts';

test('strips brand, model number, generic noun and piece count', () => {
  const t = getDisplayTitle('MOULD KING 24124 Spring Whisper Bouquet Floral Konstruktorius | 1,040 dalių', '24124');
  assert.deepEqual(t, { name: 'Spring Whisper Bouquet Floral', brand: 'Mould King', pieces: 1040 });
});

test('a name that is already clean comes back unchanged (carts saved before the change)', () => {
  const once = cleanTitle('MOULD KING 10168 Motorised Hypercar W16 Engine & Gearbox Konstruktorius | 2899 dalys', '10168');
  assert.equal(cleanTitle(once, '10168'), once);
  assert.equal(cleanTitle('Chrizantema'), 'Chrizantema');
});

test('keeps words that only look like noise', () => {
  assert.equal(cleanTitle('MOULD KING 27012S Ferrari Testarossa | 350 dalių', '27012S'), 'Ferrari Testarossa');
});

test('never returns an empty name', () => {
  assert.equal(cleanTitle('MOULD KING'), 'MOULD KING');
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --test src/lib/productTitle.test.ts`
Expected: FAIL, `Cannot find module ... productTitle.ts`.

- [ ] **Step 3: Move the cleaner into `src/lib/productTitle.ts`**

```ts
/**
 * Product names as a shopper reads them. Supplier feeds title every set
 * "MOULD KING 24124 Spring Whisper Bouquet Floral Konstruktorius | 1,040 dalių";
 * the brand and model number move above the name and the piece count into the
 * specs. Pure on purpose: no imports, so `node --test` runs it as is.
 */
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
```
This is the body from `feat/ui-pdp` unchanged. Delete `getDisplayTitle` from `src/hooks/useProducts.ts` and add there:
```ts
import { getDisplayTitle, cleanTitle } from '@/lib/productTitle';
export { getDisplayTitle, cleanTitle };

/** The name a shopper reads, in their language: localised title, then cleaned. */
export function getProductName(product: Pick<Product, 'title' | 'title_en' | 'sku'>, lang?: string): string {
  return cleanTitle(getProductTitle(product, lang), product.sku);
}
```
If `Product` has no `sku` in its type, use `Pick<Product, 'title' | 'title_en'> & { sku?: string }`.

- [ ] **Step 4: Run the tests and the typecheck**

Run: `node --test src/lib/productTitle.test.ts` → 4 pass.
Run: `npx tsc --noEmit -p tsconfig.app.json` → no output.
The tests are run by Node, not bundled, and import `node:test`: keep them out of the app typecheck by adding `"exclude": ["src/**/*.test.ts"]` to `tsconfig.app.json` (next to `"include"`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/productTitle.ts src/lib/productTitle.test.ts src/hooks/useProducts.ts tsconfig.app.json
git commit -F- <<'EOF'
Product names come from one tested function

getDisplayTitle moves to src/lib/productTitle.ts, free of imports so
Node's own test runner checks it; getProductName adds the visitor's
language. Cleaning twice changes nothing, which is what lets a cart
saved with old raw titles render clean.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 3: Every visible product title is the clean name

**Files (modify; alt texts too, they are read aloud):**
- `src/components/account/CreditsRewards.tsx`, `src/components/account/WishlistSection.tsx`
- `src/components/cart/AddToCartModal.tsx`, `src/components/cart/CartDrawer.tsx`, `src/components/cart/CartRecommendations.tsx`
- `src/components/header/ProductSearch.tsx`, `src/components/home/RecentlyViewedSection.tsx`
- `src/components/home/LegoStyleProductCard.tsx`, `src/components/home/ProductsSection.tsx` (the toast `description`)
- `src/pages/Checkout.tsx` (order summary lines 755-759 on feat/ui-pdp numbering)

**Interfaces:**
- Consumes: `getProductName(product, lang)` and `cleanTitle(title, sku)` from Task 2.

- [ ] **Step 1: List the call sites**

```bash
grep -rn "getProductTitle(" src --include=*.tsx | grep -v -E "getDisplayTitle\(getProductTitle|SEO|seo/|admin/|Admin|<title|meta"
grep -rn "item\.title" src/components/cart src/pages/Checkout.tsx
```
Every line printed that renders text or an `alt` is in scope. SEO titles and the admin keep the full supplier title (search engines match "Mould King 24124").

- [ ] **Step 2: Replace product titles**

Pattern (each file):
```tsx
// before
{getProductTitle(product, i18n.language)}
alt={getProductTitle(product, i18n.language)}
// after
{getProductName(product, i18n.language)}
alt={getProductName(product, i18n.language)}
```
and update that file's import from `@/hooks/useProducts` (`getProductName` in, `getProductTitle` out when no other use remains).

- [ ] **Step 3: Replace cart item titles (render time, so old carts are fixed too)**

```tsx
// CartDrawer.tsx and Checkout.tsx order summary
// before
{item.title}
alt={item.title}
// after
{cleanTitle(item.title, item.sku)}
alt={cleanTitle(item.title, item.sku)}
```
Leave `name: item.title` in the payloads sent to the checkout function unchanged (order rows keep the full title for the shop owner).

- [ ] **Step 4: Typecheck, build, look**

```bash
npx tsc --noEmit -p tsconfig.app.json
npx vite build --outDir "C:/Users/Darius/AppData/Local/Temp/claude/D--Cinderpaw-Agent/318be7de-3f19-4216-a3a2-efc66fc8e18a/scratchpad/ibrix-dist" --emptyOutDir
```
With `npm run dev` running: open search, type "W16", add a product to the cart, open the drawer and `/checkout`; screenshot each at 390 px and 1440 px. Expected: "Motorised Hypercar W16 Engine & Gearbox" everywhere, never "MOULD KING 10168 ... | 2899 dalys".

- [ ] **Step 5: Commit**

```bash
git add src
git commit -F- <<'EOF'
Shoppers read the clean product name everywhere

Search, cart drawer, checkout summary, add-to-cart modal, wishlist,
recently viewed and credits now show "Motorised Hypercar W16 Engine &
Gearbox" instead of the supplier string. Cart lines are cleaned when
drawn, so carts saved before this change read clean as well. SEO titles
and the admin keep the full supplier title.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 4: The test product is gone from every listing, and still opens by link

**Files:**
- Create: `src/lib/catalogFilters.ts`, `src/lib/catalogFilters.test.ts`
- Modify: `src/hooks/useProducts.ts` (`useProducts` list query only; `useProduct(slug)` unchanged)
- Modify: `src/components/home/RecentlyViewedSection.tsx`, `src/components/home/BundlesSection.tsx`, `src/pages/Atsiliepimai.tsx`, `src/components/account/CreditsRewards.tsx`, `src/components/checkout/CreditsPaymentOption.tsx` (their `from('products')` list queries)
- Modify: `scripts/generate-sitemap.mjs:68`, `scripts/prerender-products.mjs:72`
- Modify: `e2e/tests/shop.spec.ts`

**Interfaces:**
- Produces: `TEST_SKU_PREFIX = 'TEST'`, `isTestSku(sku?: string | null): boolean`, `withoutTestProducts<Q extends { not: (column: string, operator: string, value: string) => Q }>(query: Q): Q`, `TEST_SKU_REST_FILTER = 'sku=not.ilike.TEST*'`.

- [ ] **Step 1: Write the failing unit test**

```ts
// src/lib/catalogFilters.test.ts — run with: node --test src/lib/catalogFilters.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isTestSku, withoutTestProducts, TEST_SKU_REST_FILTER } from './catalogFilters.ts';

test('only the TEST sku prefix counts as a test product', () => {
  assert.equal(isTestSku('TEST-001'), true);
  assert.equal(isTestSku('test-002'), true);
  assert.equal(isTestSku('27012S'), false); // Ferrari Testarossa
  assert.equal(isTestSku(null), false);
});

test('the query helper adds exactly one sku filter', () => {
  const calls: string[][] = [];
  const q = { not(c: string, o: string, v: string) { calls.push([c, o, v]); return q; } };
  assert.equal(withoutTestProducts(q), q);
  assert.deepEqual(calls, [['sku', 'ilike', 'TEST%']]);
});

test('the REST filter for the build scripts matches the same rule', () => {
  assert.equal(TEST_SKU_REST_FILTER, 'sku=not.ilike.TEST*');
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --test src/lib/catalogFilters.test.ts` → FAIL, module not found.

- [ ] **Step 3: Write the helper**

```ts
// src/lib/catalogFilters.ts
/**
 * The checkout test product (sku TEST-001, 0,01 €) must never be listed:
 * on 15 Oct it was the hero's featured product on the live site. It stays
 * reachable by its own link, because the go-live payment test buys it.
 * By sku, never by title: "Ferrari Testarossa" is a real set.
 */
export const TEST_SKU_PREFIX = 'TEST';
export const TEST_SKU_REST_FILTER = 'sku=not.ilike.TEST*';

export function isTestSku(sku?: string | null): boolean {
  return !!sku && sku.toUpperCase().startsWith(TEST_SKU_PREFIX);
}

export function withoutTestProducts<Q extends { not: (column: string, operator: string, value: string) => Q }>(query: Q): Q {
  return query.not('sku', 'ilike', `${TEST_SKU_PREFIX}%`);
}
```

- [ ] **Step 4: Run the unit test**

Run: `node --test src/lib/catalogFilters.test.ts` → 3 pass.

- [ ] **Step 5: Apply it to every public list query**

```ts
// src/hooks/useProducts.ts, useProducts()
const { data, error } = await withoutTestProducts(
  supabase.from('products').select('*').eq('status', 'active'),
).order('created_at', { ascending: false });
```
Same wrapping in RecentlyViewedSection, BundlesSection, Atsiliepimai, CreditsRewards, CreditsPaymentOption around their `supabase.from('products').select(...)...` chain (before `.order`, `.limit`, `.in`). Leave `useProduct(slug)`, `Orders.tsx` and the admin as they are.
Build scripts:
```js
// scripts/generate-sitemap.mjs:68
const url = `${SUPABASE_URL}/rest/v1/products?select=slug,updated_at&status=eq.active&sku=not.ilike.TEST*`;
// scripts/prerender-products.mjs:72
const url = `${SUPABASE_URL}/rest/v1/products?select=${fields}&status=eq.active&sku=not.ilike.TEST*`;
```
(The scripts are plain `.mjs` and cannot import the `.ts` helper; the unit test pins the string they must match.)

- [ ] **Step 6: Pin the shopper-facing behaviour in e2e**

Append to `e2e/tests/shop.spec.ts`:
```ts
test('home and search never offer the test product', async ({ page }) => {
  await page.goto('/');
  await dismissCookies(page);
  await expect(page.getByText(/test produktas/i)).toHaveCount(0);
  const search = page.getByRole('searchbox').first();
  await search.fill('test');
  await expect(page.getByText(/test produktas/i)).toHaveCount(0);
  await expect(page.getByText(/testarossa/i).first()).toBeVisible();
});

test('the test product still opens by its own link (the go-live payment test buys it)', async ({ page }) => {
  await page.goto('/produktas/test-checkout-1-cent');
  await dismissCookies(page);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/test produktas/i);
});
```
On phones the search box sits behind the search icon: if `getByRole('searchbox')` is hidden in the `mobile` project, open it first with `page.getByRole('button', { name: /ieškoti|search/i }).first().click()`.

- [ ] **Step 7: Run everything**

```bash
node --test src/lib/productTitle.test.ts src/lib/catalogFilters.test.ts
npx tsc --noEmit -p tsconfig.app.json
cd e2e && npx playwright test     # dev server running on :8080
```
Expected: all unit tests pass; tsc silent; every e2e test passes in both projects, including `catalogue shows no test products to shoppers`.

- [ ] **Step 8: Commit**

```bash
git add src scripts e2e
git commit -F- <<'EOF'
The 1-cent test product leaves every listing, and keeps its own link

On the live site it was the hero's featured product and the first card
in the catalogue. Every public product list, the sitemap and the
prerender now drop sku TEST*, never matching on the title ("Ferrari
Testarossa" stays). Its page still opens by link: the go-live payment
test buys it.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 5: Preview and hand-over

**Files:** none changed.

- [ ] **Step 0: The logo reads** in the header at 390 px and 1440 px: the mark is about 36-40 px tall and sharp (the 4 Oct crop), not a 10 px strip.

- [ ] **Step 1: Screenshots for Darius** at 390 px and 1440 px of: home, `/produktai/visi`, one product page, the cart drawer, `/checkout`. Show them inline (noctty: `show_image`).
- [ ] **Step 2: Push** `git push origin redesign` (Vercel builds a Preview only; production stays `main`).
- [ ] **Step 3: Remove the merged worktree** (its `node_modules` is a junction into this folder: unlink it first, or `git worktree remove` empties the real one):
```powershell
cmd /c rmdir "D:\WEBSITES\Metro-ui\node_modules"
git -C "D:\WEBSITES\Metro website" worktree remove "D:\WEBSITES\Metro-ui"
```
Only after Darius has seen the preview and `feat/ui-pdp` is in `redesign`'s history (`git branch --merged redesign` lists it).
