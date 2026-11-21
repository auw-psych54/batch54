/* Offline support: the page is fetched fresh when online and served from cache when offline. */
const CACHE = "batch54-v2";
const CORE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url);
  // live data and counters: network only
  if (u.hostname.includes("docs.google.com") || u.hostname.includes("goatcounter") || u.hostname.includes("zgo.at")) return;
  // fonts: cache first
  if (u.hostname.includes("fonts.googleapis.com") || u.hostname.includes("fonts.gstatic.com")) {
    e.respondWith(caches.open(CACHE).then(c => c.match(r).then(hit => hit || fetch(r).then(res => { c.put(r, res.clone()); return res; }))));
    return;
  }
  if (u.origin !== location.origin) return;
  // own files: network first, fall back to cache
  e.respondWith(fetch(r, {cache: "no-cache"}).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); return res; })
    .catch(() => caches.match(r).then(hit => hit || caches.match("./index.html"))));
});
