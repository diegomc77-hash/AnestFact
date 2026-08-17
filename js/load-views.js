// Carga topbar + vistas HTML y arranca la app (tras Supabase Auth)

(function () {
  var VIEWS = ['home', 'nueva', 'facturacion', 'escanear', 'config', 'foja', 'nom', 'geclisa', 'resumen', 'ayuda', 'admin'];
  var FOJA_PARTS = [
    'tiempos', 'mayo-quir', 'tecnica', 'drogas', 'metodos', 'mayo-geclisa',
    'vitals', 'fluidos', 'recuperacion', 'observaciones', 'firma', 'acciones'
  ];
  var topbarMount = document.getElementById('topbar-mount');
  var viewsMount = document.getElementById('views-mount');
  var mainBooted = false;

  if (!topbarMount || !viewsMount) return;

  function afRepairNuevaDom(){
    if(typeof afRepairViewsDom==='function') afRepairViewsDom();
  }

  function initApp() {
    if (S.key) {
      var ke = document.getElementById('cfg-key');
      if (ke) ke.value = S.key;
    }
    if (typeof actualizarKeyStatus === 'function') actualizarKeyStatus();
    var su = localStorage.getItem('af_sync_url') || '';
    if (su) {
      var se = document.getElementById('cfg-sync-url');
      if (se) se.value = su;
    }
    if (typeof cargarAnestesista === 'function') cargarAnestesista();
    if (typeof initExamenAuscUI === 'function') initExamenAuscUI();
    var ua = document.getElementById('upload-area');
    if (ua) {
      ua.addEventListener('dragover', function (e) { e.preventDefault(); ua.style.borderColor = 'var(--green)'; });
      ua.addEventListener('dragleave', function () { ua.style.borderColor = 'var(--border)'; });
      ua.addEventListener('drop', function (e) { e.preventDefault(); ua.style.borderColor = 'var(--border)'; onFiles(e.dataTransfer.files); });
    }
    var dateEl = document.getElementById('f-fecha');
    if (dateEl && !dateEl.value) dateEl.value = new Date().toISOString().slice(0, 10);
    if (typeof renderHome === 'function') renderHome();
    if (typeof initAutoSync === 'function') initAutoSync();
    if (typeof planBadgeText === 'function') {
      var pb = document.getElementById('plan-badge');
      if (pb) pb.textContent = planBadgeText();
    }
    if (typeof refreshAdminUi === 'function') refreshAdminUi();
    if (typeof refreshCfgUi === 'function') refreshCfgUi();
    afRepairNuevaDom();
    if (typeof afShowView === 'function') afShowView('home');
    if (typeof AfSesiones !== 'undefined' && AfSesiones.onAuthReady) {
      AfSesiones.onAuthReady();
    }
    if (typeof AfFirma !== 'undefined' && AfFirma.refresh) {
      AfFirma.refresh().then(function () {
        if (typeof AfFirma.applyFojaPreview === 'function') AfFirma.applyFojaPreview();
      });
    }
  }

  function showLoadError(msg) {
    viewsMount.insertAdjacentHTML('beforeend',
      '<div class="card" style="margin:16px;padding:16px;color:var(--red)"><strong>No se pudieron cargar las pantallas.</strong><br>' + msg + '</div>');
  }

  function fetchHtml(url) {
      var bust = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'v=12.12';
    return fetch(bust).then(function (r) {
      if (!r.ok) throw new Error(url + ' HTTP ' + r.status);
      return r.text();
    });
  }

  function loadFojaParts(i, mount, next) {
    if (i >= FOJA_PARTS.length) { next(); return; }
    fetchHtml('views/foja/' + FOJA_PARTS[i] + '.html')
      .then(function (html) { mount.insertAdjacentHTML('beforeend', html); loadFojaParts(i + 1, mount, next); })
      .catch(function (err) {
        console.error('AnesFact foja:', err);
        showLoadError('No se pudo cargar views/foja/' + FOJA_PARTS[i] + '.html');
      });
  }

  function loadView(name, next) {
    if (name === 'foja') {
      fetchHtml('views/foja.html').then(function (html) {
        viewsMount.insertAdjacentHTML('beforeend', html);
        var mount = document.getElementById('foja-mount');
        if (!mount) { showLoadError('Falta #foja-mount'); return; }
        loadFojaParts(0, mount, next);
      }).catch(function (err) {
        console.error('AnesFact views:', err);
        showLoadError('Usá un servidor local o GitHub Pages.');
      });
      return;
    }
    fetchHtml('views/' + name + '.html')
      .then(function (html) { viewsMount.insertAdjacentHTML('beforeend', html); next(); })
      .catch(function (err) {
        console.error('AnesFact views:', err);
        showLoadError('Usá un servidor local o GitHub Pages.');
      });
  }

  function loadViews(i) {
    if (i >= VIEWS.length) { initApp(); return; }
    loadView(VIEWS[i], function () { loadViews(i + 1); });
  }

  function loadMainShell() {
    fetchHtml('views/topbar.html').then(function (html) {
      topbarMount.innerHTML = html;
      loadViews(0);
    }).catch(function (err) {
      console.error('AnesFact topbar:', err);
      showLoadError('No se pudo cargar la barra superior.');
    });
  }

  function showAuthOnly() {
    topbarMount.innerHTML = '';
    fetchHtml('views/auth.html').then(function (html) {
      viewsMount.innerHTML = html;
      if (typeof authHandleHash === 'function') authHandleHash();
    }).catch(function () {
      viewsMount.innerHTML = '<div class="card" style="margin:16px">No se pudo cargar el login.</div>';
    });
  }

  window.bootMainApp = function () {
    if (mainBooted) return;
    mainBooted = true;
    if (typeof loadIntervsFromStorage === 'function') loadIntervsFromStorage();
    var planP = (typeof loadUserPlan === 'function') ? loadUserPlan() : Promise.resolve();
    planP.then(function () {
      viewsMount.innerHTML = '';
      document.getElementById('app').style.display = 'block';
      loadMainShell();
    });
  };

  function bootstrap() {
    if (typeof AF_AUTH === 'undefined') {
      setTimeout(bootstrap, 40);
      return;
    }
    AF_AUTH.initSession().then(function (ok) {
      if (ok) bootMainApp();
      else showAuthOnly();
    });
  }

  bootstrap();
})();
