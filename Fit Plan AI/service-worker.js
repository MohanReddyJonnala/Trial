const CACHE_NAME = "fitplan-ai-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json"
];

// Install
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(APP_FILES);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

// Activate
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Fetch
self.addEventListener("fetch", function (event) {

  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function (cachedResponse) {

        // Use cached file if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise load from internet
        return fetch(event.request)
          .then(function (networkResponse) {

            // Save a copy for offline use
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type !== "opaque"
            ) {
              const responseCopy = networkResponse.clone();

              caches.open(CACHE_NAME)
                .then(function (cache) {
                  cache.put(event.request, responseCopy);
                });
            }

            return networkResponse;
          })
          .catch(function () {
            // If offline, return the main app
            return caches.match("./index.html");
          });
      })
  );
});
