import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CartItem {
  productId: string;
  quantity: number;
  variantId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Pass token explicitly for Lovable Cloud ES256 signing
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error("JWT validation error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { 
      items,
      // Legacy single-product support
      productId, 
      quantity = 1, 
      variantId,
      // Shared fields
      shippingMethod,
      shippingAddress,
      notes,
      idempotencyKey,
      firstName,
      lastName,
      email,
      phone,
    } = body;

    // Normalize to items array
    let cartItems: CartItem[] = [];
    if (items && Array.isArray(items) && items.length > 0) {
      cartItems = items;
    } else if (productId) {
      cartItems = [{ productId, quantity, variantId }];
    } else {
      return new Response(JSON.stringify({ error: "items or productId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency check
    if (idempotencyKey) {
      const { data: existingOrder } = await supabaseAdmin
        .from("orders")
        .select("id, order_number")
        .eq("user_id", user.id)
        .eq("payment_method_code", `credits_idem_${idempotencyKey}`)
        .maybeSingle();

      if (existingOrder) {
        return new Response(JSON.stringify({ 
          success: true, 
          orderId: existingOrder.id,
          orderNumber: existingOrder.order_number,
          message: "Order already exists (idempotent)",
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get all product details
    const productIds = cartItems.map(item => item.productId);
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("*")
      .in("id", productIds);

    if (productsError || !products || products.length === 0) {
      return new Response(JSON.stringify({ error: "Products not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate all products can be purchased with credits
    let totalCreditsRequired = 0;
    let subtotalEur = 0;
    const orderItems: any[] = [];
    const ineligibleProducts: string[] = [];

    for (const cartItem of cartItems) {
      const product = products.find(p => p.id === cartItem.productId);
      if (!product) {
        return new Response(JSON.stringify({ error: `Product not found: ${cartItem.productId}` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check credits eligibility
      if (!product.credits_cost_eur || product.credits_cost_eur <= 0) {
        ineligibleProducts.push(product.title);
        continue;
      }

      // Check stock status
      if (product.stock_status === "out_of_stock") {
        return new Response(JSON.stringify({ error: `Prekė "${product.title}" išparduota` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check inventory for in-stock items
      if (product.stock_status === "in_stock" && product.inventory_qty !== null) {
        if (product.inventory_qty < cartItem.quantity) {
          return new Response(JSON.stringify({ 
            error: `Prekės "${product.title}" likę tik ${product.inventory_qty} vnt.` 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const itemCredits = product.credits_cost_eur * cartItem.quantity;
      totalCreditsRequired += itemCredits;
      subtotalEur += product.price_eur * cartItem.quantity;

      orderItems.push({
        product,
        quantity: cartItem.quantity,
        variantId: cartItem.variantId,
        creditsRequired: itemCredits,
      });
    }

    // All items must be eligible for credits
    if (ineligibleProducts.length > 0) {
      return new Response(JSON.stringify({ 
        error: `Šių prekių negalima įsigyti kreditais: ${ineligibleProducts.join(", ")}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (orderItems.length === 0) {
      return new Response(JSON.stringify({ error: "Nėra prekių, kurias galima apmokėti kreditais" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("wallets")
      .select("id, balance_eur")
      .eq("user_id", user.id)
      .maybeSingle();

    if (walletError) {
      return new Response(JSON.stringify({ error: "Failed to fetch wallet" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userCredits = wallet?.balance_eur || 0;

    if (userCredits < totalCreditsRequired) {
      return new Response(JSON.stringify({ 
        error: "Nepakanka kreditų",
        required: totalCreditsRequired,
        available: userCredits,
        missing: totalCreditsRequired - userCredits,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate order number
    const now = new Date();
    const orderNumber = `IB${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Check if any item is preorder
    const hasPreorder = orderItems.some(item => item.product.stock_status === "preorder");

    // Start transaction: deduct credits and create order
    // 1. Deduct credits from wallet
    const newBalance = userCredits - totalCreditsRequired;
    const { error: updateWalletError } = await supabaseAdmin
      .from("wallets")
      .update({ balance_eur: newBalance })
      .eq("id", wallet!.id);

    if (updateWalletError) {
      return new Response(JSON.stringify({ error: "Failed to deduct credits" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Create wallet transaction for audit
    await supabaseAdmin.from("wallet_transactions").insert({
      wallet_id: wallet!.id,
      type: "redeem_captured",
      amount_eur: totalCreditsRequired,
      status: "captured",
      reason: `Credits purchase: ${orderItems.map(i => `${i.product.title} x${i.quantity}`).join(", ")}`,
    });

    // 3. Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        email: email || user.email,
        first_name: firstName || "",
        last_name: lastName || "",
        phone: phone || null,
        status: "balance_paid",
        payment_plan: "full_payment",
        payment_provider: "credits",
        payment_method_code: idempotencyKey ? `credits_idem_${idempotencyKey}` : "credits",
        paid_at: new Date().toISOString(),
        paid_amount_cents: 0,
        subtotal_eur: subtotalEur,
        subtotal_cents: Math.round(subtotalEur * 100),
        shipping_eur: 0,
        shipping_cents: 0,
        discount_eur: subtotalEur, // Full price discounted (paid via credits)
        discount_cents: Math.round(subtotalEur * 100),
        total_eur: 0,
        total_cents: 0,
        deposit_total_eur: 0,
        balance_total_eur: 0,
        credits_redeemed_cents: Math.round(totalCreditsRequired * 100),
        credits_status: "captured",
        preorder_flag: hasPreorder,
        shipping_address_json: shippingAddress || {},
        notes: notes || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      // Rollback: restore credits
      await supabaseAdmin
        .from("wallets")
        .update({ balance_eur: userCredits })
        .eq("id", wallet!.id);

      console.error("Order creation failed:", orderError);
      return new Response(JSON.stringify({ error: "Failed to create order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Create order items
    const orderItemsToInsert = orderItems.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      title_snapshot: item.product.title,
      sku_snapshot: item.product.sku,
      category_snapshot: item.product.category,
      unit_price_eur: item.product.price_eur,
      unit_deposit_eur: item.product.deposit_eur,
    }));

    await supabaseAdmin.from("order_items").insert(orderItemsToInsert);

    // 5. Update inventory for in_stock items
    for (const item of orderItems) {
      if (item.product.stock_status === "in_stock" && item.product.inventory_qty !== null) {
        await supabaseAdmin
          .from("products")
          .update({ inventory_qty: Math.max(0, item.product.inventory_qty - item.quantity) })
          .eq("id", item.product.id);
      }
    }

    // 6. Create shipment record
    const trackingToken = crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();
    await supabaseAdmin.from("shipments").insert({
      order_id: order.id,
      tracking_token: trackingToken,
      status: "pending",
    });

    return new Response(JSON.stringify({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      creditsUsed: totalCreditsRequired,
      remainingCredits: newBalance,
      itemsCount: orderItems.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Purchase with credits error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
