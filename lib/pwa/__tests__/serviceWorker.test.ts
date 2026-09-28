// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildServiceWorker, NAV_TIMEOUT_MS, STATIC_CACHE } from "../swSource";

/**
 * Runs the GENERATED worker source (exactly what /sw.js serves) inside a
 * simulated ServiceWorkerGlobalScope: fake Cache Storage, fake fetch, fake
 * clients. Each test boots a fresh worker.
 */

const ORIGIN = "https://www.talimoon.com";

type Handler = (e: unknown) => void;

class FakeCache {
  entries = new Map<string, Response>();
  async put(req: { url: string } | string, res: Response) {
    this.entries.set(typeof req === "string" ? new URL(req, ORIGIN).href : req.url, res);
  }
  async match(req: { url: string } | string) {
    const hit = this.entries.get(typeof req === "string" ? new URL(req, ORIGIN).href : req.url);
    return hit ? hit.clone() : undefined;
  }
  async keys() {
    return [...this.entries.keys()].map((url) => ({ url }));
  }
  async delete(req: { url: string }) {
    return this.entries.delete(req.url);
  }
  async addAll(urls: string[]) {
    for (const u of urls) this.entries.set(new URL(u, ORIGIN).href, basic(`precached ${u}`));
  }
}

class FakeCacheStorage {
  stores = new Map<string, FakeCache>();
  async open(name: string) {
    if (!this.stores.has(name)) this.stores.set(name, new FakeCache());
    return this.stores.get(name)!;
  }
  async keys() {
    return [...this.stores.keys()];
  }
  async delete(name: string) {
    return this.stores.delete(name);
  }
  async match(req: { url: string } | string, opts?: { cacheName?: string }) {
    const names = opts?.cacheName ? [opts.cacheName] : [...this.stores.keys()];
    for (const n of names) {
      const hit = await this.stores.get(n)?.match(req);
      if (hit) return hit;
    }
    return undefined;
  }
}

/** a same-origin network response ("basic", like a real fetch) */
function basic(body: string, status = 200): Response {
  const r = new Response(body, { status });
  Object.defineProperty(r, "type", { value: "basic" });
  return r;
}

function req(path: string, opts: { method?: string; mode?: string; destination?: string; headers?: Record<string, string> } = {}) {
  return {
    url: new URL(path, ORIGIN).href,
    method: opts.method ?? "GET",
    mode: opts.mode ?? "cors",
    destination: opts.destination ?? "",
    headers: new Headers(opts.headers ?? {}),
  };
}

function boot(version = "build-b") {
  const handlers: Record<string, Handler[]> = {};
  const caches = new FakeCacheStorage();
  const fetchMock = vi.fn<(r: unknown) => Promise<Response>>();
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, fn: Handler) => (handlers[type] ??= []).push(fn),
    skipWaiting: vi.fn(async () => {}),
    clients: { claim: vi.fn(async () => {}) },
    registration: { navigationPreload: { enable: vi.fn(async () => {}) } },
  };
  const indexedDB = new Proxy({}, { get: () => { throw new Error("the worker must never touch IndexedDB"); } });
  new Function("self", "caches", "fetch", "indexedDB", buildServiceWorker(version))(self, caches, fetchMock, indexedDB);

  async function fire(type: string, extra: Record<string, unknown> = {}) {
    const waits: Promise<unknown>[] = [];
    let responded: Promise<Response> | undefined;
    const event = {
      waitUntil: (p: Promise<unknown>) => waits.push(p),
      respondWith: (p: Promise<Response>) => {
        responded = p;
      },
      ...extra,
    };
    for (const h of handlers[type] ?? []) h(event);
    await Promise.all(waits);
    return { responded };
  }
  const fetchEvent = (r: ReturnType<typeof req>, extra: Record<string, unknown> = {}) =>
    fire("fetch", { request: r, preloadResponse: Promise.resolve(undefined), ...extra });
  return { self, caches, fetchMock, fire, fetchEvent };
}

beforeEach(() => vi.useRealTimers());
afterEach(() => vi.useRealTimers());

