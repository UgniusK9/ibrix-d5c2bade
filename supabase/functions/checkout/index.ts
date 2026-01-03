import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas
const shippingAddressSchema = z.object({
  lockerAddress: z.string().max(200).optional(),
  lockerId: z.string().max(50).optional(),
  street: z.string().max(100).optional(),
  city: z.string().max(50).optional(),
  postalCode: z.string().max(10).optional(),
  country: z.string().max(50).optional(),
});

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10),
});

const checkoutSchema = z.object({
  firstName: z.string()
    .min(1, 'Vardas privalomas')
    .max(50, 'Vardas per ilgas')
    .regex(/^[a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ\s\-']+$/, 'Netinkamas vardo formatas'),
  lastName: z.string()
    .min(1, 'Pavardė privaloma')
    .max(50, 'Pavardė per ilga')
    .regex(/^[a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ\s\-']+$/, 'Netinkamas pavardės formatas'),
  email: z.string()
    .email('Neteisingas el. pašto adresas')
    .max(100, 'El. paštas per ilgas'),
  phone: z.string()
    .regex(/^\+?[0-9\s\-]{8,20}$/, 'Neteisingas telefono numeris')
    .optional()
    .or(z.literal('')),
  shippingMethod: z.enum(['omniva_locker', 'lp_express_locker', 'dpd_locker', 'courier'], {
    errorMap: () => ({ message: 'Netinkamas pristatymo būdas' })
  }),
  shippingAddress: shippingAddressSchema,
  notes: z.string().max(500, 'Pastabos per ilgos').optional(),
  // Cart items from localStorage (for anonymous users)
  items: z.array(cartItemSchema).min(1, 'Krepšelis tuščias'),
});

const log = (step: string, details?: any) => {
  console.log(`[CHECKOUT] ${step}`, details ? JSON.stringify(details) : '');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
  });

  // Get user from auth header if exists
  const authHeader = req.headers.get('authorization');
  let userId: string | null = null;
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data: { user } } = await supabase.auth.getUser(token);
    userId = user?.id ?? null;
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const rawBody = await req.json();
    log('Request received', { userId, itemCount: rawBody.items?.length });
    
    // Validate request body
    const validationResult = checkoutSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      log('Validation error', validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          error: firstError.message,
          field: firstError.path.join('.')
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const body = validationResult.data;

    // Fetch products from DB and validate prices server-side
    const productIds = body.items.map(item => item.productId);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('status', 'active');

    if (productsError || !products?.length) {
      log('Products fetch error', productsError);
      return new Response(
        JSON.stringify({ error: 'Produktai nerasti' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate all products exist
    const productMap = new Map(products.map(p => [p.id, p]));
    for (const item of body.items) {
      if (!productMap.has(item.productId)) {
        return new Response(
          JSON.stringify({ error: `Produktas nerastas: ${item.productId}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Calculate totals server-side (TRUST NOTHING FROM CLIENT)
    let subtotalEur = 0;
    let depositTotalEur = 0;
    let hasPreorder = false;
    let maxEtaWeeksMin = 0;
    let maxEtaWeeksMax = 0;

    const orderItemsData = body.items.map(item => {
      const product = productMap.get(item.productId)!;
      const itemSubtotal = Number(product.price_eur) * item.quantity;
      const itemDeposit = Number(product.deposit_eur) * item.quantity;
      
      subtotalEur += itemSubtotal;
      depositTotalEur += itemDeposit;
      
      if (product.stock_status === 'preorder') {
        hasPreorder = true;
        if (product.preorder_eta_weeks_min) {
          maxEtaWeeksMin = Math.max(maxEtaWeeksMin, product.preorder_eta_weeks_min);
        }
        if (product.preorder_eta_weeks_max) {
          maxEtaWeeksMax = Math.max(maxEtaWeeksMax, product.preorder_eta_weeks_max);
        }
      }

      // Validate inventory for in_stock items
      if (product.stock_status === 'in_stock' && product.inventory_qty !== null) {
        if (product.inventory_qty < item.quantity) {
          throw new Error(`Prekės "${product.title}" likę tik ${product.inventory_qty} vnt.`);
        }
      }

      return {
        productId: product.id,
        sku: product.sku,
        title: product.title,
        category: product.category,
        unitPriceEur: Number(product.price_eur),
        unitDepositEur: Number(product.deposit_eur),
        quantity: item.quantity,
      };
    });

    const shippingEur = 0; // Free shipping
    const discountEur = 0; // TODO: Apply offers
    const totalEur = subtotalEur + shippingEur - discountEur;
    const balanceTotalEur = totalEur - depositTotalEur;

    log('Totals calculated', { subtotalEur, depositTotalEur, balanceTotalEur, totalEur });

    // Generate order number
    const { data: orderNumber } = await supabase.rpc('generate_order_number');
    log('Order number generated', { orderNumber });

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: userId,
        email: body.email.trim().toLowerCase(),
        phone: body.phone?.trim() || null,
        first_name: body.firstName.trim(),
        last_name: body.lastName.trim(),
        status: 'created',
        payment_plan: 'deposit_only',
        preorder_flag: hasPreorder,
        preorder_eta_weeks_min: maxEtaWeeksMin > 0 ? maxEtaWeeksMin : null,
        preorder_eta_weeks_max: maxEtaWeeksMax > 0 ? maxEtaWeeksMax : null,
        subtotal_eur: subtotalEur,
        discount_eur: discountEur,
        shipping_eur: shippingEur,
        total_eur: totalEur,
        deposit_total_eur: depositTotalEur,
        balance_total_eur: balanceTotalEur,
        currency: 'EUR',
        shipping_address_json: body.shippingAddress,
        notes: body.notes?.trim().slice(0, 500) || null,
      })
      .select()
      .single();

    if (orderError) {
      log('Order creation error', orderError);
      throw new Error(`Nepavyko sukurti užsakymo: ${orderError.message}`);
    }

    log('Order created', { orderId: order.id });

    // Create order items
    const orderItems = orderItemsData.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      sku_snapshot: item.sku,
      title_snapshot: item.title,
      category_snapshot: item.category,
      unit_price_eur: item.unitPriceEur,
      unit_deposit_eur: item.unitDepositEur,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      log('Order items creation error', itemsError);
      await supabase.from('orders').delete().eq('id', order.id);
      throw new Error(`Nepavyko sukurti užsakymo prekių: ${itemsError.message}`);
    }

    log('Order items created', { count: orderItems.length });

    // Create Stripe Checkout Session for DEPOSIT only
    const lineItems = orderItemsData.map(item => ({
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(item.unitDepositEur * 100), // Convert to cents
        product_data: {
          name: `${item.title} (depozitas)`,
          description: `Depozitas už ${item.quantity} vnt.`,
        },
      },
      quantity: item.quantity,
    }));

    // Find or create Stripe customer
    let stripeCustomerId: string | undefined;
    const existingCustomers = await stripe.customers.list({
      email: body.email.trim().toLowerCase(),
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      stripeCustomerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: body.email.trim().toLowerCase(),
        name: `${body.firstName} ${body.lastName}`,
        phone: body.phone || undefined,
      });
      stripeCustomerId = customer.id;
    }

    const origin = req.headers.get('origin') || 'https://ibrix.lt';
    
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/uzsakymas?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?cancelled=true`,
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
        payment_type: 'deposit',
      },
      payment_intent_data: {
        metadata: {
          order_id: order.id,
          order_number: orderNumber,
          payment_type: 'deposit',
        },
      },
    });

    log('Stripe session created', { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl: session.url,
        order: {
          id: order.id,
          orderNumber: order.order_number,
          depositEur: depositTotalEur,
          totalEur: totalEur,
          balanceEur: balanceTotalEur,
          hasPreorder,
          etaWeeksMin: maxEtaWeeksMin > 0 ? maxEtaWeeksMin : null,
          etaWeeksMax: maxEtaWeeksMax > 0 ? maxEtaWeeksMax : null,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    log('Checkout error', error);
    const message = error instanceof Error ? error.message : 'Checkout klaida';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
