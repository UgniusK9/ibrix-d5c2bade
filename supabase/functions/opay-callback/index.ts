// OPAY callback (webhook) handler
// Receives payment status notifications from OPAY and updates the order accordingly.
// PLACEHOLDER — adjust signature verification + payload parsing to match OPAY spec.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

const log = (step: string, details?: unknown) => {
  const timestamp = new Date().toISOString();
  console.log(`[OPAY-CALLBACK][${timestamp}] ${step}`, details ? JSON.stringify(details) : '');
};

async function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return expected === signature.toLowerCase();
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
    const secretKey = Deno.env.get('OPAY_SECRET_KEY');
    if (!secretKey) {
      log('Not configured');
      return new Response('Not configured', { status: 503, headers: corsHeaders });
    }

    const rawBody = await req.text();
    const signature = req.headers.get('x-signature') ?? '';

    log('Callback received', { signaturePresent: !!signature, bodyLength: rawBody.length });

    // ─── Verify signature ───────────────────────────────────────────
    const valid = await verifyHmacSignature(rawBody, signature, secretKey);
    if (!valid) {
      log('Invalid signature');
      return new Response('Invalid signature', { status: 401, headers: corsHeaders });
    }

    const data = JSON.parse(rawBody);
    const { order_id, status, amount, transaction_id } = data;

    log('Parsed payload', { order_id, status, amount, transaction_id });

    if (!order_id) {
      return new Response('Missing order_id', { status: 400, headers: corsHeaders });
    }

    // ─── Update order based on status ───────────────────────────────
    if (status === 'paid' || status === 'completed' || status === 'success') {
      await supabase
        .from('orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          paid_amount_cents: Math.round(Number(amount) * 100),
        })
        .eq('id', order_id);

      await supabase
        .from('payments')
        .update({
          status: 'succeeded',
          stripe_payment_intent_id: transaction_id, // reuse field for OPAY tx id
        })
        .eq('order_id', order_id)
        .eq('status', 'pending');

      log('Order marked as paid', { order_id });
    } else if (status === 'failed' || status === 'cancelled') {
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('order_id', order_id)
        .eq('status', 'pending');

      log('Payment failed/cancelled', { order_id, status });
    }

    return new Response('OK', { status: 200, headers: corsHeaders });
  } catch (error) {
    log('Error', error);
    return new Response('Error', { status: 500, headers: corsHeaders });
  }
});
