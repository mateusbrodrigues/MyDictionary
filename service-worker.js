const CACHE_NAME = "dictionary-pwa-v1";
const URLS_TO_CACHE = [
  "/MyDictionary/",
  "/MyDictionary/index.html",
  "/MyDictionary/app.js",
  "https://unpkg.com/@picocss/pico@1.5.6/css/pico.min.css",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
