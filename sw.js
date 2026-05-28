// AnesFact Service Worker v6.4 - Network first siempre
var CACHE_NAME = 'anesfact-v6.4';

self.addEventListener('install', function(e){
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  // Network first - siempre intenta descargar la versión más nueva
  // Solo usa caché si no hay internet
  e.respondWith(
    fetch(e.request.clone())
      .then(function(res){
        // Guarda en caché solo respuestas exitosas
        if(res && res.status === 200){
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(c){ c.put(e.request, clone); });
        }
        return res;
      })
      .catch(function(){
        // Sin internet: usa caché
        return caches.match(e.request);
      })
  );
});
