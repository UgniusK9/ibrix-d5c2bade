import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentIntentRequest {
  orderId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    const { orderId }: PaymentIntentRequest = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Trūksta užsakymo ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Užsakymas nerastas' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if already has payment intent
    if (order.payment_intent_id) {
      // Retrieve existing payment intent
      const existingPaymentIntent = await stripe.paymentIntents.retrieve(order.payment_intent_id);
      
      if (existingPaymentIntent.status === 'succeeded') {
        return new Response(
          JSON.stringify({ error: 'Užsakymas jau apmokėtas' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({
          clientSecret: existingPaymentIntent.client_secret,
          paymentIntentId: existingPaymentIntent.id,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Fetch order items for description
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('title_snapshot, quantity')
      .eq('order_id', orderId);

    const itemsDescription = orderItems
      ?.map(item => `${item.title_snapshot} x${item.quantity}`)
      .join(', ') || 'IBRIX užsakymas';

    // Create Stripe customer or find existing
    let stripeCustomerId: string | undefined;
    
    const existingCustomers = await stripe.customers.list({
      email: order.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      stripeCustomerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: order.email,
        name: `${order.first_name} ${order.last_name}`,
        phone: order.phone || undefined,
        metadata: {
          order_id: orderId,
          order_number: order.order_number,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.total_cents,
      currency: order.currency.toLowerCase(),
      customer: stripeCustomerId,
      description: itemsDescription.slice(0, 500),
      metadata: {
        order_id: orderId,
        order_number: order.order_number,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update order with payment intent id
    await supabase
      .from('orders')
      .update({
        payment_intent_id: paymentIntent.id,
        payment_provider: 'stripe',
      })
      .eq('id', orderId);

    console.log(`Payment intent ${paymentIntent.id} created for order ${order.order_number}`);

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Payment intent error:', error);
    return new Response(
      JSON.stringify({ error: 'Mokėjimo klaida' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
