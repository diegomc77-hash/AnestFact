(function () {
  var SCRIPTS = [
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
    'js/32-tiva-calc.js',
    'js/33-gases-calc.js',
    'js/34-capture-guard.js',
    'js/35-sanatorios-plan.js',
    'js/36-identidad-anestesista.js',
    'js/37-firma-certificada.js',
    'js/38-sesiones.js',
    'js/load-views.js',
    'js/24-sw-register.js'
  ];

  var CACHE_V = '12.6';

  function loadNext(i) {
    if (i >= SCRIPTS.length) return;
    var s = document.createElement('script');
    // Siempre bust de cache: evita JS viejo (ej. TIVA con "mantenimiento inhalatorio")
    s.src = SCRIPTS[i] + (SCRIPTS[i].indexOf('?') >= 0 ? '&' : '?') + 'v=' + CACHE_V;
    s.onload = function () { loadNext(i + 1); };
    s.onerror = function () { console.error('AnesFact: no se pudo cargar', SCRIPTS[i]); };
    document.body.appendChild(s);
  }

  loadNext(0);
})();
