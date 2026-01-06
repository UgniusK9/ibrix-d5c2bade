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
            
            // Mark as reversed
            await supabase
              .from('wallet_transactions')
              .update({ 
                status: 'reversed',
                type: 'earn_reversed',
                reason: 'Order was refunded/cancelled before activation'
              })
              .eq('id', tx.id);
            
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

        // Update transaction to available
        const { error: updateTxError } = await supabase
          .from('wallet_transactions')
          .update({
            type: 'earn_available',
            status: 'available',
            reason: `Activated after ${delayDays} days`,
          })
          .eq('id', tx.id);

        if (updateTxError) {
          log('Error updating transaction', { txId: tx.id, error: updateTxError });
          errorCount++;
          continue;
        }

        // Add to wallet balance
        const { data: wallet, error: walletFetchError } = await supabase
          .from('wallets')
          .select('balance_eur')
          .eq('id', tx.wallet_id)
          .single();

        if (walletFetchError) {
          log('Error fetching wallet', { walletId: tx.wallet_id, error: walletFetchError });
          errorCount++;
          continue;
        }

        const newBalance = (wallet?.balance_eur || 0) + tx.amount_eur;
        const { error: walletUpdateError } = await supabase
          .from('wallets')
          .update({ 
            balance_eur: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', tx.wallet_id);

        if (walletUpdateError) {
          log('Error updating wallet balance', { walletId: tx.wallet_id, error: walletUpdateError });
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
