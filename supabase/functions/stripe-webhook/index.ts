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

// Auto-add builders from online order
async function addBuildersFromOrder(requestId: string, orderId: string, userId: string, orderItems: any[]) {
  if (!orderItems || orderItems.length === 0) {
    log(requestId, 'No order items for builders', { orderId });
    return;
  }

  try {
    for (const item of orderItems) {
      // Check if already added (idempotency)
      const { data: existing } = await supabase
        .from('user_builders')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', item.product_id)
        .eq('order_id', orderId)
        .maybeSingle();

      if (existing) {
        log(requestId, 'Builder already exists, skipping', { orderId, productId: item.product_id });
        continue;
      }

      await supabase.from('user_builders').insert({
        user_id: userId,
        product_id: item.product_id,
        source: 'online',
        order_id: orderId,
        quantity: item.quantity || 1,
      });
    }
    log(requestId, 'Builders added from order', { orderId, count: orderItems.length });
  } catch (err) {
    log(requestId, 'Add builders failed (non-blocking)', err);
  }
}

// Earn credits for eligible order
async function earnCreditsForOrder(requestId: string, orderId: string, userId: string | null) {
  if (!userId) {
    log(requestId, 'No user_id for credits earning, skipping', { orderId });
    return;
  }

  try {
    // Get credits settings
    const { data: settings } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', [
        'credits.earn_rate_percent',
        'credits.min_order_subtotal_cents',
        'credits.exclude_categories'
      ]);

    const settingsMap: Record<string, any> = {};
    settings?.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    const earnRatePercent = settingsMap['credits.earn_rate_percent']?.value ?? 3;
    const minSubtotalCents = settingsMap['credits.min_order_subtotal_cents']?.value ?? 1000;
    const excludeCategories = settingsMap['credits.exclude_categories']?.value ?? ['gift_card'];

    // Get order items to calculate eligible subtotal
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('unit_price_eur, quantity, category_snapshot')
      .eq('order_id', orderId);

    if (!orderItems || orderItems.length === 0) {
      log(requestId, 'No order items found for credits', { orderId });
      return;
    }

    // Calculate eligible subtotal (exclude gift cards and other excluded categories)
    let eligibleSubtotalCents = 0;
    for (const item of orderItems) {
      const categoryLower = (item.category_snapshot || '').toLowerCase();
      const isExcluded = excludeCategories.some((cat: string) => 
        categoryLower.includes(cat.toLowerCase())
      );
      
      if (!isExcluded) {
        eligibleSubtotalCents += Math.round(item.unit_price_eur * 100) * item.quantity;
      }
    }

    log(requestId, 'Eligible subtotal for credits', { 
      orderId, 
      eligibleSubtotalCents,
      minSubtotalCents 
    });

    // Check minimum subtotal
    if (eligibleSubtotalCents < minSubtotalCents) {
      log(requestId, 'Subtotal below minimum for credits', { orderId });
      
      // Update order with 0 credits
      await supabase
        .from('orders')
        .update({ 
          credits_earned_cents: 0,
          credits_status: 'none'
        })
        .eq('id', orderId);
      return;
    }

    // Calculate credits to earn
    const creditsEarnedCents = Math.floor(eligibleSubtotalCents * earnRatePercent / 100);
    
    if (creditsEarnedCents <= 0) {
      log(requestId, 'No credits to earn', { orderId });
      return;
    }

    // Get or create wallet
    let { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance_eur')
      .eq('user_id', userId)
      .maybeSingle();

    if (!wallet) {
      const { data: newWallet, error: walletError } = await supabase
        .from('wallets')
        .insert({ user_id: userId, balance_eur: 0 })
        .select('id, balance_eur')
        .single();

      if (walletError) {
        log(requestId, 'Failed to create wallet', walletError);
        return;
      }
      wallet = newWallet;
    }

    // Check if earn_pending already exists for this order
    const { data: existingTransaction } = await supabase
      .from('wallet_transactions')
      .select('id')
      .eq('order_id', orderId)
      .eq('type', 'earn_pending')
      .maybeSingle();

    if (existingTransaction) {
      log(requestId, 'Credits already pending for this order', { orderId });
      return;
    }

    // Create earn_pending transaction
    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'earn_pending',
        amount_eur: creditsEarnedCents / 100,
        status: 'pending',
        order_id: orderId,
        reason: `Earned ${earnRatePercent}% credits from order`,
      });

    if (txError) {
      log(requestId, 'Failed to create earn_pending transaction', txError);
      return;
    }

    // Update order with credits earned
    await supabase
      .from('orders')
      .update({
        credits_earned_cents: creditsEarnedCents,
        credits_status: 'earn_pending',
      })
      .eq('id', orderId);

    log(requestId, 'Credits earn_pending created', { 
      orderId, 
      userId,
      creditsEarnedCents,
      earnRatePercent 
    });

  } catch (err) {
    log(requestId, 'Credits earning failed (non-blocking)', err);
  }
}

