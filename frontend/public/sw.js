/* Setlist Metrônomo - simple offline-first service worker (cache-first for app shell) */
const CACHE = "setlist-metronome-v2";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/favicon-32.png",
  "/favicon-64.png",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/logo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Bypass API calls so they always hit network
  if (url.pathname.startsWith("/api/")) return;
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // Cache same-origin static assets opportunistically
          if (
            res.ok &&
            url.origin === self.location.origin &&
            (req.destination === "script" ||
              req.destination === "style" ||
              req.destination === "image" ||
              req.destination === "font" ||
              req.destination === "document")
          ) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match("/index.html"));
    })
  );
});
