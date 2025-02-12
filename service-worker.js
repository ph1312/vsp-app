<<<<<<< HEAD
const CACHE_NAME = 'vsp-zoeker-v4';
=======
const CACHE_NAME = 'vsp-zoeker-v3';
>>>>>>> 615c9e4a6d0c8f4ec576aaf43914b85928836f24
const ASSETS_TO_CACHE = [
  '/vsp-app/',
  '/vsp-app/index.html',
  '/vsp-app/styles.css',
  '/vsp-app/app.js',
  '/vsp-app/pm1_vsp_lijst.json',
  '/vsp-app/pm2_vsp_lijst.json',
  '/vsp-app/vsp_lijstcentralepulp.json',
  '/vsp-app/procedures/pm2_procedures.json',
  '/vsp-app/icons/icon-192x192.png',
  '/vsp-app/icons/icon-512x512.png',
  '/vsp-app/manifest.json'
];

// Dynamically add all procedure HTML files to cache during install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // First cache the static assets
      await cache.addAll(ASSETS_TO_CACHE);
      
      try {
        // Fetch and parse the procedures JSON
        const response = await fetch('/vsp-app/procedures/pm2_procedures.json');
        const data = await response.json();
        
        // Add all procedure HTML files to cache
        const procedureUrls = data.procedures.map(
          proc => `/vsp-app/procedures/${proc.filename}`
        );
        await cache.addAll(procedureUrls);
      } catch (error) {
        console.error('Error caching procedure files:', error);
      }
    })
  );
  self.skipWaiting();
});

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
    }).then(() => {
      return clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
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
