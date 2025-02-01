const CACHE_NAME = 'vsp-zoeker-v2';
const ASSETS_TO_CACHE = [
  '/vsp-app/',
  '/vsp-app/index.html',
  '/vsp-app/styles.css',
  '/vsp-app/app.js',
  '/vsp-app/pm1_vsp_lijst.json',
  '/vsp-app/pm2_vsp_lijst.json',
  '/vsp-app/icons/icon-192x192.png',
  '/vsp-app/icons/icon-512x512.png',
  '/vsp-app/manifest.json'
];

// Direct activeren zonder te wachten
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  // Direct claimen zodat de app offline beschikbaar is
  event.waitUntil(clients.claim());
});

// Direct installeren en cachen
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Offline-first strategie
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cache direct als beschikbaar
        if (response) {
          return response;
        }

        // Anders network proberen en cachen
        return fetch(event.request)
          .then(function(response) {
            if(!response || response.status !== 200) {
              return response;
            }

            var responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
});