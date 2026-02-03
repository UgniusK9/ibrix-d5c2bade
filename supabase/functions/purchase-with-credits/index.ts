import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { 
      productId, 
      quantity = 1, 
      variantId,
      shippingMethod,
      shippingAddress,
      notes,
      idempotencyKey,
      firstName,
      lastName,
      email,
      phone,
    } = body;

    if (!productId) {
      return new Response(JSON.stringify({ error: "productId is required" }), {
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

    // Get product details
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if product has credits_cost_eur
    if (!product.credits_cost_eur || product.credits_cost_eur <= 0) {
      return new Response(JSON.stringify({ error: "This product cannot be purchased with credits" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check stock status
    if (product.stock_status === "out_of_stock") {
      return new Response(JSON.stringify({ error: "Product is out of stock" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const creditsRequired = product.credits_cost_eur * quantity;

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

    if (userCredits < creditsRequired) {
      return new Response(JSON.stringify({ 
        error: "Insufficient credits",
        required: creditsRequired,
        available: userCredits,
        missing: creditsRequired - userCredits,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate order number
    const now = new Date();
    const orderNumber = `IB${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Start transaction: deduct credits and create order
    // 1. Deduct credits from wallet
    const newBalance = userCredits - creditsRequired;
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
      amount_eur: creditsRequired,
      status: "captured",
      reason: `Credits purchase: ${product.title} x${quantity}`,
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
        status: "paid",
        payment_plan: "full",
        payment_provider: "credits",
        payment_method_code: idempotencyKey ? `credits_idem_${idempotencyKey}` : "credits",
        paid_at: new Date().toISOString(),
        paid_amount_cents: 0,
        subtotal_eur: product.price_eur * quantity,
        subtotal_cents: Math.round(product.price_eur * quantity * 100),
        shipping_eur: 0,
        shipping_cents: 0,
        discount_eur: product.price_eur * quantity, // Full price discounted
        discount_cents: Math.round(product.price_eur * quantity * 100),
        total_eur: 0,
        total_cents: 0,
        deposit_total_eur: 0,
        balance_total_eur: 0,
        credits_redeemed_cents: Math.round(creditsRequired * 100),
        credits_status: "captured",
        preorder_flag: product.stock_status === "preorder",
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

    // 4. Create order item
    await supabaseAdmin.from("order_items").insert({
      order_id: order.id,
      product_id: productId,
      quantity,
      title_snapshot: product.title,
      sku_snapshot: product.sku,
      category_snapshot: product.category,
      unit_price_eur: product.price_eur,
      unit_deposit_eur: product.deposit_eur,
    });

    // 5. Update inventory if in_stock
    if (product.stock_status === "in_stock" && product.inventory_qty !== null) {
      await supabaseAdmin
        .from("products")
        .update({ inventory_qty: Math.max(0, product.inventory_qty - quantity) })
        .eq("id", productId);
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
      creditsUsed: creditsRequired,
      remainingCredits: newBalance,
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
