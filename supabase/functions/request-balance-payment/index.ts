import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

// CORS with allowed origins only - prevents CSRF attacks on admin endpoints
const ALLOWED_ORIGINS = [
  'https://ibrix.lt',
  'https://www.ibrix.lt',
  'https://ibrix.lovable.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// Generate request ID for tracing
const generateRequestId = () => crypto.randomUUID().slice(0, 8);

const log = (requestId: string, step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[REQUEST-BALANCE][${requestId}][${timestamp}] ${step}`, details ? JSON.stringify(details) : '');
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const requestId = generateRequestId();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
  });

  try {
    // Verify admin auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      log(requestId, 'No auth header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      log(requestId, 'Auth failed', { error: authError?.message });
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role - MUST verify server-side
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      log(requestId, 'Non-admin access attempt', { userId: user.id, role: userData?.role });
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { orderId, customMessage } = body;
    log(requestId, 'Balance payment request', { orderId, adminId: user.id, adminEmail: user.email, hasCustomMessage: !!customMessage });

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      log(requestId, 'Order not found', { orderId, error: orderError });
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log(requestId, 'Order found', { 
      orderNumber: order.order_number, 
      status: order.status,
      balanceEur: order.balance_total_eur 
    });

    // Validate order status
    if (order.status !== 'deposit_paid' && order.status !== 'awaiting_balance') {
      log(requestId, 'Invalid order status', { status: order.status });
      return new Response(JSON.stringify({ 
        error: `Cannot request balance for order with status: ${order.status}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if balance already paid
    if (order.balance_paid_at) {
      log(requestId, 'Balance already paid', { balancePaidAt: order.balance_paid_at });
      return new Response(JSON.stringify({ error: 'Balance already paid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for existing pending balance payment with valid session
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('stripe_checkout_session_id')
      .eq('order_id', orderId)
      .eq('type', 'balance')
      .eq('status', 'pending')
      .maybeSingle();

    if (existingPayment?.stripe_checkout_session_id) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(existingPayment.stripe_checkout_session_id);
        if (existingSession.url && existingSession.status === 'open') {
          log(requestId, 'Returning existing valid session', { sessionId: existingSession.id });
          return new Response(JSON.stringify({
            success: true,
            paymentUrl: existingSession.url,
            existing: true,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (e) {
        log(requestId, 'Existing session expired, creating new', { error: e });
      }
    }

    // Get order items for line items description
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('title_snapshot, quantity')
      .eq('order_id', orderId);

    const itemsDescription = orderItems
      ?.map(item => `${item.title_snapshot} x${item.quantity}`)
      .join(', ') || 'Užsakymo likutis';

    // Find or use existing Stripe customer
    let stripeCustomerId: string | undefined;
    const existingCustomers = await stripe.customers.list({
      email: order.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      stripeCustomerId = existingCustomers.data[0].id;
    }

    const origin = req.headers.get('origin') || 'https://ibrix.lt';

    // Create Stripe Checkout Session for balance
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      customer_email: stripeCustomerId ? undefined : order.email,
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(Number(order.balance_total_eur) * 100),
          product_data: {
            name: `Užsakymo ${order.order_number} likutis`,
            description: itemsDescription.slice(0, 500),
          },
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/uzsakymas?order_id=${order.id}&balance_paid=true`,
      cancel_url: `${origin}/account`,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        payment_type: 'balance',
      },
      payment_intent_data: {
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
          payment_type: 'balance',
        },
      },
    });

    log(requestId, 'Balance checkout session created', { 
      sessionId: session.id, 
      url: session.url?.substring(0, 50) + '...' 
    });

    // Create pending payment record
    const { error: paymentError } = await supabase.from('payments').insert({
      order_id: orderId,
      type: 'balance',
      status: 'pending',
      amount_eur: order.balance_total_eur,
      stripe_checkout_session_id: session.id,
    });

    if (paymentError) {
      log(requestId, 'Failed to create payment record', paymentError);
    }

    // Log balance request with custom message for audit trail
    const { error: balanceRequestError } = await supabase.from('balance_requests').insert({
      order_id: orderId,
      requested_by_user_id: user.id,
      message: customMessage || null,
      payment_url: session.url,
      sent_at: new Date().toISOString(),
    });

    if (balanceRequestError) {
      log(requestId, 'Failed to log balance request', balanceRequestError);
    }

    // Update order status to awaiting_balance
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'awaiting_balance' })
      .eq('id', orderId);

    if (updateError) {
      log(requestId, 'Failed to update order status', updateError);
    }

    // Track balance_requested event
    await supabase.from('events').insert({
      name: 'balance_requested',
      user_id: order.user_id,
      properties: {
        order_id: orderId,
        order_number: order.order_number,
        balance_eur: order.balance_total_eur,
        requested_by: user.id,
        has_custom_message: !!customMessage,
      },
    });

    log(requestId, 'Balance requested event tracked');

    // Send email with payment link and custom message
    try {
      const emailResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            type: 'balance_request',
            email: order.email,
            firstName: order.first_name,
            orderNumber: order.order_number,
            balanceEur: order.balance_total_eur,
            paymentUrl: session.url,
            customMessage: customMessage || null,
          }),
        }
      );
      const emailData = await emailResponse.json();
      log(requestId, 'Balance request email sent', { 
        status: emailResponse.status, 
        success: emailData.success,
        fallback: emailData.fallback 
      });
    } catch (emailError) {
      log(requestId, 'Email send failed (non-blocking)', emailError);
    }

    return new Response(JSON.stringify({
      success: true,
      paymentUrl: session.url,
      sessionId: session.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    log(requestId, 'Error', { error: error.message, stack: error.stack });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});