describe("install", () => {
  it("precaches only the offline page + icons — never an HTML app shell", async () => {
    const w = boot();
    await w.fire("install");
    const offline = w.caches.stores.get("tm-offline-build-b")!;
    const urls = [...offline.entries.keys()].map((u) => new URL(u).pathname);
    expect(urls).toEqual(["/offline.html", "/pwa/app-icon-v5-192.png", "/pwa/prompt-logo-v4.png"]);
    expect(urls).not.toContain("/");
    expect(urls).not.toContain("/story-library");
    expect(w.self.skipWaiting).toHaveBeenCalled();
  });
});

describe("activate", () => {
  it("deletes every old cache (incl. the old talimoon-app-v6 shell), keeps the hashed-asset cache, claims", async () => {
    const w = boot("build-b");
    await (await w.caches.open("talimoon-app-v6")).put(ORIGIN + "/", basic("<html>old shell</html>"));
    await w.caches.open("tm-runtime-build-a");
    await w.caches.open("tm-offline-build-a");
    await (await w.caches.open(STATIC_CACHE)).put(ORIGIN + "/_next/static/chunks/a.js", basic("js"));
    await w.fire("install");
    await w.fire("activate");
    expect((await w.caches.keys()).sort()).toEqual([STATIC_CACHE, "tm-offline-build-b"].sort());
    expect(await w.caches.match(ORIGIN + "/_next/static/chunks/a.js")).toBeDefined();
    expect(w.self.clients.claim).toHaveBeenCalled();
    expect(w.self.registration.navigationPreload.enable).toHaveBeenCalled();
  });

  it("takes control only AFTER the old caches are gone (no window with old + new together)", async () => {
    const w = boot("build-b");
    await w.caches.open("talimoon-app-v6");
    const order: string[] = [];
    const del = w.caches.delete.bind(w.caches);
    w.caches.delete = async (n: string) => {
      order.push(`delete:${n}`);
      return del(n);
    };
    w.self.clients.claim.mockImplementation(async () => {
      order.push("claim");
    });
    await w.fire("install");
    await w.fire("activate");
    expect(order).toEqual(["delete:talimoon-app-v6", "claim"]);
  });

  it("the worker source never references IndexedDB", () => {
    expect(buildServiceWorker("x")).not.toMatch(/indexedDB/i);
  });
});

describe("navigations (HTML)", () => {
  it("always come from the network and are never stored", async () => {
    const w = boot();
    await w.fire("install");
    w.fetchMock.mockResolvedValue(basic("<html>fresh</html>"));
    const { responded } = await w.fetchEvent(req("/begin/personalized-book/form", { mode: "navigate", destination: "document" }));
    expect(await (await responded!).text()).toBe("<html>fresh</html>");
    for (const [, c] of w.caches.stores) {
      for (const url of c.entries.keys()) expect(url).not.toContain("/begin");
    }
  });

  it("use the navigation preload response when there is one", async () => {
    const w = boot();
    const { responded } = await w.fetchEvent(req("/", { mode: "navigate" }), {
      preloadResponse: Promise.resolve(basic("<html>preloaded</html>")),
    });
    expect(await (await responded!).text()).toBe("<html>preloaded</html>");
    expect(w.fetchMock).not.toHaveBeenCalled();
  });

  it("network failure → the offline page, NEVER a cached old app shell", async () => {
    const w = boot();
    await w.fire("install");
    // even if some cache still held an old "/" document
    await (await w.caches.open(STATIC_CACHE)).put(ORIGIN + "/", basic("<html>OLD BUILD</html>"));
    w.fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const { responded } = await w.fetchEvent(req("/story-library", { mode: "navigate" }));
    expect(await (await responded!).text()).toBe("precached /offline.html");
  });

  it("a hung navigation gives up after 15s with the offline page (no endless blank screen)", async () => {
    vi.useFakeTimers();
    const w = boot();
    await w.fire("install");
    w.fetchMock.mockReturnValue(new Promise(() => {}));
    const { responded } = await w.fetchEvent(req("/", { mode: "navigate" }));
    await vi.advanceTimersByTimeAsync(NAV_TIMEOUT_MS);
    expect(await (await responded!).text()).toBe("precached /offline.html");
  });
});

