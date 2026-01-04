import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Meta Conversions API endpoint
const META_CAPI_URL = 'https://graph.facebook.com/v18.0';

interface EventData {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url?: string;
  user_data: {
    em?: string[]; // hashed email
    ph?: string[]; // hashed phone
    fn?: string[]; // hashed first name
    ln?: string[]; // hashed last name
    ct?: string[]; // hashed city
    st?: string[]; // hashed state
    zp?: string[]; // hashed zip
    country?: string[]; // hashed country
    external_id?: string[];
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;
    fbp?: string;
  };
  custom_data?: {
    currency?: string;
    value?: number;
    content_ids?: string[];
    content_type?: string;
    content_name?: string;
    num_items?: number;
    order_id?: string;
  };
  action_source: 'website' | 'app' | 'email' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
}

// SHA-256 hash function
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const log = (step: string, details?: any) => {
  console.log(`[META-CAPI] ${step}`, details ? JSON.stringify(details) : '');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const metaPixelId = Deno.env.get('META_PIXEL_ID');
  const metaAccessToken = Deno.env.get('META_CAPI_TOKEN');

  if (!metaPixelId || !metaAccessToken) {
    log('WARNING: META_PIXEL_ID or META_CAPI_TOKEN not configured');
    return new Response(
      JSON.stringify({ success: false, message: 'Meta CAPI not configured' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const {
      eventName,
      eventId,
      email,
      phone,
      firstName,
      lastName,
      city,
      country,
      orderId,
      orderNumber,
      value,
      currency = 'EUR',
      contentIds,
      contentType = 'product',
      numItems,
      sourceUrl,
      fbclid,
      fbp,
      clientIp,
      clientUserAgent,
    } = body;

    log('Received event', { eventName, eventId, orderId });

    // Build user data with hashing
    const userData: EventData['user_data'] = {
      external_id: orderId ? [await sha256(orderId)] : undefined,
    };

    if (email) userData.em = [await sha256(email)];
    if (phone) userData.ph = [await sha256(phone.replace(/\D/g, ''))];
    if (firstName) userData.fn = [await sha256(firstName)];
    if (lastName) userData.ln = [await sha256(lastName)];
    if (city) userData.ct = [await sha256(city)];
    if (country) userData.country = [await sha256(country)];
    if (clientIp) userData.client_ip_address = clientIp;
    if (clientUserAgent) userData.client_user_agent = clientUserAgent;
    if (fbclid) userData.fbc = `fb.1.${Date.now()}.${fbclid}`;
    if (fbp) userData.fbp = fbp;

    // Build event data
    const eventData: EventData = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      event_source_url: sourceUrl,
      user_data: userData,
      action_source: 'website',
    };

    // Add custom data for purchase/conversion events
    if (value !== undefined || contentIds) {
      eventData.custom_data = {};
      if (value !== undefined) {
        eventData.custom_data.currency = currency;
        eventData.custom_data.value = value;
      }
      if (contentIds) {
        eventData.custom_data.content_ids = contentIds;
        eventData.custom_data.content_type = contentType;
      }
      if (numItems) {
        eventData.custom_data.num_items = numItems;
      }
      if (orderId || orderNumber) {
        eventData.custom_data.order_id = orderNumber || orderId;
      }
    }

    // Send to Meta CAPI
    const response = await fetch(
      `${META_CAPI_URL}/${metaPixelId}/events?access_token=${metaAccessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [eventData],
          test_event_code: Deno.env.get('META_TEST_EVENT_CODE'), // Remove in production
        }),
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      log('Meta CAPI error', result);
      return new Response(
        JSON.stringify({ success: false, error: result }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log('Event sent successfully', { eventId, eventsReceived: result.events_received });

    return new Response(
      JSON.stringify({ success: true, eventsReceived: result.events_received }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    log('Error', { message: error.message });
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
