/** QR valoración preanestésica — crear enlace (requiere login) */
function _qr$(id) { return document.getElementById(id); }

var _qrCardMeta = { n: 1, fecha: '', nombre: '', pie: '' };
var _qrPrintBound = false;

function afPublicBaseUrl() {
  var path = location.pathname || '/';
  if (path.indexOf('/AnestFact') >= 0) return location.origin + '/AnestFact/';
  if (path.endsWith('/')) return location.origin + path;
  var i = path.lastIndexOf('/');
  return location.origin + (i >= 0 ? path.slice(0, i + 1) : '/');
}

function afQrFechaAR() {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
  } catch (e) {
    return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }
}

function afQrFechaCorta() {
  var iso = afQrFechaAR();
  var p = iso.split('-');
  return (p[2] || '') + '/' + (p[1] || '');
}

function afQrLugarId(lugar) {
  var n = String(lugar || '').trim();
  if (typeof afFojaInst === 'function') {
    var inst = afFojaInst(n);
    if (inst && inst.id) return String(inst.id);
  }
  if (!n) return 'x';
  try {
    return n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'x';
  } catch (e) {
    return 'x';
  }
}

function afQrOrdenKey(lugar) {
  var suf = (typeof afUserSuffix === 'function' ? afUserSuffix() : '') || '_anon';
  return 'af_qr_orden_' + afQrFechaAR() + suf + '_' + afQrLugarId(lugar);
}

function afNextQrOrdenDia(lugar) {
  var k = afQrOrdenKey(lugar);
  var n = 0;
  try { n = parseInt(localStorage.getItem(k) || '0', 10) || 0; } catch (e) {}
  n += 1;
  try { localStorage.setItem(k, String(n)); } catch (e) {}
  return n;
}

function afQrMedicoNombre() {
  if (typeof AfIdentidad !== 'undefined' && AfIdentidad.get) {
    var id = AfIdentidad.get();
    if (id && id.nombre) return id.nombre;
  }
  var local = (localStorage.getItem('af_anest_nombre') || '').toUpperCase();
  return local || 'ANESTESISTA';
}

function _qrBindPrintCleanup() {
  if (_qrPrintBound) return;
  _qrPrintBound = true;
  window.addEventListener('afterprint', function () {
    document.body.classList.remove('af-print-qr');
  });
}

function afImprimirTarjetaQr() {
  _qrBindPrintCleanup();
  document.body.classList.add('af-print-qr');
  setTimeout(function () {
    window.print();
    setTimeout(function () { document.body.classList.remove('af-print-qr'); }, 800);
  }, 50);
}

function afRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function afDescargarQrBlob(blob, name) {
  var file = new File([blob], name, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: name }).catch(function () {});
    return;
  }
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    URL.revokeObjectURL(a.href);
    if (a.parentNode) a.parentNode.removeChild(a);
  }, 400);
}

