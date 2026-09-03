/**
 * Bridge AnesFact (page world) ↔ extensión.
 *
 * - Copia afg_pending_batch / cola afg_geclisa_queue → chrome.storage
 * - Relay mint on-demand: AFG_MINT_TOKEN_FOR_FOJA → postMessage MINT_TOKEN → page RPC
 */
(function () {
  if (window.__AFG_ANESFACT_BRIDGE__) return;
  window.__AFG_ANESFACT_BRIDGE__ = true;

  var lastOkSig = '';
  var lastQueueSig = '';
  var pendingMints = {};
  var BRIDGE_VERSION = '0.5.14';

  function normalize(detail) {
    if (!detail || !detail.token) return null;
    var foja = {
      token: String(detail.token),
      intervId: detail.intervId ? String(detail.intervId) : '',
      apellido: String(detail.apellido || '').trim(),
      nombre: String(detail.nombre || '').trim(),
      dni: String(detail.dni || '').trim(),
      fechaCirugia: detail.fechaCirugia || '',
      horaInicio: detail.horaInicio || detail.hora || '',
      horaFin: detail.horaFin || '',
      sector: String(detail.sector || detail.mayo_sector || '').trim(),
      mayo_cama: detail.mayo_cama || '',
      pac: detail.pac || '',
      clave: detail.clave || '',
      updatedAt: detail.updatedAt || Date.now()
    };
    if (foja.apellido && !foja.nombre && /\s/.test(foja.apellido)) {
      var parts = foja.apellido.split(/\s+/);
      foja.apellido = parts[0];
      foja.nombre = parts.slice(1).join(' ');
    }
    if (foja.pac) {
      var pac = String(foja.pac).trim();
      var fromPac;
      if (pac.indexOf(',') >= 0) {
        var cp = pac.split(',');
        fromPac = {
          apellido: (cp[0] || '').trim(),
          nombre: cp.slice(1).join(' ').replace(/\s+/g, ' ').trim()
        };
      } else {
        var w = pac.split(/\s+/).filter(Boolean);
        fromPac = { apellido: w[0] || '', nombre: w.slice(1).join(' ') };
      }
      if (fromPac.nombre) {
        var cur = (foja.nombre || '').toLowerCase();
        var richer = fromPac.nombre.toLowerCase();
        if (!cur || (richer.indexOf(cur) === 0 && (richer.length === cur.length || richer.charAt(cur.length) === ' '))) {
          foja.nombre = fromPac.nombre;
        }
        if (!foja.apellido && fromPac.apellido) foja.apellido = fromPac.apellido;
      }
    }
    return foja;
  }

  function storageSet(area, payload) {
    return new Promise(function (resolve) {
      try {
        if (!chrome.storage || !chrome.storage[area]) {
          resolve({ ok: false, error: 'no_' + area });
          return;
        }
        chrome.storage[area].set(payload, function () {
          var err = chrome.runtime.lastError && chrome.runtime.lastError.message;
          resolve({ ok: !err, error: err || null });
        });
      } catch (e) {
        resolve({ ok: false, error: String(e && e.message || e) });
      }
    });
  }

  function publishFoja(detail, via) {
    var foja = normalize(detail);
    if (!foja) return Promise.resolve({ ok: false, error: 'normalize_null' });
    var sig = foja.token + '|' + (foja.updatedAt || '') + '|' + (foja.intervId || '');
    if (sig === lastOkSig) return Promise.resolve({ ok: true, skipped: true, foja: foja });

    var payload = {
      afg_current_foja: foja,
      afg_geclisa_token: foja.token,
      afg_bridge_meta: {
        via: via || '?',
        href: location.href,
        at: Date.now()
      }
    };

    return storageSet('local', payload).then(function (rLocal) {
      return storageSet('session', payload).then(function (rSess) {
        if (rLocal.ok || rSess.ok) lastOkSig = sig;
        try {
          console.log(
            '[AFG bridge] foja via=' + (via || '?'),
            foja.apellido,
            foja.nombre,
            'intervId',
            foja.intervId || '—',
            'tokenLen',
            foja.token.length,
            'local=' + (rLocal.ok ? 'ok' : rLocal.error),
            'session=' + (rSess.ok ? 'ok' : rSess.error)
          );
        } catch (e) {}
        try {
          chrome.runtime.sendMessage({ type: 'AFG_FOJA_READY', foja: foja }, function () {
            void chrome.runtime.lastError;
          });
        } catch (e2) {}
        return {
          ok: !!(rLocal.ok || rSess.ok),
          local: rLocal,
          session: rSess,
          foja: foja
        };
      });
    });
  }

  function normalizeQueue(raw) {
    if (!raw || typeof raw !== 'object') return null;
    if (!Array.isArray(raw.items)) return null;
    return {
      version: Number(raw.version) || 1,
      updatedAt: raw.updatedAt || Date.now(),
      items: raw.items
    };
  }

  function publishQueue(raw, via) {
    var queue = normalizeQueue(raw);
    if (!queue) return Promise.resolve({ ok: false, error: 'bad_queue' });
    var sig = String(queue.version) + '|' + String(queue.updatedAt) + '|' + queue.items.length;
    if (sig === lastQueueSig) return Promise.resolve({ ok: true, skipped: true, queue: queue });

    var payload = {
      afg_geclisa_queue: queue,
      afg_queue_meta: { via: via || '?', href: location.href, at: Date.now() }
    };
    return storageSet('local', payload).then(function (rLocal) {
      return storageSet('session', payload).then(function (rSess) {
        if (rLocal.ok || rSess.ok) lastQueueSig = sig;
        try {
          console.log(
            '[AFG bridge] queue via=' + (via || '?'),
            'v' + queue.version,
            'items',
            queue.items.length,
            'local=' + (rLocal.ok ? 'ok' : rLocal.error)
          );
        } catch (e) {}
        return { ok: !!(rLocal.ok || rSess.ok), queue: queue };
      });
    });
  }

  function readLocalStorageBatch() {
    try {
      var raw = localStorage.getItem('afg_pending_batch');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function readLocalStorageQueue() {
    try {
      var raw = localStorage.getItem('afg_geclisa_queue');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function requestMintFromPage(intervId, timeoutMs) {
    return new Promise(function (resolve) {
      var requestId = 'mint_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      var timer = setTimeout(function () {
        delete pendingMints[requestId];
        resolve({ ok: false, error: 'mint_timeout', intervId: intervId });
      }, timeoutMs || 45000);

      pendingMints[requestId] = function (result) {
        clearTimeout(timer);
        delete pendingMints[requestId];
        resolve(result);
      };

      try {
        window.postMessage({
          source: 'AFG_EXT',
          type: 'MINT_TOKEN',
          requestId: requestId,
          intervId: String(intervId || '')
        }, '*');
      } catch (e) {
        clearTimeout(timer);
        delete pendingMints[requestId];
        resolve({ ok: false, error: String(e && e.message || e), intervId: intervId });
      }
    });
  }

  window.addEventListener('message', function (ev) {
    if (ev.source !== window) return;
    var d = ev.data;
    if (!d || d.source !== 'AFG_ANESFACT') return;

    if (d.type === 'GECLISA_TOKEN') {
      publishFoja(d.payload, 'postMessage');
    }
    if (d.type === 'GECLISA_QUEUE') {
      publishQueue(d.queue, 'postMessage');
    }
    if (d.type === 'MINT_TOKEN_RESULT') {
      var cb = pendingMints[d.requestId];
      if (cb) {
        cb({
          ok: !!d.ok,
          foja: d.foja || null,
          error: d.error || null,
          tokenLen: d.tokenLen || 0,
          requestId: d.requestId
        });
      }
      if (d.ok && d.foja) {
        publishFoja(d.foja, 'mint_result');
      }
    }
    if (d.type === 'OPEN_GECLISA') {
      chrome.runtime.sendMessage({ type: 'AFG_OPEN_GECLISA' }, function (res) {
        void chrome.runtime.lastError;
        try {
          window.postMessage({ source: 'AFG_EXT', type: 'OPEN_ACK', result: res || null }, '*');
        } catch (e) {}
      });
    }
    // AnesFact Home → Iniciar / Abortar cola (mismo que el popup)
    if (d.type === 'QUEUE_START' || d.type === 'QUEUE_RETRY' || d.type === 'QUEUE_ABORT' || d.type === 'QUEUE_NEXT') {
      var map = {
        QUEUE_START: 'AFG_QUEUE_START',
        QUEUE_RETRY: 'AFG_QUEUE_RETRY',
        QUEUE_ABORT: 'AFG_QUEUE_ABORT',
        QUEUE_NEXT: 'AFG_QUEUE_NEXT'
      };
      var extType = map[d.type];
      // Asegurar pestaña GECLISA enfocada antes de start/retry
      var kick = function () {
        chrome.runtime.sendMessage({ type: extType }, function (res) {
          var err = chrome.runtime.lastError && chrome.runtime.lastError.message;
          try {
            window.postMessage({
              source: 'AFG_EXT',
              type: 'QUEUE_ACTION_ACK',
              action: d.type,
              result: res || null,
              error: err || null
            }, '*');
          } catch (eAck) {}
        });
      };
      if (d.type === 'QUEUE_START' || d.type === 'QUEUE_RETRY') {
        chrome.runtime.sendMessage({ type: 'AFG_OPEN_GECLISA' }, function () {
          void chrome.runtime.lastError;
          setTimeout(kick, 400);
        });
      } else {
        kick();
      }
    }
  });

  window.addEventListener('afg-geclisa-token', function (ev) {
    publishFoja(ev && ev.detail, 'CustomEvent');
  });
  window.addEventListener('afg-geclisa-queue', function (ev) {
    publishQueue(ev && ev.detail, 'CustomEvent');
  });
  window.addEventListener('afg-geclisa-queue-start', function () {
    try {
      window.postMessage({ source: 'AFG_ANESFACT', type: 'QUEUE_START' }, '*');
    } catch (e) {}
  });
  window.addEventListener('afg-geclisa-queue-abort', function () {
    try {
      window.postMessage({ source: 'AFG_ANESFACT', type: 'QUEUE_ABORT' }, '*');
    } catch (e) {}
  });

  chrome.runtime.onMessage.addListener(function (msg, _sender, sendResponse) {
    if (!msg || !msg.type) return;

    if (msg.type === 'AFG_BRIDGE_PING') {
      sendResponse({
        ok: true,
        href: location.href,
        version: BRIDGE_VERSION,
        hasBatch: !!readLocalStorageBatch(),
        hasQueue: !!readLocalStorageQueue()
      });
      return false;
    }

    if (msg.type === 'AFG_SYNC_QUEUE_NOW') {
      var q = readLocalStorageQueue();
      publishQueue(q, 'sync_now').then(function (r) {
        sendResponse(r);
      });
      return true;
    }

    if (msg.type === 'AFG_MINT_TOKEN_FOR_FOJA') {
      var intervId = msg.intervId || msg.id;
      if (!intervId) {
        sendResponse({ ok: false, error: 'missing_intervId' });
        return false;
      }
      requestMintFromPage(intervId, msg.timeoutMs || 45000).then(function (r) {
        if (r && r.ok && r.foja) {
          publishFoja(r.foja, 'mint_relay').then(function () {
            sendResponse(r);
          });
        } else {
          sendResponse(r || { ok: false, error: 'mint_failed' });
        }
      });
      return true;
    }

    if (msg.type === 'AFG_QUEUE_SET_ITEM_STATUS') {
      try {
        window.postMessage({
          source: 'AFG_EXT',
          type: 'QUEUE_ITEM_STATUS',
          intervId: String(msg.intervId || msg.id || ''),
          status: msg.status || '',
          message: msg.message || ''
        }, '*');
      } catch (ePost) {}
      // La página persiste; re-leer y copiar a chrome.storage
      setTimeout(function () {
        publishQueue(readLocalStorageQueue(), 'status_patch');
      }, 120);
      sendResponse({ ok: true });
      return false;
    }

    if (msg.type === 'AFG_MARK_ENVIADO_GECLISA') {
      try {
        window.postMessage({
          source: 'AFG_EXT',
          type: 'MARK_ENVIADO_GECLISA',
          intervId: String(msg.intervId || msg.id || ''),
          at: msg.at || new Date().toISOString(),
          via: msg.via || 'extension'
        }, '*');
      } catch (eMark) {}
      // La página responde vía CustomEvent; polling breve del resultado en window
      var started = Date.now();
      var check = function () {
        var r = window.__AFG_LAST_MARK_ENVIADO;
        if (r && String(r.intervId) === String(msg.intervId || msg.id || '') && (Date.now() - (r.atMs || 0) < 5000)) {
          sendResponse(r);
          return;
        }
        if (Date.now() - started > 2500) {
          sendResponse({ ok: false, error: 'mark_timeout', intervId: msg.intervId });
          return;
        }
        setTimeout(check, 80);
      };
      setTimeout(check, 60);
      return true;
    }

    if (msg.type === 'AFG_SET_MAYO_NRO_ATENCION') {
      try {
        window.postMessage({
          source: 'AFG_EXT',
          type: 'SET_MAYO_NRO_ATENCION',
          intervId: String(msg.intervId || msg.id || ''),
          nroAtencion: String(msg.nroAtencion || msg.mayo_nro_atencion || ''),
          via: msg.via || 'extension'
        }, '*');
      } catch (eNro) {}
      var startedNro = Date.now();
      var checkNro = function () {
        var rN = window.__AFG_LAST_MAYO_NRO;
        if (rN && String(rN.intervId) === String(msg.intervId || msg.id || '') && (Date.now() - (rN.atMs || 0) < 5000)) {
          sendResponse(rN);
          return;
        }
        if (Date.now() - startedNro > 2500) {
          sendResponse({ ok: false, error: 'mayo_nro_timeout', intervId: msg.intervId });
          return;
        }
        setTimeout(checkNro, 80);
      };
      setTimeout(checkNro, 60);
      return true;
    }

    if (msg.type === 'AFG_GET_MAYO_PDF_META') {
      try {
        window.postMessage({
          source: 'AFG_EXT',
          type: 'GET_MAYO_PDF_META',
          intervId: String(msg.intervId || msg.id || '')
        }, '*');
      } catch (eM) {}
      var startedMeta = Date.now();
      var checkMeta = function () {
        var rM = window.__AFG_LAST_PDF_META;
        if (rM && String(rM.intervId) === String(msg.intervId || msg.id || '') && (Date.now() - (rM.atMs || 0) < 5000)) {
          sendResponse(rM);
          return;
        }
        if (Date.now() - startedMeta > 2500) {
          sendResponse({ ok: false, error: 'pdf_meta_timeout', intervId: msg.intervId });
          return;
        }
        setTimeout(checkMeta, 80);
      };
      setTimeout(checkMeta, 60);
      return true;
    }

    if (msg.type === 'AFG_COMMIT_GECLISA_PDF') {
      try {
        window.__AFG_LAST_GECLISA_PDF = null;
        window.postMessage({
          source: 'AFG_EXT',
          type: 'COMMIT_GECLISA_PDF',
          intervId: String(msg.intervId || msg.id || ''),
          base64: msg.base64 || '',
          mime: msg.mime || 'application/pdf',
          size: msg.size || 0,
          nombre: msg.nombre || 'Reporte.pdf',
          toast: msg.toast !== false,
          wide: !!msg.wide,
          dryRun: !!msg.dryRun,
          ciru: msg.ciru || ''
        }, '*');
      } catch (ePdf) {}
      var startedPdf = Date.now();
      var checkPdf = function () {
        var rP = window.__AFG_LAST_GECLISA_PDF;
        if (rP && String(rP.intervId) === String(msg.intervId || msg.id || '') && (Date.now() - (rP.atMs || 0) < 20000)) {
          sendResponse(rP);
          return;
        }
        if (Date.now() - startedPdf > 18000) {
          sendResponse({ ok: false, error: 'pdf_commit_timeout', intervId: msg.intervId });
          return;
        }
        setTimeout(checkPdf, 120);
      };
      setTimeout(checkPdf, 80);
      return true;
    }
  });

  function tick() {
    var p = readLocalStorageBatch();
    if (p) publishFoja(p, 'localStorage');
    var q = readLocalStorageQueue();
    if (q) publishQueue(q, 'localStorage');
  }
  tick();
  setInterval(tick, 800);

  try {
    window.postMessage({ source: 'AFG_EXT', type: 'BRIDGE_ALIVE', version: BRIDGE_VERSION }, '*');
  } catch (e) {}
  try {
    console.log('[AFG bridge]', BRIDGE_VERSION, 'inyectado en', location.href);
  } catch (e2) {}
})();
