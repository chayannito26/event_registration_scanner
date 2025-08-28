const CACHE_NAME = 'event-scanner-cache-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './html5-qrcode.min.js',
  './sample_data.json',
  // Add more assets if needed
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  // Cache API responses for registrants and claimed data
  if (url.includes('/verify/registrants.json')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        try {
          const response = await fetch(event.request);
          cache.put(event.request, response.clone());
          return response;
        } catch (e) {
          return cache.match(event.request);
        }
      })
    );
    return;
  }
  // Default: cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(networkResponse => {
        // Only cache GET requests
        if (event.request.method === 'GET') {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback: try cache
        return caches.match(event.request);
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});