function afGuardarImagenQr() {
  var img = _qr$('qr-val-img');
  if (!img || !img.src || img.style.display === 'none') {
    toast('No hay imagen del QR para guardar');
    return;
  }
  var meta = _qrCardMeta;
  var w = 720;
  var h = 1000;
  var c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  var ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#22c55e';
  afRoundRect(ctx, 56, 48, 88, 88, 20);
  ctx.fill();
  ctx.font = '42px system-ui,Segoe UI Emoji,sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('\uD83D\uDC89', 100, 94);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#0D1117';
  ctx.font = '800 40px system-ui,sans-serif';
  ctx.fillText('AnesFact', 164, 88);
  ctx.fillStyle = '#6E7681';
  ctx.font = '600 14px system-ui,sans-serif';
  ctx.fillText('SUITE ANESTÉSICA', 164, 114);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#161B22';
  ctx.font = '600 22px system-ui,sans-serif';
  ctx.fillText(meta.nombre || 'ANESTESISTA', w / 2, 186);
  ctx.fillStyle = '#16a34a';
  ctx.font = '800 96px system-ui,sans-serif';
  ctx.fillText('#' + meta.n, w / 2, 300);
  ctx.fillStyle = '#6E7681';
  ctx.font = '600 26px system-ui,sans-serif';
  ctx.fillText(meta.fecha, w / 2, 348);
  var q = 360;
  try {
    ctx.drawImage(img, (w - q) / 2, 390, q, q);
  } catch (e) {
    toast('No se pudo dibujar el QR');
    return;
  }
  ctx.fillStyle = '#6E7681';
  ctx.font = '16px system-ui,sans-serif';
  var pie = meta.pie || '';
  if (pie.length > 52) pie = pie.slice(0, 50) + '…';
  ctx.fillText(pie, w / 2, 790);
  var fname = 'AnesFact-QR-' + String(meta.fecha || '').replace(/\//g, '-') + '-' + meta.n + '.png';
  if (c.toBlob) {
    c.toBlob(function (blob) {
      if (!blob) { toast('No se pudo armar la imagen'); return; }
      afDescargarQrBlob(blob, fname);
      toast('Imagen lista');
    }, 'image/png');
  } else {
    var a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = fname;
    a.click();
    toast('Imagen lista');
  }
}

function _qrModalEl() {
  var el = document.getElementById('qr-val-modal');
  if (el && document.getElementById('qr-val-card')) return el;
  if (el && el.parentNode) el.parentNode.removeChild(el);
  el = document.createElement('div');
  el.id = 'qr-val-modal';
  el.style.cssText = 'display:none;position:fixed;inset:0;z-index:900;background:rgba(0,0,0,.65);padding:16px;overflow:auto';
  el.innerHTML =
    '<div class="qr-val-sheet">' +
    '<div class="qr-val-head qr-val-chrome"><div class="ttl">QR valoraci&oacute;n</div>' +
    '<button type="button" id="qr-val-close" style="background:none;border:none;color:var(--text2);font-size:24px;cursor:pointer">&times;</button></div>' +
    '<div class="qr-card" id="qr-val-card">' +
    '<div class="lockup">' +
    '<div class="syringe-badge" aria-hidden="true">&#128137;</div>' +
    '<div class="lockup-text"><div class="brand">AnesFact</div><div class="tag">Suite anest&eacute;sica</div></div>' +
    '</div>' +
    '<div class="qr-card-doc" id="qr-val-doc"></div>' +
    '<div class="qr-card-num" id="qr-val-num">#1</div>' +
    '<div class="qr-card-date" id="qr-val-date"></div>' +
    '<img id="qr-val-img" alt="QR" width="200" height="200">' +
    '<p class="qr-card-foot" id="qr-val-exp"></p>' +
    '</div>' +
    '<p id="qr-val-img-err" class="qr-val-chrome" style="display:none;font-size:12px;color:var(--red);text-align:center;margin:0 0 12px;line-height:1.4">No se pudo generar la imagen del QR — us&aacute; el enlace de abajo</p>' +
    '<div class="field qr-val-chrome"><label style="font-size:11px">Enlace</label><input class="fi" id="qr-val-url" readonly style="font-size:12px"></div>' +
    '<div class="tile-row qr-val-chrome" style="margin-top:12px;margin-bottom:8px">' +
    '<button type="button" class="tile tile-foja" id="qr-val-print">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>' +
    '<span>Imprimir</span></button>' +
    '<button type="button" class="tile tile-save" id="qr-val-save">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
    '<span>Guardar</span></button>' +
    '</div>' +
    '<div class="brow qr-val-chrome">' +
    '<button type="button" class="btn btn-g" style="flex:1" id="qr-val-copy">Copiar enlace</button>' +
    '<button type="button" class="btn btn-s" style="flex:1" id="qr-val-share">Compartir</button></div>' +
    '</div>';
  document.body.appendChild(el);
  el.addEventListener('click', function (e) {
    if (e.target === el) cerrarModalQrValoracion();
  });
  _qr$('qr-val-close').onclick = cerrarModalQrValoracion;
  _qr$('qr-val-print').onclick = afImprimirTarjetaQr;
  _qr$('qr-val-save').onclick = afGuardarImagenQr;
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
  document.body.classList.remove('af-print-qr');
}

function afQrLugarKey(){
  var uid = (typeof AF_AUTH !== 'undefined' && AF_AUTH.getUserId) ? (AF_AUTH.getUserId() || '') : '';
  return 'af_qr_lugar_' + (uid || 'anon');
}

function afQrLugaresDisponibles(){
  if(typeof AfSanatoriosPlan !== 'undefined' && AfSanatoriosPlan.selectNames){
    return AfSanatoriosPlan.selectNames() || [];
  }
  return [];
}

/** Token gana sobre extras del cliente (misma regla que af-qr-submit). */
function afQrSanatorioDesdeToken(ctx, extras){
  var c = ctx && ctx.sanatorio ? String(ctx.sanatorio).trim() : '';
  if(c) return c;
  var e = extras && extras.sanatorio ? String(extras.sanatorio).trim() : '';
  if(e) return e;
  return 'Sanatorio Mayo';
}

function afQrLugarLeido(){
  try { return (localStorage.getItem(afQrLugarKey()) || '').trim(); } catch (e) { return ''; }
}

function afQrLugarGuardar(nombre){
  try { localStorage.setItem(afQrLugarKey(), String(nombre || '')); } catch (e) {}
}

function afQrLugarActual(){
  var names = afQrLugaresDisponibles();
  if(!names.length) return '';
  if(names.length === 1) return names[0];
  var saved = afQrLugarLeido();
  if(saved && names.indexOf(saved) >= 0) return saved;
  return names[0];
}

function afQrLugarOnChange(){
  var sel = _qr$('qr-lugar-sel');
  if(!sel || !sel.value) return;
  afQrLugarGuardar(sel.value);
  afSyncQrLugarUi();
}

function afSyncQrLugarUi(){
  var row = _qr$('qr-lugar-row');
  var sel = _qr$('qr-lugar-sel');
  var nom = _qr$('qr-lugar-nombre');
  if(!row || !sel || !nom) return;
  var names = afQrLugaresDisponibles();
  var cur = afQrLugarActual();
  if(!names.length){
    row.style.display = 'none';
    return;
  }
  row.style.display = '';
  if(names.length === 1){
    sel.style.display = 'none';
    nom.style.display = 'block';
    nom.textContent = names[0];
    return;
  }
  nom.style.display = 'none';
  sel.style.display = 'block';
  while(sel.options.length) sel.remove(0);
  names.forEach(function(n){
    var o = document.createElement('option');
    o.value = n;
    o.textContent = n;
    sel.appendChild(o);
  });
  sel.value = cur;
}

function afQrPieTarjeta(lugar, data){
  var exp = data && data.expires_at ? new Date(data.expires_at).toLocaleString('es-AR') : '';
  var single = !!(data && (data.single_use || data.max_uses === 1));
  var mayo = lugar === 'Sanatorio Mayo';
  if(mayo){
    return single
      ? (exp ? 'Mayo · un uso · vence ' + exp : 'Sanatorio Mayo · un uso · 48 h')
      : (exp ? 'Vence el ' + exp : 'Sanatorio Mayo');
  }
  var name = lugar || 'AnesFact';
  return single
    ? (exp ? name + ' · un uso · vence ' + exp : name + ' · un uso · 48 h')
    : (exp ? name + ' · vence ' + exp : name);
}

function mostrarModalQrValoracion(data, orden, lugar){
  var url = afPublicBaseUrl() + 'valoracion.html?t=' + encodeURIComponent(data.token);
  var n = orden || 1;
  var fecha = afQrFechaCorta();
  var nombre = afQrMedicoNombre();
  var pie = afQrPieTarjeta(lugar || 'Sanatorio Mayo', data);
  _qrCardMeta = { n: n, fecha: fecha, nombre: nombre, pie: pie };
  _qrModalEl().style.display = 'block';
  _qr$('qr-val-url').value = url;
  _qr$('qr-val-doc').textContent = nombre;
  _qr$('qr-val-num').textContent = '#' + n;
  _qr$('qr-val-date').textContent = fecha;
  _qr$('qr-val-exp').textContent = pie;
  var img = _qr$('qr-val-img');
  var imgErr = _qr$('qr-val-img-err');
  function setQrSrc(dataUrl) {
    if (dataUrl) {
      img.src = dataUrl;
      img.style.display = 'inline-block';
      if (imgErr) imgErr.style.display = 'none';
    } else {
      img.removeAttribute('src');
      img.style.display = 'none';
      if (imgErr) imgErr.style.display = 'block';
      try { console.warn('[AFG] QR imagen: no se pudo generar (CDN o QRCode.toDataURL)'); } catch (e0) {}
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
    s.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js';
    s.onload = paint;
    s.onerror = function () { setQrSrc(null); };
    document.head.appendChild(s);
  } else {
    paint();
  }
}

function crearQrValoracion() {
  if (typeof AF_AUTH === 'undefined' || !AF_AUTH.isLoggedIn()) {
    toast('Iniciá sesión para generar QR');
    if (typeof go === 'function') go('config');
    return;
  }
  var lugar = afQrLugarActual();
  if (!lugar) {
    toast('No hay un lugar habilitado para este QR');
    return;
  }
  afQrLugarGuardar(lugar);
  toast('Generando QR…');
  fetch(afSupabaseUrl() + '/functions/v1/af-qr-create', {
    method: 'POST',
    headers: afSupabaseHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      contexto: {
        origen: 'home',
        sanatorio: lugar,
        modo: 'preoperatorio',
        max_uses: 1,
      },
    }),
  })
    .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
    .then(function (res) {
      if (!res.ok || !res.j.ok || !res.j.token) {
        throw new Error((res.j && res.j.error) || 'No se pudo crear el QR');
      }
      var orden = afNextQrOrdenDia(lugar);
      mostrarModalQrValoracion(res.j, orden, lugar);
      toast(lugar === 'Sanatorio Mayo' ? 'QR Mayo listo (un uso)' : ('QR listo · ' + lugar + ' (un uso)'));
    })
    .catch(function (err) {
      toast(err.message || 'Error al crear QR');
      console.error('crearQrValoracion', err);
    });
}
