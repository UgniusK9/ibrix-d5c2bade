import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const log = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[ACTIVATE-CREDITS][${timestamp}] ${step}`, details ? JSON.stringify(details) : '');
};

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY: scheduler / internal callers only. Same check as the credits function:
  // without it anyone on the internet could trigger the job.
  const authHeader = req.headers.get('authorization') || '';
  const expected = `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''}`;
  if (!authHeader || authHeader !== expected) {
    console.warn('[ACTIVATE-CREDITS] Unauthorized call rejected');
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    log('Starting credits activation job');

    // Get activation delay setting
    const { data: delaySetting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'credits.activation_delay_days')
      .maybeSingle();

    const delayDays = delaySetting?.value?.value ?? 14;
    log('Activation delay', { delayDays });

    // Calculate the cutoff date (credits older than delayDays should be activated)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - delayDays);

    // Find all pending earn transactions that are old enough to activate
    const { data: pendingTransactions, error: fetchError } = await supabase
      .from('wallet_transactions')
      .select('id, wallet_id, amount_eur, order_id')
      .eq('type', 'earn_pending')
      .eq('status', 'pending')
      .lt('created_at', cutoffDate.toISOString());

    if (fetchError) {
      log('Error fetching pending transactions', fetchError);
      throw fetchError;
    }

    if (!pendingTransactions || pendingTransactions.length === 0) {
      log('No pending credits to activate');
      return new Response(JSON.stringify({ 
        success: true, 
        activated: 0,
        message: 'No pending credits to activate' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log('Found pending transactions', { count: pendingTransactions.length });

    let activatedCount = 0;
    let errorCount = 0;

    for (const tx of pendingTransactions) {
      try {
        // Check if order was refunded/cancelled - don't activate those
        if (tx.order_id) {
          const { data: order } = await supabase
            .from('orders')
            .select('status, credits_status')
            .eq('id', tx.order_id)
            .maybeSingle();

          if (order?.status === 'refunded' || order?.status === 'cancelled') {
            log('Skipping refunded/cancelled order credits', { orderId: tx.order_id });
            
            // Mark as reversed (only if still pending, so a parallel run cannot double-handle it)
            const { error: reverseError } = await supabase
              .from('wallet_transactions')
              .update({ 
                status: 'reversed',
                type: 'earn_reversed',
                reason: 'Order was refunded/cancelled before activation'
              })
              .eq('id', tx.id)
              .eq('status', 'pending');

            if (reverseError) {
              log('Error reversing transaction', { txId: tx.id, error: reverseError });
              errorCount++;
              continue;
            }
            
            await supabase
              .from('orders')
              .update({ credits_status: 'earn_reversed' })
              .eq('id', tx.order_id);
            
            continue;
          }

          // Check if already reversed
          if (order?.credits_status === 'earn_reversed') {
            log('Skipping already reversed credits', { orderId: tx.order_id });
            continue;
          }
        }

        // Claim the row: only the run that flips pending -> available gets to credit it,
        // so two overlapping runs (or a retry) can never credit the same row twice.
        const { data: claimed, error: claimError } = await supabase
          .from('wallet_transactions')
          .update({
            type: 'earn_available',
            status: 'available',
            reason: `Activated after ${delayDays} days`,
          })
          .eq('id', tx.id)
          .eq('status', 'pending')
          .select('id, wallet_id, amount_eur');

        if (claimError) {
          log('Error claiming transaction', { txId: tx.id, error: claimError });
          errorCount++;
          continue;
        }

        if (!claimed || claimed.length === 0) {
          log('Already handled by another run, skipping', { txId: tx.id });
          continue;
        }

        // Credit only what this run claimed. Atomic add, no read-modify-write.
        const { data: newBalance, error: creditError } = await supabase
          .rpc('adjust_wallet_balance', { p_wallet_id: claimed[0].wallet_id, p_delta: claimed[0].amount_eur });

        if (creditError || newBalance === null) {
          log('Error crediting wallet, putting row back to pending', { txId: tx.id, error: creditError });
          await supabase
            .from('wallet_transactions')
            .update({ type: 'earn_pending', status: 'pending' })
            .eq('id', tx.id)
            .eq('status', 'available');
          errorCount++;
          continue;
        }

        // Update order credits status
        if (tx.order_id) {
          await supabase
            .from('orders')
            .update({ credits_status: 'earn_available' })
            .eq('id', tx.order_id);
        }

        log('Activated credits', { 
          txId: tx.id, 
          walletId: tx.wallet_id, 
          amount: tx.amount_eur,
          newBalance 
        });
        activatedCount++;

      } catch (err) {
        log('Error processing transaction', { txId: tx.id, error: err });
        errorCount++;
      }
    }

    log('Credits activation complete', { activated: activatedCount, errors: errorCount });

    return new Response(JSON.stringify({ 
      success: true, 
      activated: activatedCount,
      errors: errorCount,
      total: pendingTransactions.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    log('Credits activation job failed', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
