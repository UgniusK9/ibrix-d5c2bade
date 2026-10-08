// No imports on purpose: runs under Deno (edge function) and Node (decide.test.ts).

export interface CallbackOrder {
  status: string;
  payment_plan?: string | null;
  deposit_total_eur: number | string;
  balance_total_eur: number | string;
}

export type Decision =
  | { action: "ignore"; reason: string } // nothing to do, answer OK
  | { action: "reject"; reason: string } // looks wrong: log loudly, change nothing, answer OK
  | {
      action: "process";
      kind: "first" | "balance";
      paidCents: number;
      fromStatuses: string[]; // the order must still be in one of these when we update it
      newStatus: "deposit_paid" | "balance_paid";
    };

const cents = (eur: number | string) => Math.round(Number(eur) * 100);

// Decides what a status=1 callback means from the ORDER STATE, never from the
// amount: a 50% deposit plus free shipping can equal the balance exactly.
// Pays attention to the order-currency fields (amount/currency), not the
// payamount/paycurrency fields, which are what the buyer's bank moved.
export function decideCallback(order: CallbackOrder, params: Record<string, string>): Decision {
  if (params.test === "1") return { action: "reject", reason: "test payment (test=1) on a live callback" };
  if (params.currency !== "EUR") return { action: "reject", reason: `currency is ${params.currency}, expected EUR` };
  if (!/^\d+$/.test(params.amount ?? "")) return { action: "reject", reason: `bad amount ${params.amount}` };
  const paidCents = parseInt(params.amount, 10);

  let kind: "first" | "balance";
  let fromStatuses: string[];
  let expected: number;
  let newStatus: "deposit_paid" | "balance_paid";

  if (order.status === "created") {
    kind = "first";
    fromStatuses = ["created"];
    expected = cents(order.deposit_total_eur);
    newStatus = order.payment_plan === "full_payment" ? "balance_paid" : "deposit_paid";
  } else if (order.status === "deposit_paid" || order.status === "awaiting_balance") {
    kind = "balance";
    fromStatuses = ["deposit_paid", "awaiting_balance"];
    expected = cents(order.balance_total_eur);
    newStatus = "balance_paid";
  } else if (order.status === "cancelled") {
    // Money arrived for an order we cancelled: not a duplicate, a human must refund or revive it
    return { action: "reject", reason: "payment received for a cancelled order" };
  } else {
    return { action: "ignore", reason: `order already past payment (status ${order.status})` };
  }

  if (paidCents !== expected) {
    return { action: "reject", reason: `paid ${paidCents} cents, expected ${expected} for ${kind} payment` };
  }
  return { action: "process", kind, paidCents, fromStatuses, newStatus };
}
