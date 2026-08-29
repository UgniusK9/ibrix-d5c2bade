import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate request ID for tracing
const generateRequestId = () => crypto.randomUUID().slice(0, 8);

// Validation schemas
const shippingAddressSchema = z.object({
  lockerAddress: z.string().max(200).optional(),
  lockerId: z.string().max(50).optional(),
  lockerName: z.string().max(100).optional(),
  lockerCity: z.string().max(50).optional(),
  lockerPostalCode: z.string().max(10).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  street: z.string().max(100).optional(),
  city: z.string().max(50).optional(),
  postalCode: z.string().max(10).optional(),
  country: z.string().max(50).optional(),
});

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10),
  variantId: z.string().uuid().optional(),
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
    .max(30)
    .optional()
    .or(z.literal('')),
  shippingMethod: z.enum(['omniva_locker', 'lp_express_locker', 'dpd_locker', 'courier'], {
    errorMap: () => ({ message: 'Netinkamas pristatymo būdas' })
  }),
  shippingAddress: shippingAddressSchema,
  notes: z.string().max(500, 'Pastabos per ilgos').optional(),
  items: z.array(cartItemSchema).min(1, 'Krepšelis tuščias'),
  // Discount
  discountCode: z.string().max(50).optional(),
  // Invoice
  wantsInvoice: z.boolean().optional(),
  invoiceCompanyName: z.string().max(100).optional(),
  invoiceVatCode: z.string().max(20).optional(),
  invoiceAddress: z.string().max(200).optional(),
  invoiceCountry: z.string().max(50).optional(),
  // Wallet
  useWalletBalance: z.boolean().optional(),
  walletDeductionCents: z.number().min(0).optional(),
  // Payment provider
  // Must list every provider PaymentMethodSelector can send. Previously this
  // omitted opay and inbank while the UI offered them, so those checkouts
  // failed validation with a 400 before an order row was ever created.
  paymentProvider: z.enum(['stripe', 'paypal', 'paysera', 'opay', 'inbank']).optional(),
  paymentMethodCode: z.string().max(50).optional(),
  skipStripe: z.boolean().optional(),
  // Campaign attribution — best-effort, never required. Bounded lengths
  // because these values come straight from a URL the visitor controls.
  attribution: z.object({
    utm_source: z.string().max(100).optional(),
    utm_medium: z.string().max(100).optional(),
    utm_campaign: z.string().max(150).optional(),
    utm_content: z.string().max(150).optional(),
    utm_term: z.string().max(150).optional(),
    gclid: z.string().max(255).optional(),
    fbclid: z.string().max(255).optional(),
    landing_page: z.string().max(255).optional(),
  }).optional(),
});

