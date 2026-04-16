

# Planas: El. pašto pranešimų pilnas redizainas

## Tikslas
Visi el. paštai turi atrodyti profesionaliai, vieningu stiliumi (kaip FOTO 1), su dinamiškais metais footer'yje.

## Kas bus padaryta

### 1. Bendras dizaino sistema visiems el. paštams
Sukurti vieningą **email design system** `send-email/index.ts` viduje su shared helpers:
- `getEmailWrapper(content, options)` — bendras HTML skeleton (head, body, container, footer)
- `getEmailHeader()` — IBRIX logo header (juodas/baltas, minimalistinis)
- `getEmailFooter()` — footer su **dinamiškais metais** (`new Date().getFullYear()`) ir kontaktais
- `getInfoTable(rows)` — universali šviesiai pilka info lentelė (kaip FOTO 1: "UŽSAKYMO NUMERIS", "DATA", "EL.PAŠTAS", "VISO", "MOKĖJIMO BŪDAS")
- `getProductsTable(items)` — produktų lentelė su talpa/SKU
- `getAddressBlock(buyer, shipping)` — dviejų stulpelių adresų blokas
- Bendri CSS stiliai: Inter/system font, white bg (#ffffff), light gray accent (#f5f5f5), juodas header (#000000)

### 2. Užsakymo patvirtinimo (deposit_confirmed) šablonas — pagal FOTO 1
Struktūra:
1. **Header**: "UŽSAKYMAS GAUTAS" / "Dėkojame. Jūsų užsakymas priimtas."
2. **Info lentelė** (šviesiai pilka, su žymomis viršuje): UŽSAKYMO NUMERIS, DATA, EL.PAŠTAS, VISO, MOKĖJIMO BŪDAS
3. **"Užsakymo informacija"** sekcija su:
   - Produktų lentelė (Produktas | Viso) su talpa/specifikacijomis po pavadinimu
   - Suma, Pristatymas (su lokerio info), Mokėjimo būdas, Viso (su PVM įskaičiavimu)
4. **Pirkėjo / Pristatymo adresų blokai** (du stulpeliai)
5. PVM sąskaita-faktūra (jau pridėta praeitame žingsnyje, bet pertvarkyta į tą patį stilių)
6. **Footer**: dinamiški metai `© ${new Date().getFullYear()} IBRIX. Visos teisės saugomos.`

### 3. Kiti el. paštai — perdaryti tuo pačiu stiliumi
Naudoti tuos pačius helpers, keisti tik turinį:
- `balance_request` — likučio apmokėjimas (info lentelė + CTA mygtukas)
- `balance_paid` — apmokėjimo patvirtinimas
- `shipped` — siuntos info su tracking (info lentelė + CTA "Sekti siuntą")
- `gift_card` — dovanų kupono info (kodas, suma, žinutė)
- `verification_code` — OTP kodas dideliais skaitmenimis
- `welcome` — sveikinimo žinutė
- `password_reset` — slaptažodžio atkūrimas su CTA mygtuku

### 4. Dinamiški metai visur
Globaliai pakeisti visus hardcoded "2024" / "2025" į `new Date().getFullYear()` — tiek footer'yje, tiek bet kur kitur. Patikrinti visus 8 šablonus.

### 5. Atnaujinti EmailPreviewManager mock duomenis
Pridėti realistiškus mock duomenis, atitinkančius FOTO 1 pavyzdį (Autobrite produktai, VENIPAK paštomatas, Pagubės Sodų adresas), kad admin matytų tikrovišką preview.

## Failai
- **Keičiamas:** `supabase/functions/send-email/index.ts` — visiškai perrašyti template generavimą su shared helpers
- **Keičiamas:** `src/components/admin/EmailPreviewManager.tsx` — atnaujinti mock data realistiškesni

## Techniniai detaliai
- Šriftas: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, Arial, sans-serif` (universalus, palaiko visus el. pašto klientus)
- Spalvos: bg `#ffffff`, accent `#f5f5f5`, text `#1a1a1a`, muted `#666`, brand juoda `#000000`, link/CTA mėlyna `#2563eb`
- Plotis: max 600px (standartinis email width)
- Inline CSS visur (Outlook compat)
- Lentelės su `cellpadding`/`cellspacing` (legacy email klientai)
- Footer metai: `${new Date().getFullYear()}` — JS expression edge function viduje

