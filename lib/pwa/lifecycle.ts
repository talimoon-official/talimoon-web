/**
 * The page side of TALIMOON's service-worker lifecycle + stale-build
 * recovery. The worker itself (lib/pwa/swSource.ts) swaps in immediately and
 * never serves cached HTML; THIS module decides when the page moves onto the
 * new build, and makes sure it happens safely:
 *
 *  - registers /sw.js once, and checks for an update on start and whenever
 *    the app comes back to the foreground (throttled) — an installed PWA can
 *    sit in the background for days, so "only on page load" is not enough;
 *  - when a NEW worker takes control and its version differs from the build
 *    this page runs, the page reloads into the new build — but only at a
 *    safe moment (the app goes to the background, or the next route change),
 *    never while an order / payment is being sent, and only ONCE per version
 *    (sessionStorage guard: no reload loops);
 *  - a chunk-load failure (the page is running an old build whose lazy
 *    chunks the server no longer has) triggers ONE recovery reload per 10
 *    minutes; if it happens again the error screen offers a manual reload
 *    instead of looping;
 *  - before ANY of these reloads, every pending order-draft save is flushed
 *    to IndexedDB and awaited. Nothing here clears Cache Storage wholesale,
 *    and nothing here touches the IndexedDB draft except to save it.
 */

import { useEffect } from "react";
import { flushDraftWrites } from "@/lib/order/formDraft";
import { APP_BUILD, recordDiag, setServiceWorkerVersion } from "./diagnostics";

export const UPDATE_CHECK_MIN_INTERVAL_MS = 10 * 60 * 1000;
export const CHUNK_RECOVERY_WINDOW_MS = 10 * 60 * 1000;
const RELOAD_KEY_PREFIX = "tm-reloaded:";
const CHUNK_KEY = "tm-chunk-recovery";

// ── busy guard (no reload while sending) ─────────────────────────────────────

let busy = 0;
let afterBusy: (() => void) | null = null;

export function beginBusy(): () => void {
  busy++;
  let done = false;
  return () => {
    if (done) return;
    done = true;
    busy = Math.max(0, busy - 1);
    if (busy === 0 && afterBusy) {
      const run = afterBusy;
      afterBusy = null;
      run();
    }
  };
}

export function isBusy(): boolean {
  return busy > 0;
}

// ── the one controlled reload ────────────────────────────────────────────────

function sessionGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function sessionSet(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* blocked: the in-memory guard below still prevents a loop this page */
  }
}

let reloading = false;
/** Injectable for tests. */
export let reloadPage: () => void = () => window.location.reload();
export function setReloadForTests(fn: (() => void) | null) {
  reloadPage = fn ?? (() => window.location.reload());
}

/**
 * Reloads the page at most once per `onceKey` (per tab session), after
 * flushing the order draft. Waits while an order/payment is being sent.
 * Returns false when the guard refused (already reloaded for this key).
 */
export async function safeReload(reason: "sw_update_applied" | "stale_build_recovery", onceKey: string): Promise<boolean> {
  if (reloading) return false;
  const key = RELOAD_KEY_PREFIX + onceKey;
  if (sessionGet(key)) return false;
  if (isBusy()) {
    afterBusy = () => void safeReload(reason, onceKey);
    return false;
  }
  reloading = true;
  sessionSet(key, String(Date.now()));
  recordDiag(reason, onceKey);
  await flushDraftWrites();
  reloadPage();
  return true;
}

// ── service worker ───────────────────────────────────────────────────────────

let registration: ServiceWorkerRegistration | null = null;
let pendingVersion: string | null = null;
let lastCheck = 0;
let started = false;

function askVersion(worker: ServiceWorker | null, timeoutMs = 2000): Promise<string | null> {
  if (!worker) return Promise.resolve(null);
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(null), timeoutMs);
    channel.port1.onmessage = (e) => {
      clearTimeout(timer);
      resolve(typeof e.data?.version === "string" ? e.data.version : null);
    };
    try {
      worker.postMessage({ type: "GET_VERSION" }, [channel.port2]);
    } catch {
      clearTimeout(timer);
      resolve(null);
    }
  });
}

export function checkForUpdate(force = false): void {
  if (!registration) return;
  const now = Date.now();
  if (!force && now - lastCheck < UPDATE_CHECK_MIN_INTERVAL_MS) return;
  lastCheck = now;
  registration.update().catch(() => undefined);
}