const log = (requestId: string, step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[CHECKOUT][${requestId}][${timestamp}] ${step}`, details ? JSON.stringify(details) : '');
};

// Shipping costs
const SHIPPING_COSTS: Record<string, number> = {
  omniva_locker: 0,
  lp_express_locker: 0,
  dpd_locker: 0,
  courier: 4.99,
};

Deno.serve(async (req) => {
  const requestId = generateRequestId();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
  const isTestMode = stripeSecretKey.startsWith('sk_test_');
  const isLiveMode = stripeSecretKey.startsWith('sk_live_');
  
  log(requestId, 'Stripe mode detection', { 
    isTestMode, 
    isLiveMode,
    keyPrefix: stripeSecretKey.substring(0, 8) + '...'
  });

  const stripe = new Stripe(stripeSecretKey, {
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
    log(requestId, 'Request received', { 
      userId, 
      itemCount: rawBody.items?.length,
      email: rawBody.email?.substring(0, 5) + '***',
      discountCode: rawBody.discountCode || null,
      useWallet: rawBody.useWalletBalance || false,
    });
    
    // Validate request body
    const validationResult = checkoutSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      log(requestId, 'Validation error', validationResult.error.issues);
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
      log(requestId, 'Products fetch error', productsError);
      return new Response(
        JSON.stringify({ error: 'Produktai nerasti' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch variants if any items have variantId
    const variantIds = body.items.map(i => i.variantId).filter(Boolean) as string[];
    let variantsMap = new Map<string, any>();
    
    if (variantIds.length > 0) {
      const { data: variants } = await supabase
        .from('product_variants')
        .select('*')
        .in('id', variantIds);
      
      if (variants) {
        variants.forEach(v => variantsMap.set(v.id, v));
      }
    }

    // Validate all products exist
    const productMap = new Map(products.map(p => [p.id, p]));
    for (const item of body.items) {
      if (!productMap.has(item.productId)) {
        log(requestId, 'Product not found', { productId: item.productId });
        return new Response(
          JSON.stringify({ error: `Produktas nerastas: ${item.productId}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Calculate totals server-side (TRUST NOTHING FROM CLIENT)
    // in_stock = full price at checkout, preorder = deposit only
    let subtotalEur = 0;
    let immediatePaymentEur = 0; // What customer pays NOW
    let hasPreorder = false;
    let maxEtaWeeksMin = 0;
    let maxEtaWeeksMax = 0;

    const orderItemsData = body.items.map(item => {
      const product = productMap.get(item.productId)!;
      const variant = item.variantId ? variantsMap.get(item.variantId) : null;
      
      // Use effective price: sale_price_eur if lower than price_eur
      const effectivePriceEur = (product.sale_price_eur && Number(product.sale_price_eur) < Number(product.price_eur))
        ? Number(product.sale_price_eur)
        : Number(product.price_eur);
      
      // Add variant price adjustment
      const variantAdjustment = variant?.price_adjustment_eur ? Number(variant.price_adjustment_eur) : 0;
      const finalUnitPrice = effectivePriceEur + variantAdjustment;
      
      const itemSubtotal = finalUnitPrice * item.quantity;
      const itemDeposit = Number(product.deposit_eur) * item.quantity;
      
      subtotalEur += itemSubtotal;
      
      // CRITICAL: In-stock items pay FULL price immediately, preorder pays DEPOSIT only
      const isPreorder = product.stock_status === 'preorder';
      if (isPreorder) {
        immediatePaymentEur += itemDeposit; // Preorder: pay deposit
        hasPreorder = true;
        if (product.preorder_eta_weeks_min) {
          maxEtaWeeksMin = Math.max(maxEtaWeeksMin, product.preorder_eta_weeks_min);
        }
        if (product.preorder_eta_weeks_max) {
          maxEtaWeeksMax = Math.max(maxEtaWeeksMax, product.preorder_eta_weeks_max);
        }
      } else {
        immediatePaymentEur += itemSubtotal; // In-stock: pay full price
      }

      // Validate inventory for in_stock items
      if (!isPreorder && product.inventory_qty !== null) {
        if (product.inventory_qty < item.quantity) {
          throw new Error(`Prekės "${product.title}" likę tik ${product.inventory_qty} vnt.`);
        }
      }

      return {
        productId: product.id,
        sku: product.sku,
        title: variant ? `${product.title} - ${variant.option_value}` : product.title,
        category: product.category,
        unitPriceEur: finalUnitPrice,
        unitDepositEur: Number(product.deposit_eur),
        quantity: item.quantity,
        isPreorder,
        variantId: variant?.id || null,
        variantName: variant?.option_value || null,
        variantAdjustment,
      };
    });

    // Calculate shipping
    const shippingEur = SHIPPING_COSTS[body.shippingMethod] ?? 0;
    log(requestId, 'Shipping calculated', { method: body.shippingMethod, cost: shippingEur });

    // Validate and apply discount server-side
    let discountEur = 0;
    let offerId: string | null = null;
    let offerCode: string | null = null;
    
    if (body.discountCode) {
      const { data: offer } = await supabase
        .from('offers')
        .select('*')
        .eq('code', body.discountCode.toUpperCase())
        .eq('active', true)
        .maybeSingle();
      
      if (offer) {
        const now = new Date();
        const isValid = (!offer.starts_at || new Date(offer.starts_at) <= now) &&
                        (!offer.ends_at || new Date(offer.ends_at) >= now) &&
                        (!offer.min_cart_total || subtotalEur >= Number(offer.min_cart_total));
        
        if (isValid) {
          if (offer.type === 'percent') {
            // Percent applies to the goods value, not to the deposit. Taking it
            // from immediatePaymentEur meant "20% off" on a 100 EUR preorder
            // with a 30 EUR deposit gave 6 EUR — silently a fifth of what the
            // code advertised.
            discountEur = subtotalEur * (Number(offer.value) / 100);
          } else {
            discountEur = Number(offer.value);
          }
          // Cap at the order value so the total can never go negative. It may
          // exceed the first payment: the totals below absorb what they can up
          // front and carry the rest over to the balance. Capping at the
          // deposit instead, as before, silently shrank every fixed-amount code
          // on a preorder — 50 EUR off became 30 EUR off.
          discountEur = Math.min(discountEur, subtotalEur + shippingEur);
          offerId = offer.id;
          offerCode = offer.code;
          log(requestId, 'Discount applied', { code: offer.code, discountEur });
        }
      }
    }

    // Apply wallet deduction (server-side validation)
    let walletDeductionEur = 0;
    if (userId && body.useWalletBalance) {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id, balance_eur')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (wallet && wallet.balance_eur > 0) {
        // Max deduction is the lesser of wallet balance or (immediate payment - discount)
        const maxDeduction = Math.min(wallet.balance_eur, immediatePaymentEur - discountEur);
        walletDeductionEur = Math.max(0, maxDeduction);
        log(requestId, 'Wallet deduction', { available: wallet.balance_eur, deducting: walletDeductionEur });
      }
    }

    // Money is compared and stored in euros, so round every derived figure to
    // cents — otherwise float drift leaves deposit + balance a fraction off the
    // order total and the last balance payment can never settle exactly.
    const round2 = (n: number) => Math.round(n * 100) / 100;

    // Calculate final totals.
    //
    // Shipping is paid UP FRONT together with the deposit, never split across
    // both payments. The previous version added shipping to the deposit charge
    // while also leaving it inside the balance, so a preorder with courier
    // delivery billed it twice: a 100 EUR item with a 30 EUR deposit and 4.99
    // shipping produced 34.99 + 74.99 = 109.98 against a 104.99 order. A
    // discount produced the mirror error, undercharging by its value.
    const totalEur = round2(subtotalEur + shippingEur - discountEur);

    // What the customer owes on this first payment before credits are applied.
    const chargeBeforeCredits = round2(immediatePaymentEur + shippingEur);
    const creditsApplied = round2(discountEur + walletDeductionEur);
    const stripeChargeEur = round2(Math.max(0, chargeBeforeCredits - creditsApplied));

    // A discount or wallet balance larger than the first payment must not be
    // silently lost — carry the unused part over to reduce the balance.
    const creditsOverflow = round2(Math.max(0, creditsApplied - chargeBeforeCredits));

    // The balance is the product value the deposit did not cover. Shipping and
    // discounts are already settled above, so they must not appear again here.
    const balanceTotalEur = round2(
      Math.max(0, subtotalEur - immediatePaymentEur - creditsOverflow)
    );

    log(requestId, 'Totals calculated', { 
      subtotalEur, 
      shippingEur,
      discountEur,
      walletDeductionEur,
      immediatePaymentEur, 
      stripeChargeEur,
      balanceTotalEur, 
      totalEur,
      hasPreorder,
      paymentPlan: hasPreorder ? 'deposit_only' : 'full_payment'
    });

    // Generate order number
    const { data: orderNumber } = await supabase.rpc('generate_order_number');
    log(requestId, 'Order number generated', { orderNumber });

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
        payment_plan: hasPreorder ? 'deposit_only' : 'full_payment',
        preorder_flag: hasPreorder,
        preorder_eta_weeks_min: maxEtaWeeksMin > 0 ? maxEtaWeeksMin : null,
        preorder_eta_weeks_max: maxEtaWeeksMax > 0 ? maxEtaWeeksMax : null,
        subtotal_eur: subtotalEur,
        discount_eur: discountEur,
        shipping_eur: shippingEur,
        total_eur: totalEur,
        deposit_total_eur: stripeChargeEur,
        balance_total_eur: balanceTotalEur,
        currency: 'EUR',
        shipping_address_json: body.shippingAddress,
        notes: body.notes?.trim().slice(0, 500) || null,
        offer_id: offerId,
        offer_code: offerCode,
        wants_invoice: body.wantsInvoice || false,
        invoice_company_name: body.invoiceCompanyName?.trim() || null,
        invoice_vat_code: body.invoiceVatCode?.trim() || null,
        invoice_address: body.invoiceAddress?.trim() || null,
        invoice_country: body.invoiceCountry?.trim() || null,
        payment_provider: body.paymentProvider || 'stripe',
        payment_method_code: body.paymentMethodCode || 'card',
        utm_source: body.attribution?.utm_source || null,
        utm_medium: body.attribution?.utm_medium || null,
        utm_campaign: body.attribution?.utm_campaign || null,
        utm_content: body.attribution?.utm_content || null,
        utm_term: body.attribution?.utm_term || null,
        gclid: body.attribution?.gclid || null,
        fbclid: body.attribution?.fbclid || null,
        landing_page: body.attribution?.landing_page || null,
      })
      .select()
      .single();

    if (orderError) {
      log(requestId, 'Order creation error', orderError);
      throw new Error(`Nepavyko sukurti užsakymo: ${orderError.message}`);
    }

    log(requestId, 'Order created', { orderId: order.id, orderNumber: order.order_number });

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
      log(requestId, 'Order items creation error', itemsError);
      await supabase.from('orders').delete().eq('id', order.id);
      throw new Error(`Nepavyko sukurti užsakymo prekių: ${itemsError.message}`);
    }

    log(requestId, 'Order items created', { count: orderItems.length });

    // Deduct wallet balance if used
    if (walletDeductionEur > 0 && userId) {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id, balance_eur')
        .eq('user_id', userId)
        .single();
      
      if (wallet) {
        const newBalance = wallet.balance_eur - walletDeductionEur;
        await supabase
          .from('wallets')
          .update({ balance_eur: newBalance })
          .eq('id', wallet.id);
        
        // Log wallet transaction
        await supabase.from('wallet_transactions').insert({
          wallet_id: wallet.id,
          type: 'debit',
          amount_eur: -walletDeductionEur,
          description: `Panaudota užsakymui ${orderNumber}`,
          reference_type: 'order',
          reference_id: order.id,
        });
        
        log(requestId, 'Wallet deducted', { amount: walletDeductionEur, newBalance });
      }
    }

    // If nothing to charge (fully covered by wallet), mark as paid
    if (stripeChargeEur <= 0) {
      await supabase
        .from('orders')
        .update({ status: hasPreorder ? 'deposit_paid' : 'balance_paid', paid_at: new Date().toISOString() })
        .eq('id', order.id);
      
      log(requestId, 'Order fully paid by wallet');
      
      const origin = req.headers.get('origin') || 'https://ibrix.lt';
      return new Response(
        JSON.stringify({
          success: true,
          checkoutUrl: `${origin}/uzsakymas?order_id=${order.id}&paid=wallet`,
          order: {
            id: order.id,
            orderNumber: order.order_number,
            immediatePaymentEur: 0,
            totalEur: totalEur,
            balanceEur: balanceTotalEur,
            hasPreorder,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If skipStripe is set (for Paysera), return order without Stripe session
    if (body.skipStripe) {
      log(requestId, 'Skipping Stripe for Paysera payment');
      return new Response(
        JSON.stringify({
          success: true,
          order: {
            id: order.id,
            orderNumber: order.order_number,
            immediatePaymentEur: stripeChargeEur,
            totalEur: totalEur,
            balanceEur: balanceTotalEur,
            hasPreorder,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Stripe Checkout Session
    const lineItems = orderItemsData.map(item => {
      const unitAmount = item.isPreorder 
        ? Math.round(item.unitDepositEur * 100)  // Preorder: deposit
        : Math.round(item.unitPriceEur * 100);   // In-stock: full price
      
      const label = item.isPreorder 
        ? `${item.title} (depozitas)`
        : item.title;
      
      return {
        price_data: {
          currency: 'eur',
          unit_amount: unitAmount,
          product_data: {
            name: label,
            description: item.isPreorder 
              ? `Depozitas už ${item.quantity} vnt.`
              : `${item.quantity} vnt.`,
          },
        },
        quantity: item.quantity,
      };
    });

    // Add shipping as line item if not free
    if (shippingEur > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(shippingEur * 100),
          product_data: {
            name: 'Pristatymas kurjeriu',
            description: 'Pristatymas į namus',
          },
        },
        quantity: 1,
      });
    }

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
    
    // Calculate discount for Stripe (if any)
    const totalDiscountCents = Math.round((discountEur + walletDeductionEur) * 100);
    
    const sessionConfig: any = {
      customer: stripeCustomerId,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/uzsakymas?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?cancelled=true`,
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
        payment_type: hasPreorder ? 'deposit' : 'full_payment',
        wallet_deduction_eur: walletDeductionEur.toString(),
      },
      payment_intent_data: {
        metadata: {
          order_id: order.id,
          order_number: orderNumber,
          payment_type: hasPreorder ? 'deposit' : 'full_payment',
        },
      },
    };

    // Add discount as coupon if applicable
    if (totalDiscountCents > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: totalDiscountCents,
        currency: 'eur',
        duration: 'once',
        name: discountEur > 0 ? `Nuolaida: ${offerCode}` : 'Piniginės kreditas',
      });
      sessionConfig.discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    log(requestId, 'Stripe session created', { 
      sessionId: session.id, 
      url: session.url?.substring(0, 50) + '...',
      stripeChargeCents: Math.round(stripeChargeEur * 100)
    });

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl: session.url,
        order: {
          id: order.id,
          orderNumber: order.order_number,
          immediatePaymentEur: stripeChargeEur,
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
    log(requestId, 'Checkout error', error);
    const message = error instanceof Error ? error.message : 'Checkout klaida';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});