/* Service Worker: Netz zuerst, damit neue Karten sofort erscheinen. Ohne Netz kommt die letzte Kopie aus dem Cache. */
var CACHE = 'strukturformel-karten-v1';
var ASSETS = ['./', 'index.html', 'styles.css', 'chem.js', 'molecules.js', 'app.js', 'manifest.webmanifest',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function networkFirst(req) {
  return new Promise(function (resolve) {
    var done = false;
    var timer = setTimeout(function () {
      caches.match(req, { ignoreSearch: true }).then(function (m) { if (m && !done) { done = true; resolve(m); } });
    }, 3500);
    fetch(req, { cache: 'no-cache' }).then(function (r) {
      clearTimeout(timer);
      if (r && r.ok) {
        var copy = r.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      if (!done) { done = true; resolve(r); }
    }).catch(function () {
      clearTimeout(timer);
      caches.match(req, { ignoreSearch: true }).then(function (m) {
        if (done) return;
        done = true;
        resolve(m || caches.match('index.html') || Response.error());
      });
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(networkFirst(req));
});
