// AnesFact Service Worker v8
var CACHE_NAME = 'anesfact-v11.5';
var STATIC_CORE = ['index.html', 'valoracion.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'styles.css'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      var base = self.registration.scope;
      return Promise.all(STATIC_CORE.map(function(f){
        return cache.add(new URL(f, base).href).catch(function(){});
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

function isSupabase(url){ return url.indexOf('supabase.co') >= 0; }

function isStaticAsset(url){
  if (url.indexOf('/AnestFact/') < 0 && url.indexOf('localhost') < 0 && url.indexOf('127.0.0.1') < 0) return false;
  return /\.(html|css|js|png|json|woff2?)(\?|$)/.test(url) || /\/AnestFact\/?$/.test(url);
}

function notifyOffline(clients){
  clients.forEach(function(c){
    c.postMessage({ type: 'anesfact-offline' });
  });
}

function notifyOnline(clients){
  clients.forEach(function(c){
    c.postMessage({ type: 'anesfact-online' });
  });
}

self.addEventListener('fetch', function(e){
  var url = e.request.url;
  if (e.request.method !== 'GET') return;

  if (isSupabase(url)) {
    e.respondWith(
      fetch(e.request).then(function(res){
        self.clients.matchAll().then(notifyOnline);
        return res;
      }).catch(function(){
        self.clients.matchAll().then(notifyOffline);
        return new Response(JSON.stringify({ error: 'offline', message: 'Sin conexión a Supabase' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  if (isStaticAsset(url)) {
    e.respondWith(
      caches.match(e.request).then(function(cached){
        var network = fetch(e.request).then(function(res){
          if (res && res.status === 200) {
            var clone = res.clone();
            caches.open(CACHE_NAME).then(function(c){ c.put(e.request, clone); });
            self.clients.matchAll().then(notifyOnline);
          }
          return res;
        }).catch(function(){
          self.clients.matchAll().then(notifyOffline);
          return cached;
        });
        return cached || network;
      })
    );
    return;
  }

  e.respondWith(
    fetch(e.request).catch(function(){
      return caches.match(e.request);
    })
  );
});
