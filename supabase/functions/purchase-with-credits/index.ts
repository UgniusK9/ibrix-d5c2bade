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

// Send email via send-email function (fire-and-forget)
async function sendEmail(supabaseUrl: string, serviceKey: string, type: string, data: any) {
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/send-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ type, ...data }),
      }
    );
    console.log(`Email sent: ${type}, status: ${response.status}`);
  } catch (err) {
    console.error('Email send failed (non-blocking):', err);
  }
}

// Earn credits for eligible order (same logic as stripe-webhook)
async function earnCreditsForOrder(supabaseAdmin: any, orderId: string, userId: string | null) {
  if (!userId) {
    console.log('No user_id for credits earning, skipping', { orderId });
    return;
  }

  try {
    // Get credits settings
    const { data: settings } = await supabaseAdmin
      .from('app_settings')
      .select('key, value')
      .in('key', [
        'credits.earn_rate_percent',
        'credits.min_order_subtotal_cents',
        'credits.exclude_categories'
      ]);

    const settingsMap: Record<string, any> = {};
    settings?.forEach((s: any) => {
      settingsMap[s.key] = s.value;
    });

    const earnRatePercent = settingsMap['credits.earn_rate_percent']?.value ?? 3;
    const minSubtotalCents = settingsMap['credits.min_order_subtotal_cents']?.value ?? 1000;
    const excludeCategories = settingsMap['credits.exclude_categories']?.value ?? ['gift_card'];

    // Get order items to calculate eligible subtotal
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('unit_price_eur, quantity, category_snapshot')
      .eq('order_id', orderId);

    if (!orderItems || orderItems.length === 0) {
      console.log('No order items found for credits', { orderId });
      return;
    }

    // Calculate eligible subtotal (exclude gift cards and other excluded categories)
    let eligibleSubtotalCents = 0;
    for (const item of orderItems) {
      const categoryLower = (item.category_snapshot || '').toLowerCase();
      const isExcluded = excludeCategories.some((cat: string) => 
        categoryLower.includes(cat.toLowerCase())
      );
      
      if (!isExcluded) {
        eligibleSubtotalCents += Math.round(item.unit_price_eur * 100) * item.quantity;
      }
    }

    // Check minimum subtotal
    if (eligibleSubtotalCents < minSubtotalCents) {
      console.log('Subtotal below minimum for credits', { orderId, eligibleSubtotalCents, minSubtotalCents });
      await supabaseAdmin
        .from('orders')
        .update({ 
          credits_earned_cents: 0,
          credits_status: 'none'
        })
        .eq('id', orderId);
      return;
    }

    // Calculate credits to earn
    const creditsEarnedCents = Math.floor(eligibleSubtotalCents * earnRatePercent / 100);
    
    if (creditsEarnedCents <= 0) {
      console.log('No credits to earn', { orderId });
      return;
    }

    // Get or create wallet
    let { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('id, balance_eur')
      .eq('user_id', userId)
      .maybeSingle();

    if (!wallet) {
      const { data: newWallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .insert({ user_id: userId, balance_eur: 0 })
        .select('id, balance_eur')
        .single();

      if (walletError) {
        console.error('Failed to create wallet:', walletError);
        return;
      }
      wallet = newWallet;
    }

    // Check if earn_pending already exists for this order
    const { data: existingTransaction } = await supabaseAdmin
      .from('wallet_transactions')
      .select('id')
      .eq('order_id', orderId)
      .eq('type', 'earn_pending')
      .maybeSingle();

    if (existingTransaction) {
      console.log('Credits already pending for this order', { orderId });
      return;
    }

    // Create earn_pending transaction
    const { error: txError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'earn_pending',
        amount_eur: creditsEarnedCents / 100,
        status: 'pending',
        order_id: orderId,
        reason: `Earned ${earnRatePercent}% credits from order`,
      });

    if (txError) {
      console.error('Failed to create earn_pending transaction:', txError);
      return;
    }

    // Update order with credits earned
    await supabaseAdmin
      .from('orders')
      .update({
        credits_earned_cents: creditsEarnedCents,
        credits_status: 'earn_pending',
      })
      .eq('id', orderId);

    console.log('Credits earn_pending created', { orderId, userId, creditsEarnedCents, earnRatePercent });

  } catch (err) {
    console.error('Credits earning failed (non-blocking):', err);
  }
}

// Auto-add builders from order
async function addBuildersFromOrder(supabaseAdmin: any, orderId: string, userId: string, orderItems: any[]) {
  if (!orderItems || orderItems.length === 0) return;

  try {
    for (const item of orderItems) {
      // Check if already added (idempotency)
      const { data: existing } = await supabaseAdmin
        .from('user_builders')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', item.product_id)
        .eq('order_id', orderId)
        .maybeSingle();

      if (existing) continue;

      await supabaseAdmin.from('user_builders').insert({
        user_id: userId,
        product_id: item.product_id,
        source: 'online',
        order_id: orderId,
        quantity: item.quantity || 1,
      });
    }
    console.log('Builders added from order', { orderId, count: orderItems.length });
  } catch (err) {
    console.error('Add builders failed (non-blocking):', err);
  }
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
    const customerEmail = email || user.email;
    const customerFirstName = firstName || "";
    const customerLastName = lastName || "";
    const customerPhone = phone || null;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        email: customerEmail,
        first_name: customerFirstName,
        last_name: customerLastName,
        phone: customerPhone,
        status: "balance_paid",
        payment_plan: "full_payment",
        payment_provider: "credits",
        payment_method_code: idempotencyKey ? `credits_idem_${idempotencyKey}` : "credits",
        paid_at: new Date().toISOString(),
        balance_paid_at: new Date().toISOString(),
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

    // 7. Create payment record (for consistency with money orders)
    await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      type: "deposit",
      status: "succeeded",
      amount_eur: 0,
    });

    // 8. Send customer confirmation email (same as stripe-webhook)
    const shippingAddr = shippingAddress as Record<string, any> || {};
    const shippingMethodLabel = shippingAddr?.lockerName 
      ? (shippingAddr.lockerName.includes('Omniva') ? 'Omniva paštomatas' : 
         shippingAddr.lockerName.includes('LP') ? 'LP EXPRESS paštomatas' : 
         shippingAddr.lockerName.includes('DPD') ? 'DPD paštomatas' : 'Paštomatas')
      : 'Kurjeris į namus';

    await sendEmail(supabaseUrl, supabaseServiceKey, 'deposit_confirmed', {
      email: customerEmail,
      firstName: customerFirstName,
      orderNumber: order.order_number,
      depositEur: 0,
      balanceEur: 0,
      totalEur: 0,
      hasPreorder: hasPreorder,
      trackingToken: trackingToken,
      items: orderItemsToInsert,
      shippingMethod: shippingMethodLabel,
      shippingAddress: shippingAddress,
      paymentMethod: `Kreditai (${totalCreditsRequired})`,
      creditsUsed: totalCreditsRequired,
    });

    // 9. Send admin notification email (same as stripe-webhook)
    await sendEmail(supabaseUrl, supabaseServiceKey, 'admin_order_notification', {
      orderNumber: order.order_number,
      customerName: `${customerFirstName} ${customerLastName}`,
      customerEmail: customerEmail,
      customerPhone: customerPhone,
      items: orderItemsToInsert.map(i => ({
        title_snapshot: i.title_snapshot,
        quantity: i.quantity,
        unit_price_eur: i.unit_price_eur,
      })),
      subtotalEur: subtotalEur,
      discountEur: subtotalEur, // Full discount since paid with credits
      shippingEur: 0,
      totalEur: 0,
      depositEur: 0,
      balanceEur: 0,
      shippingMethod: shippingMethodLabel,
      shippingAddress: shippingAddress,
      paymentMethod: `Apmokėta kreditais (${totalCreditsRequired} kreditų)`,
      paymentType: 'credits',
      hasPreorder: hasPreorder,
      creditsUsed: totalCreditsRequired,
    });

    // 10. Earn credits for logged-in users (same logic as stripe-webhook)
    await earnCreditsForOrder(supabaseAdmin, order.id, user.id);

    // 11. Auto-add builders for logged-in users
    await addBuildersFromOrder(supabaseAdmin, order.id, user.id, orderItemsToInsert);

    // 12. Track analytics event
    try {
      const eventId = `srv_credits_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      await supabaseAdmin.from('events').insert({
        name: 'purchase',
        event_id: eventId,
        source: 'server',
        user_id: user.id,
        properties: {
          order_id: order.id,
          order_number: order.order_number,
          payment_method: 'credits',
          credits_used: totalCreditsRequired,
          items_count: orderItems.length,
        },
      });
    } catch (err) {
      console.error('Event tracking failed (non-blocking):', err);
    }

    console.log('Credits purchase completed successfully', {
      orderId: order.id,
      orderNumber: order.order_number,
      creditsUsed: totalCreditsRequired,
      remainingCredits: newBalance,
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
