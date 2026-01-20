import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

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
const RATE_LIMIT_MAX = 3; // Max 3 requests per 15 minutes
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

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

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, captchaToken } = await req.json();
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting
    if (!checkRateLimit(normalizedEmail)) {
      // Return success anyway to not reveal rate limiting behavior
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

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
          // Return success anyway to not reveal captcha failure
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Check if user exists in public.users table (faster than listUsers)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();
    
    if (!existingUser) {
      // Return success anyway to not reveal if email exists
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate password reset link
    const baseUrl = 'https://ibrix.lt';
    const redirectTo = `${baseUrl}/auth/reset-password`;
    
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: {
        redirectTo: redirectTo,
      },
    });

    if (resetError) {
      console.error('[PASSWORD_RESET] Error generating reset link');
      return new Response(JSON.stringify({ error: 'Failed to generate reset link' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resetUrl = resetData.properties?.action_link;
    
    if (!resetUrl) {
      console.error('[PASSWORD_RESET] No action_link in response');
      return new Response(JSON.stringify({ error: 'Failed to generate reset link' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send branded email via send-email function
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'password_reset',
        email: normalizedEmail,
        resetUrl: resetUrl,
      }),
    });

    if (!emailResponse.ok) {
      console.error('[PASSWORD_RESET] Email send error');
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log only email domain
    const emailDomain = normalizedEmail.split('@')[1];
    console.log(`[PASSWORD_RESET] Reset link sent to ***@${emailDomain}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[PASSWORD_RESET] Error:', error.message);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
