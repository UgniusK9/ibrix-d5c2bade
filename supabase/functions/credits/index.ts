import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Helper to load credits settings
async function getCreditsSettings() {
  const { data } = await supabase
    .from('app_settings')
    .select('key, value')
    .like('key', 'credits.%');

  const settings: Record<string, any> = {
    earn_rate_percent: 3,
    activation_delay_days: 14,
    max_redeem_percent: 50,
    min_order_subtotal_cents: 1000,
    exclude_categories: ['gift_card'],
  };

  if (data) {
    data.forEach((item) => {
      const shortKey = item.key.replace('credits.', '');
      const value = (item.value as { value: any })?.value;
      if (value !== undefined) {
        settings[shortKey] = value;
      }
    });
  }

  return settings;
}

// Earn credits after successful payment
async function earnCredits(orderId: string, requestId: string) {
  const log = (step: string, details?: any) => {
    console.log(`[CREDITS-EARN][${requestId}] ${step}`, details ? JSON.stringify(details) : '');
  };

  try {
    const settings = await getCreditsSettings();
    log('Settings loaded', settings);

    // Get order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      log('Order not found', orderError);
      return { success: false, error: 'Order not found' };
    }

    if (!order.user_id) {
      log('Guest order, no credits earned');
      return { success: true, credits: 0, reason: 'guest_order' };
    }

    // Check if credits already processed
    if (order.credits_status && order.credits_status !== 'none') {
      log('Credits already processed', { status: order.credits_status });
      return { success: true, credits: 0, reason: 'already_processed' };
    }

    // Calculate eligible subtotal (exclude certain categories)
    const excludeCategories = settings.exclude_categories as string[];
    let eligibleSubtotalCents = 0;

    for (const item of order.order_items || []) {
      if (!excludeCategories.includes(item.category_snapshot)) {
        eligibleSubtotalCents += Math.round(item.unit_price_eur * 100) * item.quantity;
      }
    }

    log('Eligible subtotal calculated', { eligibleSubtotalCents });

    // Check minimum
    if (eligibleSubtotalCents < settings.min_order_subtotal_cents) {
      log('Below minimum subtotal', { 
        eligible: eligibleSubtotalCents, 
        minimum: settings.min_order_subtotal_cents 
      });
      
      await supabase
        .from('orders')
        .update({ credits_status: 'none', credits_earned_cents: 0 })
        .eq('id', orderId);
      
      return { success: true, credits: 0, reason: 'below_minimum' };
    }

    // Calculate credits
    const creditsCents = Math.floor(eligibleSubtotalCents * (settings.earn_rate_percent / 100));
    log('Credits calculated', { creditsCents, rate: settings.earn_rate_percent });

    // Get or create wallet
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance_eur')
      .eq('user_id', order.user_id)
      .maybeSingle();

    if (!wallet) {
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({ user_id: order.user_id, balance_eur: 0 })
        .select('id, balance_eur')
        .single();

      if (createError) {
        log('Failed to create wallet', createError);
        return { success: false, error: 'Failed to create wallet' };
      }
      wallet = newWallet;
    }

    // Create pending transaction
    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'earn_pending',
        amount_eur: creditsCents / 100,
        status: 'pending',
        order_id: orderId,
        reason: `Uždirbta iš užsakymo #${order.order_number}`,
      });

    if (txError) {
      log('Failed to create transaction', txError);
      return { success: false, error: 'Failed to create transaction' };
    }

    // Update order
    await supabase
      .from('orders')
      .update({ 
        credits_status: 'earn_pending',
        credits_earned_cents: creditsCents,
      })
      .eq('id', orderId);

    log('Credits earned (pending)', { creditsCents });
    return { success: true, credits: creditsCents, status: 'pending' };
  } catch (err) {
    console.error('Error earning credits:', err);
    return { success: false, error: String(err) };
  }
}

