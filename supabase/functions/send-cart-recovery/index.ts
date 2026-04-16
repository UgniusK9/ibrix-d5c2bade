import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartRecoveryRequest {
  cart_id: string;
  recipient_email: string;
  recipient_name?: string;
  user_id?: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  custom_message?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleRow } = await supabase
      .from("users")
      .select("role")
      .eq("id", userData.user.id)
      .single();
    if (roleRow?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: CartRecoveryRequest = await req.json();
    const { cart_id, recipient_email, recipient_name, user_id, discount_type, discount_value, custom_message } = body;

    if (!cart_id || !recipient_email || !discount_type || !discount_value) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["percent", "fixed"].includes(discount_type)) {
      return new Response(JSON.stringify({ error: "Invalid discount_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (discount_type === "percent" && (discount_value < 1 || discount_value > 90)) {
      return new Response(JSON.stringify({ error: "Percent must be 1-90" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Generate unique offer code
    const codeSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const offerCode = `WIN-${codeSuffix}`;

    // 2. Create offer in offers table
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .insert({
        code: offerCode,
        title: `Krepšelio atgavimo nuolaida (${discount_type === "percent" ? `${discount_value}%` : `${discount_value}€`})`,
        description: "Asmeninė nuolaida iš Ibrix",
        type: discount_type === "percent" ? "percentage" : "fixed_amount",
        value: discount_value,
        active: true,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        per_user_limit: 1,
        max_redemptions: 1,
        stackable: false,
      })
      .select()
      .single();

    if (offerError || !offer) {
      console.error("[send-cart-recovery] offer error:", offerError);
      return new Response(JSON.stringify({ error: "Failed to create offer", detail: offerError?.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Add per-user target if user_id provided
    if (user_id) {
      await supabase.from("offer_targets").insert({
        offer_id: offer.id,
        user_id,
      });
    }

    // 4. Create cart_recovery_links record
    const { data: recoveryLink, error: linkError } = await supabase
      .from("cart_recovery_links")
      .insert({
        user_id: user_id || null,
        recipient_email,
        offer_id: offer.id,
        offer_code: offerCode,
        discount_type,
        discount_value,
        cart_id,
        created_by_admin_id: userData.user.id,
      })
      .select()
      .single();

    if (linkError || !recoveryLink) {
      console.error("[send-cart-recovery] link error:", linkError);
      return new Response(JSON.stringify({ error: "Failed to create recovery link" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Send email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const recoveryUrl = `https://ibrix.lt/checkout?recovery=${recoveryLink.token}`;
    const discountLabel = discount_type === "percent" ? `${discount_value}%` : `${discount_value}€`;

    const html = `<!DOCTYPE html>
<html lang="lt">
<head>
  <meta charset="UTF-8">
  <title>Speciali nuolaida tau</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0F172A;color:#E2E8F0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1E293B;border-radius:16px;overflow:hidden;max-width:600px;">
          <tr>
            <td style="padding:32px;text-align:center;background:linear-gradient(135deg,#1E4ED8 0%,#3B82F6 100%);">
              <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;">IBRIX</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="color:#fff;font-size:24px;margin:0 0 16px;">Tavo krepšelis dar laukia 🛒</h2>
              <p style="color:#CBD5E1;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Sveiki${recipient_name ? `, ${recipient_name}` : ""}! Pastebėjome, kad pridėjote prekių į krepšelį, bet dar neužbaigėte pirkimo.
              </p>
              ${custom_message ? `<p style="color:#CBD5E1;font-size:16px;line-height:1.6;margin:0 0 24px;font-style:italic;">${custom_message}</p>` : ""}
              <div style="background:#0F172A;border:2px solid #F97316;border-radius:16px;padding:24px;text-align:center;margin:24px 0;">
                <p style="color:#94A3B8;font-size:14px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Asmeninė nuolaida</p>
                <p style="color:#F97316;font-size:42px;font-weight:800;margin:0;">-${discountLabel}</p>
                <p style="color:#94A3B8;font-size:13px;margin:8px 0 0;">Galioja 14 dienų</p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:16px 0;">
                    <a href="${recoveryUrl}" style="background:#F97316;color:#fff;padding:16px 40px;border-radius:16px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">
                      Užbaigti pirkimą su nuolaida →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#64748B;font-size:13px;line-height:1.6;margin:24px 0 0;text-align:center;">
                Nuolaidos kodas: <strong style="color:#F97316;">${offerCode}</strong><br>
                Šis linkas pritaikys nuolaidą automatiškai, kai prisijungsi.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background:#0F172A;text-align:center;border-top:1px solid #334155;">
              <p style="color:#64748B;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} Ibrix.lt — Premium konstruktoriai
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    let emailStatus = "failed";
    let emailError: string | null = null;

    if (resendKey && lovableKey) {
      try {
        const resp = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${lovableKey}`,
            "X-Connection-Api-Key": resendKey,
          },
          body: JSON.stringify({
            from: "Ibrix <noreply@ibrix.lt>",
            to: [recipient_email],
            subject: `🎁 Tavo asmeninė ${discountLabel} nuolaida laukia`,
            html,
          }),
        });
        if (resp.ok) {
          emailStatus = "sent";
        } else {
          emailError = await resp.text();
          console.error("[send-cart-recovery] email failed:", emailError);
        }
      } catch (e) {
        emailError = String(e);
        console.error("[send-cart-recovery] email exception:", e);
      }
    } else {
      emailError = "Email service not configured";
    }

    await supabase
      .from("cart_recovery_links")
      .update({
        email_sent_at: new Date().toISOString(),
        email_status: emailStatus,
        email_error: emailError,
      })
      .eq("id", recoveryLink.id);

    return new Response(
      JSON.stringify({
        ok: true,
        token: recoveryLink.token,
        offer_code: offerCode,
        email_status: emailStatus,
        email_error: emailError,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[send-cart-recovery] error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
