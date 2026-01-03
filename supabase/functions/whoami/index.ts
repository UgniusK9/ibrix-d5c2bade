import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const log = (step: string, details?: any) => {
  console.log(`[WHOAMI] ${step}`, details ? JSON.stringify(details) : '');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        authenticated: false,
        user: null,
        role: null,
        message: 'No authentication token provided',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      log('Auth failed', { error: authError?.message });
      return new Response(JSON.stringify({
        authenticated: false,
        user: null,
        role: null,
        message: 'Invalid or expired token',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user role from users table
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role, email, created_at')
      .eq('id', user.id)
      .maybeSingle();

    if (roleError) {
      log('Role lookup error', { error: roleError.message, userId: user.id });
    }

    const response = {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      role: userData?.role || 'customer',
      isAdmin: userData?.role === 'admin',
      profileExists: !!userData,
    };

    log('Whoami response', { userId: user.id, role: response.role, isAdmin: response.isAdmin });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    log('Error', { error: error.message });
    return new Response(JSON.stringify({
      authenticated: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
