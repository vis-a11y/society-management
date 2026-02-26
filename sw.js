const CACHE_NAME = 'societyhub-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/resident-portal.html',
    '/admin-portal.html',
    '/style.css',
    '/landing.css',
    '/login.css',
    '/resident.js',
    '/admin.js',
    '/login.js',
    '/chatbot.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((res) => {
            return res || fetch(e.request);
        })
    );
});
