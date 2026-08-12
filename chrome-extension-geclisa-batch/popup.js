var out = document.getElementById('out');
function show(x) {
  out.textContent = typeof x === 'string' ? x : JSON.stringify(x, null, 2);
}

function fillFromFoja(foja, source) {
  var st = document.getElementById('foja-status');
  if (!foja || !foja.token) {
    st.textContent = 'Sin foja en cola. En AnesFact: Enviar a GECLISA → después Actualizar (lee storage o portapapeles AFG1|…).';
    return false;
  }
  document.getElementById('apellido').value = foja.apellido || '';
  document.getElementById('nombre').value = foja.nombre || '';
  document.getElementById('token').value = foja.token || '';
  var when = foja.updatedAt ? new Date(foja.updatedAt).toLocaleString() : '—';
  st.textContent = 'Foja (' + (source || '?') + '): ' + (foja.apellido || '?') + ', ' + (foja.nombre || '?') +
    (foja.dni ? (' · DNI ' + foja.dni) : '') +
    (foja.fechaCirugia ? (' · cirugía ' + foja.fechaCirugia) : '') +
    ' · token ' + String(foja.token).length + ' chars · ' + when;
  return true;
}

/** AFG1|apellido|nombre|dni|fecha|token */
function parseClipboardEnvelope(text) {
  text = String(text || '').trim();
  if (!text) return null;
  if (text.indexOf('AFG1|') === 0) {
    var parts = text.split('|');
    if (parts.length < 6) return null;
    return {
      apellido: parts[1] || '',
      nombre: parts[2] || '',
      dni: parts[3] || '',
      fechaCirugia: parts[4] || '',
      token: parts.slice(5).join('|'),
      updatedAt: Date.now()
    };
  }
  // Token crudo (legado): no trae apellido/nombre
  if (text.length >= 32 && text.indexOf('|') < 0 && text.indexOf(' ') < 0) {
    return { token: text, apellido: '', nombre: '', updatedAt: Date.now() };
  }
  return null;
}

function loadFoja(done) {
  chrome.storage.session.get(['afg_current_foja', 'afg_geclisa_token', 'afg_bridge_meta'], function (sess) {
    var foja = sess.afg_current_foja || null;
    if (foja && !foja.token && sess.afg_geclisa_token) foja.token = sess.afg_geclisa_token;
    if (foja && foja.token && foja.apellido) {
      fillFromFoja(foja, 'session' + (sess.afg_bridge_meta && sess.afg_bridge_meta.via ? '/' + sess.afg_bridge_meta.via : ''));
      if (done) done({ ok: true, source: 'session', foja: foja, meta: sess.afg_bridge_meta || null });
      return;
    }
    chrome.storage.local.get(['afg_current_foja', 'afg_geclisa_token', 'afg_bridge_meta'], function (loc) {
      foja = loc.afg_current_foja || null;
      if (foja && !foja.token && loc.afg_geclisa_token) foja.token = loc.afg_geclisa_token;
      if (foja && foja.token && foja.apellido) {
        fillFromFoja(foja, 'local' + (loc.afg_bridge_meta && loc.afg_bridge_meta.via ? '/' + loc.afg_bridge_meta.via : ''));
        if (done) done({ ok: true, source: 'local', foja: foja, meta: loc.afg_bridge_meta || null });
        return;
      }
      // Fallback: portapapeles AFG1|… (no depende del content script)
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(function (text) {
          var parsed = parseClipboardEnvelope(text);
          if (parsed && parsed.token && parsed.apellido) {
            chrome.storage.session.set({ afg_current_foja: parsed, afg_geclisa_token: parsed.token });
            chrome.storage.local.set({ afg_current_foja: parsed, afg_geclisa_token: parsed.token });
            fillFromFoja(parsed, 'clipboard');
            if (done) done({ ok: true, source: 'clipboard', foja: parsed });
            return;
          }
          if (parsed && parsed.token && !parsed.apellido) {
            document.getElementById('token').value = parsed.token;
            document.getElementById('foja-status').textContent =
              'Hay token en portapapeles pero sin apellido/nombre (formato viejo). Regenerá el token en AnesFact (v11.8+) para copiar AFG1|…';
            if (done) done({ ok: false, source: 'clipboard_token_only', foja: parsed });
            return;
          }
          fillFromFoja(null);
          if (done) done({ ok: false, source: 'none', session: sess, local: loc });
        }).catch(function (err) {
          fillFromFoja(foja && foja.token ? foja : null);
          if (done) done({ ok: false, source: 'clipboard_err', error: String(err) });
        });
        return;
      }
      fillFromFoja(null);
      if (done) done({ ok: false, source: 'none' });
    });
  });
}

