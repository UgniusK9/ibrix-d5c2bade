import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS with allowed origins only
const ALLOWED_ORIGINS = [
  'https://ibrix.lt',
  'https://www.ibrix.lt',
  'https://ibrix.lovable.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Password is now required at verification time (not stored during signup)
    const { email, code, password } = await req.json();

    if (!email || !code || !password) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Būtini laukai: el. paštas, kodas ir slaptažodis' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Slaptažodis turi būti bent 8 simbolių' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const normalizedEmail = email.toLowerCase().trim();

    // Find the verification record
    const { data: verification, error: fetchError } = await supabase
      .from('email_verification_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('code', code)
      .is('verified_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !verification) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Neteisingas arba pasibaigęs kodas' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create the user in auth.users with the password provided now (NOT stored previously)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: verification.email,
      password: password, // Password provided at verification time
      email_confirm: true, // Auto-confirm since they verified via code
      user_metadata: {
        first_name: verification.first_name,
        last_name: verification.last_name,
      },
    });

    if (authError) {
      console.error('[VERIFY] Failed to create user:', authError.message);
      
      // Handle duplicate email error gracefully
      if (authError.message.includes('already') || authError.message.includes('exists')) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Šis el. paštas jau registruotas' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Nepavyko sukurti paskyros' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update/create the public.users record (including username if provided)
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email: verification.email,
        first_name: verification.first_name,
        last_name: verification.last_name,
        username: verification.username || null,
        country: verification.country,
        date_of_birth: verification.date_of_birth,
        role: 'customer',
      }, { onConflict: 'id' });

    if (userError) {
      console.error('[VERIFY] Failed to update user profile:', userError.message);
    }

    // Mark verification as used
    await supabase
      .from('email_verification_codes')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verification.id);

    // Generate magic link for auto-login (instead of returning password)
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: verification.email,
    });

    // Send welcome email (fire and forget)
    fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'welcome',
        data: {
          email: verification.email,
          firstName: verification.first_name,
          lastName: verification.last_name,
        },
      }),
    }).catch(() => {});

    // Log only email domain for debugging
    const emailDomain = verification.email.split('@')[1];
    console.log(`[VERIFY] User ***@${emailDomain} verified and created successfully`);

    // Return success with magic link for auto-login (NO PASSWORD RETURNED)
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Paskyra sėkmingai sukurta!',
      userId: authData.user.id,
      // Return magic link action_link for auto-login redirect
      actionLink: linkData?.properties?.action_link || null,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[VERIFY] Error:', error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Patvirtinimo klaida' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
