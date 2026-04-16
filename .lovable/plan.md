

# Planas: 4 pakeitimai svetainėje

## Kas bus padaryta

### 1. Hero mygtuko „Peržiūrėti konstruktorius" taisymas
**Problema:** Oranžinis CTA mygtukas Hero sekcijoje vizualiai „išlenda" arba turi overflow problemą (matoma 1-oje nuotraukoje).
**Sprendimas:** Pridėti `whitespace-nowrap`, `overflow-hidden`, ir patikslinti `rounded` stilių ant mygtuko, kad tekstas ir rodyklė tilptų be overflow. Taip pat patikrinti, ar `h-14 px-8` neprieštarauja mobiliame view — galimai sumažinti padding arba pridėti `truncate`.

**Failas:** `src/components/home/HeroSection.tsx` (42-52 eil.)

---

### 2. Admin sekcija: el. pašto šablonų peržiūra
**Problema:** Norite admin panelėje matyti, kaip atrodo siunčiami el. laiškai (pvz., užsakymo patvirtinimas).
**Sprendimas:** Sukurti naują admin tab „El. paštas" (`EmailPreviewManager.tsx`), kuriame bus galima pasirinkti šablono tipą (deposit_confirmed, balance_request, shipped ir kt.) ir matyti live HTML preview su mockup duomenimis iframe'e.

**Naujas failas:** `src/components/admin/EmailPreviewManager.tsx`
**Keičiamas failas:** `src/pages/Admin.tsx` — pridėti naują tab

---

### 3. Sąskaitos faktūros pridėjimas prie užsakymo patvirtinimo el. laiško
**Problema:** Norite, kad užsakymo patvirtinimo el. laiške apačioje būtų prisegta PVM sąskaita-faktūra (panašiai kaip 2-oje nuotraukoje — DetailerPlace stiliaus, bet IBRIX tematika).
**Sprendimas:** Atnaujinti `getDepositConfirmedEmail` funkciją `send-email/index.ts`, kad po pagrindinio turinio būtų generuojama inline sąskaita su:
- Pardavėjo info (IBRIX)
- Pirkėjo info
- Prekių lentelė (produktas, SKU, kiekis, kaina be PVM, kaina su PVM)
- Pristatymo kaina
- Viso su PVM, PVM suma
- Sąskaitos numeris ir data

**Failas:** `supabase/functions/send-email/index.ts` — papildyti `getDepositConfirmedEmail` funkciją

---

### 4. Po apmokėjimo — nukreipimas į užsakymo patvirtinimo puslapį
**Problema:** Po apmokėjimo vartotojas nukreipiamas į pradinį puslapį, o ne į užsakymo patvirtinimo puslapį.
**Analizė:** Stripe checkout jau nukreipia į `/uzsakymas?order_id=...&session_id=...`. Paysera naudoja `PAYSERA_ACCEPT_URL` env kintamąjį. Tikėtina, kad Paysera `PAYSERA_ACCEPT_URL` nustatytas į `https://ibrix.lt/` vietoj `https://ibrix.lt/uzsakymas?order_id={orderid}`.
**Sprendimas:** Atnaujinti `create-paysera-payment/index.ts`, kad `accepturl` būtų dinamiškai generuojamas su `order_id` parametru (pvz., `https://ibrix.lt/uzsakymas?order_id=${order.id}`), o ne naudotų statinį env kintamąjį. Analogiškai patikrinti wallet/credits flow.

**Failas:** `supabase/functions/create-paysera-payment/index.ts`

---

## Techniniai detaliai

### Admin email preview komponentas
- Dropdown su visais email tipais
- Mock duomenys kiekvienam tipui
- `supabase.functions.invoke('send-email', { body: { type, ...mockData, dryRun: true } })` arba tiesiog generuoti HTML client-side
- Kadangi šablonai yra edge function viduje, paprasčiausias būdas — pridėti `preview` režimą send-email funkcijoje, kuris grąžina HTML be siuntimo

### Sąskaita el. laiške
- Naudosime inline HTML lentelę (ne PDF), nes el. pašto klientai nepalaiko priedų be specialių API
- Stilius pagal 2-ą nuotrauką: profesionali PVM sąskaita su IBRIX branding
- PVM 21% skaičiavimas iš subtotal