describe("never intercepted / never cached", () => {
  const cases: Array<[string, ReturnType<typeof req>]> = [
    ["POST to our origin", req("/api/whatever", { method: "POST" })],
    ["PUT", req("/anything", { method: "PUT" })],
    ["order API (cross-origin)", req("https://api.talimoon.com/v1/orders", { method: "POST" })],
    ["payment API GET (cross-origin)", req("https://api.talimoon.com/v1/payment")],
    ["payment-code session", req("https://api.talimoon.com/v1/payment/code/session", { method: "POST" })],
    ["receipt upload", req("https://api.talimoon.com/v1/payment/receipt?receiptKey=x", { method: "POST" })],
    ["same-origin API GET", req("/api/parent-feedback/views")],
    ["RSC flight request", req("/story-library", { headers: { RSC: "1" } })],
    ["RSC via _rsc param", req("/story-library?_rsc=abc")],
    ["router prefetch", req("/about", { headers: { "Next-Router-Prefetch": "1" } })],
    ["order-journey sub-resource", req("/begin/personalized-book/payment/data.json")],
    ["/pay sub-resource", req("/pay/x")],
    ["private memory audio", req("/m/tok123/audio")],
    ["media range request", req("/video/intro.mp4", { headers: { range: "bytes=0-" } })],
    ["the worker script itself", req("/sw.js")],
    ["Turnstile", req("https://challenges.cloudflare.com/turnstile/v0/api.js", { destination: "script" })],
  ];
  for (const [name, r] of cases) {
    it(name, async () => {
      const w = boot();
      const { responded } = await w.fetchEvent(r);
      expect(responded).toBeUndefined(); // the browser talks to the network directly
    });
  }
});

describe("Next.js static assets", () => {
  it("content-hashed /_next/static: cache-first (second load needs no network)", async () => {
    const w = boot();
    w.fetchMock.mockResolvedValueOnce(basic("chunk-body"));
    const r = req("/_next/static/chunks/abc123.js", { destination: "script" });
    expect(await (await (await w.fetchEvent(r)).responded!).text()).toBe("chunk-body");
    await new Promise((res) => setTimeout(res, 0));
    expect(await (await (await w.fetchEvent(r)).responded!).text()).toBe("chunk-body");
    expect(w.fetchMock).toHaveBeenCalledTimes(1);
  });

  it("a missing chunk (404) is never cached", async () => {
    const w = boot();
    w.fetchMock.mockResolvedValue(basic("nope", 404));
    const r = req("/_next/static/chunks/gone.js", { destination: "script" });
    await (await w.fetchEvent(r)).responded;
    await new Promise((res) => setTimeout(res, 0));
    expect(await w.caches.match(r)).toBeUndefined();
  });
});

describe("images", () => {
  it("stale-while-revalidate in the per-deploy runtime cache", async () => {
    const w = boot("build-b");
    w.fetchMock.mockResolvedValueOnce(basic("img-v1"));
    const r = req("/images/hero.jpg", { destination: "image" });
    expect(await (await (await w.fetchEvent(r)).responded!).text()).toBe("img-v1");
    await new Promise((res) => setTimeout(res, 0));
    expect(await w.caches.match(r, { cacheName: "tm-runtime-build-b" })).toBeDefined();
    w.fetchMock.mockResolvedValueOnce(basic("img-v2"));
    // served from cache immediately, refreshed in the background
    expect(await (await (await w.fetchEvent(r)).responded!).text()).toBe("img-v1");
    await new Promise((res) => setTimeout(res, 0));
    expect(await (await w.caches.match(r))!.text()).toBe("img-v2");
  });

  it("the runtime image cache is dropped on the next deploy", async () => {
    const a = boot("build-a");
    await a.caches.open("tm-runtime-build-a");
    const b = boot("build-b");
    b.caches.stores = a.caches.stores; // same origin storage
    await b.fire("install");
    await b.fire("activate");
    expect(await b.caches.keys()).not.toContain("tm-runtime-build-a");
  });
});

describe("version handshake", () => {
  it("answers GET_VERSION on the given port (no broadcast, no loops)", async () => {
    const w = boot("build-xyz");
    const port = { postMessage: vi.fn() };
    await w.fire("message", { data: { type: "GET_VERSION" }, ports: [port] });
    expect(port.postMessage).toHaveBeenCalledWith({ type: "VERSION", version: "build-xyz" });
  });
});
