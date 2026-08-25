/**
 * Cola GECLISA Mayo (pieza 1).
 * localStorage afg_geclisa_queue — sin token todavía (mint on-demand en pieza 2).
 * Estados: queued | running | awaiting_save | done | paused_error
 */
var AFG_QUEUE_KEY = 'afg_geclisa_queue';

function afGeclisaQueueEmpty() {
  return { version: 1, updatedAt: Date.now(), items: [] };
}

function afGeclisaQueueLoad() {
  try {
    var raw = localStorage.getItem(AFG_QUEUE_KEY);
    if (!raw) return afGeclisaQueueEmpty();
    var data = JSON.parse(raw);
    // Envelope corrupto (p.ej. "[]" o sin items[]) → reparar a estructura válida
    if (!data || typeof data !== 'object' || Array.isArray(data) || !Array.isArray(data.items)) {
      try { console.warn('[AFG cola] envelope inválido → reset estructura', typeof data, raw && String(raw).slice(0, 80)); } catch (eW) {}
      return afGeclisaQueueEmpty();
    }
    return {
      version: Number(data.version) || 1,
      updatedAt: data.updatedAt || Date.now(),
      items: data.items
    };
  } catch (e) {
    try { console.warn('[AFG cola] load parse fail', e); } catch (e2) {}
    return afGeclisaQueueEmpty();
  }
}

function afGeclisaQueueNotifyCloudSync(){
  if(typeof syncAutoPushDebounced==='function')syncAutoPushDebounced();
}

function afGeclisaQueueSave(envelope) {
  envelope = envelope || afGeclisaQueueEmpty();
  if (!Array.isArray(envelope.items)) envelope.items = [];
  envelope.version = (Number(envelope.version) || 0) + 1;
  envelope.updatedAt = Date.now();
  var payload = JSON.stringify({
    version: envelope.version,
    updatedAt: envelope.updatedAt,
    items: envelope.items
  });
  try {
    localStorage.setItem(AFG_QUEUE_KEY, payload);
  } catch (eSet) {
    try { console.error('[AFG cola] localStorage.setItem FALLÓ', eSet); } catch (eC) {}
    return { ok: false, error: 'storage_set_failed', detail: String(eSet && eSet.message || eSet), envelope: envelope };
  }
  // Verificar lectura inmediata (detecta quota / partición / bloqueos)
  try {
    var back = localStorage.getItem(AFG_QUEUE_KEY);
    var parsed = back ? JSON.parse(back) : null;
    if (!(parsed && Array.isArray(parsed.items) && parsed.items.length === envelope.items.length)) {
      try {
        console.error('[AFG cola] save verify mismatch', {
          wrote: envelope.items.length,
          read: parsed && parsed.items ? parsed.items.length : null,
          back: back && String(back).slice(0, 120)
        });
      } catch (eV) {}
      return { ok: false, error: 'storage_verify_failed', envelope: envelope };
    }
  } catch (eVer) {
    try { console.error('[AFG cola] save verify error', eVer); } catch (eC2) {}
  }
  afPublishGeclisaQueueSync(envelope);
  afGeclisaQueueNotifyCloudSync();
  try {
    console.log('[AFG cola] save OK v' + envelope.version + ' items=' + envelope.items.length);
  } catch (eL) {}
  return envelope;
}

/** Publica cola para el bridge (pieza 2 leerá esto). opts.skipCloudPush: no disparar auto-push (p.ej. al aplicar bajada). */
function afPublishGeclisaQueueSync(envelope, opts) {
  envelope = envelope || afGeclisaQueueLoad();
  try {
    localStorage.setItem(AFG_QUEUE_KEY, JSON.stringify(envelope));
    if (!(opts && opts.skipCloudPush)) afGeclisaQueueNotifyCloudSync();
  } catch (e1) {}
  try {
    window.postMessage({
      source: 'AFG_ANESFACT',
      type: 'GECLISA_QUEUE',
      queue: envelope
    }, '*');
  } catch (e2) {}
  try {
    document.dispatchEvent(new CustomEvent('afg-geclisa-queue', { detail: envelope }));
  } catch (e3) {}
}

