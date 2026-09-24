/**
 * The customer's payment/resume link:
 *
 *   /begin/personalized-book/payment#p_<token>
 *
 * The token lives ONLY in the URL fragment — browsers never send a fragment
 * to a server, so it never reaches Vercel/Railway request logs or a Referer
 * header. The payment page reads it once, removes it from the address bar
 * straight away (history.replaceState) and exchanges it for an HttpOnly
 * session cookie. It is never put in a path or query, never written to
 * localStorage/sessionStorage, and never logged.
 */

export const PAYMENT_PATH = "/begin/personalized-book/payment";
export const PAYMENT_FRAGMENT_PREFIX = "p_";

/** Exactly the shape talimoon-intake issues (`src/capability/token.ts`:
 *  base64url of 32 random bytes, unpadded ⇒ 43 chars). Anything else is
 *  rejected locally, without a network round-trip. */
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

/** Relative link (same origin) for the in-app "Pay now" navigation. */
export function paymentPath(token: string): string {
  return `${PAYMENT_PATH}#${PAYMENT_FRAGMENT_PREFIX}${token}`;
}

/** Absolute link for the customer to keep ("save this link"). */
export function paymentUrl(origin: string, token: string): string {
  return `${origin.replace(/\/+$/, "")}${paymentPath(token)}`;
}

export type FragmentRead =
  | { kind: "none" }
  | { kind: "malformed" }
  | { kind: "token"; token: string };

/**
 * Read the `#p_<token>` fragment and REMOVE it from the address bar in the
 * same call, so the raw token is never left in the URL (history, a copied
 * address, a screenshot) whatever happens next. The caller keeps the token
 * in memory only for the one exchange.
 */
export function takePaymentFragment(win: Window = window): FragmentRead {
  const hash = win.location.hash;
  if (!hash || hash === "#") return { kind: "none" };
  const { pathname, search } = win.location;
  win.history.replaceState(win.history.state, "", `${pathname}${search}`);
  const raw = hash.slice(1);
  if (!raw.startsWith(PAYMENT_FRAGMENT_PREFIX)) return { kind: "malformed" };
  const token = raw.slice(PAYMENT_FRAGMENT_PREFIX.length);
  return TOKEN_RE.test(token) ? { kind: "token", token } : { kind: "malformed" };
}
