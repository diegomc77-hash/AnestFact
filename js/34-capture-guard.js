/**
 * Protección anti-captura / secreto médico (solo pantalla).
 * NO se incluye en impresión Aero, PDF ni GECLISA.
 * Activa en planes sin permiso de imprimir (demo / bloqueado).
 */
(function (global) {
  var OVERLAY_ID = 'af-secreto-medico-overlay';
  var STYLE_ID = 'af-secreto-medico-css';
  var LEGEND =
    'SECRETO MÉDICO — Prohibida la extracción, captura o reproducción no autorizada de fojas e información clínica. Uso exclusivo del profesional habilitado.';

  function ensureCss() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      '#' + OVERLAY_ID + '{' +
      'pointer-events:none;position:fixed;inset:0;z-index:8500;' +
      'display:none;overflow:hidden;' +
      'background:repeating-linear-gradient(-32deg,transparent,transparent 46px,rgba(180,80,40,.045) 46px,rgba(180,80,40,.045) 92px);' +
      '}' +
      '#' + OVERLAY_ID + '.on{display:block}' +
      '#' + OVERLAY_ID + ' .af-wm-grid{' +
      'position:absolute;inset:-20%;display:flex;flex-wrap:wrap;gap:28px;transform:rotate(-28deg);' +
      'opacity:.14;font-size:13px;font-weight:700;color:#7c2d12;letter-spacing:.02em;' +
      'user-select:none;-webkit-user-select:none;' +
      '}' +
      '#' + OVERLAY_ID + ' .af-wm-grid span{white-space:nowrap;padding:8px 14px}' +
      '#' + OVERLAY_ID + ' .af-wm-banner{' +
      'position:fixed;left:0;right:0;bottom:0;z-index:8501;pointer-events:none;' +
      'background:rgba(124,45,18,.92);color:#fff7ed;font-size:11px;line-height:1.35;' +
      'padding:8px 12px;text-align:center;font-weight:600;' +
      'user-select:none;-webkit-user-select:none;' +
      '}' +
      'body.af-capture-guard{' +
      '-webkit-user-select:none;user-select:none;' +
      '}' +
      'body.af-capture-guard input,body.af-capture-guard textarea,body.af-capture-guard select{' +
      '-webkit-user-select:text;user-select:text;' +
      '}' +
      /* Nunca en impresión del navegador de la app */
      '@media print{' +
      '#' + OVERLAY_ID + ',#' + OVERLAY_ID + ' .af-wm-banner{display:none!important}' +
      'body.af-capture-guard{-webkit-user-select:text;user-select:text}' +
      '}';
    document.head.appendChild(s);
  }

  function ensureOverlay() {
    ensureCss();
    var el = document.getElementById(OVERLAY_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = OVERLAY_ID;
    el.setAttribute('aria-hidden', 'true');
    var grid = document.createElement('div');
    grid.className = 'af-wm-grid';
    var i;
    for (i = 0; i < 48; i++) {
      var sp = document.createElement('span');
      sp.textContent = 'SECRETO MÉDICO · NO CAPTURAR';
      grid.appendChild(sp);
    }
    var ban = document.createElement('div');
    ban.className = 'af-wm-banner';
    ban.textContent = LEGEND;
    el.appendChild(grid);
    el.appendChild(ban);
    document.body.appendChild(el);
    return el;
  }

  /** true = plan no puede imprimir → mostrar guarda visual */
  function shouldGuard() {
    if (typeof USER_IS_ADMIN !== 'undefined' && USER_IS_ADMIN) return false;
    var plan = (typeof USER_PLAN !== 'undefined' && USER_PLAN) ? USER_PLAN : 'demo';
    if (plan === 'bloqueado') return true;
    if (plan === 'demo') return true;
    // basico/max/pro: sin marca (pueden imprimir)
    return false;
  }

  function applyCaptureGuard() {
    if (!document.body) return;
    var on = shouldGuard();
    var el = ensureOverlay();
    if (on) {
      el.classList.add('on');
      document.body.classList.add('af-capture-guard');
    } else {
      el.classList.remove('on');
      document.body.classList.remove('af-capture-guard');
    }
  }

  // Intento de print desde la app (no la ventana de foja): avisar
  document.addEventListener('keydown', function (e) {
    if (!shouldGuard()) return;
    var key = e.key || '';
    if ((e.ctrlKey || e.metaKey) && (key === 'p' || key === 'P')) {
      e.preventDefault();
      if (typeof toast === 'function') {
        toast('Impresión de pantalla no permitida en este plan (secreto médico)');
      }
    }
  }, true);

  global.AfCaptureGuard = {
    apply: applyCaptureGuard,
    shouldGuard: shouldGuard,
    LEGEND: LEGEND
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyCaptureGuard);
  } else {
    applyCaptureGuard();
  }
})(typeof window !== 'undefined' ? window : globalThis);
