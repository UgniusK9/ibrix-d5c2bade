// No imports on purpose: runs under Deno (edge function) and Node (charge.test.ts).

// What may be charged for an order, decided from its state in the DB (never from
// the client). Must agree with paysera-callback/decide.ts: a first payment
// ('created') is deposit_total_eur for both deposit and full-payment plans, a
// balance payment is balance_total_eur.
export function chooseCharge(order: {
  status: string;
  deposit_total_eur: number | string;
  balance_total_eur: number | string;
}): { type: "deposit" | "balance"; cents: number } | { error: string } {
  if (order.status === "created") {
    return { type: "deposit", cents: Math.round(Number(order.deposit_total_eur) * 100) };
  }
  if (order.status === "deposit_paid" || order.status === "awaiting_balance") {
    return { type: "balance", cents: Math.round(Number(order.balance_total_eur) * 100) };
  }
  return { error: `order is not payable (status ${order.status})` };
}
