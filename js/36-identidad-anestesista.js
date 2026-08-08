/**
 * Identidad profesional del anestesista titular de la cuenta.
 * - Un plan = un anestesista (no se "presta" la app ni se cambia quién firma).
 * - Fuente de verdad: perfil en anesfact_usuarios (servidor).
 */
(function (global) {
  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function getAnestesistaIdentidad() {
    if (typeof USER_PROFILE !== 'undefined' && USER_PROFILE && USER_PROFILE.nombre) {
      return {
        nombre: String(USER_PROFILE.nombre).toUpperCase(),
        mp: USER_PROFILE.matricula || '',
        me: USER_PROFILE.matricula_especial || '',
        source: 'server',
        locked: true
      };
    }
    return {
      nombre: (localStorage.getItem('af_anest_nombre') || '').toUpperCase(),
      mp: localStorage.getItem('af_anest_mp') || '',
      me: localStorage.getItem('af_anest_me') || '',
      source: 'local',
      locked: false
    };
  }

  function firmaHtmlBlock() {
    var id = getAnestesistaIdentidad();
    var nom = id.nombre || 'ANESTESISTA (CONFIGURAR EN AJUSTES)';
    var mats = [];
    if (id.mp) mats.push('M.P. ' + id.mp);
    if (id.me) mats.push('M.E. ' + id.me);
    return '<b>' + esc(nom) + '</b><br>'
      + (mats.length ? esc(mats.join(' &nbsp; ')) + '<br>' : '')
      + 'Anestesiólogo/a · ADAARC';
  }

  function syncIdentidadToLocal(id) {
    if (!id || !id.nombre) return;
    localStorage.setItem('af_anest_nombre', id.nombre);
    if (id.mp != null) localStorage.setItem('af_anest_mp', id.mp);
    if (id.me != null) localStorage.setItem('af_anest_me', id.me);
    var h = document.getElementById('header-anest-info');
    if (h) h.textContent = id.nombre + (id.mp ? ' · M.P.' + id.mp : '') + ' · ADAARC';
  }

  global.AfIdentidad = {
    get: getAnestesistaIdentidad,
    firmaHtml: firmaHtmlBlock,
    syncLocal: syncIdentidadToLocal
  };
})(typeof window !== 'undefined' ? window : globalThis);
