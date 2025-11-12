const CACHE_NAME = 'encrypted-v1-cache';
const urlsToCache = [
  '/v1.html'
];

// Install event - cache the v1.html file
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the service worker takes control immediately
  return self.clients.claim();
});

// Fetch event - serve v1.html from cache, never hit the server
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only intercept requests for v1.html
  if (url.pathname === '/v1.html') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Cache hit - return response from cache
          if (response) {
            console.log('Serving v1.html from cache');
            return response;
          }

          // Cache miss - fetch from network and cache it
          return fetch(event.request).then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response (can only be consumed once)
            const responseToCache = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
              console.log('Cached v1.html for future use');
            });

            return response;
          });
        })
    );
  }
});
