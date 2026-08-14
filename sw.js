// HomeBudget Service Worker
// Caches the app shell so the app can still open when there's no internet.
// Your actual expense data is handled separately by Firestore's own offline
// storage (see the enablePersistence() call in index.html) — this file just
// makes sure the app itself loads without a connection.
//
// IMPORTANT: bump CACHE_NAME (e.g. v2, v3...) any time you want to force
// everyone's phone to pick up a fresh copy instead of a saved one.

const CACHE_NAME = "homebudget-shell-v2";
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

// App shell: network-first. Always try to fetch the latest version first,
// so updates show up immediately when you have internet. Only fall back to
// the saved copy if the network request fails (i.e. you're actually offline).
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isShellFile = url.origin === self.location.origin;

  if (isShellFile) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
