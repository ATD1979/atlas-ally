// Service worker disabled — unregister self
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => {
  self.clients.matchAll().then(clients => clients.forEach(c => c.navigate(c.url)));
  return self.clients.claim();
});
// No fetch handler — pass everything through to network
