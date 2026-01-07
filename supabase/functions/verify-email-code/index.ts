import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Būtini laukai: el. paštas ir kodas' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find the verification record
    const { data: verification, error: fetchError } = await supabase
      .from('email_verification_codes')
      .select('*')
      .eq('email', email.toLowerCase())
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

    // Create the user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: verification.email,
      password: verification.password_hash,
      email_confirm: true, // Auto-confirm since they verified via code
      user_metadata: {
        first_name: verification.first_name,
        last_name: verification.last_name,
      },
    });

    if (authError) {
      console.error('Failed to create user:', authError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: authError.message 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update/create the public.users record
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email: verification.email,
        first_name: verification.first_name,
        last_name: verification.last_name,
        country: verification.country,
        date_of_birth: verification.date_of_birth,
        role: 'customer',
      }, { onConflict: 'id' });

    if (userError) {
      console.error('Failed to update user profile:', userError);
    }

    // Mark verification as used
    await supabase
      .from('email_verification_codes')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verification.id);

    // Generate session for auto-login
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: verification.email,
    });

    // Send welcome email
    await fetch(`${supabaseUrl}/functions/v1/send-email`, {
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
    });

    console.log(`User ${verification.email} verified and created successfully`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Paskyra sėkmingai sukurta!',
      userId: authData.user.id,
      email: verification.email,
      password: verification.password_hash, // Will be used for auto-login
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Verification error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
