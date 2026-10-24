/* PizzaPlan · Zwischenspeicher
   Damit die App auch ohne Netz startet. Die Daten liegen im Gerät und – im Servermodus – zusätzlich auf dem Server.
   Bei jeder neuen Fassung die Zahl in LAGER erhöhen – dann wird alles frisch geholt. */
const LAGER = 'pizzaplan-v7';

const DATEIEN = [
  'start.html', 'pc.html', 'handy.html', 'team.html',
  'css/basis.css?v=6', 'css/pc.css?v=6', 'css/handy.css?v=6', 'css/team.css?v=6',
  'js/kern.js?v=7', 'js/verbindung.js?v=6', 'js/sprache.js?v=6', 'js/oberflaeche.js?v=6',
  'js/masken.js?v=6', 'js/pc.js?v=6', 'js/handy.js?v=6', 'js/team.js?v=6',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(LAGER)
      .then((c) => Promise.allSettled(DATEIEN.map((d) => c.add(d))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== LAGER).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

/* Erst das Netz fragen, damit neue Fassungen sofort ankommen; klappt das nicht,
   kommt die Datei aus dem Zwischenspeicher. */
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((antwort) => {
        const kopie = antwort.clone();
        caches.open(LAGER).then((c) => c.put(e.request, kopie)).catch(() => {});
        return antwort;
      })
      .catch(() => caches.match(e.request).then((t) => t || caches.match('start.html')))
  );
});
