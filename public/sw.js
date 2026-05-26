// Atlas Ally SW v6 — force cache clear
const CACHE_VERSION = 'atlas-ally-v6';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
  self.clients.matchAll({ type: 'window' }).then(clients =>
    clients.forEach(c => c.navigate(c.url))
  );
});

self.addEventListener('fetch', e => {
  // Always fetch fresh from network — no caching
  e.respondWith(fetch(e.request.clone()).catch(() => caches.match(e.request)));
});
