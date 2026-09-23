/**
 * Orquesta pasos 1–11.
 * Debugger: 1–2, fila paciente, Opciones (7), fila plantilla (10).
 * Click normal: lupa, Buscar, Evoluciones, Nuevo, Seleccionar plantilla.
 * detach SIEMPRE en finally (éxito, error o timeout).
 *
 * Diagnóstico persistente: chrome.storage.local.afg_diag_log (no hace falta
 * tener el SW abierto durante la prueba). Volcar desde AnesFact F12 con DIAG_DUMP.
 */
var AFG_DIAG_KEY = 'afg_diag_log';
var AFG_DIAG_MAX = 120;
var _afgDiagChain = Promise.resolve();

function afgDiagSafe(v) {
  try {
    return JSON.parse(JSON.stringify(v));
  } catch (e) {
    return String(v);
  }
}

/** Ring buffer persistente. src: bg|bridge|evweb */
function afgDiag(tag, detail, src) {
  var entry = {
    t: new Date().toISOString(),
    src: src || 'bg',
    tag: String(tag || ''),
    detail: detail == null ? null : afgDiagSafe(detail)
  };
  try { console.log('[AFG diag]', entry.src, entry.tag, entry.detail); } catch (eL) {}
  _afgDiagChain = _afgDiagChain.then(function () {
    return chrome.storage.local.get([AFG_DIAG_KEY]).then(function (got) {
      var pack = got && got[AFG_DIAG_KEY];
      if (!pack || !Array.isArray(pack.entries)) {
        pack = { version: 1, updatedAt: 0, entries: [] };
      }
      pack.entries.push(entry);
      if (pack.entries.length > AFG_DIAG_MAX) {
        pack.entries = pack.entries.slice(pack.entries.length - AFG_DIAG_MAX);
      }
      pack.updatedAt = Date.now();
      var o = {};
      o[AFG_DIAG_KEY] = pack;
      return chrome.storage.local.set(o);
    });
  }).catch(function () {});
  return _afgDiagChain;
}

function afgDiagGet() {
  return chrome.storage.local.get([AFG_DIAG_KEY]).then(function (got) {
    return (got && got[AFG_DIAG_KEY]) || { version: 1, updatedAt: 0, entries: [] };
  });
}

/** Últimas N entradas (para pegar en chat sin truncar). */
function afgDiagGetTail(limit) {
  var n = Math.max(1, Math.min(Number(limit) || 15, AFG_DIAG_MAX));
  return afgDiagGet().then(function (pack) {
    var all = (pack && pack.entries) || [];
    var slice = all.slice(Math.max(0, all.length - n));
    return {
      version: pack.version || 1,
      updatedAt: pack.updatedAt || 0,
      totalEntries: all.length,
      returned: slice.length,
      limit: n,
      entries: slice,
      // Una línea por evento — más corto para copiar
      lines: slice.map(function (e) {
        var det = '';
        try { det = e.detail == null ? '' : JSON.stringify(e.detail); } catch (eJ) { det = String(e.detail); }
        if (det.length > 180) det = det.slice(0, 177) + '...';
        return (e.t || '') + ' | ' + (e.src || '') + ' | ' + (e.tag || '') + (det ? (' | ' + det) : '');
      })
    };
  });
}

