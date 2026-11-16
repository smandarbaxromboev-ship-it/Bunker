const CACHE_NAME = 'bunker-pwa-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/socket.io/')) return;
  if (event.request.url.includes('/Bunker7.apk')) return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
