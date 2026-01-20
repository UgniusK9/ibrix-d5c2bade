import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS with allowed origins
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
    // Get auth token from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Reikalingas prisijungimas' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create client with user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Sesija nebegalioja' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { serial } = await req.json();

    // Validate serial format
    if (!serial || typeof serial !== 'string' || serial.trim().length < 3) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Neteisingas serijinis numeris' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedSerial = serial.trim().toUpperCase();

    // Use service role for database operations
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if serial exists in serial_numbers table
    const { data: serialData, error: serialError } = await adminSupabase
      .from('serial_numbers')
      .select('serial, product_id, status')
      .eq('serial', normalizedSerial)
      .maybeSingle();

    if (serialError) {
      console.error('[REGISTER-SERIAL] DB error:', serialError.message);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Duomenų bazės klaida' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!serialData) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Serijinis numeris nerastas sistemoje' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (serialData.status === 'voided') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Šis serijinis numeris nebegalioja' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if serial already registered in user_builders
    const { data: existingBuilder } = await adminSupabase
      .from('user_builders')
      .select('id')
      .eq('serial', normalizedSerial)
      .maybeSingle();

    if (existingBuilder) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Šis serijinis numeris jau užregistruotas' 
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Register the serial for the user
    const { error: insertError } = await adminSupabase
      .from('user_builders')
      .insert({
        user_id: user.id,
        product_id: serialData.product_id,
        source: 'offline',
        serial: normalizedSerial,
        quantity: 1,
      });

    if (insertError) {
      // Handle unique constraint violation
      if (insertError.code === '23505') {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Šis serijinis numeris jau užregistruotas' 
        }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.error('[REGISTER-SERIAL] Insert error:', insertError.message);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Nepavyko užregistruoti' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update serial status to registered
    await adminSupabase
      .from('serial_numbers')
      .update({ status: 'registered' })
      .eq('serial', normalizedSerial);

    console.log(`[REGISTER-SERIAL] Success: user ${user.id} registered serial ${normalizedSerial}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Konstruktorius sėkmingai užregistruotas!',
      productId: serialData.product_id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[REGISTER-SERIAL] Error:', error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Serverio klaida' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
