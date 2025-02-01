const CACHE_NAME = 'vsp-zoeker-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/pm1_vsp_lijst.json',
  '/pm2_vsp_lijst.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json'
];

// Installeer en cache alle bestanden
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Nieuwe fetch strategie: Cache First, dan pas network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response direct als we die hebben
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Anders proberen we het netwerk
        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone de response omdat we hem twee keer willen gebruiken
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
});