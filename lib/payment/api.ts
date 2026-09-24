/**
 * talimoon-intake PAYMENT-stage client — mirrors src/http/routes/payment.ts:
 *
 *   POST /v1/payment/session    exchange the #fragment resume token (in the
 *                               JSON body) for an HttpOnly session cookie
 *   GET  /v1/payment            this session's order payment view
 *   POST /v1/payment/attempts   start (or resume) the payment attempt
 *   POST /v1/payment/receipt    upload the receipt for the OPEN attempt
 *
 * Every call is `credentials: "include"` so the Secure + HttpOnly session
 * cookie (`__Host-tal_pay`) travels; JavaScript never sees it. Writes carry
 * `x-talimoon-payment: 1`, the backend's anti-CSRF header (forces a CORS
 * preflight against its origin allowlist).
 *
 * No route takes an order code, attempt id, amount or currency from here:
 * the session names its one order server-side and the amount always comes
 * from the order's immutable price snapshot. Nothing this module sends or
 * receives is customer PII, and the resume token is never logged.
 */

import { apiUrl, throwApiError } from "@/lib/order/api";
import type { LifecycleStatus } from "./status";

export const PAYMENT_CSRF_HEADER = "x-talimoon-payment";

export interface PaymentView {
  orderCode: string;
  lifecycleStatus: LifecycleStatus;
  orderSaved: boolean;
  paymentConfirmed: boolean;
  productionStarted: boolean;
  acceptsPayment: boolean;
  /** server-authoritative amount due (immutable price snapshot) */
  amount: number | null;
  currency: "UZS" | "USD" | null;
  book: { bookType: "single" | "multi" | null; copies: number | null; childCount: number | null } | null;
  paymentMethods: readonly string[];
  attempt: {
    attemptNo: number;
    status: string;
    receiptSubmitted: boolean;
    submittedAt: string | null;
  } | null;
  sessionExpiresAt?: string;
}

const WRITE_HEADERS = { [PAYMENT_CSRF_HEADER]: "1" } as const;

async function parse(res: Response): Promise<PaymentView> {
  if (!res.ok) return throwApiError(res);
  return (await res.json()) as PaymentView;
}

/** Exchange the resume token for a payment session (sets the cookie). */
export async function exchangePaymentSession(resumeToken: string): Promise<PaymentView> {
  const res = await fetch(apiUrl("/v1/payment/session"), {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "content-type": "application/json", ...WRITE_HEADERS },
    body: JSON.stringify({ resumeToken }),
  });
  return parse(res);
}

/** The current session's payment view (cookie only — nothing in the URL). */
export async function getPaymentView(): Promise<PaymentView> {
  const res = await fetch(apiUrl("/v1/payment"), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  return parse(res);
}

/** Start — or, with the same key, resume — the order's payment attempt. */
export async function openPaymentAttempt(idempotencyKey: string): Promise<PaymentView> {
  const res = await fetch(apiUrl("/v1/payment/attempts"), {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "content-type": "application/json", ...WRITE_HEADERS },
    body: JSON.stringify({ idempotencyKey }),
  });
  return parse(res);
}

/**
 * Upload the receipt. The backend binds it to THIS session's order and its
 * open attempt (and that attempt's snapshot amount); `receiptKey` makes a
 * retry of the same file a replay instead of a second receipt.
 */
export async function uploadPaymentReceipt(receiptKey: string, file: File): Promise<PaymentView> {
  const form = new FormData();
  form.append("file", file);
  const qs = new URLSearchParams({ receiptKey });
  const res = await fetch(apiUrl(`/v1/payment/receipt?${qs.toString()}`), {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { ...WRITE_HEADERS },
    body: form,
  });
  return parse(res);
}
