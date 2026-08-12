var out = document.getElementById('out');
var lastFoja = null;

function show(x) {
  out.textContent = typeof x === 'string' ? x : JSON.stringify(x, null, 2);
}

function fillFromFoja(foja, source) {
  var st = document.getElementById('foja-status');
  if (!foja || !foja.token) {
    st.textContent = 'Sin foja en cola. En AnesFact: Enviar a GECLISA → Actualizar.';
    lastFoja = null;
    return false;
  }
  lastFoja = foja;
  document.getElementById('apellido').value = foja.apellido || '';
  document.getElementById('nombre').value = foja.nombre || '';
  document.getElementById('sector').value = foja.sector || foja.mayo_sector || '';
  document.getElementById('fechaCirugia').value = foja.fechaCirugia || '';
  document.getElementById('horaInicio').value = foja.horaInicio || foja.hora || '';
  document.getElementById('token').value = foja.token || '';
  var when = foja.updatedAt ? new Date(foja.updatedAt).toLocaleString() : '—';
  st.textContent = 'Foja (' + (source || '?') + '): ' + (foja.apellido || '?') + ', ' + (foja.nombre || '?') +
    (foja.sector ? (' · ' + foja.sector) : ' · ⚠ sin sector') +
    (foja.fechaCirugia ? (' · ' + foja.fechaCirugia) : '') +
    (foja.horaInicio || foja.hora ? (' ' + (foja.horaInicio || foja.hora)) : '') +
    ' · token ' + String(foja.token).length + ' · ' + when;
  return true;
}

function readPacienteFromForm() {
  return {
    apellido: document.getElementById('apellido').value.trim(),
    nombre: document.getElementById('nombre').value.trim(),
    sector: document.getElementById('sector').value.trim(),
    fechaCirugia: document.getElementById('fechaCirugia').value.trim(),
    horaInicio: document.getElementById('horaInicio').value.trim(),
    token: document.getElementById('token').value.trim()
  };
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
  if (text.length >= 32 && text.indexOf('|') < 0 && text.indexOf(' ') < 0) {
    return { token: text, apellido: '', nombre: '', updatedAt: Date.now() };
  }
  return null;
}

function loadFoja(done) {
  chrome.runtime.sendMessage({ type: 'AFG_PULL_ANESFACT_FOJA' }, function (pulled) {
    if (chrome.runtime.lastError) {
      pulled = { ok: false, error: chrome.runtime.lastError.message };
    }
    if (pulled && pulled.ok && pulled.foja && pulled.foja.token && pulled.foja.apellido) {
      fillFromFoja(pulled.foja, 'anesfact_tab');
      if (done) done({ ok: true, source: 'anesfact_tab', foja: pulled.foja, meta: pulled.meta || null, pull: pulled });
      return;
    }
    loadFojaFromStorageAndClipboard(pulled, done);
  });
}

