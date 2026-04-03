// bigDashimi Service Worker – Cache-First mit Network-Fallback
const CACHE_NAME = 'bigdashimi-v1.6.0';
const ASSETS = [
    '/bigDashimi/dashboard.html',
    '/bigDashimi/manifest.json',
];

// Install: Statische Assets cachen
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: Alte Caches löschen
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Fetch: Cache-First für eigene Assets, Network-First für APIs
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Eigene Assets: Cache-First
    if (url.origin === self.location.origin) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                const fetchPromise = fetch(event.request).then(response => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                }).catch(() => cached);
                return cached || fetchPromise;
            })
        );
        return;
    }

    // Externe APIs: Network-First (kein Caching im SW, wird in-App gecacht)
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
