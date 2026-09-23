// AnesFact — Cola evweb (independiente de la cola GECLISA, misma idea)
var AFE_QUEUE_KEY = 'afg_evweb_queue';
// Mapeo texto de foja -> value del <select> de evweb. Extensible (más mutuales/sanatorios).
/** Claves = texto foja (afeNorm + indexOf). Valores = obraId EVWEB (cboObraSocial). */
var AFE_OBRA_MAP = {
  'PAMI': '382',
  'IOSFA': '105',
  'APROSS': '259',
  'FEDERACION PATRONAL ART': '228',
  'OMINT ART': '119',
  'EXPERTA ART': '258',
  'ANDINA ART': '433',
  'HORIZONTE': '76',
  'BERKLEY': '227',
  'OSPECOR': '37',
  'LA HOLANDO ART': '5',
  'PREVENCION': '263',
  'APOS': '437',
  'PROVINCIA ART': '420',
  'PRODUCTORES DE FRUTAS': '70'
};
var AFE_SAN_MAP = {
  'MAYO': '208',
  'SANATORIO MAYO': '208',
  'AERONAUTICO': '384',
  'HOSPITAL AERONAUTICO': '384'
};
/** Mayúsculas, sin tildes, espacios colapsados — p.ej. "Hospital Aeronáutico" → "HOSPITAL AERONAUTICO". */
function afeNorm(s){
  return (s || '').toString().trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ');
}
function afeMapObra(t){
  var k = afeNorm(t);
  if (AFE_OBRA_MAP[k]) return AFE_OBRA_MAP[k];
  for (var key in AFE_OBRA_MAP) {
    if (k.indexOf(key) !== -1) return AFE_OBRA_MAP[key];
  }
  return '';
}
function afeMapSan(t){
  var k = afeNorm(t);
  for (var key in AFE_SAN_MAP) { if (k.indexOf(key) !== -1) return AFE_SAN_MAP[key]; }
  return '';
}
/** Snapshot de un doc para la cola: siempre objeto completo (resuelve aliasOf). Sin data → null. */
function afeDocSnap(docs, tipo){
  docs = docs || {};
  var d = null;
  if (typeof afResolveDoc === 'function') {
    d = afResolveDoc(docs, tipo);
  } else {
    d = docs[tipo] || null;
    if (d && d.aliasOf && docs[d.aliasOf] && docs[d.aliasOf].data) {
      var src = docs[d.aliasOf];
      d = {
        nombre: src.nombre,
        tipo: src.tipo,
        data: src.data,
        fecha: src.fecha,
        aliasOf: d.aliasOf
      };
    }
  }
  if (!d || !d.data) return null;
  return {
    nombre: d.nombre || ('doc-' + tipo),
    tipo: d.tipo || 'application/octet-stream',
    data: d.data,
    fecha: d.fecha || ''
  };
}
/** Solo ranuras con blob. qx alias de anest se manda igual (mismo data, clasificación aparte en evweb). */
function afeSnapshotDocs(docs){
  var out = {};
  var anest = afeDocSnap(docs, 'anest');
  var qx = afeDocSnap(docs, 'qx');
  var auth = afeDocSnap(docs, 'auth');
  if (anest) out.anest = anest;
  if (qx) out.qx = qx;
  if (auth) out.auth = auth;
  return out;
}
function afEvwebQueueLoad(){
  try {
    var raw = localStorage.getItem(AFE_QUEUE_KEY);
    var p = raw ? JSON.parse(raw) : null;
    return (p && p.items) ? p : { version:1, updatedAt:Date.now(), items:[] };
  } catch(e){ return { version:1, updatedAt:Date.now(), items:[] }; }
}
function afEvwebQueuePublish(q){
  try {
    window.postMessage({
      source: 'AFG_ANESFACT',
      type: 'EVWEB_QUEUE',
      queue: q
    }, '*');
  } catch(e){}
  try {
    document.dispatchEvent(new CustomEvent('afg-evweb-queue', { detail: q }));
  } catch(e2){}
}
function afEvwebQueueSave(q){
  q.updatedAt = Date.now();
  try { localStorage.setItem(AFE_QUEUE_KEY, JSON.stringify(q)); } catch(e){}
  afEvwebQueuePublish(q);
}
function afEvwebQueuePendingCount(){
  var q = afEvwebQueueLoad();
  return (q.items || []).filter(function(it){ return it && it.status !== 'done'; }).length;
}
/** Snapshot de prácticas para la cola: cod/desc/comp + codigoEvweb si match inequívoco. */
function afeNormPracDesc(s){
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cruza descripción ADAARC vs catálogo EVWEB (por obraId).
 * Solo resuelve si hay un único match claro (exacto o mismos tokens).
 * Nunca adivina entre varios candidatos.
 */
function afeResolvePracEvweb(desc, obraId){
  var cat = (typeof window !== 'undefined' && window.AF_EVWEB_PRACTICAS_CATALOG) || null;
  var oid = String(obraId || '');
  if (!cat || !oid) {
    return { resolved: false, reason: 'no_catalog_or_obra' };
  }
  var list = cat.byObraId && cat.byObraId[oid];
  if (!list || !list.length) {
    return { resolved: false, reason: 'obra_not_in_catalog', obraId: oid };
  }
  var want = afeNormPracDesc(desc);
  if (!want || want.length < 4) {
    return { resolved: false, reason: 'desc_too_short' };
  }

  /**
   * [codigo, normDesc, desc, param2] → candidato.
   * complejidad EVWEB = param2 - 88. Confirmado con 3 valores reales que pasó Sole
   * (Lipoaspiración hasta 2 zonas=5, más de 2 zonas=6, Liposucción de abdomen=5 —
   * los tres coinciden exacto con param2-88) y con el 88% de 1133 prácticas ADAARC
   * con texto idéntico en el catálogo EVWEB (mismo comp que param2-88).
   * No es 100% universal (12% de casos difieren) — por eso nunca se autoselecciona
   * solo por este número: se usa para ordenar/alertar y como referencia visual.
   */
  var AFE_COMPLEJIDAD_OFFSET = 88;
  function toCand(row){
    var p2 = row[3] != null ? row[3] : null;
    return {
      codigoEvweb: String(row[0]),
      descripcion: row[2],
      param2: p2,
      complejidad: p2 != null ? (p2 - AFE_COMPLEJIDAD_OFFSET) : null
    };
  }
  function sortByComplejidadDesc(rows){
    return rows.map(toCand).sort(function(a,b){
      var pa = a.complejidad == null ? -1 : a.complejidad, pb = b.complejidad == null ? -1 : b.complejidad;
      return pb - pa;
    });
  }

  var exact = [];
  var i;
  for (i = 0; i < list.length; i++) {
    if (list[i][1] === want) exact.push(list[i]);
  }
  if (exact.length === 1) {
    return {
      resolved: true,
      codigoEvweb: String(exact[0][0]),
      descripcion: exact[0][2],
      param2: exact[0][3] != null ? exact[0][3] : null,
      complejidad: exact[0][3] != null ? (exact[0][3] - AFE_COMPLEJIDAD_OFFSET) : null,
      via: 'exact'
    };
  }
  if (exact.length > 1) {
    return { resolved: false, reason: 'exact_ambiguous', candidates: exact.length, candidatesList: sortByComplejidadDesc(exact) };
  }

  var wantTokens = want.split(' ').filter(Boolean).sort();
  var wantKey = wantTokens.join(' ');
  var tokenEq = [];
  for (i = 0; i < list.length; i++) {
    var t = String(list[i][1] || '').split(' ').filter(Boolean).sort().join(' ');
    if (t && t === wantKey) tokenEq.push(list[i]);
  }
  if (tokenEq.length === 1) {
    return {
      resolved: true,
      codigoEvweb: String(tokenEq[0][0]),
      descripcion: tokenEq[0][2],
      param2: tokenEq[0][3] != null ? tokenEq[0][3] : null,
      complejidad: tokenEq[0][3] != null ? (tokenEq[0][3] - AFE_COMPLEJIDAD_OFFSET) : null,
      via: 'token_eq'
    };
  }
  if (tokenEq.length > 1) {
    return { resolved: false, reason: 'token_ambiguous', candidates: tokenEq.length, candidatesList: sortByComplejidadDesc(tokenEq) };
  }

  return { resolved: false, reason: 'no_unique_match' };
}

function afeSnapshotPracs(pracs, obraValue){
  if (!pracs || !pracs.length) return [];
  var oid = String(obraValue || '');
  return pracs.map(function(p){
    var snap = {
      cod: String((p && p.cod) || ''),
      desc: String((p && p.desc) || ''),
      comp: (p && p.comp) != null ? p.comp : null
    };
    if (!snap.cod && !snap.desc) return null;
    // Si ya se resolvió (o se eligió a mano) en Facturación, ese código viaja tal cual —
    // no se recalcula acá para no pisar una elección manual de complejidad.
    if (p && p.codigoEvweb) {
      snap.codigoEvweb = p.codigoEvweb;
      snap.evwebDesc = p.evwebDesc || '';
      snap.evwebParam2 = p.evwebParam2 != null ? p.evwebParam2 : null;
      snap.evwebComplejidad = p.evwebComplejidad != null ? p.evwebComplejidad : null;
      snap.evwebMatchVia = p.evwebMatchVia || (p.evwebManual ? 'manual' : 'exact');
      return snap;
    }
    var m = afeResolvePracEvweb(snap.desc, oid);
    if (m && m.resolved) {
      snap.codigoEvweb = m.codigoEvweb;
      snap.evwebDesc = m.descripcion || '';
      snap.evwebParam2 = m.param2 != null ? m.param2 : null;
      snap.evwebComplejidad = m.complejidad != null ? m.complejidad : null;
      snap.evwebMatchVia = m.via || 'exact';
    } else {
      snap.evwebMatchVia = (m && m.reason) || 'unresolved';
      if (m && m.candidates) snap.evwebCandidates = m.candidates;
    }
    return snap;
  }).filter(Boolean);
}

function afEvwebQueueSnapshotFromInterv(i){
  var obraValue = afeMapObra(i.obra);
  return {
    id: String(i.id),
    pac:(i.pac||'').trim(), dni:(i.dni||'').trim(), fecha:(i.fecha||'').trim(),
    hora:(i.hora||'').trim(), ciru:(i.ciru||'').trim(), edad:(i.edad||'').trim(),
    obra:(i.obra||'').trim(), afil:(i.afil||'').trim(), san:(i.san||'').trim(),
    obraValue: obraValue, sanValue: afeMapSan(i.san),
    docs: afeSnapshotDocs(i.docs),
    obesidadMorbida: !!i.ob,
    pracs: afeSnapshotPracs(i.pracs, obraValue),
    status:'queued', message:'', addedAt:Date.now(), updatedAt:Date.now()
  };
}
function afEvwebQueueValidate(i){
  var e=[];
  if(!(i.pac||'').trim()) e.push('Falta paciente');
  if(!(i.fecha||'').trim()) e.push('Falta fecha');
  if(!(i.hora||'').trim()) e.push('Falta hora');
  if(!(i.dni||'').trim()) e.push('Falta DNI');
  if(!(i.edad||'').trim()) e.push('Falta edad');
  if(!(i.afil||'').trim()) e.push('Falta N° afiliado');
  if(!afeMapObra(i.obra)) e.push('Obra social "'+(i.obra||'')+'" sin mapear (AFE_OBRA_MAP)');
  if(!afeMapSan(i.san)) e.push('Sanatorio "'+(i.san||'')+'" sin mapear (AFE_SAN_MAP)');
  // Ticket 9a: si hay prácticas, cada una debe tener codigoEvweb (auto o manual).
  // Sin prácticas → no bloquea (distinto de "con prácticas sin código").
  var obraValue = afeMapObra(i.obra);
  var pracSnaps = afeSnapshotPracs(i.pracs, obraValue);
  if (pracSnaps.length) {
    pracSnaps.forEach(function(p){
      if (p && p.codigoEvweb) return;
      var desc = ((p && (p.desc || p.cod)) || '?').trim() || '?';
      e.push('Práctica "'+desc+'" sin código EVWEB — resolvela en Facturación antes de encolar');
    });
  }
  return e;
}
function afEvwebQueueHydrateCurFromDom(interv){
  try {
    var g=function(id){var e=document.getElementById(id); return e?e.value:'';};
    interv.pac = g('f-pac')||interv.pac;
    interv.dni = g('f-dni')||interv.dni;
    interv.fecha = g('f-fecha')||interv.fecha;
    interv.hora = g('foja-hora-inicio')||g('f-hora')||interv.hora;
    interv.ciru = g('f-ciru')||interv.ciru;
    interv.edad = g('f-edad')||interv.edad;
    interv.obra = g('f-obra')||interv.obra;
    interv.afil = g('f-afil')||interv.afil;
    interv.san = g('f-san')||interv.san;
    var obEl = document.getElementById('f-ob');
    if (obEl) interv.ob = !!obEl.checked;
    if (typeof S !== 'undefined' && S && S.cur && S.cur.pracs) interv.pracs = S.cur.pracs;
  } catch(e){}
  return interv;
}

function afEvwebQueueStatusLabel(st){
  var map = {
    queued: 'En cola',
    running: 'En curso',
    awaiting_confirm: 'Revisá en ADAARC',
    done: 'Listo',
    paused_error: 'Pausa'
  };
  return map[st] || st || 'En cola';
}

/** HTML de la cola (misma fuente afg_evweb_queue) para cualquier host.
 * Mismo patrón visual que GECLISA: .afg-q-item + color por estado (Ticket 8). */
function afEvwebQueueDocsLabel(it){
  function nice(k){
    if (k === 'anest') return 'Foja anestésica';
    if (k === 'qx') return 'Foja quirúrgica';
    if (k === 'auth') return 'Autorización';
    return k;
  }
  var keys = [];
  if (it && it.docs && Object.keys(it.docs).length) {
    keys = Object.keys(it.docs);
  } else if (it && it.docsMeta && Object.keys(it.docsMeta).length) {
    keys = Object.keys(it.docsMeta);
  }
  if (!keys.length) return 'Sin documentos';
  return keys.map(nice).join(', ');
}

/** Prácticas del ítem de cola sin codigoEvweb (Ticket 9a, aviso en lista). */
function afEvwebQueueUnresolvedPracDescs(it){
  var out = [];
  ((it && it.pracs) || []).forEach(function(p){
    if (!p || p.codigoEvweb) return;
    var desc = String((p.desc || p.cod || '?')).trim() || '?';
    out.push(desc);
  });
  return out;
}

/** Docs anest/qx/auth sin blob en el ítem (Ticket 9b — aviso, no bloqueo). */
function afEvwebQueueMissingDocLabels(it){
  function nice(k){
    if (k === 'anest') return 'foja anestésica';
    if (k === 'qx') return 'foja quirúrgica';
    if (k === 'auth') return 'autorización';
    return k;
  }
  function hasDoc(tipo){
    var d = it && it.docs && it.docs[tipo];
    if (!d) return false;
    return !!(d.data || d.aliasOf || d.idb || d.storage || d.storagePath);
  }
  var miss = [];
  ['anest', 'qx', 'auth'].forEach(function(t){
    if (!hasDoc(t)) miss.push(nice(t));
  });
  return miss;
}

function afEvwebQueueListHtml(){
  var q = afEvwebQueueLoad();
  var items = (q && q.items) ? q.items : [];
  if (!items.length) {
    return '<p style="margin:0;color:var(--text3);font-size:12px;line-height:1.4">'
      + 'Cola vacía. Adjuntá docs y tocá <b>Agregar a cola evweb</b> (Facturación o final de foja Aero).'
      + '</p>';
  }
  var lastId = q.lastEnqueuedId ? String(q.lastEnqueuedId) : '';
  var html = '<div style="display:flex;flex-direction:column;gap:6px">';
  items.forEach(function (it, idx) {
    var st = it.status || 'queued';
    var stColor = st === 'paused_error' ? 'var(--red)'
      : st === 'awaiting_confirm' ? 'var(--estado-cola)'
      : st === 'running' ? 'var(--blue)'
      : st === 'done' ? 'var(--green)' : 'var(--text2)';
    var fechaTxt = (typeof fmt === 'function' ? fmt(it.fecha) : it.fecha) || '—';
    var isLast = lastId && String(it.id) === lastId;
    var idAttr = String(it.id || '').replace(/"/g, '');
    var metaParts = [fechaTxt];
    if (it.hora) metaParts.push(it.hora);
    if (it.obraValue) metaParts.push(it.obraValue);
    else if (it.obra) metaParts.push(it.obra);
    if (it.sanValue) metaParts.push(it.sanValue);
    else if (it.san) metaParts.push(it.san);
    metaParts.push(afEvwebQueueDocsLabel(it));

    html += '<div class="afg-q-item">';
    html += '<div style="color:var(--text3);width:18px;flex-shrink:0">' + (idx + 1) + '</div>';
    html += '<div class="afg-q-item-body">';
    html += '<div class="afg-q-name">' + (it.pac || 'Sin nombre')
      + (isLast ? ' <span style="font-size:10px;color:#14B8A6;font-weight:600">· último</span>' : '')
      + '</div>';
    html += '<div style="color:var(--text3);margin-top:2px">' + metaParts.join(' · ') + '</div>';
    if (it.dni) {
      html += '<div style="color:var(--text3);margin-top:2px;font-size:11px">DNI ' + it.dni + '</div>';
    }
    if (it.message) {
      html += '<div style="color:var(--red);margin-top:2px;font-size:11px">' + String(it.message).slice(0, 120) + '</div>';
    }
    var unresolved = afEvwebQueueUnresolvedPracDescs(it);
    if (unresolved.length) {
      html += '<div style="color:var(--red);margin-top:2px;font-size:11px">Sin código EVWEB: '
        + unresolved.map(function(d){ return String(d).replace(/</g,'&lt;'); }).join(', ')
        + '</div>';
    }
    var missingDocs = afEvwebQueueMissingDocLabels(it);
    if (missingDocs.length) {
      html += '<div style="color:var(--red);margin-top:2px;font-size:11px">Sin: '
        + missingDocs.join(', ')
        + '</div>';
    }
    html += '</div>';
    html += '<div class="afg-q-item-actions">';
    html += '<span style="font-size:10px;font-weight:700;color:' + stColor + '">' + afEvwebQueueStatusLabel(st) + '</span>';
    if (st !== 'done' && st !== 'running') {
      html += '<button type="button" class="btn btn-s" style="width:auto;padding:4px 8px;font-size:11px" title="Quitar"'
        + ' data-evweb-q-remove="' + idAttr + '"'
        + ' onclick="afEvwebQueueRemoveUi(event)">✕</button>';
    }
    html += '</div></div>';
  });
  html += '</div>';
  html += '<div style="margin-top:8px">';
  html += '<button type="button" class="btn btn-s" style="font-size:11px" onclick="afEvwebQueueClearUi(event)">Vaciar cola</button>';
  html += '</div>';
  return html;
}

/**
 * Pinta todos los hosts de la cola (dock evweb, Facturación, fin de foja).
 * Fuente única: afg_evweb_queue.
 */
function afRenderEvwebQueueHub(){
  var html = afEvwebQueueListHtml();
  var nodes = document.querySelectorAll('[data-evweb-queue-list]');
  for (var i = 0; i < nodes.length; i++) {
    nodes[i].innerHTML = html;
  }
  // Compat: id legacy del dock
  var legacy = document.getElementById('evweb-queue-list');
  if (legacy && !legacy.getAttribute('data-evweb-queue-list')) {
    legacy.innerHTML = html;
  }
}

function afEvwebQueueRemove(id){
  id = String(id || '').trim();
  if (!id) return { ok: false, error: 'missing_id' };
  var q = afEvwebQueueLoad();
  var before = (q.items || []).length;
  q.items = (q.items || []).filter(function (it) { return String(it.id) !== id; });
  if (String(q.lastEnqueuedId || '') === id) {
    var last = q.items.length ? q.items[q.items.length - 1] : null;
    q.lastEnqueuedId = last ? last.id : null;
  }
  afEvwebQueueSave(q);
  afRenderEvwebQueueHub();
  return { ok: true, removed: before - q.items.length, left: q.items.length };
}

function afEvwebQueueClear(){
  var q = { version: 1, updatedAt: Date.now(), items: [], lastEnqueuedId: null };
  afEvwebQueueSave(q);
  afRenderEvwebQueueHub();
  if (typeof toast === 'function') toast('Cola evweb vaciada');
  return { ok: true };
}

function afEvwebQueueRemoveUi(ev){
  if (ev && ev.preventDefault) ev.preventDefault();
  if (ev && ev.stopPropagation) ev.stopPropagation();
  var btn = ev && ev.currentTarget;
  var id = btn && btn.getAttribute('data-evweb-q-remove');
  if (!id) return false;
  var r = afEvwebQueueRemove(id);
  if (r && r.ok && typeof toast === 'function') toast('Quitado de cola evweb');
  return false;
}

function afEvwebQueueClearUi(ev){
  if (ev && ev.preventDefault) ev.preventDefault();
  if (ev && ev.stopPropagation) ev.stopPropagation();
  var n = afEvwebQueuePendingCount();
  var ok = true;
  try {
    ok = confirm('¿Vaciar la cola evweb (' + n + ' pendiente' + (n !== 1 ? 's' : '') + ')?');
  } catch (eC) { ok = true; }
  if (!ok) return false;
  afEvwebQueueClear();
  return false;
}

/** Consola: afEvwebQueueDump() — ver ítems; afEvwebQueueClear() — vaciar. */
function afEvwebQueueDump(){
  var q = afEvwebQueueLoad();
  var rows = (q.items || []).map(function (it) {
    return {
      id: it.id,
      pac: it.pac,
      dni: it.dni,
      status: it.status,
      obra: it.obraValue,
      san: it.sanValue,
      docs: afEvwebQueueDocsLabel(it),
      addedAt: it.addedAt,
      last: String(it.id) === String(q.lastEnqueuedId || '')
    };
  });
  try { console.table(rows); } catch (eT) {}
  try { console.log('[AF evweb queue]', q); } catch (eL) {}
  return q;
}

function afEvwebQueueNotifyEnqueued(snap){
  var n = afEvwebQueuePendingCount();
  var pac = (snap && snap.pac) || 'foja';
  if (typeof toast === 'function') {
    toast('Agregado a cola evweb · ' + pac + ' · ' + n + ' pendiente' + (n !== 1 ? 's' : ''));
  }
  afRenderEvwebQueueHub();
}

function afEvwebDocsNeedAnestGenerate(interv){
  if (!interv || !interv.foja) return false;
  var d = interv.docs && interv.docs.anest;
  if (d && (d.data || d.idb || d.storage || d.aliasOf)) return false;
  return typeof afGenerateAnestDocForEvweb === 'function';
}

function afEvwebEnsureAnestDoc(interv){
  return new Promise(function(resolve){
    if (!afEvwebDocsNeedAnestGenerate(interv)) {
      resolve(interv);
      return;
    }
    if (typeof afFlushIntervDomIfCurrent === 'function') {
      afFlushIntervDomIfCurrent(interv);
    }
    if (typeof toast === 'function') {
      toast('Generando PDF foja anestésica para evweb…');
    }
    afGenerateAnestDocForEvweb(interv).then(function(doc){
      if (doc && doc.data) {
        interv.docs = interv.docs || {};
        interv.docs.anest = doc;
        if (typeof toast === 'function') {
          toast('Foja anestésica lista para cola evweb');
        }
      }
      resolve(interv);
    }).catch(function(e){
      try { console.warn('[AF evweb] anest PDF', e); } catch (eL) {}
      if (typeof toast === 'function') {
        toast('No pude generar PDF anestésica (¿sin red?). Podés imprimir y adjuntar manual.');
      }
      resolve(interv);
    });
  });
}

function afEvwebQueueAdd(interv){
  afEvwebQueueHydrateCurFromDom(interv);
  var errs = afEvwebQueueValidate(interv);
  if (errs.length) {
    if (typeof toast === 'function') toast('No se agregó a cola evweb: '+errs.join('; '));
    return {ok:false, errors:errs};
  }

  function enqueueWithDocs(docsObj){
    var snap = afEvwebQueueSnapshotFromInterv(Object.assign({}, interv, { docs: docsObj || interv.docs }));
    var q = afEvwebQueueLoad();
    var idx = q.items.findIndex(function(it){ return it.id===snap.id; });
    var already = idx >= 0;
    snap.addedAt = Date.now();
    snap.updatedAt = snap.addedAt;
    if (idx >= 0) {
      q.items.splice(idx, 1);
    }
    q.items.push(snap);
    q.lastEnqueuedId = snap.id;
    afEvwebQueueSave(q);
    afEvwebQueueNotifyEnqueued(snap);
    var nDocs = snap.docs ? Object.keys(snap.docs).length : 0;
    // Ticket 9b: el aviso de docs faltantes es persistente en afEvwebQueueListHtml (no toast).
    return {ok:true, item:snap, already:already, docsCount:nDocs};
  }

  function finishEnqueue(docsObj){
    var merged = Object.assign({}, interv, { docs: docsObj || interv.docs });
    return afEvwebEnsureAnestDoc(merged).then(function(withAnest){
      return enqueueWithDocs(withAnest.docs);
    });
  }

  // Si adjuntos están en IndexedDB o solo en Storage, hidratar antes del snapshot.
  if (interv && interv.docs) {
    var needsHydrate = ['anest','qx','auth'].some(function(t){
      var d = interv.docs[t];
      return d && !d.data && !d.aliasOf && (d.idb || d.storage || d.storagePath);
    });
    if (needsHydrate && typeof afDocEnsureLocalData === 'function') {
      if (typeof toast === 'function') toast('Preparando adjuntos para cola evweb…');
      Promise.all(['anest','qx','auth'].map(function(t){
        return afDocEnsureLocalData(interv.docs, t, interv.id).then(function(full){
          if (full && full.data) {
            interv.docs = interv.docs || {};
            interv.docs[t] = Object.assign({}, interv.docs[t] || {}, full);
          }
        });
      })).then(function(){
        finishEnqueue(interv.docs);
      }).catch(function(){
        finishEnqueue(interv.docs);
      });
      return {ok:true, pendingHydrate:true};
    }
    if (needsHydrate && typeof afDocsHydrateIntervsForSync === 'function') {
      if (typeof toast === 'function') toast('Preparando adjuntos para cola evweb…');
      afDocsHydrateIntervsForSync([interv]).then(function(list){
        var hydrated = (list && list[0]) || interv;
        finishEnqueue(hydrated.docs);
      }).catch(function(){
        finishEnqueue(interv.docs);
      });
      return {ok:true, pendingHydrate:true};
    }
  }
  finishEnqueue(interv.docs);
  return {ok:true, pendingAnest:true};
}

function afAgregarAColaEvweb(){
  // Hidratar DOM + encolar sin pasar por assertPlanServer/guardarFoja
  // (ese camino mostraba "plan" aunque el fallo real fuera cuota local).
  try {
    if (typeof flushFormIntoCur === 'function') flushFormIntoCur();
  } catch (eFlush) {}
  try {
    if (typeof flushFojaDomIntoCur === 'function') flushFojaDomIntoCur();
  } catch (eFj) {}
  if (!S.cur) {
    if (typeof toast === 'function') toast('Abrí una foja primero');
    return {ok:false, error:'no_cur'};
  }
  afEvwebQueueHydrateCurFromDom(S.cur);
  var r = afEvwebQueueAdd(S.cur);
  try {
    if (typeof afCommitGuardarLocal === 'function') afCommitGuardarLocal();
  } catch (eSave) {
    if (eSave && (eSave.afQuota || eSave.name === 'QuotaExceededError')) {
      if (r && r.ok && typeof toast === 'function') {
        toast('En cola evweb; foja no persistió (memoria local llena)');
      }
    } else {
      try { console.warn('[AF] cola evweb save', eSave); } catch (eL) {}
    }
  }
  return r;
}

/** Reusa afg_ext_id / bridge (misma extensión que GECLISA). */
function afEvwebExtId(){
  try {
    if (window.__AFG_EXT_ID) return String(window.__AFG_EXT_ID);
    return localStorage.getItem('afg_ext_id') || '';
  } catch (e) {
    return '';
  }
}

/**
 * AnesFact → extensión: EVWEB_QUEUE_START / RETRY / ABORT / NEXT.
 * Abre/enfoca ADAARC y arranca el runner (como Iniciar cola GECLISA).
 */
function afEvwebQueueRequestExtAction(action){
  action = String(action || 'EVWEB_QUEUE_START').toUpperCase();
  if (action.indexOf('EVWEB_QUEUE_') !== 0) {
    if (action.indexOf('QUEUE_') === 0) action = 'EVWEB_' + action;
    else action = 'EVWEB_QUEUE_' + action.replace(/^EVWEB_/, '');
  }

  function viaPostMessage(){
    try {
      console.log('[AF evweb] viaPostMessage', action);
      window.postMessage({ source: 'AFG_ANESFACT', type: action }, '*');
    } catch (e) {
      if (typeof toast === 'function') toast('No pude hablar con la extensión');
      try { console.warn('[AF evweb] postMessage fail', e); } catch (e2) {}
      return false;
    }
    var ackSeen = false;
    var onAck = function (ev) {
      var d = ev && ev.data;
      if (d && d.source === 'AFG_EXT' && d.type === 'QUEUE_ACTION_ACK' && d.action === action) {
        ackSeen = true;
        window.removeEventListener('message', onAck);
        try {
          console.log('[AF evweb] QUEUE_ACTION_ACK', {
            action: action,
            ok: d.result && d.result.ok,
            error: (d.result && d.result.error) || d.error,
            message: d.result && d.result.message
          });
        } catch (eAckL) {}
        if (d.result && d.result.ok === false && typeof toast === 'function') {
          toast('Cola evweb: ' + (d.result.message || d.result.error || 'error'));
        }
        if (typeof afRenderEvwebQueueHub === 'function') afRenderEvwebQueueHub();
      }
    };
    window.addEventListener('message', onAck);
    setTimeout(function () {
      window.removeEventListener('message', onAck);
      if (!ackSeen && typeof toast === 'function') {
        toast('Extensión no respondió — recargá AnesFact (F5) o abrí el ícono de la extensión una vez');
        try { console.warn('[AF evweb] sin ACK en 2s', action); } catch (e3) {}
      }
    }, 2000);
    return true;
  }

  function toastStarting(){
    if (typeof toast !== 'function') return;
    if (action === 'EVWEB_QUEUE_START') toast('Iniciando cola evweb… abrí ADAARC si hace falta');
    else if (action === 'EVWEB_QUEUE_ABORT') toast('Abortando cola evweb…');
    else if (action === 'EVWEB_QUEUE_RETRY') toast('Reintentando cola evweb…');
    else if (action === 'EVWEB_QUEUE_NEXT') toast('Siguiente en cola evweb…');
  }

  var extId = afEvwebExtId();
  if (
    extId &&
    typeof chrome !== 'undefined' &&
    chrome.runtime &&
    typeof chrome.runtime.sendMessage === 'function'
  ) {
    try {
      chrome.runtime.sendMessage(
        extId,
        { type: 'AFG_PAGE_EVWEB_QUEUE_ACTION', action: action },
        function (res) {
          var err = chrome.runtime.lastError && chrome.runtime.lastError.message;
          if (err) {
            try {
              localStorage.removeItem('afg_ext_id');
              window.__AFG_EXT_ID = '';
            } catch (eClr) {}
            viaPostMessage();
            return;
          }
          try {
            window.postMessage(
              {
                source: 'AFG_EXT',
                type: 'QUEUE_ACTION_ACK',
                action: action,
                result: res || null,
                error: null,
                via: 'external'
              },
              '*'
            );
          } catch (eAck) {}
          if (res && res.ok === false && typeof toast === 'function') {
            toast('Cola evweb: ' + (res.message || res.error || 'error'));
          }
          if (typeof afRenderEvwebQueueHub === 'function') afRenderEvwebQueueHub();
        }
      );
      toastStarting();
      return;
    } catch (eSend) {
      viaPostMessage();
      toastStarting();
      return;
    }
  }

  viaPostMessage();
  toastStarting();
}

function afEvwebQueueStartUi(ev){
  if (ev && ev.preventDefault) ev.preventDefault();
  if (ev && ev.stopPropagation) ev.stopPropagation();
  var n = afEvwebQueuePendingCount();
  if (!n) {
    if (typeof toast === 'function') toast('Cola evweb vacía — primero Agregar a cola');
    try { console.warn('[AF evweb] StartUi: cola vacía'); } catch (e0) {}
    return false;
  }
  try {
    afEvwebQueuePublish(afEvwebQueueLoad());
  } catch (ePub) {}
  try {
    console.log('[AF evweb] StartUi → EVWEB_QUEUE_START', {
      pending: n,
      extId: afEvwebExtId() || '(postMessage)',
      last: (afEvwebQueueLoad().lastEnqueuedId || null)
    });
  } catch (eL) {}
  afEvwebQueueRequestExtAction('EVWEB_QUEUE_START');
  // false = cancelar submit del <button> onclick; el pedido a la extensión ya salió
  return false;
}

/** ¿Hay al menos un slot con data URL? */
function afEvwebDocsHaveData(docs){
  docs = docs || {};
  return ['anest', 'qx', 'auth'].some(function (k) {
    return !!(docs[k] && docs[k].data);
  });
}

/**
 * Docs para un ítem de cola: primero snapshot de afg_evweb_queue;
 * si falta data (IDB / cuota), hidrata desde S.intervs / S.cur.
 * Usado por la extensión al fill (no depende de chrome.storage con PDFs).
 */
function afEvwebResolveDocsForIntervId(intervId){
  var id = String(intervId || '').trim();
  if (!id) {
    return Promise.resolve({ ok: false, error: 'missing_intervId', docs: {}, keys: [] });
  }

  function keysOf(docs){
    docs = docs || {};
    return ['anest', 'qx', 'auth'].filter(function (k) {
      return !!(docs[k] && docs[k].data);
    });
  }

  function fromQueueItem(){
    try {
      var q = afEvwebQueueLoad();
      var it = (q.items || []).find(function (x) { return x && String(x.id) === id; });
      if (it && afEvwebDocsHaveData(it.docs)) {
        return { docs: it.docs, via: 'queue_ls' };
      }
    } catch (eQ) {}
    return null;
  }

  function findInterv(){
    try {
      if (S && S.cur && String(S.cur.id) === id) return S.cur;
    } catch (eC) {}
    try {
      var list = (S && S.intervs) || [];
      for (var i = 0; i < list.length; i++) {
        if (list[i] && String(list[i].id) === id) return list[i];
      }
    } catch (eL) {}
    return null;
  }

  var hitQ = fromQueueItem();
  if (hitQ) {
    return Promise.resolve({
      ok: true,
      docs: afeSnapshotDocs(hitQ.docs),
      keys: keysOf(afeSnapshotDocs(hitQ.docs)),
      via: hitQ.via
    });
  }

  var interv = findInterv();
  if (!interv) {
    return Promise.resolve({ ok: false, error: 'interv_not_found', docs: {}, keys: [], via: 'none' });
  }

  var hydrate = (typeof afDocsHydrateIntervsForSync === 'function')
    ? afDocsHydrateIntervsForSync([interv])
    : Promise.resolve([interv]);

  return hydrate.then(function (list) {
    var full = (list && list[0]) || interv;
    var snap = afeSnapshotDocs(full.docs);
    var keys = keysOf(snap);
    return {
      ok: keys.length > 0,
      docs: snap,
      keys: keys,
      via: 'interv_hydrate',
      error: keys.length ? null : 'no_docs_data'
    };
  }).catch(function (e) {
    return {
      ok: false,
      error: String(e && e.message || e),
      docs: {},
      keys: [],
      via: 'hydrate_fail'
    };
  });
}

// Extensión → page: FETCH_EVWEB_DOCS (PDFs al momento del fill)
try {
  window.addEventListener('message', function (ev) {
    if (ev.source !== window) return;
    var d = ev.data;
    if (!d || d.source !== 'AFG_EXT' || d.type !== 'FETCH_EVWEB_DOCS') return;
    var requestId = d.requestId;
    afEvwebResolveDocsForIntervId(d.intervId).then(function (r) {
      try {
        window.postMessage({
          source: 'AFG_ANESFACT',
          type: 'FETCH_EVWEB_DOCS_RESULT',
          requestId: requestId,
          ok: !!(r && r.ok),
          docs: (r && r.docs) || {},
          keys: (r && r.keys) || [],
          via: (r && r.via) || null,
          error: (r && r.error) || null
        }, '*');
      } catch (ePost) {}
    });
  });
} catch (eListen) {}
