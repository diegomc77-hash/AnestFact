(function () {
  var banner = document.getElementById('offline-banner');
  function setOffline(on) {
    if (!banner) return;
    banner.style.display = on ? 'block' : 'none';
  }
  window.addEventListener('online', function () { setOffline(false); });
  window.addEventListener('offline', function () { setOffline(true); });
  if (typeof navigator !== 'undefined' && !navigator.onLine) setOffline(true);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js?v=12.38').then(function (reg) {
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        navigator.serviceWorker.addEventListener('message', function (ev) {
          if (ev.data && ev.data.type === 'anesfact-offline') setOffline(true);
          if (ev.data && ev.data.type === 'anesfact-online') setOffline(false);
        });
      }).catch(function () {});
    });
  }

  /* ——— Install prompts (iOS / Android) ——— */
  var LS_IOS = 'af_install_ios_dismiss';
  var LS_AND = 'af_install_and_dismiss';
  var deferredPrompt = null;

  function isIos() {
    var ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function isStandalone() {
    if (typeof navigator !== 'undefined' && navigator.standalone === true) return true;
    try {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
    } catch (e) {}
    return false;
  }

  function ensureInstallBanner() {
    var el = document.getElementById('af-install-banner');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'af-install-banner';
    el.className = 'af-install-banner';
    el.style.display = 'none';
    el.innerHTML =
      '<div class="af-install-banner-inner">' +
      '<div class="af-install-banner-text" id="af-install-text"></div>' +
      '<div class="af-install-banner-actions">' +
      '<button type="button" class="btn btn-g" id="af-install-action" style="display:none;font-size:12px;padding:8px 12px;width:auto">Instalar</button>' +
      '<button type="button" class="btn btn-s" id="af-install-dismiss" style="font-size:12px;padding:8px 12px;width:auto">Ahora no</button>' +
      '</div></div>';
    document.body.appendChild(el);
    return el;
  }

  function hideInstallBanner() {
    var el = document.getElementById('af-install-banner');
    if (el) el.style.display = 'none';
  }

  function showIosInstallBanner() {
    if (!isIos() || isStandalone()) return;
    try {
      if (localStorage.getItem(LS_IOS) === '1') return;
    } catch (e) { return; }
    var el = ensureInstallBanner();
    var text = document.getElementById('af-install-text');
    var action = document.getElementById('af-install-action');
    var dismiss = document.getElementById('af-install-dismiss');
    if (text) {
      text.textContent =
        'Instalá AnesFact (Compartir → Agregar a inicio) para no perder los datos guardados y poder usarla sin conexión. En Safari, sin instalar, el sistema puede borrar datos locales tras un tiempo sin uso.';
    }
    if (action) action.style.display = 'none';
    if (dismiss) {
      dismiss.onclick = function () {
        try { localStorage.setItem(LS_IOS, '1'); } catch (e2) {}
        hideInstallBanner();
      };
    }
    el.style.display = 'block';
  }

  function showAndroidInstallBanner() {
    if (isStandalone() || isIos()) return;
    try {
      if (localStorage.getItem(LS_AND) === '1') return;
    } catch (e) { return; }
    if (!deferredPrompt) return;
    var el = ensureInstallBanner();
    var text = document.getElementById('af-install-text');
    var action = document.getElementById('af-install-action');
    var dismiss = document.getElementById('af-install-dismiss');
    if (text) {
      text.textContent =
        'Instalá AnesFact para no perder los datos guardados y poder usarla sin conexión.';
    }
    if (action) {
      action.style.display = 'inline-block';
      action.onclick = function () {
        var ev = deferredPrompt;
        deferredPrompt = null;
        if (!ev || typeof ev.prompt !== 'function') {
          hideInstallBanner();
          return;
        }
        ev.prompt();
        Promise.resolve(ev.userChoice).then(function () {
          hideInstallBanner();
        }).catch(function () {
          hideInstallBanner();
        });
      };
    }
    if (dismiss) {
      dismiss.onclick = function () {
        try { localStorage.setItem(LS_AND, '1'); } catch (e2) {}
        deferredPrompt = null;
        hideInstallBanner();
      };
    }
    el.style.display = 'block';
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    showAndroidInstallBanner();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showIosInstallBanner);
  } else {
    showIosInstallBanner();
  }
})();
