const CACHE_NAME = 'vsp-zoeker-v5';
const ASSETS_TO_CACHE = [
  '/vsp-app/',
  '/vsp-app/index.html',
  '/vsp-app/styles.css',
  '/vsp-app/app.js',
  '/vsp-app/pm1_vsp_lijst.json',
  '/vsp-app/pm2_vsp_lijst.json',
  '/vsp-app/vsp_lijstcentralepulp.json',
  '/vsp-app/procedures/pm2_procedures.json'
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
    }).then(() => {
      return clients.claim();
    })
  );
});

// Direct installeren en cachen
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Aangepaste fetch handler voor documenten
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cache hit if available
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            // Check if valid response
            if(!response || response.status !== 200) {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Don't cache document downloads
            if (!event.request.url.includes('.docx')) {
              caches.open(CACHE_NAME)
                .then(function(cache) {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          }
        );
      })
  );
});