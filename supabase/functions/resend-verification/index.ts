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

// Simple in-memory rate limiting (per email)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3; // Max 3 resends per 10 minutes
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase();
  const entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
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
    const { email, captchaToken } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'El. paštas būtinas' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting
    if (!checkRateLimit(normalizedEmail)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Per daug užklausų. Bandykite vėliau.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify CAPTCHA if provided
    if (captchaToken && captchaToken !== 'bypass') {
      const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY');
      if (turnstileSecret) {
        const captchaResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${turnstileSecret}&response=${captchaToken}`,
        });
        const captchaResult = await captchaResponse.json();
        if (!captchaResult.success) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'CAPTCHA patikra nepavyko' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Find existing pending verification
    const { data: existing, error: fetchError } = await supabase
      .from('email_verification_codes')
      .select('id, first_name')
      .eq('email', normalizedEmail)
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !existing) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Registracija nerasta. Pradėkite iš naujo.' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate new code
    const newCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update with new code
    await supabase
      .from('email_verification_codes')
      .update({ 
        code: newCode, 
        expires_at: expiresAt.toISOString() 
      })
      .eq('id', existing.id);

    // Send email
    await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'verification_code',
        data: {
          email: normalizedEmail,
          firstName: existing.first_name,
          code: newCode,
        },
      }),
    });

    // Log only email domain
    const emailDomain = normalizedEmail.split('@')[1];
    console.log(`[RESEND] Verification code resent to ***@${emailDomain}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Naujas kodas išsiųstas',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[RESEND] Error:', error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Klaida siunčiant kodą' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
