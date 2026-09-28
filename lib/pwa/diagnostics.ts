/**
 * Minimal, privacy-safe client diagnostics for the installed PWA.
 *
 * Records WHAT kind of thing happened, never WHOSE data: event kind, a short
 * category/label chosen by our own code, the route pathname (no query, no
 * fragment — payment links carry their token in the fragment), the app build
 * and the service-worker version. Never error messages (they can embed
 * URLs / values), never form data, names, phones, notes, photos, audio,
 * payment codes, tokens or receipts.
 *
 * Kept in memory + mirrored to sessionStorage (last MAX events, this tab
 * only). Nothing is sent anywhere. Read it from the console:
 *
 *   __talimoonDiag()
 */

export type DiagKind =
  | "boot"
  | "sw_update_ready"
  | "sw_update_applied"
  | "stale_build_recovery"
  | "chunk_load_error"
  | "runtime_error"
  | "network_failure";

export interface DiagEvent {
  t: number;
  kind: DiagKind;
  /** our own short label, e.g. "timeout", "order.upload", "TypeError" */
  detail?: string;
  path: string;
}

/** The app build this bundle was compiled for (set in next.config). */
export const APP_BUILD = process.env.NEXT_PUBLIC_APP_BUILD ?? "dev";

const KEY = "tm-diag";
const MAX = 40;
let events: DiagEvent[] | null = null;
let swVersion: string | null = null;

function load(): DiagEvent[] {
  if (events) return events;
  try {
    const raw = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(KEY) : null;
    events = raw ? (JSON.parse(raw) as DiagEvent[]).slice(-MAX) : [];
  } catch {
    events = [];
  }
  return events;
}

/** Only a short, safe token of text survives: letters, digits and . _ : - */
function safeLabel(s: string | undefined): string | undefined {
  if (!s) return undefined;
  return s.replace(/[^A-Za-z0-9._:-]/g, "").slice(0, 48) || undefined;
}

export function recordDiag(kind: DiagKind, detail?: string): void {
  const list = load();
  list.push({
    t: Date.now(),
    kind,
    detail: safeLabel(detail),
    path: typeof location !== "undefined" ? location.pathname : "",
  });
  if (list.length > MAX) list.splice(0, list.length - MAX);
  try {
    sessionStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage blocked — memory only */
  }
}

export function setServiceWorkerVersion(v: string | null): void {
  swVersion = v;
}

export function diagnosticsSnapshot() {
  const standalone =
    typeof window !== "undefined" &&
    ((typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches) ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true);
  return {
    build: APP_BUILD,
    serviceWorker: swVersion,
    controlled: typeof navigator !== "undefined" && !!navigator.serviceWorker?.controller,
    standalone,
    online: typeof navigator !== "undefined" ? navigator.onLine : null,
    events: [...load()],
  };
}

/** Exposes `__talimoonDiag()` on window (idempotent). */
export function exposeDiagnostics(): void {
  if (typeof window === "undefined") return;
  (window as unknown as { __talimoonDiag?: () => unknown }).__talimoonDiag = diagnosticsSnapshot;
}

/** Test-only reset. */
export function resetDiagnosticsForTests(): void {
  events = [];
  swVersion = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
