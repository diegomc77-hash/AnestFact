/**
 * Bridge AnesFact (page world) → extensión.
 *
 * El page script NO comparte variables con este content script (isolated world).
 * Por eso leemos:
 *  - localStorage['afg_pending_batch']  (compartido por origen)
 *  - window.postMessage { source:'AFG_ANESFACT' }
 *  - CustomEvent 'afg-geclisa-token' (DOM compartido)
 */
(function () {
  var lastSig = '';

  function normalize(detail) {
    if (!detail || !detail.token) return null;
    var foja = {
      token: String(detail.token),
      apellido: String(detail.apellido || '').trim(),
      nombre: String(detail.nombre || '').trim(),
      dni: String(detail.dni || '').trim(),
      fechaCirugia: detail.fechaCirugia || '',
      horaInicio: detail.horaInicio || detail.hora || '',
      horaFin: detail.horaFin || '',
      pac: detail.pac || '',
      clave: detail.clave || '',
      updatedAt: detail.updatedAt || Date.now()
    };
    if (foja.apellido && !foja.nombre && /\s/.test(foja.apellido)) {
      var parts = foja.apellido.split(/\s+/);
      foja.apellido = parts[0];
      foja.nombre = parts.slice(1).join(' ');
    }
    return foja;
  }

  function publish(detail, via) {
    var foja = normalize(detail);
    if (!foja) return;
    var sig = foja.token + '|' + (foja.updatedAt || '');
    if (sig === lastSig) return;
    lastSig = sig;

    var payload = {
      afg_current_foja: foja,
      afg_geclisa_token: foja.token,
      afg_bridge_meta: {
        via: via || '?',
        href: location.href,
        at: Date.now()
      }
    };

    // session (cola viva) + local (por si session no está disponible)
    chrome.storage.session.set(payload, function () {
      var errS = chrome.runtime.lastError && chrome.runtime.lastError.message;
      chrome.storage.local.set(payload, function () {
        var errL = chrome.runtime.lastError && chrome.runtime.lastError.message;
        try {
          console.log(
            '[AFG bridge] storage OK via=' + (via || '?'),
            foja.apellido,
            foja.nombre,
            'tokenLen',
            foja.token.length,
            errS ? ('sessionErr=' + errS) : '',
            errL ? ('localErr=' + errL) : ''
          );
        } catch (e) {}
      });
    });

    chrome.runtime.sendMessage({ type: 'AFG_FOJA_READY', foja: foja }, function () {
      void chrome.runtime.lastError;
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

  window.addEventListener('message', function (ev) {
    if (ev.source !== window) return;
    var d = ev.data;
    if (!d || d.source !== 'AFG_ANESFACT') return;
    if (d.type === 'GECLISA_TOKEN') {
      publish(d.payload, 'postMessage');
    }
    if (d.type === 'OPEN_GECLISA') {
      chrome.runtime.sendMessage({ type: 'AFG_OPEN_GECLISA' }, function (res) {
        void chrome.runtime.lastError;
        try {
          window.postMessage({ source: 'AFG_EXT', type: 'OPEN_ACK', result: res || null }, '*');
        } catch (e) {}
      });
    }
  });

  window.addEventListener('afg-geclisa-token', function (ev) {
    publish(ev && ev.detail, 'CustomEvent');
  });

  // Poll localStorage (sí cruza isolated world). window.__AFG_PENDING_BATCH NO.
  setInterval(function () {
    var p = readLocalStorageBatch();
    if (p) publish(p, 'localStorage');
  }, 600);

  // Anuncio: la página puede saber que el bridge está vivo
  try {
    window.postMessage({ source: 'AFG_EXT', type: 'BRIDGE_ALIVE', version: '0.4.2' }, '*');
  } catch (e) {}
  try {
    console.log('[AFG bridge] inyectado en', location.href);
  } catch (e2) {}
})();