function afGeclisaQueueGetItems() {
  return afGeclisaQueueLoad().items.slice();
}

function afGeclisaQueueIsQueued(intervId) {
  var id = String(intervId || '');
  return afGeclisaQueueGetItems().some(function (it) {
    return String(it.id) === id && it.status !== 'done';
  });
}

function afIsMayoInterv(i) {
  if (!i) return false;
  var san = String(i.san || '');
  return san.indexOf('Mayo') >= 0 || !!(i.mayo_sector || '').trim();
}

/**
 * Requisitos para encolar: Mayo + pac + fecha + hora + sector.
 * @returns {{ok:boolean, error?:string}}
 */
function afGeclisaQueueValidate(i) {
  if (!i) return { ok: false, error: 'No hay intervención abierta.' };
  if (!afIsMayoInterv(i)) {
    return { ok: false, error: 'Solo fojas de Sanatorio Mayo entran a la cola GECLISA.' };
  }
  if (!(i.pac || '').trim()) {
    return { ok: false, error: 'Falta apellido y nombre del paciente.' };
  }
  if (!(i.fecha || '').trim()) {
    return { ok: false, error: 'Falta fecha de cirugía.' };
  }
  if (!(i.hora || '').trim()) {
    return { ok: false, error: 'Falta hora de inicio de cirugía.' };
  }
  if (!(i.mayo_sector || '').trim()) {
    return { ok: false, error: 'Elegí Sector (#f-mayo-sector) antes de encolar.' };
  }
  return { ok: true };
}

function afGeclisaQueueSnapshotFromInterv(i) {
  return {
    id: String(i.id),
    pac: (i.pac || '').trim(),
    dni: (i.dni || '').trim(),
    fecha: (i.fecha || '').trim(),
    hora: (i.hora || '').trim(),
    sector: (i.mayo_sector || '').trim(),
    mayo_cama: (i.mayo_cama || '').trim(),
    san: (i.san || '').trim(),
    status: 'queued',
    message: '',
    addedAt: Date.now(),
    updatedAt: Date.now()
  };
}

/** Refresca datos de display desde S.intervs sin perder status/orden. */
function afGeclisaQueueRefreshFromIntervs(envelope) {
  var list = (typeof S !== 'undefined' && S.intervs) ? S.intervs : [];
  var byId = {};
  list.forEach(function (x) { byId[String(x.id)] = x; });
  envelope.items = (envelope.items || []).map(function (it) {
    var live = byId[String(it.id)];
    if (!live) return it;
    return {
      id: it.id,
      pac: (live.pac || it.pac || '').trim(),
      dni: (live.dni || it.dni || '').trim(),
      fecha: (live.fecha || it.fecha || '').trim(),
      hora: (live.hora || it.hora || '').trim(),
      sector: (live.mayo_sector || it.sector || '').trim(),
      mayo_cama: (live.mayo_cama || it.mayo_cama || '').trim(),
      san: (live.san || it.san || '').trim(),
      status: it.status || 'queued',
      message: it.message || '',
      addedAt: it.addedAt || Date.now(),
      updatedAt: Date.now()
    };
  });
  return envelope;
}

/** Completa S.cur desde inputs visibles sin pisar con vacíos (views montadas a la vez). */
function afGeclisaQueueHydrateCurFromDom(interv) {
  var i = interv || (typeof S !== 'undefined' ? S.cur : null);
  if (!i) return i;
  function take(id, prop) {
    var el = document.getElementById(id);
    if (el && el.value != null && String(el.value).trim()) i[prop] = String(el.value).trim();
  }
  take('f-pac', 'pac');
  take('f-fecha', 'fecha');
  take('f-dni', 'dni');
  take('f-san', 'san');
  take('f-mayo-sector', 'mayo_sector');
  take('f-mayo-cama', 'mayo_cama');
  take('foja-hora-inicio', 'hora');
  return i;
}

