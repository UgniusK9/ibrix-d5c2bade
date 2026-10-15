# ibrix.lt: Paper Worlds redesign

Date: 15 Oct 2026. Status: design approved in conversation, section by section;
this document is the written version for review before the implementation plan.

## Goal

The most memorable e-commerce site in Lithuania that still sells better than it
looks. Two rules decide every trade-off:

1. **Conversion first.** A shopper reaches a product, a price and an "Į krepšelį"
   button within the first screen, on a 390 px phone as on a desktop.
2. **Nothing that costs per use.** All art is drawn in code (SVG). No paid
   generation credits, no video on the first screen, no new runtime dependency.

### Success criteria

- Mobile Lighthouse performance on the home page is **not lower** than today's
  live ibrix.lt (measured before and after, same device profile).
- The shopper journeys in `e2e/` (Playwright, from `feat/ui-pdp`) pass.
- On a 390 px product page, price and "Į krepšelį" are visible without scrolling.
- The 1-cent test product appears nowhere in the shop.
- With `prefers-reduced-motion: reduce`, every scene shows its finished state.

## Locked decisions

| Topic | Decision |
|---|---|
| Positioning | Two worlds on one site: **Mechanizmai** (cars, engines, trains, machines) and **Dovanos** (flowers, decor, gift cards). |
| Art | Torn paper drawn from code: layered ridges with a cream core showing along the tear, soft drop shadows, fibre grain. |
| Home | A short paper world in three stops, ~2.5 screens, then the store. Never scroll-jacked. |
| First screen | The paper hypercar assembles on page load (~1 s) and then drives. It replaces `public/videos/hero.mp4`. |
| Motion | Pieces fly in and click into place: on load for the first stop, tied to scroll position for the later stops. |
| Fonts | Satoshi (headings, Fontshare link per family) + Inter (text), as chosen on `feat/ui-pdp`. |
| Copy | Lithuanian drafts by us, checked by the client; English through the existing i18n. |

## 1. Paper system and the three stops

### Paper kit (`src/components/paper/`)

- `torn.ts`: seeded random generator; `ridge()` (landscape edge from slow waves
  plus fast jitter), `tornPolygon()` (any outline cut into short jittered steps),
  `tornCircle()`. Same seed, same tear, so server and client render alike and
  nothing jumps between renders.
- `PaperSheet`: one SVG layer, coloured face over a cream core offset by a few
  pixels, plus shadow.
- `PaperCard`: the product card (photo on white, clean title, delivery badge,
  `PriceTag`, cart button) with a torn bottom edge and a small tilt.
- `PriceTag`: the notched orange tag with a punched hole.
- `TornSeam`: the tear between two sections.
- `Grain`: one fixed fibre overlay for the whole page.
- `useAssembly(progress, pieces)`: maps progress 0..1 to each piece's position,
  rotation and opacity (out-cubic landing; overshoot for the final "click").
- `useInViewPause`: stops a scene's animation loop when it is off screen or the
  tab is hidden.

### Stop 1: Night of mechanics (first screen)

Navy sky with stars, the torn orange sun, ridges, the road. The paper hypercar
(side view, modelled on a real catalogue car such as the Voiture Noire) assembles
on load: wheels roll in, the body drops onto them, then glass, intake, stripe,
lights, and the spoiler last with a small overshoot. Then it drives: wheels spin,
road dashes and stars stream at different speeds, paper speed lines pass behind,
the body rides its springs. Scrolling down speeds it up briefly, capped. Copy: eyebrow
"Oficialus Mould King atstovas", heading "Konstruktoriai, kurie juda.", main CTA
"Rinktis mechanizmą". Below, a paper label "Populiariausi mechanizmai" and four
real products on `PaperCard`s.

### Stop 2: Day of gifts

The night tears away (`TornSeam`); underneath, a cream sky, sage hills, a yellow
sun, paper flowers. A bouquet assembles with scroll: stems, leaves, petals flower
by flower, then the wrap. Heading "Gėlės, kurios niekada nenuvysta.", CTA
"Rinktis dovaną", four real bouquets on `PaperCard`s.

### Stop 3: Workshop

A box opens and its pieces gather into a small model, with scroll: order, receive
the box, build it. This stop carries the pre-order explanation and delivery
promise that `HowItWorks` and `PreOrderSection` carry today.

### Which products appear

