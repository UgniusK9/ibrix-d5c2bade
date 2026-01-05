import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const isTestMode = stripeSecretKey.startsWith('sk_test_');
const isLiveMode = stripeSecretKey.startsWith('sk_live_');

console.log(`[STRIPE-WEBHOOK] Initialized in ${isTestMode ? 'TEST' : isLiveMode ? 'LIVE' : 'UNKNOWN'} mode, key prefix: ${stripeSecretKey.substring(0, 8)}...`);

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Generate request ID for tracing
const generateRequestId = () => crypto.randomUUID().slice(0, 8);

const log = (requestId: string, step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[STRIPE-WEBHOOK][${requestId}][${timestamp}] ${step}`, details ? JSON.stringify(details) : '');
};

// Check if event was already processed (idempotency)
async function isEventProcessed(requestId: string, eventId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('stripe_event_id', eventId)
    .maybeSingle();
  
  if (error) {
    log(requestId, 'Idempotency check error', error);
    return false; // Proceed with caution
  }
  
  return !!data;
}

// Record event as processed
async function recordEventProcessed(requestId: string, eventId: string, eventType: string, orderId?: string, summary?: any) {
  const { error } = await supabase
    .from('webhook_events')
    .insert({
      stripe_event_id: eventId,
      event_type: eventType,
      order_id: orderId,
      payload_summary: summary,
    });
  
  if (error) {
    log(requestId, 'Failed to record event', error);
    // Don't throw - this is non-blocking
  }
}

// Send email via send-email function (fire-and-forget)
async function sendEmail(requestId: string, type: string, data: any) {
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
    log(requestId, 'Email sent', { type, status: response.status });
  } catch (err) {
    log(requestId, 'Email send failed (non-blocking)', err);
  }
}

// Track analytics event server-side
async function trackEvent(requestId: string, name: string, orderId: string, properties: any) {
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .maybeSingle();

    // Generate event ID for deduplication
    const eventId = `srv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

    await supabase.from('events').insert({
      name,
      event_id: eventId,
      source: 'server',
      user_id: order?.user_id || null,
      properties: {
        order_id: orderId,
        ...properties,
      },
    });
    log(requestId, 'Event tracked', { name, orderId, eventId });
    
    return eventId;
  } catch (err) {
    log(requestId, 'Event tracking failed (non-blocking)', err);
    return null;
  }
}

