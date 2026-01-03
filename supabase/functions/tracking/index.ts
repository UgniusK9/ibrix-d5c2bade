import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate request ID for tracing
const generateRequestId = () => crypto.randomUUID().slice(0, 8);

// Validation schema - orderId can be order UUID or order_number
const trackingRequestSchema = z.object({
  orderId: z.string().min(1, 'Užsakymo ID privalomas'),
  token: z.string().min(16, 'Neteisingas sekimo kodas').max(128, 'Neteisingas sekimo kodas'),
});

const log = (requestId: string, step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[TRACKING][${requestId}][${timestamp}] ${step}`, details ? JSON.stringify(details) : '');
};

Deno.serve(async (req) => {
  const requestId = generateRequestId();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const rawBody = await req.json();
    log(requestId, 'Request received', { orderId: rawBody.orderId, tokenPrefix: rawBody.token?.substring(0, 8) });
    
    // Validate request body
    const validationResult = trackingRequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      log(requestId, 'Validation error', validationResult.error.issues);
      return new Response(
        JSON.stringify({ success: false, error: firstError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    const { orderId, token } = validationResult.data;

    // Find the shipment by tracking_token
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*, orders!inner(*)')
      .eq('tracking_token', token)
      .maybeSingle();

    if (shipmentError || !shipment) {
      log(requestId, 'Shipment not found by token', { tokenPrefix: token.substring(0, 8), error: shipmentError });
      return new Response(
        JSON.stringify({ success: false, error: 'Nuoroda negalioja arba pasibaigė.' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Verify the orderId matches (can be UUID or order_number)
    const order = shipment.orders;
    if (order.id !== orderId && order.order_number !== orderId) {
      log(requestId, 'Order ID mismatch', { expected: order.id, got: orderId });
      return new Response(
        JSON.stringify({ success: false, error: 'Nuoroda negalioja.' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    log(requestId, 'Token validated', { orderId: order.id, orderNumber: order.order_number });

    // Fetch shipment events
    const { data: events } = await supabase
      .from('shipment_events')
      .select('*')
      .eq('shipment_id', shipment.id)
      .order('occurred_at', { ascending: false });

    // Fetch order items
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('title_snapshot, quantity, unit_price_eur, unit_deposit_eur')
      .eq('order_id', order.id);

    // Get payments info
    const { data: payments } = await supabase
      .from('payments')
      .select('type, status, amount_eur, created_at')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true });

    // Get current location from latest carrier event
    const carrierEvents = (events || []).filter((e: any) => e.source === 'carrier' && e.location_label);
    const currentLocation = carrierEvents.length > 0 ? carrierEvents[0].location_label : null;
    const coordinates = carrierEvents.length > 0 && carrierEvents[0].lat && carrierEvents[0].lng
      ? { lat: carrierEvents[0].lat, lng: carrierEvents[0].lng }
      : null;

    // Build response
    const response = {
      success: true,
      data: {
        order_number: order.order_number,
        order_status: order.status,
        shipment_status: shipment.status,
        carrier_code: shipment.carrier_code,
        tracking_number: shipment.tracking_number,
        created_at: order.created_at,
        // Payment info
        deposit_eur: order.deposit_total_eur,
        balance_eur: order.balance_total_eur,
        total_eur: order.total_eur,
        deposit_paid_at: order.paid_at,
        balance_paid_at: order.balance_paid_at,
        // Shipment dates
        packed_at: shipment.packed_at,
        shipped_at: shipment.shipped_at,
        delivered_at: shipment.delivered_at,
        last_update: shipment.updated_at || order.updated_at,
        // Location
        current_location: currentLocation,
        coordinates: coordinates,
        // Preorder info
        preorder_flag: order.preorder_flag,
        eta_weeks_min: order.preorder_eta_weeks_min,
        eta_weeks_max: order.preorder_eta_weeks_max,
        // Events
        events: (events || []).map((e: any) => ({
          id: e.id,
          status_code: e.status_code,
          description: e.description,
          location: e.location_label,
          occurred_at: e.occurred_at,
          source: e.source,
          lat: e.lat,
          lng: e.lng,
        })),
        // Items
        items: (orderItems || []).map((item: any) => ({
          title: item.title_snapshot,
          quantity: item.quantity,
          unit_price_eur: item.unit_price_eur,
          unit_deposit_eur: item.unit_deposit_eur,
        })),
        // Payments
        payments: (payments || []).map((p: any) => ({
          type: p.type,
          status: p.status,
          amount_eur: p.amount_eur,
          created_at: p.created_at,
        })),
      },
    };

    log(requestId, 'Returning tracking data', { 
      orderNumber: order.order_number, 
      status: shipment.status,
      itemCount: orderItems?.length || 0,
      paymentCount: payments?.length || 0
    });

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    log(requestId, 'Error', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Serverio klaida' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
