import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Return analytics IDs from environment
    const config = {
      gaId: Deno.env.get('GA_MEASUREMENT_ID') || null,
      metaPixelId: Deno.env.get('META_PIXEL_ID') || null,
    };

    return new Response(
      JSON.stringify(config),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error('Analytics config error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch analytics config' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
