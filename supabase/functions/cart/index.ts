import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas
const cartItemRequestSchema = z.object({
  productId: z.string().uuid('Neteisingas produkto ID'),
  quantity: z.number().int().min(1, 'Kiekis turi būti bent 1').max(100, 'Maksimalus kiekis: 100').default(1),
});

const updateQuantitySchema = z.object({
  quantity: z.number().int().min(0, 'Kiekis negali būti neigiamas').max(100, 'Maksimalus kiekis: 100'),
});

const uuidSchema = z.string().uuid('Neteisingas ID formatas');

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  // Get session_id from header or generate new one
  let sessionId = req.headers.get('x-session-id');
  
  // Get user from auth header if exists
  const authHeader = req.headers.get('authorization');
  let userId: string | null = null;
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data: { user } } = await supabase.auth.getUser(token);
    userId = user?.id ?? null;
  }

  try {
    // Route handling
    if (req.method === 'GET') {
      // GET /cart - Get cart with items
      return await getCart(supabase, userId, sessionId, corsHeaders);
    }
    
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      
      if (pathParts.includes('items')) {
        // POST /cart/items - Add item to cart
        // Validate request body
        const validationResult = cartItemRequestSchema.safeParse(body);
        if (!validationResult.success) {
          const firstError = validationResult.error.issues[0];
          return new Response(
            JSON.stringify({ error: firstError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return await addToCart(supabase, userId, sessionId, validationResult.data, corsHeaders);
      }
      
      if (pathParts.includes('clear')) {
        // POST /cart/clear - Clear cart
        return await clearCart(supabase, userId, sessionId, corsHeaders);
      }
      
      // POST /cart - Create cart
      return await createCart(supabase, userId, sessionId, corsHeaders);
    }
    
    if (req.method === 'PATCH') {
      // PATCH /cart/items/:id - Update item quantity
      const itemId = pathParts[pathParts.length - 1];
      
      // Validate item ID
      const itemIdResult = uuidSchema.safeParse(itemId);
      if (!itemIdResult.success) {
        return new Response(
          JSON.stringify({ error: 'Neteisingas prekės ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const body = await req.json();
      
      // Validate quantity
      const quantityResult = updateQuantitySchema.safeParse(body);
      if (!quantityResult.success) {
        const firstError = quantityResult.error.issues[0];
        return new Response(
          JSON.stringify({ error: firstError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return await updateCartItem(supabase, userId, sessionId, itemId, quantityResult.data.quantity, corsHeaders);
    }
    
    if (req.method === 'DELETE') {
      // DELETE /cart/items/:id - Remove item
      const itemId = pathParts[pathParts.length - 1];
      
      // Validate item ID
      const itemIdResult = uuidSchema.safeParse(itemId);
      if (!itemIdResult.success) {
        return new Response(
          JSON.stringify({ error: 'Neteisingas prekės ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return await removeCartItem(supabase, userId, sessionId, itemId, corsHeaders);
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Cart error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getOrCreateCart(supabase: any, userId: string | null, sessionId: string | null) {
  // Try to find existing cart
  let query = supabase.from('carts').select('*');
  
  if (userId) {
    query = query.eq('user_id', userId);
  } else if (sessionId) {
    query = query.eq('session_id', sessionId);
  } else {
    // Generate new session ID
    sessionId = crypto.randomUUID();
  }
  
  const { data: existingCart } = await query.maybeSingle();
  
  if (existingCart) {
    return { cart: existingCart, sessionId };
  }
  
  // Create new cart
  const newSessionId = sessionId || crypto.randomUUID();
  const { data: newCart, error } = await supabase
    .from('carts')
    .insert({
      user_id: userId,
      session_id: userId ? null : newSessionId,
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create cart: ${error.message}`);
  
  return { cart: newCart, sessionId: newSessionId };
}

async function getCart(supabase: any, userId: string | null, sessionId: string | null, headers: Record<string, string>) {
  if (!userId && !sessionId) {
    return new Response(
      JSON.stringify({ cart: null, items: [], totals: { subtotal: 0, itemCount: 0 } }),
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  }

  let query = supabase.from('carts').select(`
    *,
    cart_items (
      *,
      product:products (*)
    )
  `);
  
  if (userId) {
    query = query.eq('user_id', userId);
  } else {
    query = query.eq('session_id', sessionId);
  }
  
  const { data: cart, error } = await query.maybeSingle();
  
  if (error) throw new Error(`Failed to get cart: ${error.message}`);
  
  if (!cart) {
    return new Response(
      JSON.stringify({ cart: null, items: [], totals: { subtotal: 0, itemCount: 0 } }),
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  }
  
  const items = cart.cart_items || [];
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.unit_price_cents * item.quantity), 0);
  const itemCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  
  return new Response(
    JSON.stringify({
      cart: { id: cart.id, created_at: cart.created_at },
      items: items.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_cents: item.unit_price_cents,
        type: item.type,
        meta: item.meta_json,
        product: item.product,
      })),
      totals: { subtotal, itemCount },
      sessionId: cart.session_id,
    }),
    { headers: { ...headers, 'Content-Type': 'application/json' } }
  );
}

async function createCart(supabase: any, userId: string | null, sessionId: string | null, headers: Record<string, string>) {
  const { cart, sessionId: newSessionId } = await getOrCreateCart(supabase, userId, sessionId);
  
  return new Response(
    JSON.stringify({ cart, sessionId: newSessionId }),
    { headers: { ...headers, 'Content-Type': 'application/json' } }
  );
}

interface CartItemRequest {
  productId: string;
  quantity: number;
}

async function addToCart(supabase: any, userId: string | null, sessionId: string | null, body: CartItemRequest, headers: Record<string, string>) {
  const { productId, quantity = 1 } = body;
  
  // Get product
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('is_active', true)
    .single();
  
  if (productError || !product) {
    return new Response(
      JSON.stringify({ error: 'Product not found' }),
      { status: 404, headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  }
  
  // Check inventory for in_stock items
  if (product.status === 'in_stock' && product.inventory_qty !== null) {
    if (product.inventory_qty < quantity) {
      return new Response(
        JSON.stringify({ error: `Likę tik ${product.inventory_qty} vnt.` }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }
  }
  
  // Get or create cart
  const { cart, sessionId: newSessionId } = await getOrCreateCart(supabase, userId, sessionId);
  
  // Check if item already in cart
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cart.id)
    .eq('product_id', productId)
    .maybeSingle();
  
  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    
    // Check inventory
    if (product.status === 'in_stock' && product.inventory_qty !== null) {
      if (product.inventory_qty < newQuantity) {
        return new Response(
          JSON.stringify({ error: `Likę tik ${product.inventory_qty} vnt.` }),
          { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity })
      .eq('id', existingItem.id);
    
    if (updateError) throw new Error(`Failed to update cart item: ${updateError.message}`);
  } else {
    // Create new cart item
    const { error: insertError } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cart.id,
        product_id: productId,
        quantity,
        unit_price_cents: product.price_cents,
        type: product.status,
        meta_json: product.preorder_eta_weeks ? { eta_weeks: product.preorder_eta_weeks } : {},
      });
    
    if (insertError) throw new Error(`Failed to add to cart: ${insertError.message}`);
  }
  
  console.log(`Added product ${productId} to cart ${cart.id}`);
  
  return new Response(
    JSON.stringify({ success: true, sessionId: newSessionId }),
    { headers: { ...headers, 'Content-Type': 'application/json' } }
  );
}

async function updateCartItem(supabase: any, userId: string | null, sessionId: string | null, itemId: string, quantity: number, headers: Record<string, string>) {
  if (quantity < 1) {
    return removeCartItem(supabase, userId, sessionId, itemId, headers);
  }
  
  // Verify ownership
  const { data: item, error: itemError } = await supabase
    .from('cart_items')
    .select('*, cart:carts(*), product:products(*)')
    .eq('id', itemId)
    .single();
  
  if (itemError || !item) {
    return new Response(
      JSON.stringify({ error: 'Item not found' }),
      { status: 404, headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  }
  
  // Verify cart ownership
  const isOwner = userId 
    ? item.cart.user_id === userId 
    : item.cart.session_id === sessionId;
  
  if (!isOwner) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 403, headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  }
  
  // Check inventory
  if (item.product.status === 'in_stock' && item.product.inventory_qty !== null) {
    if (item.product.inventory_qty < quantity) {
      return new Response(
        JSON.stringify({ error: `Likę tik ${item.product.inventory_qty} vnt.` }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }
  }
  
  const { error: updateError } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', itemId);
  
  if (updateError) throw new Error(`Failed to update item: ${updateError.message}`);
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...headers, 'Content-Type': 'application/json' } }
  );
}

async function removeCartItem(supabase: any, userId: string | null, sessionId: string | null, itemId: string, headers: Record<string, string>) {
  // Verify ownership
  const { data: item, error: itemError } = await supabase
    .from('cart_items')
    .select('*, cart:carts(*)')
    .eq('id', itemId)
    .single();
  
  if (itemError || !item) {
    return new Response(
      JSON.stringify({ error: 'Item not found' }),
      { status: 404, headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  }
  
  // Verify cart ownership
  const isOwner = userId 
    ? item.cart.user_id === userId 
    : item.cart.session_id === sessionId;
  
  if (!isOwner) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 403, headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  }
  
  const { error: deleteError } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId);
  
  if (deleteError) throw new Error(`Failed to remove item: ${deleteError.message}`);
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...headers, 'Content-Type': 'application/json' } }
  );
}

async function clearCart(supabase: any, userId: string | null, sessionId: string | null, headers: Record<string, string>) {
  let query = supabase.from('carts').select('id');
  
  if (userId) {
    query = query.eq('user_id', userId);
  } else if (sessionId) {
    query = query.eq('session_id', sessionId);
  } else {
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  }
  
  const { data: cart } = await query.maybeSingle();
  
  if (cart) {
    await supabase.from('cart_items').delete().eq('cart_id', cart.id);
  }
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...headers, 'Content-Type': 'application/json' } }
  );
}
