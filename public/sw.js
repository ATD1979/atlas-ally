// Atlas Ally SW v3 — cache buster April 2026
const CACHE = 'atlas-ally-v3';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
  self.clients.matchAll().then(clients =>
    clients.forEach(c => c.navigate(c.url))
  );
});

// No fetch caching — always go to network
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request));
});
