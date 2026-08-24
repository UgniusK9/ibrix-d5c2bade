/**
 * Cloudflare Turnstile site key.
 *
 * This is a PUBLIC key — it is embedded in the page and visible to anyone, so
 * committing it is fine. The matching secret key is server-side only and lives
 * in Supabase as TURNSTILE_SECRET_KEY; never put that one here.
 *
 * Single source of truth on purpose. The three auth pages previously each
 * declared their own constant, and two of them carried a different key than
 * the third — both left over from the project template. A widget issued a
 * token under one site key can never be validated against another account's
 * secret, so those pages could not have passed verification.
 *
 * Override per environment with VITE_TURNSTILE_SITE_KEY if a separate
 * Cloudflare site is ever used for staging.
 */
export const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAACK6nfotRJO4jVjH';
