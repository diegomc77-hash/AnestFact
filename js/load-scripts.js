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
    'js/23-reglas-clinicas.js',
    'js/21-metodos.js',
    'js/22-tecnica.js',
    'js/27-ayuda.js',
    'js/28-auth.js',
    'js/29-plans.js',
    'js/30-admin.js',
    'js/load-views.js',
    'js/24-sw-register.js'
  ];

  function loadNext(i) {
    if (i >= SCRIPTS.length) return;
    var s = document.createElement('script');
    s.src = SCRIPTS[i] + (SCRIPTS[i].indexOf('00-env') >= 0 || SCRIPTS[i].indexOf('17-sync-export') >= 0 || SCRIPTS[i].indexOf('06-nav-core') >= 0 || SCRIPTS[i].indexOf('07-intervenciones') >= 0 || SCRIPTS[i].indexOf('13-scan-ia') >= 0 || SCRIPTS[i].indexOf('28-auth') >= 0 || SCRIPTS[i].indexOf('29-plans') >= 0 || SCRIPTS[i].indexOf('30-admin') >= 0 || SCRIPTS[i].indexOf('15-utils') >= 0 || SCRIPTS[i].indexOf('20-geclisa') >= 0 || SCRIPTS[i].indexOf('12-imprimir-aero') >= 0 || SCRIPTS[i].indexOf('reglas-clinicas') >= 0 || SCRIPTS[i].indexOf('23-reglas') >= 0 || SCRIPTS[i].indexOf('25-examen-ausc') >= 0 || SCRIPTS[i].indexOf('02-premed') >= 0 || SCRIPTS[i].indexOf('10-geclisa') >= 0 || SCRIPTS[i].indexOf('26-balance') >= 0 || SCRIPTS[i].indexOf('22-tecnica') >= 0 || SCRIPTS[i].indexOf('19-examen-mayo') >= 0 || SCRIPTS[i].indexOf('08-foja') >= 0 || SCRIPTS[i].indexOf('03-autocomplete') >= 0 || SCRIPTS[i].indexOf('27-ayuda') >= 0 || SCRIPTS[i].indexOf('load-views') >= 0 ? '?v=8.6' : '');
    s.onload = function () { loadNext(i + 1); };
    s.onerror = function () { console.error('AnesFact: no se pudo cargar', SCRIPTS[i]); };
    document.body.appendChild(s);
  }

  loadNext(0);
})();
