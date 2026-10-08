// No imports on purpose: runs under Deno (edge function) and Node (validate.test.ts).

export interface CartItem {
  productId: string;
  quantity: number;
  variantId?: string;
}

const MAX_LINES = 50;
const MAX_QTY_PER_LINE = 10; // same limit as the checkout function

// Returns the cleaned items, or an error message. Never trusts the request body:
// a negative quantity here used to turn a purchase into a balance top-up.
export function parseCartItems(raw: unknown): { items: CartItem[] } | { error: string } {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_LINES) {
    return { error: "items must be a non-empty list" };
  }
  const items: CartItem[] = [];
  for (const line of raw) {
    const { productId, quantity, variantId } = (line ?? {}) as Record<string, unknown>;
    if (typeof productId !== "string" || productId.length === 0) {
      return { error: "Invalid productId" };
    }
    if (!Number.isInteger(quantity) || (quantity as number) < 1 || (quantity as number) > MAX_QTY_PER_LINE) {
      return { error: `quantity must be a whole number from 1 to ${MAX_QTY_PER_LINE}` };
    }
    if (variantId !== undefined && variantId !== null && typeof variantId !== "string") {
      return { error: "Invalid variantId" };
    }
    items.push({ productId, quantity: quantity as number, variantId: (variantId as string | undefined) ?? undefined });
  }
  return { items };
}

// Credits are euros with cents; summing floats drifts (0.1 * 3), so round to cents.
export const roundCents = (n: number) => Math.round(n * 100) / 100;
