/* Setlist Metrônomo - offline-first service worker with Network-First for navigation */
const CACHE = "setlist-metronome-v4";
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

  const isNav = req.mode === "navigate" || url.pathname === "/" || url.pathname === "/index.html";

  // 1. Network-First para navegação (HTML) para evitar erros de hash mismatch de scripts
  if (isNav) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match("/index.html") || caches.match("/"))
    );
    return;
  }

  // 2. Cache-First para recursos estáticos (JS, CSS, imagens)
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // Cacheia recursos estáticos do próprio domínio
          if (
            res.ok &&
            url.origin === self.location.origin &&
            (req.destination === "script" ||
              req.destination === "style" ||
              req.destination === "image" ||
              req.destination === "font")
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
