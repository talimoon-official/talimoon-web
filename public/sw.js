const CACHE = 'talimoon-app-v6';
const SHELL = ['/', '/story-library', '/pwa/app-icon-v5-192.png', '/pwa/app-icon-v5-512.png', '/pwa/apple-touch-icon-v5.png', '/pwa/favicon-v4-32.png', '/pwa/prompt-logo-v4.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        // Never persist checkout/form HTML. A cached order form can keep an
        // obsolete security integration alive after a production release.
        .catch(() => caches.match(url.pathname).then(hit => hit || caches.match('/')))
    );
    return;
  }

  // Next.js content-hashed files are normally safe to cache. Network-first
  // here adds a second guard for clients that still reference an older chunk
  // from a previously loaded document.
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(hit => hit || fetch(request).then(response => {
      if (response.ok && ['image', 'font'].includes(request.destination)) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});
