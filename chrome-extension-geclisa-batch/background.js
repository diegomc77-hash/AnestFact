/**
 * Orquesta pasos 1–11.
 * Debugger: 1–2, fila paciente, Opciones (7), fila plantilla (10).
 * Click normal: lupa, Buscar, Evoluciones, Nuevo, Seleccionar plantilla.
 * detach SIEMPRE en finally (éxito, error o timeout).
 */
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg && (msg.type === 'AFG_START_1_11' || msg.type === 'AFG_START_1_6')) {
    resolvePaciente(msg.paciente || {})
      .then(function (resolved) {
        if (!resolved.ok) {
          sendResponse(resolved);
          return null;
        }
        return run111(resolved.paciente).then(function (r) {
          r.fechaSource = resolved.source;
          r.paciente = resolved.paciente;
          return r;
        });
      })
      .then(function (r) { if (r) sendResponse(r); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }

  if (msg && msg.type === 'AFG_RESOLVE_PACIENTE') {
    resolvePaciente(msg.paciente || {})
      .then(function (r) { sendResponse(r); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }

  // Click trusted mientras el debugger sigue attached (fila jqGrid / Seleccionar en iframe)
  if (msg && msg.type === 'AFG_DEBUGGER_CLICK') {
    var tabId = sender && sender.tab && sender.tab.id;
    if (!tabId) {
      sendResponse({ ok: false, error: 'no_tab' });
      return true;
    }
    debuggerClick(tabId, msg.x, msg.y)
      .then(function () { sendResponse({ ok: true, x: msg.x, y: msg.y }); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }

  // Bridge AnesFact: foja publicada (ya guardada en storage por el content script)
  if (msg && msg.type === 'AFG_FOJA_READY') {
    try {
      console.log('[AFG bg] FOJA_READY', msg.foja && msg.foja.apellido, msg.foja && msg.foja.nombre);
    } catch (e) {}
    sendResponse({ ok: true });
    return false;
  }

  // Popup/Actualizar: leer localStorage de la pestaña AnesFact (origen correcto) → chrome.storage
  if (msg && msg.type === 'AFG_PULL_ANESFACT_FOJA') {
    pullFojaFromAnesFactTabs()
      .then(function (r) { sendResponse(r); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }

  if (msg && msg.type === 'AFG_PULL_GECLISA_QUEUE') {
    pullQueueFromAnesFactTabs()
      .then(function (r) { sendResponse(r); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }

  /**
   * Mint on-demand: background → content script AnesFact → page afMintGeclisaToken.
   */
  if (msg && msg.type === 'AFG_MINT_TOKEN_FOR_FOJA') {
    mintTokenViaAnesFactBridge(msg.intervId || msg.id, msg.timeoutMs)
      .then(function (r) { sendResponse(r); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }

  // Runner de cola (pieza 3): mint → run111 → pausa awaiting_save
  if (msg && msg.type === 'AFG_QUEUE_GET_STATE') {
    getRunnerState()
      .then(function (r) { sendResponse({ ok: true, state: r }); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }
  if (msg && msg.type === 'AFG_QUEUE_START') {
    runQueueAction('start')
      .then(function (r) { sendResponse(r); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }
  if (msg && msg.type === 'AFG_QUEUE_NEXT') {
    runQueueAction('next')
      .then(function (r) { sendResponse(r); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }
  if (msg && msg.type === 'AFG_QUEUE_RETRY') {
    runQueueAction('retry')
      .then(function (r) { sendResponse(r); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }
  if (msg && msg.type === 'AFG_QUEUE_ABORT') {
    runQueueAction('abort')
      .then(function (r) { sendResponse(r); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }

  // Reusar pestaña GECLISA existente; solo crear si no hay ninguna
  if (msg && msg.type === 'AFG_OPEN_GECLISA') {
    focusOrOpenGeclisaTab()
      .then(function (r) { sendResponse(r); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }
});

/** Lock para no solapar dos run111 de cola. */
var queueRunnerBusy = false;

var ANESFACT_TAB_URLS = [
  'https://diegomc77-hash.github.io/*',
  'http://localhost/*',
  'http://127.0.0.1/*'
];

/**
 * El popup NO puede leer localStorage de AnesFact (otro origen / no es una pestaña).
 * Acá: buscar pestañas AnesFact → executeScript lee afg_pending_batch → chrome.storage.
 */
async function pullFojaFromAnesFactTabs() {
  var tabs = await chrome.tabs.query({ url: ANESFACT_TAB_URLS });
  if (!tabs || !tabs.length) {
    return {
      ok: false,
      error: 'no_anesfact_tab',
      message: 'No hay pestaña AnesFact abierta (GitHub Pages o localhost).'
    };
  }
  var best = null;
  var inspected = [];
  for (var i = 0; i < tabs.length; i++) {
    var tab = tabs[i];
    try {
      var results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function () {
          try {
            var raw = localStorage.getItem('afg_pending_batch');
            if (!raw) return { href: location.href, raw: null };
            return { href: location.href, raw: raw, parsed: JSON.parse(raw) };
          } catch (e) {
            return { href: location.href, error: String(e && e.message || e) };
          }
        }
      });
      var row = results && results[0] && results[0].result;
      inspected.push({ tabId: tab.id, url: tab.url, row: row });
      if (row && row.parsed && row.parsed.token) {
        var cand = row.parsed;
        if (!best || (cand.updatedAt || 0) >= (best.updatedAt || 0)) {
          best = cand;
          best._fromTabId = tab.id;
          best._fromHref = row.href || tab.url;
        }
      }
    } catch (eTab) {
      inspected.push({ tabId: tab.id, url: tab.url, error: String(eTab.message || eTab) });
    }
  }
  if (!best) {
    return {
      ok: false,
      error: 'no_pending_batch',
      message: 'Pestaña AnesFact abierta pero sin afg_pending_batch (tocá Enviar a GECLISA).',
      inspected: inspected
    };
  }
  var foja = {
    token: String(best.token),
    apellido: String(best.apellido || '').trim(),
    nombre: String(best.nombre || '').trim(),
    dni: String(best.dni || '').trim(),
    fechaCirugia: best.fechaCirugia || '',
    horaInicio: best.horaInicio || best.hora || '',
    horaFin: best.horaFin || '',
    sector: String(best.sector || best.mayo_sector || '').trim(),
    mayo_cama: best.mayo_cama || '',
    pac: best.pac || '',
    clave: best.clave || '',
    updatedAt: best.updatedAt || Date.now()
  };
  var meta = {
    via: 'pull_tab_localStorage',
    href: best._fromHref || '',
    tabId: best._fromTabId,
    at: Date.now()
  };
  var payload = {
    afg_current_foja: foja,
    afg_geclisa_token: foja.token,
    afg_bridge_meta: meta
  };
  try { await chrome.storage.local.set(payload); } catch (eL) {}
  try { await chrome.storage.session.set(payload); } catch (eS) {}
  return { ok: true, source: 'anesfact_tab', foja: foja, meta: meta, inspected: inspected };
}

async function findAnesFactTabs() {
  return chrome.tabs.query({ url: ANESFACT_TAB_URLS });
}

/** Lee afg_geclisa_queue desde pestaña AnesFact → chrome.storage. */
async function pullQueueFromAnesFactTabs() {
  var tabs = await findAnesFactTabs();
  if (!tabs || !tabs.length) {
    return {
      ok: false,
      error: 'no_anesfact_tab',
      message: 'No hay pestaña AnesFact abierta.'
    };
  }
  var best = null;
  var inspected = [];
  for (var i = 0; i < tabs.length; i++) {
    var tab = tabs[i];
    try {
      var results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function () {
          try {
            var raw = localStorage.getItem('afg_geclisa_queue');
            if (!raw) return { href: location.href, raw: null };
            return { href: location.href, raw: raw, parsed: JSON.parse(raw) };
          } catch (e) {
            return { href: location.href, error: String(e && e.message || e) };
          }
        }
      });
      var row = results && results[0] && results[0].result;
      inspected.push({ tabId: tab.id, url: tab.url, row: row });
      if (row && row.parsed && Array.isArray(row.parsed.items)) {
        var cand = row.parsed;
        if (!best || (cand.updatedAt || 0) >= (best.updatedAt || 0) ||
            (cand.version || 0) > (best.version || 0)) {
          best = cand;
          best._fromTabId = tab.id;
        }
      }
    } catch (eTab) {
      inspected.push({ tabId: tab.id, url: tab.url, error: String(eTab.message || eTab) });
    }
  }
  if (!best) {
    // fallback storage
    try {
      var sess = await chrome.storage.session.get(['afg_geclisa_queue']);
      if (sess.afg_geclisa_queue && Array.isArray(sess.afg_geclisa_queue.items)) {
        return { ok: true, source: 'session_storage', queue: sess.afg_geclisa_queue, inspected: inspected };
      }
    } catch (eS) {}
    try {
      var loc = await chrome.storage.local.get(['afg_geclisa_queue']);
      if (loc.afg_geclisa_queue && Array.isArray(loc.afg_geclisa_queue.items)) {
        return { ok: true, source: 'local_storage', queue: loc.afg_geclisa_queue, inspected: inspected };
      }
    } catch (eL) {}
    return {
      ok: false,
      error: 'no_queue',
      message: 'Sin cola en AnesFact (agregá fojas con “Agregar a cola GECLISA”).',
      inspected: inspected
    };
  }
  var queue = {
    version: Number(best.version) || 1,
    updatedAt: best.updatedAt || Date.now(),
    items: best.items
  };
  var payload = {
    afg_geclisa_queue: queue,
    afg_queue_meta: { via: 'pull_tab', tabId: best._fromTabId, at: Date.now() }
  };
  try { await chrome.storage.local.set(payload); } catch (e1) {}
  try { await chrome.storage.session.set(payload); } catch (e2) {}
  return { ok: true, source: 'anesfact_tab', queue: queue, inspected: inspected };
}

/**
 * Pide mint al content script de AnesFact (page world hace el RPC).
 */
async function mintTokenViaAnesFactBridge(intervId, timeoutMs) {
  if (!intervId) return { ok: false, error: 'missing_intervId' };
  var tabs = await findAnesFactTabs();
  if (!tabs || !tabs.length) {
    return {
      ok: false,
      error: 'no_anesfact_tab',
      message: 'Abrí AnesFact (logueado) para mintear el token.'
    };
  }
  // Preferir pestaña con cola / batch
  var tab = tabs[0];
  var lastErr = null;
  for (var i = 0; i < tabs.length; i++) {
    tab = tabs[i];
    try {
      var res = await chrome.tabs.sendMessage(tab.id, {
        type: 'AFG_MINT_TOKEN_FOR_FOJA',
        intervId: String(intervId),
        timeoutMs: timeoutMs || 45000
      });
      if (res && res.ok) {
        try {
          console.log('[AFG bg] mint ok', intervId, res.foja && res.foja.apellido, 'tokenLen', res.tokenLen);
        } catch (e) {}
        return Object.assign({ tabId: tab.id }, res);
      }
      lastErr = res || { ok: false, error: 'empty_mint_response' };
    } catch (eTab) {
      lastErr = { ok: false, error: String(eTab.message || eTab) };
    }
  }
  return lastErr || { ok: false, error: 'mint_failed' };
}

/** Enfoca pestaña GECLISA abierta; si no hay, crea una sola. Evita N ventanas nuevas. */
async function focusOrOpenGeclisaTab() {
  var urlPattern = 'http://sanatoriomayo.myvnc.com:84/*';
  var tabs = await chrome.tabs.query({ url: urlPattern });
  if (tabs && tabs.length) {
    var tab = tabs.find(function (t) { return t.active; }) || tabs[0];
    await chrome.tabs.update(tab.id, { active: true });
    if (tab.windowId != null) {
      try { await chrome.windows.update(tab.windowId, { focused: true }); } catch (e) {}
    }
    return { ok: true, reused: true, tabId: tab.id, count: tabs.length };
  }
  var created = await chrome.tabs.create({
    url: 'http://sanatoriomayo.myvnc.com:84/',
    active: true
  });
  return { ok: true, reused: false, tabId: created.id, count: 0 };
}

/**
 * Fixtures de prueba (fecha desde AnesFact sync / anesfact_datos).
 * En producción la cola AnesFact escribe chrome.storage.session afg_current_foja.
 */
var TEST_FOJA_BY_KEY = {
  // DNI 12812343 — sync Huerta + puente GECLISA clave 12812343 (fechaCirugia 2026-08-07)
  // Solo datos clínicos de foja. Fecha de ingreso del panel = columna del modal GECLISA (paso 6).
  'bescos': {
    apellido: 'Bescos',
    nombre: 'Daniel Alfredo',
    pac: 'Bescos Daniel',
    dni: '12812343',
    fechaCirugia: '2026-08-07',
    horaInicio: '10:00'
  },
  '12812343': {
    apellido: 'Bescos',
    nombre: 'Daniel Alfredo',
    dni: '12812343',
    fechaCirugia: '2026-08-07',
    horaInicio: '10:00'
  },
  'ferreyra': {
    apellido: 'Ferreyra',
    nombre: 'Maximiliano',
    pac: 'ferreyra maximiliano',
    dni: '35870193',
    fechaCirugia: '2026-07-31',
    horaInicio: '12:30'
  },
  '35870193': {
    apellido: 'Ferreyra',
    nombre: 'Maximiliano',
    dni: '35870193',
    fechaCirugia: '2026-07-31',
    horaInicio: '12:30'
  },
  'lucero': {
    apellido: 'Lucero',
    nombre: 'Joaquín Jesús',
    pac: 'Lucero Joaquin',
    fechaCirugia: null,
    horaInicio: null
  }
};

function normKey(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Misma regla que AnesFact afSplitPacienteNombre: coma → resto; sin coma → 1er token apellido. */
function splitPacienteNombre(pac) {
  var raw = String(pac || '').trim();
  if (!raw) return { apellido: '', nombre: '' };
  if (raw.indexOf(',') >= 0) {
    var parts = raw.split(',');
    return {
      apellido: (parts[0] || '').trim(),
      nombre: parts.slice(1).join(',').replace(/\s+/g, ' ').trim()
    };
  }
  var words = raw.split(/\s+/).filter(Boolean);
  return {
    apellido: words[0] || '',
    nombre: words.slice(1).join(' ')
  };
}

/** Elige el nombre más completo (mismo prefijo de tokens o vacío vs lleno). */
function preferRicherNombre(a, b) {
  var na = String(a || '').replace(/\s+/g, ' ').trim();
  var nb = String(b || '').replace(/\s+/g, ' ').trim();
  if (!na) return nb;
  if (!nb) return na;
  if (na.toLowerCase() === nb.toLowerCase()) return na.length >= nb.length ? na : nb;
  var la = na.toLowerCase();
  var lb = nb.toLowerCase();
  if (lb.indexOf(la) === 0 && (lb.length === la.length || lb.charAt(la.length) === ' ')) return nb;
  if (la.indexOf(lb) === 0 && (la.length === lb.length || la.charAt(lb.length) === ' ')) return na;
  return na.length >= nb.length ? na : nb;
}

/** Mapea foja AnesFact / payload GECLISA. Panel: fechaCirugia + sector (no fecha ingreso). */
function fojaToPaciente(foja) {
  if (!foja || typeof foja !== 'object') return null;
  var fechaCirugia = foja.fechaCirugia || foja.fecha_cirugia || foja.fecha || '';
  var fechaIngreso = foja.fechaIngreso || foja.fechaInternacion || foja.fecha_ingreso
    || foja.fechaInternacionAt || foja.ingreso || '';
  var horaIngreso = foja.horaIngreso || foja.horaInternacion || foja.hora_ingreso || '';
  var horaCirugia = foja.horaInicio || foja.hora || foja.hora_inicio || '';
  var sector = foja.sector || foja.mayo_sector || '';
  var apellido = foja.apellido || '';
  var nombre = foja.nombre || '';
  var pac = String(foja.pac || '').trim();
  // pac es la fuente de verdad cuando está; puede ser más completo que apellido/nombre ya partidos
  if (pac) {
    var fromPac = splitPacienteNombre(pac);
    if (fromPac.apellido) {
      if (!apellido || apellido.replace(/\s+/g, ' ').trim().toLowerCase() === fromPac.apellido.toLowerCase()) {
        apellido = fromPac.apellido;
      }
      nombre = preferRicherNombre(nombre, fromPac.nombre);
    }
  }
  // Defensa: "BESCOS DANIEL" en apellido y nombre vacío
  if (apellido && !nombre && /\s/.test(apellido)) {
    var apParts = apellido.trim().split(/\s+/);
    apellido = apParts[0];
    nombre = apParts.slice(1).join(' ');
  }
  return {
    apellido: String(apellido || '').trim(),
    nombre: String(nombre || '').trim(),
    pac: pac,
    fechaCirugia: fechaCirugia,
    fechaIngreso: fechaIngreso,
    horaIngreso: horaIngreso,
    hora: horaCirugia,
    sector: String(sector || '').trim(),
    dni: foja.dni || '',
    plantilla: foja.plantilla || null,
    token: foja.token || ''
  };
}

function formatHoraHHMM(hora) {
  var s = String(hora || '').trim();
  if (!s) return '';
  var m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (m) {
    var hh = m[1].length === 1 ? '0' + m[1] : m[1];
    return hh + ':' + m[2];
  }
  return s;
}

function formatFechaDDMMYYYY(fecha) {
  var s = String(fecha || '').trim();
  if (!s) return '';
  var iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[3] + '/' + iso[2] + '/' + iso[1];
  var dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy) {
    var dd = dmy[1].length === 1 ? '0' + dmy[1] : dmy[1];
    var mm = dmy[2].length === 1 ? '0' + dmy[2] : dmy[2];
    return dd + '/' + mm + '/' + dmy[3];
  }
  return s;
}

/**
 * Prioridad fecha:
 * 1) foja en chrome.storage.session (cola AnesFact)
 * 2) paciente.fecha / fechaCirugia ya en el mensaje
 * 3) fixture de prueba por apellido/DNI (solo mientras no haya cola)
 * Sin fecha → pausa missing_fecha (no inventa "hoy").
 */
async function resolvePaciente(partial) {
  partial = partial || {};
  var source = null;
  var foja = null;

  var sessionToken = '';
  try {
    var sess = await chrome.storage.session.get(['afg_current_foja', 'afg_queue', 'afg_geclisa_token']);
    if (sess.afg_current_foja) {
      foja = sess.afg_current_foja;
      source = 'session.afg_current_foja';
    } else if (sess.afg_queue && sess.afg_queue.length) {
      foja = sess.afg_queue[0];
      source = 'session.afg_queue[0]';
    }
    if (sess.afg_geclisa_token) sessionToken = String(sess.afg_geclisa_token);
  } catch (e) {
    // session storage puede fallar en contextos viejos
  }

  var fromFoja = foja ? fojaToPaciente(foja) : null;
  var merged = {
    apellido: (partial.apellido || (fromFoja && fromFoja.apellido) || '').trim(),
    nombre: preferRicherNombre(
      (partial.nombre || '').trim(),
      (fromFoja && fromFoja.nombre) || ''
    ),
    pac: (partial.pac || (fromFoja && fromFoja.pac) || '').trim(),
    dni: (partial.dni || (fromFoja && fromFoja.dni) || '').trim(),
    fechaIngreso: partial.fechaIngreso || partial.fechaInternacion || (fromFoja && fromFoja.fechaIngreso) || '',
    fechaCirugia: partial.fechaCirugia || partial.fecha || (fromFoja && fromFoja.fechaCirugia) || '',
    horaIngreso: partial.horaIngreso || partial.horaInternacion || (fromFoja && fromFoja.horaIngreso) || '',
    hora: partial.hora || partial.horaInicio || (fromFoja && fromFoja.hora) || '',
    sector: (partial.sector || partial.mayo_sector || (fromFoja && fromFoja.sector) || '').trim(),
    plantilla: partial.plantilla || (fromFoja && fromFoja.plantilla) || null,
    token: (partial.token || (fromFoja && fromFoja.token) || sessionToken || '').trim()
  };
  if (fromFoja) source = source || 'foja';
  else if (partial.fechaIngreso || partial.fechaCirugia || partial.fecha) source = 'payload';

  // Si hay pac más completo que nombre del form/popup, enriquecer
  if (merged.pac) {
    var splitMerged = splitPacienteNombre(merged.pac);
    if (splitMerged.apellido && !merged.apellido) merged.apellido = splitMerged.apellido;
    merged.nombre = preferRicherNombre(merged.nombre, splitMerged.nombre);
  }
  // Defensa apellido compuesto sin nombre
  if (merged.apellido && !merged.nombre && /\s/.test(merged.apellido)) {
    var apBits = merged.apellido.trim().split(/\s+/);
    merged.apellido = apBits[0];
    merged.nombre = apBits.slice(1).join(' ');
  }

  var fix =
    TEST_FOJA_BY_KEY[normKey(merged.dni)] ||
    TEST_FOJA_BY_KEY[normKey(merged.apellido)] ||
    TEST_FOJA_BY_KEY[normKey((merged.apellido + ' ' + merged.nombre).split(/\s+/)[0])];
  if (fix) {
    if (!merged.fechaCirugia) merged.fechaCirugia = fix.fechaCirugia || fix.fecha || '';
    if (!merged.fechaIngreso) merged.fechaIngreso = fix.fechaIngreso || '';
    if (!merged.horaIngreso) merged.horaIngreso = fix.horaIngreso || '';
    if (!merged.hora) merged.hora = fix.hora || fix.horaInicio || '';
    if (!merged.dni && fix.dni) merged.dni = fix.dni;
    if (!merged.nombre && fix.nombre) merged.nombre = fix.nombre;
    if (!merged.sector && fix.sector) merged.sector = fix.sector;
    source = source || 'test_fixture_anesfact';
  }

  merged.fechaIngreso = formatFechaDDMMYYYY(merged.fechaIngreso);
  merged.fechaCirugia = formatFechaDDMMYYYY(merged.fechaCirugia);
  merged.horaIngreso = formatHoraHHMM(merged.horaIngreso);
  merged.hora = formatHoraHHMM(merged.hora);
  // Panel GECLISA: fecha de cirugía + sector (ya no fecha de ingreso)
  merged.fechaPanel = merged.fechaCirugia || null;
  merged.panelFechaMode = merged.fechaCirugia ? 'fechaCirugia' : 'missing_fechaCirugia';

  if (!merged.apellido) {
    return {
      ok: false,
      paused: true,
      reason: 'missing_apellido',
      message: 'PAUSA: falta apellido en el payload de la foja.',
      paciente: merged
    };
  }
  if (!merged.fechaCirugia) {
    return {
      ok: false,
      paused: true,
      reason: 'missing_fechaCirugia',
      message: 'PAUSA: falta fechaCirugia (fecha del panel).',
      paciente: merged
    };
  }
  if (!merged.hora) {
    return {
      ok: false,
      paused: true,
      reason: 'missing_horaInicio',
      message: 'PAUSA: falta horaInicio de cirugía (hora del panel).',
      paciente: merged
    };
  }
  if (!merged.sector) {
    return {
      ok: false,
      paused: true,
      reason: 'missing_sector',
      message: 'PAUSA: falta Sector (#f-mayo-sector). Elegí PRE-QUIRÚRGICO u otro en AnesFact.',
      paciente: merged
    };
  }

  return { ok: true, source: source || 'unknown', paciente: merged };
}

function sleep(ms) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

function humanDelay() {
  return sleep(800 + Math.floor(Math.random() * 1701));
}

async function findGeclisaTab() {
  var tabs = await chrome.tabs.query({ url: 'http://sanatoriomayo.myvnc.com:84/*' });
  if (!tabs.length) throw new Error('Abrí GECLISA (sanatoriomayo.myvnc.com:84) logueado primero');
  var active = tabs.find(function (t) { return t.active; });
  return active || tabs[0];
}

/**
 * Quita handlers beforeunload (propiedad + captura) en todos los frames.
 * El diálogo nativo «¿Abandonar el sitio?» igual puede aparecer si quedó otro listener;
 * en ese caso CDP Page.handleJavaScriptDialog lo acepta.
 */
async function clearBeforeUnloadHandlers(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId, allFrames: true },
      world: 'MAIN',
      func: function () {
        try { window.onbeforeunload = null; } catch (e0) {}
        try {
          Object.defineProperty(window, 'onbeforeunload', {
            configurable: true,
            enumerable: true,
            get: function () { return null; },
            set: function () { /* ignore re-assign */ }
          });
        } catch (e1) {}
        try {
          window.addEventListener('beforeunload', function (ev) {
            try {
              ev.stopImmediatePropagation();
              if (ev.preventDefault) ev.preventDefault();
              delete ev.returnValue;
            } catch (e2) {}
          }, true);
        } catch (e3) {}
        return true;
      }
    });
  } catch (eInj) {
    try { console.warn('[AFG] clearBeforeUnload inject', eInj && eInj.message); } catch (e) {}
  }
  // También vía CDP (por si scripting no alcanza algún frame)
  try {
    await chrome.debugger.sendCommand(dbgTarget(tabId), 'Runtime.evaluate', {
      expression:
        'try{window.onbeforeunload=null;}catch(e){};' +
        'true',
      awaitPromise: false,
      userGesture: true
    });
  } catch (eCdp) {}
}

/** Auto-acepta alert/confirm/beforeunload mientras el debugger está attached. */
function installJsDialogAutoAccept(tabId) {
  var accepted = 0;
  function onEvent(source, method, params) {
    if (!source || source.tabId !== tabId) return;
    if (method !== 'Page.javascriptDialogOpening') return;
    accepted += 1;
    try {
      console.log('[AFG] CDP auto-accept dialog', params && params.type, String((params && params.message) || '').slice(0, 80));
    } catch (e) {}
    chrome.debugger.sendCommand(dbgTarget(tabId), 'Page.handleJavaScriptDialog', {
      accept: true
    }).catch(function (err) {
      try { console.warn('[AFG] handleJavaScriptDialog', err && err.message); } catch (e2) {}
    });
  }
  chrome.debugger.onEvent.addListener(onEvent);
  return {
    cleanup: function () { chrome.debugger.onEvent.removeListener(onEvent); },
    getAccepted: function () { return accepted; }
  };
}

var RELOAD_BEFOREUNLOAD_MSG =
  'PAUSA: Chrome bloqueó el reload con «¿Abandonar el sitio?» (foja GECLISA sin guardar). ' +
  'Aceptá el aviso del navegador o guardá/cerrá la foja, y tocá Reintentar. ' +
  'En uso normal: guardá antes de Siguiente paciente.';

/**
 * F5 a home antes del paso 1.
 * 1) Limpia beforeunload  2) CDP acepta diálogo nativo si aparece  3) timeout → mensaje claro
 */
async function reloadToGeclisaHome(tabId) {
  var attachedHere = false;
  var dialogGuard = null;
  try {
    try {
      await debuggerAttach(tabId);
      attachedHere = true;
    } catch (eAtt) {
      try { console.warn('[AFG] reload: debugger attach', eAtt && eAtt.message); } catch (e) {}
    }

    if (attachedHere) {
      try {
        await chrome.debugger.sendCommand(dbgTarget(tabId), 'Page.enable', {});
      } catch (ePe) {}
      dialogGuard = installJsDialogAutoAccept(tabId);
    }

    await clearBeforeUnloadHandlers(tabId);

    await new Promise(function (resolve, reject) {
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        chrome.tabs.onUpdated.removeListener(onUpdated);
        var n = dialogGuard ? dialogGuard.getAccepted() : 0;
        reject(new Error(
          RELOAD_BEFOREUNLOAD_MSG +
          (n ? ' (CDP aceptó ' + n + ' diálogo(s); igual no completó el reload.)' : '')
        ));
      }, 25000);

      function onUpdated(id, info) {
        if (id !== tabId || info.status !== 'complete') return;
        if (done) return;
        done = true;
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(onUpdated);
        resolve();
      }

      chrome.tabs.onUpdated.addListener(onUpdated);

      var reloadPromise;
      if (attachedHere) {
        reloadPromise = chrome.debugger.sendCommand(dbgTarget(tabId), 'Page.reload', {
          ignoreCache: false
        });
      } else {
        reloadPromise = chrome.tabs.reload(tabId);
      }
      reloadPromise.catch(function (e) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(onUpdated);
        reject(e);
      });
    });

    // SPA: el shell puede quedar "complete" antes del menú; poll btn principal
    var deadline = Date.now() + 35000;
    while (Date.now() < deadline) {
      try {
        var probe = await chrome.scripting.executeScript({
          target: { tabId: tabId, allFrames: false },
          func: function () {
            return !!document.getElementById('btn-Historias Clínicas')
              || !!document.querySelector('[id="btn-Historias Clínicas"]');
          }
        });
        if (probe[0] && probe[0].result) {
          await sleep(1000);
          return { ok: true, dialogsAccepted: dialogGuard ? dialogGuard.getAccepted() : 0 };
        }
      } catch (e) {
        // content/scripting aún no listo post-reload
      }
      await sleep(400);
    }
    throw new Error(
      'Tras F5 no apareció btn-Historias Clínicas. ' +
      'Si ves «¿Abandonar el sitio?», aceptalo y Reintentar. ¿Sesión vencida?'
    );
  } finally {
    if (dialogGuard) dialogGuard.cleanup();
    // Dejar debugger attached: run111 lo reutiliza (debuggerAttach tolera already attached)
  }
}

async function findFrameId(tabId, role) {
  var frameResults = await chrome.scripting.executeScript({
    target: { tabId: tabId, allFrames: true },
    func: function () {
      return {
        isTop: window === window.top,
        hasBtn: !!document.getElementById('btn-Historias Clínicas'),
        hasDdl: !!document.getElementById('ddlUbicacion')
      };
    }
  });
  for (var i = 0; i < frameResults.length; i++) {
    var fr = frameResults[i];
    var r = fr.result || {};
    if (role === 'top' && r.isTop) return fr.frameId;
    if (role === 'iframe' && r.hasDdl) return fr.frameId;
  }
  throw new Error('No encontré frame role=' + role);
}

async function sendToRole(tabId, role, message) {
  var frameId = await findFrameId(tabId, role);
  return await chrome.tabs.sendMessage(tabId, message, { frameId: frameId });
}

async function waitForIframeUbicacion(tabId, timeoutMs) {
  var deadline = Date.now() + (timeoutMs || 25000);
  while (Date.now() < deadline) {
    try {
      var probe = await chrome.scripting.executeScript({
        target: { tabId: tabId, allFrames: true },
        func: function () { return !!document.getElementById('ddlUbicacion'); }
      });
      if (probe.some(function (p) { return p.result; })) return true;
    } catch (e) {}
    await sleep(400);
  }
  return false;
}

function dbgTarget(tabId) {
  return { tabId: tabId };
}

async function debuggerAttach(tabId) {
  try {
    await chrome.debugger.attach(dbgTarget(tabId), '1.3');
  } catch (e) {
    var msg = String(e.message || e);
    if (/already attached/i.test(msg)) {
      try { await chrome.debugger.detach(dbgTarget(tabId)); } catch (e2) {}
      await chrome.debugger.attach(dbgTarget(tabId), '1.3');
      return;
    }
    throw e;
  }
}

async function debuggerDetachSafe(tabId) {
  try {
    await chrome.debugger.detach(dbgTarget(tabId));
  } catch (e) {
    // ya detached o tab cerrada — ignorar
  }
}

/** Click trusted (CDP). x/y en coordenadas de viewport del frame top. */
async function debuggerClick(tabId, x, y) {
  var t = dbgTarget(tabId);
  await chrome.debugger.sendCommand(t, 'Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: x,
    y: y,
    button: 'none'
  });
  await sleep(30 + Math.floor(Math.random() * 40));
  await chrome.debugger.sendCommand(t, 'Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: x,
    y: y,
    button: 'left',
    clickCount: 1
  });
  await sleep(40 + Math.floor(Math.random() * 50));
  await chrome.debugger.sendCommand(t, 'Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: x,
    y: y,
    button: 'left',
    clickCount: 1
  });
}

async function runTop12WithDebugger(tabId) {
  // Paso 1: content solo localiza; background hace click trusted
  var loc1 = await sendToRole(tabId, 'top', { type: 'AFG_LOCATE_STEP1' });
  if (!loc1 || !loc1.ok) throw new Error('Paso 1 locate: ' + ((loc1 && loc1.error) || 'fail'));
  await debuggerClick(tabId, loc1.x, loc1.y);
  await humanDelay();

  // Paso 2
  var loc2 = await sendToRole(tabId, 'top', { type: 'AFG_LOCATE_STEP2' });
  if (!loc2 || !loc2.ok) throw new Error('Paso 2 locate: ' + ((loc2 && loc2.error) || 'fail'));
  await debuggerClick(tabId, loc2.x, loc2.y);
  await humanDelay();

  return {
    ok: true,
    step: 'top_1_2_done_debugger',
    step1: loc1,
    step2: loc2
  };
}

async function run111(paciente) {
  try {
    console.log('[AFG] run111 panel filtros', {
      apellido: paciente && paciente.apellido,
      nombre: paciente && paciente.nombre,
      fechaCirugia: paciente && paciente.fechaCirugia,
      hora: paciente && (paciente.hora || paciente.horaInicio),
      sector: paciente && paciente.sector,
      locate: 'locateByFechaSectorRetries'
    });
  } catch (e) {}
  var tab = await findGeclisaTab();
  var tabId = tab.id;
  var attached = false;
  var topRes = null;
  var iframeRes = null;
  var fillRes = null;

  try {
    await chrome.tabs.update(tabId, { active: true });

    // Estado conocido: F5 a home antes del paso 1 (no depender de modal residual)
    await reloadToGeclisaHome(tabId);

    await debuggerAttach(tabId);
    attached = true;

    // 1–2 con debugger (trusted)
    topRes = await runTop12WithDebugger(tabId);

    var ready = await waitForIframeUbicacion(tabId, 25000);
    if (!ready) {
      return {
        ok: false,
        error: 'Timeout esperando #ddlUbicacion en iframe tras paso 2',
        top: topRes,
        debuggerDetached: true
      };
    }

    await humanDelay();

    // 3–11 en iframe (debugger clicks vía AFG_DEBUGGER_CLICK cuando hace falta)
    iframeRes = await sendToRole(tabId, 'iframe', {
      type: 'AFG_RUN_IFRAME_3_11',
      paciente: paciente
    });

    if (!(iframeRes && iframeRes.ok)) {
      return {
        ok: false,
        paused: !!(iframeRes && iframeRes.paused),
        phase: 'done_1_11',
        reloadedHome: true,
        top: topRes,
        iframe: iframeRes,
        fillOk: false,
        clickMode: 'mixed_debugger_native'
      };
    }

    // Nav OK — soltar debugger antes de fill (barra amarilla fuera)
    await debuggerDetachSafe(tabId);
    attached = false;

    var token = String((paciente && paciente.token) || '').trim();
    if (!token || token.length < 32) {
      return {
        ok: false,
        paused: true,
        reason: 'missing_token',
        message: 'Foja abierta en GECLISA, pero falta el token. En AnesFact: Enviar a GECLISA → copiá el token → pegalo en el popup y reejecutá (o solo fill si ya está abierta).',
        phase: 'nav_ok_fill_skipped',
        reloadedHome: true,
        top: topRes,
        iframe: iframeRes,
        fillOk: false,
        userMessage: 'Foja abierta — falta token para fill.js. No se guardó nada.',
        clickMode: 'mixed_debugger_native'
      };
    }

    fillRes = await runFillOnTab(tabId, token);

    var fillOk = !!(fillRes && fillRes.fillOk);
    return {
      ok: fillOk,
      paused: false,
      phase: 'done_1_12',
      reloadedHome: true,
      top: topRes,
      iframe: iframeRes,
      fillOk: fillOk,
      fillCampos: fillRes && fillRes.camposOk,
      fillError: fillRes && fillRes.error,
      fillResult: fillRes,
      userMessage: fillOk
        ? 'Foja completada, revisá y guardá manualmente'
        : ('Fill falló: ' + ((fillRes && fillRes.error) || 'desconocido')),
      clickMode: 'mixed_debugger_native'
    };
  } catch (e) {
    var errMsg = String(e && e.message || e);
    var leaveSite = /Abandonar el sitio|beforeunload|bloqueó el reload|¿Abandonar/i.test(errMsg);
    return {
      ok: false,
      paused: true,
      reason: leaveSite ? 'beforeunload_dialog' : 'run111_exception',
      error: errMsg,
      message: errMsg,
      top: topRes,
      iframe: iframeRes,
      fillOk: false,
      fillResult: fillRes,
      clickMode: 'mixed_debugger_native',
      userMessage: leaveSite
        ? 'Chrome pidió confirmar salir (foja sin guardar). Aceptá el aviso o guardá, y Reintentar.'
        : errMsg
    };
  } finally {
    if (attached) {
      await debuggerDetachSafe(tabId);
    }
  }
}

/** Espera #8054 (foja), inyecta token + fill.js empaquetado, poll __AFG_FILL_RESULT. */
async function runFillOnTab(tabId, token) {
  var deadline = Date.now() + 45000;
  var fojaReady = false;
  while (Date.now() < deadline) {
    try {
      var probe = await chrome.scripting.executeScript({
        target: { tabId: tabId, allFrames: true },
        world: 'MAIN',
        func: function () {
          return !!document.getElementById('8054');
        }
      });
      if (probe.some(function (p) { return p.result; })) {
        fojaReady = true;
        break;
      }
    } catch (e) {}
    await sleep(500);
  }
  if (!fojaReady) {
    return { fillOk: false, error: 'timeout_foja_8054', camposOk: 0 };
  }

  // Dar un margen a que la plantilla termine de pintar inputs
  await sleep(1500);

  await chrome.scripting.executeScript({
    target: { tabId: tabId, allFrames: false },
    world: 'MAIN',
    func: function (tok) {
      try {
        globalThis.__AFG_GECLISA_TOKEN = tok;
        globalThis.__AFG_FILL_SILENT = true;
        globalThis.__AFG_FILL_RESULT = { pending: true };
      } catch (e) {}
    },
    args: [token]
  });

  await chrome.scripting.executeScript({
    target: { tabId: tabId, allFrames: false },
    world: 'MAIN',
    files: ['vendor/fill.js']
  });

  var pollDeadline = Date.now() + 60000;
  while (Date.now() < pollDeadline) {
    await sleep(400);
    try {
      var got = await chrome.scripting.executeScript({
        target: { tabId: tabId, allFrames: false },
        world: 'MAIN',
        func: function () {
          try { return globalThis.__AFG_FILL_RESULT || null; } catch (e) { return null; }
        }
      });
      var r = got && got[0] && got[0].result;
      if (!r || r.pending) continue;
      return {
        fillOk: !!r.ok,
        camposOk: r.camposOk != null ? r.camposOk : null,
        error: r.error || null,
        fechaCirugia: r.fechaCirugia || null,
        horaInicio: r.horaInicio || null
      };
    } catch (ePoll) {}
  }
  return { fillOk: false, error: 'timeout_fill_result', camposOk: 0 };
}

/* —— Runner de cola (pieza 3): mint → run111 (reloadedHome) → awaiting_save —— */

function defaultRunnerState() {
  return {
    status: 'idle',
    currentIntervId: null,
    currentPac: '',
    message: '',
    lastResult: null,
    processedIds: [],
    startedAt: null,
    updatedAt: Date.now()
  };
}

async function getRunnerState() {
  try {
    var sess = await chrome.storage.session.get(['afg_runner_state']);
    if (sess.afg_runner_state && sess.afg_runner_state.status) return sess.afg_runner_state;
  } catch (e) {}
  try {
    var loc = await chrome.storage.local.get(['afg_runner_state']);
    if (loc.afg_runner_state && loc.afg_runner_state.status) return loc.afg_runner_state;
  } catch (e2) {}
  return defaultRunnerState();
}

async function setRunnerState(state) {
  state = state || defaultRunnerState();
  state.updatedAt = Date.now();
  try { await chrome.storage.session.set({ afg_runner_state: state }); } catch (e) {}
  try { await chrome.storage.local.set({ afg_runner_state: state }); } catch (e2) {}
  return state;
}

async function patchQueueItemStatus(intervId, status, message) {
  var tabs = await findAnesFactTabs();
  for (var i = 0; i < (tabs || []).length; i++) {
    try {
      await chrome.tabs.sendMessage(tabs[i].id, {
        type: 'AFG_QUEUE_SET_ITEM_STATUS',
        intervId: String(intervId),
        status: status,
        message: message || ''
      });
      return;
    } catch (e) {}
  }
}

function firstPendingQueueItem(queue, preferId) {
  var items = (queue && queue.items) || [];
  if (preferId) {
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].id) === String(preferId) && items[i].status !== 'done') return items[i];
    }
  }
  for (var j = 0; j < items.length; j++) {
    var st = items[j].status || 'queued';
    if (st === 'done') continue;
    if (st === 'running' || st === 'awaiting_save' || st === 'queued' || st === 'paused_error') {
      return items[j];
    }
  }
  return null;
}

async function runQueueAction(action) {
  if (action === 'abort') {
    var stAbort = await getRunnerState();
    if (stAbort.currentIntervId) {
      await patchQueueItemStatus(stAbort.currentIntervId, 'queued', 'Abortada por el usuario');
    }
    queueRunnerBusy = false;
    var idle = defaultRunnerState();
    idle.message = 'Cola abortada';
    await setRunnerState(idle);
    return { ok: true, aborted: true, state: idle };
  }

  var stateGate = await getRunnerState();
  if (action === 'start' && stateGate.status === 'awaiting_save') {
    return {
      ok: false,
      error: 'awaiting_save',
      message: 'Hay una foja esperando que guardes. Toca Siguiente paciente.',
      state: stateGate
    };
  }
  if (queueRunnerBusy || stateGate.status === 'running') {
    return {
      ok: false,
      error: 'runner_busy',
      message: 'Ya hay una foja en curso. Esperá o Abortar.',
      state: stateGate
    };
  }

  var state = stateGate;

  if (action === 'next') {
    if (state.status !== 'awaiting_save' || !state.currentIntervId) {
      return {
        ok: false,
        error: 'not_awaiting_save',
        message: 'No hay foja esperando “Siguiente”. Iniciá la cola o reintentá.',
        state: state
      };
    }
    await patchQueueItemStatus(state.currentIntervId, 'done', '');
    state.processedIds = (state.processedIds || []).concat([String(state.currentIntervId)]);
    state.currentIntervId = null;
    state.currentPac = '';
    state.status = 'idle';
    state.message = 'Buscando siguiente…';
    await setRunnerState(state);
  }

  if (action === 'retry') {
    if (!state.currentIntervId) {
      return {
        ok: false,
        error: 'nothing_to_retry',
        message: 'No hay foja actual para reintentar.',
        state: state
      };
    }
  }

  var pulled = await pullQueueFromAnesFactTabs();
  var queue = pulled && pulled.ok ? pulled.queue : null;
  if (!queue || !queue.items || !queue.items.length) {
    state = await setRunnerState(Object.assign(defaultRunnerState(), {
      status: 'done_all',
      message: 'Cola vacía en AnesFact'
    }));
    return { ok: false, error: 'empty_queue', message: state.message, state: state };
  }

  var preferId = action === 'retry' ? state.currentIntervId : null;
  // Tras next, no preferir el done
  if (action === 'start' || action === 'next') preferId = null;

  var item = firstPendingQueueItem(queue, preferId);
  // Excluir ya procesados en esta sesión si status quedó raro
  if (item && action === 'next') {
    var skip = {};
    (state.processedIds || []).forEach(function (id) { skip[String(id)] = true; });
    if (skip[String(item.id)]) {
      var items = queue.items;
      item = null;
      for (var k = 0; k < items.length; k++) {
        if (items[k].status === 'done') continue;
        if (skip[String(items[k].id)]) continue;
        item = items[k];
        break;
      }
    }
  }

  if (!item) {
    state = await setRunnerState(Object.assign(state, {
      status: 'done_all',
      currentIntervId: null,
      currentPac: '',
      message: 'Cola completa — no quedan pendientes'
    }));
    return { ok: true, doneAll: true, state: state };
  }

  queueRunnerBusy = true;
  state.status = 'running';
  state.currentIntervId = String(item.id);
  state.currentPac = item.pac || '';
  state.message = 'Minteando token…';
  state.lastResult = null;
  if (!state.startedAt) state.startedAt = Date.now();
  await setRunnerState(state);
  await patchQueueItemStatus(item.id, 'running', '');

  try {
    console.log('[AFG runner] mint+run111', item.id, item.pac);
  } catch (eLog) {}

  var mint = await mintTokenViaAnesFactBridge(item.id);
  if (!(mint && mint.ok && mint.foja && mint.foja.token)) {
    queueRunnerBusy = false;
    var mintErr = (mint && (mint.error || mint.message)) || 'mint_failed';
    state = await setRunnerState(Object.assign(state, {
      status: 'paused_error',
      message: 'Mint falló: ' + mintErr,
      lastResult: mint
    }));
    await patchQueueItemStatus(item.id, 'paused_error', state.message);
    return { ok: false, error: 'mint_failed', message: state.message, mint: mint, state: state };
  }

  state.message = 'Navegando GECLISA (reload home → 1–12)…';
  await setRunnerState(state);

  var paciente = fojaToPaciente(mint.foja) || {};
  paciente.token = mint.foja.token;
  paciente.intervId = String(item.id);
  // Completar sector/fecha/hora desde ítem de cola si mint vino corto
  if (!paciente.sector) paciente.sector = item.sector || '';
  if (!paciente.fechaCirugia) paciente.fechaCirugia = item.fecha || '';
  if (!paciente.hora) paciente.hora = item.hora || '';

  var resolved = await resolvePaciente(paciente);
  if (!(resolved && resolved.ok)) {
    queueRunnerBusy = false;
    state = await setRunnerState(Object.assign(state, {
      status: 'paused_error',
      message: (resolved && resolved.message) || 'resolvePaciente falló',
      lastResult: resolved
    }));
    await patchQueueItemStatus(item.id, 'paused_error', state.message);
    return { ok: false, error: 'resolve_failed', resolved: resolved, state: state };
  }

  var runRes = null;
  try {
    runRes = await run111(resolved.paciente);
  } catch (eRun) {
    var em = String(eRun && eRun.message || eRun);
    var isLeave = /Abandonar el sitio|beforeunload|bloqueó el reload|¿Abandonar/i.test(em);
    runRes = {
      ok: false,
      paused: true,
      reason: isLeave ? 'beforeunload_dialog' : 'run111_exception',
      error: em,
      message: em
    };
  }

  queueRunnerBusy = false;

  var fillOk = !!(runRes && runRes.fillOk);
  var paused = !!(runRes && runRes.paused);
  var navOk = !!(runRes && (runRes.ok || runRes.phase === 'done_1_12' || runRes.phase === 'nav_ok_fill_skipped'));

  if (fillOk) {
    state = await setRunnerState(Object.assign(state, {
      status: 'awaiting_save',
      message: 'Foja completada — revisá GECLISA, guardá a mano, luego Siguiente paciente',
      lastResult: runRes,
      currentPac: (resolved.paciente.apellido || '') + ', ' + (resolved.paciente.nombre || '')
    }));
    await patchQueueItemStatus(item.id, 'awaiting_save', '');
    return {
      ok: true,
      awaitingSave: true,
      userMessage: state.message,
      run: runRes,
      foja: mint.foja,
      state: state
    };
  }

  var why = (runRes && (runRes.message || runRes.error || runRes.reason)) || 'error_desconocido';
  state = await setRunnerState(Object.assign(state, {
    status: 'paused_error',
    message: paused ? ('PAUSA: ' + why) : ('Error: ' + why),
    lastResult: runRes
  }));
  await patchQueueItemStatus(item.id, 'paused_error', state.message);
  return {
    ok: false,
    paused: paused,
    error: why,
    message: state.message,
    run: runRes,
    state: state
  };
}