`src/config/worlds.ts` maps category slugs to a world (gifts: `botanika`,
`mini-botanika`, gift cards; every other category: mechanics). Four per world:
products the client tags `home` first, then in stock before
pre-order, then by price, highest first. The client can change the tags without
code.

### Phones

Each stop has its own phone composition (sun small, top right; the product row
scrolls sideways with snap), not a crop of the desktop scene.

## 2. The pages that sell

### Home, below the stops

1. Categories in two rows, one per world, as paper tiles with product counts.
2. The real build photos ("Tikros nuotraukos") in a paper frame.
3. One trust band: free delivery to a parcel locker, 14-day returns, missing
   parts sent free, help in Lithuanian, bank payment via Paysera.
4. Newsletter with a reason: first to hear about new models.

Removed from the home page: sections that repeat products (`BundlesSection`,
`TabbedProductCarousel`, the second products grid, `EditorialSection`), the
repeated trust rows, and `HowItWorks` + `PreOrderSection` (the Workshop stop
carries them). No reviews until real ones exist.

### Catalogue (`Produktai`)

- A **Mechanizmai / Dovanos** switch as paper tabs; categories as chips below
  (sideways scroll on phones) instead of the long sidebar.
- 24 products at a time with "Rodyti daugiau"; the world, category, sort and
  filters live in the URL.
- Filters: price, in stock or pre-order, piece count, motor or remote control.
- `PaperCard` everywhere a product is listed.

### Product page (`Produktas`)

Starts from the `feat/ui-pdp` version (delivery as calendar dates, the
before-Christmas note, honest specs, clean title, the payment methods that work).
Adds:
- a sticky bar on phones with price and "Į krepšelį";
- a large gallery with zoom (box and built model);
- "Juda: variklis, nuotolinis valdymas" badges where the product has them;
- paper only as accent: the price tag and the section seams.

### Cart and checkout

- Cart: delivery date per item, the free-delivery line, total.
- Checkout: Paysera banks as tiles with their logos (`public/payment-logos/`),
  one page without navigation that leads away, a line under the pay button
  saying what happens after payment. The 8 Oct behaviour stays: the cart
  survives a failed payment and the reason is shown.

## 3. Build and go-live

### Branch

One branch: `redesign`, with `feat/ui-pdp` merged into it first. No new
branches or worktrees; the `Metro-ui` worktree is removed once merged (unlink its
`node_modules` junction first).

### Slices, each ending in a Vercel preview reviewed by Darius

1. **Basics:** merge `feat/ui-pdp`; hide the test product in every public query;
   real logo; clean titles everywhere.
2. **Paper kit + Night stop:** the kit above, the assembling and driving car,
   the video removed.
3. **Day stop + Workshop + trimmed home.**
4. **Catalogue.**
5. **Product page.**
6. **Cart and checkout.**

### Technical rules

- React + framer-motion (`useScroll`, `useTransform`), both already installed.
  No new dependency.
- Scroll drives progress; it never captures or delays the scroll itself.
- Animation loops pause off screen and in background tabs.
- The heading text is the first-screen paint; SVG scenes are inline and light.
- Generated SVG paths are memoised per component instance.

### Testing and measurement

- Playwright shopper journeys (`e2e/`) on every slice.
- Screenshots at 390 px and 1440 px of every changed page, shown to Darius.
- Lighthouse mobile on the home page and one product page, before (live) and
  after (preview).
- Reduced-motion check: each scene's finished state renders.

### Go-live, all at once

1. The client approves the preview.
2. Every pending migration is applied in Supabase, oldest first, once Darius has
   access: `20260914000000` (English title/description columns: `redesign`
   already selects `title_en`, and those reads fail without it), `20261005000000`
   (product copy), the 8 Oct payment migrations; then the 8 Oct edge functions.
3. The client adds the Paysera secrets and the callback URL.
4. `redesign` is merged into `main`; Vercel deploys production.
5. One real order for the cheapest item, then a refund.

Rollback: promote the previous production deployment in Vercel.

## Out of scope (separate work)

- Security items in the Supabase project, handled with the client.
- Copying product images from the supplier's CDN to the shop's own storage.
- The admin area's Stripe-era screens (webhook setup, refunds).
- Unused `privacy.*` strings that still mention Stripe.

## Open items

- The client checks every Lithuanian line we draft.
- Home-page products: the client tags them `home`, or the fallback order applies.
