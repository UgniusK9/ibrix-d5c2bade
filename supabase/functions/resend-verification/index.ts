import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'El. paštas būtinas' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find existing pending verification
    const { data: existing, error: fetchError } = await supabase
      .from('email_verification_codes')
      .select('*')
      .eq('email', email.toLowerCase())
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
          email: email.toLowerCase(),
          firstName: existing.first_name,
          code: newCode,
        },
      }),
    });

    console.log(`Resent verification code to ${email}: ${newCode}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Naujas kodas išsiųstas',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Resend error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
