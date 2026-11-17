// PadNet — service worker mínimo: permite instalar la app y abrirla aunque falle la conexión.
// Estrategia "red primero": siempre se usa la versión más nueva y, si no hay internet, la última guardada.
const CACHE = "padnet-v1";
const NUCLEO = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(NUCLEO).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;                              // guardar datos pasa directo
  if (new URL(r.url).origin !== location.origin) return;       // Firebase y otras páginas pasan directo
  e.respondWith(
    fetch(r)
      .then(resp => {
        if (resp && resp.ok) { const copia = resp.clone(); caches.open(CACHE).then(c => c.put(r, copia)); }
        return resp;
      })
      .catch(() => caches.match(r).then(x => x || caches.match("./index.html")))
  );
});
