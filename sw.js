// HomeBudget Service Worker
// Caches the app shell so the app can still open when there's no internet.
// Your actual expense data is handled separately by Firestore's own offline
// storage (see the enablePersistence() call in index.html) — this file just
// makes sure the app itself loads without a connection.

const CACHE_NAME = "homebudget-shell-v1";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// App shell: cache-first (so the app opens instantly and works offline).
// Everything else (Firebase, Chart.js, etc.) goes to the network as normal —
// we don't want to accidentally cache your live expense data here.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isShellFile = url.origin === self.location.origin;

  if (isShellFile) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
