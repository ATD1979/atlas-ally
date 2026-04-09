// Atlas Ally Service Worker v2 — Light UI (April 2026)
// Force clients to reload to pick up new styles
const VERSION = 'v2-light-ui';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
     .then(() => self.clients.matchAll())
     .then(clients => clients.forEach(c => c.navigate(c.url)))
  );
});

// No caching — always fetch fresh from network
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request));
});
