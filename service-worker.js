
const CACHE_NAME = "cofe-v11";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./css/base.css",
    "./css/sky.css",
    "./css/home.css",
    "./css/screens.css",
    "./app.js",
    "./db.js",
    "./manifest.json",

    "./js/config.js",
    "./js/navigation.js",

    "./js/core/time.js",
    "./js/core/energy.js",
    "./js/core/astronomy.js",

    "./js/ui/sky.js",
    "./js/ui/counter.js",

    "./js/screens/home.js",
    "./js/screens/entry.js",
    "./js/screens/profile.js",

    "./icons/icon-192.png",
    "./icons/icon-512.png",
	"./js/screens/journal.js",
	"./js/core/history.js",
    "./js/screens/statistics.js"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request);
        })
    );
});