loadFoja(function (r) {
  show({ boot: r });
});

document.getElementById('btn-refresh').addEventListener('click', function () {
  loadFoja(function (r) {
    show({ refresh: r });
  });
});

chrome.storage.local.get(['afg_debugger_warn_seen'], function (data) {
  var box = document.getElementById('dbg-first');
  if (!data.afg_debugger_warn_seen) {
    box.style.display = 'block';
  }
});

document.getElementById('btn-ping').addEventListener('click', async function () {
  try {
    var tabs = await chrome.tabs.query({ url: 'http://sanatoriomayo.myvnc.com:84/*' });
    if (!tabs.length) { show('No hay pestaña GECLISA abierta'); return; }
    var frames = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id, allFrames: true },
      func: function () {
        return {
          isTop: window === window.top,
          href: location.href.slice(0, 100),
          hasHistoriasBtn: !!document.getElementById('btn-Historias Clínicas'),
          hasDdlUbicacion: !!document.getElementById('ddlUbicacion'),
          hasFoja8054: !!document.getElementById('8054')
        };
      }
    });
    show({ tab: tabs[0].id, frames: frames.map(function (f) { return f.result; }) });
  } catch (e) {
    show(String(e.message || e));
  }
});

document.getElementById('btn-diag').addEventListener('click', function () {
  chrome.storage.session.get(null, function (sess) {
    chrome.storage.local.get(['afg_current_foja', 'afg_geclisa_token', 'afg_bridge_meta'], function (loc) {
      show({
        sessionKeys: Object.keys(sess || {}),
        sessionFoja: sess && sess.afg_current_foja,
        sessionMeta: sess && sess.afg_bridge_meta,
        localFoja: loc && loc.afg_current_foja,
        localMeta: loc && loc.afg_bridge_meta
      });
    });
  });
});

document.getElementById('btn-run').addEventListener('click', function () {
  document.getElementById('ok-banner').style.display = 'none';
  loadFoja(function () {
    chrome.storage.local.get(['afg_debugger_warn_seen'], function (seen) {
      var first = !seen.afg_debugger_warn_seen;
      var ap = document.getElementById('apellido').value.trim();
      var nm = document.getElementById('nombre').value.trim();
      var token = document.getElementById('token').value.trim();
      var msg =
        (first
          ? 'Vas a ver una barra amarilla de Chrome (debugger) — se quita sola antes del fill.\n\n'
          : '') +
        '¿Ejecutar 1–12 (navegación + fill.js) contra GECLISA?\n\n' +
        'NO hace click en Guardar.\n\n' +
        'Paciente: ' + ap + ', ' + nm + '\n' +
        'Token: ' + (token.length >= 32 ? ('sí (' + token.length + ' chars)') : 'FALTA (mín. 32)');

      if (!confirm(msg)) {
        show('Cancelado — sin ejecución');
        return;
      }

      chrome.storage.local.set({ afg_debugger_warn_seen: true }, function () {
        document.getElementById('dbg-first').style.display = 'none';
      });

      show('Ejecutando 1–12 (F5 → nav → fill.js)…');
      chrome.runtime.sendMessage({
        type: 'AFG_START_1_11',
        paciente: { apellido: ap, nombre: nm, token: token }
      }, function (res) {
        if (chrome.runtime.lastError) {
          show(chrome.runtime.lastError.message);
          return;
        }
        if (res && res.userMessage) {
          var ban = document.getElementById('ok-banner');
          ban.style.display = 'block';
          ban.querySelector('strong').textContent = res.userMessage;
        }
        show(res || { ok: false, error: 'sin respuesta' });
      });
    });
  });
});
