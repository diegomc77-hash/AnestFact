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
    if (!data || !Array.isArray(data.items)) return afGeclisaQueueEmpty();
    return {
      version: Number(data.version) || 1,
      updatedAt: data.updatedAt || Date.now(),
      items: data.items
    };
  } catch (e) {
    return afGeclisaQueueEmpty();
  }
}

function afGeclisaQueueSave(envelope) {
  envelope = envelope || afGeclisaQueueEmpty();
  envelope.version = (Number(envelope.version) || 0) + 1;
  envelope.updatedAt = Date.now();
  localStorage.setItem(AFG_QUEUE_KEY, JSON.stringify(envelope));
  afPublishGeclisaQueueSync(envelope);
  return envelope;
}

/** Publica cola para el bridge (pieza 2 leerá esto). */
function afPublishGeclisaQueueSync(envelope) {
  envelope = envelope || afGeclisaQueueLoad();
  try {
    localStorage.setItem(AFG_QUEUE_KEY, JSON.stringify(envelope));
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

function afGeclisaQueueAdd(interv) {
  var i = interv;
  if (!i && typeof S !== 'undefined') i = S.cur;
  var v = afGeclisaQueueValidate(i);
  if (!v.ok) return { ok: false, error: v.error };

  var env = afGeclisaQueueLoad();
  var id = String(i.id);
  var existing = env.items.filter(function (it) {
    return String(it.id) === id && it.status !== 'done';
  })[0];
  if (existing) {
    // Actualizar snapshot y dejar en queued si estaba en error
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
    afGeclisaQueueSave(env);
    return { ok: true, already: true, count: env.items.filter(function (x) { return x.status !== 'done'; }).length };
  }

  env.items.push(afGeclisaQueueSnapshotFromInterv(i));
  afGeclisaQueueSave(env);
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

function afGeclisaQueuePendingCount() {
  return afGeclisaQueueGetItems().filter(function (it) {
    return it.status !== 'done';
  }).length;
}

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
    if (document.getElementById('fj-tec') && typeof guardarFoja === 'function') guardarFoja();
    else if (document.getElementById('f-pac') && typeof guardar === 'function') guardar();
  } catch (eSave) {}

  var r = afGeclisaQueueAdd(typeof S !== 'undefined' ? S.cur : null);
  if (!r.ok) {
    toast(r.error || 'No se pudo encolar');
    return;
  }
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
  var el = document.getElementById('geclisa-queue-panel');
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
      html += '<button type="button" class="btn btn-s" style="width:auto;padding:4px 8px;font-size:11px" title="Subir" onclick="afGeclisaQueueMoveUi(\'' + it.id + '\',-1,event)">↑</button>';
      html += '<button type="button" class="btn btn-s" style="width:auto;padding:4px 8px;font-size:11px" title="Bajar" onclick="afGeclisaQueueMoveUi(\'' + it.id + '\',1,event)">↓</button>';
      html += '<button type="button" class="btn btn-s" style="width:auto;padding:4px 8px;font-size:11px" title="Quitar" onclick="afGeclisaQueueRemoveUi(\'' + it.id + '\',event)">✕</button>';
    }
    html += '</div>';
  });

  html += '</div>';
  html += '<p style="font-size:11px;color:var(--text3);margin:10px 0 0;line-height:1.4">';
  html += 'Sin token al encolar. Pieza 2: en el popup de la extensión usá “Probar mint (1ª de cola)”. El runner automático es pieza 3–4.';
  html += '</p>';
  if (env.items.some(function (x) { return x.status === 'done'; })) {
    html += '<button type="button" class="btn btn-s" style="width:100%;margin-top:8px;font-size:12px" onclick="afGeclisaQueueClearDone();renderGeclisaQueuePanel();renderHome();">Limpiar completadas</button>';
  }
  html += '</div>';
  el.innerHTML = html;
}
