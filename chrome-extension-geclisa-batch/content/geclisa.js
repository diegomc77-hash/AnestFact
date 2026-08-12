/**
 * Content script (all_frames) — GECLISA Mayo
 * Paso 1–2: solo en TOP (btn-Historias Clínicas).
 * Paso 3–11: frame con #ddlUbicacion.
 * Debugger: Opciones (7), fila plantilla (10). Click normal: Evoluciones, Nuevo, Seleccionar plantilla.
 */
(function () {
  var IS_TOP = window === window.top;
  var HAS_UBICACION = !!document.getElementById('ddlUbicacion');
  var ROLE = IS_TOP ? 'top' : (HAS_UBICACION ? 'iframe' : 'other');
  var PLANTILLA_FOJA = 'FOJA ANESTESICA 01_04_2022';

  function log() {
    var args = ['[AFG:' + ROLE + ']'].concat([].slice.call(arguments));
    try { console.log.apply(console, args); } catch (e) {}
  }

  chrome.runtime.onMessage.addListener(function (msg, _sender, sendResponse) {
    if (!msg || !msg.type) return;

    if (msg.type === 'AFG_PING') {
      sendResponse({
        ok: true,
        role: ROLE,
        isTop: IS_TOP,
        hasUbicacion: !!document.getElementById('ddlUbicacion'),
        href: location.href
      });
      return true;
    }

    // Locate-only para pasos 1–2 (el click trusted lo hace background con chrome.debugger)
    if (msg.type === 'AFG_LOCATE_STEP1') {
      if (!IS_TOP) { sendResponse({ ok: false, error: 'not_top' }); return true; }
      try {
        var btn = document.getElementById('btn-Historias Clínicas')
          || document.querySelector('[id="btn-Historias Clínicas"]');
        if (!btn) throw new Error('No encontré btn-Historias Clínicas');
        try { btn.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (e) {}
        var p1 = AFG.centerPoint(btn);
        sendResponse({
          ok: true,
          step: 1,
          x: p1.x,
          y: p1.y,
          tag: btn.tagName,
          id: btn.id || null,
          w: p1.w,
          h: p1.h
        });
      } catch (e1) {
        sendResponse({ ok: false, error: String(e1.message || e1) });
      }
      return true;
    }

    if (msg.type === 'AFG_LOCATE_STEP2') {
      if (!IS_TOP) { sendResponse({ ok: false, error: 'not_top' }); return true; }
      locateStep2()
        .then(function (r) { sendResponse(r); })
        .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
      return true;
    }

    if (msg.type === 'AFG_RUN_TOP_1_2') {
      // Legacy: ya no se usa para clicks; se mantiene por si ping/debug
      if (!IS_TOP) {
        sendResponse({ ok: false, error: 'not_top' });
        return true;
      }
      sendResponse({ ok: false, error: 'use_debugger_path' });
      return true;
    }

    if (msg.type === 'AFG_RUN_IFRAME_3_11' || msg.type === 'AFG_RUN_IFRAME_3_6') {
      if (!document.getElementById('ddlUbicacion')) {
        sendResponse({ ok: false, error: 'no_ddlUbicacion' });
        return true;
      }
      runIframe311(msg.paciente || {}).then(function (r) { sendResponse(r); }).catch(function (e) {
        sendResponse({ ok: false, error: String(e.message || e) });
      });
      return true;
    }
  });

  async function locateStep2() {
    log('Locate paso 2: Historias clínicas internados');
    var sub = await AFG.waitFor(function () {
      var li = AFG.findSubItemByText(document, 'Historias clínicas internados')
        || AFG.findByExactText(document, 'Historias clínicas internados', ['li'])
        || AFG.findByContainsText(document, 'Historias clínicas internados', ['li']);
      if (!li) return null;
      var a = li.querySelector('a[href],a[routerlink],a[ng-reflect-router-link],a');
      return a || li;
    }, { label: 'submenú Historias clínicas internados', timeout: 15000 });
    try { sub.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (e) {}
    await AFG.sleep(80);
    var pt = AFG.centerPoint(sub);
    log('Paso 2 target', sub.tagName, sub.getAttribute('href') || '', 'center', pt.x, pt.y);
    return {
      ok: true,
      step: 2,
      x: pt.x,
      y: pt.y,
      w: pt.w,
      h: pt.h,
      tag: sub.tagName,
      href: sub.getAttribute('href') || null
    };
  }

  async function runIframe311(paciente) {
    var apellido = AFG.quitarAcentos(AFG.norm(paciente.apellido || ''));
    var nombre = AFG.quitarAcentos(AFG.norm(paciente.nombre || ''));
    var plantilla = AFG.norm(paciente.plantilla || PLANTILLA_FOJA);
    var fechaCirugia = AFG.formatFechaGeclisa(paciente.fechaCirugia || paciente.fecha || '');
    var horaCirugia = AFG.formatHoraGeclisa(paciente.hora || paciente.horaInicio || '');
    var sector = AFG.norm(paciente.sector || paciente.mayo_sector || '');
    if (!apellido) {
      return {
        ok: false,
        paused: true,
        reason: 'missing_apellido',
        message: 'PAUSA: foja sin apellido.'
      };
    }
    if (!fechaCirugia) {
      return {
        ok: false,
        paused: true,
        reason: 'missing_fechaCirugia',
        message: 'PAUSA: falta fechaCirugia en el payload (fecha del panel).'
      };
    }
    if (!horaCirugia) {
      return {
        ok: false,
        paused: true,
        reason: 'missing_horaInicio',
        message: 'PAUSA: falta horaInicio de cirugía en el payload (hora del panel).'
      };
    }
    if (!sector) {
      return {
        ok: false,
        paused: true,
        reason: 'missing_sector',
        message: 'PAUSA: falta Sector en la foja AnesFact (#f-mayo-sector). Elegí PRE-QUIRÚRGICO u otro sector GECLISA.'
      };
    }

    log('Paso 4: ddlUbicacion = 2 (Sanatorio Mayo)');
    var ddl = await AFG.waitFor(function () {
      return document.getElementById('ddlUbicacion');
    }, { label: '#ddlUbicacion', timeout: 20000 });
    AFG.setSelectValue(ddl, '2');
    await AFG.humanDelay();

    // SIN modal Buscar Paciente: filtros del panel + Consultar
    log('Paso 5-7a: panel Sector+Fecha+Hora + Consultar (no #btnBuscarPaciente)', fechaCirugia, horaCirugia, sector);
    var located = await locateByFechaSectorRetries(apellido, nombre, fechaCirugia, horaCirugia, sector);
    if (located.paused) return located;

    var patientRow = located.rows[0];
    var nroAtencion = extractNroAtencionFromRow(patientRow);
    log('Panel fila:', {
      nroAtencion: nroAtencion,
      sectorUsado: located.sectorUsado,
      fechaUsada: located.fechaUsada,
      horaUsada: located.horaUsada,
      filtrosProbados: located.filtrosProbados,
      fila: AFG.norm(patientRow.innerText || '').slice(0, 160)
    });

    var steps711 = await runIframe711FromRow(plantilla, patientRow, located);
    if (!steps711.ok) return steps711;

    return {
      ok: true,
      step: 'iframe_3_11_done',
      count: located.rows.length,
      nroAtencion: nroAtencion || null,
      fechaCirugia: fechaCirugia || null,
      horaInicio: horaCirugia || null,
      sector: sector || null,
      panelFecha: located.fechaUsada,
      panelHora: located.horaUsada,
      panelSector: located.sectorUsado,
      filtrosProbados: located.filtrosProbados || null,
      searchMode: 'panel_filtros_consultar',
      plantilla: plantilla,
      steps711: steps711
    };
  }

  /** Desde fila ya ubicada en el panel: Opciones -> Evoluciones -> Nuevo -> plantilla. */
  async function runIframe711FromRow(plantilla, patientRow, located) {
    log('Paso 7b: Opciones en fila del paciente (debugger)');
    var opciones = findOpcionesInRow(patientRow);
    if (!opciones) {
      await debuggerClickEl(patientRow);
      await AFG.sleep(300);
      opciones = await AFG.waitFor(function () {
        return findOpcionesControl();
      }, { label: 'Opciones tras seleccionar fila', timeout: 10000 });
    }
    log('Paso 7 target', opciones.tagName, opciones.id || '', opciones.title || opciones.getAttribute('aria-label') || '');
    await debuggerClickEl(opciones);
    await AFG.humanDelay();

    log('Paso 8: Evoluciones (button nativo)');
    var evol = await AFG.waitFor(function () {
      return AFG.findByExactText(document, 'Evoluciones', ['button', 'a', 'span', 'div'])
        || AFG.findByContainsText(document, 'Evoluciones', ['button']);
    }, { label: 'Evoluciones', timeout: 15000 });
    await AFG.clickElAsync(evol);
    await AFG.humanDelay();

    log('Paso 9: #BtnNuevoPQyA (button nativo)');
    var btnNuevo = await AFG.waitFor(function () {
      var b = document.getElementById('BtnNuevoPQyA');
      if (!b || b.disabled) return null;
      return b;
    }, { label: '#BtnNuevoPQyA', timeout: 15000 });
    await AFG.clickElAsync(btnNuevo);
    await AFG.humanDelay();

    log('Paso 10: fila plantilla (debugger)', plantilla);
    await AFG.waitFor(function () {
      return AFG.findByContainsText(document, 'Lista de Plantillas')
        || AFG.findByContainsText(document, 'Plantillas')
        || findTemplateRows(plantilla).length > 0;
    }, { label: 'modal Lista de Plantillas', timeout: 20000 });

    var tplRows = await AFG.waitFor(function () {
      var hits = findTemplateRows(plantilla);
      return hits.length ? hits : null;
    }, { label: 'filas plantilla FOJA', timeout: 15000 });

    if (tplRows.length !== 1) {
      return {
        ok: false,
        paused: true,
        reason: 'template_ambiguous_or_empty',
        count: tplRows.length,
        plantilla: plantilla,
        message: 'PAUSA: ' + tplRows.length + ' fila(s) para plantilla "' + plantilla + '". No elijo a ciegas.'
      };
    }
    await debuggerClickEl(tplRows[0]);
    await AFG.humanDelay();

    log('Paso 11: #btnSeleccionarPopup (button nativo)');
    var selTpl = await AFG.waitFor(function () {
      var b = document.getElementById('btnSeleccionarPopup');
      if (!b || b.disabled) return null;
      return b;
    }, { label: '#btnSeleccionarPopup', timeout: 15000 });
    await AFG.clickElAsync(selTpl);
    await AFG.humanDelay();

    return {
      ok: true,
      step: 'iframe_7_11_done',
      plantilla: plantilla,
      fechaUsada: located && located.fechaUsada,
      horaUsada: located && located.horaUsada,
      sectorUsado: located && located.sectorUsado,
      filtrosProbados: located && located.filtrosProbados
    };
  }

  /** Textos exactos de #ddlSector (Mayo, Ubicacion=2). */
  var GECLISA_SECTORES_FALLBACK = [
    'PISO',
    'VIP',
    'UTI',
    'UTI2',
    'UCI',
    'GUARDIA',
    'HOSPITAL DE DIA',
    'HEMODINAMIA VIRTUAL',
    'PRE-QUIRÚRGICO'
  ];

  /**
   * Panel internados: Ubicacion ya=2, set Sector+Fecha+Hora, click Consultar,
   * buscar fila por apellido/nombre. Reintentos: -1h mismo sector, luego otros sectores.
   * NO usa el modal #btnBuscarPaciente.
   */
  async function locateByFechaSectorRetries(apellido, nombre, fechaCirugia, horaInicio, sectorPrimary) {
    var fecha = AFG.formatFechaGeclisa(fechaCirugia);
    var hora0 = AFG.formatHoraGeclisa(horaInicio);
    var horaM1 = AFG.addHoursGeclisa(hora0, -1);
    var primary = AFG.norm(sectorPrimary);

    var attempts = [];
    function pushAttempt(sec, hora, label) {
      var tag = fecha + '|' + sec + '|' + (hora || '-') + '|' + label;
      for (var i = 0; i < attempts.length; i++) {
        if (attempts[i].tag === tag) return;
      }
      attempts.push({ fecha: fecha, sector: sec, hora: hora, label: label, tag: tag });
    }

    pushAttempt(primary, hora0, 'primario_consultar');
    if (horaM1 && horaM1 !== hora0) {
      pushAttempt(primary, horaM1, 'primario_hora-1_consultar');
    }
    for (var si = 0; si < GECLISA_SECTORES_FALLBACK.length; si++) {
      var sec = GECLISA_SECTORES_FALLBACK[si];
      if (sec === primary) continue;
      pushAttempt(sec, hora0, 'fallback_sector_consultar');
    }

    var tried = [];
    for (var ai = 0; ai < attempts.length; ai++) {
      var a = attempts[ai];
      tried.push(a.tag);
      log('Paso panel filtro+Consultar', a.label, a.tag);
      try {
        await setPanelFechaHoraSectorAndConsultar(a.fecha, a.hora, a.sector);
      } catch (eSet) {
        log('Paso panel no pude setear/Consultar', a.tag, String(eSet && eSet.message || eSet));
        continue;
      }

      await AFG.sleep(400);
      var empty = panelShowsNoRecords();
      var hits = findPanelPatientRows(apellido, nombre);
      log('Paso panel resultado', a.tag, 'hits=', hits.length, 'sinRegistros=', empty);

      if (hits.length > 1) {
        return {
          ok: false,
          paused: true,
          reason: 'panel_ambiguous',
          count: hits.length,
          fechaUsada: a.fecha,
          horaUsada: a.hora,
          sectorUsado: a.sector,
          filtrosProbados: tried,
          message: 'PAUSA: ' + hits.length + ' filas con ' + apellido + ' en panel (' + a.tag +
            '). Combinaciones: ' + tried.join(' -> ')
        };
      }
      if (hits.length === 1) {
        log('Paso panel encontrado con', a.tag);
        return {
          ok: true,
          rows: hits,
          fechaUsada: a.fecha,
          horaUsada: a.hora,
          sectorUsado: a.sector,
          filtrosProbados: tried
        };
      }
    }

    return {
      ok: false,
      paused: true,
      reason: 'panel_not_found',
      count: 0,
      filtrosProbados: tried,
      message: 'PAUSA: no aparece ' + apellido + ' en panel con Ubicacion/Sector/Fecha/Hora+Consultar. ' +
        'Combinaciones: ' + tried.join(' -> ')
    };
  }

  function panelShowsNoRecords() {
    var nodes = document.querySelectorAll('.ui-jqgrid-bdiv, .ui-jqgrid, body');
    for (var i = 0; i < nodes.length; i++) {
      var t = AFG.norm(nodes[i].innerText || nodes[i].textContent || '');
      if (/sin registros que mostrar/i.test(t)) return true;
    }
    return false;
  }

  /** Filas del grid principal de internados (no modal) que matchean apellido/nombre. */
  function findPanelPatientRows(apellido, nombre) {
    var ap = AFG.quitarAcentos(apellido || '').toLowerCase();
    var nm = AFG.quitarAcentos(nombre || '').toLowerCase().split(/\s+/).filter(Boolean)[0] || '';
    if (!ap) return [];
    var rows = document.querySelectorAll(
      '.ui-jqgrid-btable tbody tr.jqgrow, .ui-jqgrid-btable tbody tr'
    );
    var hits = [];
    for (var i = 0; i < rows.length; i++) {
      var tr = rows[i];
      if (tr.style && tr.style.display === 'none') continue;
      if (tr.closest && tr.closest('.modal, [role="dialog"], .ui-dialog')) continue;
      var cells = tr.querySelectorAll('td');
      if (cells.length < 2) continue;
      var txt = AFG.quitarAcentos(AFG.norm(tr.innerText || '')).toLowerCase();
      if (!txt || txt.indexOf(ap) < 0) continue;
      if (/sin registros|cargando|loading|mostrando\s+\d/i.test(txt) && cells.length < 3) continue;
      if (nm && txt.indexOf(nm) < 0) continue;
      hits.push(tr);
    }
    return hits.filter(function (el, idx, arr) { return arr.indexOf(el) === idx; });
  }

  function findConsultarButton() {
    var byId = document.getElementById('btnConsultar')
      || document.getElementById('BtnConsultar')
      || document.getElementById('btn-consultar');
    if (byId) return byId;
    var exact = AFG.findByExactText(document, 'Consultar', ['button', 'a', 'input', 'span', 'div']);
    if (exact) return exact;
    var inputs = document.querySelectorAll('input[type="button"], input[type="submit"], button');
    for (var i = 0; i < inputs.length; i++) {
      var v = AFG.norm(inputs[i].value || inputs[i].innerText || inputs[i].textContent || '');
      if (/^consultar$/i.test(v)) return inputs[i];
    }
    return null;
  }

  /** Setea #ddlSector + Fecha + Hora del panel y clickea Consultar. */
  async function setPanelFechaHoraSectorAndConsultar(fechaDDMMYYYY, horaHHMM, sectorText) {
    var ddlSector = await AFG.waitFor(function () {
      return document.getElementById('ddlSector');
    }, { label: '#ddlSector', timeout: 15000 });
    var okSec = AFG.setSelectByValueOrText(ddlSector, sectorText);
    if (!okSec) {
      throw new Error('Sector no encontrado en #ddlSector: ' + sectorText);
    }
    log('Sector panel ->', sectorText, 'value=', ddlSector.value);
    await AFG.sleep(250);

    await setPanelFechaYHora(fechaDDMMYYYY, horaHHMM);

    var btn = await AFG.waitFor(function () {
      return findConsultarButton();
    }, { label: 'boton Consultar', timeout: 10000 });
    log('Click Consultar', btn.id || btn.tagName, btn.value || AFG.norm(btn.innerText || '').slice(0, 40));
    await AFG.clickElAsync(btn);
    await waitGridStable(12000);
  }

  /** Setea Fecha/Hora del panel. */
  async function setPanelFechaYHora(fechaDDMMYYYY, horaHHMM) {
    if (fechaDDMMYYYY) {
      var inpFecha = await AFG.waitFor(function () {
        return AFG.findInputNearLabel(document, 'Fecha')
          || document.querySelector('input[id*="Fecha" i], input[name*="Fecha" i], input[id*="fecha"], input[name*="fecha"]');
      }, { label: 'input Fecha panel', timeout: 15000 });
      var beforeF = AFG.norm(inpFecha.value || '');
      await AFG.typeIntoInputAsync(inpFecha, fechaDDMMYYYY);
      commitPanelFilterInput(inpFecha);
      log('Fecha panel DOM:', beforeF, '->', inpFecha.value);
    }

    if (horaHHMM) {
      var inpHora = await AFG.waitFor(function () {
        return findPanelHoraInput();
      }, { label: 'input Hora panel', timeout: 10000 });
      var beforeH = AFG.norm(inpHora.value || '');
      await AFG.typeIntoInputAsync(inpHora, horaHHMM);
      commitPanelFilterInput(inpHora);
      log('Hora panel DOM:', beforeH, '->', inpHora.value);
    }

    await AFG.sleep(200);
  }

  function findPanelHoraInput() {
    var labels = document.querySelectorAll('label');
    for (var i = 0; i < labels.length; i++) {
      var lt = AFG.norm(labels[i].innerText || labels[i].textContent || '').toLowerCase();
      if (lt !== 'hora' && lt !== 'hora:') continue;
      var forId = labels[i].getAttribute('for');
      if (forId) {
        var byFor = document.getElementById(forId);
        if (byFor) return byFor;
      }
      var inp = labels[i].querySelector('input');
      if (inp) return inp;
    }
    var near = AFG.findInputNearLabel(document, 'Hora');
    if (near) {
      var p = AFG.norm(near.placeholder || near.name || near.id || '').toLowerCase();
      if (!/fin|inicio|gestion|cirug/.test(p) || /hora/.test(p)) return near;
    }
    return document.querySelector(
      'input[type="time"], input[id*="Hora" i]:not([id*="Fin" i]):not([id*="fin" i]), input[name*="Hora" i]'
    );
  }

  function commitPanelFilterInput(inp) {
    if (!inp) return;
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    try {
      inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      inp.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true, cancelable: true }));
    } catch (e) {}
  }

  async function waitGridStable(timeoutMs) {
    await AFG.sleep(600);
    var deadline = Date.now() + (timeoutMs || 12000);
    var lastSig = '';
    var stableSince = 0;
    while (Date.now() < deadline) {
      var sig = gridBodySignature();
      if (sig && sig === lastSig) {
        if (Date.now() - stableSince >= 800) return;
      } else {
        lastSig = sig;
        stableSince = Date.now();
      }
      await AFG.sleep(250);
    }
  }

  function gridBodySignature() {
    var rows = document.querySelectorAll('.ui-jqgrid-btable tbody tr.jqgrow, .ui-jqgrid-btable tbody tr');
    var n = 0;
    var sample = '';
    for (var i = 0; i < rows.length && n < 5; i++) {
      var t = AFG.norm(rows[i].innerText || '');
      if (!t || t.length < 3) continue;
      n++;
      sample += t.slice(0, 40) + '|';
    }
    var pager = document.querySelector('.ui-paging-info');
    var pt = pager ? AFG.norm(pager.innerText || '') : '';
    var empty = panelShowsNoRecords() ? 'EMPTY' : '';
    return n + ':' + pt + ':' + empty + ':' + sample;
  }

  /** Lee N° de Atención de una fila del modal (columna por header o patrón). */
  function extractNroAtencionFromRow(tr) {
    if (!tr) return null;
    var idx = findGridColIndex(tr, /^(n[°ºo.]?\s*)?atencion|nro\s*atenc|n.\s*atenc/);
    if (idx >= 0) {
      var cells = tr.querySelectorAll('td');
      if (cells[idx]) {
        var cell = AFG.norm(cells[idx].innerText || cells[idx].textContent || '');
        var mCell = cell.match(/(\d{4,})/);
        if (mCell) return mCell[1];
      }
    }
    var full = AFG.norm(tr.innerText || '');
    var m = full.match(/(?:n[°ºo.]?\s*)?atenci[oó]n\s*[:#]?\s*(\d{4,})/i);
    if (m) return m[1];
    var tds = tr.querySelectorAll('td');
    for (var i = 0; i < tds.length; i++) {
      var v = AFG.norm(tds[i].innerText || '');
      if (/^\d{5,}$/.test(v)) return v;
    }
    return null;
  }

  /**
   * Columna "Fecha de ingreso" del modal (ej. "05/08/2026 00:23").
   * Solo navegación del panel — NO es fechaCirugia clínica.
   */
  function extractFechaIngresoFromRow(tr) {
    if (!tr) return null;
    var raw = '';
    var idx = findGridColIndex(tr, /fecha\s*de\s*ingreso|f\.\s*ingreso|fecha\s*ingreso/);
    if (idx >= 0) {
      var cells = tr.querySelectorAll('td');
      if (cells[idx]) raw = AFG.norm(cells[idx].innerText || cells[idx].textContent || '');
    }
    if (!raw) {
      var full = AFG.norm(tr.innerText || '');
      var mLab = full.match(/fecha\s*de\s*ingreso\s*[:#]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/i);
      if (mLab) raw = mLab[1];
    }
    if (!raw) {
      var tds = tr.querySelectorAll('td');
      for (var i = 0; i < tds.length; i++) {
        var t = AFG.norm(tds[i].innerText || '');
        if (/\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\s+\d{1,2}:\d{2}/.test(t)) {
          raw = t;
          break;
        }
      }
    }
    if (!raw) return null;
    var parsed = parseFechaHoraGeclisa(raw);
    if (!parsed) return { raw: raw, fecha: null, hora: null };
    return { raw: raw, fecha: parsed.fecha, hora: parsed.hora };
  }

  function parseFechaHoraGeclisa(text) {
    var s = AFG.norm(text);
    if (!s) return null;
    var m = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::\d{2})?)?/);
    if (!m) return null;
    var dd = m[1].length === 1 ? '0' + m[1] : m[1];
    var mm = m[2].length === 1 ? '0' + m[2] : m[2];
    var yyyy = m[3];
    if (yyyy.length === 2) yyyy = '20' + yyyy;
    var fecha = dd + '/' + mm + '/' + yyyy;
    var hora = null;
    if (m[4] != null) {
      var hh = m[4].length === 1 ? '0' + m[4] : m[4];
      hora = hh + ':' + m[5];
    }
    return { fecha: fecha, hora: hora };
  }

  function findGridColIndex(tr, headerRe) {
    var grid = tr.closest('.ui-jqgrid') || tr.closest('.ui-jqgrid-view') || document;
    var ths = grid.querySelectorAll('.ui-jqgrid-htable th, thead th, .ui-th-column');
    for (var i = 0; i < ths.length; i++) {
      var ht = AFG.quitarAcentos(AFG.norm(ths[i].innerText || ths[i].textContent || '')).toLowerCase();
      if (!ht || ht.length > 48) continue;
      if (!headerRe.test(ht)) continue;
      var col = ths[i].getAttribute('id') || '';
      var m = col.match(/_(\d+)$/);
      if (m) return parseInt(m[1], 10);
      return i;
    }
    return -1;
  }

  /** Filas del panel principal de internados con ese N° Atención. */
  function findInternadoRowsByAtencion(nroAtencion) {
    var want = AFG.norm(String(nroAtencion || ''));
    if (!want) return [];
    var rows = document.querySelectorAll(
      '.ui-jqgrid-btable tbody tr.jqgrow, .ui-jqgrid-btable tbody tr'
    );
    var hits = [];
    for (var i = 0; i < rows.length; i++) {
      var tr = rows[i];
      if (tr.style && tr.style.display === 'none') continue;
      // Excluir filas del modal de búsqueda si sigue abierto
      if (tr.closest && tr.closest('.modal, [role="dialog"], .ui-dialog')) continue;
      var nro = extractNroAtencionFromRow(tr);
      if (nro && nro === want) {
        hits.push(tr);
        continue;
      }
      // Contención: el número aparece como token en la fila
      var txt = AFG.norm(tr.innerText || '');
      if (new RegExp('(?:^|\\D)' + want.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:\\D|$)').test(txt)) {
        hits.push(tr);
      }
    }
    return hits.filter(function (el, idx, arr) { return arr.indexOf(el) === idx; });
  }

  function findOpcionesInRow(tr) {
    if (!tr) return null;
    return findOpcionesControl(tr);
  }

  /** Control ☰ "Opciones" — div/generic. Si root, busca solo dentro de esa fila/alcance. */
  function findOpcionesControl(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll(
      '[title],[aria-label],div,span,a,button,i,img'
    );
    var scored = [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!el || el.offsetParent === null) continue;
      var title = AFG.norm(el.getAttribute('title') || '');
      var aria = AFG.norm(el.getAttribute('aria-label') || '');
      var txt = AFG.norm(el.innerText || el.textContent || '');
      if (txt.length > 40) continue;
      var bag = (title + ' ' + aria + ' ' + txt).toLowerCase();
      var cls = String(el.className || '').toLowerCase();
      var hit =
        title.toLowerCase() === 'opciones' ||
        aria.toLowerCase() === 'opciones' ||
        txt.toLowerCase() === 'opciones' ||
        (bag.indexOf('opciones') >= 0 && txt.length <= 20);
      if (!hit && !(cls.indexOf('fa-bars') >= 0 || cls.indexOf('hamburger') >= 0)) continue;
      var score = 0;
      if (title.toLowerCase() === 'opciones' || aria.toLowerCase() === 'opciones') score += 50;
      if (txt.toLowerCase() === 'opciones') score += 40;
      if (el.tagName === 'DIV' || el.tagName === 'SPAN' || el.tagName === 'I') score += 5;
      if (/fa-bars|hamburger|opcion/i.test(cls)) score += 10;
      if (root) score += 20;
      scored.push({ el: el, score: score });
    }
    if (!scored.length) return null;
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored[0].el;
  }

  /** Filas (tr) cuya celda menciona la plantilla FOJA (sin tildes). */
  function findTemplateRows(plantilla) {
    var want = AFG.quitarAcentos(plantilla).toLowerCase().replace(/\s+/g, ' ');
    var wantCompact = want.replace(/[_\s-]/g, '');
    var rows = document.querySelectorAll(
      '.ui-jqgrid-btable tbody tr.jqgrow, .ui-jqgrid-btable tbody tr, [role="row"], table tbody tr'
    );
    var hits = [];
    for (var i = 0; i < rows.length; i++) {
      var tr = rows[i];
      if (tr.style && tr.style.display === 'none') continue;
      var txt = AFG.quitarAcentos(AFG.norm(tr.innerText || '')).toLowerCase().replace(/\s+/g, ' ');
      if (!txt || txt.length < 5) continue;
      var compact = txt.replace(/[_\s-]/g, '');
      if (txt.indexOf(want) >= 0 || compact.indexOf(wantCompact) >= 0) {
        hits.push(tr);
        continue;
      }
      // A veces el match está solo en un gridcell
      var cells = tr.querySelectorAll('td, [role="gridcell"]');
      for (var c = 0; c < cells.length; c++) {
        var ct = AFG.quitarAcentos(AFG.norm(cells[c].innerText || '')).toLowerCase();
        if (ct.indexOf(want) >= 0 || ct.replace(/[_\s-]/g, '').indexOf(wantCompact) >= 0) {
          hits.push(tr);
          break;
        }
      }
    }
    // Dedup
    return hits.filter(function (el, idx, arr) { return arr.indexOf(el) === idx; });
  }

  /** Centro del elemento en coords del viewport TOP (para CDP Input.dispatchMouseEvent). */
  function topViewportPoint(el) {
    var r = el.getBoundingClientRect();
    var x = r.left + r.width / 2;
    var y = r.top + r.height / 2;
    var w = window;
    while (w !== w.top) {
      var frameEl = null;
      try { frameEl = w.frameElement; } catch (e) { frameEl = null; }
      if (!frameEl) break;
      var fr = frameEl.getBoundingClientRect();
      x += fr.left;
      y += fr.top;
      w = w.parent;
    }
    return { x: Math.round(x), y: Math.round(y) };
  }

  function debuggerClickEl(el) {
    try { el.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (e) {}
    var pt = topViewportPoint(el);
    log('Debugger click @', pt.x, pt.y, el.tagName, el.className && String(el.className).slice(0, 40));
    return new Promise(function (resolve, reject) {
      chrome.runtime.sendMessage({ type: 'AFG_DEBUGGER_CLICK', x: pt.x, y: pt.y }, function (res) {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!res || !res.ok) {
          reject(new Error((res && res.error) || 'debugger click failed'));
          return;
        }
        resolve(res);
      });
    });
  }

  var PAGER_RE = /mostrando\s+(\d+)\s*[-–—]\s*(\d+)\s+de\s+(\d+)/i;
  var PAGER_RE_A = /mostrando\s+(\d+)\s+a\s+(\d+)\s+de\s+(\d+)/i;
  var PAGER_RE_EN = /showing\s+(\d+)\s*[-–—to]+\s*(\d+)\s+of\s+(\d+)/i;
  var PAGER_RE_SHORT = /(\d+)\s*[-–—]\s*(\d+)\s+de\s+(\d+)/i;
  var PAGER_EMPTY_RE = /sin registros que mostrar|no hay registros|sin registros|0 registros|p[aá]gina\s+1\s+de\s+0/i;

  function parsePagerText(t) {
    if (!t) return null;
    var s = AFG.norm(t);
    if (!s) return null;
    // Solo "cargando" como texto de pager (no "Espere..." de otro lado de la app)
    if (/^(cargando|loading)(\s|\.|…|$)/i.test(s) || /^cargando datos/i.test(s)) {
      return { loading: true, text: s, total: null };
    }
    var m = s.match(PAGER_RE) || s.match(PAGER_RE_A) || s.match(PAGER_RE_EN) || s.match(PAGER_RE_SHORT);
    if (m) return { loading: false, text: m[0], total: parseInt(m[3], 10), raw: s };
    if (PAGER_EMPTY_RE.test(s)) return { loading: false, text: s, total: 0, raw: s };
    return null;
  }

  /**
   * Lee paginación jqGrid del listado de pacientes.
   * Prioridad: .ui-paging-info → .ui-jqgrid-pager → match en body.innerText.
   */
  function readPatientPager() {
    var rawSnippets = [];
    var scopes = [];
    var info = document.querySelectorAll('.ui-paging-info');
    for (var i = 0; i < info.length; i++) scopes.push(info[i]);
    var pagers = document.querySelectorAll('.ui-jqgrid-pager, .ui-jqgrid-pager *');
    for (var j = 0; j < pagers.length; j++) scopes.push(pagers[j]);
    // Contenedores típicos cerca del btable
    var near = document.querySelectorAll(
      '[id*="pager"], [id*="Pager"], [class*="pager"], [class*="Pager"]'
    );
    for (var k = 0; k < near.length; k++) scopes.push(near[k]);

    var seen = [];
    var candidates = [];
    for (var n = 0; n < scopes.length; n++) {
      var el = scopes[n];
      var t = AFG.norm(el.innerText || el.textContent || '');
      if (!t || t.length > 120) continue;
      if (seen.indexOf(t) >= 0) continue;
      seen.push(t);
      if (/mostrando|showing|registro|p[aá]gina|cargando|loading/i.test(t)) {
        rawSnippets.push(t);
      }
      var parsed = parsePagerText(t);
      if (parsed) candidates.push(parsed);
    }

    // Fallback: texto completo del body (por si el nodo está fragmentado)
    var bodyText = AFG.norm(document.body ? (document.body.innerText || '') : '');
    var bodyHit = bodyText.match(PAGER_RE) || bodyText.match(PAGER_RE_A) || bodyText.match(PAGER_RE_EN);
    if (bodyHit) {
      rawSnippets.push('BODY:' + bodyHit[0]);
      candidates.push({
        loading: false,
        text: bodyHit[0],
        total: parseInt(bodyHit[3], 10),
        raw: bodyHit[0],
        source: 'body'
      });
    } else if (PAGER_EMPTY_RE.test(bodyText)) {
      var emptyM = bodyText.match(PAGER_EMPTY_RE);
      if (emptyM) {
        rawSnippets.push('BODY:' + emptyM[0]);
        candidates.push({ loading: false, text: emptyM[0], total: 0, raw: emptyM[0], source: 'body' });
      }
    }

    // Preferir no-loading con total numérico; último match suele ser el del modal activo
    var usable = candidates.filter(function (c) { return !c.loading && typeof c.total === 'number'; });
    if (usable.length) {
      return Object.assign({ rawSnippets: rawSnippets }, usable[usable.length - 1]);
    }
    var loading = candidates.filter(function (c) { return c.loading; });
    if (loading.length) {
      return Object.assign({ rawSnippets: rawSnippets }, loading[0]);
    }
    return { loading: false, text: null, total: null, rawSnippets: rawSnippets };
  }

  /** Espera paginación estable ~1s. Loguea snippets crudos si no matchea. */
  async function waitStablePatientPager(timeoutMs) {
    var deadline = Date.now() + (timeoutMs || 20000);
    var last = null;
    var stableSince = 0;
    var STABLE_MS = 1000;
    var lastLog = 0;
    while (Date.now() < deadline) {
      var cur = readPatientPager();
      if (Date.now() - lastLog > 1500) {
        lastLog = Date.now();
        log('Pager poll:', {
          text: cur && cur.text,
          total: cur && cur.total,
          loading: cur && cur.loading,
          rawSnippets: (cur && cur.rawSnippets) || []
        });
      }
      if (cur && cur.loading) {
        last = null;
        stableSince = 0;
        await AFG.sleep(250);
        continue;
      }
      if (cur && typeof cur.total === 'number' && !isNaN(cur.total)) {
        if (last && last.text === cur.text && last.total === cur.total) {
          if (Date.now() - stableSince >= STABLE_MS) return cur;
        } else {
          last = { text: cur.text, total: cur.total };
          stableSince = Date.now();
        }
      }
      await AFG.sleep(250);
    }
    var finalRead = readPatientPager();
    log('Pager TIMEOUT dump:', finalRead);
    throw new Error(
      'Timeout esperando paginación estable. rawSnippets=' +
      JSON.stringify((finalRead && finalRead.rawSnippets) || []) +
      ' lastText=' + JSON.stringify(finalRead && finalRead.text)
    );
  }

  /** Una fila de datos del listado (no header/pager) que matchee apellido (sin tildes). */
  function findPatientResultRow(apellido, nombre) {
    var ap = AFG.quitarAcentos(apellido).toLowerCase();
    var nm = AFG.quitarAcentos(nombre || '').toLowerCase().split(/\s+/)[0] || '';
    var tables = document.querySelectorAll(
      '.ui-jqgrid-btable tbody tr, .modal table tbody tr, [role="grid"] tbody tr, table tbody tr'
    );
    var hits = [];
    for (var i = 0; i < tables.length; i++) {
      var tr = tables[i];
      if (tr.style && tr.style.display === 'none') continue;
      var cells = tr.querySelectorAll('td');
      if (cells.length < 2) continue;
      var txt = AFG.quitarAcentos(AFG.norm(tr.innerText || '')).toLowerCase();
      if (!txt || txt.indexOf(ap) < 0) continue;
      // jqGrid a veces tiene fila vacía o de carga
      if (/cargando|loading|mostrando\s+\d/i.test(txt) && cells.length < 3) continue;
      hits.push(tr);
    }
    if (hits.length === 1) return hits[0];
    if (hits.length > 1 && nm) {
      var withName = hits.filter(function (tr) {
        return AFG.quitarAcentos(AFG.norm(tr.innerText || '')).toLowerCase().indexOf(nm) >= 0;
      });
      if (withName.length === 1) return withName[0];
    }
    // Si paginación dijo 1 pero hay varias tr, preferir la visible en btable jqGrid
    var btable = document.querySelector('.ui-jqgrid-btable tbody tr.jqgrow, .ui-jqgrid-btable tbody tr');
    if (btable && AFG.quitarAcentos(AFG.norm(btable.innerText || '')).toLowerCase().indexOf(ap) >= 0) {
      return btable;
    }
    return hits.length ? hits[0] : null;
  }

  log('content listo', location.href.slice(0, 80));
})();
