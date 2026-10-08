// Run: node --test supabase/functions/purchase-with-credits/validate.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { parseCartItems, roundCents } from "./validate.ts";

const bad = (raw: unknown) => assert.ok("error" in parseCartItems(raw), JSON.stringify(raw));

test("rejects the credit-minting inputs", () => {
  bad([{ productId: "a", quantity: -10 }]);
  bad([{ productId: "a", quantity: 0 }]);
  bad([{ productId: "a", quantity: 1.5 }]);
  bad([{ productId: "a", quantity: "3" }]);
  bad([{ productId: "a", quantity: 11 }]);
  bad([{ productId: "a", quantity: 1 }, { productId: "b", quantity: -1 }]);
  bad([{ productId: "", quantity: 1 }]);
  bad([null]);
  bad([]);
  bad("nope");
});

test("accepts a normal cart", () => {
  const r = parseCartItems([{ productId: "a", quantity: 2 }, { productId: "b", quantity: 1, variantId: "v" }]);
  assert.deepEqual("items" in r && r.items.length, 2);
});

test("roundCents removes float drift", () => {
  assert.equal(roundCents(0.1 * 3), 0.3);
});
