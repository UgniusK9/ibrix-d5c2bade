// No imports on purpose: runs under Deno (edge function) and Node (code.test.ts).

export const MAX_FAILURES = 5; // wrong codes allowed per user ...
export const WINDOW_MINUTES = 15; // ... within this many minutes

// Returns the code in the form it is stored (upper case, no stray spaces), or null
// when the input cannot possibly be a gift card code. Old codes were IBGC-XXXX-XXXX,
// new ones IBGC-XXXX-XXXX-XXXX; both match.
export function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return /^IBGC(-[A-Z0-9]{4}){2,3}$/.test(code) ? code : null;
}

export const isThrottled = (recentFailures: number) => recentFailures >= MAX_FAILURES;
