/**
 * Foja Quirúrgica (suite) — cáscara UI.
 * Entidad: S.cur.fojaQx (hermana de foja). Gating: afFojaQxEnabled(san).
 */
function cargarFojaQxUI() {
  if (!S.cur) return;
  if (typeof afSyncFojaQxPull === 'function') {
    afSyncFojaQxPull().then(function () {
      if (S.cur) _cargarFojaQxUIDom();
    });
  }
  _cargarFojaQxUIDom();
}

function _cargarFojaQxUIDom() {
  if (!S.cur) return;
  if (typeof afEnsureFojaQx === 'function') afEnsureFojaQx(S.cur);
  var i = S.cur;
  var f = i.foja || {};
  var qx = i.fojaQx || {};

  function setTxt(id, v) {
    var el = document.getElementById(id);
    if (!el) return;
    var s = v == null ? '' : String(v).trim();
    el.textContent = s || '—';
  }

  setTxt('qx-inst-line', i.san);
  setTxt('qx-pac', i.pac);
  setTxt('qx-dni', i.dni);
  setTxt('qx-san', i.san);
  setTxt('qx-fecha', i.fecha);
  setTxt('qx-hora-ini', i.hora || f.inicio || '');
  setTxt('qx-hora-fin', f.fin || '');
  setTxt('qx-serv', i.serv);
  setTxt('qx-ciru', i.ciru);
  setTxt('qx-diag', i.diag);

  var firmada = !!qx.firmada;
  var textoEl = document.getElementById('qx-texto');
  if (textoEl) {
    var t = qx.texto != null ? String(qx.texto).trim() : '';
    textoEl.textContent = t || (firmada ? '(sin texto)' : '(vacío — proformas en un paso posterior)');
    textoEl.style.color = t ? 'var(--text)' : 'var(--text3)';
  }

  var est = document.getElementById('qx-estado');
  if (est) {
    est.textContent = firmada
      ? ('Firmada / sellada' + (qx.firmada_at ? ' · ' + new Date(qx.firmada_at).toLocaleString('es-AR') : ''))
      : 'Borrador (cáscara)';
  }
  var ft = document.getElementById('qx-firmada-txt');
  if (ft) {
    if (firmada && qx.firma && qx.firma.nombre) {
      ft.textContent = 'firmada · ' + qx.firma.nombre + (qx.firma.mp ? ' · MP ' + qx.firma.mp : '');
    } else {
      ft.textContent = firmada ? 'firmada' : 'no firmada';
    }
  }
}

/**
 * Copia superficial sin fojaQx si el sanatorio tiene flag off.
 * Con flag on: omite firma.png del payload nube (data URL pesada).
 * No muta la intervención local.
 */
function afIntervPayloadForSync(inter) {
  if (!inter) return inter;
  if (typeof afFojaQxEnabled === 'function' && afFojaQxEnabled(inter.san)) {
    if (!inter.fojaQx || typeof inter.fojaQx !== 'object') return inter;
    if (!inter.fojaQx.firma || !inter.fojaQx.firma.png) return inter;
    var outOn = {};
    for (var k in inter) {
      if (!Object.prototype.hasOwnProperty.call(inter, k)) continue;
      if (k === 'fojaQx') {
        outOn.fojaQx = typeof afFojaQxForSyncPayload === 'function'
          ? afFojaQxForSyncPayload(inter.fojaQx)
          : inter.fojaQx;
      } else {
        outOn[k] = inter[k];
      }
    }
    return outOn;
  }
  if (!Object.prototype.hasOwnProperty.call(inter, 'fojaQx')) return inter;
  var out = {};
  for (var k2 in inter) {
    if (Object.prototype.hasOwnProperty.call(inter, k2) && k2 !== 'fojaQx') out[k2] = inter[k2];
  }
  return out;
}

function afIntervsPayloadForSync(list) {
  return (list || []).map(afIntervPayloadForSync);
}

/**
 * Dock «Foja qx»: siempre visible; disabled + toast vía go() si no hay
 * S.cur usable o institución con foja_qx off (Mayo).
 */
function afSyncDockFojaQx() {
  var btn = document.querySelector('#af-dock .dock-item[data-dock="fojaQx"]');
  if (!btn) return;
  var ok = !!(S.cur && typeof afFojaQxEnabled === 'function' && afFojaQxEnabled(S.cur.san));
  btn.classList.toggle('is-disabled', !ok);
  btn.setAttribute('aria-disabled', ok ? 'false' : 'true');
  if (!S.cur) btn.title = 'Abrí una intervención primero';
  else if (!ok) btn.title = 'Foja quirúrgica no habilitada en esta institución';
  else btn.title = 'Foja quirúrgica';
}

function _qxQrModalEl() {
  var el = document.getElementById('qr-qx-modal');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'qr-qx-modal';
  el.style.cssText = 'display:none;position:fixed;inset:0;z-index:400;background:rgba(0,0,0,.65);padding:16px;overflow:auto';
  el.innerHTML =
    '<div class="card" style="max-width:360px;margin:24px auto;padding:16px">' +
    '<div class="ct" style="margin-bottom:8px">QR cirujano · Foja Quirúrgica</div>' +
    '<p id="qr-qx-meta" style="font-size:12px;color:var(--text2);line-height:1.4;margin:0 0 10px"></p>' +
    '<div style="text-align:center;margin:12px 0">' +
    '<img id="qr-qx-img" alt="QR" style="width:200px;height:200px;display:none;background:#fff;border-radius:8px">' +
    '<p id="qr-qx-img-err" style="display:none;font-size:12px;color:var(--red)">No se pudo dibujar el QR</p>' +
    '</div>' +
    '<label style="font-size:11px;color:var(--text3)">Enlace</label>' +
    '<input class="fi" id="qr-qx-url" readonly style="font-size:11px;margin-top:4px">' +
    '<div class="brow" style="margin-top:12px">' +
    '<button type="button" class="btn btn-s" onclick="document.getElementById(\'qr-qx-modal\').style.display=\'none\'">Cerrar</button>' +
    '<button type="button" class="btn btn-s" onclick="afCopiarUrlQxQr()">Copiar enlace</button>' +
    '</div></div>';
  document.body.appendChild(el);
  el.addEventListener('click', function (ev) {
    if (ev.target === el) el.style.display = 'none';
  });
  return el;
}

