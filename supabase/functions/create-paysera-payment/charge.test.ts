// Run: node --test supabase/functions/create-paysera-payment/charge.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { chooseCharge } from "./charge.ts";

const o = { deposit_total_eur: 34.99, balance_total_eur: 74.99 };

test("payable statuses", () => {
  assert.deepEqual(chooseCharge({ ...o, status: "created" }), { type: "deposit", cents: 3499 });
  assert.deepEqual(chooseCharge({ ...o, status: "deposit_paid" }), { type: "balance", cents: 7499 });
  assert.deepEqual(chooseCharge({ ...o, status: "awaiting_balance" }), { type: "balance", cents: 7499 });
});

test("already paid or closed orders are refused", () => {
  for (const status of ["balance_paid", "packed", "shipped", "delivered", "cancelled", "refunded"]) {
    assert.ok("error" in chooseCharge({ ...o, status }), status);
  }
});
