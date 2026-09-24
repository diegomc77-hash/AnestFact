/**
 * Adjuntos foja fuera de localStorage → IndexedDB (cuota mucho mayor).
 * En localStorage solo queda metadata (+ alias). Memoria: _afDocMemCache.
 *
 * Esquema: DB `anesfact_docs_v1`, store `blobs`, keyPath `key`.
 * VER=2: si otra pestaña/extensión abrió la DB en v1 sin onupgradeneeded
 * (DB vacía sin stores), open(1) no dispara upgrade. Bumpeamos a 2 y
 * recreamos el store faltante; si sigue roto, deleteDatabase + reopen.
 */
var AF_DOCS_IDB_NAME = 'anesfact_docs_v1';
var AF_DOCS_IDB_STORE = 'blobs';
var AF_DOCS_IDB_VER = 2;
var _afDocIdbDb = null;
var _afDocIdbOpenPromise = null;
var _afDocMemCache = {};

function afDocIdbKey(intervId, tipo) {
  return String(intervId || '') + '::' + String(tipo || '');
}

function afDocIdbCloseCached() {
  if (_afDocIdbDb) {
    try {
      _afDocIdbDb.close();
    } catch (eC) {}
    _afDocIdbDb = null;
  }
  _afDocIdbOpenPromise = null;
}

function afDocIdbHasStore(db) {
  try {
    return !!(db && db.objectStoreNames && db.objectStoreNames.contains(AF_DOCS_IDB_STORE));
  } catch (e) {
    return false;
  }
}

function afDocIdbDeleteDatabase() {
  afDocIdbCloseCached();
  if (typeof indexedDB === 'undefined') return Promise.resolve(false);
  return new Promise(function (resolve) {
    var req = indexedDB.deleteDatabase(AF_DOCS_IDB_NAME);
    var done = false;
    function finish(ok) {
      if (done) return;
      done = true;
      resolve(!!ok);
    }
    req.onsuccess = function () {
      finish(true);
    };
    req.onerror = function () {
      finish(false);
    };
    req.onblocked = function () {
      try {
        console.warn('[AF docs-idb] deleteDatabase blocked — cerrá otras pestañas AnesFact');
      } catch (eW) {}
      // Seguir: a veces igual termina; si no, el reopen fallará y se reintenta.
      setTimeout(function () {
        finish(false);
      }, 800);
    };
  });
}

function afDocIdbOpenRaw() {
  return new Promise(function (resolve, reject) {
    var req = indexedDB.open(AF_DOCS_IDB_NAME, AF_DOCS_IDB_VER);
    req.onupgradeneeded = function () {
      var db = req.result;
      try {
        if (!db.objectStoreNames.contains(AF_DOCS_IDB_STORE)) {
          db.createObjectStore(AF_DOCS_IDB_STORE, { keyPath: 'key' });
        }
      } catch (eUp) {
        reject(eUp || new Error('idb_upgrade'));
      }
    };
    req.onsuccess = function () {
      resolve(req.result);
    };
    req.onerror = function () {
      reject(req.error || new Error('idb_open'));
    };
    req.onblocked = function () {
      try {
        console.warn('[AF docs-idb] open blocked');
      } catch (eB) {}
    };
  });
}

/**
 * Abre la DB asegurando el store `blobs`. Si hay esquema roto (v1 vacía),
 * borra y recrea. No toca Supabase ni localStorage.
 */
function afDocIdbOpen(opt) {
  var allowRecreate = !(opt && opt.allowRecreate === false);
  if (_afDocIdbDb && afDocIdbHasStore(_afDocIdbDb)) {
    return Promise.resolve(_afDocIdbDb);
  }
  if (_afDocIdbDb) afDocIdbCloseCached();
  if (_afDocIdbOpenPromise) return _afDocIdbOpenPromise;

  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('no_indexeddb'));
  }

  _afDocIdbOpenPromise = afDocIdbOpenRaw()
    .then(function (db) {
      if (afDocIdbHasStore(db)) {
        _afDocIdbDb = db;
        try {
          db.onversionchange = function () {
            afDocIdbCloseCached();
          };
        } catch (eV) {}
        return db;
      }
      try {
        db.close();
      } catch (eCl) {}
      if (!allowRecreate) {
        throw new Error('idb_missing_store');
      }
      try {
        console.warn('[AF docs-idb] store faltante — recreando DB local');
      } catch (eL) {}
      return afDocIdbDeleteDatabase().then(function () {
        return afDocIdbOpenRaw().then(function (db2) {
          if (!afDocIdbHasStore(db2)) {
            try {
              db2.close();
            } catch (e2) {}
            throw new Error('idb_recreate_failed');
          }
          _afDocIdbDb = db2;
          try {
            db2.onversionchange = function () {
              afDocIdbCloseCached();
            };
          } catch (eV2) {}
          return db2;
        });
      });
    })
    .then(
      function (db) {
        _afDocIdbOpenPromise = null;
        return db;
      },
      function (err) {
        _afDocIdbOpenPromise = null;
        afDocIdbCloseCached();
        throw err;
      }
    );

  return _afDocIdbOpenPromise;
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
  if (doc.storage && doc.storagePath) {
    meta.storage = true;
    meta.storagePath = doc.storagePath;
  }
  return meta;
}