function afGeclisaQueueAdd(interv) {
  var i = interv;
  if (!i && typeof S !== 'undefined') i = S.cur;
  i = afGeclisaQueueHydrateCurFromDom(i);
  var v = afGeclisaQueueValidate(i);
  if (!v.ok) {
    try {
      console.warn('[AFG cola] add rechazado:', v.error, {
        id: i && i.id,
        pac: i && i.pac,
        fecha: i && i.fecha,
        hora: i && i.hora,
        sector: i && i.mayo_sector,
        san: i && i.san
      });
    } catch (eW) {}
    return { ok: false, error: v.error };
  }

  var env = afGeclisaQueueLoad();
  var id = String(i.id);
  var existing = env.items.filter(function (it) {
    return String(it.id) === id && it.status !== 'done';
  })[0];
  if (existing) {
    var snap = afGeclisaQueueSnapshotFromInterv(i);
    existing.pac = snap.pac;
    existing.dni = snap.dni;
    existing.fecha = snap.fecha;
    existing.hora = snap.hora;
    existing.sector = snap.sector;
    existing.mayo_cama = snap.mayo_cama;
    existing.san = snap.san;
    existing.updatedAt = Date.now();
    if (existing.status === 'paused_error' || existing.status === 'done') {
      existing.status = 'queued';
      existing.message = '';
    }
    var savedUp = afGeclisaQueueSave(env);
    if (savedUp && savedUp.ok === false) {
      return { ok: false, error: 'No se pudo guardar la cola (' + savedUp.error + ')' };
    }
    return { ok: true, already: true, count: env.items.filter(function (x) { return x.status !== 'done'; }).length };
  }

  env.items.push(afGeclisaQueueSnapshotFromInterv(i));
  var saved = afGeclisaQueueSave(env);
  if (saved && saved.ok === false) {
    return { ok: false, error: 'No se pudo guardar la cola (' + saved.error + ')' };
  }
  var pending = env.items.filter(function (x) { return x.status !== 'done'; }).length;
  return { ok: true, already: false, count: pending };
}

function afGeclisaQueueRemove(intervId) {
  var id = String(intervId || '');
  var env = afGeclisaQueueLoad();
  var before = env.items.length;
  env.items = env.items.filter(function (it) { return String(it.id) !== id; });
  if (env.items.length === before) return { ok: false, error: 'No estaba en la cola.' };
  afGeclisaQueueSave(env);
  return { ok: true, count: env.items.filter(function (x) { return x.status !== 'done'; }).length };
}

function afGeclisaQueueMove(intervId, dir) {
  var id = String(intervId || '');
  var env = afGeclisaQueueLoad();
  var idx = -1;
  for (var i = 0; i < env.items.length; i++) {
    if (String(env.items[i].id) === id) { idx = i; break; }
  }
  if (idx < 0) return { ok: false };
  var j = dir < 0 ? idx - 1 : idx + 1;
  if (j < 0 || j >= env.items.length) return { ok: false };
  var tmp = env.items[idx];
  env.items[idx] = env.items[j];
  env.items[j] = tmp;
  afGeclisaQueueSave(env);
  return { ok: true };
}

function afGeclisaQueueClearDone() {
  var env = afGeclisaQueueLoad();
  env.items = env.items.filter(function (it) { return it.status !== 'done'; });
  afGeclisaQueueSave(env);
  return { ok: true };
}

/** Vacía toda la cola (pendientes + done). Útil tras pruebas. */
function afGeclisaQueueClearAll() {
  var saved = afGeclisaQueueSave(afGeclisaQueueEmpty());
  if (saved && saved.ok === false) return saved;
  try { console.log('[AFG cola] clearAll → items=0'); } catch (e) {}
  return { ok: true };
}

