import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  code: z.string().min(1).max(50),
  cartTotal: z.number().min(0),
  productIds: z.array(z.string().uuid()).optional(),
  categories: z.array(z.string()).optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Get user from auth header if exists
  const authHeader = req.headers.get('authorization');
  let userId: string | null = null;
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data: { user } } = await supabase.auth.getUser(token);
    userId = user?.id ?? null;
  }

  try {
    const rawBody = await req.json();
    const validationResult = requestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Netinkami duomenys' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { code, cartTotal, productIds, categories } = validationResult.data;

    // Find offer by code
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .maybeSingle();

    if (offerError || !offer) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Kodas nerastas arba nebegalioja' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check date validity
    const now = new Date();
    if (offer.starts_at && new Date(offer.starts_at) > now) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Akcija dar neprasidėjo' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (offer.ends_at && new Date(offer.ends_at) < now) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Akcija pasibaigė' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check min cart total
    if (offer.min_cart_total && cartTotal < Number(offer.min_cart_total)) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: `Minimali užsakymo suma: ${offer.min_cart_total}€` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check max redemptions
    if (offer.max_redemptions) {
      const { count } = await supabase
        .from('redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('offer_id', offer.id);

      if (count && count >= offer.max_redemptions) {
        return new Response(
          JSON.stringify({ valid: false, message: 'Akcijos limitas pasiektas' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check per-user limit if user is logged in
    if (userId && offer.per_user_limit) {
      const { count } = await supabase
        .from('redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('offer_id', offer.id)
        .eq('user_id', userId);

      if (count && count >= offer.per_user_limit) {
        return new Response(
          JSON.stringify({ valid: false, message: 'Jūs jau pasinaudojote šia akcija' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check product/category restrictions (if any)
    const applicableProducts = offer.applicable_products as string[] || [];
    const applicableCategories = offer.applicable_categories as string[] || [];

    if (applicableProducts.length > 0 && productIds) {
      const hasMatch = productIds.some(id => applicableProducts.includes(id));
      if (!hasMatch) {
        return new Response(
          JSON.stringify({ valid: false, message: 'Kodas netaikomas šioms prekėms' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (applicableCategories.length > 0 && categories) {
      const hasMatch = categories.some(cat => applicableCategories.includes(cat));
      if (!hasMatch) {
        return new Response(
          JSON.stringify({ valid: false, message: 'Kodas netaikomas šiai kategorijai' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (offer.type === 'percent') {
      discountAmount = cartTotal * (Number(offer.value) / 100);
    } else {
      discountAmount = Number(offer.value);
    }

    // Ensure discount doesn't exceed cart total
    discountAmount = Math.min(discountAmount, cartTotal);

    return new Response(
      JSON.stringify({
        valid: true,
        offer: {
          id: offer.id,
          code: offer.code,
          title: offer.title,
          type: offer.type,
          value: Number(offer.value),
          freeShipping: offer.free_shipping,
        },
        discountAmount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Discount validation error:', error);
    return new Response(
      JSON.stringify({ valid: false, message: 'Klaida tikrinant kodą' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