function afDocIdbIsMissingStoreError(e) {
  if (!e) return false;
  var name = e.name || '';
  var msg = String(e.message || e);
  return name === 'NotFoundError' || /object store|not found/i.test(msg);
}

function afDocIdbPutOnce(db, intervId, tipo, doc, key) {
  return new Promise(function (resolve, reject) {
    var tx = db.transaction(AF_DOCS_IDB_STORE, 'readwrite');
    tx.oncomplete = function () {
      resolve(true);
    };
    tx.onerror = function () {
      reject(tx.error || new Error('idb_put'));
    };
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
}

function afDocIdbPut(intervId, tipo, doc) {
  if (!doc || !doc.data) return Promise.resolve(false);
  var key = afDocIdbKey(intervId, tipo);
  afDocMemSet(intervId, tipo, doc);
  return afDocIdbOpen()
    .then(function (db) {
      return afDocIdbPutOnce(db, intervId, tipo, doc, key);
    })
    .catch(function (e) {
      if (!afDocIdbIsMissingStoreError(e)) {
        try {
          console.warn('[AF docs-idb] put fail', e);
        } catch (eL) {}
        return false;
      }
      try {
        console.warn('[AF docs-idb] put NotFoundError — reset IDB y reintento');
      } catch (eL2) {}
      afDocIdbCloseCached();
      return afDocIdbDeleteDatabase()
        .then(function () {
          return afDocIdbOpen();
        })
        .then(function (db2) {
          return afDocIdbPutOnce(db2, intervId, tipo, doc, key);
        })
        .catch(function (e2) {
          try {
            console.warn('[AF docs-idb] put fail after reset', e2);
          } catch (eL3) {}
          if (typeof afNotifyIdbSchemaError === 'function') afNotifyIdbSchemaError();
          return false;
        });
    });
}

function afDocIdbGet(intervId, tipo) {
  var mem = afDocMemGet(intervId, tipo);
  if (mem && mem.data) return Promise.resolve(mem);
  return afDocIdbOpen()
    .then(function (db) {
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
        req.onerror = function () {
          reject(req.error || new Error('idb_get'));
        };
      });
    })
    .catch(function () {
      return null;
    });
}

function afDocIdbDelete(intervId, tipo) {
  afDocMemClear(intervId, tipo);
  return afDocIdbOpen()
    .then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction(AF_DOCS_IDB_STORE, 'readwrite');
        tx.oncomplete = function () {
          resolve(true);
        };
        tx.onerror = function () {
          resolve(false);
        };
        tx.objectStore(AF_DOCS_IDB_STORE).delete(afDocIdbKey(intervId, tipo));
      });
    })
    .catch(function () {
      return false;
    });
}

/** ¿doc.data es un data-URL completo (no pasó por IDB/Storage)? */
function afDocsIsInlineDataUrl(d) {
  return !!(d && typeof d.data === 'string' && d.data.indexOf('data:') === 0);
}

/**
 * Diagnóstico: fojas con docs[slot].data aún embebido (payload sync hinchado).
 * No muda datos. Seguro para consola: no incluye el blob ni nombres reales largos.
 */
function afDocsAuditInlineData(list) {
  var report = {
    fojas: 0,
    inlineCount: 0,
    inline: [],
    totalChars: 0,
    metaIdb: 0,
    metaStorage: 0,
    alias: 0
  };
  (list || []).forEach(function (it) {
    if (!it || !it.docs) return;
    report.fojas++;
    Object.keys(it.docs).forEach(function (slot) {
      var d = it.docs[slot];
      if (!d) return;
      if (d.aliasOf && !d.data) {
        report.alias++;
        return;
      }
      if (afDocsIsInlineDataUrl(d)) {
        report.inlineCount++;
        report.totalChars += d.data.length;
        report.inline.push({
          id: String(it.id),
          slot: slot,
          chars: d.data.length,
          kb: Math.round(d.data.length / 1024),
          fuente: d.fuente || '',
          nombre: (d.nombre || '').slice(0, 40)
        });
      } else if (d.idb) report.metaIdb++;
      else if (d.storage) report.metaStorage++;
    });
  });
  report.totalKB = Math.round(report.totalChars / 1024);
  report.totalMB = Math.round((report.totalChars / 1048576) * 100) / 100;
  return report;
}

/**
 * Copia para anesfact_datos: sin data-URL. Deja meta idb/storage/alias
 * (mismo criterio que afCommitAdjunto tras afDocIdbPut).
 */
