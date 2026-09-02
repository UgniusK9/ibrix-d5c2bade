import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { decodeBase64 } from "https://deno.land/std@0.220.1/encoding/base64.ts";
import { crypto as stdCrypto } from "https://deno.land/std@0.220.1/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.220.1/encoding/hex.ts";

const log = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[PAYSERA-CALLBACK][${timestamp}] ${step}`, details ? JSON.stringify(details) : '');
};

// Verify Paysera signature. Deno's native crypto.subtle has no MD5, so calling it
// here threw on every callback — the throw was swallowed by the outer catch, which
// answers Paysera with 200 OK, so payments were silently never marked as paid.
// The std library's extended crypto does support MD5.
async function verifySignature(data: string, signature: string, password: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data + password);
  const hashBuffer = await stdCrypto.subtle.digest('MD5', dataBytes);
  const expectedSignature = encodeHex(new Uint8Array(hashBuffer));
  return signature.toLowerCase() === expectedSignature.toLowerCase();
}

// Decode Paysera data
function decodeData(encodedData: string): Record<string, string> {
  try {
    // URL-safe base64 to standard base64
    let base64Str = encodedData.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64Str.length % 4) {
      base64Str += '=';
    }
    const decoded = new TextDecoder().decode(decodeBase64(base64Str));
    const params: Record<string, string> = {};
    decoded.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });
    return params;
  } catch (e) {
    log('Decode error', e);
    return {};
  }
}

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Get callback parameters (can be GET or POST)
    let data: string | null = null;
    let ss1: string | null = null;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      data = url.searchParams.get('data');
      ss1 = url.searchParams.get('ss1');
    } else if (req.method === 'POST') {
      const formData = await req.formData();
      data = formData.get('data') as string;
      ss1 = formData.get('ss1') as string;
    }

    log('Callback received', { method: req.method, hasData: !!data, hasSignature: !!ss1 });

    if (!data || !ss1) {
      log('Missing data or signature');
      return new Response('OK', { status: 200 }); // Always respond OK to Paysera
    }

    // Verify signature
    const signPassword = Deno.env.get('PAYSERA_SIGN_PASSWORD');
    if (!signPassword) {
      log('Sign password not configured');
      return new Response('OK', { status: 200 });
    }

    const isValid = await verifySignature(data, ss1, signPassword);
    if (!isValid) {
      log('Invalid signature');
      return new Response('OK', { status: 200 });
    }

    log('Signature verified');

    // Decode payment data
    const params = decodeData(data);
    log('Decoded params', { 
      orderid: params.orderid, 
      status: params.status,
      amount: params.amount 
    });

    const orderId = params.orderid;
    const status = params.status; // 0 = pending, 1 = success, 2 = failed, 3 = additional
    const payAmount = parseInt(params.payamount || params.amount || '0', 10); // Actual paid amount in cents

    if (!orderId) {
      log('No order ID in callback');
      return new Response('OK', { status: 200 });
    }

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      log('Order not found', { orderId, error: orderError });
      return new Response('OK', { status: 200 });
    }

    log('Order found', { orderNumber: order.order_number, currentStatus: order.status });

    // Only process successful payments
    if (status !== '1') {
      log('Payment not successful', { status });
      return new Response('OK', { status: 200 });
    }

    // Determine payment type based on amount
    const paidEur = payAmount / 100;
    const isDepositPayment = Math.abs(paidEur - order.deposit_total_eur) < 0.01;
    const isBalancePayment = Math.abs(paidEur - order.balance_total_eur) < 0.01;

    log('Payment type detection', { 
      paidEur, 
      depositTotal: order.deposit_total_eur,
      balanceTotal: order.balance_total_eur,
      isDeposit: isDepositPayment,
      isBalance: isBalancePayment
    });

    // Update payment record
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (payments && payments.length > 0) {
      await supabase
        .from('payments')
        .update({
          status: 'succeeded',
          stripe_event_id: `paysera_${params.requestid || Date.now()}`,
        })
        .eq('id', payments[0].id);
      
      log('Payment record updated', { paymentId: payments[0].id });
    } else {
      // Create payment record if not exists
      await supabase.from('payments').insert({
        order_id: orderId,
        type: isBalancePayment ? 'balance' : 'deposit',
        amount_eur: paidEur,
        status: 'succeeded',
        stripe_event_id: `paysera_${params.requestid || Date.now()}`,
      });
      
      log('Payment record created');
    }

    // Update order status
    let newStatus: string;
    let updateData: Record<string, any> = {};

    if (isBalancePayment) {
      newStatus = 'balance_paid';
      updateData.balance_paid_at = new Date().toISOString();
    } else if (order.preorder_flag) {
      newStatus = 'deposit_paid';
      updateData.paid_at = new Date().toISOString();
    } else {
      // Full payment for in-stock items
      newStatus = 'balance_paid';
      updateData.paid_at = new Date().toISOString();
    }

    updateData.status = newStatus;

    await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    log('Order updated', { orderId, newStatus });

    // Deduct stock on the first payment only — the balance payment settles an
    // order whose stock was already taken. The RPC is idempotent and atomic, so
    // a retried callback cannot deduct twice and two concurrent buyers cannot
    // both take the last unit. Preorder items are skipped inside the function.
    if (!isBalancePayment) {
      const { data: deducted, error: stockError } = await supabase
        .rpc('decrement_inventory_for_order', { p_order_id: orderId });

      if (stockError) {
        // Never fail the callback over stock: the payment already succeeded and
        // Paysera would keep retrying. Log it so it can be reconciled by hand.
        log('Inventory deduction FAILED', { orderId, error: stockError.message });
      } else {
        log('Inventory deducted', { orderId, applied: deducted });
      }
    }

    // Create shipment if first payment (deposit or full)
    if (!isBalancePayment) {
      const { data: existingShipment } = await supabase
        .from('shipments')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle();

      if (!existingShipment) {
        const trackingToken = crypto.randomUUID();
        await supabase.from('shipments').insert({
          order_id: orderId,
          status: 'pending',
          tracking_token: trackingToken,
        });
        log('Shipment created', { trackingToken });
      }
    }

    log('Callback processed successfully');
    return new Response('OK', { status: 200 });

  } catch (error) {
    log('Error', error);
    // Always return OK to Paysera to prevent retries on our errors
    return new Response('OK', { status: 200 });
  }
});
