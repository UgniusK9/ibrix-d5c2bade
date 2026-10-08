import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCode, isThrottled } from "./code.ts";

test("normalizes case and whitespace, accepts old and new formats", () => {
  assert.equal(normalizeCode("  ibgc-ab12-cd34 "), "IBGC-AB12-CD34");
  assert.equal(normalizeCode("IBGC-AB12-CD34-EF56"), "IBGC-AB12-CD34-EF56");
});

test("rejects junk", () => {
  for (const bad of [undefined, null, 5, "", "IBGC", "IBGC-AB12", "IBGC-AB12-CD3", "XXXX-AB12-CD34", "IBGC-AB12-CD34'; --", "IBGC-AB12-CD34-EF56-GH78"]) {
    assert.equal(normalizeCode(bad), null, String(bad));
  }
});

test("throttle kicks in at the limit", () => {
  assert.equal(isThrottled(4), false);
  assert.equal(isThrottled(5), true);
});
