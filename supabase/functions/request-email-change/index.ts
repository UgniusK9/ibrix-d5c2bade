import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Backend function: requests a login-email change and enforces a 20s per-user cooldown.
// This function now uses our own IBRIX branded email template via send-email function.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COOLDOWN_SECONDS = 20;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!jwt) return json(401, { error: 'unauthorized' });

    const { email } = await req.json().catch(() => ({ email: null }));
    const normalizedEmail = String(email || '').toLowerCase().trim();
    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      return json(400, { error: 'invalid_email' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Use the user's JWT for authentication
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Service role client for checking email uniqueness
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) return json(401, { error: 'unauthorized' });
    const userId = userRes.user.id;
    const currentEmail = userRes.user.email;

    // Don't allow changing to the same email
    if (normalizedEmail === currentEmail?.toLowerCase().trim()) {
      return json(400, { error: 'same_email' });
    }

    // Check if email is already registered by another user
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    
    // Check in our users table for email uniqueness
    const { data: existingUserByEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .neq('id', userId)
      .maybeSingle();

    if (existingUserByEmail) {
      return json(409, { error: 'email_in_use' });
    }

    // Server-side rate limit: allow first send immediately, then 20s cooldown.
    const { data: existingRow } = await supabase
      .from('email_change_requests')
      .select('last_sent_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingRow?.last_sent_at) {
      const lastSentAtMs = new Date(existingRow.last_sent_at).getTime();
      const remainingMs = COOLDOWN_SECONDS * 1000 - (Date.now() - lastSentAtMs);
      if (remainingMs > 0) {
        return json(429, { error: 'rate_limited', retryAfter: Math.max(1, Math.ceil(remainingMs / 1000)) });
      }
    }

    const origin = req.headers.get('origin') || 'https://ibrix.lt';
    const redirectTo = `${origin}/account/settings`;

    // Call Auth API directly with the JWT to trigger the built-in email confirmation flow.
    // Supabase will send confirmation emails to BOTH old and new emails by default.
    // The confirmation link goes to the NEW email.
    const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: normalizedEmail,
        email_redirect_to: redirectTo,
      }),
    });

    if (!authRes.ok) {
      const body = await authRes.json().catch(() => ({}));
      const message = (body as any)?.msg || (body as any)?.message || (body as any)?.error_description || '';

      if (authRes.status === 429) {
        return json(429, { error: 'rate_limited', retryAfter: COOLDOWN_SECONDS });
      }
      if (String(message).toLowerCase().includes('already') && String(message).toLowerCase().includes('registered')) {
        return json(409, { error: 'email_in_use' });
      }
      if (authRes.status === 400 && String(message).toLowerCase().includes('email')) {
        return json(400, { error: 'invalid_email' });
      }

      return json(authRes.status, { error: 'provider_error', message: message || 'Failed to request email change' });
    }

    // Update last_sent_at only AFTER a successful send.
    await supabase.from('email_change_requests').upsert(
      { user_id: userId, last_sent_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

    console.log(`[EMAIL_CHANGE] requested user=${userId} newEmail=${normalizedEmail}`);
    return json(200, { success: true, cooldownSeconds: COOLDOWN_SECONDS, newEmail: normalizedEmail });
  } catch (e) {
    console.error('[EMAIL_CHANGE] error', e);
    return json(500, { error: 'server_error' });
  }
});
