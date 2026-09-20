/**
 * Content script (all_frames) — ADAARC evweb
 * Lote 1: AFG_EVW_PING
 * Lote 2: AFG_EVW_FILL_PAMI (sin upload, sin #body_btnAgregar)
 */
(function () {
  if (window.__AFG_EVWEB_CS__) return;
  window.__AFG_EVWEB_CS__ = true;

  var IS_TOP = window === window.top;
  var FORM_HINT = /frmCargaDeIntervencion\.aspx/i;
  var PAMI_OBRA_VALUE = '382';
  var MAYO_SANATORIO_VALUE = '208';

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
      hasDni: !!document.getElementById('body_txtDni'),
      hasHora: !!document.getElementById('body_cboHora'),
      hasMinutos: !!document.getElementById('body_cboMinutos')
    };
  }

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function fireChange(el) {
    if (!el) return;
    try {
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (eIn) {}
    try {
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (eCh) {}
  }

  function setNativeSelect(el, value) {
    if (!el) return { ok: false, error: 'missing_select' };
    var want = String(value == null ? '' : value);
    var found = false;
    var i;
    for (i = 0; i < (el.options || []).length; i++) {
      if (String(el.options[i].value) === want) {
        found = true;
        break;
      }
    }
    if (!found && want.length === 1) {
      want = '0' + want;
      for (i = 0; i < (el.options || []).length; i++) {
        if (String(el.options[i].value) === want) {
          found = true;
          break;
        }
      }
    }
    if (!found) {
      return {
        ok: false,
        error: 'value_not_in_options',
        want: String(value),
        options: countOptions(el)
      };
    }
    el.value = want;
    fireChange(el);
    return { ok: true, value: want, selected: el.value };
  }

  function setTextInput(el, value) {
    if (!el) return { ok: false, error: 'missing_input' };
    var v = String(value == null ? '' : value);
    el.focus();
    el.value = v;
    fireChange(el);
    try { el.blur(); } catch (eB) {}
    return { ok: true, value: el.value };
  }

  function parseHora(hora) {
    var s = String(hora || '').trim();
    var m = s.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    var hh = m[1].length === 1 ? '0' + m[1] : m[1];
    var mm = m[2];
    return { hora: hh, minutos: mm };
  }

  /**
   * Fill PAMI — no toca cargaArchivos ni btnAgregar.
   * data: { pac, dni, fecha, hora, cirujano, afiliado?, obraSocial?, sanatorio? }
   */
  async function fillPami(data) {
    data = data || {};
    if (!hasFormSelects()) {
      return { ok: false, error: 'form_not_found', role: roleOfFrame(), href: location.href };
    }

    var steps = {};
    var obraVal = data.obraSocial != null && data.obraSocial !== ''
      ? String(data.obraSocial)
      : PAMI_OBRA_VALUE;
    var sanVal = data.sanatorio != null && data.sanatorio !== ''
      ? String(data.sanatorio)
      : MAYO_SANATORIO_VALUE;

    steps.obraSocial = setNativeSelect(document.getElementById('body_cboObraSocial'), obraVal);
    if (!steps.obraSocial.ok) {
      return { ok: false, error: 'obra_social_set_failed', steps: steps };
    }
    // Dar tiempo a JS/postback de evweb (Matrículas, etc.) tras change de obra
    await sleep(450);

    steps.sanatorios = setNativeSelect(document.getElementById('body_cboSanatorios'), sanVal);
    if (!steps.sanatorios.ok) {
      return { ok: false, error: 'sanatorio_set_failed', steps: steps };
    }
    await sleep(200);

    if (data.fecha) {
      steps.fecha = setTextInput(
        document.getElementById('body_txtFecha_txtCalendario'),
        data.fecha
      );
    } else {
      steps.fecha = { ok: false, skipped: true, error: 'missing_fecha' };
    }

    var hm = parseHora(data.hora);
    if (hm) {
      steps.hora = setNativeSelect(document.getElementById('body_cboHora'), hm.hora);
      steps.minutos = setNativeSelect(document.getElementById('body_cboMinutos'), hm.minutos);
    } else {
      steps.hora = { ok: false, skipped: true, error: 'missing_or_bad_hora' };
      steps.minutos = { ok: false, skipped: true, error: 'missing_or_bad_hora' };
    }

    steps.nombre = setTextInput(
      document.getElementById('body_txtNombreApellido'),
      data.pac || data.nombreApellido || ''
    );
    steps.dni = setTextInput(document.getElementById('body_txtDni'), data.dni || '');
    steps.cirujano = setTextInput(
      document.getElementById('body_txtCirujano'),
      data.cirujano || ''
    );

    if (data.afiliado != null && String(data.afiliado).trim() !== '') {
      steps.afiliado = setTextInput(
        document.getElementById('body_txtAfiliado'),
        data.afiliado
      );
    } else {
      steps.afiliado = { ok: true, skipped: true };
    }

    var requiredOk =
      steps.obraSocial.ok &&
      steps.sanatorios.ok &&
      steps.fecha && steps.fecha.ok &&
      steps.hora && steps.hora.ok &&
      steps.minutos && steps.minutos.ok &&
      steps.nombre && steps.nombre.ok &&
      steps.dni && steps.dni.ok &&
      steps.cirujano && steps.cirujano.ok;

    return {
      ok: !!requiredOk,
      mutual: 'pami',
      href: location.href,
      steps: steps,
      touchedBtnAgregar: false,
      touchedCargaArchivos: false,
      error: requiredOk ? null : 'fill_incomplete'
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

    if (msg.type === 'AFG_EVW_FILL_PAMI') {
      fillPami(msg.data || msg)
        .then(function (r) { sendResponse(r); })
        .catch(function (e) {
          sendResponse({ ok: false, error: String(e && e.message || e) });
        });
      return true;
    }
  });

  try {
    console.log('[AFG:evweb]', roleOfFrame(), location.href);
  } catch (eLog) {}
})();
