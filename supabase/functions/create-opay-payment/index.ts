// OPAY payment creation edge function
// Generates a payment redirect URL for OPAY (opay.lt)
// PLACEHOLDER IMPLEMENTATION — exact API request/signature format must be confirmed
// against the official OPAY merchant documentation once credentials are received.
//
// Expected secrets (add via Lovable Cloud → Secrets when available):
//   OPAY_MERCHANT_ID    — your merchant identifier
//   OPAY_API_KEY        — public API key
//   OPAY_SECRET_KEY     — secret used for HMAC/MD5 signing
//   OPAY_API_URL        — e.g. https://api.opay.lt/v1 (or sandbox URL)
//   OPAY_CALLBACK_URL   — webhook URL (defaults to opay-callback edge function)
//   OPAY_ACCEPT_URL     — success redirect (defaults to /uzsakymas)
//   OPAY_CANCEL_URL     — cancel redirect (defaults to /checkout?cancelled=true)
//   OPAY_TEST_MODE      — '1' for sandbox, '0' for live (defaults to '1')

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const log = (step: string, details?: unknown) => {
  const timestamp = new Date().toISOString();
  console.log(`[OPAY-CREATE][${timestamp}] ${step}`, details ? JSON.stringify(details) : '');
};

// HMAC-SHA256 signature (common for OPAY-like APIs — adjust to spec)
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
    const { orderId, paymentType = 'full', bankCode } = await req.json();
    log('Request received', { orderId, paymentType, bankCode });

    // ─── Validate configuration ─────────────────────────────────────
    const merchantId = Deno.env.get('OPAY_MERCHANT_ID');
    const apiKey = Deno.env.get('OPAY_API_KEY');
    const secretKey = Deno.env.get('OPAY_SECRET_KEY');
    const apiUrl = Deno.env.get('OPAY_API_URL') ?? 'https://api.opay.lt/v1';
    const callbackUrl =
      Deno.env.get('OPAY_CALLBACK_URL') ??
      `https://huawtqggkzujiptndmns.supabase.co/functions/v1/opay-callback`;
    const acceptUrl = Deno.env.get('OPAY_ACCEPT_URL') ?? 'https://ibrix.lt/uzsakymas';
    const cancelUrl =
      Deno.env.get('OPAY_CANCEL_URL') ?? 'https://ibrix.lt/checkout?cancelled=true';
    const testMode = Deno.env.get('OPAY_TEST_MODE') ?? '1';

    if (!merchantId || !apiKey || !secretKey) {
      log('OPAY not configured');
      return new Response(
        JSON.stringify({
          error: 'OPAY mokėjimai dar nesukonfigūruoti. Pasirinkite kitą mokėjimo būdą.',
          configured: false,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Load order ─────────────────────────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      log('Order not found', { orderId, error: orderError });
      return new Response(JSON.stringify({ error: 'Užsakymas nerastas' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── Determine amount ───────────────────────────────────────────
    let amountCents: number;
    let description: string;

    if (paymentType === 'deposit') {
      amountCents = Math.round(Number(order.deposit_total_eur) * 100);
      description = `Depozitas už užsakymą ${order.order_number}`;
    } else if (paymentType === 'balance') {
      amountCents = Math.round(Number(order.balance_total_eur) * 100);
      description = `Likutis už užsakymą ${order.order_number}`;
    } else {
      amountCents = Math.round(Number(order.total_eur) * 100);
      description = `Užsakymas ${order.order_number}`;
    }

    if (amountCents <= 0) {
      return new Response(JSON.stringify({ error: 'Neteisinga suma' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── Build OPAY payload (placeholder — confirm field names) ─────
    const payload = {
      merchant_id: merchantId,
      order_id: order.id,
      order_number: order.order_number,
      amount: amountCents,
      currency: 'EUR',
      description,
      customer: {
        email: order.email,
        first_name: order.first_name,
        last_name: order.last_name,
        phone: order.phone ?? '',
      },
      callback_url: callbackUrl,
      accept_url: `${acceptUrl}?order_id=${order.id}&payment=opay`,
      cancel_url: cancelUrl,
      bank_code: bankCode ?? null,
      test: testMode === '1',
    };

    const payloadString = JSON.stringify(payload);
    const signature = await generateHmacSignature(payloadString, secretKey);

    log('Calling OPAY API', { url: apiUrl, amount: amountCents });

    const opayResponse = await fetch(`${apiUrl}/payments/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'X-Signature': signature,
      },
      body: payloadString,
    });

    const opayData = await opayResponse.json().catch(() => ({}));

    if (!opayResponse.ok) {
      log('OPAY API error', { status: opayResponse.status, data: opayData });
      return new Response(
        JSON.stringify({
          error: 'OPAY mokėjimo inicijavimas nepavyko',
          details: opayData,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const redirectUrl = opayData.redirect_url ?? opayData.payment_url;
    if (!redirectUrl) {
      return new Response(
        JSON.stringify({ error: 'OPAY negrąžino mokėjimo nuorodos' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Record pending payment ─────────────────────────────────────
    await supabase.from('payments').insert({
      order_id: order.id,
      type: paymentType === 'balance' ? 'balance' : 'deposit',
      amount_eur: amountCents / 100,
      status: 'pending',
    });

    await supabase
      .from('orders')
      .update({
        payment_provider: 'opay',
        payment_method_code: bankCode ?? 'opay',
      })
      .eq('id', order.id);

    log('Success', { redirectUrl: redirectUrl.substring(0, 80) });

    return new Response(JSON.stringify({ redirectUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log('Error', error);
    const message = error instanceof Error ? error.message : 'OPAY klaida';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
