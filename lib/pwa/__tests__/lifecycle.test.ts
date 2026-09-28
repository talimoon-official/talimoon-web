import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CHUNK_RECOVERY_WINDOW_MS,
  applyPendingUpdate,
  beginBusy,
  checkForUpdate,
  hasPendingUpdate,
  isChunkLoadError,
  onControllerChange,
  onRouteChange,
  recoverFromChunkError,
  resetLifecycleForTests,
  safeReload,
  setRegistrationForTests,
  setReloadForTests,
  watchRuntimeErrors,
} from "../lifecycle";
import { APP_BUILD, diagnosticsSnapshot, resetDiagnosticsForTests } from "../diagnostics";
import {
  memoryStorage,
  readDraft,
  registerDraftFlusher,
  setDraftStorage,
  writeDraft,
  writeDraftMedia,
} from "@/lib/order/formDraft";

let reload: ReturnType<typeof vi.fn<() => void>>;

/** navigator.serviceWorker.controller that answers the version handshake */
function setController(version: string | null) {
  const controller = version
    ? {
        postMessage: (_msg: unknown, ports: MessagePort[]) => ports[0]!.postMessage({ type: "VERSION", version }),
      }
    : null;
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { controller, addEventListener: vi.fn(), register: vi.fn(() => new Promise(() => {})) },
  });
}

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
}

beforeEach(() => {
  resetLifecycleForTests();
  resetDiagnosticsForTests();
  sessionStorage.clear();
  reload = vi.fn<() => void>();
  setReloadForTests(reload);
  setVisibility("visible");
  setDraftStorage(memoryStorage());
});
afterEach(() => {
  setReloadForTests(null);
  setDraftStorage(null);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("controlled reload", () => {
  it("reloads at most once per key — a reloaded page does not reload again (no loop)", async () => {
    expect(await safeReload("sw_update_applied", "sw:v2")).toBe(true);
    expect(await safeReload("sw_update_applied", "sw:v2")).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
    // the page actually reloaded: module state is fresh, sessionStorage is not
    resetLifecycleForTests();
    expect(await safeReload("sw_update_applied", "sw:v2")).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("flushes every pending draft save BEFORE reloading", async () => {
    let written = false;
    registerDraftFlusher(
      () =>
        new Promise<void>((r) =>
          setTimeout(() => {
            written = true;
            r();
          }, 30),
        ),
    );
    reload.mockImplementation(() => expect(written).toBe(true));
    await safeReload("sw_update_applied", "sw:flush");
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("never deletes the order draft or its media", async () => {
    await writeDraft("personalized-book", { phase: "steps" });
    await writeDraftMedia("personalized-book", { photos: ["p"] });
    await safeReload("stale_build_recovery", "chunk:1");
    const r = await readDraft("personalized-book");
    expect(r?.payload).toEqual({ phase: "steps" });
    expect(r?.media).toEqual({ photos: ["p"] });
  });

  it("waits while an order / payment is being sent, then reloads once", async () => {
    const release = beginBusy();
    expect(await safeReload("sw_update_applied", "sw:busy")).toBe(false);
    expect(reload).not.toHaveBeenCalled();
    release();
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });
});

describe("service-worker update → new build", () => {
  it("first install (page was not controlled): nothing to reload", async () => {
    setController("v-new");
    await onControllerChange(false);
    expect(hasPendingUpdate()).toBe(false);
  });

  it("a worker for THIS build (fresh page, old worker swapped): no reload", async () => {
    setController(APP_BUILD);
    await onControllerChange(true);
    expect(hasPendingUpdate()).toBe(false);
    onRouteChange();
    expect(reload).not.toHaveBeenCalled();
  });

  it("old page + new worker: waits for a safe moment (next route change), reloads exactly once", async () => {
    setController("v-new");
    await onControllerChange(true);
    expect(hasPendingUpdate()).toBe(true);
    expect(reload).not.toHaveBeenCalled(); // not mid-screen
    onRouteChange();
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    onRouteChange();
    await applyPendingUpdate();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(diagnosticsSnapshot().events.map((e) => e.kind)).toEqual(
      expect.arrayContaining(["sw_update_ready", "sw_update_applied"]),
    );
  });

  it("if the app is in the background when the update lands, it reloads right away (user not looking)", async () => {
    setController("v-new");
    setVisibility("hidden");
    await onControllerChange(true);
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });

  it("update checks are throttled (foreground resumes do not hammer the server)", () => {
    const update = vi.fn(() => Promise.resolve());
    setRegistrationForTests({ update } as unknown as ServiceWorkerRegistration);
    checkForUpdate(true);
    checkForUpdate();
    checkForUpdate();
    expect(update).toHaveBeenCalledTimes(1);
  });
});

describe("stale-build / chunk-load recovery", () => {
  it("recognises the chunk-failure shapes of every engine", () => {
    for (const e of [
      { name: "ChunkLoadError", message: "Loading chunk 123 failed." },
      new Error("Loading CSS chunk app-layout failed"),
      new TypeError("Failed to fetch dynamically imported module: https://x/_next/a.js"),
      new TypeError("error loading dynamically imported module"),
      new TypeError("Importing a module script failed."),
    ]) {
      expect(isChunkLoadError(e)).toBe(true);
    }
    expect(isChunkLoadError(new TypeError("x is undefined"))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });

  it("recovers ONCE, then refuses inside the window (no reload loop), then allows again", async () => {
    const now = vi.spyOn(Date, "now");
    now.mockReturnValue(1_000_000);
    expect(await recoverFromChunkError({ name: "ChunkLoadError", message: "x" })).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
    resetLifecycleForTests(); // the page reloaded
    now.mockReturnValue(1_000_000 + 60_000);
    expect(await recoverFromChunkError({ name: "ChunkLoadError", message: "x" })).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
    resetLifecycleForTests();
    now.mockReturnValue(1_000_000 + CHUNK_RECOVERY_WINDOW_MS + 1);
    expect(await recoverFromChunkError({ name: "ChunkLoadError", message: "x" })).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("asks for the newest worker before reloading", async () => {
    const update = vi.fn(() => Promise.resolve());
    setRegistrationForTests({ update } as unknown as ServiceWorkerRegistration);
    await recoverFromChunkError(new Error("ChunkLoadError: Loading chunk 9 failed"));
    expect(update).toHaveBeenCalled();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("an ordinary runtime error is only recorded, never reloads", async () => {
    expect(await recoverFromChunkError(new TypeError("boom"))).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it("a failed Next.js <script> load (captured error event) triggers the recovery", async () => {
    watchRuntimeErrors();
    const s = document.createElement("script");
    s.src = "https://www.talimoon.com/_next/static/chunks/old-123.js";
    document.head.appendChild(s);
    s.dispatchEvent(new Event("error"));
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    s.remove();
  });

  it("an unhandled ChunkLoadError rejection triggers the recovery", async () => {
    watchRuntimeErrors();
    const reason = Object.assign(new Error("Loading chunk 77 failed."), { name: "ChunkLoadError" });
    const ev = new Event("unhandledrejection") as Event & { reason: unknown };
    Object.defineProperty(ev, "reason", { value: reason });
    window.dispatchEvent(ev);
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });
});
