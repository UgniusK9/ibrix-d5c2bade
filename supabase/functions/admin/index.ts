import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas
const adminRequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('list_orders'),
  }),
  z.object({
    action: z.literal('get_order'),
    orderId: z.string().uuid('Neteisingas užsakymo ID'),
  }),
  z.object({
    action: z.literal('create_shipment'),
    orderId: z.string().uuid('Neteisingas užsakymo ID'),
    carrierCode: z.enum(['omniva', 'lp_express', 'dpd', 'other']).optional(),
  }),
  z.object({
    action: z.literal('mark_packed'),
    shipmentId: z.string().uuid('Neteisingas siuntos ID'),
  }),
  z.object({
    action: z.literal('mark_shipped'),
    shipmentId: z.string().uuid('Neteisingas siuntos ID'),
    trackingNumber: z.string().min(1, 'Reikalingas sekimo numeris').max(100, 'Sekimo numeris per ilgas'),
    carrierCode: z.enum(['omniva', 'lp_express', 'dpd', 'other']).optional(),
  }),
  z.object({
    action: z.literal('mark_delivered'),
    shipmentId: z.string().uuid('Neteisingas siuntos ID'),
  }),
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role key to bypass RLS for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - No token provided' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[ADMIN] Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if user has admin role (now in users table)
    const { data: userRecord, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (roleError) {
      console.error('[ADMIN] Role check error:', roleError);
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization check failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!userRecord || userRecord.role !== 'admin') {
      console.log(`[ADMIN] User ${user.id} attempted admin access without admin role`);
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log(`[ADMIN] User ${user.id} authenticated as admin`);

    const rawBody = await req.json();
    
    // Validate request body with Zod
    const validationResult = adminRequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      console.log('[ADMIN] Validation error:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ success: false, error: firstError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    const validatedBody = validationResult.data;
    console.log(`[ADMIN] User ${user.id} - Action: ${validatedBody.action}`);

    switch (validatedBody.action) {
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
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', validatedBody.orderId)
          .single();

        if (orderError) throw orderError;

        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', validatedBody.orderId);

        const { data: shipment } = await supabase
          .from('shipments')
          .select('*')
          .eq('order_id', validatedBody.orderId)
          .maybeSingle();

        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .eq('order_id', validatedBody.orderId)
          .order('created_at', { ascending: true });

        return new Response(JSON.stringify({ success: true, order, items: items || [], shipment, payments: payments || [] }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      case 'create_shipment': {
        const { data: shipment, error } = await supabase
          .from('shipments')
          .insert({ 
            order_id: validatedBody.orderId, 
            carrier_code: validatedBody.carrierCode || 'omniva', 
            status: 'pending' 
          })
          .select()
          .single();

        if (error) throw error;
        console.log(`[ADMIN] User ${user.id} created shipment for order ${validatedBody.orderId}`);
        return new Response(JSON.stringify({ success: true, shipment }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      case 'mark_packed': {
        await supabase.from('shipments').update({ 
          status: 'packed', 
          packed_at: new Date().toISOString() 
        }).eq('id', validatedBody.shipmentId);
        
        await supabase.from('shipment_events').insert({ 
          shipment_id: validatedBody.shipmentId, 
          source: 'internal', 
          status_code: 'packed', 
          description: 'Užsakymas supakuotas', 
          occurred_at: new Date().toISOString() 
        });

        console.log(`[ADMIN] User ${user.id} marked shipment ${validatedBody.shipmentId} as packed`);
        return new Response(JSON.stringify({ success: true }), { 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        });
      }

      case 'mark_shipped': {
        const carrierCode = validatedBody.carrierCode || 'omniva';
        
        await supabase.from('shipments').update({ 
          status: 'shipped', 
          shipped_at: new Date().toISOString(), 
          tracking_number: validatedBody.trackingNumber.trim(), 
          carrier_code: carrierCode 
        }).eq('id', validatedBody.shipmentId);
        
        const carrierName = { 
          'omniva': 'Omniva', 
          'lp_express': 'LP EXPRESS', 
          'dpd': 'DPD', 
          'other': 'Kitas' 
        }[carrierCode] || carrierCode;
        
        await supabase.from('shipment_events').insert({ 
          shipment_id: validatedBody.shipmentId, 
          source: 'internal', 
          status_code: 'shipped', 
          description: `Išsiųsta per ${carrierName}`, 
          occurred_at: new Date().toISOString() 
        });

        console.log(`[ADMIN] User ${user.id} marked shipment ${validatedBody.shipmentId} as shipped`);
        return new Response(JSON.stringify({ success: true }), { 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        });
      }

      case 'mark_delivered': {
        await supabase.from('shipments').update({ 
          status: 'delivered', 
          delivered_at: new Date().toISOString() 
        }).eq('id', validatedBody.shipmentId);
        
        await supabase.from('shipment_events').insert({ 
          shipment_id: validatedBody.shipmentId, 
          source: 'internal', 
          status_code: 'delivered', 
          description: 'Pristatyta', 
          occurred_at: new Date().toISOString() 
        });

        console.log(`[ADMIN] User ${user.id} marked shipment ${validatedBody.shipmentId} as delivered`);
        return new Response(JSON.stringify({ success: true }), { 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
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