function afDocsStripDataForCloudSync(list) {
  return (list || []).map(function (it) {
    if (!it || !it.docs) return it;
    var copy = Object.assign({}, it, { docs: {} });
    Object.keys(it.docs).forEach(function (slot) {
      var d = it.docs[slot];
      if (!d) return;
      if (d.aliasOf && !d.data) {
        copy.docs[slot] = { aliasOf: d.aliasOf, fuente: d.fuente };
        return;
      }
      if (d.data) {
        copy.docs[slot] = afDocMetaFromFull(d);
        return;
      }
      copy.docs[slot] = d;
    });
    return copy;
  });
}

/** Mueve data URLs de una foja a IDB; deja metadata en el objeto. */
function afDocsDetachIntervToIdb(it) {
  if (!it || !it.id || !it.docs) return Promise.resolve(it);
  var id = String(it.id);
  var slots = Object.keys(it.docs);
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
  return chain.then(function () {
    return it;
  });
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

/** Para sync push / colas: clona intervs con data rehidratada desde IDB/mem (sigue trayendo data). */
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
            size: full.size,
            storage: it.docs[tipo].storage || full.storage,
            storagePath: it.docs[tipo].storagePath || full.storagePath
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

var _afRepararMemoriaBusy = false;
var _afMemoriaToastAt = 0;

function afStripLocalDocQueues() {
  ['afg_evweb_queue', 'afg_geclisa_queue'].forEach(function (qk) {
    try {
      var q = JSON.parse(localStorage.getItem(qk) || 'null');
      if (!q || !q.items) return;
      var changed = false;
      q.items.forEach(function (it) {
        if (!it || !it.docs) return;
        Object.keys(it.docs).forEach(function (t) {
          if (it.docs[t] && it.docs[t].data) {
            delete it.docs[t].data;
            it.docs[t].strippedLocal = true;
            changed = true;
          }
        });
      });
      if (changed) localStorage.setItem(qk, JSON.stringify(q));
    } catch (eQ) {}
  });
}

/**
 * Reparación local (misma lógica que el script de consola):
 * borra IDB docs rota → migra adjuntos a IDB → strip colas → save LS.
 * No toca Supabase. Toast OK / «seguí lleno, avisá a Diego».
 */
function afRepararMemoriaLocal(opts) {
  opts = opts || {};
  if (_afRepararMemoriaBusy) {
    return Promise.resolve({ ok: false, error: 'busy' });
  }
  _afRepararMemoriaBusy = true;
  var btn = document.getElementById('cfg-reparar-memoria-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Reparando…';
  }

  function finish(report) {
    _afRepararMemoriaBusy = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Reparar memoria';
    }
    if (!opts.silent && typeof toast === 'function') {
      if (report && report.ok) {
        toast('Memoria reparada \u2713 \u2014 prob\u00e1 Guardar');
      } else if (report && report.error === 'busy') {
        toast('Ya hay una reparaci\u00f3n en curso');
      } else {
        toast('Sigue lleno \u2014 avis\u00e1 a Diego');
      }
    }
    try {
      console.log('[AF] afRepararMemoriaLocal', report);
    } catch (eL) {}
    return report;
  }

  var del =
    typeof afDocIdbDeleteDatabase === 'function'
      ? afDocIdbDeleteDatabase()
      : Promise.resolve(false);

  return del
    .then(function () {
      if (typeof afDocsDetachListToIdb === 'function') {
        return afDocsDetachListToIdb(
          typeof S !== 'undefined' && S.intervs ? S.intervs : []
        );
      }
      return typeof S !== 'undefined' ? S.intervs || [] : [];
    })
    .then(function (list) {
      if (typeof S !== 'undefined') S.intervs = list || S.intervs;
      afStripLocalDocQueues();
      try {
        sessionStorage.removeItem('AF_EMERGENCY_NO_SYNC');
      } catch (eS) {}
      try {
        if (typeof saveIntervsToStorage === 'function') saveIntervsToStorage();
        var len = 0;
        try {
          if (typeof afIntervsKey === 'function') {
            len = (localStorage.getItem(afIntervsKey()) || '').length;
          }
        } catch (eLen) {}
        if (typeof renderHome === 'function') {
          try {
            renderHome();
          } catch (eR) {}
        }
        return finish({ ok: true, lsChars: len });
      } catch (eSave) {
        return finish({
          ok: false,
          error: 'quota',
          detail: String((eSave && eSave.message) || eSave)
        });
      }
    })
    .catch(function (e) {
      return finish({
        ok: false,
        error: 'fail',
        detail: String((e && e.message) || e)
      });
    });
}

/** Toast con botón «Reparar memoria» (celular / sin consola). */
function afToastMemoriaError(msg) {
  var now = Date.now();
  if (now - _afMemoriaToastAt < 2500) return;
  _afMemoriaToastAt = now;
  if (typeof toast !== 'function') return;
  toast(msg || 'Problema de memoria local', {
    actionLabel: 'Reparar memoria',
    onAction: function () {
      afRepararMemoriaLocal();
    },
    ms: 12000
  });
}

function afNotifyIdbSchemaError() {
  afToastMemoriaError(
    'Archivos locales da\u00f1ados \u2014 toc\u00e1 Reparar memoria'
  );
}