/** Diagnóstico rápido en consola: afGeclisaQueueDebug() */
function afGeclisaQueueDebug() {
  var raw = null;
  try { raw = localStorage.getItem(AFG_QUEUE_KEY); } catch (e) {}
  var env = afGeclisaQueueLoad();
  var info = {
    href: location.href,
    rawLen: raw ? raw.length : 0,
    version: env.version,
    items: env.items.length,
    pending: env.items.filter(function (x) { return x.status !== 'done'; }).length,
    ids: env.items.map(function (x) { return x.id + ':' + (x.status || '') + ':' + (x.pac || ''); }),
    cur: (typeof S !== 'undefined' && S.cur) ? {
      id: S.cur.id,
      pac: S.cur.pac,
      fecha: S.cur.fecha,
      hora: S.cur.hora,
      sector: S.cur.mayo_sector,
      san: S.cur.san
    } : null,
    validateCur: (typeof S !== 'undefined' && S.cur) ? afGeclisaQueueValidate(afGeclisaQueueHydrateCurFromDom(S.cur)) : null
  };
  try { console.log('[AFG cola] debug', info); } catch (e2) {}
  return info;
}

function afGeclisaQueueClearAllUi(ev) {
  if (ev) { try { ev.stopPropagation(); ev.preventDefault(); } catch (e) {} }
  var n = afGeclisaQueueGetItems().length;
  if (!n) {
    toast('La cola ya está vacía');
    return false;
  }
  if (!confirm('¿Vaciar toda la cola GECLISA (' + n + ' ítem' + (n !== 1 ? 's' : '') + ')?')) {
    return false;
  }
  afGeclisaQueueClearAll();
  renderGeclisaQueuePanel();
  if (typeof renderHome === 'function') renderHome();
  toast('Cola GECLISA vaciada');
  return false;
}

/**
 * El host puede faltar si el SW sirvió un home.html viejo (sin #geclisa-queue-panel).
 * En ese caso lo inyectamos delante de #inter-list.
 */
function ensureGeclisaQueuePanelEl() {
  var el = document.getElementById('geclisa-queue-panel');
  if (el) return el;
  var home = document.getElementById('view-home');
  if (!home) return null;
  el = document.createElement('div');
  el.id = 'geclisa-queue-panel';
  el.style.display = 'none';
  var list = document.getElementById('inter-list');
  if (list && list.parentNode === home) {
    home.insertBefore(el, list);
  } else {
    home.appendChild(el);
  }
  try {
    console.warn('[AFG cola] #geclisa-queue-panel faltaba (HTML cacheado?) → inyectado');
  } catch (eW) {}
  return el;
}

function afGeclisaQueuePendingCount() {
  return afGeclisaQueueGetItems().filter(function (it) {
    return it.status !== 'done';
  }).length;
}

/** Actualiza status de un ítem (la extensión lo pide vía bridge). */
function afGeclisaQueueSetStatus(intervId, status, message) {
  var id = String(intervId || '');
  if (!id) return { ok: false, error: 'missing_id' };
  var env = afGeclisaQueueLoad();
  var hit = null;
  for (var i = 0; i < env.items.length; i++) {
    if (String(env.items[i].id) === id) { hit = env.items[i]; break; }
  }
  if (!hit) return { ok: false, error: 'not_in_queue' };
  hit.status = status || hit.status;
  hit.message = message != null ? String(message) : (hit.message || '');
  hit.updatedAt = Date.now();
  afGeclisaQueueSave(env);
  try {
    if (typeof renderGeclisaQueuePanel === 'function') renderGeclisaQueuePanel();
  } catch (e) {}
  return { ok: true, item: hit };
}

window.addEventListener('message', function (ev) {
  if (ev.source !== window) return;
  var d = ev.data;
  if (!d || d.source !== 'AFG_EXT') return;
  if (d.type === 'QUEUE_ITEM_STATUS') {
    afGeclisaQueueSetStatus(d.intervId || d.id, d.status, d.message);
  }
});

function afGeclisaQueueStatusLabel(st) {
  var map = {
    queued: 'En cola',
    running: 'En curso',
    awaiting_save: 'Revisá y guardá',
    done: 'Listo',
    paused_error: 'Pausa'
  };
  return map[st] || st || 'En cola';
}

