# Paysera setup

Everything in the code is done. Paysera goes live when you add two secrets and
register one callback URL — no code changes needed.

## Why this was broken

Before this branch, **the store could not take a single order.** Every payment
method shown at checkout routed to `opay` or `inbank`, and the checkout
function's validation schema accepted only `stripe`, `paypal`, `paysera`. Every
attempt would have failed with a 400 before an order row was created — which is
consistent with `orders` having zero rows.

All nine Paysera methods were sitting disabled behind
`enabled: false, // Will be enabled when Paysera is configured`.

Now: Paysera methods are enabled, opay/inbank/stripe/paypal are disabled.

## Step 1 — Get your Paysera credentials

Sign in at <https://bank.paysera.com> → **Projects and activity** → your project.

You need two values:

| Value | Where |
|---|---|
| **Project ID** | shown on the project page, numeric |
| **Project password** (signature password) | same page, under project settings |

If you have no project yet, create one for `ibrix.lt`. Paysera verifies the
business before allowing live payments — start that early, it takes days.

## Step 2 — Register the callback URL

In the Paysera project settings, set the **callback / notification URL** to:

```
https://xutfxycojeydcgrpsrsy.supabase.co/functions/v1/paysera-callback
```

This is how payment confirmations reach the site. Without it, customers pay
successfully and their orders stay marked unpaid forever.

The `paysera-callback` function is deployed with `verify_jwt: false`, so
Paysera's servers can reach it unauthenticated. Do not change that.

## Step 3 — Add the secrets

Supabase → project `xutfxycojeydcgrpsrsy` → **Edge Functions → Secrets**:

| Secret | Required | Notes |
|---|---|---|
| `PAYSERA_PROJECT_ID` | yes | numeric project id |
| `PAYSERA_SIGN_PASSWORD` | yes | signature password — a real credential |
| `PAYSERA_CALLBACK_URL` | no | defaults to the URL above |
| `PAYSERA_ACCEPT_URL` | no | defaults to `/uzsakymas` |
| `PAYSERA_CANCEL_URL` | no | defaults to `/checkout?cancelled=true` |

Until `PAYSERA_PROJECT_ID` and `PAYSERA_SIGN_PASSWORD` exist,
`create-paysera-payment` returns a clean 503 with
"Paysera mokėjimai šiuo metu neveikia" rather than failing obscurely.

## Step 4 — Test with a real order

The shop has never processed a transaction, so this is the first real exercise
of the money path. Buy the cheapest in-stock item yourself, then refund it.

Check afterwards:

1. A row appears in `orders` with status `deposit_paid` or `balance_paid`
2. A row appears in `payments` with status `succeeded`
3. The order confirmation page renders
4. The confirmation email arrives

If the order sits at status `created`, the callback is not arriving — re-check
step 2.

## How the flow works

```
Checkout  →  checkout fn         creates order, skipStripe: true
          →  create-paysera-payment   signs request, returns redirectUrl
          →  bank.paysera.com          customer pays
          →  paysera-callback          verifies signature, marks order paid
          →  /uzsakymas                confirmation page
```

## Known issues not fixed here

- **`paysera-luminor` has `bankCode: 'lku'`**, identical to `paysera-lku`.
  Luminor payments would route to the wrong bank. Confirm the correct code
  against Paysera's bank list before enabling Luminor.
- **Preorder orders double-charge shipping.** `deposit_total_eur` includes
  shipping and `balance_total_eur` does not subtract it, so deposit + balance
  exceeds the order total by the shipping amount. A discount code produces the
  mirror error. Needs a decision on whether shipping belongs to the deposit or
  the balance.
- **Inventory is never decremented** after a sale, so overselling is possible.
- `opay-callback` and `inbank-callback` are deployed with `verify_jwt: true`,
  so those gateways could never have confirmed payments. Irrelevant while
  disabled, but must be fixed before re-enabling either.
