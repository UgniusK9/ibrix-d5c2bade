// Run with: node --test src/lib/catalogFilters.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isTestSku, withoutTestProducts, TEST_SKU_REST_FILTER } from './catalogFilters.ts';

test('only the TEST sku prefix counts as a test product', () => {
  assert.equal(isTestSku('TEST-001'), true);
  assert.equal(isTestSku('test-002'), true);
  assert.equal(isTestSku('27012S'), false); // Ferrari Testarossa
  assert.equal(isTestSku(null), false);
});

test('the query helper adds exactly one sku filter', () => {
  const calls: string[][] = [];
  const q = { not(c: string, o: string, v: string) { calls.push([c, o, v]); return q; } };
  assert.equal(withoutTestProducts(q), q);
  assert.deepEqual(calls, [['sku', 'ilike', 'TEST%']]);
});

test('the REST filter for the build scripts matches the same rule', () => {
  assert.equal(TEST_SKU_REST_FILTER, 'sku=not.ilike.TEST*');
});
