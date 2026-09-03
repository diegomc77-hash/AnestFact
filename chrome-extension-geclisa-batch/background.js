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

  // Content GECLISA: progreso nav (sobre todo paso 11 — el CS puede morir al abrir plantilla)
  if (msg && msg.type === 'AFG_IFRAME_NAV_PROGRESS') {
    lastIframeNavProgress = {
      step: msg.step,
      at: msg.at || Date.now(),
      href: msg.href || '',
      extra: msg.extra || null,
      tabId: sender && sender.tab && sender.tab.id
    };
    try {
      console.log('[AFG bg] IFRAME_NAV_PROGRESS', msg.step, msg.extra || '', msg.href || '');
    } catch (e) {}
    // Actualizar mensaje del runner si está en curso
    getRunnerState().then(function (st) {
      if (!st || st.status !== 'running') return;
      var label = String(msg.step || '');
      if (label.indexOf('step11') === 0) {
        st.message = 'Paso 11 (' + label + ') — abriendo plantilla / fill…';
        return setRunnerState(st);
      }
    }).catch(function () {});
    var nroProg = msg.extra && (msg.extra.nroAtencion || msg.extra.mayo_nro_atencion);
    if (nroProg && String(msg.step || '').indexOf('step11') === 0) {
      getRunnerState().then(function (stN) {
        if (!(stN && stN.currentIntervId)) return;
        return notifyAnesFactMayoNroAtencion(stN.currentIntervId, nroProg, 'step11');
      }).catch(function () {});
    }
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

  // Usuario tocó GRABAR en GECLISA → auto-avanzar cola (si awaiting_save)
  if (msg && msg.type === 'AFG_USER_SAVED_FOJA') {
    handleUserSavedFoja(msg)
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
/** Evita doble auto-next si GRABAR dispara varios mensajes. */
var autoNextAfterSaveTimer = null;
var autoNextInFlight = false;

/**
 * Inyecta watcher de GRABAR en todos los frames de la pestaña GECLISA.
 */
async function armGrabarAutoNextWatcher(tabId) {
  if (!tabId) return { ok: false, error: 'no_tab' };
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId, allFrames: true },
      files: ['content/grabar-watch.js']
    });
    try { console.log('[AFG runner] grabar-watch armado tab', tabId); } catch (e) {}
    return { ok: true };
  } catch (eArm) {
    try { console.warn('[AFG runner] arm grabar-watch fail', eArm); } catch (e2) {}
    return { ok: false, error: String(eArm && eArm.message || eArm) };
  }
}

/**
 * Tras GRABAR del usuario: marca done y lanza el siguiente de la cola.
 * No hace click en Guardar — solo detecta el click humano.
 */
async function handleUserSavedFoja(msg) {
  if (msg && msg.saveFailed) {
    clearTimeout(autoNextAfterSaveTimer);
    autoNextAfterSaveTimer = null;
    try { console.warn('[AFG runner] GRABAR con texto de error — no auto-avanzo'); } catch (e) {}
    try {
      var stErr = await getRunnerState();
      if (stErr.status === 'awaiting_save') {
        await setRunnerState(Object.assign(stErr, {
          message: 'Parece que GRABAR falló — corregí y volvé a grabar, o usá Siguiente a mano'
        }));
      }
    } catch (e2) {}
    return { ok: false, ignored: true, reason: 'save_failed' };
  }
  var state = await getRunnerState();
  var savedIntervId = String(state.currentIntervId || '').trim();
  if (state.status !== 'awaiting_save') {
    return { ok: false, ignored: true, reason: 'not_awaiting_save', status: state.status };
  }
  if (autoNextInFlight || queueRunnerBusy) {
    return { ok: false, ignored: true, reason: 'busy' };
  }

  // confirmed=false (click) → esperar un poco; confirmed=true → avanzar pronto
  var delayMs = (msg && msg.confirmed) ? 600 : 3200;
  clearTimeout(autoNextAfterSaveTimer);
  autoNextAfterSaveTimer = setTimeout(function () {
    autoNextInFlight = true;
    getRunnerState().then(function (st) {
      if (!(st && st.status === 'awaiting_save')) {
        autoNextInFlight = false;
        return null;
      }
      return setRunnerState(Object.assign(st, {
        message: 'GRABAR detectado — siguiente paciente…'
      })).then(function () {
        return runQueueAction('next');
      });
    }).then(function (r) {
      try { console.log('[AFG runner] auto-next tras GRABAR', r && r.ok, r && r.message); } catch (e) {}
    }).catch(function (e) {
      try { console.warn('[AFG runner] auto-next fail', e); } catch (e2) {}
    }).finally(function () {
      autoNextInFlight = false;
    });
  }, delayMs);

  if (msg && msg.confirmed && savedIntervId) {
    scheduleMayoPdfFetch(savedIntervId, AFG_PDF_FIRST_DELAY_MS);
  }

  return { ok: true, scheduled: true, delayMs: delayMs, confirmed: !!(msg && msg.confirmed) };
}

/** Último ping del content script del iframe (paso 11 puede matar el CS al navegar). */
var lastIframeNavProgress = null;

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
 * Asegura content script anesfact-bridge en la pestaña.
 * Tras reload de la extensión, las pestañas ya abiertas no tienen listener
 * → "Receiving end does not exist". Re-inyectamos y hacemos ping.
 */
