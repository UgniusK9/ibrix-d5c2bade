import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { encodeBase64 } from "https://deno.land/std@0.220.1/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const log = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[PAYSERA-CREATE][${timestamp}] ${step}`, details ? JSON.stringify(details) : '');
};

// Generate Paysera signature (MD5)
async function generateSignature(data: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data + password);
  const hashBuffer = await crypto.subtle.digest('MD5', dataBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Encode data for Paysera (base64 URL-safe)
function encodeData(params: Record<string, string>): string {
  const query = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const encoder = new TextEncoder();
  return encodeBase64(encoder.encode(query)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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
    const { orderId, paymentType, bankCode } = await req.json();
    
    log('Request received', { orderId, paymentType, bankCode });

    // Validate required env vars
    const projectId = Deno.env.get('PAYSERA_PROJECT_ID');
    const signPassword = Deno.env.get('PAYSERA_SIGN_PASSWORD');
    const callbackUrl = Deno.env.get('PAYSERA_CALLBACK_URL');
    const acceptUrl = Deno.env.get('PAYSERA_ACCEPT_URL');
    const cancelUrl = Deno.env.get('PAYSERA_CANCEL_URL');

    if (!projectId || !signPassword) {
      log('Paysera not configured');
      return new Response(
        JSON.stringify({ error: 'Paysera mokėjimai šiuo metu neveikia' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch order from DB (TRUST DB, NOT CLIENT)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      log('Order not found', { orderId, error: orderError });
      return new Response(
        JSON.stringify({ error: 'Užsakymas nerastas' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log('Order found', { orderNumber: order.order_number, status: order.status });

    // Determine amount based on payment type
    let amountCents: number;
    let paymentDescription: string;

    if (paymentType === 'deposit') {
      amountCents = Math.round(order.deposit_total_eur * 100);
      paymentDescription = `Depozitas už užsakymą ${order.order_number}`;
    } else if (paymentType === 'balance') {
      amountCents = Math.round(order.balance_total_eur * 100);
      paymentDescription = `Likutis už užsakymą ${order.order_number}`;
    } else {
      // Full payment
      amountCents = Math.round(order.total_eur * 100);
      paymentDescription = `Užsakymas ${order.order_number}`;
    }

    if (amountCents <= 0) {
      log('Invalid amount', { amountCents });
      return new Response(
        JSON.stringify({ error: 'Neteisinga suma mokėjimui' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log('Payment amount calculated', { amountCents, paymentType });

    // Build Paysera request parameters
    const params: Record<string, string> = {
      projectid: projectId,
      orderid: order.id,
      accepturl: `https://ibrix.lt/uzsakymas?order_id=${order.id}&payment=paysera`,
      cancelurl: cancelUrl || `https://ibrix.lt/checkout?cancelled=true`,
      callbackurl: callbackUrl || `https://huawtqggkzujiptndmns.supabase.co/functions/v1/paysera-callback`,
      amount: amountCents.toString(),
      currency: 'EUR',
      country: 'LT',
      paytext: paymentDescription,
      p_email: order.email,
      p_firstname: order.first_name,
      p_lastname: order.last_name,
      test: '0', // Set to '1' for test mode
      version: '1.6',
    };

    // Add bank code if specified
    if (bankCode) {
      params.payment = bankCode;
    }

    log('Paysera params built', { orderNumber: order.order_number, amount: amountCents });

    // Encode data and generate signature
    const encodedData = encodeData(params);
    const signature = await generateSignature(encodedData, signPassword);

    // Build redirect URL
    const redirectUrl = `https://www.paysera.com/pay/?data=${encodedData}&sign=${signature}`;

    log('Redirect URL generated', { url: redirectUrl.substring(0, 80) + '...' });

    // Create pending payment record
    await supabase.from('payments').insert({
      order_id: order.id,
      type: paymentType === 'balance' ? 'balance' : 'deposit',
      amount_eur: amountCents / 100,
      status: 'pending',
    });

    // Update order with payment provider info
    await supabase
      .from('orders')
      .update({
        payment_provider: 'paysera',
        payment_method_code: bankCode || 'paysera',
      })
      .eq('id', order.id);

    return new Response(
      JSON.stringify({ redirectUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    log('Error', error);
    const message = error instanceof Error ? error.message : 'Paysera klaida';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
