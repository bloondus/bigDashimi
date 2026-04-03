// bigDashimi Service Worker – Network-First (immer aktuell, Offline-Fallback)
const CACHE_NAME = 'bigdashimi-v1.9.0';
const ASSETS = [
    '/bigDashimi/dashboard.html',
    '/bigDashimi/manifest.json',
];

// Install: Assets vorab cachen + sofort aktivieren
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: Alle alten Caches löschen + sofort übernehmen
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Fetch: Network-First für alles (Cache nur als Offline-Fallback)
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request).then(response => {
            // Erfolgreiche Antwort → im Cache aktualisieren
            if (response.ok) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return response;
        }).catch(() => {
            // Offline → aus Cache liefern, sonst Netzwerkfehler
            return caches.match(event.request).then(cached => {
                return cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
            });
        })
    );
});