function afCopiarUrlQxQr() {
  var inp = document.getElementById('qr-qx-url');
  if (!inp || !inp.value) return;
  try {
    inp.select();
    document.execCommand('copy');
    if (typeof toast === 'function') toast('Enlace copiado');
  } catch (e) {
    if (typeof toast === 'function') toast('No se pudo copiar');
  }
}

function afQxPublicBaseUrl() {
  if (typeof afPublicBaseUrl === 'function') return afPublicBaseUrl();
  var path = location.pathname || '/';
  if (path.indexOf('/AnestFact') >= 0) return location.origin + '/AnestFact/';
  if (path.endsWith('/')) return location.origin + path;
  var i = path.lastIndexOf('/');
  return location.origin + (i >= 0 ? path.slice(0, i + 1) : '/');
}

function mostrarModalQrFojaQx(data) {
  var url = afQxPublicBaseUrl() + 'foja-qx.html?t=' + encodeURIComponent(data.token);
  var modal = _qxQrModalEl();
  var meta = document.getElementById('qr-qx-meta');
  var exp = data.expires_at ? new Date(data.expires_at).toLocaleString('es-AR') : '';
  if (meta) {
    meta.textContent = (S.cur && S.cur.san ? S.cur.san + ' · ' : '') +
      'un uso' + (exp ? ' · vence ' + exp : ' · 7 días') +
      ' · regenerar invalida el anterior';
  }
  var inp = document.getElementById('qr-qx-url');
  if (inp) inp.value = url;
  modal.style.display = 'block';

  var img = document.getElementById('qr-qx-img');
  var imgErr = document.getElementById('qr-qx-img-err');
  function setSrc(dataUrl) {
    if (dataUrl) {
      img.src = dataUrl;
      img.style.display = 'inline-block';
      if (imgErr) imgErr.style.display = 'none';
    } else {
      img.removeAttribute('src');
      img.style.display = 'none';
      if (imgErr) imgErr.style.display = 'block';
    }
  }
  function paint() {
    if (typeof QRCode !== 'undefined' && typeof QRCode.toDataURL === 'function') {
      QRCode.toDataURL(url, { width: 200, margin: 1, errorCorrectionLevel: 'M' }, function (err, dataUrl) {
        setSrc(err ? null : dataUrl);
      });
      return;
    }
    setSrc(null);
  }
  if (typeof QRCode === 'undefined' || typeof QRCode.toDataURL !== 'function') {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js';
    s.onload = paint;
    s.onerror = function () { setSrc(null); };
    document.head.appendChild(s);
  } else {
    paint();
  }
}

function crearQrFojaQx() {
  if (typeof AF_AUTH === 'undefined' || !AF_AUTH.isLoggedIn()) {
    if (typeof toast === 'function') toast('Iniciá sesión para generar QR');
    return;
  }
  if (!S.cur || !S.cur.id) {
    if (typeof toast === 'function') toast('Abrí una intervención primero');
    return;
  }
  if (typeof afFojaQxEnabled === 'function' && !afFojaQxEnabled(S.cur.san)) {
    if (typeof toast === 'function') toast('Foja quirúrgica no habilitada en esta institución');
    return;
  }
  if (typeof afEnsureFojaQx === 'function') afEnsureFojaQx(S.cur);

  var f = S.cur.foja || {};
  var contexto = {
    modo: 'foja_qx',
    max_uses: 1,
    sanatorio: S.cur.san || '',
    inter_id: String(S.cur.id),
    especialidad: S.cur.serv || '',
    serv: S.cur.serv || '',
    cirujano: S.cur.ciru || '',
    paciente: S.cur.pac || '',
    pac: S.cur.pac || '',
    dni: S.cur.dni || '',
    fecha: S.cur.fecha || '',
    hora_ini: S.cur.hora || f.inicio || '',
    hora_fin: f.fin || '',
    hora: S.cur.hora || f.inicio || '',
    diag: S.cur.diag || '',
  };

  if (typeof toast === 'function') toast('Generando QR cirujano…');
  fetch(afSupabaseUrl() + '/functions/v1/af-qx-create', {
    method: 'POST',
    headers: afSupabaseHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ contexto: contexto }),
  })
    .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
    .then(function (res) {
      if (!res.ok || !res.j.ok || !res.j.token) {
        throw new Error((res.j && res.j.error) || 'No se pudo crear el QR');
      }
      if (S.cur.fojaQx) {
        S.cur.fojaQx.last_qr_token_id = res.j.token_id || null;
      }
      if (typeof saveIntervsToStorage === 'function') {
        var ix = (S.intervs || []).findIndex(function (x) { return x.id === S.cur.id; });
        if (ix >= 0) S.intervs[ix] = S.cur;
        saveIntervsToStorage();
      }
      if (typeof syncAutoPushDebounced === 'function') syncAutoPushDebounced();
      mostrarModalQrFojaQx(res.j);
      if (typeof toast === 'function') toast('QR cirujano listo (un uso)');
    })
    .catch(function (err) {
      if (typeof toast === 'function') toast(err.message || 'Error al crear QR');
      console.error('crearQrFojaQx', err);
    });
}
