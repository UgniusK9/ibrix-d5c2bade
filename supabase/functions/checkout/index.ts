import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
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
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Get session_id from header
  const sessionId = req.headers.get('x-session-id');
  
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
    
    // Validate request body with Zod
    const validationResult = checkoutSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      console.log('Validation error:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          error: firstError.message,
          field: firstError.path.join('.')
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const body = validationResult.data;

    // Get cart
    let cartQuery = supabase.from('carts').select(`
      *,
      cart_items (
        *,
        product:products (*)
      )
    `);
    
    if (userId) {
      cartQuery = cartQuery.eq('user_id', userId);
    } else if (sessionId) {
      cartQuery = cartQuery.eq('session_id', sessionId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Krepšelis nerastas' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: cart, error: cartError } = await cartQuery.maybeSingle();

    if (cartError || !cart || !cart.cart_items?.length) {
      return new Response(
        JSON.stringify({ error: 'Krepšelis tuščias' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate inventory for in_stock items
    for (const item of cart.cart_items) {
      if (item.product.status === 'in_stock' && item.product.inventory_qty !== null) {
        if (item.product.inventory_qty < item.quantity) {
          return new Response(
            JSON.stringify({ 
              error: `Prekės "${item.product.title}" likę tik ${item.product.inventory_qty} vnt.` 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Check for price changes
      if (item.unit_price_cents !== item.product.price_cents) {
        return new Response(
          JSON.stringify({ 
            error: `Prekės "${item.product.title}" kaina pasikeitė. Atnaujinkite krepšelį.`,
            priceChanged: true
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Calculate totals
    const subtotalCents = cart.cart_items.reduce(
      (sum: number, item: any) => sum + (item.unit_price_cents * item.quantity), 
      0
    );
    const shippingCents = 0; // Free shipping
    const totalCents = subtotalCents + shippingCents;

    // Generate order number
    const { data: orderNumber } = await supabase.rpc('generate_order_number');

    // Sanitize notes (trim and limit length)
    const sanitizedNotes = body.notes?.trim().slice(0, 500) || null;

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
        status: 'pending_payment',
        subtotal_cents: subtotalCents,
        shipping_cents: shippingCents,
        total_cents: totalCents,
        currency: 'EUR',
        shipping_method: body.shippingMethod,
        shipping_address_json: body.shippingAddress,
        notes: sanitizedNotes,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw new Error(`Nepavyko sukurti užsakymo: ${orderError.message}`);
    }

    // Create order items
    const orderItems = cart.cart_items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      title_snapshot: item.product.title,
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
      type: item.type,
      preorder_eta_weeks_snapshot: item.product.preorder_eta_weeks,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items creation error:', itemsError);
      // Cleanup order
      await supabase.from('orders').delete().eq('id', order.id);
      throw new Error(`Nepavyko sukurti užsakymo prekių: ${itemsError.message}`);
    }

    // Clear cart
    await supabase.from('cart_items').delete().eq('cart_id', cart.id);

    // Generate tracking token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const trackingToken = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Hash the token for storage
    const encoder = new TextEncoder();
    const tokenData = encoder.encode(trackingToken);
    const hashBuffer = await crypto.subtle.digest('SHA-256', tokenData);
    const tokenHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Store token hash (expires in 90 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);
    
    await supabase.from('tracking_tokens').insert({
      order_id: order.id,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    });

    console.log(`Order ${orderNumber} created successfully with tracking token`);

    // Check if cart has pre-order items
    const hasPreorder = cart.cart_items.some((item: any) => item.type === 'pre_order');
    const maxEtaWeeks = cart.cart_items.reduce((max: number, item: any) => {
      if (item.product.preorder_eta_weeks) {
        return Math.max(max, item.product.preorder_eta_weeks);
      }
      return max;
    }, 0);

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          orderNumber: order.order_number,
          totalCents: order.total_cents,
          status: order.status,
          hasPreorder,
          maxEtaWeeks: maxEtaWeeks > 0 ? maxEtaWeeks : null,
          trackingToken, // Return plain token for email/redirect
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Checkout error:', error);
    const message = error instanceof Error ? error.message : 'Checkout klaida';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
