/**
 * Adjuntos foja fuera de localStorage → IndexedDB (cuota mucho mayor).
 * En localStorage solo queda metadata (+ alias). Memoria: _afDocMemCache.
 */
var AF_DOCS_IDB_NAME = 'anesfact_docs_v1';
var AF_DOCS_IDB_STORE = 'blobs';
var _afDocIdbDb = null;
var _afDocMemCache = {};

function afDocIdbKey(intervId, tipo) {
  return String(intervId || '') + '::' + String(tipo || '');
}

function afDocIdbOpen() {
  if (_afDocIdbDb) return Promise.resolve(_afDocIdbDb);
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('no_indexeddb'));
  }
  return new Promise(function (resolve, reject) {
    var req = indexedDB.open(AF_DOCS_IDB_NAME, 1);
    req.onupgradeneeded = function () {
      var db = req.result;
      if (!db.objectStoreNames.contains(AF_DOCS_IDB_STORE)) {
        db.createObjectStore(AF_DOCS_IDB_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = function () {
      _afDocIdbDb = req.result;
      resolve(_afDocIdbDb);
    };
    req.onerror = function () {
      reject(req.error || new Error('idb_open'));
    };
  });
}

function afDocMemSet(intervId, tipo, doc) {
  if (!doc || !doc.data) return;
  _afDocMemCache[afDocIdbKey(intervId, tipo)] = {
    nombre: doc.nombre,
    tipo: doc.tipo,
    data: doc.data,
    fecha: doc.fecha,
    fuente: doc.fuente,
    size: doc.size
  };
}

function afDocMemGet(intervId, tipo) {
  return _afDocMemCache[afDocIdbKey(intervId, tipo)] || null;
}

function afDocMemClear(intervId, tipo) {
  delete _afDocMemCache[afDocIdbKey(intervId, tipo)];
}

function afDocMetaFromFull(doc) {
  if (!doc) return null;
  if (doc.aliasOf && !doc.data) {
    return { aliasOf: doc.aliasOf, fuente: doc.fuente || 'geclisa_p1b' };
  }
  var meta = {
    nombre: doc.nombre || 'documento',
    tipo: doc.tipo || 'application/octet-stream',
    fecha: doc.fecha || new Date().toISOString(),
    idb: true
  };
  if (doc.fuente) meta.fuente = doc.fuente;
  if (doc.size != null) meta.size = doc.size;
  else if (doc.data) meta.size = String(doc.data).length;
  return meta;
}

function afDocIdbPut(intervId, tipo, doc) {
  if (!doc || !doc.data) return Promise.resolve(false);
  var key = afDocIdbKey(intervId, tipo);
  afDocMemSet(intervId, tipo, doc);
  return afDocIdbOpen().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(AF_DOCS_IDB_STORE, 'readwrite');
      tx.oncomplete = function () { resolve(true); };
      tx.onerror = function () { reject(tx.error || new Error('idb_put')); };
      tx.objectStore(AF_DOCS_IDB_STORE).put({
        key: key,
        intervId: String(intervId),
        slot: String(tipo),
        nombre: doc.nombre || 'documento',
        tipo: doc.tipo || 'application/octet-stream',
        data: doc.data,
        fecha: doc.fecha || '',
        fuente: doc.fuente || '',
        size: doc.size != null ? doc.size : String(doc.data).length
      });
    });
  }).catch(function (e) {
    try { console.warn('[AF docs-idb] put fail', e); } catch (eL) {}
    return false;
  });
}

function afDocIdbGet(intervId, tipo) {
  var mem = afDocMemGet(intervId, tipo);
  if (mem && mem.data) return Promise.resolve(mem);
  return afDocIdbOpen().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(AF_DOCS_IDB_STORE, 'readonly');
      var req = tx.objectStore(AF_DOCS_IDB_STORE).get(afDocIdbKey(intervId, tipo));
      req.onsuccess = function () {
        var row = req.result;
        if (!row || !row.data) {
          resolve(null);
          return;
        }
        var doc = {
          nombre: row.nombre,
          tipo: row.tipo,
          data: row.data,
          fecha: row.fecha,
          fuente: row.fuente,
          size: row.size
        };
        afDocMemSet(intervId, tipo, doc);
        resolve(doc);
      };
      req.onerror = function () { reject(req.error || new Error('idb_get')); };
    });
  }).catch(function () { return null; });
}

