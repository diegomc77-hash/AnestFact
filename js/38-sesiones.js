// Sesiones concurrentes: 1 PC + 1 móvil (RPC 008 af_register_session / af_check_session)
var AfSesiones = (function () {
  var SID_KEY = 'af_device_session_id';
  var timer = null;
  var POLL_MS = 45000;

  function deviceType() {
    var ua = (navigator.userAgent || '').toLowerCase();
    if (/android|iphone|ipad|ipod|mobile|opera mini|iemobile|wpdesktop/.test(ua)) return 'mobile';
    // iPadOS 13+ desktop UA: treat tablet as mobile slot
    if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return 'mobile';
    return 'pc';
  }

  function getOrCreateSessionId() {
    try {
      var id = localStorage.getItem(SID_KEY);
      if (id && id.length >= 8) return id;
      id = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : ('s' + Date.now().toString(36) + Math.random().toString(36).slice(2));
      localStorage.setItem(SID_KEY, id);
      return id;
    } catch (e) {
      return 's' + Date.now();
    }
  }

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
          // Si 008 no está, no expulsar al usuario
          if (r.status === 404 || String(t).indexOf(name) >= 0 || String(t).indexOf('PGRST202') >= 0) {
            return { ok: true, skipped: true };
          }
          var err = new Error((data && data.message) || t.slice(0, 80) || ('HTTP ' + r.status));
          err.status = r.status;
          throw err;
        }
        return data;
      });
    });
  }

  function register() {
    if (typeof AF_AUTH === 'undefined' || !AF_AUTH.isLoggedIn || !AF_AUTH.isLoggedIn()) {
      return Promise.resolve(null);
    }
    return rpc('af_register_session', {
      p_device_type: deviceType(),
      p_session_id: getOrCreateSessionId(),
      p_user_agent: (navigator.userAgent || '').slice(0, 240)
    }).then(function (res) {
      if (res && res.replaced_previous) {
        console.info('AnesFact: sesión anterior del mismo tipo de dispositivo reemplazada');
      }
      return res;
    }).catch(function (e) {
      console.warn('AfSesiones.register', e.message || e);
      return null;
    });
  }

  function check() {
    if (typeof AF_AUTH === 'undefined' || !AF_AUTH.isLoggedIn || !AF_AUTH.isLoggedIn()) {
      return Promise.resolve({ valid: false });
    }
    return rpc('af_check_session', {
      p_device_type: deviceType(),
      p_session_id: getOrCreateSessionId()
    }).then(function (res) {
      if (res && res.skipped) return { valid: true, skipped: true };
      if (res && res.valid === false) {
        kick(res.error || 'sesion_reemplazada');
      }
      return res;
    }).catch(function () {
      return { valid: true, skipped: true };
    });
  }

  function kick(reason) {
    stopPolling();
    try {
      alert('Tu sesión se cerró porque iniciaste sesión en otro ' +
        (deviceType() === 'mobile' ? 'celular' : 'PC') +
        ' con la misma cuenta.');
    } catch (e) {}
    if (typeof AF_AUTH !== 'undefined' && AF_AUTH.signOut) AF_AUTH.signOut();
    else window.location.reload();
  }

  function startPolling() {
    stopPolling();
    timer = setInterval(function () { check(); }, POLL_MS);
    // Primer check pronto
    setTimeout(function () { check(); }, 8000);
  }

  function stopPolling() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function onAuthReady() {
    return register().then(function () {
      startPolling();
    });
  }

  function onSignOut() {
    stopPolling();
  }

  return {
    deviceType: deviceType,
    register: register,
    check: check,
    onAuthReady: onAuthReady,
    onSignOut: onSignOut,
    startPolling: startPolling,
    stopPolling: stopPolling
  };
})();
