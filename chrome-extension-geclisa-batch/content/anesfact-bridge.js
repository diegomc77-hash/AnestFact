/**
 * Bridge AnesFact (page world) → extensión.
 *
 * El popup NO lee localStorage de AnesFact (otro contexto/origen).
 * Este content script sí puede (mismo origen de la pestaña) y copia a chrome.storage.*.
 *
 * Bug que había: si chrome.storage.session.set fallaba, lastSig ya quedaba seteado
 * y nunca reintentaba escribir chrome.storage.local → popup vacío.
 */
(function () {
  var lastOkSig = '';

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

  function publish(detail, via) {
    var foja = normalize(detail);
    if (!foja) return Promise.resolve({ ok: false, error: 'normalize_null' });
    var sig = foja.token + '|' + (foja.updatedAt || '');
    // Solo saltear si YA se escribió OK esta misma foja
    if (sig === lastOkSig) return Promise.resolve({ ok: true, skipped: true });

    var payload = {
      afg_current_foja: foja,
      afg_geclisa_token: foja.token,
      afg_bridge_meta: {
        via: via || '?',
        href: location.href,
        at: Date.now()
      }
    };

    // local PRIMERO (más compatible desde content script); session best-effort
    return storageSet('local', payload).then(function (rLocal) {
      return storageSet('session', payload).then(function (rSess) {
        if (rLocal.ok || rSess.ok) lastOkSig = sig;
        try {
          console.log(
            '[AFG bridge] storage via=' + (via || '?'),
            foja.apellido,
            foja.nombre,
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

  // Inmediato + poll (localStorage sí es del origen AnesFact)
  function tick() {
    var p = readLocalStorageBatch();
    if (p) publish(p, 'localStorage');
  }
  tick();
  setInterval(tick, 600);

  try {
    window.postMessage({ source: 'AFG_EXT', type: 'BRIDGE_ALIVE', version: '0.4.3' }, '*');
  } catch (e) {}
  try {
    console.log('[AFG bridge] inyectado en', location.href);
  } catch (e2) {}
})();
