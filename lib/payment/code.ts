/**
 * The customer PAYMENT CODE as typed on /pay (e.g. K7M4P2). Mirrors
 * talimoon-intake `src/payments/accessCode.ts`; the backend stays the
 * authority — this only makes typing forgiving:
 *
 *  - lowercase is shown uppercase, spaces and hyphens are dropped (typed or
 *    pasted), characters that can never be in a code are ignored, and the
 *    value is capped at 6 characters;
 *  - `0 O 1 I L 5 S` are not in the alphabet (they are too easy to confuse),
 *    so they are ignored rather than silently "corrected" into another code.
 *
 * The code is a credential: never written to storage, never put in a URL,
 * never logged or sent to analytics.
 */

export const PAYMENT_CODE_ALPHABET = "ABCDEFGHJKMNPQRTUVWXYZ2346789";
export const PAYMENT_CODE_LENGTH = 6;

/** What the input shows while the customer types or pastes. */
export function normalizePaymentCodeInput(raw: string): string {
  let out = "";
  for (const ch of raw.toUpperCase()) {
    if (PAYMENT_CODE_ALPHABET.includes(ch)) out += ch;
    if (out.length === PAYMENT_CODE_LENGTH) break;
  }
  return out;
}

export function isCompletePaymentCode(value: string): boolean {
  return value.length === PAYMENT_CODE_LENGTH && normalizePaymentCodeInput(value) === value;
}

/** "K7M4P2" -> "K7M 4P2" for display only (easier to read aloud / copy). */
export function formatPaymentCode(code: string): string {
  return code.length === PAYMENT_CODE_LENGTH ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
}
