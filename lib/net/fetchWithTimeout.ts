/**
 * `fetch` with a finite deadline.
 *
 * On mobile — and especially in an installed PWA resumed from the
 * background — a request can ride a dead connection and never settle. With a
 * bare `fetch`, the UI that awaits it (the order "sending" overlay, payment
 * loading, code lookup) spins forever and the app looks frozen. Every call to
 * our API now fails after `timeoutMs` with a `RequestTimeoutError`, which the
 * callers already treat like any network failure: a clear message and a
 * retry path (order submission retries are idempotent server-side).
 *
 * A timeout / network failure is recorded in the diagnostics ring by
 * `label` only — never the URL (it can carry an order code) or a body.
 */

import { recordDiag } from "@/lib/pwa/diagnostics";

export class RequestTimeoutError extends Error {
  constructor(label: string) {
    super(`request timed out: ${label}`);
    this.name = "RequestTimeoutError";
  }
}

/** JSON calls: create / finalize / session / status. */
export const API_TIMEOUT_MS = 30_000;
/** Multipart uploads (photos, voice, receipt) on slow mobile uplinks. */
export const UPLOAD_TIMEOUT_MS = 180_000;

export async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  { timeoutMs = API_TIMEOUT_MS, label = "api" }: { timeoutMs?: number; label?: string } = {},
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } catch (err) {
    if (ctrl.signal.aborted) {
      recordDiag("network_failure", `timeout:${label}`);
      throw new RequestTimeoutError(label);
    }
    recordDiag(
      "network_failure",
      `${typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "network"}:${label}`,
    );
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
