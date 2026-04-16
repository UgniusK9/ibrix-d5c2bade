// Inbank installment payment creation edge function
// Initiates a Buy-Now-Pay-Later (installment) financing application via Inbank Partner API.
// PLACEHOLDER IMPLEMENTATION — confirm exact endpoints + JWT signing once Partner sutartis pasirašyta.
//
// Expected secrets (add via Lovable Cloud → Secrets when available):
//   INBANK_PARTNER_ID   — partner identifier from Inbank Partner Portal
//   INBANK_API_KEY      — API key / client_id
//   INBANK_API_SECRET   — secret for JWT signing / request authentication
//   INBANK_API_URL      — e.g. https://partner-api.inbank.lt (sandbox or live)
//   INBANK_RETURN_URL   — where customer returns after applying (defaults to /uzsakymas)
//   INBANK_CALLBACK_URL — webhook URL (defaults to inbank-callback edge function)
//   INBANK_TEST_MODE    — '1' for sandbox, '0' for live (defaults to '1')

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const log = (step: string, details?: unknown) => {
  const timestamp = new Date().toISOString();
  console.log(`[INBANK-CREATE][${timestamp}] ${step}`, details ? JSON.stringify(details) : '');
};

// Inbank-typical minimum financing amount (EUR)
const INBANK_MIN_AMOUNT_EUR = 100;
const INBANK_MAX_AMOUNT_EUR = 10000;

async function generateHmacSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { orderId, periodMonths = 12 } = await req.json();
    log('Request received', { orderId, periodMonths });

    // ─── Validate configuration ─────────────────────────────────────
    const partnerId = Deno.env.get('INBANK_PARTNER_ID');
    const apiKey = Deno.env.get('INBANK_API_KEY');
    const apiSecret = Deno.env.get('INBANK_API_SECRET');
    const apiUrl = Deno.env.get('INBANK_API_URL') ?? 'https://partner-api.inbank.lt';
    const returnUrl = Deno.env.get('INBANK_RETURN_URL') ?? 'https://ibrix.lt/uzsakymas';
    const callbackUrl =
      Deno.env.get('INBANK_CALLBACK_URL') ??
      'https://huawtqggkzujiptndmns.supabase.co/functions/v1/inbank-callback';
    const testMode = Deno.env.get('INBANK_TEST_MODE') ?? '1';

    if (!partnerId || !apiKey || !apiSecret) {
      log('Inbank not configured');
      return new Response(
        JSON.stringify({
          error: 'Inbank išsimokėjimas dar nesukonfigūruotas. Pasirinkite kitą mokėjimo būdą.',
          configured: false,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Load order ─────────────────────────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      log('Order not found', { orderId, error: orderError });
      return new Response(JSON.stringify({ error: 'Užsakymas nerastas' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const totalEur = Number(order.total_eur);

    // ─── Validate amount limits ─────────────────────────────────────
    if (totalEur < INBANK_MIN_AMOUNT_EUR) {
      return new Response(
        JSON.stringify({
          error: `Inbank išsimokėjimas galimas nuo ${INBANK_MIN_AMOUNT_EUR}€`,
          minAmount: INBANK_MIN_AMOUNT_EUR,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (totalEur > INBANK_MAX_AMOUNT_EUR) {
      return new Response(
        JSON.stringify({
          error: `Inbank išsimokėjimas galimas iki ${INBANK_MAX_AMOUNT_EUR}€`,
          maxAmount: INBANK_MAX_AMOUNT_EUR,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Validate period ────────────────────────────────────────────
    const allowedPeriods = [3, 6, 12, 24, 36];
    if (!allowedPeriods.includes(periodMonths)) {
      return new Response(
        JSON.stringify({
          error: 'Neteisingas išsimokėjimo terminas',
          allowed: allowedPeriods,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Build Inbank payload (placeholder shape) ───────────────────
    const items = (order.order_items ?? []).map((item: any) => ({
      name: item.title_snapshot,
      sku: item.sku_snapshot,
      quantity: item.quantity,
      unit_price: Number(item.unit_price_eur),
      total: Number(item.unit_price_eur) * item.quantity,
    }));

    const payload = {
      partner_id: partnerId,
      order_id: order.id,
      order_number: order.order_number,
      amount: totalEur,
      currency: 'EUR',
      period_months: periodMonths,
      customer: {
        email: order.email,
        first_name: order.first_name,
        last_name: order.last_name,
        phone: order.phone ?? '',
      },
      items,
      return_url: `${returnUrl}?order_id=${order.id}&payment=inbank`,
      callback_url: callbackUrl,
      test: testMode === '1',
    };

    const payloadString = JSON.stringify(payload);
    const signature = await generateHmacSignature(payloadString, apiSecret);

    log('Calling Inbank API', { url: apiUrl, amount: totalEur, period: periodMonths });

    const inbankResponse = await fetch(`${apiUrl}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'X-Signature': signature,
      },
      body: payloadString,
    });

    const inbankData = await inbankResponse.json().catch(() => ({}));

    if (!inbankResponse.ok) {
      log('Inbank API error', { status: inbankResponse.status, data: inbankData });
      return new Response(
        JSON.stringify({
          error: 'Inbank paraiškos inicijavimas nepavyko',
          details: inbankData,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const redirectUrl = inbankData.application_url ?? inbankData.redirect_url;
    if (!redirectUrl) {
      return new Response(
        JSON.stringify({ error: 'Inbank negrąžino paraiškos nuorodos' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Record pending payment ─────────────────────────────────────
    await supabase.from('payments').insert({
      order_id: order.id,
      type: 'deposit',
      amount_eur: totalEur,
      status: 'pending',
    });

    await supabase
      .from('orders')
      .update({
        payment_provider: 'inbank',
        payment_method_code: `inbank_${periodMonths}m`,
      })
      .eq('id', order.id);

    log('Success', { redirectUrl: redirectUrl.substring(0, 80) });

    return new Response(JSON.stringify({ redirectUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log('Error', error);
    const message = error instanceof Error ? error.message : 'Inbank klaida';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
