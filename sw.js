const CACHE = "fb-v2";
const SHELL = ["./"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // Ne pas cacher les appels API
  if (e.request.url.includes("script.google.com")) return;
  if (e.request.url.includes("frankfurter")) return;

  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r.ok) {
          const c = r.clone();
          caches.open(CACHE).then(ca => ca.put(e.request, c));
        }
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
