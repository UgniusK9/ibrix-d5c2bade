import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const log = (step: string, details?: any) => {
  console.log(`[REQUEST-BALANCE] ${step}`, details ? JSON.stringify(details) : '');
};

Deno.serve(async (req) => {
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { orderId } = await req.json();
    log('Balance payment request', { orderId, adminId: user.id });

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate order status
    if (order.status !== 'deposit_paid' && order.status !== 'awaiting_balance') {
      return new Response(JSON.stringify({ 
        error: `Cannot request balance for order with status: ${order.status}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if balance already paid
    if (order.balance_paid_at) {
      return new Response(JSON.stringify({ error: 'Balance already paid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for existing pending balance payment
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('stripe_checkout_session_id')
      .eq('order_id', orderId)
      .eq('type', 'balance')
      .eq('status', 'pending')
      .maybeSingle();

    if (existingPayment?.stripe_checkout_session_id) {
      // Return existing session URL
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(existingPayment.stripe_checkout_session_id);
        if (existingSession.url && existingSession.status === 'open') {
          log('Returning existing session', { sessionId: existingSession.id });
          return new Response(JSON.stringify({
            success: true,
            paymentUrl: existingSession.url,
            existing: true,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (e) {
        // Session expired, create new one
        log('Existing session expired, creating new', e);
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

    log('Balance checkout session created', { sessionId: session.id });

    // Create pending payment record
    await supabase.from('payments').insert({
      order_id: orderId,
      type: 'balance',
      status: 'pending',
      amount_eur: order.balance_total_eur,
      stripe_checkout_session_id: session.id,
    });

    // Update order status to awaiting_balance
    await supabase
      .from('orders')
      .update({ status: 'awaiting_balance' })
      .eq('id', orderId);

    // Send email with payment link
    try {
      await fetch(
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
          }),
        }
      );
      log('Balance request email sent');
    } catch (emailError) {
      log('Email send failed (non-blocking)', emailError);
    }

    return new Response(JSON.stringify({
      success: true,
      paymentUrl: session.url,
      sessionId: session.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    log('Error', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
