/**
 * Sanatorios permitidos según plan (servidor = fuente; cliente filtra UI).
 * Select: catálogo desarrollado ∩ permitidos (match exacto de nombre).
 * Admin: todos los desarrollado. DEFAULTS.pro arranca vacío (admin carga lugar por lugar).
 */
(function (global) {
  var DEFAULTS = {
    demo: ['Hospital Aeronáutico'],
    basico: ['Hospital Aeronáutico', 'Sanatorio Mayo'],
    pro: [],
    bloqueado: []
  };

  function planSanatorios() {
    var fromProfile = USER_PROFILE && USER_PROFILE.sanatorios_permitidos;
    if (Array.isArray(fromProfile)) return fromProfile.slice();
    var plan = (typeof USER_PLAN !== 'undefined' && USER_PLAN) ? USER_PLAN : 'demo';
    return (DEFAULTS[plan] || DEFAULTS.demo).slice();
  }

  function catalogoDesarrollado() {
    if (typeof afFojaNombresDesarrollados === 'function') return afFojaNombresDesarrollados();
    return ['Hospital Aeronáutico', 'Sanatorio Mayo'];
  }

  function nombresSelectSanatorios() {
    var cat = catalogoDesarrollado();
    if (typeof USER_IS_ADMIN !== 'undefined' && USER_IS_ADMIN) return cat.slice();
    var allowed = planSanatorios();
    return cat.filter(function (n) {
      return allowed.indexOf(n) >= 0;
    });
  }

  function sanatorioPermitido(nombre) {
    if (typeof USER_IS_ADMIN !== 'undefined' && USER_IS_ADMIN) return true;
    var list = planSanatorios();
    if (!list.length) return false;
    return list.indexOf(nombre) >= 0;
  }

  function filtrarSelectSanatorios() {
    var sel = document.getElementById('f-san');
    if (!sel) return;
    var names = nombresSelectSanatorios();
    var cur = '';
    if (typeof S !== 'undefined' && S.cur && S.cur.san) cur = S.cur.san;
    else cur = sel.value;
    if (cur && names.indexOf(cur) < 0 && sanatorioPermitido(cur)) {
      names = names.concat([cur]);
    }
    while (sel.options.length) sel.remove(0);
    names.forEach(function (n) {
      var o = document.createElement('option');
      o.value = n;
      o.textContent = n;
      sel.appendChild(o);
    });
    if (cur && names.indexOf(cur) >= 0) {
      sel.value = cur;
    } else if (names[0]) {
      sel.value = names[0];
    }
    if (sel.value && typeof onSanChange === 'function') onSanChange();
  }

  function assertSanatorioActual() {
    var sel = document.getElementById('f-san');
    if (!sel || !sel.value) return true;
    if (sanatorioPermitido(sel.value)) return true;
    if (typeof showPlanModal === 'function') {
      showPlanModal('Sanatorio no incluido', 'Tu plan no incluye "' + sel.value + '". Elegí uno permitido o contactanos para ampliar el plan.');
    } else if (typeof toast === 'function') {
      toast('Sanatorio no permitido en tu plan');
    }
    filtrarSelectSanatorios();
    return false;
  }

  global.AfSanatoriosPlan = {
    list: planSanatorios,
    allowed: sanatorioPermitido,
    filterSelect: filtrarSelectSanatorios,
    selectNames: nombresSelectSanatorios,
    assertCurrent: assertSanatorioActual,
    DEFAULTS: DEFAULTS
  };
})(typeof window !== 'undefined' ? window : globalThis);