function afDocIdbDelete(intervId, tipo) {
  afDocMemClear(intervId, tipo);
  return afDocIdbOpen().then(function (db) {
    return new Promise(function (resolve) {
      var tx = db.transaction(AF_DOCS_IDB_STORE, 'readwrite');
      tx.oncomplete = function () { resolve(true); };
      tx.onerror = function () { resolve(false); };
      tx.objectStore(AF_DOCS_IDB_STORE).delete(afDocIdbKey(intervId, tipo));
    });
  }).catch(function () { return false; });
}

/** Mueve data URLs de una foja a IDB; deja metadata en el objeto. */
function afDocsDetachIntervToIdb(it) {
  if (!it || !it.id || !it.docs) return Promise.resolve(it);
  var id = String(it.id);
  var slots = ['anest', 'qx', 'auth'];
  var chain = Promise.resolve();
  slots.forEach(function (tipo) {
    chain = chain.then(function () {
      var d = it.docs[tipo];
      if (!d || !d.data) return;
      return afDocIdbPut(id, tipo, d).then(function (ok) {
        if (ok) it.docs[tipo] = afDocMetaFromFull(d);
      });
    });
  });
  return chain.then(function () { return it; });
}

function afDocsDetachListToIdb(list) {
  var arr = list || [];
  var i = 0;
  function next() {
    if (i >= arr.length) return Promise.resolve(arr);
    var it = arr[i++];
    return afDocsDetachIntervToIdb(it).then(next);
  }
  return next();
}

/** Precarga cache memoria para badges / sync. */
function afDocsWarmCacheForList(list) {
  var jobs = [];
  (list || []).forEach(function (it) {
    if (!it || !it.id || !it.docs) return;
    ['anest', 'qx', 'auth'].forEach(function (tipo) {
      var d = it.docs[tipo];
      if (d && d.idb && !d.data && !d.aliasOf) {
        jobs.push(afDocIdbGet(it.id, tipo));
      }
    });
  });
  return Promise.all(jobs);
}

function afDocsResolveWithCache(docs, tipo, intervId) {
  var d = docs && docs[tipo];
  if (!d) return null;
  if (d.aliasOf) {
    var src = afDocsResolveWithCache(docs, d.aliasOf, intervId);
    if (!src || !src.data) return d;
    return {
      nombre: src.nombre,
      tipo: src.tipo,
      data: src.data,
      fecha: src.fecha,
      fuente: d.fuente || src.fuente,
      size: src.size,
      aliasOf: d.aliasOf
    };
  }
  if (d.data) return d;
  if (d.idb && intervId) {
    var mem = afDocMemGet(intervId, tipo);
    if (mem && mem.data) {
      return {
        nombre: d.nombre || mem.nombre,
        tipo: d.tipo || mem.tipo,
        data: mem.data,
        fecha: d.fecha || mem.fecha,
        fuente: d.fuente || mem.fuente,
        size: d.size || mem.size,
        idb: true
      };
    }
  }
  return d;
}

/** Para sync push: clona intervs con data rehidratada desde IDB/mem. */
function afDocsHydrateIntervsForSync(intervs) {
  var list = intervs || [];
  return afDocsWarmCacheForList(list).then(function () {
    return list.map(function (it) {
      if (!it || !it.docs) return it;
      var copy = Object.assign({}, it, { docs: {} });
      ['anest', 'qx', 'auth'].forEach(function (tipo) {
        if (!it.docs[tipo]) return;
        var full = afDocsResolveWithCache(it.docs, tipo, it.id);
        if (full && full.data) {
          copy.docs[tipo] = {
            nombre: full.nombre,
            tipo: full.tipo,
            data: full.data,
            fecha: full.fecha,
            fuente: full.fuente,
            size: full.size
          };
        } else if (it.docs[tipo].aliasOf) {
          copy.docs[tipo] = {
            aliasOf: it.docs[tipo].aliasOf,
            fuente: it.docs[tipo].fuente
          };
        } else if (it.docs[tipo]) {
          copy.docs[tipo] = it.docs[tipo];
        }
      });
      return copy;
    });
  });
}

function afEmergencyNoSync() {
  try {
    return sessionStorage.getItem('AF_EMERGENCY_NO_SYNC') === '1';
  } catch (e) {
    return false;
  }
}
