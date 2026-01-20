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

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // messages per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, message } = await req.json();

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

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Message is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (message.length > 5000) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Message too long (max 5000 characters)' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limit by token
    if (!checkRateLimit(token)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Too many messages. Please wait a moment.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate token and get inquiry
    const { data: inquiry, error: inquiryError } = await supabase
      .from('contact_inquiries')
      .select('id, status, email, name')
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

    // Check if inquiry is not resolved
    if (inquiry.status === 'resolved') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'This inquiry has been resolved' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert message
    const { data: newMessage, error: insertError } = await supabase
      .from('inquiry_messages')
      .insert({
        inquiry_id: inquiry.id,
        message: message.trim(),
        sender_type: 'customer',
      })
      .select('id, message, sender_type, created_at')
      .single();

    if (insertError) {
      console.error('[ADD-MESSAGE] Insert error:', insertError.message);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to add message' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update inquiry status to in_progress if it was new
    if (inquiry.status === 'new') {
      await supabase
        .from('contact_inquiries')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', inquiry.id);
    } else {
      // Just update the timestamp
      await supabase
        .from('contact_inquiries')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', inquiry.id);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: newMessage,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[ADD-MESSAGE] Error:', error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
