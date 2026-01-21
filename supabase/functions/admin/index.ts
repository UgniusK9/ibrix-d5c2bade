import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// CORS with allowed origins only - prevents CSRF attacks on admin endpoints
const ALLOWED_ORIGINS = [
  'https://ibrix.lt',
  'https://www.ibrix.lt',
  'https://ibrix.lovable.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow lovable.app preview URLs
  if (origin.endsWith('.lovable.app')) return true;
  return false;
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// getCorsHeaders moved above

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
  z.object({ action: z.literal('create_product'), sku: z.string().min(1), slug: z.string().min(1), title: z.string().min(1), short_desc: z.string().nullable().optional(), description: z.string().nullable().optional(), price_eur: z.number().positive(), deposit_eur: z.number().min(0), sale_price_eur: z.number().nullable().optional(), cost_price_eur: z.number().nullable().optional(), stock_status: z.enum(['preorder', 'in_stock', 'out_of_stock']), status: z.enum(['active', 'inactive']), category: z.enum(['engines', 'cars', 'flowers', 'other']), category_id: z.string().uuid().nullable().optional(), images: z.array(z.string()).optional(), badges: z.array(z.string()).optional(), tags: z.array(z.string()).optional(), preorder_eta_weeks_min: z.number().nullable().optional(), preorder_eta_weeks_max: z.number().nullable().optional(), inventory_qty: z.number().optional() }),
  z.object({ action: z.literal('update_product'), productId: z.string().uuid(), sku: z.string().min(1).optional(), slug: z.string().min(1).optional(), title: z.string().min(1).optional(), short_desc: z.string().nullable().optional(), description: z.string().nullable().optional(), price_eur: z.number().positive().optional(), deposit_eur: z.number().min(0).optional(), sale_price_eur: z.number().nullable().optional(), cost_price_eur: z.number().nullable().optional(), stock_status: z.enum(['preorder', 'in_stock', 'out_of_stock']).optional(), status: z.enum(['active', 'inactive']).optional(), category: z.enum(['engines', 'cars', 'flowers', 'other']).optional(), category_id: z.string().uuid().nullable().optional(), images: z.array(z.string()).optional(), badges: z.array(z.string()).optional(), tags: z.array(z.string()).optional(), preorder_eta_weeks_min: z.number().nullable().optional(), preorder_eta_weeks_max: z.number().nullable().optional(), inventory_qty: z.number().optional() }),
  z.object({ action: z.literal('delete_product'), productId: z.string().uuid() }),
  // Offers
  z.object({ action: z.literal('list_offers') }),
  z.object({ action: z.literal('create_offer'), title: z.string().min(1), description: z.string().nullable().optional(), code: z.string().min(1), type: z.enum(['percent', 'fixed']), value: z.number().positive(), active: z.boolean().optional(), starts_at: z.string().nullable().optional(), ends_at: z.string().nullable().optional(), min_cart_total: z.number().optional(), max_redemptions: z.number().nullable().optional(), per_user_limit: z.number().optional() }),
  z.object({ action: z.literal('update_offer'), offerId: z.string().uuid(), title: z.string().min(1).optional(), description: z.string().nullable().optional(), code: z.string().min(1).optional(), type: z.enum(['percent', 'fixed']).optional(), value: z.number().positive().optional(), active: z.boolean().optional(), starts_at: z.string().nullable().optional(), ends_at: z.string().nullable().optional(), min_cart_total: z.number().optional(), max_redemptions: z.number().nullable().optional(), per_user_limit: z.number().optional() }),
  z.object({ action: z.literal('delete_offer'), offerId: z.string().uuid() }),
  z.object({ action: z.literal('assign_offer'), offerId: z.string().uuid(), userId: z.string().uuid().nullable().optional(), segmentKey: z.enum(['CART_ABANDONER', 'HIGH_INTENT', 'RETURNING', 'NEW_USER']).nullable().optional() }),
  // Users
  z.object({ action: z.literal('list_users') }),
  // Analytics
  z.object({ action: z.literal('get_analytics'), period: z.enum(['24h', '7d', '30d', '90d']) }),
  // Order status updates
  z.object({ action: z.literal('update_order_status'), orderId: z.string().uuid(), status: z.enum(['created', 'deposit_paid', 'awaiting_balance', 'balance_paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded']) }),
  // Refunds
  z.object({ action: z.literal('process_refund'), refundId: z.string().uuid(), adminNotes: z.string().nullable().optional() }),
  // Export
  z.object({ action: z.literal('export_orders'), format: z.enum(['csv']).optional() }),
]);

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // Create client with user's auth header to get user info
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !authUser) {
      console.error('[ADMIN] Auth error:', authError);
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const userId = authUser.id;
    
    // Use service role client for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: userRecord } = await supabase.from('users').select('role').eq('id', userId).maybeSingle();

    if (!userRecord || userRecord.role !== 'admin') {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    
    const user = { id: userId };

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
        const periodDays = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 }[body.period] || 30;
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

      case 'process_refund': {
        // Get refund details
        const { data: refund, error: refundError } = await supabase.from('refunds').select('*, order:orders(*)').eq('id', body.refundId).single();
        if (refundError || !refund) throw new Error('Refund not found');
        if (refund.status !== 'requested') throw new Error('Refund already processed');

        // Update status to processing
        await supabase.from('refunds').update({ status: 'processing' }).eq('id', body.refundId);

        // Get payment intent ID from original payment
        const { data: payment } = await supabase.from('payments').select('stripe_payment_intent_id').eq('order_id', refund.order_id).eq('type', 'deposit').eq('status', 'succeeded').maybeSingle();
        
        if (!payment?.stripe_payment_intent_id) {
          await supabase.from('refunds').update({ status: 'rejected', admin_notes: 'No payment found for refund' }).eq('id', body.refundId);
          throw new Error('No payment found to refund');
        }

        // Process Stripe refund
        const Stripe = (await import('https://esm.sh/stripe@14.21.0?target=deno')).default;
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2023-10-16' });
        
        const amountCents = Math.round(refund.amount_eur * 100);
        const stripeRefund = await stripe.refunds.create({
          payment_intent: payment.stripe_payment_intent_id,
          amount: amountCents,
        });

        // Update refund record
        await supabase.from('refunds').update({
          status: 'refunded',
          stripe_refund_id: stripeRefund.id,
          admin_notes: body.adminNotes || null,
          processed_at: new Date().toISOString(),
        }).eq('id', body.refundId);

        // Create payment record for refund
        await supabase.from('payments').insert({
          order_id: refund.order_id,
          type: 'refund',
          status: 'succeeded',
          amount_eur: refund.amount_eur,
          stripe_payment_intent_id: payment.stripe_payment_intent_id,
        });

        // Update order status if full refund
        if (refund.is_full_refund) {
          await supabase.from('orders').update({ status: 'refunded' }).eq('id', refund.order_id);
        }

        // Track event
        await supabase.from('events').insert({
          name: 'refund',
          properties: {
            order_id: refund.order_id,
            amount_eur: refund.amount_eur,
            stripe_refund_id: stripeRefund.id,
          },
        });

        // Send email notification
        const order = refund.order as any;
        if (order?.email) {
          await supabase.functions.invoke('send-email', {
            body: {
              type: 'refund_completed',
              email: order.email,
              firstName: order.first_name,
              orderNumber: order.order_number,
              amountEur: refund.amount_eur,
            },
          });
        }

        return new Response(JSON.stringify({ success: true, stripeRefundId: stripeRefund.id }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      case 'export_orders': {
        const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        
        if (!orders) {
          return new Response(JSON.stringify({ success: true, csv: '' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        // Generate CSV
        const headers = ['order_number', 'email', 'first_name', 'last_name', 'status', 'total_eur', 'deposit_total_eur', 'balance_total_eur', 'wants_invoice', 'invoice_company_name', 'invoice_vat_code', 'invoice_address', 'created_at'];
        const rows = orders.map(o => headers.map(h => {
          const val = (o as any)[h];
          if (val === null || val === undefined) return '';
          if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
          return val;
        }).join(','));
        
        const csv = [headers.join(','), ...rows].join('\n');
        
        return new Response(JSON.stringify({ success: true, csv }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
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
