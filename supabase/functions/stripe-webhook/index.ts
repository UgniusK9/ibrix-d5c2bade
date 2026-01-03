import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const log = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}`, details ? JSON.stringify(details) : '');
};

// Send email via send-email function (fire-and-forget)
async function sendEmail(type: string, data: any) {
  try {
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ type, ...data }),
      }
    );
    log('Email sent', { type, status: response.status });
  } catch (err) {
    log('Email send failed (non-blocking)', err);
  }
}

// Track analytics event server-side
async function trackEvent(name: string, orderId: string, properties: any) {
  try {
    // Get order to find user_id
    const { data: order } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .maybeSingle();

    await supabase.from('events').insert({
      name,
      user_id: order?.user_id || null,
      properties: {
        order_id: orderId,
        ...properties,
      },
    });
    log('Event tracked', { name, orderId });
  } catch (err) {
    log('Event tracking failed (non-blocking)', err);
  }
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  if (!signature || !webhookSecret) {
    log('Missing signature or webhook secret');
    return new Response('Missing signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    log('Webhook signature verification failed', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  log('Received webhook event', { type: event.type });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        const paymentType = session.metadata?.payment_type;
        const orderNumber = session.metadata?.order_number;

        if (!orderId) {
          log('No order_id in session metadata');
          break;
        }

        log('Processing checkout.session.completed', { orderId, paymentType, orderNumber });

        if (paymentType === 'deposit') {
          // DEPOSIT PAYMENT - Create order items, shipment, update status
          
          // Update order status
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'deposit_paid',
              paid_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          if (updateError) {
            log('Failed to update order status', updateError);
            throw new Error('Failed to update order status');
          }

          // Create payment record
          await supabase.from('payments').insert({
            order_id: orderId,
            type: 'deposit',
            status: 'succeeded',
            amount_eur: (session.amount_total || 0) / 100,
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
          });

          // Create shipment with tracking token
          const { data: existingShipment } = await supabase
            .from('shipments')
            .select('id')
            .eq('order_id', orderId)
            .maybeSingle();

          if (!existingShipment) {
            await supabase.from('shipments').insert({
              order_id: orderId,
              status: 'pending',
            });
          }

          // Get shipment for tracking token
          const { data: shipment } = await supabase
            .from('shipments')
            .select('tracking_token')
            .eq('order_id', orderId)
            .single();

          log('Deposit payment processed', { orderId, orderNumber });

          // Track deposit_paid event
          await trackEvent('deposit_paid', orderId, {
            order_number: orderNumber,
            amount_eur: (session.amount_total || 0) / 100,
          });

          // Send deposit confirmation email
          const { data: order } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', orderId)
            .single();

          if (order) {
            await sendEmail('deposit_confirmed', {
              email: order.email,
              firstName: order.first_name,
              orderNumber: order.order_number,
              depositEur: order.deposit_total_eur,
              balanceEur: order.balance_total_eur,
              totalEur: order.total_eur,
              hasPreorder: order.preorder_flag,
              etaWeeksMin: order.preorder_eta_weeks_min,
              etaWeeksMax: order.preorder_eta_weeks_max,
              trackingToken: shipment?.tracking_token,
              items: order.order_items,
            });
          }
        } else if (paymentType === 'balance') {
          // BALANCE PAYMENT - Update order to balance_paid
          
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'balance_paid',
              balance_paid_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          if (updateError) {
            log('Failed to update order for balance payment', updateError);
            throw new Error('Failed to update order status');
          }

          // Update pending balance payment to succeeded
          await supabase
            .from('payments')
            .update({ status: 'succeeded' })
            .eq('order_id', orderId)
            .eq('type', 'balance')
            .eq('stripe_checkout_session_id', session.id);

          log('Balance payment processed', { orderId, orderNumber });

          // Track balance_paid and purchase events
          await trackEvent('balance_paid', orderId, {
            order_number: orderNumber,
            amount_eur: (session.amount_total || 0) / 100,
          });

          // Get full order for purchase event
          const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

          if (order) {
            await trackEvent('purchase', orderId, {
              order_number: orderNumber,
              total_eur: order.total_eur,
              currency: 'EUR',
            });

            // Send balance paid confirmation email
            await sendEmail('balance_paid', {
              email: order.email,
              firstName: order.first_name,
              orderNumber: order.order_number,
              amountEur: order.balance_total_eur,
            });
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.order_id;
        const paymentType = paymentIntent.metadata.payment_type;

        if (orderId) {
          // Update payment record to failed
          await supabase
            .from('payments')
            .update({ status: 'failed' })
            .eq('stripe_payment_intent_id', paymentIntent.id);

          log('Payment failed', { orderId, paymentType });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        // Find order by payment intent
        const { data: payment } = await supabase
          .from('payments')
          .select('order_id')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .maybeSingle();

        if (payment?.order_id) {
          // Create refund payment record
          await supabase.from('payments').insert({
            order_id: payment.order_id,
            type: 'refund',
            status: 'succeeded',
            amount_eur: (charge.amount_refunded || 0) / 100,
            stripe_payment_intent_id: paymentIntentId,
          });

          // Update order status if fully refunded
          if (charge.refunded) {
            await supabase
              .from('orders')
              .update({ status: 'refunded' })
              .eq('id', payment.order_id);
          }

          log('Refund processed', { orderId: payment.order_id });
        }
        break;
      }

      default:
        log('Unhandled event type', { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log('Webhook processing error', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
});
