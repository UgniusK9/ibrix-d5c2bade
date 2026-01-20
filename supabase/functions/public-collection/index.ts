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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
}

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  
  entry.count++;
  if (entry.count > RATE_LIMIT) {
    return true;
  }
  
  return false;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting by IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    if (isRateLimited(clientIp)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Per daug užklausų. Palaukite minutę.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const username = url.searchParams.get('username');

    if (!username || username.trim().length < 3) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Neteisingas vartotojo vardas' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Use the secure RPC function
    const { data: collection, error } = await supabase
      .rpc('get_public_collection', { target_username: username.trim() });

    if (error) {
      console.error('[PUBLIC-COLLECTION] RPC error:', error.message);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Paieškos klaida' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If empty result, return generic "not found or private" message
    // This prevents username enumeration
    if (!collection || collection.length === 0) {
      return new Response(JSON.stringify({ 
        success: true,
        found: false,
        message: 'Kolekcija nerasta arba privati',
        items: [],
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      found: true,
      items: collection,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[PUBLIC-COLLECTION] Error:', error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Serverio klaida' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