function loadFojaFromStorageAndClipboard(pullInfo, done) {
  chrome.storage.session.get(['afg_current_foja', 'afg_geclisa_token', 'afg_bridge_meta'], function (sess) {
    var foja = sess.afg_current_foja || null;
    if (foja && !foja.token && sess.afg_geclisa_token) foja.token = sess.afg_geclisa_token;
    if (foja && foja.token && foja.apellido) {
      fillFromFoja(foja, 'session' + (sess.afg_bridge_meta && sess.afg_bridge_meta.via ? '/' + sess.afg_bridge_meta.via : ''));
      if (done) done({ ok: true, source: 'session', foja: foja, meta: sess.afg_bridge_meta || null, pull: pullInfo || null });
      return;
    }
    chrome.storage.local.get(['afg_current_foja', 'afg_geclisa_token', 'afg_bridge_meta'], function (loc) {
      foja = loc.afg_current_foja || null;
      if (foja && !foja.token && loc.afg_geclisa_token) foja.token = loc.afg_geclisa_token;
      if (foja && foja.token && foja.apellido) {
        fillFromFoja(foja, 'local' + (loc.afg_bridge_meta && loc.afg_bridge_meta.via ? '/' + loc.afg_bridge_meta.via : ''));
        if (done) done({ ok: true, source: 'local', foja: foja, meta: loc.afg_bridge_meta || null, pull: pullInfo || null });
        return;
      }
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(function (text) {
          var parsed = parseClipboardEnvelope(text);
          if (parsed && parsed.token && parsed.apellido) {
            chrome.storage.local.set({ afg_current_foja: parsed, afg_geclisa_token: parsed.token });
            try { chrome.storage.session.set({ afg_current_foja: parsed, afg_geclisa_token: parsed.token }); } catch (e) {}
            fillFromFoja(parsed, 'clipboard');
            if (done) done({ ok: true, source: 'clipboard', foja: parsed, pull: pullInfo || null });
            return;
          }
          if (parsed && parsed.token && !parsed.apellido) {
            document.getElementById('token').value = parsed.token;
            document.getElementById('foja-status').textContent =
              'Hay token en portapapeles pero sin apellido/nombre. Regenerá token en AnesFact.';
            if (done) done({ ok: false, source: 'clipboard_token_only', foja: parsed, pull: pullInfo || null });
            return;
          }
          fillFromFoja(null);
          if (done) done({ ok: false, source: 'none', pull: pullInfo || null, session: sess, local: loc });
        }).catch(function (err) {
          fillFromFoja(foja && foja.token ? foja : null);
          if (done) done({ ok: false, source: 'clipboard_err', error: String(err), pull: pullInfo || null });
        });
        return;
      }
      fillFromFoja(null);
      if (done) done({ ok: false, source: 'none', pull: pullInfo || null });
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
          hasDdlSector: !!document.getElementById('ddlSector'),
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
  chrome.runtime.sendMessage({ type: 'AFG_PULL_ANESFACT_FOJA' }, function (pulled) {
    chrome.storage.session.get(null, function (sess) {
      chrome.storage.local.get(['afg_current_foja', 'afg_geclisa_token', 'afg_bridge_meta'], function (loc) {
        show({
          pull: pulled,
          form: readPacienteFromForm(),
          sessionFoja: sess && sess.afg_current_foja,
          localFoja: loc && loc.afg_current_foja
        });
      });
    });
  });
});

document.getElementById('btn-run').addEventListener('click', function () {
  document.getElementById('ok-banner').style.display = 'none';
  loadFoja(function () {
    chrome.storage.local.get(['afg_debugger_warn_seen'], function (seen) {
      var first = !seen.afg_debugger_warn_seen;
      var pac = readPacienteFromForm();
      // Merge con última foja por si el form quedó corto
      if (lastFoja) {
        if (!pac.sector) pac.sector = lastFoja.sector || lastFoja.mayo_sector || '';
        if (!pac.fechaCirugia) pac.fechaCirugia = lastFoja.fechaCirugia || '';
        if (!pac.horaInicio) pac.horaInicio = lastFoja.horaInicio || lastFoja.hora || '';
        if (!pac.token) pac.token = lastFoja.token || '';
      }

      var msg =
        (first
          ? 'Vas a ver una barra amarilla de Chrome (debugger) — se quita sola antes del fill.\n\n'
          : '') +
        '¿Ejecutar 1–12?\n\n' +
        'NO hace click en Guardar.\n\n' +
        'Paciente: ' + pac.apellido + ', ' + pac.nombre + '\n' +
        'Panel: ' + (pac.fechaCirugia || '¿fecha?') + ' · ' + (pac.sector || '¿sector?') + ' · ' + (pac.horaInicio || '¿hora?') + '\n' +
        'Token: ' + (pac.token.length >= 32 ? ('sí (' + pac.token.length + ')') : 'FALTA');

      if (!pac.sector || !pac.fechaCirugia || !pac.horaInicio) {
        show({
          ok: false,
          error: 'Faltan sector / fechaCirugia / horaInicio en el popup. Actualizar desde AnesFact (con Sector elegido) y reintentar.',
          paciente: pac
        });
        return;
      }

      if (!confirm(msg)) {
        show('Cancelado — sin ejecución');
        return;
      }

      chrome.storage.local.set({ afg_debugger_warn_seen: true }, function () {
        document.getElementById('dbg-first').style.display = 'none';
      });

      show({ ejecutando: true, paciente: pac });
      chrome.runtime.sendMessage({
        type: 'AFG_START_1_11',
        paciente: pac
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
