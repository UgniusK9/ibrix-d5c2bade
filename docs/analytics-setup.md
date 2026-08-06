# Analytics & pixel setup

The tracking stack in this repo is **fully built but unconfigured**. As of the
last check, `analytics-config` returns:

```json
{"gaId":null,"metaPixelId":null,"tiktokPixelId":null}
```

Nothing is being tracked. No retargeting audiences are building, and any paid
spend on Meta or TikTok would run without conversion data.

Turning it on is four environment variables — no code changes required.

## What already exists

| Piece | File | State |
|---|---|---|
| Consent-gated GA4 loader | `src/components/cookies/CookieConsentProvider.tsx` | ready |
| Consent-gated Meta Pixel loader | `src/components/cookies/CookieConsentProvider.tsx` | ready |
| Consent-gated TikTok Pixel loader | `src/components/cookies/CookieConsentProvider.tsx` | ready |
| Funnel events (view → cart → checkout → purchase) | `src/hooks/useAnalytics.ts` | ready |
| Meta CAPI server events | `supabase/functions/meta-capi/index.ts` | ready |
| Server-side Purchase on payment | `supabase/functions/stripe-webhook/index.ts` | ready |
| Admin status panel | `src/components/admin/AnalyticsIntegrationStatus.tsx` | ready |

Events fire only after the visitor accepts cookies: GA4 needs **analytics**
consent, Meta and TikTok need **marketing** consent. That is deliberate and
GDPR-correct — do not bypass it.

Meta events are sent twice on purchase (browser pixel + server CAPI) and
deduplicated by a shared `eventID`. That is why `META_CAPI_TOKEN` matters:
without it you lose the server half and undercount conversions whenever a
browser blocks the pixel.

## Step 1 — Create the accounts

You need to do this part yourself; these are credentialed accounts.

**Google Analytics 4**
1. <https://analytics.google.com> → Admin → Create property
2. Property name `ibrix.lt`, time zone **Lithuania**, currency **EUR**
3. Data streams → Web → `https://ibrix.lt`
4. Copy the **Measurement ID** — format `G-XXXXXXXXXX`

**Meta Pixel**
1. <https://business.facebook.com/events_manager> → Connect data source → Web
2. Name it `IBRIX`, copy the **Pixel ID** (numeric)
3. Settings → Conversions API → **Generate access token**, copy it

**TikTok Pixel**
1. <https://ads.tiktok.com> → Assets → Events → Web Events → Set up
2. Choose **Manual installation / Developer mode** (not TikTok Pixel Helper)
3. Copy the **Pixel ID**

## Step 2 — Set the secrets

In the Supabase dashboard for project `xutfxycojeydcgrpsrsy`:
**Edge Functions → Secrets**, add:

| Secret | Value | Required |
|---|---|---|
| `GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` | yes |
| `META_PIXEL_ID` | numeric pixel id | yes |
| `META_CAPI_TOKEN` | Events Manager access token | strongly recommended |
| `TIKTOK_PIXEL_ID` | TikTok pixel id | if running TikTok ads |

Secrets are read at request time, so no redeploy of `analytics-config` is
needed — but redeploying is harmless if the values don't appear.

## Step 3 — Verify

Confirm the config endpoint now returns your IDs:

```bash
curl -s "https://xutfxycojeydcgrpsrsy.supabase.co/functions/v1/analytics-config"
```

Then on ibrix.lt, accept cookies and open the browser console. Every tracker
logs with a `[Analytics]` or `[Cookies]` prefix:

- `[Cookies] Google Analytics loaded: G-…`
- `[Cookies] Meta Pixel loaded: …`
- `[Cookies] TikTok Pixel loaded: …`
- `[Analytics] GA ViewItem: …` on any product page

Platform-side checks:
- **GA4** → Reports → Realtime
- **Meta** → Events Manager → Test Events (server events should appear under
  *Server*, proving CAPI works)
- **TikTok** → Events → Test Event

The admin panel's *Analytics* tab shows the same status without the console.

## Notes

- GA4 is loaded with `anonymize_ip: true` and `SameSite=Lax;Secure` cookies.
- TikTok's purchase event is `CompletePayment`, not `Purchase` — already
  handled in `useAnalytics.ts`.
- `storeEventForServer()` buffers the last 10 events plus `_fbp` / `_fbc`
  cookies in `sessionStorage` for Meta attribution. Only the Stripe webhook
  currently drains this for purchases; earlier funnel steps are browser-only.
