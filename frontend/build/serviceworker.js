const CACHE_NAME = 'metronomo-v1';
const ASSETS = [
  '/',
  '/index.html',
  // Se houver arquivos CSS ou JS na pasta, adicione-os aqui, ex:
  // '/style.css',
  // '/script.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});