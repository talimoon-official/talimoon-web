/**
 * TALIMOON service worker — the source, generated per build.
 *
 * Served at `/sw.js` by app/sw.js/route.ts with this build's version baked
 * in, so EVERY deployment produces different SW bytes: the browser installs
 * the new worker on its next update check, and the per-deploy caches of the
 * old one are deleted on activation. (The old worker was a static file whose
 * cache name never changed, so nothing was ever cleaned up.)
 *
 * Strategy by resource:
 *
 *   HTML navigations   network only (+ navigation preload). Never cached.
 *                      Network error / no response in 15s → the offline
 *                      page (a self-contained file, never an old app shell).
 *   /_next/static/*    cache-first in "tm-static-v1". Content-hashed and
 *                      immutable, so a cached file is never stale; the cache
 *                      survives deploys ON PURPOSE so a page still running
 *                      the previous build can load its own lazy chunks.
 *                      Capped (oldest trimmed).
 *   same-origin images stale-while-revalidate in a PER-DEPLOY cache
 *                      ("tm-runtime-<version>"), capped; dropped on the next
 *                      deploy, so replaced images cannot linger.
 *   everything else    not intercepted: RSC/flight requests, prefetches,
 *                      /api/*, every sub-resource of the order + payment
 *                      journey (/begin, /pay), /m, /publish, the manifest,
 *                      media ranges, and every non-GET or cross-origin
 *                      request (the order / payment API at
 *                      api.talimoon.com, Turnstile, Maps). Navigations to
 *                      those pages get only the offline fallback — their
 *                      HTML is never stored.
 *
 * Lifecycle: skipWaiting + clients.claim. Safe here because this worker
 * never serves cached HTML and keeps the content-hashed chunk cache across
 * versions — swapping workers cannot put old and new code together. The
 * PAGE decides when to reload into the new build (lib/pwa/lifecycle.ts:
 * at a safe moment, once, after flushing the order draft).
 *
 * The worker touches Cache Storage only. It never opens, clears or deletes
 * IndexedDB (the order draft lives there).
 */

export const STATIC_CACHE = "tm-static-v1";
export const OFFLINE_URL = "/offline.html";
export const NAV_TIMEOUT_MS = 15_000;
export const STATIC_MAX = 400;
export const RUNTIME_MAX = 120;

/** Paths whose responses are never intercepted or cached (prefix match). */
export const NEVER_INTERCEPT = [
  "/api/",
  "/begin",
  "/pay",
  "/m/",
  "/publish/",
  "/sw.js",
  "/manifest.webmanifest",
];

export function buildServiceWorker(version: string): string {
  const v = JSON.stringify(version);
  return `/* TALIMOON service worker — build ${version.replace(/[^\w.-]/g, "")} */
"use strict";
const VERSION = ${v};
const STATIC_CACHE = ${JSON.stringify(STATIC_CACHE)};
const RUNTIME_CACHE = "tm-runtime-" + VERSION;
const OFFLINE_CACHE = "tm-offline-" + VERSION;
const KEEP = [STATIC_CACHE, RUNTIME_CACHE, OFFLINE_CACHE];
const OFFLINE_URL = ${JSON.stringify(OFFLINE_URL)};
const PRECACHE = [OFFLINE_URL, "/pwa/app-icon-v5-192.png", "/pwa/prompt-logo-v4.png"];
const NAV_TIMEOUT_MS = ${NAV_TIMEOUT_MS};
const STATIC_MAX = ${STATIC_MAX};
const RUNTIME_MAX = ${RUNTIME_MAX};
const NEVER_INTERCEPT = ${JSON.stringify(NEVER_INTERCEPT)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // every cache that is not this version's (incl. the old "talimoon-app-*")
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k)));
      await trim(STATIC_CACHE, STATIC_MAX);
      if (self.registration.navigationPreload) {
        try { await self.registration.navigationPreload.enable(); } catch (e) {}
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "GET_VERSION" && event.ports && event.ports[0]) {
    event.ports[0].postMessage({ type: "VERSION", version: VERSION });
  }
});

async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

let puts = 0;
async function store(name, request, response, max) {
  try {
    const cache = await caches.open(name);
    await cache.put(request, response);
    if (++puts % 25 === 0) await trim(name, max);
  } catch (e) {
    /* quota / opaque — serving the network response is what matters */
  }
}

function timeout(ms) {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}

async function navigate(event) {
  try {
    const live = (async () => (event.preloadResponse && (await event.preloadResponse)) || fetch(event.request))();
    const res = await Promise.race([live, timeout(NAV_TIMEOUT_MS)]);
    if (res) return res;
  } catch (e) {
    /* network error — fall through */
  }
  const offline = await caches.match(OFFLINE_URL, { cacheName: OFFLINE_CACHE });
  return offline || Response.error();
}

async function cacheFirst(request) {
  const hit = await caches.match(request, { cacheName: STATIC_CACHE });
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && res.status === 200 && res.type === "basic") store(STATIC_CACHE, request, res.clone(), STATIC_MAX);
  return res;
}

async function staleWhileRevalidate(event) {
  const request = event.request;
  const hit = await caches.match(request, { cacheName: RUNTIME_CACHE });
  const refresh = fetch(request).then((res) => {
    if (res.ok && res.status === 200 && res.type === "basic") store(RUNTIME_CACHE, request, res.clone(), RUNTIME_MAX);
    return res;
  });
  if (hit) {
    event.waitUntil(refresh.catch(() => undefined));
    return hit;
  }
  return refresh;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.headers.has("range")) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Next.js flight data / prefetches: always the live server, never cached
  if (request.headers.get("RSC") === "1" || request.headers.has("Next-Router-Prefetch") || url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") {
    event.respondWith(navigate(event));
    return;
  }
  if (NEVER_INTERCEPT.some((p) => (p.endsWith("/") ? url.pathname.startsWith(p) : url.pathname === p || url.pathname.startsWith(p + "/")))) return;
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (request.destination === "image") {
    event.respondWith(staleWhileRevalidate(event));
  }
});
`;
}
