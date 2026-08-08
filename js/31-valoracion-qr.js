/** QR valoración preanestésica — crear enlace (requiere login) */
function _qr$(id) { return document.getElementById(id); }

function afPublicBaseUrl() {
  var path = location.pathname || '/';
  if (path.indexOf('/AnestFact') >= 0) return location.origin + '/AnestFact/';
  if (path.endsWith('/')) return location.origin + path;
  var i = path.lastIndexOf('/');
  return location.origin + (i >= 0 ? path.slice(0, i + 1) : '/');
}

function _qrModalEl() {
  var el = document.getElementById('qr-val-modal');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'qr-val-modal';
  el.style.cssText = 'display:none;position:fixed;inset:0;z-index:900;background:rgba(0,0,0,.65);padding:16px;overflow:auto';
  el.innerHTML =
    '<div style="max-width:400px;margin:40px auto;background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:20px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
    '<div style="font-weight:600;font-size:16px">QR valoración</div>' +
    '<button type="button" id="qr-val-close" style="background:none;border:none;color:var(--text2);font-size:24px;cursor:pointer">&times;</button></div>' +
    '<p style="font-size:13px;color:var(--text2);margin-bottom:12px;line-height:1.45">El paciente completa el cuestionario sin login. Válido 30 días.</p>' +
    '<div style="text-align:center;margin-bottom:14px"><img id="qr-val-img" alt="QR" width="200" height="200" style="border-radius:8px;background:#fff;padding:8px"></div>' +
    '<div class="field"><label style="font-size:11px">Enlace</label><input class="fi" id="qr-val-url" readonly style="font-size:12px"></div>' +
    '<div style="display:flex;gap:8px;margin-top:12px">' +
    '<button type="button" class="btn btn-g" style="flex:1" id="qr-val-copy">Copiar enlace</button>' +
    '<button type="button" class="btn btn-s" style="flex:1" id="qr-val-share">Compartir</button></div>' +
    '<p id="qr-val-exp" style="font-size:11px;color:var(--text3);margin-top:12px;text-align:center"></p></div>';
  document.body.appendChild(el);
  el.addEventListener('click', function (e) {
    if (e.target === el) cerrarModalQrValoracion();
  });
  _qr$('qr-val-close').onclick = cerrarModalQrValoracion;
  _qr$('qr-val-copy').onclick = function () {
    var u = _qr$('qr-val-url').value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(u).then(function () { toast('Enlace copiado'); });
    } else {
      _qr$('qr-val-url').select();
      document.execCommand('copy');
      toast('Enlace copiado');
    }
  };
  _qr$('qr-val-share').onclick = function () {
    var u = _qr$('qr-val-url').value;
    if (navigator.share) {
      navigator.share({ title: 'Valoración AnesFact', url: u }).catch(function () {});
    } else {
      _qr$('qr-val-copy').click();
    }
  };
  return el;
}

function cerrarModalQrValoracion() {
  var el = document.getElementById('qr-val-modal');
  if (el) el.style.display = 'none';
}

function mostrarModalQrValoracion(data) {
  var url = afPublicBaseUrl() + 'valoracion.html?t=' + encodeURIComponent(data.token);
  _qrModalEl().style.display = 'block';
  _qr$('qr-val-url').value = url;
  var img = _qr$('qr-val-img');
  function setQrSrc(dataUrl) {
    if (dataUrl) {
      img.src = dataUrl;
      img.style.display = 'inline-block';
    } else {
      img.style.display = 'none';
    }
  }
  function paint() {
    if (typeof QRCode !== 'undefined' && typeof QRCode.toDataURL === 'function') {
      QRCode.toDataURL(url, { width: 200, margin: 1, errorCorrectionLevel: 'M' }, function (err, dataUrl) {
        setQrSrc(err ? null : dataUrl);
      });
      return;
    }
    setQrSrc(null);
  }
  if (typeof QRCode === 'undefined' || typeof QRCode.toDataURL !== 'function') {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
    s.onload = paint;
    s.onerror = function () { setQrSrc(null); };
    document.head.appendChild(s);
  } else {
    paint();
  }
  var exp = data.expires_at ? new Date(data.expires_at).toLocaleDateString('es-AR') : '';
  _qr$('qr-val-exp').textContent = exp ? 'Vence el ' + exp + ' · QR de consultorio (multi-paciente)' : 'QR de consultorio (multi-paciente)';
}

function crearQrValoracion() {
  if (typeof AF_AUTH === 'undefined' || !AF_AUTH.isLoggedIn()) {
    toast('Iniciá sesión para generar QR');
    if (typeof go === 'function') go('config');
    return;
  }
  toast('Generando QR…');
  fetch(afSupabaseUrl() + '/functions/v1/af-qr-create', {
    method: 'POST',
    headers: afSupabaseHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ contexto: { origen: 'home' } }),
  })
    .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
    .then(function (res) {
      if (!res.ok || !res.j.ok || !res.j.token) {
        throw new Error((res.j && res.j.error) || 'No se pudo crear el QR');
      }
      mostrarModalQrValoracion(res.j);
      toast('QR listo');
    })
    .catch(function (err) {
      toast(err.message || 'Error al crear QR');
      console.error('crearQrValoracion', err);
    });
}