/** Botón foja: guardar + encolar (sin token). */
function afAgregarAColaGeclisa() {
  try {
    if (typeof syncFojaHoras === 'function') syncFojaHoras();
    // Todas las views están montadas: fj-tec casi siempre existe.
    // No usar solo eso para elegir guardar — hidratar DOM + guardar foja si la vista foja está activa.
    afGeclisaQueueHydrateCurFromDom();
    var fojaActive = !!(document.getElementById('view-foja') &&
      document.getElementById('view-foja').classList.contains('active'));
    if (fojaActive && typeof guardarFoja === 'function') {
      try { guardarFoja(); } catch (eFj) {
        try { console.warn('[AFG cola] guardarFoja', eFj); } catch (e1) {}
      }
    } else if (document.getElementById('f-pac') && typeof guardar === 'function') {
      try { guardar(); } catch (eG) {
        try { console.warn('[AFG cola] guardar', eG); } catch (e2) {}
      }
    }
    afGeclisaQueueHydrateCurFromDom();
  } catch (eSave) {
    try { console.error('[AFG cola] pre-save', eSave); } catch (e3) {}
  }

  var r;
  try {
    r = afGeclisaQueueAdd(typeof S !== 'undefined' ? S.cur : null);
  } catch (eAdd) {
    try { console.error('[AFG cola] add exception', eAdd); } catch (e4) {}
    toast('Error al encolar: ' + String(eAdd && eAdd.message || eAdd));
    return;
  }
  if (!r || !r.ok) {
    try { console.warn('[AFG cola] add failed', r); } catch (e5) {}
    toast((r && r.error) || 'No se pudo encolar');
    return;
  }
  try {
    console.log('[AFG cola] encolada OK', r, afGeclisaQueueDebug());
  } catch (e6) {}
  if (typeof renderGeclisaQueuePanel === 'function') renderGeclisaQueuePanel();
  if (typeof renderHome === 'function' && document.getElementById('view-home') &&
      document.getElementById('view-home').classList.contains('active')) {
    renderHome();
  }
  toast(r.already
    ? ('Ya estaba en cola · ' + r.count + ' pendiente' + (r.count !== 1 ? 's' : ''))
    : ('Agregada a cola GECLISA · ' + r.count + ' pendiente' + (r.count !== 1 ? 's' : '')));
}

/** Checkbox / chip desde Home. */
function afToggleColaGeclisa(intervId, ev) {
  if (ev) {
    try { ev.stopPropagation(); ev.preventDefault(); } catch (e) {}
  }
  var id = String(intervId || '');
  if (afGeclisaQueueIsQueued(id)) {
    afGeclisaQueueRemove(id);
    toast('Sacada de la cola GECLISA');
  } else {
    var list = (typeof S !== 'undefined' && S.intervs) ? S.intervs : [];
    var i = null;
    for (var k = 0; k < list.length; k++) {
      if (String(list[k].id) === id) { i = list[k]; break; }
    }
    var r = afGeclisaQueueAdd(i);
    if (!r.ok) {
      toast(r.error || 'No se pudo encolar');
      return false;
    }
    toast(r.already ? 'Ya estaba en cola' : 'Agregada a cola GECLISA');
  }
  renderGeclisaQueuePanel();
  if (typeof renderHome === 'function') renderHome();
  return false;
}

function afGeclisaQueueRequestExtAction(action) {
  action = String(action || 'QUEUE_START').toUpperCase();
  if (action.indexOf('QUEUE_') !== 0) action = 'QUEUE_' + action;
  try {
    window.postMessage({ source: 'AFG_ANESFACT', type: action }, '*');
  } catch (e) {
    if (typeof toast === 'function') toast('No pude hablar con la extensión');
    return;
  }
  if (typeof toast === 'function') {
    if (action === 'QUEUE_START') toast('Iniciando cola GECLISA… (extensión)');
    else if (action === 'QUEUE_ABORT') toast('Abortando cola…');
    else if (action === 'QUEUE_RETRY') toast('Reintentando…');
  }
}