function afgDiagClear() {
  var o = {};
  o[AFG_DIAG_KEY] = { version: 1, updatedAt: Date.now(), entries: [] };
  return chrome.storage.local.set(o);
}

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
  if (msg && msg.type === 'AFG_OPEN_EVWEB') {
    afgDiag('AFG_OPEN_EVWEB', {}, 'bg');
    focusOrOpenEvwebTab()
      .then(function (r) {
        afgDiag('AFG_OPEN_EVWEB_done', r, 'bg');
        sendResponse(r);
      })
      .catch(function (e) {
        afgDiag('AFG_OPEN_EVWEB_fail', { error: String(e.message || e) }, 'bg');
        sendResponse({ ok: false, error: String(e.message || e) });
      });
    return true;
  }

  if (msg && msg.type === 'AFG_DIAG_LOG') {
    afgDiag(msg.tag || 'remote', msg.detail, msg.src || 'cs')
      .then(function () { sendResponse({ ok: true }); })
      .catch(function () { sendResponse({ ok: false }); });
    return true;
  }
  if (msg && msg.type === 'AFG_DIAG_DUMP') {
    afgDiagGetTail(msg.limit != null ? msg.limit : 15)
      .then(function (pack) { sendResponse({ ok: true, pack: pack }); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }
  if (msg && msg.type === 'AFG_DIAG_CLEAR') {
    afgDiagClear()
      .then(function () { sendResponse({ ok: true }); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }

  // —— EVWEB (AFG_EVW_*) — namespace aparte de GECLISA ——
  if (msg && msg.type === 'AFG_EVW_PING') {
    afgDiag('AFG_EVW_PING_msg', {}, 'bg');
    pingEvwebForm()
      .then(function (r) { sendResponse(r); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e && e.message || e) }); });
    return true;
  }
  if (msg && msg.type === 'AFG_EVW_QUEUE_GET_STATE') {
    getEvwebRunnerState()
      .then(function (r) { sendResponse({ ok: true, state: r }); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }
  if (msg && msg.type === 'AFG_EVW_QUEUE_START') {
    afgDiag('AFG_EVW_QUEUE_START', { via: 'runtime_message' }, 'bg');
    runEvwebQueueAction('start')
      .then(function (r) {
        afgDiag('AFG_EVW_QUEUE_START_result', {
          ok: !!(r && r.ok),
          error: r && r.error,
          message: r && r.message,
          status: r && r.state && r.state.status
        }, 'bg');
        sendResponse(r);
      })
      .catch(function (e) {
        afgDiag('AFG_EVW_QUEUE_START_throw', { error: String(e.message || e) }, 'bg');
        sendResponse({ ok: false, error: String(e.message || e) });
      });
    return true;
  }
  if (msg && msg.type === 'AFG_EVW_QUEUE_NEXT') {
    runEvwebQueueAction('next')
      .then(function (r) { sendResponse(r); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }
  if (msg && msg.type === 'AFG_EVW_QUEUE_RETRY') {
    runEvwebQueueAction('retry')
      .then(function (r) { sendResponse(r); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }
  if (msg && msg.type === 'AFG_EVW_QUEUE_ABORT') {
    runEvwebQueueAction('abort')
      .then(function (r) { sendResponse(r); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }
  if (msg && msg.type === 'AFG_EVW_RUN_SINGLE') {
    runEvwebSingle(msg)
      .then(function (r) { sendResponse(r); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }
  if (msg && msg.type === 'AFG_EVW_FILL_SINGLE') {
    runEvwebFillPami(msg)
      .then(function (r) { sendResponse(r); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }
  // CS → MAIN: set Obra Social + await PageRequestManager.endRequest (evita CSP inline)
  if (msg && msg.type === 'AFG_EVW_SET_OBRA_AND_WAIT') {
    setEvwebObraAndWaitPostback(
      msg.tabId,
      msg.frameId,
      msg.obraVal,
      msg.timeoutMs || 4000
    )
      .then(function (r) { sendResponse(r); })
      .catch(function (e) {
        sendResponse({
          ok: false,
          reason: 'executeScript_failed',
          error: String(e && e.message || e)
        });
      });
    return true;
  }
  // CS → MAIN: File + click/__doPostBack de #body_btnUploadArchivo (mundo página)
  if (msg && msg.type === 'AFG_EVW_SET_FILE_AND_CLICK_UPLOAD') {
    setEvwebFileAndClickUpload(msg)
      .then(function (r) { sendResponse(r); })
      .catch(function (e) {
        sendResponse({ ok: false, error: String(e && e.message || e) });
      });
    return true;
  }
  // CS → MAIN: clasificar cboTipoDocumento_N (change sintético aislado no postbackea)
  if (msg && msg.type === 'AFG_EVW_CLASSIFY_DOC_TIPO') {
    setEvwebClassifyDocTipo(msg)
      .then(function (r) { sendResponse(r); })
      .catch(function (e) {
        sendResponse({ ok: false, error: String(e && e.message || e) });
      });
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
  'https://anestfact.diegomc77.workers.dev/*',
  'https://*.diegomc77.workers.dev/*',
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
      message: 'No hay pestaña AnesFact abierta (Cloudflare Workers, GitHub Pages o localhost).'
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

/** Re-inyecta bridge en todas las pestañas AnesFact (post-reload de extensión). */
async function ensureBridgesOnAllAnesFactTabs() {
  var tabs = await findAnesFactTabs();
  var results = [];
  for (var i = 0; i < (tabs || []).length; i++) {
    try {
      results.push(await ensureAnesFactBridge(tabs[i].id));
    } catch (eTab) {
      results.push({ ok: false, error: String(eTab && eTab.message || eTab), tabId: tabs[i].id });
    }
  }
  return results;
}

/**
 * Desde AnesFact (externally_connectable): ensure bridge → opcional focus GECLISA → runQueueAction.
 * Evita el fallo silencioso cuando el content script murió tras reload de la extensión.
 */
async function handlePageQueueAction(pageAction) {
  pageAction = String(pageAction || 'QUEUE_START').toUpperCase();
  if (pageAction.indexOf('QUEUE_') !== 0) pageAction = 'QUEUE_' + pageAction;
  try {
    await ensureBridgesOnAllAnesFactTabs();
  } catch (eEns) {
    try { console.warn('[AFG] ensure bridges fail', eEns); } catch (eW) {}
  }
  if (pageAction === 'QUEUE_START' || pageAction === 'QUEUE_RETRY') {
    try {
      await focusOrOpenGeclisaTab();
    } catch (eOpen) {}
    await sleep(400);
  }
  var map = {
    QUEUE_START: 'start',
    QUEUE_RETRY: 'retry',
    QUEUE_ABORT: 'abort',
    QUEUE_NEXT: 'next'
  };
  return runQueueAction(map[pageAction] || 'start');
}

/** AnesFact → cola evweb (externally_connectable): focus ADAARC → runEvwebQueueAction. */
async function handlePageEvwebQueueAction(pageAction) {
  pageAction = String(pageAction || 'EVWEB_QUEUE_START').toUpperCase();
  if (pageAction.indexOf('EVWEB_QUEUE_') !== 0) {
    if (pageAction.indexOf('QUEUE_') === 0) pageAction = 'EVWEB_' + pageAction;
    else pageAction = 'EVWEB_QUEUE_' + pageAction.replace(/^EVWEB_/, '');
  }
  // Await cada diag: si el SW se suspende al enfocar ADAARC, sin await se pierde el buffer.
  await afgDiag('handlePageEvwebQueueAction', { pageAction: pageAction }, 'bg');

  // No bloquear el runner en ensureBridges (puede colgarse en pestañas zombie).
  // El mensaje external YA llegó: AnesFact ↔ SW funciona. Bridges = best-effort con tope.
  await afgDiag('ensure_bridges_begin', {}, 'bg');
  try {
    await Promise.race([
      ensureBridgesOnAllAnesFactTabs().then(function (r) {
        return afgDiag('ensure_bridges_done', {
          tabs: (r && r.length) || 0,
          oks: (r || []).filter(function (x) { return x && x.ok; }).length
        }, 'bg');
      }),
      sleep(1500).then(function () {
        return afgDiag('ensure_bridges_timeout', { ms: 1500 }, 'bg');
      })
    ]);
  } catch (eEns) {
    await afgDiag('ensure_bridges_fail', { error: String(eEns && eEns.message || eEns) }, 'bg');
  }

  try {
    if (pageAction === 'EVWEB_QUEUE_START' || pageAction === 'EVWEB_QUEUE_RETRY') {
      await afgDiag('focusOrOpenEvwebTab_begin', {}, 'bg');
      try {
        var opened = await focusOrOpenEvwebTab();
        await afgDiag('focusOrOpenEvwebTab_done', opened, 'bg');
      } catch (eOpen) {
        await afgDiag('focusOrOpenEvwebTab_fail', { error: String(eOpen && eOpen.message || eOpen) }, 'bg');
      }
      await afgDiag('sleep_before_runner', { ms: 800 }, 'bg');
      await sleep(800);
    }

    var map = {
      EVWEB_QUEUE_START: 'start',
      EVWEB_QUEUE_RETRY: 'retry',
      EVWEB_QUEUE_ABORT: 'abort',
      EVWEB_QUEUE_NEXT: 'next'
    };
    var action = map[pageAction] || 'start';
    await afgDiag('runEvwebQueueAction_call', { action: action }, 'bg');
    var r = await runEvwebQueueAction(action);
    await afgDiag('handlePageEvwebQueueAction_done', {
      pageAction: pageAction,
      ok: !!(r && r.ok),
      error: r && r.error,
      message: r && r.message,
      status: r && r.state && r.state.status
    }, 'bg');
    return r;
  } catch (eFatal) {
    await afgDiag('handlePageEvwebQueueAction_throw', {
      pageAction: pageAction,
      error: String(eFatal && eFatal.message || eFatal)
    }, 'bg');
    throw eFatal;
  }
}

function isAllowedAnesFactExternalSender(sender) {
  var u = String((sender && sender.url) || '');
  if (!u) return false;
  if (u.indexOf('https://diegomc77-hash.github.io/') === 0) return true;
  if (u.indexOf('https://anestfact.diegomc77.workers.dev/') === 0) return true;
  if (/^https:\/\/[a-z0-9-]+-anestfact\.diegomc77\.workers\.dev\//i.test(u)) return true;
  if (/^http:\/\/localhost([:\/]|$)/.test(u)) return true;
  if (/^http:\/\/127\.0\.0\.1([:\/]|$)/.test(u)) return true;
  return false;
}

try {
  chrome.runtime.onMessageExternal.addListener(function (msg, sender, sendResponse) {
    if (!isAllowedAnesFactExternalSender(sender)) {
      sendResponse({ ok: false, error: 'sender_not_allowed' });
      return false;
    }
    if (msg && msg.type === 'AFG_PAGE_QUEUE_ACTION') {
      handlePageQueueAction(msg.action || 'QUEUE_START')
        .then(function (r) { sendResponse(r); })
        .catch(function (e) { sendResponse({ ok: false, error: String(e && e.message || e) }); });
      return true;
    }
    if (msg && msg.type === 'AFG_PAGE_EVWEB_QUEUE_ACTION') {
      var actionExt = msg.action || 'EVWEB_QUEUE_START';
      // Fire-and-await chain: log + run + always reply (evita SW muerto a mitad)
      afgDiag('AFG_PAGE_EVWEB_QUEUE_ACTION', {
        action: actionExt,
        senderUrl: sender && sender.url
      }, 'bg')
        .then(function () {
          return handlePageEvwebQueueAction(actionExt);
        })
        .then(function (r) {
          return afgDiag('AFG_PAGE_EVWEB_QUEUE_ACTION_reply', {
            ok: !!(r && r.ok),
            error: r && r.error,
            message: r && r.message
          }, 'bg').then(function () { sendResponse(r); });
        })
        .catch(function (e) {
          afgDiag('AFG_PAGE_EVWEB_QUEUE_ACTION_catch', {
            error: String(e && e.message || e)
          }, 'bg').then(function () {
            sendResponse({ ok: false, error: String(e && e.message || e) });
          });
        });
      return true;
    }
    if (msg && msg.type === 'AFG_DIAG_DUMP') {
      afgDiagGetTail(msg.limit != null ? msg.limit : 15)
        .then(function (pack) { sendResponse({ ok: true, pack: pack }); })
        .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
      return true;
    }
    sendResponse({ ok: false, error: 'unknown_external_type' });
    return false;
  });
} catch (eExt) {
  try { console.warn('[AFG] onMessageExternal no disponible', eExt); } catch (e2) {}
}

function afgKickEnsureBridges(reason) {
  ensureBridgesOnAllAnesFactTabs()
    .then(function (r) {
      try { console.log('[AFG] ensure bridges', reason || '', r && r.length); } catch (e) {}
    })
    .catch(function (e) {
      try { console.warn('[AFG] ensure bridges fail', reason, e); } catch (e2) {}
    });
}

try {
  chrome.runtime.onInstalled.addListener(function () { afgKickEnsureBridges('onInstalled'); });
} catch (eInst) {}
try {
  chrome.runtime.onStartup.addListener(function () { afgKickEnsureBridges('onStartup'); });
} catch (eStart) {}
// SW cold start: si hay pestañas AnesFact abiertas, reparar bridge sin esperar un click
try {
  afgKickEnsureBridges('sw_boot');
} catch (eBoot) {}

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

/**
 * Pide docs (data URL) a AnesFact al momento del fill.
 * chrome.storage de la cola solo tiene docsMeta (sin PDF) para no romper cuota.
 */
async function fetchEvwebDocsViaAnesFactBridge(intervId, timeoutMs) {
  if (!intervId) return { ok: false, error: 'missing_intervId', docs: {}, keys: [] };
  var tabs = await findAnesFactTabs();
  if (!tabs || !tabs.length) {
    return {
      ok: false,
      error: 'no_anesfact_tab',
      message: 'Abrí AnesFact para adjuntar docs al fill evweb.',
      docs: {},
      keys: []
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
        type: 'AFG_FETCH_EVWEB_DOCS',
        intervId: String(intervId),
        timeoutMs: timeoutMs || 45000
      });
      await afgDiag('evweb_docs_fetch', {
        intervId: String(intervId),
        tabId: tab.id,
        ok: !!(res && res.ok),
        keys: (res && res.keys) || [],
        via: (res && res.via) || null,
        error: (res && res.error) || null
      }, 'bg');
      if (res && res.ok && res.docs) {
        return Object.assign({ tabId: tab.id }, res);
      }
      lastErr = res || { ok: false, error: 'empty_docs_response' };
    } catch (eTab) {
      lastErr = { ok: false, error: String(eTab.message || eTab) };
    }
  }
  return lastErr || { ok: false, error: 'docs_fetch_failed', docs: {}, keys: [] };
}

function evwebDocsDataKeys(docs) {
  docs = docs || {};
  return ['anest', 'qx', 'auth'].filter(function (k) {
    return !!(docs[k] && docs[k].data);
  });
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

async function focusOrOpenEvwebTab() {
  var urlPattern = 'https://adaarc.evweb.com.ar/*';
  var tabs = await chrome.tabs.query({ url: urlPattern });
  if (tabs && tabs.length) {
    var withForm = tabs.filter(function (t) {
      return /frmCargaDeIntervencion\.aspx/i.test(String(t.url || '')) &&
        !/frmUsuarioSinLoguear/i.test(String(t.url || ''));
    });
    var pool = withForm.length ? withForm : tabs;
    var tab = pool.find(function (t) { return t.active; }) || pool[0];
    var onForm = /frmCargaDeIntervencion\.aspx/i.test(String(tab.url || '')) &&
      !/frmUsuarioSinLoguear/i.test(String(tab.url || ''));
    if (!onForm) {
      var target = await resolveEvwebFormNavigationTarget(tab);
      await afgDiag('focusOrOpenEvweb_nav', {
        from: tab.url || null,
        to: target.url,
        via: target.via,
        idUsuario: target.idUsuario || null
      }, 'bg');
      await chrome.tabs.update(tab.id, { url: target.url, active: true });
    } else {
      var idKeep = parseEvwebIdUsuarioFromUrl(tab.url);
      if (idKeep) await rememberEvwebIdUsuario(idKeep);
      await chrome.tabs.update(tab.id, { active: true });
    }
    if (tab.windowId != null) {
      try { await chrome.windows.update(tab.windowId, { focused: true }); } catch (e) {}
    }
    return {
      ok: true,
      reused: true,
      tabId: tab.id,
      count: tabs.length,
      navigatedToForm: !onForm
    };
  }
  var remembered = await loadRememberedEvwebIdUsuario();
  var createUrl = buildEvwebFormUrl(remembered);
  var created = await chrome.tabs.create({
    url: createUrl,
    active: true
  });
  return {
    ok: true,
    reused: false,
    tabId: created.id,
    count: 0,
    navigatedToForm: true,
    idUsuario: remembered || null
  };
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
    mayo_nro_atencion: foja.mayo_nro_atencion || '',
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
    mayo_nro_atencion: (partial.mayo_nro_atencion || (fromFoja && fromFoja.mayo_nro_atencion) || '').trim(),
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
  var ATTEMPTS = 3;
  var lastErr = null;
  for (var attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      var loc1 = await sendToRole(tabId, 'top', { type: 'AFG_LOCATE_STEP1' });
      if (!loc1 || !loc1.ok) throw new Error('Paso 1 locate: ' + ((loc1 && loc1.error) || 'fail'));
      await debuggerClick(tabId, loc1.x, loc1.y);
      await humanDelay();
      var loc2 = await sendToRole(tabId, 'top', { type: 'AFG_LOCATE_STEP2', timeout: 4000 });
      if (!loc2 || !loc2.ok) throw new Error('Paso 2 locate: ' + ((loc2 && loc2.error) || 'fail'));
      await debuggerClick(tabId, loc2.x, loc2.y);
      await humanDelay();
      return { ok: true, step: 'top_1_2_done_debugger', step1: loc1, step2: loc2, attempts: attempt };
    } catch (eAttempt) {
      lastErr = eAttempt;
      try { console.warn('[AFG bg] Paso 1-2 intento #' + attempt + ' falló:', String(eAttempt && eAttempt.message || eAttempt)); } catch (eLog) {}
      if (attempt < ATTEMPTS) await sleep(600);
    }
  }
  throw lastErr || new Error('Paso 1-2: agotados ' + ATTEMPTS + ' intentos');
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

function firstPendingQueueItem(queue, preferId, opts) {
  var items = (queue && queue.items) || [];
  opts = opts || {};
  var skipPaused = !!opts.skipPaused;
  var skipIds = opts.skipIds || {};
  var preferNewest = !!opts.preferNewest;
  var STALE_RUNNING_MS = opts.staleRunningMs != null ? Number(opts.staleRunningMs) : 180000;
  var now = Date.now();
  if (preferId) {
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].id) === String(preferId) && items[i].status !== 'done') return items[i];
    }
  }
  // Preferencia explícita de la cola (último encolado desde AnesFact)
  if (!preferId && queue && queue.lastEnqueuedId) {
    for (var pi = 0; pi < items.length; pi++) {
      if (String(items[pi].id) !== String(queue.lastEnqueuedId)) continue;
      if (items[pi].status === 'done') break;
      if (skipIds[String(items[pi].id)]) break;
      var stP = items[pi].status || 'queued';
      var staleP = stP === 'running' && (now - (items[pi].updatedAt || 0)) > STALE_RUNNING_MS;
      if (skipPaused) {
        if (stP === 'queued' || staleP) return items[pi];
      } else if (stP === 'running' || stP === 'awaiting_save' || stP === 'queued' || stP === 'paused_error') {
        return items[pi];
      }
      break;
    }
  }
  var candidates = [];
  for (var j = 0; j < items.length; j++) {
    var st = items[j].status || 'queued';
    if (st === 'done') continue;
    if (skipIds[String(items[j].id)]) continue;
    var isStaleRunning = st === 'running' && (now - (items[j].updatedAt || 0)) > STALE_RUNNING_MS;
    if (skipPaused) {
      if (st === 'queued' || isStaleRunning) candidates.push(items[j]);
      continue;
    }
    if (st === 'running' || st === 'awaiting_save' || st === 'queued' || st === 'paused_error') {
      candidates.push(items[j]);
    }
  }
  if (!candidates.length) return null;
  if (preferNewest && candidates.length > 1) {
    candidates.sort(function (a, b) {
      var ta = Number(a.addedAt || a.updatedAt || 0);
      var tb = Number(b.addedAt || b.updatedAt || 0);
      return tb - ta;
    });
  }
  return candidates[0];
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
    if (state.status === 'awaiting_save' && state.currentIntervId) {
      await patchQueueItemStatus(state.currentIntervId, 'done', '');
      state.processedIds = (state.processedIds || []).concat([String(state.currentIntervId)]);
      state.currentIntervId = null;
      state.currentPac = '';
      state.status = 'idle';
      state.message = 'Buscando siguiente…';
      await setRunnerState(state);
    } else if (state.status === 'paused_error' && state.currentIntervId) {
      state.processedIds = (state.processedIds || []).concat([String(state.currentIntervId)]);
      state.currentIntervId = null;
      state.currentPac = '';
      state.status = 'idle';
      state.message = 'Salteado (en pausa) — siguiente…';
      await setRunnerState(state);
    } else {
      return {
        ok: false,
        error: 'not_awaiting_save',
        message: 'No hay foja esperando “Siguiente”. Iniciá la cola o reintentá.',
        state: state
      };
    }
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
  var preferId = action === 'retry' ? state.currentIntervId : null;
  if (action === 'start' || action === 'next') preferId = null;
  var skipIds = {};
  if (action === 'start' || action === 'next') {
    (state.processedIds || []).forEach(function (id) { skipIds[String(id)] = true; });
  }
  var autoAdvance = (action === 'start' || action === 'next');
  var MAX_CONSECUTIVE_FAILURES = 3;
  var consecutiveFailures = 0;
  queueRunnerBusy = true;
  try {
    while (true) {
      var pulled = await pullQueueFromAnesFactTabs();
      var queue = pulled && pulled.ok ? pulled.queue : null;
      if (!queue || !queue.items || !queue.items.length) {
        state = await setRunnerState(Object.assign(defaultRunnerState(), {
          status: 'done_all',
          message: 'Cola vacía en AnesFact'
        }));
        return { ok: false, error: 'empty_queue', message: state.message, state: state };
      }
      var item = firstPendingQueueItem(queue, preferId, {
        skipPaused: autoAdvance,
        skipIds: skipIds
      });
      if (!item) {
        var pausedLeft = 0;
        ((queue && queue.items) || []).forEach(function (it) {
          if ((it.status || '') === 'paused_error') pausedLeft += 1;
        });
        state = await setRunnerState(Object.assign(state, {
          status: 'done_all',
          currentIntervId: null,
          currentPac: '',
          message: pausedLeft
            ? ('No quedan queued. Hay ' + pausedLeft + ' en pausa (Reintentar o sacalos de la cola).')
            : 'Cola completa — no quedan pendientes'
        }));
        return { ok: true, doneAll: true, state: state };
      }
      state.status = 'running';
      state.currentIntervId = String(item.id);
      state.currentPac = item.pac || '';
      state.message = 'Minteando token…';
      state.lastResult = null;
      if (!state.startedAt) state.startedAt = Date.now();
      await setRunnerState(state);
      await patchQueueItemStatus(item.id, 'running', '');
      var itemFailed = false;
      var itemFatal = false;
      var returnValue = null;
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
          itemFailed = true;
          returnValue = { ok: false, error: 'mint_failed', message: state.message, mint: mint, state: state };
        } else {
          state.message = 'Navegando GECLISA (reload home → 1–12)…';
          await setRunnerState(state);
          var paciente = fojaToPaciente(mint.foja) || {};
          paciente.token = mint.foja.token;
          paciente.intervId = String(item.id);
          if (!paciente.sector) paciente.sector = item.sector || '';
          if (!paciente.fechaCirugia) paciente.fechaCirugia = item.fecha || '';
          if (!paciente.hora) paciente.hora = item.hora || '';
          if (!paciente.mayo_nro_atencion) paciente.mayo_nro_atencion = item.mayo_nro_atencion || '';
          var resolved = await resolvePaciente(paciente);
          if (!(resolved && resolved.ok)) {
            state = await setRunnerState(Object.assign(state, {
              status: 'paused_error',
              message: (resolved && resolved.message) || 'resolvePaciente falló',
              lastResult: resolved
            }));
            await patchQueueItemStatus(item.id, 'paused_error', state.message);
            itemFailed = true;
            returnValue = { ok: false, error: 'resolve_failed', resolved: resolved, state: state };
          } else {
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
            var pausedFlag = !!(runRes && runRes.paused);
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
              message: pausedFlag ? ('PAUSA: ' + why) : ('Error: ' + why),
              lastResult: runRes
            }));
            await patchQueueItemStatus(item.id, 'paused_error', state.message);
            itemFailed = true;
            returnValue = {
              ok: false,
              paused: pausedFlag,
              error: why,
              message: state.message,
              run: runRes,
              state: state
            };
          }
        }
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
        itemFailed = true;
        itemFatal = true;
        returnValue = {
          ok: false,
          error: 'runner_fatal',
          message: state.message,
          state: state
        };
      }
      if (!itemFailed) return returnValue;
      if (!autoAdvance || itemFatal) return returnValue;
      consecutiveFailures++;
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        state = await setRunnerState(Object.assign(state, {
          status: 'paused_error',
          message: consecutiveFailures + ' fallos seguidos — freno el avance automático. ' +
            'Último: ' + (state.message || '') + '. Revisá y tocá Reintentar o Iniciar cola.'
        }));
        return {
          ok: false,
          error: 'too_many_consecutive_failures',
          message: state.message,
          state: state
        };
      }
      // Auto-avanza solo: vuelve al inicio del while y busca el próximo pendiente.
      state.currentIntervId = null;
      state.currentPac = '';
      state.status = 'idle';
      await setRunnerState(state);
    }
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

/* ============================================================================
 * EVWEB (AFG_EVW_*) — Lote 1: ping/cola; Lote 2: fill PAMI (sin auto-submit).
 * No toca runQueueAction / GECLISA.
 * ============================================================================ */

var EVWEB_HOST_PATTERN = 'https://adaarc.evweb.com.ar/*';
/**
 * Base del formulario de carga. ADAARC exige idUsuario de la sesión
 * (?accion=agregar&idUsuario=NNN); sin eso redirige a frmUsuarioSinLoguear.
 */
var EVWEB_FORM_URL_BASE =
  'https://adaarc.evweb.com.ar/Pages/Asociaciones/frmCargaDeIntervencion.aspx?accion=agregar';
/** @deprecated usar buildEvwebFormUrl / resolveEvwebFormNavigationTarget */
var EVWEB_FORM_URL = EVWEB_FORM_URL_BASE;
var EVWEB_STALE_RUNNING_MS = 180000;
/** Lock propio — no comparte queueRunnerBusy de GECLISA. */
var evwebRunnerBusy = false;
/** Timestamp local del lock (SW cold start → busy=false, pero storage puede quedar running). */
var evwebRunnerBusyAt = 0;
var EVWEB_BUSY_STALE_MS = 90000;

function parseEvwebIdUsuarioFromUrl(url) {
  try {
    var u = new URL(String(url || ''), 'https://adaarc.evweb.com.ar/');
    var id = u.searchParams.get('idUsuario') || u.searchParams.get('idusuario');
    if (id && /^\d+$/.test(id)) return id;
  } catch (e) {}
  var m = String(url || '').match(/[?&]idUsuario=(\d+)/i);
  return m ? m[1] : '';
}

function buildEvwebFormUrl(idUsuario) {
  var id = String(idUsuario || '').trim();
  if (id && /^\d+$/.test(id)) {
    return EVWEB_FORM_URL_BASE + '&idUsuario=' + encodeURIComponent(id);
  }
  return EVWEB_FORM_URL_BASE;
}

async function rememberEvwebIdUsuario(id) {
  var s = String(id || '').trim();
  if (!s || !/^\d+$/.test(s)) return;
  try {
    await chrome.storage.local.set({ afg_evweb_id_usuario: s });
  } catch (e) {}
}

async function loadRememberedEvwebIdUsuario() {
  try {
    var g = await chrome.storage.local.get(['afg_evweb_id_usuario']);
    var s = g && g.afg_evweb_id_usuario ? String(g.afg_evweb_id_usuario) : '';
    return /^\d+$/.test(s) ? s : '';
  } catch (e) {
    return '';
  }
}

/**
 * Saca idUsuario / link al form desde la pestaña ADAARC logueada
 * (URL, menú, HTML) — sin eso la navegación cae en SinLoguear.
 */
async function scrapeEvwebSessionHints(tabId) {
  try {
    var results = await chrome.scripting.executeScript({
      target: { tabId: tabId, allFrames: true },
      func: function () {
        var idUsuario = '';
        var formHref = '';
        try {
          var sp = new URLSearchParams(location.search || '');
          idUsuario = sp.get('idUsuario') || sp.get('idusuario') || '';
        } catch (e0) {}
        if (!idUsuario) {
          var mHref = String(location.href || '').match(/[?&]idUsuario=(\d+)/i);
          if (mHref) idUsuario = mHref[1];
        }
        var html = '';
        try {
          html = (document.documentElement && document.documentElement.innerHTML) || '';
        } catch (e1) {}
        if (!idUsuario) {
          var mHtml = html.match(/idUsuario\s*[=:]\s*['"]?(\d{1,8})/i);
          if (mHtml) idUsuario = mHtml[1];
        }
        var anchors = [];
        try {
          anchors = document.querySelectorAll('a[href*="frmCargaDeIntervencion"], a[href*="CargaDeIntervencion"]');
        } catch (e2) {}
        for (var i = 0; i < anchors.length; i++) {
          var href = '';
          try {
            href = anchors[i].href || anchors[i].getAttribute('href') || '';
          } catch (e3) {}
          if (!href) continue;
          if (!formHref) formHref = href;
          var mA = href.match(/[?&]idUsuario=(\d+)/i);
          if (mA) {
            idUsuario = idUsuario || mA[1];
            formHref = href;
            break;
          }
        }
        return {
          href: location.href,
          idUsuario: idUsuario || '',
          formHref: formHref || ''
        };
      }
    });
    var best = { idUsuario: '', formHref: '' };
    for (var i = 0; i < (results || []).length; i++) {
      var r = results[i] && results[i].result;
      if (!r) continue;
      if (r.idUsuario && !best.idUsuario) best.idUsuario = String(r.idUsuario);
      if (r.formHref && /idUsuario=\d+/i.test(r.formHref)) {
        best.formHref = r.formHref;
        var m = r.formHref.match(/idUsuario=(\d+)/i);
        if (m) best.idUsuario = best.idUsuario || m[1];
      } else if (r.formHref && !best.formHref) {
        best.formHref = r.formHref;
      }
    }
    return best;
  } catch (e) {
    return { idUsuario: '', formHref: '' };
  }
}

async function resolveEvwebFormNavigationTarget(tab) {
  var id = parseEvwebIdUsuarioFromUrl(tab && tab.url);
  var hints = { idUsuario: '', formHref: '' };
  if (tab && tab.id) {
    hints = await scrapeEvwebSessionHints(tab.id);
  }
  if (hints.idUsuario) id = id || String(hints.idUsuario);
  if (!id) id = await loadRememberedEvwebIdUsuario();
  if (id) await rememberEvwebIdUsuario(id);

  if (hints.formHref && /idUsuario=\d+/i.test(hints.formHref)) {
    return { url: hints.formHref, idUsuario: id, via: 'menu_link' };
  }
  if (hints.formHref && id) {
    var u = hints.formHref;
    if (!/idUsuario=/i.test(u)) {
      u += (u.indexOf('?') >= 0 ? '&' : '?') + 'idUsuario=' + encodeURIComponent(id);
    }
    return { url: u, idUsuario: id, via: 'menu_link_plus_id' };
  }
  return {
    url: buildEvwebFormUrl(id),
    idUsuario: id,
    via: id ? 'built_with_id' : 'built_without_id'
  };
}

function defaultEvwebRunnerState() {
  return {
    status: 'idle',
    currentIntervId: null,
    currentPac: '',
    message: '',
    lastResult: null,
    processedIds: [],
    startedAt: null,
    busyAt: null,
    updatedAt: Date.now()
  };
}

function defaultEvwebQueue() {
  return { version: 1, updatedAt: Date.now(), items: [], lastEnqueuedId: null };
}

/**
 * Tras context invalidated / SW muerto: status queda running|awaiting_confirm
 * y el ítem en paused_error → Iniciar no manda PING (skipPaused). Liberar.
 */
async function liberarEvwebLocksForFreshStart(reason) {
  reason = reason || 'fresh_start';
  var st = await getEvwebRunnerState();
  var refresh = await refreshEvwebQueueFromAnesFact({ allowStorageFallback: true });
  var q = (refresh && refresh.queue) ? refresh.queue : await getEvwebQueue();
  var idsInQueue = {};
  (q.items || []).forEach(function (it) {
    if (it && it.id != null) idsInQueue[String(it.id)] = true;
  });
  if (st && st.currentIntervId && !idsInQueue[String(st.currentIntervId)]) {
    st.currentIntervId = null;
    st.currentPac = '';
  }
  var requeued = [];
  var now = Date.now();
  var prevBusy = !!evwebRunnerBusy;
  var prevStatus = st && st.status;
  var busyStale = prevBusy && evwebRunnerBusyAt &&
    (now - evwebRunnerBusyAt > EVWEB_BUSY_STALE_MS);
  var storageStale = st && (st.status === 'running' || st.status === 'awaiting_confirm') &&
    st.busyAt && (now - Number(st.busyAt) > EVWEB_BUSY_STALE_MS);

  // Reencolar ítem actual + último encolado si están pausados/running/awaiting
  var ids = {};
  if (st && st.currentIntervId) ids[String(st.currentIntervId)] = true;
  if (q && q.lastEnqueuedId && idsInQueue[String(q.lastEnqueuedId)]) {
    ids[String(q.lastEnqueuedId)] = true;
  }
  if (st && st.currentIntervId && idsInQueue[String(st.currentIntervId)]) {
    ids[String(st.currentIntervId)] = true;
  }
  (q.items || []).forEach(function (it) {
    if (!it || !idsInQueue[String(it.id)]) return;
    var s = it.status || '';
    if (s === 'running' || s === 'awaiting_confirm') {
      it.status = 'queued';
      it.message = 'Reencolada (' + reason + ')';
      it.updatedAt = now;
      requeued.push(String(it.id));
    } else if (s === 'paused_error' && ids[String(it.id)]) {
      it.status = 'queued';
      it.message = 'Reencolada (' + reason + ')';
      it.updatedAt = now;
      requeued.push(String(it.id));
    }
  });

  var needs =
    prevBusy ||
    busyStale ||
    storageStale ||
    (st && (st.status === 'running' || st.status === 'awaiting_confirm')) ||
    requeued.length > 0;

  if (!needs) {
    await afgDiag('evweb_lock_check_clean', {
      status: prevStatus,
      busy: prevBusy
    }, 'bg');
    return { ok: true, liberated: false, state: st };
  }

  if (requeued.length) {
    await setEvwebQueue(slimEvwebQueueForStorage(q));
  }
  evwebRunnerBusy = false;
  evwebRunnerBusyAt = 0;
  var idle = defaultEvwebRunnerState();
  idle.message = 'Locks liberados (' + reason + ')' +
    (requeued.length ? (' · reencolados: ' + requeued.join(',')) : '');
  idle.processedIds = [];
  await setEvwebRunnerState(idle);
  await afgDiag('evweb_locks_liberated', {
    reason: reason,
    prevStatus: prevStatus,
    prevBusy: prevBusy,
    busyStale: !!busyStale,
    storageStale: !!storageStale,
    requeued: requeued
  }, 'bg');
  return { ok: true, liberated: true, requeued: requeued, state: idle };
}

async function getEvwebRunnerState() {
  try {
    var sess = await chrome.storage.session.get(['afg_evweb_runner_state']);
    if (sess.afg_evweb_runner_state && sess.afg_evweb_runner_state.status) {
      return sess.afg_evweb_runner_state;
    }
  } catch (e) {}
  try {
    var loc = await chrome.storage.local.get(['afg_evweb_runner_state']);
    if (loc.afg_evweb_runner_state && loc.afg_evweb_runner_state.status) {
      return loc.afg_evweb_runner_state;
    }
  } catch (e2) {}
  return defaultEvwebRunnerState();
}

async function setEvwebRunnerState(state) {
  state = state || defaultEvwebRunnerState();
  state.updatedAt = Date.now();
  try { await chrome.storage.session.set({ afg_evweb_runner_state: state }); } catch (e) {}
  try { await chrome.storage.local.set({ afg_evweb_runner_state: state }); } catch (e2) {}
  return state;
}

async function getEvwebQueue() {
  try {
    var sess = await chrome.storage.session.get(['afg_evweb_queue']);
    if (sess.afg_evweb_queue && Array.isArray(sess.afg_evweb_queue.items)) {
      return sess.afg_evweb_queue;
    }
  } catch (e) {}
  try {
    var loc = await chrome.storage.local.get(['afg_evweb_queue']);
    if (loc.afg_evweb_queue && Array.isArray(loc.afg_evweb_queue.items)) {
      return loc.afg_evweb_queue;
    }
  } catch (e2) {}
  return defaultEvwebQueue();
}

/** Sin PDFs en chrome.storage (cuota). Igual que bridge slimEvwebQueueForStorage. */
function slimEvwebQueueForStorage(queue) {
  queue = queue || defaultEvwebQueue();
  var items = (queue.items || []).map(function (it) {
    if (!it || typeof it !== 'object') return it;
    var copy = Object.assign({}, it);
    var docs = copy.docs || {};
    var meta = {};
    ['anest', 'qx', 'auth'].forEach(function (k) {
      var d = docs[k];
      if (!d) return;
      meta[k] = {
        nombre: d.nombre || k,
        tipo: d.tipo || '',
        hasData: !!(d.data),
        size: d.data ? String(d.data).length : (d.size || 0),
        idb: !!d.idb,
        aliasOf: d.aliasOf || null
      };
    });
    copy.docsMeta = meta;
    delete copy.docs;
    return copy;
  });
  return {
    version: Number(queue.version) || 1,
    updatedAt: queue.updatedAt || Date.now(),
    lastEnqueuedId: queue.lastEnqueuedId != null ? String(queue.lastEnqueuedId) : null,
    items: items
  };
}

/** Fuente de verdad: localStorage afg_evweb_queue en pestaña AnesFact (como GECLISA). */
async function pullEvwebQueueFromAnesFactTabs() {
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
            var raw = localStorage.getItem('afg_evweb_queue');
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
    return {
      ok: false,
      error: 'no_evweb_queue',
      message: 'Sin cola evweb en AnesFact (afg_evweb_queue).',
      inspected: inspected
    };
  }
  var queue = {
    version: Number(best.version) || 1,
    updatedAt: best.updatedAt || Date.now(),
    lastEnqueuedId: best.lastEnqueuedId != null ? String(best.lastEnqueuedId) : null,
    items: best.items
  };
  return { ok: true, source: 'anesfact_tab', queue: queue, inspected: inspected };
}

/**
 * Relee cola desde AnesFact y pisa chrome.storage (lista de pacientes).
 * Conserva status del runner solo para ids que siguen en la cola LS.
 */
async function refreshEvwebQueueFromAnesFact(opts) {
  opts = opts || {};
  var pulled = await pullEvwebQueueFromAnesFactTabs();
  if (!pulled.ok || !pulled.queue) {
    if (opts.allowStorageFallback) {
      var qFallback = await getEvwebQueue();
      return {
        ok: true,
        source: 'storage_fallback',
        queue: qFallback,
        fullDocs: false,
        pullError: pulled.error || null
      };
    }
    return pulled;
  }
  var lsQueue = pulled.queue;
  var stored = await getEvwebQueue();
  var byId = {};
  (stored.items || []).forEach(function (it) {
    if (it && it.id != null) byId[String(it.id)] = it;
  });
  var mergedItems = (lsQueue.items || []).map(function (lsIt) {
    var copy = Object.assign({}, lsIt);
    var st = byId[String(lsIt.id)];
    if (st) {
      var extStatus = st.status || '';
      if (extStatus && extStatus !== 'queued') {
        copy.status = extStatus;
        copy.message = st.message || copy.message || '';
      }
    }
    return copy;
  });
  var merged = {
    version: lsQueue.version,
    updatedAt: lsQueue.updatedAt,
    lastEnqueuedId: lsQueue.lastEnqueuedId,
    items: mergedItems
  };
  await setEvwebQueue(slimEvwebQueueForStorage(merged));
  await afgDiag('evweb_queue_refreshed', {
    source: pulled.source,
    items: merged.items.length,
    lastEnqueuedId: merged.lastEnqueuedId,
    pacs: merged.items.map(function (it) {
      return { id: it.id, pac: it.pac, st: it.status };
    })
  }, 'bg');
  return {
    ok: true,
    source: pulled.source,
    queue: merged,
    fullDocs: true
  };
}

async function setEvwebQueue(queue) {
  queue = queue || defaultEvwebQueue();
  queue.updatedAt = Date.now();
  try { await chrome.storage.session.set({ afg_evweb_queue: queue }); } catch (e) {}
  try { await chrome.storage.local.set({ afg_evweb_queue: queue }); } catch (e2) {}
  return queue;
}

async function patchEvwebQueueItemStatus(intervId, status, message) {
  var id = String(intervId || '').trim();
  if (!id) return;
  var q = await getEvwebQueue();
  var items = q.items || [];
  var hit = null;
  for (var i = 0; i < items.length; i++) {
    if (String(items[i].id) === id) {
      hit = items[i];
      break;
    }
  }
  if (!hit) return;
  hit.status = status;
  hit.message = message || '';
  hit.updatedAt = Date.now();
  await setEvwebQueue(q);
}

async function findEvwebTab() {
  var tabs = await chrome.tabs.query({ url: EVWEB_HOST_PATTERN });
  if (!tabs || !tabs.length) {
    throw new Error(
      'No hay pestaña de ADAARC/evweb. Iniciar cola debería abrirla; si no, abrí adaarc.evweb.com.ar logueado.'
    );
  }
  var withForm = tabs.filter(function (t) {
    return /frmCargaDeIntervencion\.aspx/i.test(String(t.url || ''));
  });
  var pool = withForm.length ? withForm : tabs;
  return pool.find(function (t) { return t.active; }) || pool[0];
}

function evwebFormMissingError(url) {
  var u = String(url || '');
  if (/frmUsuarioSinLoguear/i.test(u)) {
    return (
      'ADAARC rechazó la navegación (frmUsuarioSinLoguear): falta idUsuario de tu sesión. ' +
      'Abrí a mano “Carga de intervención” una vez (URL con idUsuario=…), o asegurate de estar logueado en la home y reintentá Iniciar cola.'
    );
  }
  return (
    'No encontré el formulario de carga en ADAARC (#body_cboObraSocial). ' +
    'Hace falta estar logueado. Si ves la home, Iniciar cola debería ir a carga con idUsuario; ' +
    'si sigue fallando, abrí a mano esa pantalla y reintentá. URL: ' + u
  );
}

/** true si algún frame tiene #body_cboObraSocial; si no, null. */
async function probeEvwebFormFrameId(tabId) {
  try {
    var frameResults = await chrome.scripting.executeScript({
      target: { tabId: tabId, allFrames: true },
      func: function () {
        return {
          isTop: window === window.top,
          hasObra: !!document.getElementById('body_cboObraSocial'),
          href: location.href
        };
      }
    });
    for (var i = 0; i < (frameResults || []).length; i++) {
      var fr = frameResults[i];
      var r = fr.result || {};
      if (r.hasObra) return fr.frameId;
    }
  } catch (e) {
    /* tab aún cargando / restricted */
  }
  return null;
}

async function waitEvwebTabComplete(tabId, timeoutMs) {
  timeoutMs = timeoutMs || 15000;
  var start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      var t = await chrome.tabs.get(tabId);
      if (t && t.status === 'complete') return t;
    } catch (e) {
      throw new Error('La pestaña ADAARC se cerró mientras cargaba el formulario');
    }
    await sleep(250);
  }
  return chrome.tabs.get(tabId);
}

/**
 * Asegura pestaña en pantalla de carga con #body_cboObraSocial.
 * Navega con idUsuario de la sesión (menú / URL / storage); sin eso ADAARC manda a SinLoguear.
 */
async function ensureEvwebFormReady(tab) {
  if (!tab || !tab.id) throw new Error('Sin pestaña ADAARC');
  var tabId = tab.id;
  var frameId = await probeEvwebFormFrameId(tabId);
  if (frameId != null) {
    var idOk = parseEvwebIdUsuarioFromUrl(tab.url);
    if (idOk) await rememberEvwebIdUsuario(idOk);
    await afgDiag('evweb_form_already', { tabId: tabId, url: tab.url || null, frameId: frameId }, 'bg');
    return { tab: tab, frameId: frameId, navigated: false };
  }

  // Si ya caímos en SinLoguear, volvemos a intentar con idUsuario resuelto
  var target = await resolveEvwebFormNavigationTarget(tab);
  await afgDiag('evweb_form_navigate', {
    tabId: tabId,
    from: tab.url || null,
    to: target.url,
    via: target.via,
    idUsuario: target.idUsuario || null
  }, 'bg');

  if (!target.idUsuario && !/idUsuario=\d+/i.test(target.url)) {
    await afgDiag('evweb_form_nav_without_id', { to: target.url }, 'bg');
  }

  await chrome.tabs.update(tabId, { url: target.url, active: true });
  await waitEvwebTabComplete(tabId, 18000);

  var deadline = Date.now() + 14000;
  while (Date.now() < deadline) {
    var tabNow = await chrome.tabs.get(tabId);
    if (/frmUsuarioSinLoguear/i.test(String(tabNow.url || ''))) {
      await afgDiag('evweb_form_sin_loguear', { url: tabNow.url || null }, 'bg');
      throw new Error(evwebFormMissingError(tabNow.url));
    }
    frameId = await probeEvwebFormFrameId(tabId);
    if (frameId != null) {
      var idKeep = parseEvwebIdUsuarioFromUrl(tabNow.url);
      if (idKeep) await rememberEvwebIdUsuario(idKeep);
      await afgDiag('evweb_form_ready', {
        tabId: tabId,
        url: tabNow.url || null,
        frameId: frameId,
        idUsuario: idKeep || target.idUsuario || null
      }, 'bg');
      return { tab: tabNow, frameId: frameId, navigated: true };
    }
    await sleep(400);
  }

  var tabFail = await chrome.tabs.get(tabId);
  await afgDiag('evweb_form_missing_after_nav', {
    tabId: tabId,
    url: tabFail.url || null
  }, 'bg');
  throw new Error(evwebFormMissingError(tabFail.url));
}

/**
 * Clasifica #body_GridView1_cboTipoDocumento_N en MAIN world.
 * Igual que obra: arma endRequest → setea valor → __doPostBack diferido →
 * espera endRequest o timeout (nunca colgarse).
 * No disparar change/teclas sync: el AutoPostBack puede destruir el frame
 * y chrome.scripting.executeScript nunca resuelve (0.6.20 hang >35s).
 */
async function setEvwebClassifyDocTipo(msg) {
  msg = msg || {};
  var tabId = msg.tabId;
  var frameId = msg.frameId;
  if (!tabId || frameId == null || frameId === '') {
    return { ok: false, error: 'missing_tab_or_frame' };
  }
  var fid = Number(frameId);
  if (!Number.isFinite(fid)) return { ok: false, error: 'bad_frameId', frameId: frameId };

  var idx = Number(msg.idx);
  if (!Number.isFinite(idx) || idx < 0) return { ok: false, error: 'bad_idx', idx: msg.idx };
  var preferValue = String(msg.preferValue != null ? msg.preferValue : '');
  var slotKey = String(msg.slotKey || '');
  var labelHints = Array.isArray(msg.labelHints) ? msg.labelHints : [];
  var timeoutMs = Number(msg.timeoutMs);
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1000) timeoutMs = 8000;
  // Hard cap: si el frame muere mid-flight, executeScript no resuelve
  var hardCapMs = timeoutMs + 2500;

  try {
    var execPromise = chrome.scripting.executeScript({
      target: { tabId: tabId, frameIds: [fid] },
      world: 'MAIN',
      args: [idx, preferValue, slotKey, labelHints, timeoutMs],
      func: function (idxArg, preferValueArg, slotKeyArg, labelHintsArg, timeoutMsArg) {
        return new Promise(function (resolve) {
          function norm(s) {
            return String(s || '')
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .replace(/\s+/g, ' ')
              .trim();
          }
          function findSel(i) {
            return document.getElementById('body_GridView1_cboTipoDocumento_' + i)
              || document.querySelector('[id$="GridView1_cboTipoDocumento_' + i + '"]')
              || document.querySelector('[id*="cboTipoDocumento_' + i + '"]');
          }
          function readState(i) {
            var s = findSel(i);
            if (!s || !s.options || !s.options.length) {
              return { missing: true, value: '', text: '' };
            }
            var t = s.options[s.selectedIndex]
              ? String(s.options[s.selectedIndex].text || '').trim()
              : '';
            return { missing: false, value: String(s.value || ''), text: t };
          }
          function parsePostBackTarget(el) {
            if (el && el.name) return String(el.name);
            var blob = '';
            try {
              blob = (el.getAttribute('onchange') || '') + '\n' + (el.getAttribute('onChange') || '');
            } catch (eAttr) {}
            var m = String(blob).match(
              /__doPostBack\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]*)['"]\s*\)/i
            );
            if (m) return m[1];
            m = String(blob).match(
              /__doPostBack\s*\(\s*(?:&#39;|&apos;|')([^'&]+)(?:&#39;|&apos;|')\s*,\s*(?:&#39;|&apos;|')([^'&]*)(?:&#39;|&apos;|')\s*\)/i
            );
            return m ? m[1] : null;
          }
          try {
            var sel = findSel(idxArg);
            if (!sel || !sel.options || !sel.options.length) {
              resolve({ ok: false, error: 'select_not_found', idx: idxArg });
              return;
            }
            var options = [];
            var i;
            for (i = 0; i < sel.options.length; i++) {
              options.push({
                value: String(sel.options[i].value),
                text: String(sel.options[i].text || '').trim(),
                index: i
              });
            }
            var match = null;
            for (i = 0; i < options.length; i++) {
              if (options[i].value === String(preferValueArg)) {
                match = options[i];
                match.via = 'value';
                break;
              }
            }
            if (!match) {
              var hints = labelHintsArg || [];
              for (i = 0; i < options.length; i++) {
                var t = norm(options[i].text);
                if (!t || /clasifique|seleccione|elegir|--/.test(t)) continue;
                for (var j = 0; j < hints.length; j++) {
                  if (t.indexOf(norm(hints[j])) !== -1) {
                    match = options[i];
                    match.via = 'label';
                    break;
                  }
                }
                if (match) break;
              }
            }
            if (!match) {
              resolve({
                ok: false,
                error: 'tipo_option_not_found',
                options: options,
                want: preferValueArg,
                slot: slotKeyArg
              });
              return;
            }

            var mgr = window.Sys && window.Sys.WebForms &&
              window.Sys.WebForms.PageRequestManager &&
              window.Sys.WebForms.PageRequestManager.getInstance
                ? window.Sys.WebForms.PageRequestManager.getInstance()
                : null;
            var settled = false;
            var handler = null;

            function finish(payload) {
              if (settled) return;
              settled = true;
              if (mgr && handler) {
                try { mgr.remove_endRequest(handler); } catch (eRm) {}
              }
              resolve(payload);
            }

            // Valor primero, SIN change (evita postback sync que mata el frame)
            try { sel.focus(); } catch (eF) {}
            sel.selectedIndex = match.index;
            sel.value = match.value;

            var postTarget = parsePostBackTarget(sel);
            var hasDoPostBack = typeof window.__doPostBack === 'function';

            if (mgr) {
              handler = function () {
                var st = readState(idxArg);
                var placeholder = /clasifique|seleccione|elegir/i.test(st.text) || !st.value;
                var valueOk = String(st.value) === String(match.value);
                finish({
                  ok: !st.missing && !placeholder && valueOk,
                  reason: 'endRequest',
                  error: st.missing
                    ? 'select_missing_after_postback'
                    : (placeholder || !valueOk ? 'tipo_still_placeholder' : undefined),
                  value: st.value,
                  text: st.text,
                  via: match.via || 'main',
                  idx: idxArg,
                  world: 'MAIN',
                  postTarget: postTarget || null,
                  options: options
                });
              };
              try { mgr.add_endRequest(handler); } catch (eAdd) {
                mgr = null;
                handler = null;
              }
            }

            // Postback diferido: deja que esta Promise quede armada; no change sync
            setTimeout(function () {
              if (settled) return;
              try {
                var s2 = findSel(idxArg);
                if (s2) {
                  s2.selectedIndex = match.index;
                  s2.value = match.value;
                }
                if (hasDoPostBack && postTarget) {
                  window.__doPostBack(postTarget, '');
                } else if (s2 || sel) {
                  var el = s2 || sel;
                  try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (eIn) {}
                  try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (eCh) {}
                } else {
                  finish({
                    ok: false,
                    error: 'select_gone_before_postback',
                    reason: 'fire_failed',
                    via: match.via || 'main',
                    idx: idxArg,
                    world: 'MAIN'
                  });
                }
              } catch (eFire) {
                finish({
                  ok: false,
                  error: String(eFire && eFire.message || eFire),
                  reason: 'fire_failed',
                  via: match.via || 'main',
                  idx: idxArg,
                  world: 'MAIN'
                });
              }
            }, 0);

            setTimeout(function () {
              if (settled) return;
              var st = readState(idxArg);
              var placeholder = /clasifique|seleccione|elegir/i.test(st.text) || !st.value;
              var valueOk = String(st.value) === String(match.value);
              // Soft-ok si el valor quedó: endRequest a veces no llega en GridView
              var softOk = !st.missing && !placeholder && valueOk;
              finish({
                ok: softOk,
                reason: mgr ? 'timeout' : 'no_page_request_manager',
                error: softOk ? undefined : (st.missing
                  ? 'classify_timeout_select_missing'
                  : 'classify_timeout'),
                value: st.value,
                text: st.text,
                via: match.via || 'main',
                idx: idxArg,
                world: 'MAIN',
                postTarget: postTarget || null,
                hasDoPostBack: hasDoPostBack,
                options: options
              });
            }, timeoutMsArg);
          } catch (e) {
            resolve({ ok: false, error: String(e && e.message || e) });
          }
        });
      }
    });

    var hardTimeout = new Promise(function (resolve) {
      setTimeout(function () {
        resolve({ __hardTimeout: true });
      }, hardCapMs);
    });
    var raced = await Promise.race([execPromise, hardTimeout]);
    if (raced && raced.__hardTimeout) {
      var hang = {
        ok: false,
        error: 'classify_executeScript_hang',
        reason: 'hard_timeout',
        idx: idx,
        slot: slotKey,
        hardCapMs: hardCapMs
      };
      await afgDiag('evweb_classify_main', hang, 'bg');
      return hang;
    }
    var results = raced;
    var row = results && results[0];
    if (row && row.error) {
      var fail = {
        ok: false,
        error: String(row.error.message || row.error),
        reason: 'executeScript_failed'
      };
      await afgDiag('evweb_classify_main', fail, 'bg');
      return fail;
    }
    var r = row && row.result;
    await afgDiag('evweb_classify_main', {
      ok: !!(r && r.ok),
      error: r && r.error,
      reason: r && r.reason,
      value: r && r.value,
      text: r && r.text,
      via: r && r.via,
      idx: idx,
      slot: slotKey,
      postTarget: r && r.postTarget
    }, 'bg');
    return r || { ok: false, error: 'empty_executeScript' };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

/**
 * Setea el File en #body_cargaArchivos y dispara Cargar en MAIN world.
 * Nunca btn.click() ni navegar href="javascript:…" (CSP de evweb lo bloquea).
 * Solo: parsear __doPostBack / PostBackOptions e invocar la función.
 */
async function setEvwebFileAndClickUpload(msg) {
  msg = msg || {};
  var tabId = msg.tabId;
  var frameId = msg.frameId;
  if (!tabId || frameId == null || frameId === '') {
    return { ok: false, error: 'missing_tab_or_frame' };
  }
  var fid = Number(frameId);
  if (!Number.isFinite(fid)) return { ok: false, error: 'bad_frameId', frameId: frameId };

  var dataUrl = String(msg.dataUrl || msg.data || '');
  var comma = dataUrl.indexOf(',');
  var b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  if (!b64) return { ok: false, error: 'missing_file_data' };

  var fileName = String(msg.nombre || 'documento.pdf');
  var mime = String(msg.tipo || 'application/octet-stream');
  if (!/\.[a-z0-9]{2,5}$/i.test(fileName)) {
    if (/pdf/i.test(mime) || /^JVBER/i.test(b64.slice(0, 8))) fileName += '.pdf';
    else if (/jpeg|jpg/i.test(mime)) fileName += '.jpg';
    else if (/png/i.test(mime)) fileName += '.png';
    else fileName += '.bin';
  }

  try {
    var results = await chrome.scripting.executeScript({
      target: { tabId: tabId, frameIds: [fid] },
      world: 'MAIN',
      args: [b64, fileName, mime],
      func: function (b64Arg, fileNameArg, mimeArg) {
        try {
          var input = document.getElementById('body_cargaArchivos');
          var btn = document.getElementById('body_btnUploadArchivo');
          if (!input) return { ok: false, error: 'cargaArchivos_not_found' };
          if (!btn) return { ok: false, error: 'btnUpload_not_found' };

          var bin = atob(b64Arg);
          var bytes = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          var file = new File([bytes], fileNameArg, { type: mimeArg || 'application/octet-stream' });
          var dt = new DataTransfer();
          dt.items.add(file);
          input.files = dt.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('input', { bubbles: true }));

          var filesLen = input.files ? input.files.length : 0;
          if (!filesLen) return { ok: false, error: 'files_empty_after_set', filesLen: 0 };

          // Solo leer atributos como string — NUNCA asignar a location ni .click()
          // si el href es javascript: (CSP bloquea esa navegación).
          var href = btn.getAttribute('href') || '';
          var onclickAttr = btn.getAttribute('onclick') || '';
          var nameAttr = btn.getAttribute('name') || '';
          var blob = href + '\n' + onclickAttr;

          function parseDoPostBack(src) {
            var m = String(src || '').match(
              /__doPostBack\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]*)['"]\s*\)/i
            );
            if (m) return { target: m[1], arg: m[2] };
            // HTML entities en el atributo
            m = String(src || '').match(
              /__doPostBack\s*\(\s*(?:&#39;|&apos;|')([^'&]+)(?:&#39;|&apos;|')\s*,\s*(?:&#39;|&apos;|')([^'&]*)(?:&#39;|&apos;|')\s*\)/i
            );
            if (m) return { target: m[1], arg: m[2] };
            return null;
          }

          function parsePostBackOptionsTarget(src) {
            // WebForm_DoPostBackWithOptions(new WebForm_PostBackOptions("TARGET", ...
            var m = String(src || '').match(
              /WebForm_PostBackOptions\s*\(\s*['"]([^'"]+)['"]/i
            );
            return m ? m[1] : null;
          }

          var clickVia = null;
          var parsed = parseDoPostBack(blob);
          if (parsed && typeof window.__doPostBack === 'function') {
            clickVia = 'doPostBack';
            window.__doPostBack(parsed.target, parsed.arg);
          } else {
            var optTarget = parsePostBackOptionsTarget(blob);
            if (optTarget && typeof window.__doPostBack === 'function') {
              clickVia = 'doPostBack_from_options';
              window.__doPostBack(optTarget, '');
            } else if (typeof window.__doPostBack === 'function') {
              // Fallbacks típicos ASP.NET LinkButton
              var candidates = [];
              if (nameAttr) candidates.push(nameAttr);
              if (btn.id) {
                candidates.push(btn.id);
                candidates.push(btn.id.replace(/_/g, '$'));
                if (btn.id.indexOf('body_') === 0) {
                  candidates.push('ctl00$' + btn.id.replace(/_/g, '$'));
                }
              }
              var fired = false;
              for (var c = 0; c < candidates.length; c++) {
                if (!candidates[c]) continue;
                try {
                  window.__doPostBack(candidates[c], '');
                  clickVia = 'doPostBack_fallback:' + candidates[c];
                  fired = true;
                  break;
                } catch (ePb) {}
              }
              if (!fired) {
                return {
                  ok: false,
                  error: 'doPostBack_unavailable',
                  href: href.slice(0, 160),
                  hasDoPostBack: typeof window.__doPostBack === 'function',
                  nameAttr: nameAttr || null,
                  btnId: btn.id || null
                };
              }
            } else {
              return {
                ok: false,
                error: 'no___doPostBack',
                href: href.slice(0, 160),
                note: 'No se llama btn.click() (CSP bloquea javascript: URLs)'
              };
            }
          }

          return {
            ok: true,
            filesLen: filesLen,
            fileName: fileNameArg,
            fileSize: file.size,
            clickVia: clickVia,
            href: href.slice(0, 160),
            tag: btn.tagName,
            hasDoPostBack: typeof window.__doPostBack === 'function',
            avoidedJsNav: true
          };
        } catch (e) {
          return { ok: false, error: String(e && e.message || e) };
        }
      }
    });
    var r = results && results[0] && results[0].result;
    await afgDiag('evweb_upload_main', {
      ok: !!(r && r.ok),
      error: r && r.error,
      clickVia: r && r.clickVia,
      filesLen: r && r.filesLen,
      fileSize: r && r.fileSize,
      href: r && r.href,
      avoidedJsNav: !!(r && r.avoidedJsNav)
    }, 'bg');
    return r || { ok: false, error: 'empty_executeScript' };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

/** Cuenta filas del GridView (íconos trash / selects tipo) en el frame del form. */
async function countEvwebGridRows(tabId, frameId) {
  if (!tabId || frameId == null) return 0;
  var fid = Number(frameId);
  if (!Number.isFinite(fid)) return 0;
  try {
    var results = await chrome.scripting.executeScript({
      target: { tabId: tabId, frameIds: [fid] },
      world: 'MAIN',
      func: function () {
        var grid = document.getElementById('body_GridView1')
          || document.querySelector('[id$="GridView1"]')
          || document.querySelector('table[id*="GridView"]');
        var n = 0;
        if (grid) {
          n = grid.querySelectorAll('.fa-trash, a[id*="btnEliminar"], [id*="Eliminar"]').length;
        }
        if (!n) {
          try {
            n = document.querySelectorAll(
              '#body_GridView1 .fa-trash, [id$="GridView1"] .fa-trash, a[id*="GridView1"][id*="Eliminar"]'
            ).length;
          } catch (e) {}
        }
        if (!n) {
          try {
            n = document.querySelectorAll('[id*="cboTipoDocumento_"]').length;
          } catch (e2) {}
        }
        return n;
      }
    });
    var r = results && results[0] && results[0].result;
    return Number(r) || 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Tras __doPostBack de Cargar: la página a menudo hace reload REAL (no UpdatePanel).
 * No se puede esperar sendResponse del CS que murió. Esperar loading→complete
 * o que crezca el grid (caso AJAX).
 */
function waitEvwebAfterUploadPostback(tabId, beforeCount, timeoutMs) {
  timeoutMs = timeoutMs || 20000;
  beforeCount = Number(beforeCount) || 0;
  return new Promise(function (resolve) {
    var done = false;
    var sawLoading = false;
    var startedAt = Date.now();
    var poll = null;

    function finish(payload) {
      if (done) return;
      done = true;
      try { chrome.tabs.onUpdated.removeListener(onUpdated); } catch (eRm) {}
      if (poll) clearInterval(poll);
      clearTimeout(timer);
      resolve(payload);
    }

    function onUpdated(id, info) {
      if (id !== tabId) return;
      if (info.status === 'loading') {
        sawLoading = true;
        return;
      }
      if (info.status === 'complete' && (sawLoading || Date.now() - startedAt > 400)) {
        setTimeout(function () {
          probeEvwebFormFrameId(tabId).then(function (fid) {
            return countEvwebGridRows(tabId, fid).then(function (after) {
              finish({
                ok: true,
                via: 'tab_reload',
                afterCount: after,
                beforeCount: beforeCount,
                frameId: fid,
                rowGrew: after > beforeCount
              });
            });
          }).catch(function (e) {
            finish({
              ok: true,
              via: 'tab_reload',
              afterCount: beforeCount,
              beforeCount: beforeCount,
              frameId: null,
              rowGrew: false,
              probeError: String(e && e.message || e)
            });
          });
        }, 500);
      }
    }

    chrome.tabs.onUpdated.addListener(onUpdated);

    poll = setInterval(function () {
      if (done) return;
      probeEvwebFormFrameId(tabId).then(function (fid) {
        if (fid == null) return null;
        return countEvwebGridRows(tabId, fid).then(function (after) {
          if (after > beforeCount) {
            finish({
              ok: true,
              via: 'rows_poll',
              afterCount: after,
              beforeCount: beforeCount,
              frameId: fid,
              rowGrew: true
            });
          }
        });
      }).catch(function () {});
    }, 400);

    var timer = setTimeout(function () {
      probeEvwebFormFrameId(tabId).then(function (fid) {
        return countEvwebGridRows(tabId, fid).then(function (after) {
          finish({
            ok: after > beforeCount,
            via: 'timeout',
            afterCount: after,
            beforeCount: beforeCount,
            frameId: fid,
            rowGrew: after > beforeCount
          });
        });
      }).catch(function () {
        finish({
          ok: false,
          via: 'timeout',
          afterCount: beforeCount,
          beforeCount: beforeCount,
          frameId: null,
          rowGrew: false
        });
      });
    }, timeoutMs);
  });
}

var EVW_DOC_TIPO_BG = { anest: '1', qx: '2', auth: '7' };
var EVW_DOC_LABEL_BG = {
  anest: ['foja anestesica', 'foja anestésica', 'foja de anestesia'],
  qx: ['foja quirurgica', 'foja quirúrgica'],
  auth: [
    'autorizacion de obra social',
    'autorización de obra social',
    'autorizacion',
    'autorización'
  ]
};

/** Snapshot de filas/tipo en el grid (post-reload, mensaje nuevo / executeScript). */
async function inspectEvwebUploadGrid(tabId, frameId) {
  if (!tabId || frameId == null) return { rows: [], count: 0 };
  var fid = Number(frameId);
  if (!Number.isFinite(fid)) return { rows: [], count: 0 };
  try {
    var results = await chrome.scripting.executeScript({
      target: { tabId: tabId, frameIds: [fid] },
      world: 'MAIN',
      func: function () {
        function findSel(i) {
          return document.getElementById('body_GridView1_cboTipoDocumento_' + i)
            || document.querySelector('[id$="GridView1_cboTipoDocumento_' + i + '"]')
            || document.querySelector('[id*="cboTipoDocumento_' + i + '"]');
        }
        function extractName(idx) {
          var sel = findSel(idx);
          if (!sel) return '';
          var tr = null;
          try { tr = sel.closest('tr'); } catch (e) {}
          if (!tr) return '';
          try {
            var clone = tr.cloneNode(true);
            var kill = clone.querySelectorAll('select, option, script, style, .fa-trash');
            for (var k = 0; k < kill.length; k++) {
              try { kill[k].parentNode.removeChild(kill[k]); } catch (eRm) {}
            }
            var text = String(clone.textContent || '').replace(/\s+/g, ' ').trim();
            var m = text.match(/[\w.\-() ]+\.(pdf|jpe?g|png|bin)/i);
            return m ? m[0].trim() : text.slice(0, 120);
          } catch (e2) {
            return '';
          }
        }
        var rows = [];
        var nodes = document.querySelectorAll('[id*="cboTipoDocumento_"]');
        var seen = {};
        for (var i = 0; i < nodes.length; i++) {
          var m = String(nodes[i].id || '').match(/cboTipoDocumento_(\d+)\s*$/i);
          if (!m) continue;
          var idx = Number(m[1]);
          if (!Number.isFinite(idx) || seen[idx]) continue;
          seen[idx] = true;
          var sel = findSel(idx);
          var text = '';
          try {
            text = sel && sel.options && sel.options[sel.selectedIndex]
              ? String(sel.options[sel.selectedIndex].text || '')
              : '';
          } catch (eT) {}
          var val = sel ? String(sel.value || '') : '';
          var placeholder = !val || /clasifique|seleccione|elegir/i.test(text);
          rows.push({
            idx: idx,
            value: val,
            text: text,
            placeholder: placeholder,
            fileName: extractName(idx)
          });
        }
        rows.sort(function (a, b) { return a.idx - b.idx; });
        return { rows: rows, count: rows.length };
      }
    });
    return (results && results[0] && results[0].result) || { rows: [], count: 0 };
  } catch (e) {
    return { rows: [], count: 0, error: String(e && e.message || e) };
  }
}

function sameEvwebDocName(a, b) {
  function norm(s) {
    return String(s || '').replace(/^.*[\\/]/, '').toLowerCase().trim()
      .replace(/\.[a-z0-9]{1,5}$/i, '');
  }
  var na = norm(a);
  var nb = norm(b);
  return !!(na && nb && na === nb);
}

/**
 * Una subida orquestada en BG: doPostBack → wait reload → verify grid → classify.
 * No depende de un content script vivo a través de la recarga.
 */
async function uploadEvwebOneDocViaBackground(tabId, frameId, doc, slotKey, tipoValue) {
  slotKey = slotKey || '';
  tipoValue = String(tipoValue == null ? (EVW_DOC_TIPO_BG[slotKey] || '') : tipoValue);
  var before = await countEvwebGridRows(tabId, frameId);
  var inspect0 = await inspectEvwebUploadGrid(tabId, frameId);
  var claimed = {};
  var rows0 = (inspect0 && inspect0.rows) || [];
  for (var ri = 0; ri < rows0.length; ri++) {
    var row = rows0[ri];
    if (!row.placeholder && String(row.value) === tipoValue) {
      await afgDiag('evweb_upload_skip_existing', {
        slot: slotKey,
        idx: row.idx,
        mode: 'already_classified',
        value: row.value
      }, 'bg');
      return {
        ok: true,
        skipped: true,
        skipReason: 'already_in_grid',
        idx: row.idx,
        tipoValue: row.value,
        nombre: row.fileName || (doc && doc.nombre)
      };
    }
  }
  for (ri = 0; ri < rows0.length; ri++) {
    row = rows0[ri];
    if (!row.placeholder) continue;
    if (sameEvwebDocName(row.fileName, doc && doc.nombre)) {
      var classOnly = await setEvwebClassifyDocTipo({
        tabId: tabId,
        frameId: frameId,
        idx: row.idx,
        preferValue: tipoValue,
        slotKey: slotKey,
        labelHints: EVW_DOC_LABEL_BG[slotKey] || [],
        timeoutMs: 8000
      });
      return Object.assign({
        skipped: true,
        skipReason: 'classify_only',
        nombre: row.fileName || (doc && doc.nombre)
      }, classOnly || { ok: false, error: 'classify_failed' });
    }
  }

  await afgDiag('upload_begin', {
    slot: slotKey,
    before: before,
    fileName: doc && doc.nombre,
    tabId: tabId,
    frameId: frameId
  }, 'bg');

  var clickRes;
  try {
    clickRes = await setEvwebFileAndClickUpload({
      tabId: tabId,
      frameId: frameId,
      dataUrl: doc && doc.data,
      nombre: doc && doc.nombre,
      tipo: doc && doc.tipo
    });
  } catch (eClick) {
    clickRes = {
      ok: false,
      error: String(eClick && eClick.message || eClick),
      assumedMaybeFired: true
    };
  }

  // Frame destruido mid-flight = doPostBack probablemente disparó reload
  var errStr = String((clickRes && clickRes.error) || '');
  var frameDied = /frame|Receiving end|channel closed|No frame|Cannot access/i.test(errStr);
  if ((!clickRes || !clickRes.ok) && frameDied) {
    clickRes = {
      ok: true,
      assumedFired: true,
      clickVia: 'doPostBack_frame_died',
      error: errStr,
      fileName: doc && doc.nombre
    };
  }
  if (!clickRes || !clickRes.ok) {
    return {
      ok: false,
      error: (clickRes && clickRes.error) || 'upload_main_failed',
      detail: clickRes || null
    };
  }

  var settle = await waitEvwebAfterUploadPostback(tabId, before, 22000);
  await afgDiag('evweb_upload_settle', {
    slot: slotKey,
    before: before,
    settle: settle,
    assumedFired: !!(clickRes && clickRes.assumedFired)
  }, 'bg');

  var tab = null;
  try { tab = await chrome.tabs.get(tabId); } catch (eT) {}
  var ready = await ensureEvwebFormReady(tab || { id: tabId });
  var fid = ready.frameId;
  var after = settle.afterCount;
  if (fid != null) {
    after = await countEvwebGridRows(tabId, fid);
  }
  if (!(after > before) && !(settle && settle.rowGrew)) {
    // Último chance: inspect grid
    var inspFail = await inspectEvwebUploadGrid(tabId, fid);
    if (!(inspFail && inspFail.count > before)) {
      return {
        ok: false,
        error: 'upload_timeout_after_reload',
        before: before,
        after: after,
        settle: settle,
        clickVia: clickRes.clickVia || null
      };
    }
    after = inspFail.count;
  }

  var idx = Math.max(0, after - 1);
  var insp = await inspectEvwebUploadGrid(tabId, fid);
  var matchRow = null;
  var rows = (insp && insp.rows) || [];
  for (var i = 0; i < rows.length; i++) {
    if (sameEvwebDocName(rows[i].fileName, doc && doc.nombre)) {
      matchRow = rows[i];
      break;
    }
  }
  if (!matchRow && rows.length) {
    matchRow = rows[rows.length - 1];
  }
  if (matchRow) idx = matchRow.idx;

  if (matchRow && !matchRow.placeholder && String(matchRow.value) === tipoValue) {
    return {
      ok: true,
      idx: idx,
      tipoValue: matchRow.value,
      tipoText: matchRow.text,
      nombre: clickRes.fileName || (doc && doc.nombre),
      clickVia: clickRes.clickVia || null,
      settleVia: settle.via,
      alreadyClassified: true
    };
  }

  var classRes = await setEvwebClassifyDocTipo({
    tabId: tabId,
    frameId: fid,
    idx: idx,
    preferValue: tipoValue,
    slotKey: slotKey,
    labelHints: EVW_DOC_LABEL_BG[slotKey] || [],
    timeoutMs: 8000
  });

  // Classify también puede recargar: si channel/frame muere, wait + re-inspect
  if ((!classRes || !classRes.ok) && classRes &&
      /frame|channel closed|hang|timeout/i.test(String(classRes.error || classRes.reason || ''))) {
    await waitEvwebAfterUploadPostback(tabId, after, 12000);
    try { tab = await chrome.tabs.get(tabId); } catch (eT2) {}
    ready = await ensureEvwebFormReady(tab || { id: tabId });
    fid = ready.frameId;
    var insp2 = await inspectEvwebUploadGrid(tabId, fid);
    var rows2 = (insp2 && insp2.rows) || [];
    for (var j = 0; j < rows2.length; j++) {
      if (String(rows2[j].value) === tipoValue && !rows2[j].placeholder) {
        classRes = {
          ok: true,
          value: rows2[j].value,
          text: rows2[j].text,
          via: 'post_reload_inspect',
          reason: 'verified_after_reload',
          idx: rows2[j].idx
        };
        idx = rows2[j].idx;
        break;
      }
    }
  }

  await afgDiag('upload_classify', {
    slot: slotKey,
    idx: idx,
    ok: !!(classRes && classRes.ok),
    error: classRes && classRes.error,
    reason: classRes && classRes.reason,
    value: classRes && classRes.value,
    text: classRes && classRes.text,
    settleVia: settle.via
  }, 'bg');

  if (!classRes || !classRes.ok) {
    return {
      ok: false,
      error: (classRes && classRes.error) || 'classify_failed',
      idx: idx,
      detail: classRes || null,
      settle: settle,
      clickVia: clickRes.clickVia || null
    };
  }

  return {
    ok: true,
    idx: idx,
    tipoValue: classRes.value,
    tipoText: classRes.text || null,
    classifyVia: classRes.via || null,
    nombre: clickRes.fileName || (doc && doc.nombre),
    size: clickRes.fileSize || null,
    clickVia: clickRes.clickVia || null,
    settleVia: settle.via,
    frameId: fid
  };
}

async function uploadEvwebDocsViaBackground(tabId, frameId, docs) {
  docs = docs || {};
  var order = ['anest', 'qx', 'auth'];
  var results = {};
  var attempted = 0;
  var failed = null;
  var fid = frameId;

  for (var i = 0; i < order.length; i++) {
    var key = order[i];
    var doc = docs[key];
    if (!doc || !doc.data) {
      results[key] = { ok: true, skipped: true };
      continue;
    }
    attempted += 1;

    // Tras cada upload el frameId puede cambiar
    try {
      var tab = await chrome.tabs.get(tabId);
      var ready = await ensureEvwebFormReady(tab);
      fid = ready.frameId;
      tabId = ready.tab.id;
    } catch (eReady) {
      failed = { slot: key, error: String(eReady && eReady.message || eReady) };
      results[key] = { ok: false, error: failed.error };
      break;
    }

    var up = await uploadEvwebOneDocViaBackground(
      tabId,
      fid,
      doc,
      key,
      EVW_DOC_TIPO_BG[key]
    );
    results[key] = up;
    if (up && up.frameId != null) fid = up.frameId;
    if (!up || !up.ok) {
      failed = { slot: key, error: (up && up.error) || 'upload_failed', detail: up };
      break;
    }
    await sleep(500);
  }

  var out = {
    ok: !failed,
    attempted: attempted,
    failed: failed,
    results: results,
    via: 'background_post_reload'
  };
  await afgDiag('upload_done', {
    ok: out.ok,
    attempted: attempted,
    failed: failed,
    results: Object.keys(results).reduce(function (acc, k) {
      var r = results[k];
      acc[k] = r
        ? {
          ok: r.ok,
          skipped: !!r.skipped,
          error: r.error || null,
          settleVia: r.settleVia || null,
          clickVia: r.clickVia || null,
          tipoValue: r.tipoValue || null
        }
        : null;
      return acc;
    }, {})
  }, 'bg');
  return out;
}

/**
 * MAIN world: arma endRequest → setea Obra Social → espera postback ASP.NET.
 * Reasons: endRequest | timeout | no_page_request_manager | no_obra_select |
 *   value_not_in_options | error | executeScript_failed
 */
async function setEvwebObraAndWaitPostback(tabId, frameId, obraVal, timeoutMs) {
  timeoutMs = timeoutMs || 4000;
  if (!tabId || frameId == null || frameId === '') {
    return {
      ok: false,
      reason: 'executeScript_failed',
      error: 'missing_tab_or_frame',
      tabId: tabId || null,
      frameId: frameId == null ? null : frameId
    };
  }
  var fid = Number(frameId);
  if (!Number.isFinite(fid)) {
    return {
      ok: false,
      reason: 'executeScript_failed',
      error: 'bad_frameId',
      frameId: frameId
    };
  }
  try {
    var results = await chrome.scripting.executeScript({
      target: { tabId: tabId, frameIds: [fid] },
      world: 'MAIN',
      args: [String(obraVal == null ? '' : obraVal), timeoutMs],
      func: function (obraValArg, timeoutMsArg) {
        return new Promise(function (resolve) {
          try {
            var el = document.getElementById('body_cboObraSocial');
            if (!el) {
              resolve({ ok: false, reason: 'no_obra_select' });
              return;
            }
            var want = String(obraValArg == null ? '' : obraValArg);
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
              resolve({
                ok: false,
                reason: 'value_not_in_options',
                want: String(obraValArg),
                options: el.options ? el.options.length : 0
              });
              return;
            }
            function fireChange() {
              el.value = want;
              try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (eIn) {}
              try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (eCh) {}
            }
            var mgr = window.Sys && window.Sys.WebForms &&
              window.Sys.WebForms.PageRequestManager &&
              window.Sys.WebForms.PageRequestManager.getInstance();
            if (!mgr) {
              fireChange();
              resolve({
                ok: false,
                reason: 'no_page_request_manager',
                obraValue: want,
                selected: el.value
              });
              return;
            }
            var fired = false;
            var handler = function () {
              if (fired) return;
              fired = true;
              try { mgr.remove_endRequest(handler); } catch (eRm) {}
              resolve({
                ok: true,
                reason: 'endRequest',
                obraValue: want,
                selected: el.value
              });
            };
            mgr.add_endRequest(handler);
            fireChange();
            setTimeout(function () {
              if (fired) return;
              fired = true;
              try { mgr.remove_endRequest(handler); } catch (eRm2) {}
              resolve({
                ok: true,
                reason: 'timeout',
                obraValue: want,
                selected: el.value
              });
            }, timeoutMsArg);
          } catch (err) {
            resolve({
              ok: false,
              reason: 'error',
              error: String(err && err.message || err)
            });
          }
        });
      }
    });
    var row = results && results[0];
    if (row && row.error) {
      return {
        ok: false,
        reason: 'executeScript_failed',
        error: String(row.error.message || row.error)
      };
    }
    var r = row && row.result;
    if (!r || typeof r !== 'object') {
      return { ok: false, reason: 'executeScript_failed', error: 'empty_result' };
    }
    return r;
  } catch (e) {
    return {
      ok: false,
      reason: 'executeScript_failed',
      error: String(e && e.message || e)
    };
  }
}

/** Frame del formulario (#body_cboObraSocial) — same-origin iframe. */
async function findEvwebFormFrameId(tabId) {
  var frameId = await probeEvwebFormFrameId(tabId);
  if (frameId != null) return frameId;
  var tab = null;
  try { tab = await chrome.tabs.get(tabId); } catch (e) {}
  throw new Error(evwebFormMissingError(tab && tab.url));
}

/**
 * Diagnóstico Lote 1: confirma acceso al iframe y conteo de opciones.
 * No llena ni clickea.
 */
async function pingEvwebForm() {
  try {
    await afgDiag('pingEvwebForm_begin', {}, 'bg');
    var tab = await findEvwebTab();
    await afgDiag('pingEvwebForm_tab', { tabId: tab.id, url: tab.url || null }, 'bg');
    var ready = await ensureEvwebFormReady(tab);
    tab = ready.tab;
    var frameId = ready.frameId;
    await afgDiag('pingEvwebForm_send', {
      tabId: tab.id,
      frameId: frameId,
      url: tab.url || null,
      navigated: !!ready.navigated
    }, 'bg');
    var res = await chrome.tabs.sendMessage(tab.id, { type: 'AFG_EVW_PING' }, { frameId: frameId });
    await afgDiag('pingEvwebForm_ok', {
      tabId: tab.id,
      frameId: frameId,
      ok: res && res.ok,
      hasObra: res && res.hasObra
    }, 'bg');
    return Object.assign({ tabId: tab.id, frameId: frameId }, res || { ok: false, error: 'empty_ping' });
  } catch (e) {
    await afgDiag('pingEvwebForm_fail', { error: String(e && e.message || e) }, 'bg');
    throw e;
  }
}

/**
 * Manda AFG_EVW_FILL_PAMI al frame del formulario (solo campos).
 * Uploads van aparte en uploadEvwebDocsViaBackground — __doPostBack recarga
 * la página y mataría el canal de este sendMessage.
 * data: pac, dni, fecha, hora, cirujano, edad, afiliado, obraSocial?, sanatorio?, docs?
 */
async function sendEvwebFillPami(data) {
  try {
    var docs = (data && data.docs) || null;
    var docsKeys = docs ? Object.keys(docs) : [];
    await afgDiag('sendEvwebFillPami_begin', {
      pac: data && data.pac,
      obraSocial: data && data.obraSocial,
      sanatorio: data && data.sanatorio,
      docsKeys: docsKeys
    }, 'bg');
    var tab = await findEvwebTab();
    var ready = await ensureEvwebFormReady(tab);
    tab = ready.tab;
    var frameId = ready.frameId;
    await afgDiag('sendEvwebFillPami_before', {
      tabId: tab.id,
      frameId: frameId,
      tabUrl: tab.url || null,
      navigated: !!ready.navigated,
      pac: data && data.pac,
      obraSocial: data && data.obraSocial,
      sanatorio: data && data.sanatorio,
      docsKeys: docsKeys,
      skipUploadsInCs: true,
      obesidadMorbida: !!(data && data.obesidadMorbida),
      pracsCount: data && data.pracs ? data.pracs.length : 0,
      pracsResolved: data && data.pracs
        ? data.pracs.filter(function (p) { return p && p.codigoEvweb; }).length
        : 0
    }, 'bg');

    // Campos sin docs ni pracs: uploads/pracs van después (reload de Cargar)
    var fillData = Object.assign({}, data || {}, { skipUploads: true, skipPracs: true });
    delete fillData.docs;

    var res;
    try {
      res = await chrome.tabs.sendMessage(
        tab.id,
        {
          type: 'AFG_EVW_FILL_PAMI',
          data: fillData,
          targetFrameId: frameId,
          targetTabId: tab.id
        },
        { frameId: frameId }
      );
    } catch (eFill) {
      var errFill = String(eFill && eFill.message || eFill);
      await afgDiag('sendEvwebFillPami_fail', { error: errFill, phase: 'fields' }, 'bg');
      throw eFill;
    }

    await afgDiag('sendEvwebFillPami_after', {
      sentFrameId: frameId,
      contentReportedFrameId: res && res.receiverFrameId,
      ok: res && res.ok,
      error: res && res.error,
      uploadsDeferred: !!(res && res.steps && res.steps.uploads && res.steps.uploads.deferred),
      obesidad: res && res.steps && res.steps.obesidad
    }, 'bg');

    if (!(res && res.ok)) {
      return Object.assign({ tabId: tab.id, frameId: frameId }, res || { ok: false, error: 'empty_fill' });
    }

    // Uploads en BG: sobreviven reload tras __doPostBack
    var uploads = { ok: true, attempted: 0, skipped: true, reason: 'no_docs' };
    if (evwebDocsDataKeys(docs).length) {
      uploads = await uploadEvwebDocsViaBackground(tab.id, frameId, docs);
      res.steps = res.steps || {};
      res.steps.uploads = uploads;
      res.touchedCargaArchivos = !!(uploads && uploads.attempted > 0);
      if (!(uploads && uploads.ok)) {
        res.ok = false;
        res.error = uploads && uploads.failed
          ? ('upload_failed:' + uploads.failed.slot)
          : 'upload_failed';
      }
    } else {
      res.steps = res.steps || {};
      res.steps.uploads = uploads;
    }

    await afgDiag('sendEvwebFillPami_uploads_done', {
      ok: !!(res && res.ok),
      error: res && res.error,
      touchedCargaArchivos: !!(res && res.touchedCargaArchivos),
      uploadsAttempted: uploads && uploads.attempted,
      uploadsOk: uploads && uploads.ok,
      uploadsFailed: uploads && uploads.failed,
      uploadsVia: uploads && uploads.via
    }, 'bg');

    // Prácticas + re-tilar obesidad DESPUÉS de uploads (reload borra el DOM)
    var pracs = Array.isArray(data && data.pracs) ? data.pracs : [];
    var needPostUploadUi = !!((data && data.obesidadMorbida) || pracs.length);
    if (res.ok && needPostUploadUi) {
      try {
        var tabNow = await chrome.tabs.get(tab.id);
        var ready2 = await ensureEvwebFormReady(tabNow);
        tab = ready2.tab;
        frameId = ready2.frameId;
        var pracsRes = await chrome.tabs.sendMessage(
          tab.id,
          {
            type: 'AFG_EVW_FILL_PRACS',
            pracs: pracs,
            obesidadMorbida: !!(data && data.obesidadMorbida),
            targetFrameId: frameId,
            targetTabId: tab.id
          },
          { frameId: frameId }
        );
        res.steps = res.steps || {};
        res.steps.pracs = pracsRes || { ok: false, error: 'empty_pracs' };
        if (pracsRes && pracsRes.obesidad) {
          res.steps.obesidad = pracsRes.obesidad;
        }
        await afgDiag('sendEvwebFillPami_pracs_done', {
          ok: !!(pracsRes && pracsRes.ok),
          attempted: pracsRes && pracsRes.attempted,
          leftOpen: pracsRes && pracsRes.leftOpenForManual,
          obesidad: pracsRes && pracsRes.obesidad,
          results: pracsRes && pracsRes.results
            ? pracsRes.results.map(function (x) {
              return {
                selected: !!x.selected,
                leftOpen: !!x.leftOpen,
                reason: x.reason || null,
                codigoEvweb: x.codigoEvweb || null
              };
            })
            : null
        }, 'bg');
      } catch (ePracs) {
        res.steps = res.steps || {};
        res.steps.pracs = {
          ok: false,
          error: String(ePracs && ePracs.message || ePracs)
        };
        await afgDiag('sendEvwebFillPami_pracs_fail', {
          error: String(ePracs && ePracs.message || ePracs)
        }, 'bg');
        // No tumbar el fill: Huerta completa a mano (awaiting_confirm)
      }
    }

    return Object.assign({ tabId: tab.id, frameId: frameId }, res);
  } catch (e) {
    await afgDiag('sendEvwebFillPami_fail', { error: String(e && e.message || e) }, 'bg');
    throw e;
  }
}

/**
 * Disparo individual (sin cola). Lote 1 = solo ping (sin fill).
 */
async function runEvwebSingle(msg) {
  msg = msg || {};
  if (evwebRunnerBusy) {
    return {
      ok: false,
      error: 'evweb_runner_busy',
      message: 'Ya hay una corrida evweb en curso.'
    };
  }
  evwebRunnerBusy = true;
  try {
    var ping = await pingEvwebForm();
    var state = await setEvwebRunnerState(Object.assign(await getEvwebRunnerState(), {
      status: ping && ping.ok ? 'awaiting_confirm' : 'paused_error',
      currentIntervId: msg.intervId ? String(msg.intervId) : null,
      currentPac: msg.pac || '',
      message: ping && ping.ok
        ? 'Lote 1: ping OK — formulario accesible (sin fill). Usá AFG_EVW_FILL_SINGLE para PAMI.'
        : ('Lote 1: ping falló — ' + ((ping && (ping.error || ping.message)) || 'fail')),
      lastResult: { mode: 'single_ping', ping: ping, intervId: msg.intervId || null }
    }));
    return {
      ok: !!(ping && ping.ok),
      mode: 'single_ping',
      ping: ping,
      state: state,
      fillSkipped: true,
      message: state.message
    };
  } finally {
    evwebRunnerBusy = false;
  }
}

/**
 * Lote 3: ping + fill compartido (individual y cola).
 * fillData: { pac, dni, fecha, hora, cirujano, edad, afiliado, obraSocial, sanatorio, docs? }
 */
async function doEvwebFill(fillData) {
  var ping = await pingEvwebForm();
  if (!(ping && ping.ok)) return { ok: false, error: 'ping_failed', ping: ping };
  try {
    console.log('[AFG EVW] doEvwebFill ping frameId=', ping.frameId, 'tabId=', ping.tabId);
  } catch (ePingLog) {}
  var fill = await sendEvwebFillPami(fillData);
  return { ok: !!(fill && fill.ok), ping: ping, fill: fill };
}

/**
 * Lote 2: ping → fill PAMI → awaiting_confirm (sin auto-submit, sin upload).
 * msg: { intervId?, pac, dni, fecha, hora, cirujano, edad, afiliado, obraSocial?, sanatorio? }
 */
async function runEvwebFillPami(msg) {
  msg = msg || {};
  if (evwebRunnerBusy) {
    return {
      ok: false,
      error: 'evweb_runner_busy',
      message: 'Ya hay una corrida evweb en curso.'
    };
  }
  evwebRunnerBusy = true;
  try {
    await setEvwebRunnerState(Object.assign(await getEvwebRunnerState(), {
      status: 'running',
      currentIntervId: msg.intervId ? String(msg.intervId) : null,
      currentPac: msg.pac || '',
      message: 'Lote 4: ping + fill + docs…',
      lastResult: null
    }));

    var fillData = {
      pac: msg.pac || msg.nombreApellido || '',
      dni: msg.dni || '',
      fecha: msg.fecha || '',
      hora: msg.hora || '',
      cirujano: msg.cirujano || '',
      edad: msg.edad != null && msg.edad !== '' ? msg.edad : '',
      afiliado: msg.afiliado || msg.afil || '',
      obraSocial: msg.obraSocial != null && msg.obraSocial !== '' ? msg.obraSocial : '382',
      sanatorio: msg.sanatorio != null && msg.sanatorio !== '' ? msg.sanatorio : '208',
      docs: msg.docs || null,
      obesidadMorbida: !!msg.obesidadMorbida,
      pracs: Array.isArray(msg.pracs) ? msg.pracs : []
    };
    if (fillData.fecha) {
      fillData.fecha = formatFechaDDMMYYYY(fillData.fecha) || fillData.fecha;
    }
    if (msg.intervId && !evwebDocsDataKeys(fillData.docs).length) {
      var fetchedSingle = await fetchEvwebDocsViaAnesFactBridge(msg.intervId);
      if (fetchedSingle && fetchedSingle.docs) {
        fillData.docs = fetchedSingle.docs;
      }
    }

    var res = await doEvwebFill(fillData);
    var ping = res && res.ping;
    var fill = res && res.fill;
    var okFill = !!(res && res.ok);
    var upAtt = fill && fill.steps && fill.steps.uploads && fill.steps.uploads.attempted;
    var msgOk = (upAtt > 0)
      ? ('Formulario + ' + upAtt + ' doc(s) OK — revisá y Finalizá a mano (sin auto-submit)')
      : 'Formulario OK (sin docs subidos) — revisá y Finalizá a mano';
    var msgFail = (res && res.error === 'ping_failed')
      ? ('Ping evweb falló — no fill. ' + ((ping && (ping.error || ping.message)) || ''))
      : ('Fill incompleto: ' + ((fill && (fill.error || fill.message)) || 'fill_failed'));

    if (!okFill && res && res.error === 'ping_failed') {
      var statePingFail = await setEvwebRunnerState(Object.assign(await getEvwebRunnerState(), {
        status: 'paused_error',
        message: msgFail,
        lastResult: { mode: 'fill_pami', ping: ping }
      }));
      return {
        ok: false,
        error: 'ping_failed',
        ping: ping,
        state: statePingFail,
        message: statePingFail.message
      };
    }

    var state = await setEvwebRunnerState(Object.assign(await getEvwebRunnerState(), {
      status: okFill ? 'awaiting_confirm' : 'paused_error',
      currentIntervId: msg.intervId ? String(msg.intervId) : null,
      currentPac: fillData.pac || '',
      message: okFill ? msgOk : msgFail,
      lastResult: {
        mode: 'fill_pami',
        ping: ping,
        fill: fill,
        frameIdSent: fill && fill.frameId,
        receiverFrameId: fill && fill.receiverFrameId,
        fillData: {
          pac: fillData.pac,
          dni: fillData.dni,
          fecha: fillData.fecha,
          hora: fillData.hora,
          cirujano: fillData.cirujano,
          edad: fillData.edad,
          afiliado: fillData.afiliado,
          obraSocial: fillData.obraSocial,
          sanatorio: fillData.sanatorio,
          docsKeys: fillData.docs ? Object.keys(fillData.docs) : []
        }
      }
    }));

    return {
      ok: okFill,
      mode: 'fill_pami',
      ping: ping,
      fill: fill,
      state: state,
      awaitingConfirm: okFill,
      autoSubmit: false,
      message: state.message
    };
  } finally {
    evwebRunnerBusy = false;
    try {
      var stFin = await getEvwebRunnerState();
      if (stFin && stFin.status === 'running') {
        stFin.status = 'paused_error';
        stFin.message = (stFin.message || '') +
          (stFin.message ? ' · ' : '') +
          'Lock evweb liberado (finally).';
        await setEvwebRunnerState(stFin);
      }
    } catch (eFin) {}
  }
}

/**
 * Runner de cola evweb — mismo espíritu que runQueueAction, función aparte.
 * Lote 3: por ítem ping + fill → awaiting_confirm (Finalizar manual).
 */
async function runEvwebQueueAction(action) {
  await afgDiag('runEvwebQueueAction', { action: action }, 'bg');
  if (action === 'abort') {
    var stAbort = await getEvwebRunnerState();
    if (stAbort.currentIntervId) {
      await patchEvwebQueueItemStatus(stAbort.currentIntervId, 'queued', 'Abortada por el usuario');
    }
    evwebRunnerBusy = false;
    evwebRunnerBusyAt = 0;
    var idle = defaultEvwebRunnerState();
    idle.message = 'Cola evweb abortada';
    await setEvwebRunnerState(idle);
    await afgDiag('runEvweb_aborted', {}, 'bg');
    return { ok: true, aborted: true, state: idle };
  }

  // Iniciar / Reintentar: limpiar locks de intentos muertos (context invalidated, etc.)
  if (action === 'start' || action === 'retry') {
    await liberarEvwebLocksForFreshStart(action === 'start' ? 'start' : 'retry');
  }

  var stateGate = await getEvwebRunnerState();
  await afgDiag('runEvweb_state_gate', {
    status: stateGate && stateGate.status,
    currentIntervId: stateGate && stateGate.currentIntervId,
    busy: !!evwebRunnerBusy,
    busyAt: evwebRunnerBusyAt || null,
    storageBusyAt: stateGate && stateGate.busyAt
  }, 'bg');

  // Tras liberar, awaiting_confirm ya no debería bloquear start
  if (action === 'start' && stateGate.status === 'awaiting_confirm') {
    await afgDiag('runEvweb_blocked_awaiting_confirm', { status: stateGate.status }, 'bg');
    return {
      ok: false,
      error: 'awaiting_confirm',
      message: 'Hay un caso evweb esperando confirmación. Tocá Abortar y luego Iniciar.',
      state: stateGate
    };
  }
  if (evwebRunnerBusy) {
    var age = evwebRunnerBusyAt ? (Date.now() - evwebRunnerBusyAt) : null;
    if (age != null && age > EVWEB_BUSY_STALE_MS) {
      await afgDiag('runEvweb_busy_stale_force_clear', { ageMs: age }, 'bg');
      evwebRunnerBusy = false;
      evwebRunnerBusyAt = 0;
    } else {
      await afgDiag('runEvweb_blocked_busy', { ageMs: age }, 'bg');
      return {
        ok: false,
        error: 'evweb_runner_busy',
        message: 'Ya hay una corrida evweb en curso. Abortá o esperá ~90 s.',
        state: stateGate,
        busy: true
      };
    }
  }
  if (stateGate.status === 'running') {
    try {
      console.warn('[AFG EVW] status=running huérfano → paused_error');
    } catch (eStale) {}
    stateGate.status = 'paused_error';
    stateGate.message = 'Estado running huérfano liberado. Tocá Reintentar o Iniciar cola evweb.';
    stateGate = await setEvwebRunnerState(stateGate);
  }

  var state = stateGate;
  if (action === 'next') {
    if (state.status === 'awaiting_confirm' && state.currentIntervId) {
      await patchEvwebQueueItemStatus(state.currentIntervId, 'done', '');
      state.processedIds = (state.processedIds || []).concat([String(state.currentIntervId)]);
      state.currentIntervId = null;
      state.currentPac = '';
      state.status = 'idle';
      state.message = 'Buscando siguiente (evweb)…';
      await setEvwebRunnerState(state);
    } else if (state.status === 'paused_error' && state.currentIntervId) {
      state.processedIds = (state.processedIds || []).concat([String(state.currentIntervId)]);
      state.currentIntervId = null;
      state.currentPac = '';
      state.status = 'idle';
      state.message = 'Salteado (evweb en pausa) — siguiente…';
      await setEvwebRunnerState(state);
    } else {
      return {
        ok: false,
        error: 'not_awaiting_confirm',
        message: 'No hay caso evweb esperando “Siguiente”. Iniciá la cola o reintentá.',
        state: state
      };
    }
  }
  if (action === 'retry') {
    if (!state.currentIntervId) {
      return {
        ok: false,
        error: 'nothing_to_retry',
        message: 'No hay caso evweb actual para reintentar.',
        state: state
      };
    }
  }

  var preferId = action === 'retry' ? state.currentIntervId : null;
  if (action === 'start' || action === 'next') preferId = null;
  var skipIds = {};
  if (action === 'start' || action === 'next') {
    (state.processedIds || []).forEach(function (id) { skipIds[String(id)] = true; });
  }
  var autoAdvance = (action === 'start' || action === 'next');
  var MAX_CONSECUTIVE_FAILURES = 3;
  var consecutiveFailures = 0;
  evwebRunnerBusy = true;
  evwebRunnerBusyAt = Date.now();
  state.busyAt = evwebRunnerBusyAt;
  await setEvwebRunnerState(state);

  try {
    while (true) {
      var refreshQ = await refreshEvwebQueueFromAnesFact({ allowStorageFallback: true });
      var queue = refreshQ && refreshQ.queue ? refreshQ.queue : await getEvwebQueue();
      await afgDiag('runEvweb_queue_loaded', {
        source: refreshQ && refreshQ.source,
        fullDocs: !!(refreshQ && refreshQ.fullDocs),
        pullError: refreshQ && refreshQ.pullError,
        items: queue && queue.items ? queue.items.length : 0,
        lastEnqueuedId: queue && queue.lastEnqueuedId,
        statuses: (queue && queue.items || []).map(function (it) {
          return { id: it.id, st: it.status, pac: it.pac };
        })
      }, 'bg');
      if (!queue || !queue.items || !queue.items.length) {
        state = await setEvwebRunnerState(Object.assign(defaultEvwebRunnerState(), {
          status: 'done_all',
          message: 'Cola evweb vacía (afg_evweb_queue)'
        }));
        await afgDiag('runEvweb_empty_queue', {}, 'bg');
        return { ok: false, error: 'empty_queue', message: state.message, state: state };
      }
      var item = firstPendingQueueItem(queue, preferId, {
        skipPaused: autoAdvance,
        skipIds: skipIds,
        staleRunningMs: EVWEB_STALE_RUNNING_MS,
        preferNewest: action === 'start' || action === 'next'
      });
      if (!item) {
        var pausedLeft = 0;
        (queue.items || []).forEach(function (it) {
          if ((it.status || '') === 'paused_error') pausedLeft += 1;
        });
        state = await setEvwebRunnerState(Object.assign(state, {
          status: 'done_all',
          currentIntervId: null,
          currentPac: '',
          message: pausedLeft
            ? ('No quedan queued en evweb. Hay ' + pausedLeft + ' en pausa.')
            : 'Cola evweb completa — no quedan pendientes'
        }));
        await afgDiag('runEvweb_no_pending_item', { pausedLeft: pausedLeft }, 'bg');
        return { ok: true, doneAll: true, state: state };
      }

      await afgDiag('runEvweb_item_begin', {
        id: item.id,
        pac: item.pac,
        dni: item.dni || '',
        status: item.status,
        obraValue: item.obraValue,
        sanValue: item.sanValue,
        addedAt: item.addedAt || null,
        lastEnqueuedId: queue.lastEnqueuedId || null,
        preferNewest: action === 'start' || action === 'next'
      }, 'bg');

      state.status = 'running';
      state.currentIntervId = String(item.id);
      state.currentPac = item.pac || '';
      state.message = 'Lote 4: ping + fill + docs…';
      state.lastResult = null;
      if (!state.startedAt) state.startedAt = Date.now();
      await setEvwebRunnerState(state);
      await patchEvwebQueueItemStatus(item.id, 'running', '');

      var itemFailed = false;
      var itemFatal = false;
      var returnValue = null;
      try {
        var fillData = {
          pac: item.pac,
          dni: item.dni,
          fecha: item.fecha,
          hora: item.hora,
          cirujano: item.ciru,
          edad: item.edad,
          afiliado: item.afil,
          obraSocial: item.obraValue,
          sanatorio: item.sanValue,
          docs: item.docs || null,
          obesidadMorbida: !!item.obesidadMorbida,
          pracs: Array.isArray(item.pracs) ? item.pracs : []
        };
        if (fillData.fecha) {
          fillData.fecha = formatFechaDDMMYYYY(fillData.fecha) || fillData.fecha;
        }

        // Cola en chrome.storage va slim (sin PDF). Pedir data a AnesFact.
        var needDocs = !evwebDocsDataKeys(fillData.docs).length;
        var expectMeta = item.docsMeta && Object.keys(item.docsMeta).length > 0;
        if (needDocs) {
          var fetched = await fetchEvwebDocsViaAnesFactBridge(item.id);
          if (fetched && fetched.docs && evwebDocsDataKeys(fetched.docs).length) {
            fillData.docs = fetched.docs;
            needDocs = false;
          } else if (expectMeta) {
            state = await setEvwebRunnerState(Object.assign(state, {
              status: 'paused_error',
              message: 'No pude leer los adjuntos desde AnesFact (' +
                ((fetched && (fetched.error || fetched.message)) || 'sin data') +
                '). Abrí AnesFact y reintentá.',
              lastResult: { error: 'docs_fetch_failed', fetched: fetched }
            }));
            await patchEvwebQueueItemStatus(item.id, 'paused_error', state.message);
            itemFailed = true;
            returnValue = {
              ok: false,
              error: 'docs_fetch_failed',
              fetched: fetched,
              state: state
            };
          }
        }

        if (!itemFailed) {
        var res = await doEvwebFill(fillData);
        var upAttQ = res && res.fill && res.fill.steps && res.fill.steps.uploads
          && res.fill.steps.uploads.attempted;
        await afgDiag('runEvweb_doEvwebFill', {
          ok: !!(res && res.ok),
          error: res && res.error,
          message: res && res.message,
          pac: item.pac,
          docsKeys: evwebDocsDataKeys(fillData.docs),
          uploadsAttempted: upAttQ || 0,
          touchedCarga: !!(res && res.fill && res.fill.touchedCargaArchivos)
        }, 'bg');
        if (!(res && res.ok)) {
          state = await setEvwebRunnerState(Object.assign(state, {
            status: 'paused_error',
            message: 'Fill evweb falló: ' + ((res && (res.error || JSON.stringify(res.fill))) || 'desconocido'),
            lastResult: res
          }));
          await patchEvwebQueueItemStatus(item.id, 'paused_error', state.message);
          itemFailed = true;
          returnValue = Object.assign({ ok: false, error: 'fill_failed' }, res || {}, { state: state });
        } else {
          var okMsg = (upAttQ > 0)
            ? ('Formulario + ' + upAttQ + ' doc(s) OK — revisá y Finalizá a mano')
            : 'Formulario OK (sin docs subidos) — revisá adjuntos y Finalizá a mano';
          state = await setEvwebRunnerState(Object.assign(state, {
            status: 'awaiting_confirm',
            message: okMsg,
            lastResult: res,
            currentPac: item.pac || state.currentPac || ''
          }));
          await patchEvwebQueueItemStatus(item.id, 'awaiting_confirm', '');
          return Object.assign({ ok: true, awaitingConfirm: true }, res || {}, { state: state });
        }
        }
      } catch (eFatal) {
        var fatalMsg = String(eFatal && eFatal.message || eFatal);
        try { console.error('[AFG EVW] fatal', fatalMsg); } catch (eF) {}
        state = await setEvwebRunnerState(Object.assign(state, {
          status: 'paused_error',
          message: 'Runner evweb interrumpido: ' + fatalMsg,
          lastResult: { error: fatalMsg }
        }));
        try {
          await patchEvwebQueueItemStatus(item.id, 'paused_error', state.message);
        } catch (eP) {}
        itemFailed = true;
        itemFatal = true;
        returnValue = {
          ok: false,
          error: 'evweb_runner_fatal',
          message: state.message,
          state: state
        };
      }

      if (!itemFailed) return returnValue;
      if (!autoAdvance || itemFatal) return returnValue;
      consecutiveFailures++;
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        state = await setEvwebRunnerState(Object.assign(state, {
          status: 'paused_error',
          message: consecutiveFailures + ' fallos seguidos (evweb) — freno. ' +
            'Último: ' + (state.message || '')
        }));
        return {
          ok: false,
          error: 'too_many_consecutive_failures',
          message: state.message,
          state: state
        };
      }
      state.currentIntervId = null;
      state.currentPac = '';
      state.status = 'idle';
      await setEvwebRunnerState(state);
    }
  } finally {
    evwebRunnerBusy = false;
    evwebRunnerBusyAt = 0;
    try {
      var stFin = await getEvwebRunnerState();
      if (stFin) {
        stFin.busyAt = null;
        if (stFin.status === 'running') {
          stFin.status = 'paused_error';
          stFin.message = (stFin.message || '') +
            (stFin.message ? ' · ' : '') +
            'Lock evweb liberado (finally).';
          try {
            console.warn('[AFG EVW] finally: status seguía running → paused_error');
          } catch (eW) {}
        }
        await setEvwebRunnerState(stFin);
      }
    } catch (eFinally) {}
  }
}

