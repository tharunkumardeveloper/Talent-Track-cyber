// Service Worker for offline image caching
const CACHE_NAME = 'talenttrack-v1';
const ASSETS_TO_CACHE = [
  // Challenge images
  '/challenges/pushup-power.webp',
  '/challenges/pullup-progression.jpg',
  '/challenges/core-crusher.avif',
  '/challenges/sprint-master.jpg',
  '/challenges/flexibility-foundation.webp',
  '/challenges/jump-power.jpg',
  '/challenges/adaptive-strength.jpg',
  // Workout GIFs
  '/pushup.gif',
  '/pullup.gif',
  '/situp.gif',
  '/verticaljump.gif',
  '/shuttlerun.gif',
  '/sit&reach.gif',
  '/kneepushup.gif',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching assets');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Failed to cache some assets:', err);
        // Continue even if some assets fail
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for images
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Only cache images and GIFs
  if (
    url.pathname.startsWith('/challenges/') ||
    url.pathname.endsWith('.gif') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.avif') ||
    url.pathname.endsWith('.png')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', url.pathname);
          return cachedResponse;
        }

        // Not in cache, fetch from network and cache it
        return fetch(event.request)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
              console.log('[SW] Cached new asset:', url.pathname);
            });

            return response;
          })
          .catch((err) => {
            console.error('[SW] Fetch failed:', err);
            // Return a fallback image if available
            return caches.match('/placeholder.svg');
          });
      })
    );
  }
});
