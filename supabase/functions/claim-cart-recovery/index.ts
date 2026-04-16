import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "token required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: link, error } = await supabase
      .from("cart_recovery_links")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !link) {
      return new Response(JSON.stringify({ error: "Invalid recovery link" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (link.used_at) {
      return new Response(JSON.stringify({ error: "Recovery link already used" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(link.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Recovery link expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as claimed (first time accessed)
    if (!link.claimed_at) {
      await supabase
        .from("cart_recovery_links")
        .update({ claimed_at: new Date().toISOString() })
        .eq("id", link.id);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        offer_code: link.offer_code,
        discount_type: link.discount_type,
        discount_value: link.discount_value,
        recipient_email: link.recipient_email,
        requires_auth: !!link.user_id,
        expires_at: link.expires_at,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[claim-cart-recovery] error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