function afGeclisaQueueStartUi(ev) {
  if (ev && ev.preventDefault) ev.preventDefault();
  if (ev && ev.stopPropagation) ev.stopPropagation();
  var n = afGeclisaQueuePendingCount();
  if (!n) {
    if (typeof toast === 'function') toast('No hay pendientes en la cola');
    return;
  }
  afGeclisaQueueRequestExtAction('QUEUE_START');
}

function afGeclisaQueueAbortUi(ev) {
  if (ev && ev.preventDefault) ev.preventDefault();
  if (ev && ev.stopPropagation) ev.stopPropagation();
  afGeclisaQueueRequestExtAction('QUEUE_ABORT');
}

// Feedback de la extensión tras Iniciar cola desde AnesFact
(function afGeclisaQueueExtAckListener() {
  if (window.__AFG_QUEUE_ACK_LISTENER__) return;
  window.__AFG_QUEUE_ACK_LISTENER__ = true;
  window.addEventListener('message', function (ev) {
    var d = ev && ev.data;
    if (!d || d.source !== 'AFG_EXT' || d.type !== 'QUEUE_ACTION_ACK') return;
    var res = d.result || {};
    var err = d.error || res.error || res.message;
    if (d.error && !res.ok) {
      if (typeof toast === 'function') {
        toast('Extensión: ' + String(err).slice(0, 80) + (String(err).indexOf('Receiving end') >= 0
          ? ' — recargá AnesFact o el popup de la extensión'
          : ''));
      }
      return;
    }
    if (res.ok === false && err) {
      if (typeof toast === 'function') toast(String(err).slice(0, 100));
      return;
    }
    if (res.awaitingSave || (res.state && res.state.status === 'awaiting_save')) {
      if (typeof toast === 'function') toast('Foja lista — tocá GRABAR en GECLISA');
    } else if (res.state && res.state.status === 'running') {
      if (typeof toast === 'function') toast('Cola en curso…');
    } else if (res.ok && d.action === 'QUEUE_START') {
      if (typeof toast === 'function') toast('Cola iniciada');
    }
    try {
      if (typeof renderGeclisaQueuePanel === 'function') renderGeclisaQueuePanel();
    } catch (eR) {}
  });
})();

function afGeclisaQueueMoveUi(intervId, dir, ev) {
  if (ev) { try { ev.stopPropagation(); ev.preventDefault(); } catch (e) {} }
  afGeclisaQueueMove(intervId, dir);
  renderGeclisaQueuePanel();
  return false;
}

function afGeclisaQueueRemoveUi(intervId, ev) {
  if (ev) { try { ev.stopPropagation(); ev.preventDefault(); } catch (e) {} }
  afGeclisaQueueRemove(intervId);
  renderGeclisaQueuePanel();
  if (typeof renderHome === 'function') renderHome();
  toast('Sacada de la cola');
  return false;
}

