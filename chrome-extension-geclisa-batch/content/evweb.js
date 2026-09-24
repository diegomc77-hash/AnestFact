/**
 * Content script (all_frames) — ADAARC evweb
 * Lote 1: AFG_EVW_PING
 * Lote 2–3: AFG_EVW_FILL_PAMI (campos; sin Finalizar)
 * Lote 4: docs.* → body_cargaArchivos (de a uno) + clasificación GridView
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
      hasGridView1: !!document.getElementById('body_GridView1'),
      hasBtnUpload: !!document.getElementById('body_btnUploadArchivo'),
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

  function setTextInput(el, value, opts) {
    opts = opts || {};
    if (!el) return { ok: false, error: 'missing_input' };
    var v = String(value == null ? '' : value);
    if (!opts.noFocus) {
      try { el.focus(); } catch (eF) {}
    }
    el.value = v;
    fireChange(el);
    try { el.blur(); } catch (eB) {}
    return { ok: true, value: el.value };
  }

  function setEvwebObesidadCheckbox(wantChecked) {
    var el = document.getElementById('body_chkObesidad');
    if (!el) return { ok: false, error: 'chkObesidad_not_found', skipped: true };
    var want = !!wantChecked;
    try {
      if (!!el.checked === want) {
        return { ok: true, checked: !!el.checked, unchanged: true };
      }
      el.checked = want;
      try { el.dispatchEvent(new Event('click', { bubbles: true })); } catch (eC) {}
      fireChange(el);
      return { ok: true, checked: !!el.checked };
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) };
    }
  }

  /** Tecleo caracter a caracter (autocomplete EVWEB no reacciona a value= sintético). */
  async function typeIntoEvwebPracticaInput(el, text) {
    if (!el) return { ok: false, error: 'missing_input' };
    var s = String(text == null ? '' : text);
    try { el.focus(); } catch (eF) {}
    el.value = '';
    fireChange(el);
    await sleep(40);
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      try {
        el.dispatchEvent(new KeyboardEvent('keydown', {
          key: ch, code: 'Key' + ch.toUpperCase(), keyCode: ch.charCodeAt(0),
          which: ch.charCodeAt(0), bubbles: true, cancelable: true
        }));
      } catch (eKd) {}
      el.value = s.slice(0, i + 1);
      try {
        el.dispatchEvent(new InputEvent('input', {
          bubbles: true, data: ch, inputType: 'insertText'
        }));
      } catch (eIn) {
        try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (eIn2) {}
      }
      try {
        el.dispatchEvent(new KeyboardEvent('keyup', {
          key: ch, code: 'Key' + ch.toUpperCase(), keyCode: ch.charCodeAt(0),
          which: ch.charCodeAt(0), bubbles: true, cancelable: true
        }));
      } catch (eKu) {}
      if (i % 3 === 2) await sleep(25);
    }
    fireChange(el);
    return { ok: true, value: el.value, length: s.length };
  }

  function listEvwebAutocompleteItems() {
    var sels = [
      '.ui-autocomplete li.ui-menu-item',
      '.ui-autocomplete .ui-menu-item',
      'ul.ui-autocomplete li',
      '[role="listbox"] [role="option"]',
      '.tt-suggestion',
      '.autocomplete-suggestion'
    ];
    var out = [];
    var seen = {};
    for (var s = 0; s < sels.length; s++) {
      var nodes = document.querySelectorAll(sels[s]);
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (!el || seen[el]) continue;
        var st = window.getComputedStyle ? window.getComputedStyle(el) : null;
        if (st && (st.display === 'none' || st.visibility === 'hidden')) continue;
        var text = String(el.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text) continue;
        seen[el] = true;
        out.push({ el: el, text: text });
      }
    }
    return out;
  }

  async function waitEvwebAutocomplete(timeoutMs) {
    timeoutMs = timeoutMs || 3500;
    var start = Date.now();
    while (Date.now() - start < timeoutMs) {
      var items = listEvwebAutocompleteItems();
      if (items.length) return items;
      await sleep(150);
    }
    return listEvwebAutocompleteItems();
  }

  /** Solo selecciona si el texto de la opción empieza con el código EVWEB exacto. */
  function pickAutocompleteByCodigoEvweb(items, codigoEvweb) {
    var code = String(codigoEvweb || '').trim();
    if (!code) return null;
    var re = new RegExp('^' + code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[-–—]\\s*', 'i');
    var re2 = new RegExp('^' + code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
    var hits = [];
    for (var i = 0; i < (items || []).length; i++) {
      var t = items[i].text || '';
      // WS: "codigo - descripcion&param1&param2" — cortar en &
      var head = t.split('&')[0].trim();
      if (re.test(head) || re2.test(head)) hits.push(items[i]);
    }
    if (hits.length === 1) return hits[0];
    return null;
  }

  function findEvwebPracticaAddButton() {
    var ids = [
      'body_btnAgregarPractica',
      'body_btnAgregar',
      'body_btnAddPractica'
    ];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el) return el;
    }
    var buttons = document.querySelectorAll('a, button, input[type="button"], input[type="submit"]');
    for (var j = 0; j < buttons.length; j++) {
      var b = buttons[j];
      var label = String(
        (b.value || '') + ' ' + (b.textContent || '') + ' ' + (b.title || '')
      ).toLowerCase();
      if (/agregar.*practic|practic.*agregar|add.*practic/i.test(label)) return b;
    }
    return null;
  }

  /**
   * Por cada práctica: escribe descripción con tecleo real.
   * Si hay codigoEvweb resuelto → elige esa opción exacta del desplegable.
   * Si no → deja el desplegable abierto (Huerta elige a mano). Nunca autoselect por texto.
   */
  async function fillEvwebPracticas(pracs, meta) {
    meta = meta || {};
    pracs = pracs || [];
    // Ticket 11a: re-chequear paciente (el form puede haber quedado de otra foja tras uploads/reload)
    var pacCheck = checkEvwebFormPacienteMatch({
      pac: meta.pac,
      dni: meta.dni,
      nombreApellido: meta.nombreApellido
    });
    if (!pacCheck.ok) {
      return {
        ok: false,
        error: pacCheck.error,
        detail: pacCheck.detail,
        attempted: 0,
        results: [],
        message: 'El formulario evweb ya tiene otro paciente cargado. Recarg\u00e1 la p\u00e1gina de ADAARC antes de continuar para no mezclar datos.'
      };
    }
    if (!pracs.length) {
      return { ok: true, skipped: true, attempted: 0, results: [] };
    }
    var input = document.getElementById('body_txtCodigoPractica');
    if (!input) {
      return { ok: false, error: 'txtCodigoPractica_not_found', attempted: 0, results: [] };
    }

    var results = [];
    var leftOpenForManual = false;

    for (var i = 0; i < pracs.length; i++) {
      var p = pracs[i] || {};
      var desc = String(p.evwebDesc || p.desc || '').trim();
      var code = p.codigoEvweb != null ? String(p.codigoEvweb).trim() : '';
      if (!desc && !code) {
        results.push({ ok: true, skipped: true, reason: 'empty_prac' });
        continue;
      }

      if (leftOpenForManual) {
        results.push({
          ok: true,
          skipped: true,
          reason: 'previous_left_open_for_manual',
          desc: desc,
          codigoEvweb: code || null
        });
        continue;
      }

      try {
        input.scrollIntoView({ block: 'center', inline: 'nearest' });
      } catch (eSc) {}

      var typeRes = await typeIntoEvwebPracticaInput(input, desc || code);
      await sleep(500);
      var items = await waitEvwebAutocomplete(4000);

      if (code) {
        var hit = pickAutocompleteByCodigoEvweb(items, code);
        if (hit && hit.el) {
          try {
            hit.el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            hit.el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            hit.el.click();
          } catch (eClick) {
            try { hit.el.click(); } catch (e2) {}
          }
          await sleep(400);
          var addBtn = findEvwebPracticaAddButton();
          if (addBtn && i < pracs.length - 1) {
            try { addBtn.click(); } catch (eAdd) {}
            await sleep(500);
          }
          results.push({
            ok: true,
            selected: true,
            codigoEvweb: code,
            desc: desc,
            optionText: hit.text.slice(0, 120),
            typed: typeRes.value,
            optionsSeen: items.length
          });
          try {
            chrome.runtime.sendMessage({
              type: 'AFG_DIAG_LOG',
              src: 'evweb',
              tag: 'prac_selected',
              detail: {
                codigoEvweb: code,
                desc: desc,
                optionText: hit.text.slice(0, 120),
                optionsSeen: items.length
              }
            }, function () { void chrome.runtime.lastError; });
          } catch (eD) {}
        } else {
          leftOpenForManual = true;
          results.push({
            ok: true,
            selected: false,
            leftOpen: true,
            reason: items.length ? 'code_not_in_dropdown' : 'dropdown_empty',
            codigoEvweb: code,
            desc: desc,
            optionsSeen: items.length,
            optionSample: items.slice(0, 5).map(function (x) { return x.text.slice(0, 80); })
          });
          try {
            chrome.runtime.sendMessage({
              type: 'AFG_DIAG_LOG',
              src: 'evweb',
              tag: 'prac_left_open',
              detail: {
                reason: items.length ? 'code_not_in_dropdown' : 'dropdown_empty',
                codigoEvweb: code,
                desc: desc,
                optionsSeen: items.length
              }
            }, function () { void chrome.runtime.lastError; });
          } catch (eD2) {}
        }
      } else {
        // Sin código: tecleamos y dejamos abierto — Huerta elige
        leftOpenForManual = true;
        results.push({
          ok: true,
          selected: false,
          leftOpen: true,
          reason: 'no_codigoEvweb',
          desc: desc,
          optionsSeen: items.length,
          optionSample: items.slice(0, 5).map(function (x) { return x.text.slice(0, 80); })
        });
        try {
          chrome.runtime.sendMessage({
            type: 'AFG_DIAG_LOG',
            src: 'evweb',
            tag: 'prac_left_open',
            detail: {
              reason: 'no_codigoEvweb',
              desc: desc,
              optionsSeen: items.length
            }
          }, function () { void chrome.runtime.lastError; });
        } catch (eD3) {}
      }
    }

    return {
      ok: true,
      attempted: pracs.length,
      results: results,
      leftOpenForManual: leftOpenForManual
    };
  }

  /** Cierra datepicker AJAX / popup del calendario de fecha (evita tapar o robar foco). */
  function closeEvwebCalendar(opts) {
    opts = opts || {};
    var closed = [];
    try {
      var calInp = document.getElementById('body_txtFecha_txtCalendario');
      if (calInp) {
        try { calInp.blur(); } catch (e1) {}
      }
    } catch (e2) {}
    try {
      var pops = document.querySelectorAll(
        '.ajax__calendar, .ajax__calendar_container, [id*="CalendarExtender"], [id*="calendar"], .ui-datepicker'
      );
      for (var i = 0; i < pops.length; i++) {
        var p = pops[i];
        if (!p) continue;
        var st = window.getComputedStyle ? window.getComputedStyle(p) : null;
        var visible = st
          ? (st.display !== 'none' && st.visibility !== 'hidden')
          : (p.style && p.style.display !== 'none');
        if (visible) {
          p.style.display = 'none';
          closed.push(p.id || p.className || 'pop');
        }
      }
    } catch (e3) {}
    try {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true
      }));
    } catch (e4) {}
    // body.click() puede interferir con el set de file + Cargar — solo si se pide
    if (opts.bodyClick) {
      try { document.body.click(); } catch (e5) {}
    }
    return { ok: true, closed: closed };
  }

  function findUploadGrid() {
    return document.getElementById('body_GridView1')
      || document.querySelector('[id$="GridView1"]')
      || document.querySelector('table[id*="GridView"]');
  }

  function countTrashRows(grid) {
    var n = 0;
    if (grid) {
      n = grid.querySelectorAll('.fa-trash, a[id*="btnEliminar"], [id*="Eliminar"]').length;
    }
    if (n) return n;
    // Fallback document-wide (por si el grid cambia de id tras AJAX)
    try {
      return document.querySelectorAll(
        '#body_GridView1 .fa-trash, [id$="GridView1"] .fa-trash, a[id*="GridView1"][id*="Eliminar"]'
      ).length;
    } catch (e) {
      return 0;
    }
  }

  function findTipoSelect(idx) {
    return document.getElementById('body_GridView1_cboTipoDocumento_' + idx)
      || document.querySelector('[id$="GridView1_cboTipoDocumento_' + idx + '"]')
      || document.querySelector('[id*="cboTipoDocumento_' + idx + '"]');
  }

  /** Índices de filas con cboTipoDocumento_N (tras reintentos puede haber varias). */
  function listTipoSelectIndices() {
    var out = [];
    var seen = {};
    var nodes = document.querySelectorAll('[id*="cboTipoDocumento_"]');
    for (var i = 0; i < nodes.length; i++) {
      var m = String(nodes[i].id || '').match(/cboTipoDocumento_(\d+)\s*$/i);
      if (!m) continue;
      var idx = Number(m[1]);
      if (!Number.isFinite(idx) || seen[idx]) continue;
      seen[idx] = true;
      out.push(idx);
    }
    out.sort(function (a, b) { return a - b; });
    return out;
  }

  function normDocFileName(s) {
    var n = String(s || '').replace(/^.*[\\/]/, '').toLowerCase().trim();
    return n;
  }

  function sameDocFileName(a, b) {
    var na = normDocFileName(a);
    var nb = normDocFileName(b);
    if (!na || !nb) return false;
    if (na === nb) return true;
    var sa = na.replace(/\.[a-z0-9]{1,5}$/i, '');
    var sb = nb.replace(/\.[a-z0-9]{1,5}$/i, '');
    return !!(sa && sb && sa === sb);
  }

  /** Nombre de archivo visible en la fila del GridView (sin depender de ids ADAARC). */
  function extractRowFileName(idx) {
    var sel = findTipoSelect(idx);
    if (!sel) return '';
    var tr = null;
    try { tr = sel.closest('tr'); } catch (eC) {}
    if (!tr) return '';
    try {
      var clone = tr.cloneNode(true);
      var kill = clone.querySelectorAll('select, option, script, style, .fa-trash');
      for (var k = 0; k < kill.length; k++) {
        try { kill[k].parentNode.removeChild(kill[k]); } catch (eRm) {}
      }
      var text = String(clone.textContent || '').replace(/\s+/g, ' ').trim();
      var m = text.match(/[\w.\-() ]+\.(pdf|jpe?g|png|bin)/i);
      if (m) return m[0].trim();
      return text.slice(0, 120);
    } catch (e) {
      return '';
    }
  }

  function isTipoPlaceholder(sel) {
    if (!sel) return true;
    var val = String(sel.value || '');
    var curText = '';
    try {
      curText = sel.options[sel.selectedIndex]
        ? String(sel.options[sel.selectedIndex].text || '')
        : '';
    } catch (eT) {}
    return !val || /clasifique|seleccione|elegir/i.test(curText);
  }

  /**
   * ¿Ya hay fila para este slot? Prioridad:
   * 1) tipo ya = 1/2/7 del slot (anest/qx pueden compartir el mismo PDF/nombre)
   * 2) misma nombre de archivo + tipo aún placeholder → solo falta clasificar
   */
  function findExistingGridSlot(slotKey, docNombre, tipoValue, claimedIdx) {
    claimedIdx = claimedIdx || {};
    var wantTipo = String(tipoValue == null ? '' : tipoValue);
    var indices = listTipoSelectIndices();
    var i;
    var sel;
    var fname;

    for (i = 0; i < indices.length; i++) {
      var idx = indices[i];
      if (claimedIdx[idx]) continue;
      sel = findTipoSelect(idx);
      if (!sel) continue;
      if (isTipoPlaceholder(sel)) continue;
      if (String(sel.value || '') === wantTipo) {
        return {
          idx: idx,
          mode: 'already_classified',
          fileName: extractRowFileName(idx),
          tipoValue: String(sel.value || '')
        };
      }
    }

    for (i = 0; i < indices.length; i++) {
      idx = indices[i];
      if (claimedIdx[idx]) continue;
      sel = findTipoSelect(idx);
      if (!sel || !isTipoPlaceholder(sel)) continue;
      fname = extractRowFileName(idx);
      if (sameDocFileName(fname, docNombre)) {
        return {
          idx: idx,
          mode: 'needs_classify',
          fileName: fname,
          tipoValue: wantTipo
        };
      }
    }

    // auth/qx/anest: fila sin clasificar cuyo option ya contiene el value pedido
    for (i = 0; i < indices.length; i++) {
      idx = indices[i];
      if (claimedIdx[idx]) continue;
      sel = findTipoSelect(idx);
      if (!sel || !isTipoPlaceholder(sel)) continue;
      var resolved = resolveTipoOptionValue(sel, slotKey, wantTipo);
      if (resolved && resolved.ok) {
        fname = extractRowFileName(idx);
        if (!docNombre || !fname || sameDocFileName(fname, docNombre)) {
          return {
            idx: idx,
            mode: 'needs_classify',
            fileName: fname,
            tipoValue: wantTipo
          };
        }
      }
    }

    return null;
  }

  function parseHora(hora) {
    var s = String(hora || '').trim();
    var m = s.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    var hh = m[1].length === 1 ? '0' + m[1] : m[1];
    var mm = m[2];
    return { hora: hh, minutos: mm };
  }

  /** Clasificación body_GridView1_cboTipoDocumento_N.
   * Values numéricos (confirmados en vivo Lote 4) + fallback por texto del option.
   */
  var EVW_DOC_TIPO = {
    anest: '1', // FOJA ANESTESICA
    qx: '2',    // FOJA QUIRURGICA
    auth: '7'   // AUTORIZACIÓN DE OBRA SOCIAL
  };
  var EVW_DOC_LABEL = {
    anest: ['foja anestesica', 'foja anestésica', 'foja de anestesia'],
    qx: ['foja quirurgica', 'foja quirúrgica', 'foja de cirugia'],
    auth: [
      'autorizacion de obra social',
      'autorización de obra social',
      'autorizacion obra',
      'autorizacion',
      'autorización',
      'documento autorizacion'
    ]
  };

  function normTipoLabel(s) {
    return String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function listSelectOptions(sel) {
    var out = [];
    if (!sel || !sel.options) return out;
    for (var i = 0; i < sel.options.length; i++) {
      out.push({
        value: String(sel.options[i].value),
        text: String(sel.options[i].text || '').trim()
      });
    }
    return out;
  }

  /** Elige value por código 1/2/7 o por texto visible del option. */
  function resolveTipoOptionValue(sel, slotKey, preferValue) {
    var opts = listSelectOptions(sel);
    var want = String(preferValue == null ? '' : preferValue);
    var i;
    for (i = 0; i < opts.length; i++) {
      if (opts[i].value === want) return { ok: true, value: opts[i].value, via: 'value' };
    }
    var labels = EVW_DOC_LABEL[slotKey] || [];
    for (i = 0; i < opts.length; i++) {
      var t = normTipoLabel(opts[i].text);
      if (!t || /clasifique|seleccione|elegir|--/.test(t)) continue;
      for (var j = 0; j < labels.length; j++) {
        if (t.indexOf(normTipoLabel(labels[j])) !== -1) {
          return { ok: true, value: opts[i].value, via: 'label', label: opts[i].text };
        }
      }
    }
    return { ok: false, error: 'tipo_option_not_found', options: opts, want: want, slot: slotKey };
  }

  async function waitTipoSelect(idx, timeoutMs) {
    timeoutMs = timeoutMs || 5000;
    var start = Date.now();
    while (Date.now() - start < timeoutMs) {
      var sel = findTipoSelect(idx);
      if (sel && sel.options && sel.options.length > 1) return sel;
      await sleep(150);
    }
    return findTipoSelect(idx);
  }

  function classifyTipoSelect(sel, slotKey, preferValue) {
    if (!sel) return { ok: false, error: 'select_not_found' };
    var resolved = resolveTipoOptionValue(sel, slotKey, preferValue);
    if (!resolved.ok) return resolved;
    var setRes = setNativeSelect(sel, resolved.value);
    if (!setRes.ok) {
      return Object.assign({ via: resolved.via }, setRes, { options: listSelectOptions(sel) });
    }
    // Verificar que no quedó en placeholder
    var curText = '';
    try {
      curText = sel.options[sel.selectedIndex]
        ? String(sel.options[sel.selectedIndex].text || '')
        : '';
    } catch (eT) {}
    if (/clasifique|seleccione|elegir/i.test(curText) || String(sel.value || '') === '') {
      return {
        ok: false,
        error: 'tipo_still_placeholder',
        selected: sel.value,
        text: curText,
        tried: resolved.value,
        options: listSelectOptions(sel)
      };
    }
    return {
      ok: true,
      value: sel.value,
      text: curText,
      via: resolved.via
    };
  }

  function classifyTipoSelectViaMain(idx, slotKey, preferValue, tabId, frameId) {
    var hints = EVW_DOC_LABEL[slotKey] || [];
    // Cliente: no colgarse si bg/executeScript no responden (0.6.20 hang)
    var CLIENT_TIMEOUT_MS = 12000;
    return new Promise(function (resolve) {
      var settled = false;
      function done(res) {
        if (settled) return;
        settled = true;
        resolve(res);
      }
      var timer = setTimeout(function () {
        done({
          ok: false,
          error: 'classify_client_timeout',
          timeoutMs: CLIENT_TIMEOUT_MS,
          idx: idx,
          slot: slotKey
        });
      }, CLIENT_TIMEOUT_MS);
      try {
        chrome.runtime.sendMessage({
          type: 'AFG_EVW_CLASSIFY_DOC_TIPO',
          tabId: tabId,
          frameId: frameId,
          idx: idx,
          preferValue: preferValue,
          slotKey: slotKey,
          labelHints: hints,
          timeoutMs: 8000
        }, function (res) {
          clearTimeout(timer);
          var err = chrome.runtime.lastError && chrome.runtime.lastError.message;
          if (err) {
            done({ ok: false, error: err });
            return;
          }
          done(res || { ok: false, error: 'empty_classify_main' });
        });
      } catch (e) {
        clearTimeout(timer);
        done({ ok: false, error: String(e && e.message || e) });
      }
    });
  }

  function setFileAndClickUploadViaMain(doc, tabId, frameId) {
    return new Promise(function (resolve) {
      try {
        chrome.runtime.sendMessage({
          type: 'AFG_EVW_SET_FILE_AND_CLICK_UPLOAD',
          tabId: tabId,
          frameId: frameId,
          dataUrl: doc && doc.data,
          nombre: doc && doc.nombre,
          tipo: doc && doc.tipo
        }, function (res) {
          var err = chrome.runtime.lastError && chrome.runtime.lastError.message;
          if (err) {
            resolve({ ok: false, error: err });
            return;
          }
          resolve(res || { ok: false, error: 'empty_upload_main' });
        });
      } catch (e) {
        resolve({ ok: false, error: String(e && e.message || e) });
      }
    });
  }

  /** Clasifica una fila ya presente en el grid (sin re-subir el archivo). */
  async function classifyRowAtIdx(idx, slotKey, tipoValue, meta) {
    meta = meta || {};
    slotKey = slotKey || '';
    var sel = await waitTipoSelect(idx, 5000);
    if (!sel) {
      return { ok: false, error: 'select_not_found', idx: idx };
    }
    var classRes;
    if (meta.tabId != null && meta.frameId != null) {
      classRes = await classifyTipoSelectViaMain(
        idx,
        slotKey,
        tipoValue,
        meta.tabId,
        meta.frameId
      );
    } else {
      classRes = classifyTipoSelect(sel, slotKey, tipoValue);
    }
    try {
      chrome.runtime.sendMessage({
        type: 'AFG_DIAG_LOG',
        src: 'evweb',
        tag: 'upload_classify',
        detail: {
          slot: slotKey,
          idx: idx,
          ok: !!(classRes && classRes.ok),
          error: classRes && classRes.error,
          reason: classRes && classRes.reason,
          value: classRes && classRes.value,
          text: classRes && classRes.text,
          via: classRes && classRes.via,
          world: classRes && classRes.world,
          existingRow: true,
          options: classRes && classRes.options
            ? classRes.options.map(function (o) { return o.value + ':' + o.text; })
            : listSelectOptions(sel).map(function (o) { return o.value + ':' + o.text; })
        }
      }, function () { void chrome.runtime.lastError; });
    } catch (eCl) {}
    if (!classRes || !classRes.ok) {
      return {
        ok: false,
        error: (classRes && classRes.error) || 'classify_failed',
        idx: idx,
        detail: classRes || null
      };
    }
    await sleep(600);
    return {
      ok: true,
      idx: idx,
      tipoValue: classRes.value,
      tipoText: classRes.text || null,
      classifyVia: classRes.via || null,
      existingRow: true
    };
  }

  /**
   * Una subida: MAIN world set File + __doPostBack/Cargar → poll filas → clasificar.
   * De a uno: la fila nueva = índice más alto.
   * #body_GridView1 a menudo no existe hasta la 1ª fila.
   */
  async function uploadOneDoc(docData, tipoValue, timeoutMs, meta, slotKey) {
    timeoutMs = timeoutMs || 20000;
    meta = meta || {};
    slotKey = slotKey || '';
    closeEvwebCalendar({ bodyClick: false });
    await sleep(50);

    var inputEl = document.getElementById('body_cargaArchivos');
    var btn = document.getElementById('body_btnUploadArchivo');
    if (!inputEl) return { ok: false, error: 'cargaArchivos_not_found' };
    if (!btn) return { ok: false, error: 'btnUpload_not_found' };

    try {
      inputEl.scrollIntoView({ block: 'center', inline: 'nearest' });
    } catch (eSc) {}

    var gridBefore = findUploadGrid();
    var before = countTrashRows(gridBefore);

    var clickRes;
    if (meta.tabId != null && meta.frameId != null) {
      clickRes = await setFileAndClickUploadViaMain(docData, meta.tabId, meta.frameId);
    } else {
      clickRes = { ok: false, error: 'missing_tab_frame_for_main_upload' };
    }
    if (!clickRes || !clickRes.ok) {
      return {
        ok: false,
        error: (clickRes && clickRes.error) || 'upload_main_failed',
        detail: clickRes || null
      };
    }

    var start = Date.now();
    var grid = gridBefore;
    var now = before;
    while (true) {
      grid = findUploadGrid() || grid;
      now = countTrashRows(grid);
      if (now > before) break;
      if (Date.now() - start > timeoutMs) {
        return {
          ok: false,
          error: 'upload_timeout',
          before: before,
          after: now,
          hadGridBefore: !!gridBefore,
          hasGridAfter: !!findUploadGrid(),
          hasInput: !!document.getElementById('body_cargaArchivos'),
          hasBtn: !!document.getElementById('body_btnUploadArchivo'),
          clickVia: clickRes.clickVia || null,
          filesLen: clickRes.filesLen,
          href: clickRes.href || null
        };
      }
      await sleep(300);
    }

    var idx = now - 1;
    await sleep(250);
    var classPack = await classifyRowAtIdx(idx, slotKey, tipoValue, meta);
    if (!classPack.ok) {
      return Object.assign({
        afterTrash: now,
        nombre: clickRes.fileName || (docData && docData.nombre),
        clickVia: clickRes.clickVia || null
      }, classPack);
    }
    return {
      ok: true,
      idx: idx,
      tipoValue: classPack.tipoValue,
      tipoText: classPack.tipoText || null,
      classifyVia: classPack.classifyVia || null,
      nombre: clickRes.fileName || (docData && docData.nombre),
      size: clickRes.fileSize || null,
      gridAppeared: !gridBefore && !!grid,
      clickVia: clickRes.clickVia || null
    };
  }

  /** Orden: anest → qx → auth. Faltantes se saltan (no error).
   * Reintento: no re-sube si el GridView ya tiene ese tipo (o fila+nombre sin clasificar).
   */
  async function uploadDocsFromPayload(docs, meta) {
    docs = docs || {};
    meta = meta || {};
    var order = ['anest', 'qx', 'auth'];
    var results = {};
    var attempted = 0;
    var failed = null;
    var claimedIdx = {};
    for (var i = 0; i < order.length; i++) {
      var key = order[i];
      var doc = docs[key];
      if (!doc || !doc.data) {
        results[key] = { ok: true, skipped: true };
        continue;
      }
      attempted += 1;
      var tipoValue = EVW_DOC_TIPO[key];
      var existing = findExistingGridSlot(key, doc.nombre, tipoValue, claimedIdx);
      var up;

      if (existing && existing.mode === 'already_classified') {
        claimedIdx[existing.idx] = true;
        up = {
          ok: true,
          skipped: true,
          skipReason: 'already_in_grid',
          idx: existing.idx,
          tipoValue: existing.tipoValue,
          nombre: existing.fileName || doc.nombre
        };
        try {
          chrome.runtime.sendMessage({
            type: 'AFG_DIAG_LOG',
            src: 'evweb',
            tag: 'upload_skip_existing',
            detail: {
              slot: key,
              idx: existing.idx,
              mode: existing.mode,
              fileName: existing.fileName || null,
              tipoValue: existing.tipoValue
            }
          }, function () { void chrome.runtime.lastError; });
        } catch (eSk) {}
      } else if (existing && existing.mode === 'needs_classify') {
        claimedIdx[existing.idx] = true;
        try {
          chrome.runtime.sendMessage({
            type: 'AFG_DIAG_LOG',
            src: 'evweb',
            tag: 'upload_skip_existing',
            detail: {
              slot: key,
              idx: existing.idx,
              mode: existing.mode,
              fileName: existing.fileName || null,
              tipoValue: tipoValue
            }
          }, function () { void chrome.runtime.lastError; });
        } catch (eSk2) {}
        up = await classifyRowAtIdx(existing.idx, key, tipoValue, meta);
        if (up && up.ok) {
          up.skipped = true;
          up.skipReason = 'classify_only';
          up.nombre = existing.fileName || doc.nombre;
        }
      } else {
        up = await uploadOneDoc(doc, tipoValue, 20000, meta, key);
        if (up && up.ok && up.idx != null) claimedIdx[up.idx] = true;
      }

      results[key] = up;
      if (!up.ok) {
        failed = { slot: key, error: up.error || 'upload_failed', detail: up };
        break;
      }
      await sleep(400);
    }
    return {
      ok: !failed,
      attempted: attempted,
      failed: failed,
      results: results
    };
  }

  /**
   * Fill formulario evweb (PAMI/IOSFA/…) — Lote 4: + docs a body_cargaArchivos.
   * No toca #body_btnAgregar (Finalizar).
   * data: { pac, dni, fecha, hora, cirujano, edad, afiliado, obraSocial?, sanatorio?, docs? }
   * meta: { tabId, frameId } para AFG_EVW_SET_OBRA_AND_WAIT (MAIN world).
   */
  function evwDigits(v) {
    return String(v == null ? '' : v).replace(/\D+/g, '');
  }

  /**
   * Evita mezclar datos de dos pacientes: si el form ya tiene un DNI/nombre
   * cargado (de una carga anterior sin cerrar) y no coincide con el paciente
   * que se va a llenar ahora, aborta en vez de pisar/sumar encima.
   */
  function checkEvwebFormPacienteMatch(data) {
    var dniEl = document.getElementById('body_txtDni');
    var nomEl = document.getElementById('body_txtNombreApellido');
    var curDni = evwDigits(dniEl && dniEl.value);
    var curNom = String((nomEl && nomEl.value) || '').trim();
    if (!curDni && !curNom) {
      return { ok: true };
    }
    var wantDni = evwDigits(data.dni);
    var wantNom = String(data.pac || data.nombreApellido || '').trim();
    var dniMatches = !curDni || !wantDni || curDni === wantDni;
    var nomMatches = !curNom || !wantNom || curNom === wantNom;
    if (dniMatches && nomMatches) {
      return { ok: true };
    }
    return {
      ok: false,
      error: 'form_paciente_distinto',
      detail: { curDni: curDni, curNom: curNom, wantDni: wantDni, wantNom: wantNom }
    };
  }

  async function fillPami(data, meta) {
    data = data || {};
    meta = meta || {};
    if (!hasFormSelects()) {
      return { ok: false, error: 'form_not_found', role: roleOfFrame(), href: location.href };
    }
    var pacCheck = checkEvwebFormPacienteMatch(data);
    if (!pacCheck.ok) {
      return {
        ok: false,
        error: pacCheck.error,
        detail: pacCheck.detail,
        message: 'El formulario evweb ya tiene otro paciente cargado. Recarg\u00e1 la p\u00e1gina de ADAARC antes de continuar para no mezclar datos.'
      };
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
      // noFocus: el focus abre el calendario AJAX y tapa la zona de docs
      steps.fecha = setTextInput(
        document.getElementById('body_txtFecha_txtCalendario'),
        data.fecha,
        { noFocus: true }
      );
      closeEvwebCalendar({ bodyClick: false });
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

    // Obesidad mórbida — checkbox body_chkObesidad (antes de uploads; sobrevive reload)
    steps.obesidad = setEvwebObesidadCheckbox(!!data.obesidadMorbida);

    // Prácticas: aparte (AFG_EVW_FILL_PRACS) DESPUÉS de uploads — el reload las borraría
    if (data.skipPracs || meta.skipPracs) {
      steps.pracs = { ok: true, deferred: true, reason: 'after_uploads' };
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

    var touchedCarga = false;
    if (requiredOk) {
      closeEvwebCalendar({ bodyClick: false });
      await sleep(100);
      // Uploads se hacen en background.js (sobreviven __doPostBack → reload real).
      // Si el CS los hace acá, muere el canal FILL_PAMI → "message channel closed".
      if (data.skipUploads || meta.skipUploads) {
        steps.uploads = { ok: true, deferred: true, reason: 'bg_owns_uploads' };
        touchedCarga = false;
      } else {
        try {
          chrome.runtime.sendMessage({
            type: 'AFG_DIAG_LOG',
            src: 'evweb',
            tag: 'upload_begin',
            detail: {
              docsKeys: data.docs ? Object.keys(data.docs) : [],
              hasData: data.docs
                ? ['anest', 'qx', 'auth'].filter(function (k) {
                  return !!(data.docs[k] && data.docs[k].data);
                })
                : [],
              hasGrid: !!findUploadGrid(),
              hasCargaArchivos: !!document.getElementById('body_cargaArchivos'),
              hasBtnUpload: !!document.getElementById('body_btnUploadArchivo'),
              tabId: meta.tabId || null,
              frameId: meta.frameId != null ? meta.frameId : null
            }
          }, function () { void chrome.runtime.lastError; });
        } catch (eUp0) {}
        steps.uploads = await uploadDocsFromPayload(data.docs || {}, {
          tabId: meta.tabId,
          frameId: meta.frameId
        });
        touchedCarga = !!(steps.uploads && steps.uploads.attempted > 0);
        try {
          chrome.runtime.sendMessage({
            type: 'AFG_DIAG_LOG',
            src: 'evweb',
            tag: 'upload_done',
            detail: {
              ok: !!(steps.uploads && steps.uploads.ok),
              attempted: steps.uploads && steps.uploads.attempted,
              failed: steps.uploads && steps.uploads.failed,
              results: steps.uploads && steps.uploads.results
                ? Object.keys(steps.uploads.results).reduce(function (acc, k) {
                  var r = steps.uploads.results[k];
                  acc[k] = r
                    ? {
                      ok: r.ok,
                      skipped: !!r.skipped,
                      error: r.error || null,
                      size: r.size || null,
                      gridAppeared: !!r.gridAppeared,
                      clickVia: r.clickVia || null,
                      tipoValue: r.tipoValue || null,
                      tipoText: r.tipoText || null,
                      classifyVia: r.classifyVia || null
                    }
                    : null;
                  return acc;
                }, {})
                : null
            }
          }, function () { void chrome.runtime.lastError; });
        } catch (eUp1) {}
        if (steps.uploads && !steps.uploads.ok) {
          requiredOk = false;
        }
      }
    } else {
      steps.uploads = { ok: true, skipped: true, reason: 'fields_incomplete' };
    }

    closeEvwebCalendar({ bodyClick: true });

    return {
      ok: !!requiredOk,
      mutual: 'evweb',
      href: location.href,
      steps: steps,
      touchedBtnAgregar: false,
      touchedCargaArchivos: touchedCarga,
      error: requiredOk
        ? null
        : (steps.uploads && steps.uploads.failed
          ? ('upload_failed:' + steps.uploads.failed.slot)
          : 'fill_incomplete')
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
        chrome.runtime.sendMessage({
          type: 'AFG_DIAG_LOG',
          src: 'evweb',
          tag: 'AFG_EVW_PING_received',
          detail: { href: location.href, role: roleOfFrame() }
        }, function () { void chrome.runtime.lastError; });
      } catch (eD) {}
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
        chrome.runtime.sendMessage({
          type: 'AFG_DIAG_LOG',
          src: 'evweb',
          tag: 'AFG_EVW_FILL_PAMI_received',
          detail: {
            href: location.href,
            role: roleOfFrame(),
            receiverFrameId: receiverFrameId,
            targetFrameId: msg.targetFrameId,
            hasForm: hasFormSelects()
          }
        }, function () { void chrome.runtime.lastError; });
      } catch (eD2) {}
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
      fillPami(msg.data || msg, {
        tabId: tabId,
        frameId: frameId,
        skipPracs: !!(msg.data && msg.data.skipPracs)
      })
        .then(function (r) {
          r.receiverFrameId = receiverFrameId;
          r.targetFrameId = msg.targetFrameId;
          r.frameIdMatch = msg.targetFrameId == null
            ? null
            : (String(msg.targetFrameId) === String(receiverFrameId));
          try {
            chrome.runtime.sendMessage({
              type: 'AFG_DIAG_LOG',
              src: 'evweb',
              tag: 'AFG_EVW_FILL_PAMI_done',
              detail: {
                ok: r.ok,
                error: r.error || null,
                obraSocialSettle: r.steps && r.steps.obraSocialSettle,
                obesidad: r.steps && r.steps.obesidad,
                pracsAttempted: r.steps && r.steps.pracs && r.steps.pracs.attempted,
                pracsLeftOpen: r.steps && r.steps.pracs && r.steps.pracs.leftOpenForManual,
                touchedCargaArchivos: !!r.touchedCargaArchivos,
                uploadsAttempted: r.steps && r.steps.uploads && r.steps.uploads.attempted,
                uploadsOk: r.steps && r.steps.uploads && r.steps.uploads.ok
              }
            }, function () { void chrome.runtime.lastError; });
          } catch (eD3) {}
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

    if (msg.type === 'AFG_EVW_FILL_PRACS') {
      var pracs = (msg.pracs || (msg.data && msg.data.pracs) || []);
      var obesidadWant = msg.obesidadMorbida;
      if (obesidadWant == null && msg.data) obesidadWant = msg.data.obesidadMorbida;
      var expectedPac = msg.pac != null ? msg.pac : (msg.data && msg.data.pac);
      var expectedDni = msg.dni != null ? msg.dni : (msg.data && msg.data.dni);
      // Ticket 11a: abortar antes de obesidad/prácticas si el form tiene otro paciente
      var prePac = checkEvwebFormPacienteMatch({ pac: expectedPac, dni: expectedDni });
      if (!prePac.ok) {
        sendResponse({
          ok: false,
          error: prePac.error,
          detail: prePac.detail,
          message: 'El formulario evweb ya tiene otro paciente cargado. Recarg\u00e1 la p\u00e1gina de ADAARC antes de continuar para no mezclar datos.'
        });
        return true;
      }
      var obesidadStep = null;
      if (obesidadWant != null) {
        obesidadStep = setEvwebObesidadCheckbox(!!obesidadWant);
      }
      fillEvwebPracticas(pracs, {
        tabId: msg.targetTabId || (sender && sender.tab && sender.tab.id) || null,
        frameId: msg.targetFrameId != null ? msg.targetFrameId : selfFrameId(),
        pac: expectedPac,
        dni: expectedDni
      })
        .then(function (r) {
          r = r || {};
          r.obesidad = obesidadStep;
          try {
            chrome.runtime.sendMessage({
              type: 'AFG_DIAG_LOG',
              src: 'evweb',
              tag: 'AFG_EVW_FILL_PRACS_done',
              detail: {
                ok: !!(r && r.ok),
                attempted: r && r.attempted,
                leftOpen: r && r.leftOpenForManual,
                obesidad: obesidadStep,
                results: r && r.results
                  ? r.results.map(function (x) {
                    return {
                      ok: x.ok,
                      selected: !!x.selected,
                      leftOpen: !!x.leftOpen,
                      reason: x.reason || null,
                      codigoEvweb: x.codigoEvweb || null
                    };
                  })
                  : null
              }
            }, function () { void chrome.runtime.lastError; });
          } catch (eD) {}
          sendResponse(r || { ok: false, error: 'empty_pracs' });
        })
        .catch(function (e) {
          sendResponse({ ok: false, error: String(e && e.message || e), obesidad: obesidadStep });
        });
      return true;
    }
  });

  try {
    console.log('[AFG:evweb]', roleOfFrame(), location.href);
  } catch (eLog) {}
})();
