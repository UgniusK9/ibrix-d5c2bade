// No imports on purpose: runs under Deno (edge functions) and Node (offer-limits.test.ts).
//
// The `redemptions` table is never written to and cannot hold guests
// (user_id is NOT NULL), so usage is counted from orders instead. An order uses
// a code unless it was cancelled or refunded; an unpaid ('created') order only
// holds the code for an hour, so an abandoned checkout does not burn it forever.

export interface OfferLimits {
  max_redemptions: number | null;
  per_user_limit: number | null;
}

const HOLD_UNPAID_MS = 60 * 60 * 1000;

// Returns the message to show the customer, or null when the code may be used.
export function limitMessage(offer: OfferLimits, totalUses: number, userUses: number): string | null {
  if (offer.max_redemptions && totalUses >= offer.max_redemptions) return "Akcijos limitas pasiektas";
  if (offer.per_user_limit && userUses >= offer.per_user_limit) return "Jūs jau pasinaudojote šia akcija";
  return null;
}

// deno-lint-ignore no-explicit-any
export async function countOfferUses(supabase: any, offerId: string, userId: string | null, email: string | null) {
  const holdSince = new Date(Date.now() - HOLD_UNPAID_MS).toISOString();
  // deno-lint-ignore no-explicit-any
  const usedOrders = (): any =>
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("offer_id", offerId)
      .not("status", "in", "(cancelled,refunded)")
      .or(`status.neq.created,created_at.gte.${holdSince}`);

  const [total, byUser, byEmail] = await Promise.all([
    usedOrders(),
    userId ? usedOrders().eq("user_id", userId) : Promise.resolve({ count: 0 }),
    email ? usedOrders().eq("email", email.trim().toLowerCase()) : Promise.resolve({ count: 0 }),
  ]);
  return {
    totalUses: total.count ?? 0,
    userUses: Math.max(byUser.count ?? 0, byEmail.count ?? 0),
  };
}
