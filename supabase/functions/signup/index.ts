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
    const { email, password, firstName, lastName, country, dateOfBirth } = await req.json();

    if (!email || !password || !firstName || !lastName) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Būtini laukai: el. paštas, slaptažodis, vardas, pavardė' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if email already exists in auth.users
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (emailExists) {
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
      .eq('email', email.toLowerCase());

    // Generate code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification data (password is hashed by Supabase later)
    const { error: insertError } = await supabase
      .from('email_verification_codes')
      .insert({
        email: email.toLowerCase(),
        code,
        first_name: firstName,
        last_name: lastName,
        password_hash: password, // Will be properly hashed when creating user
        country,
        date_of_birth: dateOfBirth,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Failed to store verification code:', insertError);
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
          email: email.toLowerCase(),
          firstName,
          code,
        },
      }),
    });

    if (!emailResponse.ok) {
      console.error('Failed to send email:', await emailResponse.text());
      // Don't fail - code is stored, they can request resend
    }

    console.log(`Verification code sent to ${email}: ${code}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Patvirtinimo kodas išsiųstas į el. paštą',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
