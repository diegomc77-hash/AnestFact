/**
 * Patch geclisa.js: replace modal Buscar Paciente flow with panel filtros + Consultar.
 * Run: node tools/patch-geclisa-panel-consultar.mjs
 */
import fs from 'fs';

const path = 'chrome-extension-geclisa-batch/content/geclisa.js';
const s = fs.readFileSync(path, 'utf8');

const startMarker = "    log('Paso 4: ddlUbicacion = 2');";
const start = s.indexOf(startMarker);
if (start < 0) throw new Error('start not found');

let end = s.indexOf('  function extractNroAtencionFromRow(tr) {');
if (end < 0) throw new Error('end not found');
const before = s.lastIndexOf('  /**', end);
if (before > start && before < end) end = before;

const replacement = `    log('Paso 4: ddlUbicacion = 2 (Sanatorio Mayo)');
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
    var nm = AFG.quitarAcentos(nombre || '').toLowerCase().split(/\\s+/).filter(Boolean)[0] || '';
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
      if (/sin registros|cargando|loading|mostrando\\s+\\d/i.test(txt) && cells.length < 3) continue;
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

`;

// Fix double-escaped regexes written for JS source file
const fixed = replacement
  .replace('split(/\\\\s+/)', 'split(/\\s+/)')
  .replace('/mostrando\\\\s+\\\\d/i', '/mostrando\\s+\\d/i');

const out = s.slice(0, start) + fixed + s.slice(end);
fs.writeFileSync(path, out, 'utf8');

const check = fs.readFileSync(path, 'utf8');
console.log('btnBuscarPaciente', check.includes('btnBuscarPaciente'));
console.log('Consultar', check.includes('findConsultarButton'));
console.log('searchMode', check.includes('panel_filtros_consultar'));
const m = check.match(/PRE-QUIR.\\WGICO|PRE-QUIRÚRGICO/g) || check.match(/PRE-QUIR.{1,3}GICO/g);
console.log('PRE-QUIR matches', m);
if (m && m[0]) console.log('codes', [...m[0]].map((c) => c.charCodeAt(0)));
console.log('dup locate?', (check.match(/async function locateByFechaSectorRetries/g) || []).length);
console.log('len', check.length);
