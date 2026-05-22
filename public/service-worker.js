const CACHE_NAME = 'pocket-mechanic-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon.svg',
  '/manifest.json'
];

// Install Event - cache the critical layout shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell Assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - clear stale legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - dynamic caching strategy with API bypass
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ALWAYS bypass cache completely for AI endpoints & API server calls so result is fresh
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({
            error: 'You are currently offline. Please reconnect to cellular data or Wi-Fi to use live AI diagnostics.'
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Use a Cache-First, falling back to Network strategy for layout files & icons
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update to keep cache fresh in the background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Ignore background network failures */});
        
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Cache newly requested frontend static assets (like custom js, css bundle chunks) on the fly
        if (
          response.status === 200 && 
          response.type === 'basic' && 
          !url.pathname.startsWith('/@') && // Skip Vite hot reload streams 
          !url.pathname.includes('hot-reload') 
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    }).catch(() => {
      // Offline fallback: serve index.html if request is a document (route page)
      if (event.request.headers.get('accept').includes('text/html')) {
        return caches.match('/');
      }
    })
  );
});
