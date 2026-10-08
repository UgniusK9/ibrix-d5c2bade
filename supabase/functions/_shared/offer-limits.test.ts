// Run: node --test supabase/functions/_shared/offer-limits.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { limitMessage } from "./offer-limits.ts";

test("single-use code is blocked after one order", () => {
  const offer = { max_redemptions: 1, per_user_limit: 1 };
  assert.equal(limitMessage(offer, 0, 0), null);
  assert.ok(limitMessage(offer, 1, 0));
});

test("per-user limit blocks a repeat customer but not a new one", () => {
  const offer = { max_redemptions: null, per_user_limit: 1 };
  assert.ok(limitMessage(offer, 50, 1));
  assert.equal(limitMessage(offer, 50, 0), null);
});

test("no limits set means unlimited", () => {
  assert.equal(limitMessage({ max_redemptions: null, per_user_limit: null }, 999, 999), null);
});