/** A new worker took control: move to its build at the next safe moment. */
export async function onControllerChange(hadController: boolean): Promise<void> {
  const version = await askVersion(navigator.serviceWorker.controller);
  setServiceWorkerVersion(version);
  // first install (nothing controlled this page before): nothing to update
  if (!hadController || !version || version === APP_BUILD) return;
  pendingVersion = version;
  recordDiag("sw_update_ready", version);
  if (document.visibilityState === "hidden") void applyPendingUpdate();
}

export function hasPendingUpdate(): boolean {
  return pendingVersion !== null;
}

export async function applyPendingUpdate(): Promise<boolean> {
  if (!pendingVersion) return false;
  return safeReload("sw_update_applied", `sw:${pendingVersion}`);
}

/** Call on every client-side route change. */
export function onRouteChange(): void {
  if (pendingVersion) void applyPendingUpdate();
}

export function startServiceWorker(): void {
  if (started || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  started = true;
  let hadController = !!navigator.serviceWorker.controller;
  void askVersion(navigator.serviceWorker.controller).then(setServiceWorkerVersion);
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    const had = hadController;
    hadController = true;
    void onControllerChange(had);
  });
  navigator.serviceWorker
    .register("/sw.js", { scope: "/", updateViaCache: "none" })
    .then((reg) => {
      registration = reg;
      checkForUpdate(true);
    })
    .catch(() => undefined);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkForUpdate();
    else if (pendingVersion) void applyPendingUpdate();
  });
}

// ── stale build / chunk-load recovery ────────────────────────────────────────

const CHUNK_PATTERNS = [
  /ChunkLoadError/i,
  /Loading (CSS )?chunk [\w-]+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
  /Failed to load chunk/i,
];

export function isChunkLoadError(err: unknown): boolean {
  if (!err) return false;
  const e = err as { name?: unknown; message?: unknown };
  const text = `${typeof e.name === "string" ? e.name : ""} ${typeof e.message === "string" ? e.message : typeof err === "string" ? err : ""}`;
  return CHUNK_PATTERNS.some((re) => re.test(text));
}

/**
 * If `err` is a chunk-load failure, reload ONCE (per 10 minutes) into the
 * current build, after fetching the newest worker and flushing the draft.
 * Returns true when a recovery reload is under way.
 */
export async function recoverFromChunkError(err: unknown): Promise<boolean> {
  if (!isChunkLoadError(err)) return false;
  recordDiag("chunk_load_error", (err as { name?: string })?.name ?? "chunk");
  const last = Number(sessionGet(CHUNK_KEY)) || 0;
  if (Date.now() - last < CHUNK_RECOVERY_WINDOW_MS) return false; // already tried: no loop
  sessionSet(CHUNK_KEY, String(Date.now()));
  if (registration) {
    await Promise.race([registration.update().catch(() => undefined), new Promise((r) => setTimeout(r, 3000))]);
  }
  return safeReload("stale_build_recovery", `chunk:${Date.now()}`);
}

let errorsWatched = false;
export function watchRuntimeErrors(): void {
  if (errorsWatched || typeof window === "undefined") return;
  errorsWatched = true;
  // A failed <script>/<link> for a Next.js chunk does not bubble: capture it.
  window.addEventListener(
    "error",
    (event) => {
      const target = event.target as (HTMLScriptElement & HTMLLinkElement) | null;
      const src = target && target !== (window as unknown) ? target.src || target.href || "" : "";
      if (src && src.includes("/_next/static/")) {
        void recoverFromChunkError({ name: "ChunkLoadError", message: "Failed to load chunk" });
        return;
      }
      const err = (event as ErrorEvent).error;
      if (isChunkLoadError(err)) void recoverFromChunkError(err);
      else if (err) recordDiag("runtime_error", (err as Error).name || "Error");
    },
    true,
  );
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    if (isChunkLoadError(reason)) void recoverFromChunkError(reason);
    else if (reason instanceof Error) recordDiag("runtime_error", reason.name);
  });
}

// ── React hook ───────────────────────────────────────────────────────────────


/** Blocks update reloads while `active` (e.g. an order is being sent). */
export function useUpdateBlocker(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    return beginBusy();
  }, [active]);
}

/** Test-only: inject a registration. */
export function setRegistrationForTests(reg: ServiceWorkerRegistration | null) {
  registration = reg;
}

/** Test-only reset of module state. */
export function resetLifecycleForTests(): void {
  busy = 0;
  afterBusy = null;
  reloading = false;
  registration = null;
  pendingVersion = null;
  lastCheck = 0;
  started = false;
  errorsWatched = false;
}
