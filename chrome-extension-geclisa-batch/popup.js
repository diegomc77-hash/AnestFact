var out = document.getElementById('out');
var lastFoja = null;
var lastQueue = null;
var lastState = null;

function show(x) {
  out.textContent = typeof x === 'string' ? x : JSON.stringify(x, null, 2);
}

function send(type, extra) {
  return new Promise(function (resolve) {
    chrome.runtime.sendMessage(Object.assign({ type: type }, extra || {}), function (res) {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(res || { ok: false, error: 'sin_respuesta' });
    });
  });
}

function fillFromFoja(foja, source) {
  var st = document.getElementById('foja-status');
  if (!foja || !foja.token) {
    st.textContent = 'Sin foja mintada.';
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
  st.textContent = 'Foja (' + (source || '?') + '): ' + (foja.apellido || '?') + ', ' + (foja.nombre || '?') +
    (foja.sector ? (' · ' + foja.sector) : '') +
    ' · token ' + String(foja.token).length;
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

function statusColor(st) {
  if (st === 'paused_error') return '#c62828';
  if (st === 'awaiting_save') return '#e6a800';
  if (st === 'running') return '#1565c0';
  if (st === 'done') return '#2e7d32';
  return '#666';
}

function statusLabel(st) {
  var map = {
    queued: 'En cola',
    running: 'En curso',
    awaiting_save: 'Guardá',
    done: 'Listo',
    paused_error: 'Pausa',
    idle: 'Idle',
    done_all: 'Fin'
  };
  return map[st] || st || '—';
}

function renderQueueList(queue, state) {
  var box = document.getElementById('queue-list');
  if (!box) return;
  var items = (queue && queue.items) || [];
  if (!items.length) {
    box.innerHTML = '<div class="muted">Cola vacía. En AnesFact: Agregar a cola GECLISA.</div>';
    return;
  }
  var cur = state && state.currentIntervId;
  var html = '';
  items.forEach(function (it, idx) {
    var active = cur && String(it.id) === String(cur);
    html += '<div class="qitem' + (active ? ' active' : '') + '">';
    html += '<div class="row">';
    html += '<div style="min-width:0;flex:1">';
    html += '<div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
      (idx + 1) + '. ' + (it.pac || 'Sin nombre') + '</div>';
    html += '<div class="muted">' + (it.fecha || '—') + (it.hora ? (' ' + it.hora) : '') +
      (it.sector ? (' · ' + it.sector) : '') + '</div>';
    if (it.message) {
      html += '<div style="color:#c62828;font-size:11px;margin-top:2px">' +
        String(it.message).slice(0, 100) + '</div>';
    }
    html += '</div>';
    html += '<span class="st" style="color:' + statusColor(it.status) + '">' +
      statusLabel(it.status) + '</span>';
    html += '</div></div>';
  });
  box.innerHTML = html;
}

function setBanners(state) {
  var idle = document.getElementById('banner-idle');
  var awaitB = document.getElementById('banner-await');
  var errB = document.getElementById('banner-err');
  idle.style.display = 'none';
  awaitB.style.display = 'none';
  errB.style.display = 'none';
  var st = (state && state.status) || 'idle';
  if (st === 'awaiting_save') {
    awaitB.style.display = 'block';
  } else if (st === 'paused_error') {
    errB.style.display = 'block';
    document.getElementById('banner-err-text').textContent = state.message || 'Error';
  } else if (st === 'done_all') {
    awaitB.style.display = 'block';
    awaitB.querySelector('strong').textContent = 'Cola terminada';
  } else if (st !== 'running') {
    idle.style.display = 'block';
  }
}

function setButtons(state, busy) {
  var st = (state && state.status) || 'idle';
  document.getElementById('btn-start').disabled = !!busy || st === 'running' || st === 'awaiting_save';
  document.getElementById('btn-next').disabled = !!busy || st !== 'awaiting_save';
  document.getElementById('btn-retry').disabled = !!busy || !(st === 'paused_error' || st === 'awaiting_save');
  document.getElementById('btn-abort').disabled = !!busy || st === 'idle' || st === 'done_all';
  document.getElementById('btn-start').textContent =
    st === 'paused_error' ? 'Reanudar cola (siguiente pendiente)' : 'Iniciar cola';
}

function renderRunner(state, queue) {
  lastState = state || lastState;
  lastQueue = queue || lastQueue;
  var st = lastState || { status: 'idle' };
  var el = document.getElementById('runner-status');
  el.textContent = 'Estado: ' + statusLabel(st.status) +
    (st.currentPac ? (' · ' + st.currentPac) : '') +
    (st.message ? (' — ' + st.message) : '');
  setBanners(st);
  setButtons(st, st.status === 'running');
  renderQueueList(lastQueue, st);
}

async function refreshAll() {
  var q = await send('AFG_PULL_GECLISA_QUEUE');
  var s = await send('AFG_QUEUE_GET_STATE');
  if (q && q.ok) lastQueue = q.queue;
  if (s && s.ok) lastState = s.state;
  renderRunner(lastState, lastQueue);
  return { queue: q, state: s };
}

async function runAction(type) {
  setButtons(lastState, true);
  document.getElementById('runner-status').textContent = 'Estado: trabajando…';
  show({ action: type, running: true });
  var res = await send(type);
  if (res && res.foja) fillFromFoja(res.foja, 'runner');
  if (res && res.state) lastState = res.state;
  await refreshAll();
  show(res);
  if (res && res.userMessage) {
    var ban = document.getElementById('banner-await');
    ban.style.display = 'block';
    ban.querySelector('strong').textContent = res.userMessage;
  }
  return res;
}

document.getElementById('btn-refresh').addEventListener('click', function () {
  refreshAll().then(function (r) { show({ refresh: r }); });
});
document.getElementById('btn-start').addEventListener('click', function () {
  runAction('AFG_QUEUE_START');
});
document.getElementById('btn-next').addEventListener('click', function () {
  if (!confirm('¿Ya guardaste en GECLISA?\n\nSe marcará esta foja como lista y arrancará la siguiente (reload a home).')) return;
  runAction('AFG_QUEUE_NEXT');
});
document.getElementById('btn-retry').addEventListener('click', function () {
  runAction('AFG_QUEUE_RETRY');
});
document.getElementById('btn-abort').addEventListener('click', function () {
  if (!confirm('¿Abortar la cola en curso?')) return;
  runAction('AFG_QUEUE_ABORT');
});

document.getElementById('btn-mint-test').addEventListener('click', async function () {
  await refreshAll();
  var items = (lastQueue && lastQueue.items) || [];
  var first = null;
  for (var i = 0; i < items.length; i++) {
    if (items[i].status !== 'done') { first = items[i]; break; }
  }
  if (!first) { show({ ok: false, error: 'sin pendientes' }); return; }
  show({ minting: first.id, pac: first.pac });
  var res = await send('AFG_MINT_TOKEN_FOR_FOJA', { intervId: first.id });
  if (res && res.ok && res.foja) fillFromFoja(res.foja, 'mint_test');
  show({ mintTest: res });
});

document.getElementById('btn-diag').addEventListener('click', async function () {
  var pulled = await send('AFG_PULL_ANESFACT_FOJA');
  var queuePull = await send('AFG_PULL_GECLISA_QUEUE');
  var state = await send('AFG_QUEUE_GET_STATE');
  chrome.storage.session.get(null, function (sess) {
    show({
      pulled: pulled,
      queuePull: queuePull,
      state: state,
      sessionQueue: sess && sess.afg_geclisa_queue,
      runner: sess && sess.afg_runner_state,
      form: readPacienteFromForm()
    });
  });
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
          hasDdlUbicacion: !!document.getElementById('ddlUbicacion')
        };
      }
    });
    show({ tab: tabs[0].id, frames: frames.map(function (f) { return f.result; }) });
  } catch (e) {
    show(String(e.message || e));
  }
});

document.getElementById('btn-run').addEventListener('click', function () {
  var pac = readPacienteFromForm();
  if (lastFoja) {
    if (!pac.sector) pac.sector = lastFoja.sector || '';
    if (!pac.fechaCirugia) pac.fechaCirugia = lastFoja.fechaCirugia || '';
    if (!pac.horaInicio) pac.horaInicio = lastFoja.horaInicio || lastFoja.hora || '';
    if (!pac.token) pac.token = lastFoja.token || '';
  }
  if (!pac.token || pac.token.length < 32) {
    show({ ok: false, error: 'Falta token — usá Iniciar cola o Probar mint.' });
    return;
  }
  if (!confirm('Ejecutar 1–12 manual para ' + pac.apellido + ', ' + pac.nombre + '?')) return;
  show({ ejecutando: true, paciente: pac });
  chrome.runtime.sendMessage({ type: 'AFG_START_1_11', paciente: pac }, function (res) {
    if (chrome.runtime.lastError) {
      show(chrome.runtime.lastError.message);
      return;
    }
    show(res || { ok: false });
  });
});

refreshAll().then(function (r) {
  show({ boot: r });
});
