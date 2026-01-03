import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas
const adminRequestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list_orders') }),
  z.object({ action: z.literal('get_order'), orderId: z.string().uuid() }),
  z.object({ action: z.literal('create_shipment'), orderId: z.string().uuid(), carrierCode: z.enum(['omniva', 'lp_express', 'dpd', 'other']).optional() }),
  z.object({ action: z.literal('mark_packed'), shipmentId: z.string().uuid() }),
  z.object({ action: z.literal('mark_shipped'), shipmentId: z.string().uuid(), trackingNumber: z.string().min(1).max(100), carrierCode: z.enum(['omniva', 'lp_express', 'dpd', 'other']).optional() }),
  z.object({ action: z.literal('mark_delivered'), shipmentId: z.string().uuid() }),
  // Products
  z.object({ action: z.literal('list_products') }),
  z.object({ action: z.literal('create_product'), sku: z.string().min(1), slug: z.string().min(1), title: z.string().min(1), short_desc: z.string().nullable().optional(), description: z.string().nullable().optional(), price_eur: z.number().positive(), deposit_eur: z.number().min(0), stock_status: z.enum(['preorder', 'in_stock', 'out_of_stock']), status: z.enum(['active', 'inactive']), category: z.enum(['engines', 'cars', 'flowers', 'other']), images: z.array(z.string()).optional(), preorder_eta_weeks_min: z.number().nullable().optional(), preorder_eta_weeks_max: z.number().nullable().optional(), inventory_qty: z.number().optional() }),
  z.object({ action: z.literal('update_product'), productId: z.string().uuid(), sku: z.string().min(1).optional(), slug: z.string().min(1).optional(), title: z.string().min(1).optional(), short_desc: z.string().nullable().optional(), description: z.string().nullable().optional(), price_eur: z.number().positive().optional(), deposit_eur: z.number().min(0).optional(), stock_status: z.enum(['preorder', 'in_stock', 'out_of_stock']).optional(), status: z.enum(['active', 'inactive']).optional(), category: z.enum(['engines', 'cars', 'flowers', 'other']).optional(), images: z.array(z.string()).optional(), preorder_eta_weeks_min: z.number().nullable().optional(), preorder_eta_weeks_max: z.number().nullable().optional(), inventory_qty: z.number().optional() }),
  z.object({ action: z.literal('delete_product'), productId: z.string().uuid() }),
  // Offers
  z.object({ action: z.literal('list_offers') }),
  z.object({ action: z.literal('create_offer'), title: z.string().min(1), description: z.string().nullable().optional(), code: z.string().min(1), type: z.enum(['percent', 'fixed']), value: z.number().positive(), active: z.boolean().optional(), starts_at: z.string().nullable().optional(), ends_at: z.string().nullable().optional() }),
  z.object({ action: z.literal('update_offer'), offerId: z.string().uuid(), title: z.string().min(1).optional(), description: z.string().nullable().optional(), code: z.string().min(1).optional(), type: z.enum(['percent', 'fixed']).optional(), value: z.number().positive().optional(), active: z.boolean().optional(), starts_at: z.string().nullable().optional(), ends_at: z.string().nullable().optional() }),
  z.object({ action: z.literal('delete_offer'), offerId: z.string().uuid() }),
  z.object({ action: z.literal('assign_offer'), offerId: z.string().uuid(), userId: z.string().uuid().nullable().optional(), segmentKey: z.enum(['CART_ABANDONER', 'HIGH_INTENT', 'RETURNING', 'NEW_USER']).nullable().optional() }),
  // Users
  z.object({ action: z.literal('list_users') }),
  // Analytics
  z.object({ action: z.literal('get_analytics'), period: z.enum(['7d', '30d', '90d']) }),
  // Order status updates
  z.object({ action: z.literal('update_order_status'), orderId: z.string().uuid(), status: z.enum(['created', 'deposit_paid', 'awaiting_balance', 'balance_paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded']) }),
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const { data: userRecord } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();

    if (!userRecord || userRecord.role !== 'admin') {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const rawBody = await req.json();
    const validationResult = adminRequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return new Response(JSON.stringify({ success: false, error: firstError.message }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    
    const body = validationResult.data;
    console.log(`[ADMIN] User ${user.id} - Action: ${body.action}`);

    switch (body.action) {
      case 'list_orders': {
        const { data: orders, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, orders }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'get_order': {
        const { data: order, error: orderError } = await supabase.from('orders').select('*').eq('id', body.orderId).single();
        if (orderError) throw orderError;
        const { data: items } = await supabase.from('order_items').select('*').eq('order_id', body.orderId);
        const { data: shipment } = await supabase.from('shipments').select('*').eq('order_id', body.orderId).maybeSingle();
        const { data: payments } = await supabase.from('payments').select('*').eq('order_id', body.orderId).order('created_at', { ascending: true });
        return new Response(JSON.stringify({ success: true, order, items: items || [], shipment, payments: payments || [] }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'create_shipment': {
        const { data: shipment, error } = await supabase.from('shipments').insert({ order_id: body.orderId, carrier_code: body.carrierCode || 'omniva', status: 'pending' }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, shipment }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'mark_packed': {
        await supabase.from('shipments').update({ status: 'packed', packed_at: new Date().toISOString() }).eq('id', body.shipmentId);
        await supabase.from('shipment_events').insert({ shipment_id: body.shipmentId, source: 'internal', status_code: 'packed', description: 'Užsakymas supakuotas', occurred_at: new Date().toISOString() });
        // Update order status
        const { data: shipment } = await supabase.from('shipments').select('order_id').eq('id', body.shipmentId).single();
        if (shipment) {
          await supabase.from('orders').update({ status: 'packed' }).eq('id', shipment.order_id);
        }
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'mark_shipped': {
        const carrierCode = body.carrierCode || 'omniva';
        await supabase.from('shipments').update({ status: 'shipped', shipped_at: new Date().toISOString(), tracking_number: body.trackingNumber.trim(), carrier_code: carrierCode }).eq('id', body.shipmentId);
        const carrierName = { 'omniva': 'Omniva', 'lp_express': 'LP EXPRESS', 'dpd': 'DPD', 'other': 'Kitas' }[carrierCode] || carrierCode;
        await supabase.from('shipment_events').insert({ shipment_id: body.shipmentId, source: 'internal', status_code: 'shipped', description: `Išsiųsta per ${carrierName}`, occurred_at: new Date().toISOString() });
        // Update order status
        const { data: shipment } = await supabase.from('shipments').select('order_id, tracking_token').eq('id', body.shipmentId).single();
        if (shipment) {
          await supabase.from('orders').update({ status: 'shipped' }).eq('id', shipment.order_id);
          // Get order for email
          const { data: order } = await supabase.from('orders').select('*').eq('id', shipment.order_id).single();
          if (order) {
            // Send shipped email
            await supabase.functions.invoke('send-email', {
              body: {
                type: 'shipped',
                email: order.email,
                firstName: order.first_name,
                orderNumber: order.order_number,
                trackingNumber: body.trackingNumber,
                carrierName,
                trackingUrl: `https://ibrix.lt/siuntos-sekimas?token=${shipment.tracking_token}`,
              }
            });
          }
        }
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'mark_delivered': {
        await supabase.from('shipments').update({ status: 'delivered', delivered_at: new Date().toISOString() }).eq('id', body.shipmentId);
        await supabase.from('shipment_events').insert({ shipment_id: body.shipmentId, source: 'internal', status_code: 'delivered', description: 'Pristatyta', occurred_at: new Date().toISOString() });
        // Update order status
        const { data: shipment } = await supabase.from('shipments').select('order_id').eq('id', body.shipmentId).single();
        if (shipment) {
          await supabase.from('orders').update({ status: 'delivered' }).eq('id', shipment.order_id);
        }
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // Products
      case 'list_products': {
        const { data: products, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, products }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'create_product': {
        const { action, ...productData } = body;
        const { data: product, error } = await supabase.from('products').insert(productData).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, product }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'update_product': {
        const { action, productId, ...updateData } = body;
        const { data: product, error } = await supabase.from('products').update(updateData).eq('id', productId).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, product }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'delete_product': {
        const { error } = await supabase.from('products').delete().eq('id', body.productId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // Offers
      case 'list_offers': {
        const { data: offers, error } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        // Get redemption counts
        const { data: redemptions } = await supabase.from('redemptions').select('offer_id');
        const { data: targets } = await supabase.from('offer_targets').select('offer_id');
        const offersWithCounts = offers?.map(o => ({
          ...o,
          redemptions_count: redemptions?.filter(r => r.offer_id === o.id).length || 0,
          targets_count: targets?.filter(t => t.offer_id === o.id).length || 0,
        }));
        return new Response(JSON.stringify({ success: true, offers: offersWithCounts }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'create_offer': {
        const { action, ...offerData } = body;
        const { data: offer, error } = await supabase.from('offers').insert(offerData).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, offer }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'update_offer': {
        const { action, offerId, ...updateData } = body;
        const { data: offer, error } = await supabase.from('offers').update(updateData).eq('id', offerId).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, offer }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'delete_offer': {
        await supabase.from('offer_targets').delete().eq('offer_id', body.offerId);
        await supabase.from('redemptions').delete().eq('offer_id', body.offerId);
        const { error } = await supabase.from('offers').delete().eq('id', body.offerId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'assign_offer': {
        if (body.userId) {
          const { error } = await supabase.from('offer_targets').insert({ offer_id: body.offerId, user_id: body.userId });
          if (error) throw error;
        } else if (body.segmentKey) {
          const { error } = await supabase.from('offer_targets').insert({ offer_id: body.offerId, segment_key: body.segmentKey });
          if (error) throw error;
        }
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // Users
      case 'list_users': {
        const { data: users, error } = await supabase.from('users').select('id, email').order('created_at', { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, users }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // Analytics
      case 'get_analytics': {
        const periodDays = { '7d': 7, '30d': 30, '90d': 90 }[body.period] || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);
        const startDateStr = startDate.toISOString();

        // KPI from payments
        const { data: payments } = await supabase.from('payments').select('type, status, amount_eur').eq('status', 'succeeded').gte('created_at', startDateStr);
        const { data: orders } = await supabase.from('orders').select('id, total_eur').gte('created_at', startDateStr);
        
        const depositRevenue = payments?.filter(p => p.type === 'deposit').reduce((sum, p) => sum + p.amount_eur, 0) || 0;
        const balanceRevenue = payments?.filter(p => p.type === 'balance').reduce((sum, p) => sum + p.amount_eur, 0) || 0;
        const refunds = payments?.filter(p => p.type === 'refund');
        
        const kpi = {
          totalRevenue: depositRevenue + balanceRevenue,
          depositRevenue,
          balanceRevenue,
          ordersCount: orders?.length || 0,
          aov: orders && orders.length > 0 ? orders.reduce((sum, o) => sum + o.total_eur, 0) / orders.length : 0,
          refundsCount: refunds?.length || 0,
          refundsTotal: refunds?.reduce((sum, r) => sum + r.amount_eur, 0) || 0,
        };

        // Funnel from events
        const { data: events } = await supabase.from('events').select('name').gte('created_at', startDateStr);
        const funnel = {
          view_item: events?.filter(e => e.name === 'view_item').length || 0,
          add_to_cart: events?.filter(e => e.name === 'add_to_cart').length || 0,
          begin_checkout: events?.filter(e => e.name === 'begin_checkout').length || 0,
          deposit_paid: events?.filter(e => e.name === 'deposit_paid' || e.name === 'purchase').length || 0,
          balance_paid: events?.filter(e => e.name === 'balance_paid').length || 0,
        };

        // Top products
        const { data: productEvents } = await supabase.from('events').select('name, properties').in('name', ['view_item', 'add_to_cart', 'purchase']).gte('created_at', startDateStr);
        const productStats: Record<string, { views: number; adds: number; purchases: number; title: string }> = {};
        productEvents?.forEach(e => {
          const props = e.properties as any;
          const productId = props?.product_id || props?.items?.[0]?.item_id;
          const title = props?.product_name || props?.items?.[0]?.item_name || 'Unknown';
          if (productId) {
            if (!productStats[productId]) {
              productStats[productId] = { views: 0, adds: 0, purchases: 0, title };
            }
            if (e.name === 'view_item') productStats[productId].views++;
            if (e.name === 'add_to_cart') productStats[productId].adds++;
            if (e.name === 'purchase') productStats[productId].purchases++;
          }
        });
        const topProducts = Object.entries(productStats)
          .map(([id, stats]) => ({ product_id: id, title: stats.title, views: stats.views, adds_to_cart: stats.adds, purchases: stats.purchases }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 5);

        // Integration status (last GA/Meta events)
        const { data: gaEvents } = await supabase.from('events').select('created_at').like('name', 'ga4_%').order('created_at', { ascending: false }).limit(1);
        const { data: metaEvents } = await supabase.from('events').select('created_at').like('name', 'meta_%').order('created_at', { ascending: false }).limit(1);
        const integrationStatus = {
          ga4_last_event: gaEvents?.[0]?.created_at || null,
          meta_last_event: metaEvents?.[0]?.created_at || null,
        };

        return new Response(JSON.stringify({ success: true, kpi, funnel, topProducts, integrationStatus }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'update_order_status': {
        const { error } = await supabase.from('orders').update({ status: body.status }).eq('id', body.orderId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      default:
        return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ADMIN] Error:', error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});