// Send server-side Meta CAPI event
async function sendMetaCapi(requestId: string, eventData: {
  eventName: string;
  eventId: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  orderId?: string;
  orderNumber?: string;
  value?: number;
  currency?: string;
  contentIds?: string[];
  sourceUrl?: string;
}) {
  try {
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/meta-capi`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify(eventData),
      }
    );
    const result = await response.json();
    log(requestId, 'Meta CAPI sent', { eventName: eventData.eventName, success: result.success });
  } catch (err) {
    log(requestId, 'Meta CAPI failed (non-blocking)', err);
  }
}

Deno.serve(async (req) => {
  const requestId = generateRequestId();
  const url = new URL(req.url);
  
  // Health check endpoint
  if (url.pathname.endsWith('/health') || url.searchParams.has('health')) {
    const config = {
      stripe_secret_configured: !!Deno.env.get('STRIPE_SECRET_KEY'),
      webhook_secret_configured: !!Deno.env.get('STRIPE_WEBHOOK_SECRET'),
      supabase_url_configured: !!Deno.env.get('SUPABASE_URL'),
      service_role_configured: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      resend_configured: !!Deno.env.get('RESEND_API_KEY'),
    };
    log(requestId, 'Health check', config);
    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      config,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  if (!signature || !webhookSecret) {
    log(requestId, 'Missing signature or webhook secret', { hasSignature: !!signature, hasSecret: !!webhookSecret });
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    log(requestId, 'Webhook signature verification failed', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  log(requestId, 'Received webhook event', { 
    type: event.type, 
    eventId: event.id,
    livemode: event.livemode 
  });

  // IDEMPOTENCY CHECK - Skip if already processed
  if (await isEventProcessed(requestId, event.id)) {
    log(requestId, 'Event already processed, skipping', { eventId: event.id });
    return new Response(JSON.stringify({ received: true, skipped: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        const paymentType = session.metadata?.payment_type;
        const orderNumber = session.metadata?.order_number;

        if (!orderId) {
          log(requestId, 'No order_id in session metadata', { sessionId: session.id });
          break;
        }

        log(requestId, 'Processing checkout.session.completed', { 
          orderId, 
          paymentType, 
          orderNumber,
          sessionId: session.id,
          paymentIntentId: session.payment_intent 
        });

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
            log(requestId, 'Failed to update order status', updateError);
            throw new Error('Failed to update order status');
          }

          // Create payment record with stripe_event_id for idempotency
          const { error: paymentError } = await supabase.from('payments').insert({
            order_id: orderId,
            type: 'deposit',
            status: 'succeeded',
            amount_eur: (session.amount_total || 0) / 100,
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            stripe_event_id: event.id,
          });

          if (paymentError) {
            log(requestId, 'Failed to create payment record', paymentError);
            // Check if it's a duplicate key error (already processed)
            if (paymentError.code === '23505') {
              log(requestId, 'Payment already exists, skipping', { eventId: event.id });
              break;
            }
            throw new Error('Failed to create payment record');
          }

          // Create shipment with tracking token if not exists
          const { data: existingShipment } = await supabase
            .from('shipments')
            .select('id, tracking_token')
            .eq('order_id', orderId)
            .maybeSingle();

          let trackingToken: string | null = existingShipment?.tracking_token || null;

          if (!existingShipment) {
            const { data: newShipment } = await supabase.from('shipments').insert({
              order_id: orderId,
              status: 'pending',
            }).select('tracking_token').single();
            
            trackingToken = newShipment?.tracking_token || null;
            log(requestId, 'Shipment created', { orderId, hasToken: !!trackingToken });
          }

          log(requestId, 'Deposit payment processed', { 
            orderId, 
            orderNumber,
            amountEur: (session.amount_total || 0) / 100 
          });

          // Track deposit_paid event
          const depositEventId = await trackEvent(requestId, 'deposit_paid', orderId, {
            order_number: orderNumber,
            amount_eur: (session.amount_total || 0) / 100,
            stripe_session_id: session.id,
          });

          // Track order_created event
          await trackEvent(requestId, 'order_created', orderId, {
            order_number: orderNumber,
          });

          // Send deposit confirmation email
          const { data: order } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', orderId)
            .single();

          if (order) {
            await sendEmail(requestId, 'deposit_confirmed', {
              email: order.email,
              firstName: order.first_name,
              orderNumber: order.order_number,
              depositEur: order.deposit_total_eur,
              balanceEur: order.balance_total_eur,
              totalEur: order.total_eur,
              hasPreorder: order.preorder_flag,
              etaWeeksMin: order.preorder_eta_weeks_min,
              etaWeeksMax: order.preorder_eta_weeks_max,
              trackingToken: trackingToken,
              items: order.order_items,
            });

            // Send Meta CAPI Purchase event for deposit
            if (depositEventId) {
              await sendMetaCapi(requestId, {
                eventName: 'Purchase',
                eventId: depositEventId,
                email: order.email,
                phone: order.phone || undefined,
                firstName: order.first_name,
                lastName: order.last_name,
                orderId: order.id,
                orderNumber: order.order_number,
                value: order.deposit_total_eur,
                currency: 'EUR',
                contentIds: order.order_items?.map((i: any) => i.product_id) || [],
              });
            }
          }
          
          // Record event as processed
          await recordEventProcessed(requestId, event.id, event.type, orderId, {
            payment_type: 'deposit',
            amount_eur: (session.amount_total || 0) / 100,
          });

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
            log(requestId, 'Failed to update order for balance payment', updateError);
            throw new Error('Failed to update order status');
          }

          // Update pending balance payment to succeeded
          const { error: paymentUpdateError } = await supabase
            .from('payments')
            .update({ 
              status: 'succeeded',
              stripe_payment_intent_id: session.payment_intent as string,
              stripe_event_id: event.id,
            })
            .eq('order_id', orderId)
            .eq('type', 'balance')
            .eq('stripe_checkout_session_id', session.id);

          if (paymentUpdateError) {
            log(requestId, 'Failed to update balance payment', paymentUpdateError);
          }

          log(requestId, 'Balance payment processed', { 
            orderId, 
            orderNumber,
            amountEur: (session.amount_total || 0) / 100 
          });

          // Track balance_paid event
          const balanceEventId = await trackEvent(requestId, 'balance_paid', orderId, {
            order_number: orderNumber,
            amount_eur: (session.amount_total || 0) / 100,
            stripe_session_id: session.id,
          });

          // Get full order for purchase event
          const { data: order } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', orderId)
            .single();

          if (order) {
            // Track purchase event (full payment complete)
            const purchaseEventId = await trackEvent(requestId, 'purchase', orderId, {
              order_number: orderNumber,
              total_eur: order.total_eur,
              currency: 'EUR',
            });

            // Send balance paid confirmation email
            await sendEmail(requestId, 'balance_paid', {
              email: order.email,
              firstName: order.first_name,
              orderNumber: order.order_number,
              amountEur: order.balance_total_eur,
            });

            // Send Meta CAPI Purchase event for balance (full purchase complete)
            if (purchaseEventId) {
              await sendMetaCapi(requestId, {
                eventName: 'Purchase',
                eventId: purchaseEventId,
                email: order.email,
                phone: order.phone || undefined,
                firstName: order.first_name,
                lastName: order.last_name,
                orderId: order.id,
                orderNumber: order.order_number,
                value: order.total_eur, // Full order value
                currency: 'EUR',
                contentIds: order.order_items?.map((i: any) => i.product_id) || [],
              });
            }
          }
          
          // Record event as processed
          await recordEventProcessed(requestId, event.id, event.type, orderId, {
            payment_type: 'balance',
            amount_eur: (session.amount_total || 0) / 100,
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.order_id;
        const paymentType = paymentIntent.metadata.payment_type;

        log(requestId, 'Payment failed', { 
          orderId, 
          paymentType,
          paymentIntentId: paymentIntent.id,
          errorMessage: paymentIntent.last_payment_error?.message 
        });

        if (orderId) {
          await supabase
            .from('payments')
            .update({ status: 'failed' })
            .eq('stripe_payment_intent_id', paymentIntent.id);
          
          await recordEventProcessed(requestId, event.id, event.type, orderId, {
            payment_type: paymentType,
            error: paymentIntent.last_payment_error?.message,
          });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        log(requestId, 'Refund received', { 
          paymentIntentId,
          amountRefunded: charge.amount_refunded,
          fullyRefunded: charge.refunded 
        });

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
            stripe_event_id: event.id,
          });

          // Update order status if fully refunded
          if (charge.refunded) {
            await supabase
              .from('orders')
              .update({ status: 'refunded' })
              .eq('id', payment.order_id);
          }

          log(requestId, 'Refund processed', { orderId: payment.order_id });
          
          await recordEventProcessed(requestId, event.id, event.type, payment.order_id, {
            amount_refunded: (charge.amount_refunded || 0) / 100,
            fully_refunded: charge.refunded,
          });
        }
        break;
      }

      default:
        log(requestId, 'Unhandled event type', { type: event.type });
        await recordEventProcessed(requestId, event.id, event.type, undefined, { unhandled: true });
    }

    return new Response(JSON.stringify({ received: true, requestId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log(requestId, 'Webhook processing error', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed', requestId }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
