const CACHE = "fb-v3"; // ← version bumped pour vider l'ancien cache corrompu
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

  const url = e.request.url;

  // Ne jamais cacher : APIs externes, CDN scripts, extensions Chrome
  if (url.includes("script.google.com")) return;
  if (url.includes("frankfurter")) return;
  if (url.includes("unpkg.com")) return;          // ← React / Babel CDN
  if (url.includes("fonts.googleapis.com")) return; // ← Google Fonts
  if (url.includes("fonts.gstatic.com")) return;
  if (url.startsWith("chrome-extension")) return;  // ← évite l'erreur put()

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
