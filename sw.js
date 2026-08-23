// AnesFact Service Worker — CACHE_NAME bumpea junto con CACHE_V (load-scripts.js)
// STATIC_CORE: shell + SCRIPTS (js/load-scripts.js) + vistas (js/load-views.js).
// Si agregás un script o vista nueva, actualizá AMBOS lados (lista acá + SCRIPTS/VIEWS/FOJA_PARTS).
// No incluir scripts propios de valoracion.html ni CDNs (QR paciente = online).
var CACHE_NAME = 'anesfact-v12.22';
var STATIC_CORE = [
  'index.html',
  'valoracion.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'styles.css',
  'seguridad.js',
  'js/supabase-keepalive.js',
  // --- SCRIPTS (js/load-scripts.js) ---
  'js/00-env.js',
  'data/nomenclador.js',
  'data/obras-sociales.js',
  'data/cirugias.js',
  'data/drogas-catalogo.js',
  'data/reglas-clinicas.js',
  'js/01-state.js',
  'js/02-premed.js',
  'js/03-autocomplete.js',
  'js/04-drogas-ui.js',
  'js/05-vitals-sign.js',
  'js/06-nav-core.js',
  'js/07-intervenciones.js',
  'js/08-foja.js',
  'js/09-nomenclador-ui.js',
  'js/10-geclisa-ui.js',
  'js/11-resumen.js',
  'js/12-imprimir-aero.js',
  'js/13-scan-ia.js',
  'js/14-voz.js',
  'js/15-utils.js',
  'js/16-vitals-grid.js',
  'data/cirujanos-esp.js',
  'js/17-sync-export.js',
  'js/18-posicion.js',
  'js/19-examen-mayo.js',
  'js/25-examen-ausc.js',
  'js/26-balance-fluidos.js',
  'js/20-geclisa-send.js',
  'js/39-geclisa-queue.js',
  'js/23-reglas-clinicas.js',
  'js/21-metodos.js',
  'js/22-tecnica.js',
  'js/27-ayuda.js',
  'js/28-auth.js',
  'js/29-plans.js',
  'js/30-admin.js',
  'js/31-valoracion-qr.js',
  'js/40-valoracion-preop-sync.js',
  'data/valoracion/alertas-seguridad.js',
  'js/32-tiva-calc.js',
  'js/33-gases-calc.js',
  'js/34-capture-guard.js',
  'js/35-sanatorios-plan.js',
  'js/36-identidad-anestesista.js',
  'js/37-firma-certificada.js',
  'js/38-sesiones.js',
  'js/load-views.js',
  'js/24-sw-register.js',
  'js/load-scripts.js',
  // --- vistas (js/load-views.js: topbar, auth, VIEWS, foja + FOJA_PARTS) ---
  'views/topbar.html',
  'views/auth.html',
  'views/home.html',
  'views/nueva.html',
  'views/facturacion.html',
  'views/escanear.html',
  'views/config.html',
  'views/foja.html',
  'views/nom.html',
  'views/geclisa.html',
  'views/resumen.html',
  'views/ayuda.html',
  'views/admin.html',
  'views/foja/tiempos.html',
  'views/foja/mayo-quir.html',
  'views/foja/tecnica.html',
  'views/foja/drogas.html',
  'views/foja/metodos.html',
  'views/foja/mayo-geclisa.html',
  'views/foja/vitals.html',
  'views/foja/fluidos.html',
  'views/foja/recuperacion.html',
  'views/foja/observaciones.html',
  'views/foja/firma.html',
  'views/foja/acciones.html'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      var base = self.registration.scope;
      return Promise.all(STATIC_CORE.map(function (f) {
        return cache.add(new URL(f, base).href).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isSupabase(url) { return url.indexOf('supabase.co') >= 0; }

function isStaticAsset(url) {
  if (url.indexOf('/AnestFact/') < 0 && url.indexOf('localhost') < 0 && url.indexOf('127.0.0.1') < 0) return false;
  return /\.(html|css|js|png|json|woff2?)(\?|$)/.test(url) || /\/AnestFact\/?$/.test(url);
}

function notifyOffline(clients) {
  clients.forEach(function (c) {
    c.postMessage({ type: 'anesfact-offline' });
  });
}

function notifyOnline(clients) {
  clients.forEach(function (c) {
    c.postMessage({ type: 'anesfact-online' });
  });
}

function matchCache(request) {
  return caches.match(request, { ignoreSearch: true });
}

self.addEventListener('fetch', function (e) {
  var url = e.request.url;
  if (e.request.method !== 'GET') return;

  if (isSupabase(url)) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        self.clients.matchAll().then(notifyOnline);
        return res;
      }).catch(function () {
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
      matchCache(e.request).then(function (cached) {
        var network = fetch(e.request).then(function (res) {
          if (res && res.status === 200) {
            var clone = res.clone();
            caches.open(CACHE_NAME).then(function (c) { c.put(e.request, clone); });
            self.clients.matchAll().then(notifyOnline);
          }
          return res;
        }).catch(function () {
          self.clients.matchAll().then(notifyOffline);
          if (cached) return cached;
          if (e.request.mode === 'navigate') {
            return matchCache(new Request(new URL('index.html', self.registration.scope).href));
          }
          return cached;
        });
        return cached || network;
      })
    );
    return;
  }

  e.respondWith(
    fetch(e.request).catch(function () {
      return matchCache(e.request).then(function (cached) {
        if (cached) return cached;
        if (e.request.mode === 'navigate') {
          return matchCache(new Request(new URL('index.html', self.registration.scope).href));
        }
        return undefined;
      });
    })
  );
});
