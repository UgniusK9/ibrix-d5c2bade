import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackingRequest {
  orderId: string;
  token: string;
}

// Simple hash function for token validation
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

    const { orderId, token }: TrackingRequest = await req.json();

    if (!orderId || !token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Trūksta duomenų' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Hash the provided token and check against stored hash
    const tokenHash = await hashToken(token);

    const { data: tokenData, error: tokenError } = await supabase
      .from('tracking_tokens')
      .select('order_id, expires_at')
      .eq('order_id', orderId)
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (tokenError || !tokenData) {
      console.log('Token validation failed:', tokenError);
      return new Response(
        JSON.stringify({ success: false, error: 'Nuoroda negalioja arba pasibaigė.' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if token expired
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nuoroda pasibaigė. Susisiekite su mumis.' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Fetch order data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, status, created_at, paid_at')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ success: false, error: 'Užsakymas nerastas.' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Fetch shipment data
    const { data: shipment } = await supabase
      .from('shipments')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    // Fetch shipment events if shipment exists
    let events: any[] = [];
    if (shipment) {
      const { data: eventsData } = await supabase
        .from('shipment_events')
        .select('*')
        .eq('shipment_id', shipment.id)
        .order('occurred_at', { ascending: false });
      
      events = eventsData || [];
    }

    // Fetch order items with prices
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('title_snapshot, quantity, unit_price_cents')
      .eq('order_id', orderId);

    // Fetch order totals
    const { data: orderTotals } = await supabase
      .from('orders')
      .select('subtotal_cents, shipping_cents, total_cents')
      .eq('id', orderId)
      .single();

    // Get current location from latest carrier event
    const carrierEvents = events.filter((e: any) => e.source === 'carrier' && e.location);
    const currentLocation = carrierEvents.length > 0 ? carrierEvents[0].location : null;

    // Build response
    const response = {
      success: true,
      data: {
        order_number: order.order_number,
        status: shipment?.status || 'pending',
        carrier_code: shipment?.carrier_code || null,
        tracking_number: shipment?.tracking_number || null,
        created_at: order.created_at,
        paid_at: order.paid_at,
        packed_at: shipment?.packed_at || null,
        shipped_at: shipment?.shipped_at || null,
        delivered_at: shipment?.delivered_at || null,
        last_update: shipment?.updated_at || order.created_at,
        current_location: currentLocation,
        subtotal_cents: orderTotals?.subtotal_cents,
        shipping_cents: orderTotals?.shipping_cents,
        total_cents: orderTotals?.total_cents,
        events: events.map((e: any) => ({
          id: e.id,
          status_code: e.status_code,
          description: e.description,
          location: e.location,
          occurred_at: e.occurred_at,
          source: e.source,
        })),
        items: (orderItems || []).map((item: any) => ({
          title: item.title_snapshot,
          quantity: item.quantity,
          unit_price_cents: item.unit_price_cents,
        })),
      },
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Tracking error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Serverio klaida' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
