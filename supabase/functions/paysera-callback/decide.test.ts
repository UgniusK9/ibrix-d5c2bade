// Run: node --test supabase/functions/paysera-callback/decide.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { decideCallback } from "./decide.ts";

const pre = { status: "created", payment_plan: "deposit_only", deposit_total_eur: 50, balance_total_eur: 50 };
const ok = (amount: string) => ({ amount, currency: "EUR", test: "0" });

test("deposit equal to balance on a first payment is a deposit, not a balance", () => {
  const d = decideCallback(pre, ok("5000"));
  assert.equal(d.action, "process");
  assert.equal(d.kind, "first");
  assert.equal(d.newStatus, "deposit_paid");
});

test("balance payment is decided by status", () => {
  for (const status of ["deposit_paid", "awaiting_balance"]) {
    const d = decideCallback({ ...pre, status }, ok("5000"));
    assert.equal(d.kind, "balance");
    assert.equal(d.newStatus, "balance_paid");
  }
});

test("full-payment plan goes straight to balance_paid", () => {
  const d = decideCallback({ ...pre, payment_plan: "full_payment", deposit_total_eur: 12.34 }, ok("1234"));
  assert.equal(d.action, "process");
  assert.equal(d.newStatus, "balance_paid");
});

test("repeat callbacks on paid/packed/shipped orders are ignored", () => {
  for (const status of ["balance_paid", "packed", "shipped", "delivered", "refunded"]) {
    assert.equal(decideCallback({ ...pre, status }, ok("5000")).action, "ignore");
  }
});

test("wrong amount, currency, test flag or garbage amount is rejected", () => {
  assert.equal(decideCallback(pre, ok("4999")).action, "reject");
  assert.equal(decideCallback(pre, { ...ok("5000"), currency: "USD" }).action, "reject");
  assert.equal(decideCallback(pre, { ...ok("5000"), test: "1" }).action, "reject");
  assert.equal(decideCallback(pre, ok("50.00")).action, "reject");
  assert.equal(decideCallback(pre, { currency: "EUR" }).action, "reject");
});

test("float euros compare in cents", () => {
  assert.equal(decideCallback({ ...pre, deposit_total_eur: "34.99" }, ok("3499")).action, "process");
});

test("money for a cancelled order is rejected loudly, not ignored", () => {
  const r = decideCallback(
    { status: "cancelled", payment_plan: "full_payment", deposit_total_eur: 10, balance_total_eur: 0 },
    { currency: "EUR", amount: "1000", test: "0" },
  );
  assert.equal(r.action, "reject");
});
