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

// Generate a 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, username, country, dateOfBirth } = await req.json();

    // Validate required fields (NO PASSWORD - password is collected at verification time)
    if (!email || !firstName || !lastName) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Būtini laukai: el. paštas, vardas, pavardė' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Neteisingas el. pašto formatas' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists in public.users table (faster than listUsers)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();
    
    if (existingUser) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Šis el. paštas jau registruotas' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete any existing pending verification for this email
    await supabase
      .from('email_verification_codes')
      .delete()
      .eq('email', normalizedEmail);

    // Validate username if provided
    let validatedUsername: string | null = null;
    if (username) {
      const usernameRegex = /^[a-zA-Z0-9_.]{3,20}$/;
      if (!usernameRegex.test(username)) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Neteisingas slapyvardžio formatas' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Check username availability
      const { data: usernameAvailable } = await supabase.rpc('check_username_available', {
        check_username: username
      });
      
      if (!usernameAvailable) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Šis slapyvardis jau užimtas' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      validatedUsername = username.toLowerCase().trim();
    }

    // Generate code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification data (NO PASSWORD STORED)
    const { error: insertError } = await supabase
      .from('email_verification_codes')
      .insert({
        email: normalizedEmail,
        code,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: validatedUsername,
        country: country || null,
        date_of_birth: dateOfBirth || null,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('[SIGNUP] Failed to store verification code:', insertError.message);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Nepavyko sukurti patvirtinimo kodo' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send verification email
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'verification_code',
        data: {
          email: normalizedEmail,
          firstName: firstName.trim(),
          code,
        },
      }),
    });

    if (!emailResponse.ok) {
      console.error('[SIGNUP] Failed to send verification email');
      // Don't fail - code is stored, they can request resend
    }

    // Log only email domain for debugging, not full email or code
    const emailDomain = normalizedEmail.split('@')[1];
    console.log(`[SIGNUP] Verification code sent to ***@${emailDomain}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Patvirtinimo kodas išsiųstas į el. paštą',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[SIGNUP] Error:', error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Registracijos klaida' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
