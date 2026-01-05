import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const giftCardSchema = z.object({
  giftCardAmount: z.number().min(5).max(500),
  recipientEmail: z.string().email(),
  recipientName: z.string().min(1).max(100),
  senderName: z.string().max(100).optional(),
  personalMessage: z.string().max(500).optional(),
  email: z.string().email(), // purchaser email
  firstName: z.string().min(1).max(50),
});

const log = (step: string, details?: any) => {
  console.log(`[GIFT-CARD] ${step}`, details ? JSON.stringify(details) : '');
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
    log('Request received', { email: rawBody.email, amount: rawBody.giftCardAmount });

    const validationResult = giftCardSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      log('Validation error', validationResult.error.issues);
      return new Response(
        JSON.stringify({ error: firstError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = validationResult.data;

    // Generate gift card code
    const { data: giftCardCode } = await supabase.rpc('generate_gift_card_code');
    
    if (!giftCardCode) {
      throw new Error('Nepavyko sugeneruoti dovanų kupono kodo');
    }

    log('Gift card code generated', { code: giftCardCode });

    // Create gift card record (pending status until payment completes)
    const { data: giftCard, error: giftCardError } = await supabase
      .from('gift_cards')
      .insert({
        code: giftCardCode,
        initial_value_eur: body.giftCardAmount,
        current_balance_eur: body.giftCardAmount,
        currency: 'EUR',
        status: 'pending',
        recipient_email: body.recipientEmail,
        recipient_name: body.recipientName,
        personal_message: body.personalMessage || null,
        purchased_by_email: body.email,
        purchased_by_user_id: userId,
      })
      .select()
      .single();

    if (giftCardError) {
      log('Gift card creation error', giftCardError);
      throw new Error('Nepavyko sukurti dovanų kupono');
    }

    log('Gift card created', { id: giftCard.id, code: giftCardCode });

    // Find or create Stripe customer
    let stripeCustomerId: string | undefined;
    const existingCustomers = await stripe.customers.list({
      email: body.email.toLowerCase(),
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      stripeCustomerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: body.email.toLowerCase(),
        name: body.firstName,
      });
      stripeCustomerId = customer.id;
    }

    const origin = req.headers.get('origin') || 'https://ibrix.lt';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(body.giftCardAmount * 100),
            product_data: {
              name: `IBRIX Dovanų kuponas - ${body.giftCardAmount}€`,
              description: `Dovanų kuponas gavėjui: ${body.recipientName}`,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/dovanu-kuponai?success=true&gift_card_id=${giftCard.id}`,
      cancel_url: `${origin}/dovanu-kuponai?cancelled=true`,
      metadata: {
        gift_card_id: giftCard.id,
        gift_card_code: giftCardCode,
        recipient_email: body.recipientEmail,
        recipient_name: body.recipientName,
        type: 'gift_card',
      },
      payment_intent_data: {
        metadata: {
          gift_card_id: giftCard.id,
          gift_card_code: giftCardCode,
          type: 'gift_card',
        },
      },
    });

    log('Stripe session created', { sessionId: session.id });

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl: session.url,
        giftCardId: giftCard.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    log('Error', error);
    const message = error instanceof Error ? error.message : 'Klaida';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});