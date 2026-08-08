/**
 * Sanatorios permitidos según plan (servidor = fuente; cliente filtra UI).
 */
(function (global) {
  var DEFAULTS = {
    demo: ['Hospital Aeronáutico'],
    basico: ['Hospital Aeronáutico', 'Sanatorio Mayo'],
    pro: ['Hospital Aeronáutico', 'Sanatorio Mayo', 'Clínica Allende', 'Clínica Privada Córdoba'],
    bloqueado: []
  };

  function planSanatorios() {
    if (typeof USER_IS_ADMIN !== 'undefined' && USER_IS_ADMIN) {
      return DEFAULTS.pro.slice();
    }
    var fromProfile = USER_PROFILE && USER_PROFILE.sanatorios_permitidos;
    if (fromProfile && fromProfile.length) return fromProfile.slice();
    var plan = (typeof USER_PLAN !== 'undefined' && USER_PLAN) ? USER_PLAN : 'demo';
    return (DEFAULTS[plan] || DEFAULTS.demo).slice();
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
    var allowed = planSanatorios();
    var cur = sel.value;
    var opts = Array.prototype.slice.call(sel.options);
    opts.forEach(function (o) {
      if (!o.value && o.textContent.indexOf('—') >= 0) return;
      var name = o.value || o.textContent;
      var ok = allowed.indexOf(name) >= 0;
      o.disabled = !ok;
      o.hidden = !ok;
    });
    if (cur && allowed.indexOf(cur) < 0) {
      sel.value = allowed[0] || '';
      if (typeof onSanChange === 'function') onSanChange();
    } else if (!cur && allowed[0]) {
      sel.value = allowed[0];
      if (typeof onSanChange === 'function') onSanChange();
    }
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
    assertCurrent: assertSanatorioActual,
    DEFAULTS: DEFAULTS
  };
})(typeof window !== 'undefined' ? window : globalThis);
