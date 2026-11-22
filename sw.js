/* Service worker: hace que la app funcione sin internet.
   - La app (página, iconos y manifiesto) se guarda entera al instalarse y se abre
     siempre desde esa copia: al instante y sin necesidad de internet.
   - Con internet, el navegador comprueba si hay una versión nueva de sw.js.
   La versión cambia en cada publicación: así el móvil o la tablet detecta que hay
   contenido nuevo y la app muestra el aviso «Actualizar ahora». */
const VERSION = "3d0355263f";
const CACHE = "sermas-c1-" + VERSION;
const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k.startsWith("sermas-c1-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});

function conLimite(promesa, ms) {
  return new Promise((ok, ko) => {
    const t = setTimeout(() => ko(new Error("tiempo")), ms);
    promesa.then((r) => { clearTimeout(t); ok(r); }, (err) => { clearTimeout(t); ko(err); });
  });
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    // Página: la copia guardada de esta versión (abre al instante, con o sin internet).
    // Si aún no hay copia (primera visita), se pide a internet.
    e.respondWith(
      caches.match("./index.html").then((c) => c || conLimite(fetch(req), 8000))
    );
    return;
  }

  // Resto: copia guardada primero; si no está, internet.
  e.respondWith(
    caches.match(req).then((c) => c || fetch(req).then((res) => {
      if (res && res.ok) { const copia = res.clone(); caches.open(CACHE).then((cache) => cache.put(req, copia)); }
      return res;
    }))
  );
});
