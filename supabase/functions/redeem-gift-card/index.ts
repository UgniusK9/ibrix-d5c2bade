import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { normalizeCode, isThrottled, WINDOW_MINUTES } from "./code.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "method_not_allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return reply({ error: "unauthorized" }, 401);

    // Same pattern as purchase-with-credits: verify_jwt is off in config.toml, the
    // token is checked here instead (the gateway cannot verify this project's ES256 tokens).
    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) return reply({ error: "unauthorized" }, 401);

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Throttle guessing: too many wrong codes recently for this user.
    // ponytail: per user only; an attacker with many accounts is not slowed, but 60-bit codes make that moot.
    const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
    const { count, error: countError } = await admin
      .from("gift_card_redeem_failures")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", since);
    if (countError) {
      console.error("Throttle lookup failed:", countError);
      return reply({ error: "server_error" }, 500);
    }
    if (isThrottled(count ?? 0)) return reply({ error: "too_many_attempts" }, 429);

    const { code: rawCode } = await req.json().catch(() => ({}));
    const code = normalizeCode(rawCode);

    // Unknown, already used, expired and badly formatted all give the same answer.
    const fail = async () => {
      const { error } = await admin.from("gift_card_redeem_failures").insert({ user_id: user.id });
      if (error) console.error("Could not record failed attempt:", error);
      return reply({ error: "invalid_code" }, 404);
    };
    if (!code) return await fail();

    const { data: amount, error: redeemError } = await admin.rpc("redeem_gift_card", {
      p_code: code,
      p_user_id: user.id,
    });
    if (redeemError) {
      console.error("redeem_gift_card failed:", redeemError);
      return reply({ error: "server_error" }, 500);
    }
    if (amount === null) return await fail();

    return reply({ success: true, amount: Number(amount) });
  } catch (error) {
    console.error("Redeem gift card error:", error);
    return reply({ error: "server_error" }, 500);
  }
});
