// Firma profesional certificada (1 vez por cuenta) — RPC 008 af_certificar_firma / af_get_mi_firma
var AfFirma = (function () {
  var cache = null; // { certificada, firma_png, nombre, matricula, ... }
  var _cfgCtx = null;
  var _cfgEl = null;
  var _drawing = false;

  function rpc(name, body) {
    return fetch(afSupabaseUrl() + '/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: afSupabaseHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body || {})
    }).then(function (r) {
      return r.text().then(function (t) {
        var data = null;
        try { data = t ? JSON.parse(t) : null; } catch (e) { data = null; }
        if (!r.ok) {
          var msg = (data && (data.message || data.error_description)) || t.slice(0, 120) || ('HTTP ' + r.status);
          if (r.status === 404 || String(t).indexOf(name) >= 0 || String(t).indexOf('PGRST202') >= 0) {
            msg = 'Falta ejecutar el SQL 008 en Supabase (' + name + ')';
          }
          var err = new Error(msg);
          err.status = r.status;
          throw err;
        }
        return data;
      });
    });
  }

  function refresh() {
    if (typeof AF_AUTH === 'undefined' || !AF_AUTH.isLoggedIn || !AF_AUTH.isLoggedIn()) {
      cache = null;
      return Promise.resolve(null);
    }
    return rpc('af_get_mi_firma', {}).then(function (res) {
      cache = res && res.ok !== false ? res : null;
      return cache;
    }).catch(function () {
      cache = null;
      return null;
    });
  }

  function getCached() { return cache; }

  function getPng() {
    if (cache && cache.certificada && cache.firma_png) return cache.firma_png;
    return '';
  }

  function isCertificada() {
    return !!(cache && cache.certificada && cache.firma_png);
  }

  function initCfgCanvas() {
    var c = document.getElementById('cfg-sign-canvas');
    if (!c) return;
    _cfgEl = c;
    c.width = c.offsetWidth || 360;
    c.height = 120;
    _cfgCtx = c.getContext('2d');
    _cfgCtx.strokeStyle = '#000';
    _cfgCtx.lineWidth = 2;
    _cfgCtx.lineCap = 'round';
    _cfgCtx.lineJoin = 'round';
    _cfgCtx.clearRect(0, 0, c.width, c.height);
    c.onpointerdown = function (e) {
      if (isCertificada()) return;
      _drawing = true;
      c.setPointerCapture(e.pointerId);
      _cfgCtx.beginPath();
      var r = c.getBoundingClientRect();
      _cfgCtx.moveTo(e.clientX - r.left, e.clientY - r.top);
    };
    c.onpointermove = function (e) {
      if (!_drawing || isCertificada()) return;
      var r = c.getBoundingClientRect();
      _cfgCtx.lineTo(e.clientX - r.left, e.clientY - r.top);
      _cfgCtx.stroke();
    };
    c.onpointerup = c.onpointercancel = function () { _drawing = false; };
  }

  function clearCfg() {
    if (isCertificada()) { toast('La firma certificada no se puede borrar'); return; }
    if (_cfgCtx && _cfgEl) {
      _cfgCtx.clearRect(0, 0, _cfgEl.width, _cfgEl.height);
    }
  }

  function setStatus(msg, ok) {
    var el = document.getElementById('cfg-firma-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = ok === false ? 'var(--red)' : ok === true ? 'var(--green)' : 'var(--text3)';
  }

  function renderCfgUi() {
    var lock = document.getElementById('cfg-firma-locked');
    var edit = document.getElementById('cfg-firma-edit');
    var prev = document.getElementById('cfg-firma-preview');
    var btnCert = document.getElementById('cfg-firma-cert-btn');
    var btnClear = document.getElementById('cfg-firma-clear-btn');
    var nom = document.getElementById('cfg-anest-nombre');
    var mp = document.getElementById('cfg-anest-mp');
    var me = document.getElementById('cfg-anest-me');
    if (isCertificada()) {
      if (lock) lock.style.display = 'block';
      if (edit) edit.style.display = 'none';
      if (prev) {
        prev.src = getPng();
        prev.style.display = 'block';
      }
      setStatus('Firma certificada · matrícula ' + (cache.firma_matricula_snapshot || cache.matricula || '') + ' · no modificable', true);
      if (btnCert) btnCert.style.display = 'none';
      if (btnClear) btnClear.style.display = 'none';
      if (nom) nom.readOnly = true;
      if (mp) mp.readOnly = true;
      if (me) me.readOnly = true;
    } else {
      if (lock) lock.style.display = 'none';
      if (edit) edit.style.display = 'block';
      if (prev) prev.style.display = 'none';
      setStatus('Firmá una vez y certificá. Queda ligada a tu matrícula.', null);
      if (btnCert) btnCert.style.display = '';
      if (btnClear) btnClear.style.display = '';
      if (nom) nom.readOnly = false;
      if (mp) mp.readOnly = false;
      if (me) me.readOnly = false;
      initCfgCanvas();
    }
    // Foja: preview read-only
    applyFojaPreview();
  }

  function applyFojaPreview() {
    var wrap = document.getElementById('foja-firma-cert-wrap');
    var img = document.getElementById('foja-firma-cert-img');
    var canvas = document.getElementById('sign-canvas');
    var brow = canvas && canvas.parentElement ? canvas.parentElement.querySelector('.brow') : null;
    if (isCertificada()) {
      if (wrap) wrap.style.display = 'block';
      if (img) { img.src = getPng(); img.style.display = 'block'; }
      if (canvas) canvas.style.display = 'none';
      if (brow) brow.style.display = 'none';
      S.signData = getPng();
    } else {
      if (wrap) wrap.style.display = 'none';
      if (canvas) canvas.style.display = '';
      if (brow) brow.style.display = '';
    }
  }

  function certificar() {
    if (isCertificada()) { toast('Ya está certificada'); return; }
    var nombre = (document.getElementById('cfg-anest-nombre') && document.getElementById('cfg-anest-nombre').value) || '';
    var mp = (document.getElementById('cfg-anest-mp') && document.getElementById('cfg-anest-mp').value) || '';
    if (!String(nombre).trim() || !String(mp).trim()) {
      toast('Completá y guardá nombre + M.P. antes de certificar');
      return;
    }
    if (!_cfgEl) { toast('Canvas no listo'); return; }
    // Detect empty canvas
    var blank = document.createElement('canvas');
    blank.width = _cfgEl.width; blank.height = _cfgEl.height;
    if (_cfgEl.toDataURL() === blank.toDataURL()) {
      toast('Firmá en el recuadro primero');
      return;
    }
    if (!confirm('¿Certificar esta firma? No se podrá cambiar después (salvo reset admin).')) return;
    var png = _cfgEl.toDataURL('image/png');
    setStatus('Certificando…', null);
    rpc('af_certificar_firma', { p_firma_png: png }).then(function (res) {
      if (!res || res.ok === false) {
        setStatus((res && res.error) === 'ya_certificada' ? 'Ya estaba certificada' : ('Error: ' + ((res && res.error) || 'fail')), false);
        return refresh().then(renderCfgUi);
      }
      toast('Firma certificada ✓');
      return refresh().then(renderCfgUi);
    }).catch(function (e) {
      setStatus(e.message || String(e), false);
    });
  }

  function boot() {
    return refresh().then(renderCfgUi);
  }

  return {
    refresh: refresh,
    boot: boot,
    getPng: getPng,
    isCertificada: isCertificada,
    getCached: getCached,
    clearCfg: clearCfg,
    certificar: certificar,
    renderCfgUi: renderCfgUi,
    applyFojaPreview: applyFojaPreview,
    initCfgCanvas: initCfgCanvas
  };
})();

function clearCfgFirma() { AfFirma.clearCfg(); }
function certificarFirma() { AfFirma.certificar(); }
function renderCfgFirma() { AfFirma.boot(); }
