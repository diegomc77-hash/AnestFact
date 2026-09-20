/**
 * Content script (all_frames) — ADAARC evweb
 * Lote 1: diagnóstico AFG_EVW_PING (iframe same-origin del formulario).
 * Sin fill / sin clicks. El fill real entra en Lote 2+.
 */
(function () {
  if (window.__AFG_EVWEB_CS__) return;
  window.__AFG_EVWEB_CS__ = true;

  var IS_TOP = window === window.top;
  var FORM_HINT = /frmCargaDeIntervencion\.aspx/i;

  function hasFormSelects() {
    return !!(
      document.getElementById('body_cboObraSocial') ||
      document.getElementById('body_cboSanatorios')
    );
  }

  function countOptions(el) {
    if (!el || !el.options) return 0;
    return el.options.length;
  }

  function roleOfFrame() {
    if (hasFormSelects()) return 'form';
    if (IS_TOP) return 'top';
    return 'other';
  }

  function buildPing() {
    var obra = document.getElementById('body_cboObraSocial');
    var san = document.getElementById('body_cboSanatorios');
    var role = roleOfFrame();
    if (!obra && !san) {
      return {
        ok: false,
        role: role,
        isTop: IS_TOP,
        error: 'form_not_found',
        href: location.href,
        looksLikeFormUrl: FORM_HINT.test(location.href)
      };
    }
    return {
      ok: true,
      role: 'form',
      isTop: IS_TOP,
      href: location.href,
      obraSocialOptions: countOptions(obra),
      sanatoriosOptions: countOptions(san),
      hasCargaArchivos: !!document.getElementById('body_cargaArchivos'),
      hasNroAutorizacion: !!document.getElementById('body_txtNroAutorizacionValidada'),
      hasBtnAgregar: !!document.getElementById('body_btnAgregar'),
      hasFecha: !!document.getElementById('body_txtFecha_txtCalendario'),
      hasNombre: !!document.getElementById('body_txtNombreApellido'),
      hasDni: !!document.getElementById('body_txtDni')
    };
  }

  chrome.runtime.onMessage.addListener(function (msg, _sender, sendResponse) {
    if (!msg || !msg.type) return;

    if (msg.type === 'AFG_EVW_PING') {
      try {
        sendResponse(buildPing());
      } catch (e) {
        sendResponse({ ok: false, error: String(e && e.message || e), href: location.href });
      }
      return true;
    }
  });

  try {
    console.log('[AFG:evweb]', roleOfFrame(), location.href);
  } catch (eLog) {}
})();