// Activate pending credits after delay
async function activateCredits(orderId: string, requestId: string) {
  const log = (step: string, details?: any) => {
    console.log(`[CREDITS-ACTIVATE][${requestId}] ${step}`, details ? JSON.stringify(details) : '');
  };

  try {
    const settings = await getCreditsSettings();

    // Get order
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (error || !order || !order.user_id) {
      return { success: false, error: 'Order not found' };
    }

    if (order.credits_status !== 'earn_pending') {
      log('Credits not in pending state', { status: order.credits_status });
      return { success: true, reason: 'not_pending' };
    }

    // Get wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance_eur')
      .eq('user_id', order.user_id)
      .single();

    if (!wallet) {
      return { success: false, error: 'Wallet not found' };
    }

    const creditsCents = order.credits_earned_cents || 0;
    const creditsEur = creditsCents / 100;

    // Update wallet balance
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance_eur: wallet.balance_eur + creditsEur })
      .eq('id', wallet.id);

    if (updateError) {
      log('Failed to update balance', updateError);
      return { success: false, error: 'Failed to update balance' };
    }

    // Create activation transaction
    await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'earn_available',
        amount_eur: creditsEur,
        status: 'available',
        order_id: orderId,
        reason: `Aktyvuota iš užsakymo #${order.order_number}`,
      });

    // Update pending transaction status
    await supabase
      .from('wallet_transactions')
      .update({ status: 'available' })
      .eq('order_id', orderId)
      .eq('type', 'earn_pending');

    // Update order
    await supabase
      .from('orders')
      .update({ credits_status: 'earn_available' })
      .eq('id', orderId);

    log('Credits activated', { creditsEur, newBalance: wallet.balance_eur + creditsEur });
    return { success: true, credits: creditsCents };
  } catch (err) {
    console.error('Error activating credits:', err);
    return { success: false, error: String(err) };
  }
}

// Reserve credits for checkout (create hold)
async function holdCredits(userId: string, amountCents: number, orderId: string, requestId: string) {
  const log = (step: string, details?: any) => {
    console.log(`[CREDITS-HOLD][${requestId}] ${step}`, details ? JSON.stringify(details) : '');
  };

  try {
    const settings = await getCreditsSettings();
    const amountEur = amountCents / 100;

    // Get wallet with balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance_eur')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return { success: false, error: 'Wallet not found' };
    }

    if (wallet.balance_eur < amountEur) {
      log('Insufficient balance', { balance: wallet.balance_eur, requested: amountEur });
      return { success: false, error: 'Insufficient balance' };
    }

    // Atomic: reserve credits by reducing balance
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance_eur: wallet.balance_eur - amountEur })
      .eq('id', wallet.id)
      .gte('balance_eur', amountEur); // Ensure balance hasn't changed

    if (updateError) {
      log('Failed to hold credits', updateError);
      return { success: false, error: 'Failed to hold credits' };
    }

    // Create hold transaction
    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'redeem_hold',
        amount_eur: amountEur,
        status: 'pending',
        order_id: orderId,
        reason: `Rezervuota užsakymui`,
      });

    if (txError) {
      // Rollback balance
      await supabase
        .from('wallets')
        .update({ balance_eur: wallet.balance_eur })
        .eq('id', wallet.id);
      
      return { success: false, error: 'Failed to create hold transaction' };
    }

    log('Credits held', { amountEur, newBalance: wallet.balance_eur - amountEur });
    return { success: true, held: amountCents };
  } catch (err) {
    console.error('Error holding credits:', err);
    return { success: false, error: String(err) };
  }
}

// Capture held credits (finalize after payment)
async function captureCredits(orderId: string, requestId: string) {
  const log = (step: string, details?: any) => {
    console.log(`[CREDITS-CAPTURE][${requestId}] ${step}`, details ? JSON.stringify(details) : '');
  };

  try {
    // Update hold transaction to captured
    const { data: tx, error } = await supabase
      .from('wallet_transactions')
      .update({ type: 'redeem_captured', status: 'captured' })
      .eq('order_id', orderId)
      .eq('type', 'redeem_hold')
      .select('amount_eur')
      .maybeSingle();

    if (error) {
      log('Failed to capture', error);
      return { success: false, error: 'Failed to capture credits' };
    }

    // Update order
    await supabase
      .from('orders')
      .update({ 
        credits_status: 'redeem_captured',
        credits_redeemed_cents: Math.round((tx?.amount_eur || 0) * 100),
      })
      .eq('id', orderId);

    log('Credits captured', { amount: tx?.amount_eur });
    return { success: true, captured: Math.round((tx?.amount_eur || 0) * 100) };
  } catch (err) {
    console.error('Error capturing credits:', err);
    return { success: false, error: String(err) };
  }
}