// Reverse credits when order is refunded
async function reverseCreditsForOrder(requestId: string, orderId: string, isFullRefund: boolean) {
  try {
    // Get order details
    const { data: order } = await supabase
      .from('orders')
      .select('user_id, credits_earned_cents, credits_status')
      .eq('id', orderId)
      .maybeSingle();

    if (!order?.user_id) {
      log(requestId, 'No user_id for credits reversal, skipping', { orderId });
      return;
    }

    if (!order.credits_earned_cents || order.credits_earned_cents === 0) {
      log(requestId, 'No credits to reverse', { orderId });
      return;
    }

    if (order.credits_status === 'earn_reversed') {
      log(requestId, 'Credits already reversed', { orderId });
      return;
    }

    // Get wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance_eur')
      .eq('user_id', order.user_id)
      .maybeSingle();

    if (!wallet) {
      log(requestId, 'No wallet found for user', { orderId, userId: order.user_id });
      return;
    }

    const creditsEarnedEur = order.credits_earned_cents / 100;

    // Check if credits are still pending or already available
    const { data: pendingTx } = await supabase
      .from('wallet_transactions')
      .select('id, status, type')
      .eq('order_id', orderId)
      .in('type', ['earn_pending', 'earn_available'])
      .maybeSingle();

    if (pendingTx) {
      if (pendingTx.type === 'earn_pending') {
        // Credits still pending - just mark as reversed (no balance impact)
        log(requestId, 'Reversing pending credits', { orderId, amount: creditsEarnedEur });

        await supabase
          .from('wallet_transactions')
          .update({
            type: 'earn_reversed',
            status: 'reversed',
            reason: 'Order refunded before credits activated'
          })
          .eq('id', pendingTx.id);

      } else if (pendingTx.type === 'earn_available') {
        // Credits already added to balance - need to deduct
        log(requestId, 'Reversing available credits', { orderId, amount: creditsEarnedEur });

        // Create reversal transaction
        await supabase
          .from('wallet_transactions')
          .insert({
            wallet_id: wallet.id,
            type: 'earn_reversed',
            amount_eur: creditsEarnedEur,
            status: 'reversed',
            order_id: orderId,
            reason: 'Order refunded - credits reversed'
          });

        // Deduct from wallet balance (but don't go negative)
        const newBalance = Math.max(0, wallet.balance_eur - creditsEarnedEur);
        await supabase
          .from('wallets')
          .update({ 
            balance_eur: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', wallet.id);

        log(requestId, 'Wallet balance updated', { 
          walletId: wallet.id, 
          oldBalance: wallet.balance_eur,
          newBalance 
        });
      }
    }

    // Update order credits status
    await supabase
      .from('orders')
      .update({ credits_status: 'earn_reversed' })
      .eq('id', orderId);

    log(requestId, 'Credits reversed successfully', { 
      orderId, 
      creditsEarnedCents: order.credits_earned_cents,
      isFullRefund 
    });

  } catch (err) {
    log(requestId, 'Credits reversal failed (non-blocking)', err);
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
  
  // SECURITY: No public health endpoint - config state should not be exposed
  
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  if (!signature || !webhookSecret) {
    log(requestId, 'Missing signature or webhook secret', { hasSignature: !!signature, hasSecret: !!webhookSecret });
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Read raw body FIRST before any parsing - required for signature verification
    const rawBody = await req.text();
    // Use ASYNC method for Deno/WebCrypto compatibility
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
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
        const giftCardId = session.metadata?.gift_card_id;
        const sessionType = session.metadata?.type;

        // Handle GIFT CARD purchases
        if (sessionType === 'gift_card' && giftCardId) {
          log(requestId, 'Processing gift card payment', { giftCardId, sessionId: session.id });

          // Check if already processed
          const { data: existingGiftCard } = await supabase
            .from('gift_cards')
            .select('status, code')
            .eq('id', giftCardId)
            .single();

          if (existingGiftCard?.status === 'active') {
            log(requestId, 'Gift card already active, skipping', { giftCardId });
            await recordEventProcessed(requestId, event.id, event.type, undefined, { 
              type: 'gift_card', 
              gift_card_id: giftCardId,
              skipped: true 
            });
            break;
          }

          // Activate gift card
          const { error: updateError } = await supabase
            .from('gift_cards')
            .update({ status: 'active' })
            .eq('id', giftCardId);

          if (updateError) {
            log(requestId, 'Failed to activate gift card', updateError);
            throw new Error('Failed to activate gift card');
          }

          log(requestId, 'Gift card activated', { giftCardId });

          // Get gift card details for emails
          const { data: giftCard } = await supabase
            .from('gift_cards')
            .select('*')
            .eq('id', giftCardId)
            .single();

          if (giftCard) {
            // Send email to recipient
            await sendEmail(requestId, 'gift_card', {
              recipientName: giftCard.recipient_name,
              recipientEmail: giftCard.recipient_email,
              senderName: giftCard.purchased_by_email?.split('@')[0] || 'Draugas',
              code: giftCard.code,
              amount: giftCard.initial_value_eur,
              personalMessage: giftCard.personal_message,
            });

            // Send confirmation to purchaser
            await sendEmail(requestId, 'gift_card_confirmation', {
              email: giftCard.purchased_by_email,
              recipientName: giftCard.recipient_name,
              amount: giftCard.initial_value_eur,
              code: giftCard.code,
            });

            log(requestId, 'Gift card emails sent', { 
              recipient: giftCard.recipient_email, 
              purchaser: giftCard.purchased_by_email 
            });
          }

          await recordEventProcessed(requestId, event.id, event.type, undefined, {
            type: 'gift_card',
            gift_card_id: giftCardId,
            amount_eur: (session.amount_total || 0) / 100,
          });
          break;
        }

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

        if (paymentType === 'deposit' || paymentType === 'full_payment') {
          // DEPOSIT or FULL PAYMENT - Create order items, shipment, update status
          const isFullPayment = paymentType === 'full_payment';
          // Update order status - balance_paid for full payment, deposit_paid for preorder
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: isFullPayment ? 'balance_paid' : 'deposit_paid',
              paid_at: new Date().toISOString(),
              ...(isFullPayment ? { balance_paid_at: new Date().toISOString() } : {}),
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
            // Send customer confirmation email
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

            // Send admin notification email
            const shippingAddress = order.shipping_address_json as Record<string, any>;
            const shippingMethod = shippingAddress?.lockerName 
              ? (shippingAddress.lockerName.includes('Omniva') ? 'Omniva paštomatas' : 
                 shippingAddress.lockerName.includes('LP') ? 'LP EXPRESS paštomatas' : 
                 shippingAddress.lockerName.includes('DPD') ? 'DPD paštomatas' : 'Paštomatas')
              : 'Kurjeris į namus';
            
            await sendEmail(requestId, 'admin_order_notification', {
              orderNumber: order.order_number,
              customerName: `${order.first_name} ${order.last_name}`,
              customerEmail: order.email,
              customerPhone: order.phone,
              items: order.order_items?.map((i: any) => ({
                title_snapshot: i.title_snapshot,
                quantity: i.quantity,
                unit_price_eur: i.unit_price_eur,
              })),
              subtotalEur: order.subtotal_eur,
              discountEur: order.discount_eur || 0,
              shippingEur: order.shipping_eur,
              totalEur: order.total_eur,
              depositEur: order.deposit_total_eur,
              balanceEur: order.balance_total_eur,
              shippingMethod,
              shippingAddress: order.shipping_address_json,
              paymentMethod: order.payment_provider === 'stripe' ? 'Kortelė' : order.payment_provider || 'Stripe',
              paymentType: 'deposit',
              hasPreorder: order.preorder_flag,
              etaWeeksMin: order.preorder_eta_weeks_min,
              etaWeeksMax: order.preorder_eta_weeks_max,
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

            // EARN CREDITS for logged-in users after successful payment
            await earnCreditsForOrder(requestId, orderId, order.user_id);

            // AUTO-ADD BUILDERS for logged-in users
            if (order.user_id) {
              await addBuildersFromOrder(requestId, orderId, order.user_id, order.order_items);
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

          // REVERSE CREDITS if order had earned credits
          await reverseCreditsForOrder(requestId, payment.order_id, charge.refunded);

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