async function ensureAnesFactBridge(tabId) {
  try {
    var ping = await chrome.tabs.sendMessage(tabId, { type: 'AFG_BRIDGE_PING' });
    if (ping && ping.ok) return { ok: true, injected: false, ping: ping };
  } catch (ePing) {
    /* reinyectar abajo */
  }
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content/anesfact-bridge.js']
    });
  } catch (eInj) {
    return { ok: false, error: 'inject_failed: ' + String(eInj && eInj.message || eInj) };
  }
  await sleep(150);
  try {
    var ping2 = await chrome.tabs.sendMessage(tabId, { type: 'AFG_BRIDGE_PING' });
    if (ping2 && ping2.ok) return { ok: true, injected: true, ping: ping2 };
    return { ok: false, error: 'ping_after_inject_failed', ping: ping2 };
  } catch (e2) {
    return { ok: false, error: 'Receiving end does not exist (tras inject). Recargá la pestaña AnesFact.' };
  }
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
  var lastErr = null;
  for (var i = 0; i < tabs.length; i++) {
    var tab = tabs[i];
    try {
      var ready = await ensureAnesFactBridge(tab.id);
      if (!(ready && ready.ok)) {
        lastErr = ready || { ok: false, error: 'bridge_not_ready' };
        continue;
      }
      var res = await chrome.tabs.sendMessage(tab.id, {
        type: 'AFG_MINT_TOKEN_FOR_FOJA',
        intervId: String(intervId),
        timeoutMs: timeoutMs || 45000
      });
      if (res && res.ok) {
        try {
          console.log('[AFG bg] mint ok', intervId, res.foja && res.foja.apellido, 'tokenLen', res.tokenLen,
            ready.injected ? '(bridge re-inyectado)' : '');
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
    token: foja.token || '',
    intervId: foja.intervId ? String(foja.intervId) : ''
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
    token: (partial.token || (fromFoja && fromFoja.token) || sessionToken || '').trim(),
    intervId: String(partial.intervId || partial.id || (fromFoja && fromFoja.intervId) || '').trim()
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

var GECLISA_HOME_URL = 'http://sanatoriomayo.myvnc.com:84/';

/**
 * Neutraliza beforeunload en todos los frames.
 * IMPORTANTE: NUNCA llamar preventDefault() en beforeunload — en Chrome eso
 * DISPARA el diálogo «¿Abandonar el sitio?» (bug del fix 0.5.1).
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
        // Captura: cortar otros listeners sin activar el prompt
        try {
          window.addEventListener('beforeunload', function (ev) {
            try {
              ev.stopImmediatePropagation();
              // NO preventDefault — eso es lo que muestra el diálogo
              try { delete ev.returnValue; } catch (eDel) {}
              try { ev.returnValue = undefined; } catch (eRv) {}
            } catch (e2) {}
          }, true);
        } catch (e3) {}
        // Burbuja tardía: si GECLISA ya hizo preventDefault/returnValue, intentar limpiar
        try {
          window.addEventListener('beforeunload', function (ev) {
            try {
              try { delete ev.returnValue; } catch (eDel2) {}
              try { ev.returnValue = undefined; } catch (eRv2) {}
            } catch (e4) {}
          }, false);
        } catch (e5) {}
        return true;
      }
    });
  } catch (eInj) {
    try { console.warn('[AFG] clearBeforeUnload inject', eInj && eInj.message); } catch (e) {}
  }
  try {
    await chrome.debugger.sendCommand(dbgTarget(tabId), 'Runtime.evaluate', {
      expression:
        'try{window.onbeforeunload=null;}catch(e){};true',
      awaitPromise: false,
      userGesture: true
    });
  } catch (eCdp) {}
}

var RELOAD_BEFOREUNLOAD_MSG =
  'PAUSA: No se pudo ir a home GECLISA desde la foja anterior. ' +
  'Si Chrome muestra «¿Abandonar el sitio?», aceptalo y tocá Reintentar. ' +
  'En uso normal: guardá antes de Siguiente paciente.';

/**
 * Espera a que la pestaña termine de cargar (tabs.onUpdated).
 * @returns {Promise<void>}
 */
function waitTabComplete(tabId, timeoutMs) {
  return new Promise(function (resolve, reject) {
    var done = false;
    var sawLoading = false;
    var startedAt = Date.now();
    var poll = null;

    function cleanup() {
      clearTimeout(timer);
      if (poll) clearInterval(poll);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    }

    var timer = setTimeout(function () {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error(RELOAD_BEFOREUNLOAD_MSG + ' (timeout esperando load tras tabs.update)'));
    }, timeoutMs || 25000);

    function finishOk() {
      if (done) return;
      done = true;
      cleanup();
      resolve();
    }

    function onUpdated(id, info) {
      if (id !== tabId) return;
      if (info.status === 'loading') {
        sawLoading = true;
        return;
      }
      if (info.status === 'complete' && sawLoading && Date.now() - startedAt > 200) {
        finishOk();
      }
    }

    chrome.tabs.onUpdated.addListener(onUpdated);

    poll = setInterval(function () {
      if (done) return;
      chrome.tabs.get(tabId).then(function (t) {
        if (done || !t) return;
        if (t.status === 'complete' && sawLoading && Date.now() - startedAt > 600) {
          finishOk();
        }
        // Ya en home y complete (update a misma URL a veces no dispara loading)
        if (t.status === 'complete' && t.url &&
            String(t.url).indexOf('sanatoriomayo.myvnc.com:84') >= 0 &&
            /\/?$/.test(String(t.url).split('?')[0]) &&
            Date.now() - startedAt > 2000 &&
            !/Internado|Evoluc|redirto/i.test(String(t.url))) {
          finishOk();
        }
      }).catch(function () {});
    }, 350);
  });
}

/**
 * Navega a home GECLISA antes del paso 1.
 *
 * 0.5.4: NO usa Page.reload / Page.navigate (CDP). Esos disparan beforeunload
 * “desde adentro”. Usa chrome.tabs.update({ url: home }) a nivel extensión.
 * Se detacha el debugger antes para no interferir.
 */
async function reloadToGeclisaHome(tabId) {
  var homeUrl = GECLISA_HOME_URL;
  var navCount = 0;

  // Soltar debugger: no queremos Page.* navegando la pestaña
  try {
    await debuggerDetachSafe(tabId);
  } catch (eDet) {}

  await clearBeforeUnloadHandlers(tabId);

  async function tabsUpdateHome(reason) {
    navCount += 1;
    // Cache-bust suave si ya estamos en home (fuerza reload real vía update)
    var url = homeUrl;
    try {
      var cur = await chrome.tabs.get(tabId);
      var curUrl = (cur && cur.url) || '';
      if (curUrl.replace(/\/?$/, '/') === homeUrl.replace(/\/?$/, '/')) {
        url = homeUrl + (homeUrl.indexOf('?') >= 0 ? '&' : '?') + 'afg=' + Date.now();
      }
    } catch (eU) {}
    try {
      console.log('[AFG] tabs.update home #' + navCount, reason || '', url);
    } catch (eL) {}
    return chrome.tabs.update(tabId, { url: url, active: true });
  }

  // Intento 1
  await tabsUpdateHome('initial');
  try {
    await waitTabComplete(tabId, 20000);
  } catch (e1) {
    try { console.warn('[AFG] tabs.update home intento 1 no completó → reintento', e1 && e1.message); } catch (eW) {}
    await clearBeforeUnloadHandlers(tabId);
    await tabsUpdateHome('retry');
    try {
      await waitTabComplete(tabId, 15000);
    } catch (e2) {
      throw new Error(
        RELOAD_BEFOREUNLOAD_MSG +
        ' (tabs.update x' + navCount + ' no llegó a home; URL sigue en Evolución u otra.)'
      );
    }
  }

  // Confirmar URL no quedó en Evolución / Internado
  try {
    var after = await chrome.tabs.get(tabId);
    var au = String((after && after.url) || '');
    if (/Evoluc|Internado|ConsultaxFecha|redirto/i.test(au) && au.indexOf('afg=') < 0) {
      try { console.warn('[AFG] tras update seguimos en', au.slice(0, 120), '→ forzar home otra vez'); } catch (e) {}
      await clearBeforeUnloadHandlers(tabId);
      await tabsUpdateHome('force-leave-evolucion');
      await waitTabComplete(tabId, 15000);
    }
  } catch (eChk) {}

  await clearBeforeUnloadHandlers(tabId);

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
        return {
          ok: true,
          via: 'tabs.update',
          navigations: navCount
        };
      }
    } catch (e) {}
    await sleep(400);
  }
  throw new Error(
    'Tras tabs.update a home no apareció btn-Historias Clínicas. ¿Sesión vencida?'
  );
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

/**
 * Como sendToRole pero con timeout + recuperación tras paso 11.
 * Si el iframe navega al abrir la plantilla, el CS muere y nunca hay sendResponse:
 * al ver AFG_IFRAME_NAV_PROGRESS step11_* seguimos a fill.js igual.
 */
async function sendToRoleWithTimeout(tabId, role, message, timeoutMs) {
  lastIframeNavProgress = null;
  var timeout = timeoutMs || 180000;
  var settled = null;
  sendToRole(tabId, role, message).then(function (r) {
    settled = { via: 'response', res: r };
  }).catch(function (e) {
    settled = { via: 'error', error: String(e && e.message || e) };
  });

  var t0 = Date.now();
  var inferredAfterStep11 = false;
  while (Date.now() - t0 < timeout) {
    if (settled) {
      if (settled.via === 'response') {
        try {
          console.log('[AFG bg] sendToRole OK', settled.res && settled.res.step, 'ok=', settled.res && settled.res.ok);
        } catch (e) {}
        return settled.res;
      }
      var err = settled.error || '';
      var progErr = lastIframeNavProgress;
      try { console.warn('[AFG bg] sendToRole error', err, 'progress=', progErr && progErr.step); } catch (e2) {}
      if (/port closed|Receiving end does not exist|message channel closed/i.test(err) ||
          (progErr && String(progErr.step || '').indexOf('step11') === 0)) {
        return {
          ok: true,
          step: 'iframe_7_11_done_inferred',
          inferred: true,
          reason: 'port_closed',
          portError: err,
          lastProgress: progErr,
          message: 'Content script cerrado tras Seleccionar. Continúo a fill.js.'
        };
      }
      return { ok: false, error: err, lastProgress: progErr };
    }

    var prog = lastIframeNavProgress;
    // Solo AFTER click / done — no step11_before_click (aún no abrió la foja)
    if (!inferredAfterStep11 && prog &&
        (prog.step === 'step11_after_click' || prog.step === 'step11_done')) {
      try {
        console.log('[AFG bg] step11 progress visto → gracia 4s por si llega sendResponse…', prog.step);
      } catch (e3) {}
      await sleep(4000);
      if (settled && settled.via === 'response') return settled.res;
      inferredAfterStep11 = true;
      try { console.warn('[AFG bg] sin sendResponse tras step11 → inferido OK, paso a fill'); } catch (e4) {}
      return {
        ok: true,
        step: 'iframe_7_11_done_inferred',
        inferred: true,
        reason: 'step11_progress_no_response',
        lastProgress: lastIframeNavProgress,
        message: 'Paso 11 ping recibido; CS no respondió (navegación). Continúo a fill.js.'
      };
    }
    await sleep(400);
  }

  return {
    ok: false,
    paused: true,
    reason: 'iframe_timeout',
    message: 'PAUSA: timeout esperando pasos 3–11. lastProgress=' +
      ((lastIframeNavProgress && lastIframeNavProgress.step) || 'ninguno'),
    lastProgress: lastIframeNavProgress
  };
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
    try {
      console.log('[AFG bg] run111 → AFG_RUN_IFRAME_3_11 (con timeout / step11 recovery)');
    } catch (e0) {}
    iframeRes = await sendToRoleWithTimeout(tabId, 'iframe', {
      type: 'AFG_RUN_IFRAME_3_11',
      paciente: paciente
    }, 180000);

    var nroCap = pickNroAtencionFromIframe(iframeRes) ||
      pickNroAtencionFromIframe({ lastProgress: lastIframeNavProgress });
    var intervCap = String((paciente && (paciente.intervId || paciente.id)) || '').trim();
    if (iframeRes && iframeRes.reason === 'evolucion_nombre_mismatch') {
      try { console.warn('[AFG] no persisto nro: mismatch 8b'); } catch (eMm) {}
    } else if (nroCap && intervCap && iframeNameMatchedForNro(iframeRes)) {
      try {
        await notifyAnesFactMayoNroAtencion(intervCap, nroCap, 'run111_iframe');
      } catch (eNro) {
        try { console.warn('[AFG] persist nro after iframe', eNro); } catch (eN2) {}
      }
    }

    if (!(iframeRes && iframeRes.ok)) {
      try { console.warn('[AFG bg] iframe 3–11 no OK', iframeRes); } catch (e1) {}
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

    try {
      console.log('[AFG bg] iframe 3–11 OK', iframeRes.step, 'inferred=', !!iframeRes.inferred,
        '→ detach debugger y runFillOnTab');
    } catch (e2) {}

    // Nav OK — soltar debugger antes de fill (barra amarilla fuera)
    await debuggerDetachSafe(tabId);
    attached = false;
    try { console.log('[AFG bg] debugger detached, preparo fill.js'); } catch (e3) {}

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

    try { console.log('[AFG bg] → runFillOnTab tokenLen=', token.length); } catch (e4) {}
    fillRes = await runFillOnTab(tabId, token);
    try { console.log('[AFG bg] ← runFillOnTab', fillRes); } catch (e5) {}

    var fillOk = !!(fillRes && fillRes.fillOk);
    if (fillOk) {
      var markId = String((paciente && (paciente.intervId || paciente.id)) || '').trim();
      try {
        await notifyAnesFactEnviadoGeclisa(markId, { via: 'run111_fillOk' });
      } catch (eMark) {
        try { console.warn('[AFG] notify enviado after fill', eMark); } catch (eM) {}
      }
      var nroFill = pickNroAtencionFromIframe(iframeRes) ||
        pickNroAtencionFromIframe({ lastProgress: lastIframeNavProgress });
      if (nroFill && markId) {
        try {
          await notifyAnesFactMayoNroAtencion(markId, nroFill, 'run111_fillOk');
        } catch (eNroF) {
          try { console.warn('[AFG] persist nro after fill', eNroF); } catch (eN3) {}
        }
      }
    }
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
      intervId: String((paciente && (paciente.intervId || paciente.id)) || ''),
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

/** Localiza frameId donde está #8054 (la foja suele vivir en el iframe, no en top). */
async function findFoja8054FrameId(tabId) {
  try {
    var probe = await chrome.scripting.executeScript({
      target: { tabId: tabId, allFrames: true },
      world: 'MAIN',
      func: function () {
        return {
          has8054: !!document.getElementById('8054'),
          href: String(location.href || '').slice(0, 100),
          isTop: window === window.top
        };
      }
    });
    for (var i = 0; i < probe.length; i++) {
      var row = probe[i];
      if (row && row.result && row.result.has8054) {
        return {
          frameId: row.frameId,
          href: row.result.href,
          isTop: !!row.result.isTop
        };
      }
    }
  } catch (e) {}
  return null;
}

/** Espera #8054 (foja), inyecta token + fill.js en ESE frame, poll __AFG_FILL_RESULT. */
async function runFillOnTab(tabId, token) {
  try { console.log('[AFG fill] esperando #8054 en cualquier frame…'); } catch (e0) {}
  var deadline = Date.now() + 45000;
  var fojaFrame = null;
  var tick = 0;
  while (Date.now() < deadline) {
    fojaFrame = await findFoja8054FrameId(tabId);
    if (fojaFrame) break;
    tick += 1;
    if (tick % 6 === 0) {
      try {
        console.log('[AFG fill] aún sin #8054…', Math.round((deadline - Date.now()) / 1000), 's; lastNav=',
          lastIframeNavProgress && lastIframeNavProgress.step);
      } catch (e1) {}
    }
    await sleep(500);
  }
  if (!fojaFrame) {
    try { console.warn('[AFG fill] timeout_foja_8054 — plantilla no abrió la foja'); } catch (e2) {}
    return {
      fillOk: false,
      error: 'timeout_foja_8054',
      message: 'PAUSA: no apareció #8054 tras Seleccionar plantilla. ¿El click de paso 11 no abrió la foja?',
      camposOk: 0,
      lastProgress: lastIframeNavProgress
    };
  }

  try {
    console.log('[AFG fill] #8054 en frameId=', fojaFrame.frameId, 'isTop=', fojaFrame.isTop, fojaFrame.href);
  } catch (e3) {}

  // Dar un margen a que la plantilla termine de pintar inputs
  await sleep(1500);

  var target = { tabId: tabId, frameIds: [fojaFrame.frameId] };
  // Fallback si frameIds no aplica en alguna build
  if (fojaFrame.frameId == null) {
    target = { tabId: tabId, allFrames: true };
  }

  try {
    console.log('[AFG fill] inyectando token + flags en frame foja');
  } catch (e4) {}
  await chrome.scripting.executeScript({
    target: target,
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

  try { console.log('[AFG fill] inyectando vendor/fill.js'); } catch (e5) {}
  await chrome.scripting.executeScript({
    target: target,
    world: 'MAIN',
    files: ['vendor/fill.js']
  });
  try { console.log('[AFG fill] fill.js inyectado — poll __AFG_FILL_RESULT'); } catch (e6) {}

  var pollDeadline = Date.now() + 60000;
  while (Date.now() < pollDeadline) {
    await sleep(400);
    try {
      var got = await chrome.scripting.executeScript({
        target: target,
        world: 'MAIN',
        func: function () {
          try { return globalThis.__AFG_FILL_RESULT || null; } catch (e) { return null; }
        }
      });
      var r = null;
      for (var gj = 0; gj < (got || []).length; gj++) {
        var cand = got[gj] && got[gj].result;
        if (!cand || cand.pending) continue;
        r = cand;
        break;
      }
      if (!r) continue;
      try { console.log('[AFG fill] resultado', r); } catch (e7) {}
      return {
        fillOk: !!r.ok,
        camposOk: r.camposOk != null ? r.camposOk : null,
        error: r.error || null,
        fechaCirugia: r.fechaCirugia || null,
        horaInicio: r.horaInicio || null,
        frameId: fojaFrame.frameId
      };
    } catch (ePoll) {
      try { console.warn('[AFG fill] poll error', ePoll && ePoll.message); } catch (e8) {}
    }
  }
  try { console.warn('[AFG fill] timeout_fill_result'); } catch (e9) {}
  return { fillOk: false, error: 'timeout_fill_result', camposOk: 0, frameId: fojaFrame.frameId };
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

/**
 * Tras fillOk: AnesFact marca la intervención como enviada a GECLISA (+ timestamp).
 */
async function notifyAnesFactEnviadoGeclisa(intervId, extra) {
  var id = String(intervId || '').trim();
  if (!id) {
    try { console.warn('[AFG] mark enviado: sin intervId'); } catch (e) {}
    return { ok: false, error: 'missing_intervId' };
  }
  var tabs = await findAnesFactTabs();
  var lastErr = null;
  for (var i = 0; i < (tabs || []).length; i++) {
    try {
      var res = await chrome.tabs.sendMessage(tabs[i].id, {
        type: 'AFG_MARK_ENVIADO_GECLISA',
        intervId: id,
        at: (extra && extra.at) || new Date().toISOString(),
        via: (extra && extra.via) || 'extension'
      });
      if (res && res.ok) {
        try { console.log('[AFG] mark enviado_geclisa OK', id, res); } catch (eL) {}
        return res;
      }
      lastErr = res || { ok: false, error: 'no_response' };
    } catch (eTab) {
      lastErr = { ok: false, error: String(eTab && eTab.message || eTab) };
    }
  }
  try { console.warn('[AFG] mark enviado_geclisa falló', id, lastErr); } catch (eW) {}
  return lastErr || { ok: false, error: 'no_anesfact_tab' };
}

function pickNroAtencionFromIframe(iframeRes) {
  if (!iframeRes) return '';
  var extra = iframeRes.lastProgress && iframeRes.lastProgress.extra;
  var raw = iframeRes.nroAtencion
    || (iframeRes.steps711 && iframeRes.steps711.nroAtencion)
    || (iframeRes.evolucionHeader && iframeRes.evolucionHeader.nroAtencion)
    || (extra && extra.nroAtencion)
    || '';
  var s = String(raw || '').replace(/\D/g, '');
  return s.length >= 4 ? s : '';
}

/** 8b coincidió (o se infirió paso 11, que solo corre tras match). No persistir en mismatch. */
function iframeNameMatchedForNro(iframeRes) {
  if (!iframeRes) return false;
  if (iframeRes.reason === 'evolucion_nombre_mismatch') return false;
  if (iframeRes.ok) return true;
  if (iframeRes.reason === 'template_ambiguous_or_empty') return true;
  var step = iframeRes.lastProgress && iframeRes.lastProgress.step;
  if (step && String(step).indexOf('step11') === 0) return true;
  if (iframeRes.inferred) return true;
  return false;
}

async function notifyAnesFactMayoNroAtencion(intervId, nro, via) {
  var id = String(intervId || '').trim();
  var num = String(nro || '').replace(/\D/g, '');
  if (!id || num.length < 4) {
    return { ok: false, ignored: true, reason: 'missing_id_or_nro' };
  }
  var tabs = await findAnesFactTabs();
  var lastErr = null;
  for (var i = 0; i < (tabs || []).length; i++) {
    try {
      var res = await chrome.tabs.sendMessage(tabs[i].id, {
        type: 'AFG_SET_MAYO_NRO_ATENCION',
        intervId: id,
        nroAtencion: num,
        via: via || 'extension'
      });
      if (res && res.ok) {
        try { console.log('[AFG] mayo_nro_atencion OK', id, num, via); } catch (eL) {}
        return res;
      }
      lastErr = res || { ok: false, error: 'no_response' };
    } catch (eTab) {
      lastErr = { ok: false, error: String(eTab && eTab.message || eTab) };
    }
  }
  try { console.warn('[AFG] mayo_nro_atencion falló', id, lastErr); } catch (eW) {}
  return lastErr || { ok: false, error: 'no_anesfact_tab' };
}

var AFG_PDF_VENTANA_HORAS = 8;
var AFG_PDF_VENTANA_WIDE_H = 36;
var AFG_PDF_VENTANA_WEEK_H = 168;
var AFG_PDF_WIDE_DRY_RUN = false;
var AFG_PDF_SLACK_MIN = 15;
var AFG_PDF_MAX_BYTES = 1572864;
var AFG_PDF_RETRY_MIN = 10;
var AFG_PDF_RETRY_MAX = 6;
var AFG_PDF_FIRST_DELAY_MS = 5000;
var AFG_PDF_ALARM = 'afg-mayo-pdf-retry';

function afgPdfPad2(n) {
  return (n < 10 ? '0' : '') + n;
}

function afgPdfParseFojaDt(fecha, hora) {
  var f = String(fecha || '').trim();
  var h = String(hora || '').trim();
  var y = 0, mo = 0, d = 0;
  var iso = f.match(/^(\d{4})-(\d{2})-(\d{2})/);
  var dmy = f.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (iso) {
    y = Number(iso[1]); mo = Number(iso[2]); d = Number(iso[3]);
  } else if (dmy) {
    d = Number(dmy[1]); mo = Number(dmy[2]); y = Number(dmy[3]);
    if (y < 100) y += 2000;
  } else {
    return null;
  }
  var hm = h.match(/^(\d{1,2}):(\d{2})/);
  if (!hm) return null;
  var dt = new Date(y, mo - 1, d, Number(hm[1]), Number(hm[2]), 0, 0);
  if (isNaN(dt.getTime())) return null;
  return dt;
}

function afgPdfFmtDate(dt) {
  return afgPdfPad2(dt.getDate()) + '/' + afgPdfPad2(dt.getMonth() + 1) + '/' + dt.getFullYear();
}

function afgPdfFmtTime(dt) {
  return afgPdfPad2(dt.getHours()) + ':' + afgPdfPad2(dt.getMinutes());
}

/** try 1–3: 8h; 4: 36h; 5–6: 7d. */
function afgPdfVentanaHorasForTry(tryNo) {
  var n = Number(tryNo) || 0;
  if (n >= 5) return AFG_PDF_VENTANA_WEEK_H;
  if (n >= 4) return AFG_PDF_VENTANA_WIDE_H;
  return AFG_PDF_VENTANA_HORAS;
}

function buildReporteInternadoUrl(origin, nro, desde, hasta) {
  var base = String(origin || 'http://sanatoriomayo.myvnc.com:84').replace(/\/$/, '');
  return base + '/Reporte/ReporteListadoInternado'
    + '?pMeId=' + encodeURIComponent(nro)
    + '&pEventos=ProtocoloQuirurgico|ProtocoloAnestesico|'
    + '&pConFirma=true'
    + '&pFechaDesde=' + afgPdfFmtDate(desde)
    + '&pHoraDesde=' + afgPdfFmtTime(desde)
    + '&pFechaHasta=' + afgPdfFmtDate(hasta)
    + '&pHoraHasta=' + afgPdfFmtTime(hasta)
    + '&pAsIds=';
}

async function loadMayoPdfJobs() {
  try {
    var st = await chrome.storage.local.get(['afg_mayo_pdf_jobs']);
    return (st && st.afg_mayo_pdf_jobs && typeof st.afg_mayo_pdf_jobs === 'object')
      ? st.afg_mayo_pdf_jobs : {};
  } catch (e) {
    return {};
  }
}

async function saveMayoPdfJobs(jobs) {
  try { await chrome.storage.local.set({ afg_mayo_pdf_jobs: jobs || {} }); } catch (e) {}
}

async function upsertMayoPdfJob(intervId, patch) {
  var jobs = await loadMayoPdfJobs();
  var cur = jobs[intervId] || {};
  var next = Object.assign({}, cur, patch || {}, { intervId: intervId, updatedAt: Date.now() });
  jobs[intervId] = next;
  await saveMayoPdfJobs(jobs);
  return next;
}

async function deleteMayoPdfJob(intervId) {
  var jobs = await loadMayoPdfJobs();
  delete jobs[intervId];
  await saveMayoPdfJobs(jobs);
  var left = Object.keys(jobs).some(function (k) {
    return jobs[k] && jobs[k].pendingQx && (jobs[k].tries || 0) < AFG_PDF_RETRY_MAX;
  });
  if (!left) {
    try { await chrome.alarms.clear(AFG_PDF_ALARM); } catch (e) {}
  }
}

async function ensureMayoPdfAlarm() {
  try {
    var al = await chrome.alarms.get(AFG_PDF_ALARM);
    if (!al) {
      await chrome.alarms.create(AFG_PDF_ALARM, { periodInMinutes: AFG_PDF_RETRY_MIN });
    }
  } catch (e) {}
}

async function askAnesFactPdfMeta(intervId) {
  var tabs = await findAnesFactTabs();
  for (var i = 0; i < (tabs || []).length; i++) {
    try {
      var res = await chrome.tabs.sendMessage(tabs[i].id, {
        type: 'AFG_GET_MAYO_PDF_META',
        intervId: String(intervId)
      });
      if (res && res.ok) return res;
    } catch (e) {}
  }
  return null;
}

async function resolveMayoPdfMeta(intervId) {
  var id = String(intervId || '').trim();
  var jobs = await loadMayoPdfJobs();
  var job = jobs[id];
  var meta = await askAnesFactPdfMeta(id);
  var q = await pullQueueFromAnesFactTabs();
  var item = null;
  if (q && q.ok && q.queue && Array.isArray(q.queue.items)) {
    for (var i = 0; i < q.queue.items.length; i++) {
      if (String(q.queue.items[i].id) === id) { item = q.queue.items[i]; break; }
    }
  }
  var nro = String((meta && meta.nroAtencion) || (job && job.nro) || (item && item.mayo_nro_atencion) || '').replace(/\D/g, '');
  var fecha = String((meta && meta.fecha) || (job && job.fecha) || (item && item.fecha) || '').trim();
  var hora = String((meta && meta.hora) || (job && job.hora) || (item && item.hora) || '').trim();
  var ciru = String((meta && meta.ciru) || (job && job.ciru) || (item && item.ciru) || '').trim();
  return { nro: nro, fecha: fecha, hora: hora, ciru: ciru, intervId: id };
}

async function findGeclisaTabOrNull() {
  try {
    var tabs = await chrome.tabs.query({ url: 'http://sanatoriomayo.myvnc.com:84/*' });
    if (!tabs || !tabs.length) return null;
    var active = tabs.find(function (t) { return t.active; });
    return active || tabs[0];
  } catch (e) {
    return null;
  }
}

function scheduleMayoPdfFetch(intervId, delayMs) {
  var id = String(intervId || '').trim();
  if (!id) return;
  setTimeout(function () {
    fetchMayoPdfForInterv(id).catch(function (e) {
      try { console.warn('[AFG pdf] fetch fail', id, e); } catch (e2) {}
    });
  }, delayMs || AFG_PDF_FIRST_DELAY_MS);
}

async function fetchMayoPdfForInterv(intervId) {
  var id = String(intervId || '').trim();
  if (!id) return { ok: false, error: 'no_id' };
  var meta = await resolveMayoPdfMeta(id);
  if (!meta.nro || meta.nro.length < 4) {
    try { console.warn('[AFG pdf] sin nroAtencion, skip', id); } catch (e0) {}
    return { ok: false, error: 'no_nro' };
  }
  if (!meta.fecha || !meta.hora) {
    try { console.warn('[AFG pdf] sin fecha/hora, skip', id); } catch (e1) {}
    return { ok: false, error: 'no_fecha_hora' };
  }
  var start = afgPdfParseFojaDt(meta.fecha, meta.hora);
  if (!start) return { ok: false, error: 'bad_fecha_hora' };
  var jobsPre = await loadMayoPdfJobs();
  var nextTry = ((jobsPre[id] && jobsPre[id].tries) || 0) + 1;
  var ventanaH = afgPdfVentanaHorasForTry(nextTry);
  var wide = ventanaH > AFG_PDF_VENTANA_HORAS;
  var desde = new Date(start.getTime() - AFG_PDF_SLACK_MIN * 60000);
  var hasta = new Date(start.getTime() + ventanaH * 3600000);
  var gTab = await findGeclisaTabOrNull();
  if (!gTab || !gTab.id) {
    await upsertMayoPdfJob(id, {
      nro: meta.nro, fecha: meta.fecha, hora: meta.hora, ciru: meta.ciru, pendingQx: true
    });
    await ensureMayoPdfAlarm();
    try { console.warn('[AFG pdf] sin tab GECLISA, reintento luego', id); } catch (e2) {}
    return { ok: false, error: 'no_geclisa_tab' };
  }
  var origin = 'http://sanatoriomayo.myvnc.com:84';
  try { origin = new URL(gTab.url).origin; } catch (eO) {}
  var url = buildReporteInternadoUrl(origin, meta.nro, desde, hasta);
  if (nextTry > AFG_PDF_RETRY_MAX) {
    try { console.warn('[AFG pdf] tope reintentos', id, nextTry - 1); } catch (eT) {}
    return { ok: false, error: 'max_tries' };
  }
  try { console.log('[AFG pdf] GET', id, 'try', nextTry, 'ventanaH', ventanaH, 'wide', wide); } catch (eLog) {}
  await upsertMayoPdfJob(id, {
    nro: meta.nro, fecha: meta.fecha, hora: meta.hora, ciru: meta.ciru, url: url, tries: nextTry, pendingQx: true, wide: wide
  });

  var fetched = null;
  try {
    var frameId = await findFrameId(gTab.id, 'top');
    fetched = await chrome.tabs.sendMessage(gTab.id, {
      type: 'AFG_FETCH_INTERNADO_PDF',
      url: url,
      maxBytes: AFG_PDF_MAX_BYTES
    }, { frameId: frameId });
  } catch (eF) {
    try { console.warn('[AFG pdf] sendMessage fetch', eF); } catch (eF2) {}
    await ensureMayoPdfAlarm();
    return { ok: false, error: String(eF && eF.message || eF) };
  }
  if (!(fetched && fetched.ok && fetched.base64)) {
    var why = (fetched && fetched.error) || 'fetch_failed';
    try { console.warn('[AFG pdf] GET no ok', id, why, fetched && fetched.size); } catch (eW) {}
    if (why === 'too_large') {
      await deleteMayoPdfJob(id);
    } else {
      await ensureMayoPdfAlarm();
    }
    return { ok: false, error: why, fetch: fetched };
  }

  var commit = null;
  var tabs = await findAnesFactTabs();
  for (var t = 0; t < (tabs || []).length; t++) {
    try {
      commit = await chrome.tabs.sendMessage(tabs[t].id, {
        type: 'AFG_COMMIT_GECLISA_PDF',
        intervId: id,
        base64: fetched.base64,
        mime: fetched.mime || 'application/pdf',
        size: fetched.size || 0,
        nombre: 'Reporte.pdf',
        toast: !(wide && AFG_PDF_WIDE_DRY_RUN),
        wide: wide,
        dryRun: !!(wide && AFG_PDF_WIDE_DRY_RUN),
        ciru: meta.ciru || ''
      });
      if (commit && (commit.ok || commit.skipped)) break;
    } catch (eC) {}
  }
  if (commit && commit.dryRun) {
    await ensureMayoPdfAlarm();
    return commit;
  }
  if (commit && commit.skipped === 'manual') {
    await deleteMayoPdfJob(id);
    return commit;
  }
  if (commit && commit.ok && commit.complete) {
    await deleteMayoPdfJob(id);
    return commit;
  }
  if (commit && commit.ok) {
    await upsertMayoPdfJob(id, { pendingQx: true, nro: meta.nro, fecha: meta.fecha, hora: meta.hora, ciru: meta.ciru, url: url });
    await ensureMayoPdfAlarm();
    return commit;
  }
  await ensureMayoPdfAlarm();
  return commit || { ok: false, error: 'commit_failed' };
}

async function runPendingMayoPdfRetries() {
  var jobs = await loadMayoPdfJobs();
  var ids = Object.keys(jobs || {});
  var gTab = await findGeclisaTabOrNull();
  if (!gTab) return;
  for (var i = 0; i < ids.length; i++) {
    var job = jobs[ids[i]];
    if (!job || !job.pendingQx) continue;
    if ((job.tries || 0) >= AFG_PDF_RETRY_MAX) continue;
    try {
      await fetchMayoPdfForInterv(ids[i]);
    } catch (e) {
      try { console.warn('[AFG pdf] retry', ids[i], e); } catch (e2) {}
    }
  }
}

try {
  chrome.alarms.onAlarm.addListener(function (alarm) {
    if (!alarm || alarm.name !== AFG_PDF_ALARM) return;
    runPendingMayoPdfRetries().catch(function () {});
  });
} catch (eAl) {}

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
    clearTimeout(autoNextAfterSaveTimer);
    autoNextAfterSaveTimer = null;
    autoNextInFlight = false;
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
  // Lock en memoria: solo bloquea si hay corrida real
  if (queueRunnerBusy) {
    return {
      ok: false,
      error: 'runner_busy',
      message: 'Ya hay una foja en curso. Esperá o Abortar.',
      state: stateGate,
      busy: true
    };
  }
  // status=running en storage pero busy=false = hang anterior sin finally → liberar
  if (stateGate.status === 'running') {
    try {
      console.warn('[AFG runner] status=running huérfano (busy=false) → paused_error para destrabar');
    } catch (eStale) {}
    stateGate.status = 'paused_error';
    stateGate.message = 'Estado running huérfano liberado. Tocá Reintentar o Iniciar cola.';
    stateGate = await setRunnerState(stateGate);
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
    try {
      console.log('[AFG runner] mint+run111', item.id, item.pac);
    } catch (eLog) {}

    var mint = await mintTokenViaAnesFactBridge(item.id);
    if (!(mint && mint.ok && mint.foja && mint.foja.token)) {
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
    if (!paciente.sector) paciente.sector = item.sector || '';
    if (!paciente.fechaCirugia) paciente.fechaCirugia = item.fecha || '';
    if (!paciente.hora) paciente.hora = item.hora || '';

    var resolved = await resolvePaciente(paciente);
    if (!(resolved && resolved.ok)) {
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

    var fillOk = !!(runRes && runRes.fillOk);
    var paused = !!(runRes && runRes.paused);

    if (fillOk) {
      state = await setRunnerState(Object.assign(state, {
        status: 'awaiting_save',
        message: 'Foja lista — revisá y tocá GRABAR en GECLISA; la cola sigue sola',
        lastResult: runRes,
        currentPac: (resolved.paciente.apellido || '') + ', ' + (resolved.paciente.nombre || '')
      }));
      await patchQueueItemStatus(item.id, 'awaiting_save', '');
      try {
        var gTab = await findGeclisaTab();
        if (gTab && gTab.id) await armGrabarAutoNextWatcher(gTab.id);
      } catch (eArm) {
        try { console.warn('[AFG runner] no pude armar grabar-watch', eArm); } catch (e2) {}
      }
      return {
        ok: true,
        awaitingSave: true,
        userMessage: state.message,
        run: runRes,
        foja: mint.foja,
        state: state
      };
    }

    var why = (runRes && (runRes.message || runRes.error || runRes.reason)) ||
      (runRes && runRes.iframe && (runRes.iframe.message || runRes.iframe.error || runRes.iframe.reason)) ||
      'error_desconocido';
    if (typeof why === 'string' && why.indexOf('PAUSA:') === 0) why = why.replace(/^PAUSA:\s*/, '');
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
  } catch (eFatal) {
    var fatalMsg = String(eFatal && eFatal.message || eFatal);
    try { console.error('[AFG runner] fatal', fatalMsg); } catch (eF) {}
    state = await setRunnerState(Object.assign(state, {
      status: 'paused_error',
      message: 'Runner interrumpido: ' + fatalMsg,
      lastResult: { error: fatalMsg }
    }));
    try {
      await patchQueueItemStatus(item.id, 'paused_error', state.message);
    } catch (eP) {}
    return {
      ok: false,
      error: 'runner_fatal',
      message: state.message,
      state: state
    };
  } finally {
    // Punto 1: el lock SIEMPRE se libera, aunque run111 cuelgue y luego rejectee/throw
    queueRunnerBusy = false;
    try {
      var stFin = await getRunnerState();
      if (stFin && stFin.status === 'running') {
        stFin.status = 'paused_error';
        stFin.message = (stFin.message || '') +
          (stFin.message ? ' · ' : '') +
          'Lock liberado (finally). Reintentar o Abortar.';
        await setRunnerState(stFin);
        try {
          console.warn('[AFG runner] finally: status seguía running → paused_error');
        } catch (eW) {}
      }
    } catch (eFinally) {}
  }
}
