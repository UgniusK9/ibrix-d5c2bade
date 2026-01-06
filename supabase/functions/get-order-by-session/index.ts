import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const generateRequestId = () => crypto.randomUUID().slice(0, 8);

const log = (requestId: string, step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[GET-ORDER-BY-SESSION][${requestId}][${timestamp}] ${step}`, details ? JSON.stringify(details) : '');
};

Deno.serve(async (req) => {
  const requestId = generateRequestId();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, order_id } = await req.json();
    log(requestId, 'Request received', { hasSessionId: !!session_id, hasOrderId: !!order_id });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let orderId = order_id;
    let stripeSessionId = session_id;

    // If we have a Stripe session_id, look up the order from it
    if (session_id && !order_id) {
      const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
      const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
      
      try {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        orderId = session.metadata?.order_id;
        log(requestId, 'Order ID from Stripe session', { orderId, orderNumber: session.metadata?.order_number });
      } catch (stripeError) {
        log(requestId, 'Stripe session lookup failed', stripeError);
      }
    }

    if (!orderId) {
      log(requestId, 'No order ID found');
      return new Response(
        JSON.stringify({ success: false, error: 'Užsakymas nerastas' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      log(requestId, 'Order not found', { orderId, error: orderError });
      return new Response(
        JSON.stringify({ success: false, error: 'Užsakymas nerastas' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch order items
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('id, title_snapshot, quantity, unit_price_eur, unit_deposit_eur, category_snapshot')
      .eq('order_id', orderId);

    // Fetch shipment for tracking token
    const { data: shipment } = await supabase
      .from('shipments')
      .select('id, tracking_token, status, carrier_code, tracking_number')
      .eq('order_id', orderId)
      .maybeSingle();

    // Fetch payments
    const { data: payments } = await supabase
      .from('payments')
      .select('type, status, amount_eur, created_at')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    log(requestId, 'Order found', { 
      orderNumber: order.order_number, 
      status: order.status,
      itemCount: orderItems?.length || 0,
      hasShipment: !!shipment 
    });

    // Build response with all data needed for confirmation page
    const response = {
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        created_at: order.created_at,
        first_name: order.first_name,
        last_name: order.last_name,
        email: order.email,
        phone: order.phone,
        // Financial
        subtotal_eur: order.subtotal_eur,
        discount_eur: order.discount_eur,
        shipping_eur: order.shipping_eur,
        total_eur: order.total_eur,
        deposit_total_eur: order.deposit_total_eur,
        balance_total_eur: order.balance_total_eur,
        // Payment
        payment_plan: order.payment_plan,
        payment_provider: order.payment_provider,
        payment_method_code: order.payment_method_code,
        paid_at: order.paid_at,
        balance_paid_at: order.balance_paid_at,
        // Shipping
        shipping_address_json: order.shipping_address_json,
        // Preorder
        preorder_flag: order.preorder_flag,
        preorder_eta_weeks_min: order.preorder_eta_weeks_min,
        preorder_eta_weeks_max: order.preorder_eta_weeks_max,
        // Offer
        offer_code: order.offer_code,
      },
      items: (orderItems || []).map((item: any) => ({
        id: item.id,
        title_snapshot: item.title_snapshot,
        quantity: item.quantity,
        unit_price_eur: item.unit_price_eur,
        unit_deposit_eur: item.unit_deposit_eur,
        category: item.category_snapshot,
      })),
      shipment: shipment ? {
        id: shipment.id,
        tracking_token: shipment.tracking_token,
        status: shipment.status,
        carrier_code: shipment.carrier_code,
        tracking_number: shipment.tracking_number,
      } : null,
      payments: payments || [],
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    log(requestId, 'Error', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Serverio klaida' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
