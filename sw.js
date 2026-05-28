// AnesFact Service Worker - actualizar CACHE_VERSION con cada deploy
var CACHE_VERSION = 'anesfact-v6.3';
var CACHE_NAME = CACHE_VERSION;

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(c){
      return c.addAll(['./']);
    })
  );
  // Activa inmediatamente sin esperar que se cierre la pestaña
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  // Borra todos los cachés viejos
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  // Para el index.html: siempre intenta red primero, caché como fallback
  if(e.request.url.indexOf('index.html') >= 0 || e.request.url.endsWith('/')){
    e.respondWith(
      fetch(e.request)
        .then(function(res){
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(c){ c.put(e.request, clone); });
          return res;
        })
        .catch(function(){ return caches.match(e.request); })
    );
    return;
  }
  // Para el resto: caché primero
  e.respondWith(
    caches.match(e.request).then(function(r){
      return r || fetch(e.request).catch(function(){ return caches.match('./'); });
    })
  );
});