// Release held credits (on payment failure/cancel)
async function releaseCredits(orderId: string, requestId: string) {
  const log = (step: string, details?: any) => {
    console.log(`[CREDITS-RELEASE][${requestId}] ${step}`, details ? JSON.stringify(details) : '');
  };

  try {
    // Get the hold transaction
    const { data: tx, error: fetchError } = await supabase
      .from('wallet_transactions')
      .select('*, wallets(id, balance_eur)')
      .eq('order_id', orderId)
      .eq('type', 'redeem_hold')
      .maybeSingle();

    if (!tx) {
      log('No hold to release');
      return { success: true, reason: 'no_hold' };
    }

    // Restore balance
    const wallet = (tx as any).wallets;
    if (wallet) {
      await supabase
        .from('wallets')
        .update({ balance_eur: wallet.balance_eur + tx.amount_eur })
        .eq('id', wallet.id);
    }

    // Update transaction
    await supabase
      .from('wallet_transactions')
      .update({ type: 'redeem_released', status: 'released' })
      .eq('id', tx.id);

    // Update order
    await supabase
      .from('orders')
      .update({ credits_status: 'redeem_released' })
      .eq('id', orderId);

    log('Credits released', { amount: tx.amount_eur });
    return { success: true, released: Math.round(tx.amount_eur * 100) };
  } catch (err) {
    console.error('Error releasing credits:', err);
    return { success: false, error: String(err) };
  }
}

// Reverse credits on refund
async function reverseCredits(orderId: string, requestId: string) {
  const log = (step: string, details?: any) => {
    console.log(`[CREDITS-REVERSE][${requestId}] ${step}`, details ? JSON.stringify(details) : '');
  };

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('user_id, credits_status, credits_earned_cents')
      .eq('id', orderId)
      .single();

    if (!order || !order.user_id) {
      return { success: true, reason: 'no_credits_to_reverse' };
    }

    const creditsEur = (order.credits_earned_cents || 0) / 100;

    if (order.credits_status === 'earn_pending') {
      // Just mark as reversed, no balance change
      await supabase
        .from('wallet_transactions')
        .update({ type: 'earn_reversed', status: 'reversed' })
        .eq('order_id', orderId)
        .eq('type', 'earn_pending');

      await supabase
        .from('orders')
        .update({ credits_status: 'earn_reversed' })
        .eq('id', orderId);

      log('Pending credits reversed');
      return { success: true, reversed: order.credits_earned_cents };
    }

    if (order.credits_status === 'earn_available') {
      // Deduct from balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id, balance_eur')
        .eq('user_id', order.user_id)
        .single();

      if (wallet) {
        const newBalance = Math.max(0, wallet.balance_eur - creditsEur);
        await supabase
          .from('wallets')
          .update({ balance_eur: newBalance })
          .eq('id', wallet.id);

        await supabase
          .from('wallet_transactions')
          .insert({
            wallet_id: wallet.id,
            type: 'earn_reversed',
            amount_eur: -creditsEur,
            status: 'reversed',
            order_id: orderId,
            reason: 'Grąžinimas',
          });
      }

      await supabase
        .from('orders')
        .update({ credits_status: 'earn_reversed' })
        .eq('id', orderId);

      log('Available credits reversed', { creditsEur });
      return { success: true, reversed: order.credits_earned_cents };
    }

    return { success: true, reason: 'no_action_needed' };
  } catch (err) {
    console.error('Error reversing credits:', err);
    return { success: false, error: String(err) };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    const { action, orderId, userId, amountCents } = await req.json();

    let result;

    switch (action) {
      case 'earn':
        result = await earnCredits(orderId, requestId);
        break;
      case 'activate':
        result = await activateCredits(orderId, requestId);
        break;
      case 'hold':
        result = await holdCredits(userId, amountCents, orderId, requestId);
        break;
      case 'capture':
        result = await captureCredits(orderId, requestId);
        break;
      case 'release':
        result = await releaseCredits(orderId, requestId);
        break;
      case 'reverse':
        result = await reverseCredits(orderId, requestId);
        break;
      default:
        result = { success: false, error: 'Invalid action' };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Credits function error:', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
