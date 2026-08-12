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

  // Reusar pestaña GECLISA existente; solo crear si no hay ninguna
  if (msg && msg.type === 'AFG_OPEN_GECLISA') {
    focusOrOpenGeclisaTab()
      .then(function (r) { sendResponse(r); })
      .catch(function (e) { sendResponse({ ok: false, error: String(e.message || e) }); });
    return true;
  }
});

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
  if ((!apellido || !nombre) && foja.pac) {
    var pac = String(foja.pac).trim();
    if (pac.indexOf(',') >= 0) {
      var commaParts = pac.split(',');
      if (!apellido) apellido = (commaParts[0] || '').trim();
      if (!nombre) nombre = commaParts.slice(1).join(',').replace(/\s+/g, ' ').trim();
    } else {
      var parts = pac.split(/\s+/).filter(Boolean);
      if (!apellido && parts.length) apellido = parts[0];
      if (!nombre && parts.length > 1) nombre = parts.slice(1).join(' ');
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
    nombre: (partial.nombre || (fromFoja && fromFoja.nombre) || '').trim(),
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

/** F5 + espera pantalla principal (btn Historias) — evita residual de corrida anterior. */
async function reloadToGeclisaHome(tabId) {
  await new Promise(function (resolve, reject) {
    var done = false;
    var timer = setTimeout(function () {
      if (done) return;
      done = true;
      chrome.tabs.onUpdated.removeListener(onUpdated);
      reject(new Error('Timeout recargando pestaña GECLISA'));
    }, 45000);

    function onUpdated(id, info) {
      if (id !== tabId || info.status !== 'complete') return;
      if (done) return;
      done = true;
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      resolve();
    }

    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.reload(tabId).catch(function (e) {
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
        return;
      }
    } catch (e) {
      // content/scripting aún no listo post-reload
    }
    await sleep(400);
  }
  throw new Error('Tras F5 no apareció btn-Historias Clínicas (¿sesión vencida?)');
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
    return {
      ok: false,
      error: String(e.message || e),
      top: topRes,
      iframe: iframeRes,
      fillOk: false,
      fillResult: fillRes,
      clickMode: 'mixed_debugger_native'
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
