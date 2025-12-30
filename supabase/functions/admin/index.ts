import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminRequest {
  action: 'list_orders' | 'get_order' | 'mark_packed' | 'mark_shipped' | 'mark_delivered' | 'create_shipment';
  orderId?: string;
  shipmentId?: string;
  carrierCode?: string;
  trackingNumber?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role key to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, orderId, shipmentId, carrierCode, trackingNumber }: AdminRequest = await req.json();
    console.log(`[ADMIN] Action: ${action}, OrderId: ${orderId}`);

    switch (action) {
      case 'list_orders': {
        const { data: orders, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, orders }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      case 'get_order': {
        if (!orderId) throw new Error('Order ID required');

        // Get order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;

        // Get items
        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);

        // Get shipment
        const { data: shipment } = await supabase
          .from('shipments')
          .select('*')
          .eq('order_id', orderId)
          .maybeSingle();

        return new Response(JSON.stringify({ 
          success: true, 
          order, 
          items: items || [], 
          shipment 
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      case 'create_shipment': {
        if (!orderId) throw new Error('Order ID required');

        const { data: shipment, error } = await supabase
          .from('shipments')
          .insert({
            order_id: orderId,
            carrier_code: carrierCode || 'omniva',
            status: 'pending',
          })
          .select()
          .single();

        if (error) throw error;

        console.log(`[ADMIN] Created shipment for order ${orderId}`);
        return new Response(JSON.stringify({ success: true, shipment }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      case 'mark_packed': {
        if (!shipmentId) throw new Error('Shipment ID required');

        const { error: shipmentError } = await supabase
          .from('shipments')
          .update({ 
            status: 'packed',
            packed_at: new Date().toISOString(),
          })
          .eq('id', shipmentId);

        if (shipmentError) throw shipmentError;

        // Add event
        await supabase.from('shipment_events').insert({
          shipment_id: shipmentId,
          source: 'internal',
          status_code: 'packed',
          description: 'Užsakymas supakuotas',
          occurred_at: new Date().toISOString(),
        });

        console.log(`[ADMIN] Marked shipment ${shipmentId} as packed`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      case 'mark_shipped': {
        if (!shipmentId || !trackingNumber) {
          throw new Error('Shipment ID and tracking number required');
        }

        const { error: shipmentError } = await supabase
          .from('shipments')
          .update({ 
            status: 'shipped',
            shipped_at: new Date().toISOString(),
            tracking_number: trackingNumber,
            carrier_code: carrierCode || 'omniva',
          })
          .eq('id', shipmentId);

        if (shipmentError) throw shipmentError;

        // Add event
        const carrierName = {
          'omniva': 'Omniva',
          'lp_express': 'LP EXPRESS',
          'dpd': 'DPD',
          'courier': 'Kurjeris',
          'other': 'Kitas',
        }[carrierCode || 'omniva'] || carrierCode;

        await supabase.from('shipment_events').insert({
          shipment_id: shipmentId,
          source: 'internal',
          status_code: 'shipped',
          description: `Išsiųsta per ${carrierName}`,
          occurred_at: new Date().toISOString(),
        });

        console.log(`[ADMIN] Marked shipment ${shipmentId} as shipped with tracking ${trackingNumber}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      case 'mark_delivered': {
        if (!shipmentId) throw new Error('Shipment ID required');

        const { error: shipmentError } = await supabase
          .from('shipments')
          .update({ 
            status: 'delivered',
            delivered_at: new Date().toISOString(),
          })
          .eq('id', shipmentId);

        if (shipmentError) throw shipmentError;

        // Add event
        await supabase.from('shipment_events').insert({
          shipment_id: shipmentId,
          source: 'internal',
          status_code: 'delivered',
          description: 'Pristatyta',
          occurred_at: new Date().toISOString(),
        });

        console.log(`[ADMIN] Marked shipment ${shipmentId} as delivered`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ADMIN] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
