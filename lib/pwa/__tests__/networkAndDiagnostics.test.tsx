import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { API_TIMEOUT_MS, RequestTimeoutError, UPLOAD_TIMEOUT_MS, fetchWithTimeout } from "@/lib/net/fetchWithTimeout";
import { diagnosticsSnapshot, recordDiag, resetDiagnosticsForTests } from "../diagnostics";
import { resetLifecycleForTests } from "../lifecycle";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

beforeEach(() => {
  resetDiagnosticsForTests();
  resetLifecycleForTests();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** a fetch that never answers until aborted */
function hangingFetch() {
  return vi.fn((_url: string, init?: RequestInit) =>
    new Promise<Response>((_res, rej) => {
      init?.signal?.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError")));
    }),
  );
}

describe("fetchWithTimeout — nothing spins forever", () => {
  it("a stalled request fails after the deadline with a timeout error", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", hangingFetch());
    const p = fetchWithTimeout("https://api.talimoon.com/v1/orders", { method: "POST" }, { label: "order.create" });
    const assertion = expect(p).rejects.toBeInstanceOf(RequestTimeoutError);
    await vi.advanceTimersByTimeAsync(API_TIMEOUT_MS);
    await assertion;
  });

  it("records only the label + category — never the URL, order code or body", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", hangingFetch());
    const p = fetchWithTimeout(
      "https://api.talimoon.com/v1/orders/TAL-2026-0142/files?kind=child_photo",
      { method: "POST", body: "secret" },
      { label: "order.upload", timeoutMs: 1000 },
    );
    p.catch(() => {});
    await vi.advanceTimersByTimeAsync(1000);
    const text = JSON.stringify(diagnosticsSnapshot().events);
    expect(text).toContain("timeout:order.upload");
    expect(text).not.toContain("TAL-2026");
    expect(text).not.toContain("secret");
    expect(text).not.toContain("api.talimoon.com");
  });

  it("a fast response is untouched", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("ok")));
    expect(await (await fetchWithTimeout("/x")).text()).toBe("ok");
  });

  it("every order + payment API call goes through the timeout (uploads get the long one)", () => {
    const order = readFileSync(resolve(__dirname, "../../order/api.ts"), "utf8");
    const pay = readFileSync(resolve(__dirname, "../../payment/api.ts"), "utf8");
    for (const src of [order, pay]) expect(src).not.toMatch(/await fetch\(/);
    expect(order).toMatch(/label: "order.upload", timeoutMs: UPLOAD_TIMEOUT_MS/);
    expect(pay).toMatch(/label: "payment.receipt", timeoutMs: UPLOAD_TIMEOUT_MS/);
    expect(UPLOAD_TIMEOUT_MS).toBeGreaterThan(API_TIMEOUT_MS);
  });
});

describe("diagnostics — safe by construction", () => {
  it("keeps only safe label characters and the pathname (never query / fragment)", () => {
    window.history.replaceState(null, "", "/begin/personalized-book/payment?x=1#p_SECRETTOKEN");
    recordDiag("runtime_error", "TypeError: Sherzod +998901234567 https://x.y/?a=b");
    const e = diagnosticsSnapshot().events.at(-1)!;
    expect(e.path).toBe("/begin/personalized-book/payment");
    expect(JSON.stringify(e)).not.toMatch(/SECRETTOKEN|\?x=1|\+998| /);
    window.history.replaceState(null, "", "/");
  });

  it("is capped and reports build / worker / standalone", () => {
    for (let i = 0; i < 100; i++) recordDiag("boot");
    const snap = diagnosticsSnapshot();
    expect(snap.events.length).toBeLessThanOrEqual(40);
    expect(snap).toHaveProperty("build");
    expect(snap).toHaveProperty("serviceWorker");
    expect(snap).toHaveProperty("standalone");
  });
});

describe("one registration", () => {
  it("the install prompt no longer registers the worker; PwaLifecycle does, once", async () => {
    const register = vi.fn(() => Promise.resolve({ update: () => Promise.resolve() }));
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { controller: null, addEventListener: vi.fn(), register },
    });
    const { PwaLifecycle } = await import("@/components/pwa/PwaLifecycle");
    const { PwaInstallPrompt } = await import("@/components/pwa/PwaInstallPrompt");
    const { LanguageProvider } = await import("@/lib/i18n/LanguageContext");
    const a = render(
      <LanguageProvider>
        <PwaInstallPrompt />
        <PwaLifecycle />
      </LanguageProvider>,
    );
    a.unmount();
    render(
      <LanguageProvider>
        <PwaInstallPrompt />
        <PwaLifecycle />
      </LanguageProvider>,
    );
    expect(register).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/", updateViaCache: "none" });
    const prompt = readFileSync(resolve(__dirname, "../../../components/pwa/PwaInstallPrompt.tsx"), "utf8");
    expect(prompt).not.toMatch(/serviceWorker/);
  });

  it("/sw.js is generated with this build's version and no-cache headers", async () => {
    const { GET } = await import("@/app/sw.js/route");
    const res = GET();
    expect(res.headers.get("content-type")).toMatch(/javascript/);
    expect(res.headers.get("cache-control")).toMatch(/no-cache/);
    const body = await res.text();
    expect(body).toMatch(/const VERSION = "/);
    expect(body).not.toMatch(/talimoon-app-v6/);
  });
});
