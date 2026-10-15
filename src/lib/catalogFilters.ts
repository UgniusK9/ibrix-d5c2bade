/**
 * The checkout test product (sku TEST-001, 0,01 €) must never be listed:
 * on 15 Oct it was the hero's featured product on the live site. It stays
 * reachable by its own link, because the go-live payment test buys it.
 * By sku, never by title: "Ferrari Testarossa" is a real set.
 */
export const TEST_SKU_PREFIX = 'TEST';
export const TEST_SKU_REST_FILTER = 'sku=not.ilike.TEST*';

export function isTestSku(sku?: string | null): boolean {
  return !!sku && sku.toUpperCase().startsWith(TEST_SKU_PREFIX);
}

export function withoutTestProducts<Q extends { not: (column: string, operator: string, value: string) => Q }>(query: Q): Q {
  return query.not('sku', 'ilike', `${TEST_SKU_PREFIX}%`);
}