function renderGeclisaQueuePanel() {
  try {
    var el = ensureGeclisaQueuePanelEl();
    if (!el) return;

    var env = afGeclisaQueueLoad();
    env = afGeclisaQueueRefreshFromIntervs(env);
    // Persistir refresh de datos sin bumpear si no cambió status — save sí bumpea version (OK para bridge)
    try {
      localStorage.setItem(AFG_QUEUE_KEY, JSON.stringify({
        version: env.version,
        updatedAt: env.updatedAt,
        items: env.items
      }));
      afGeclisaQueueNotifyCloudSync();
    } catch (e) {}

    var pending = env.items.filter(function (it) { return it.status !== 'done'; });
    if (!pending.length && !env.items.length) {
      el.style.display = 'none';
      el.innerHTML = '';
      return;
    }

    // Mostrar panel si hay pendientes o done recientes
    var show = pending.length ? pending : env.items.slice(-5);
    el.style.display = 'block';

    var html = '<div class="card" style="margin-bottom:12px;padding:12px 14px;border-color:rgba(56,139,253,.4);background:rgba(56,139,253,.06)">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">';
    html += '<div class="ct" style="margin:0;color:var(--blue)">Cola GECLISA Mayo</div>';
    html += '<div style="font-size:12px;color:var(--text2)">' + pending.length + ' pendiente' + (pending.length !== 1 ? 's' : '') + '</div>';
    html += '</div>';
    if (!pending.length) {
      html += '<div style="font-size:12px;color:var(--text3);margin-bottom:8px">Sin pendientes. Las fojas Mayo se agregan con “Agregar a cola” o el chip en la lista.</div>';
    }
    html += '<div style="display:flex;flex-direction:column;gap:6px">';

    show.forEach(function (it, idx) {
      var stColor = it.status === 'paused_error' ? 'var(--red)'
        : it.status === 'awaiting_save' ? '#e6a800'
        : it.status === 'running' ? 'var(--blue)'
        : it.status === 'done' ? 'var(--green,#1DB954)' : 'var(--text2)';
      var fechaTxt = (typeof fmt === 'function' ? fmt(it.fecha) : it.fecha) || '—';
      var safeId = String(it.id || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;background:rgba(0,0,0,.18);font-size:12px">';
      html += '<div style="color:var(--text3);width:18px;flex-shrink:0">' + (idx + 1) + '</div>';
      html += '<div style="flex:1;min-width:0">';
      html += '<div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (it.pac || 'Sin nombre') + '</div>';
      html += '<div style="color:var(--text3);margin-top:2px">' + fechaTxt + (it.hora ? (' · ' + it.hora) : '') + (it.sector ? (' · ' + it.sector) : '') + '</div>';
      if (it.message) {
        html += '<div style="color:var(--red);margin-top:2px;font-size:11px">' + String(it.message).slice(0, 120) + '</div>';
      }
      html += '</div>';
      html += '<span style="font-size:10px;font-weight:700;color:' + stColor + ';flex-shrink:0">' + afGeclisaQueueStatusLabel(it.status) + '</span>';
      if (it.status !== 'done' && it.status !== 'running') {
        html += '<button type="button" class="btn btn-s" style="width:auto;padding:4px 8px;font-size:11px" title="Subir" onclick="afGeclisaQueueMoveUi(\'' + safeId + '\',-1,event)">↑</button>';
        html += '<button type="button" class="btn btn-s" style="width:auto;padding:4px 8px;font-size:11px" title="Bajar" onclick="afGeclisaQueueMoveUi(\'' + safeId + '\',1,event)">↓</button>';
        html += '<button type="button" class="btn btn-s" style="width:auto;padding:4px 8px;font-size:11px" title="Quitar" onclick="afGeclisaQueueRemoveUi(\'' + safeId + '\',event)">✕</button>';
      }
      html += '</div>';
    });

    html += '</div>';
    html += '<p style="font-size:11px;color:var(--text3);margin:10px 0 0;line-height:1.4">';
    html += 'Extensión instalada + GECLISA logueado. <b>Iniciar cola</b> enfoca GECLISA, llena cada foja; vos tocás <b>GRABAR</b> y sigue sola.';
    html += '</p>';
    html += '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">';
    if (pending.length) {
      html += '<button type="button" class="btn btn-b" style="flex:1;min-width:120px;font-size:13px;padding:10px" onclick="afGeclisaQueueStartUi(event)">&#9654; Iniciar cola</button>';
      html += '<button type="button" class="btn btn-s" style="flex:0 0 auto;font-size:12px;padding:10px" onclick="afGeclisaQueueAbortUi(event)">Abortar</button>';
    }
    if (env.items.some(function (x) { return x.status === 'done'; })) {
      html += '<button type="button" class="btn btn-s" style="flex:1;font-size:12px" onclick="afGeclisaQueueClearDone();renderGeclisaQueuePanel();renderHome();">Limpiar completadas</button>';
    }
    html += '<button type="button" class="btn btn-s" style="flex:1;font-size:12px;color:var(--red);border-color:rgba(248,81,73,.45)" onclick="afGeclisaQueueClearAllUi(event)">Vaciar cola</button>';
    html += '</div>';
    html += '</div>';
    el.innerHTML = html;
  } catch (eRender) {
    try { console.error('[AFG cola] renderGeclisaQueuePanel', eRender); } catch (eC) {}
  }
}
