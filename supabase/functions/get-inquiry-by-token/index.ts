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
    const { token } = await req.json();

    // Validate token format (32 hex chars)
    if (!token || typeof token !== 'string' || !/^[a-f0-9]{32}$/i.test(token)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid token format' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch inquiry by token (server-side token validation)
    const { data: inquiry, error: inquiryError } = await supabase
      .from('contact_inquiries')
      .select('id, name, email, topic, order_number, message, status, created_at, updated_at, conversation_token')
      .eq('conversation_token', token)
      .single();

    if (inquiryError || !inquiry) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Inquiry not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch messages for this inquiry
    const { data: messages, error: messagesError } = await supabase
      .from('inquiry_messages')
      .select('id, message, sender_type, created_at')
      .eq('inquiry_id', inquiry.id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('[GET-INQUIRY] Messages fetch error:', messagesError.message);
    }

    // Return inquiry data (excluding internal fields if needed)
    return new Response(JSON.stringify({ 
      success: true,
      inquiry: {
        id: inquiry.id,
        name: inquiry.name,
        topic: inquiry.topic,
        order_number: inquiry.order_number,
        status: inquiry.status,
        created_at: inquiry.created_at,
        updated_at: inquiry.updated_at,
      },
      messages: messages || [],
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[GET-INQUIRY] Error:', error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
