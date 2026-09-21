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

  /**
   * BG → executeScript world MAIN: arm endRequest + set obra + wait.
   * Si executeScript falla o no hay PageRequestManager → sleep(timeoutMs) de red de seguridad.
   */
  function setObraAndWaitViaBackground(obraVal, tabId, frameId, timeoutMs) {
    timeoutMs = timeoutMs || 4000;
    return new Promise(function (resolve) {
      try {
        chrome.runtime.sendMessage({
          type: 'AFG_EVW_SET_OBRA_AND_WAIT',
          tabId: tabId,
          frameId: frameId,
          obraVal: obraVal,
          timeoutMs: timeoutMs
        }, function (res) {
          var errMsg = chrome.runtime.lastError && chrome.runtime.lastError.message;
          if (errMsg) {
            resolve({
              ok: false,
              reason: 'executeScript_failed',
              error: errMsg
            });
            return;
          }
          resolve(res || {
            ok: false,
            reason: 'executeScript_failed',
            error: 'empty_response'
          });
        });
      } catch (e) {
        resolve({
          ok: false,
          reason: 'executeScript_failed',
          error: String(e && e.message || e)
        });
      }
    }).then(function (settle) {
      var needFallbackSleep =
        settle.reason === 'executeScript_failed' ||
        settle.reason === 'no_page_request_manager' ||
        settle.reason === 'error';
      if (settle.reason === 'executeScript_failed' || settle.reason === 'error') {
        var setRes = setNativeSelect(
          document.getElementById('body_cboObraSocial'),
          obraVal
        );
        return sleep(timeoutMs).then(function () {
          return {
            settle: Object.assign({}, settle, { fallbackSleepMs: timeoutMs }),
            obraSocial: setRes
          };
        });
      }
      if (settle.reason === 'no_obra_select' || settle.reason === 'value_not_in_options') {
        return {
          settle: settle,
          obraSocial: {
            ok: false,
            error: settle.reason,
            want: settle.want
          }
        };
      }
      var obraSocial = {
        ok: true,
        value: settle.obraValue || String(obraVal),
        selected: settle.selected,
        via: 'main'
      };
      if (needFallbackSleep) {
        return sleep(timeoutMs).then(function () {
          return {
            settle: Object.assign({}, settle, { fallbackSleepMs: timeoutMs }),
            obraSocial: obraSocial
          };
        });
      }
      return { settle: settle, obraSocial: obraSocial };
    });
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
   * data: { pac, dni, fecha, hora, cirujano, edad, afiliado, obraSocial?, sanatorio? }
   * meta: { tabId, frameId } para AFG_EVW_SET_OBRA_AND_WAIT (MAIN world).
   * Edad y Afiliado son obligatorios en el formulario (asterisco).
   */
  async function fillPami(data, meta) {
    data = data || {};
    meta = meta || {};
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

    // Atómico en MAIN (BG): arm endRequest → set obra → wait. Fallback ~4s si falla.
    var obraPack = await setObraAndWaitViaBackground(
      obraVal,
      meta.tabId,
      meta.frameId,
      4000
    );
    steps.obraSocialSettle = obraPack.settle;
    steps.obraSocial = obraPack.obraSocial;
    if (!steps.obraSocial.ok) {
      return { ok: false, error: 'obra_social_set_failed', steps: steps };
    }
    var sanEl = document.getElementById('body_cboSanatorios');
    steps.sanatorios = setNativeSelect(sanEl, sanVal);
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

    if (data.edad != null && String(data.edad).trim() !== '') {
      steps.edad = setTextInput(document.getElementById('body_txtEdad'), data.edad);
      // body_cboTipoEdad suele venir en "Años" — no tocar
    } else {
      steps.edad = { ok: false, skipped: true, error: 'missing_edad' };
    }

    if (data.afiliado != null && String(data.afiliado).trim() !== '') {
      steps.afiliado = setTextInput(
        document.getElementById('body_txtAfiliado'),
        data.afiliado
      );
    } else {
      steps.afiliado = { ok: false, skipped: true, error: 'missing_afiliado' };
    }

    var requiredOk =
      steps.obraSocial.ok &&
      steps.sanatorios.ok &&
      steps.fecha && steps.fecha.ok &&
      steps.hora && steps.hora.ok &&
      steps.minutos && steps.minutos.ok &&
      steps.nombre && steps.nombre.ok &&
      steps.dni && steps.dni.ok &&
      steps.cirujano && steps.cirujano.ok &&
      steps.edad && steps.edad.ok &&
      steps.afiliado && steps.afiliado.ok;

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

  function selfFrameId() {
    try {
      if (chrome.runtime && typeof chrome.runtime.getFrameId === 'function') {
        return chrome.runtime.getFrameId(window);
      }
    } catch (e) {}
    return null;
  }

  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (!msg || !msg.type) return;

    if (msg.type === 'AFG_EVW_PING') {
      try {
        var ping = buildPing();
        ping.receiverFrameId = selfFrameId();
        sendResponse(ping);
      } catch (e) {
        sendResponse({
          ok: false,
          error: String(e && e.message || e),
          href: location.href,
          receiverFrameId: selfFrameId()
        });
      }
      return true;
    }

    if (msg.type === 'AFG_EVW_FILL_PAMI') {
      var receiverFrameId = selfFrameId();
      var tabId = msg.targetTabId || (sender && sender.tab && sender.tab.id) || null;
      var frameId = msg.targetFrameId != null ? msg.targetFrameId : receiverFrameId;
      try {
        console.log('[AFG:evweb] AFG_EVW_FILL_PAMI received', {
          receiverFrameId: receiverFrameId,
          targetFrameId: msg.targetFrameId,
          targetTabId: msg.targetTabId,
          href: location.href,
          hasForm: hasFormSelects(),
          frameIdMatch: msg.targetFrameId == null
            ? null
            : (String(msg.targetFrameId) === String(receiverFrameId))
        });
      } catch (eLog) {}
      fillPami(msg.data || msg, { tabId: tabId, frameId: frameId })
        .then(function (r) {
          r.receiverFrameId = receiverFrameId;
          r.targetFrameId = msg.targetFrameId;
          r.frameIdMatch = msg.targetFrameId == null
            ? null
            : (String(msg.targetFrameId) === String(receiverFrameId));
          try {
            console.log('[AFG:evweb] AFG_EVW_FILL_PAMI done', {
              ok: r.ok,
              receiverFrameId: r.receiverFrameId,
              targetFrameId: r.targetFrameId,
              frameIdMatch: r.frameIdMatch,
              obraSocialSettle: r.steps && r.steps.obraSocialSettle,
              error: r.error || null
            });
          } catch (eDone) {}
          sendResponse(r);
        })
        .catch(function (e) {
          sendResponse({
            ok: false,
            error: String(e && e.message || e),
            receiverFrameId: receiverFrameId,
            targetFrameId: msg.targetFrameId,
            href: location.href
          });
        });
      return true;
    }
  });

  try {
    console.log('[AFG:evweb]', roleOfFrame(), location.href);
  } catch (eLog) {}
})();
