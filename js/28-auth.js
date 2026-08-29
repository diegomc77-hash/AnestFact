// Supabase Auth — login individual (reemplaza clave única de seguridad.js)
// SUPABASE_ANON_KEY — clave pública por diseño
// Los datos están protegidos por Row Level Security (RLS)
// Ver: https://supabase.com/docs/guides/auth/row-level-security

var AF_AUTH = (function(){
  var SESSION_KEY = 'af_auth_session';
  var ready = false;
  var user = null;
  var session = null;

  function authUrl(path){ return afSupabaseUrl() + '/auth/v1' + path; }

  function saveSession(s){
    session = s;
    user = s && s.user ? s.user : null;
    try{ localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }catch(e){}
  }

  function loadStoredSession(){
    try{
      var raw = localStorage.getItem(SESSION_KEY);
      if(!raw) return null;
      return JSON.parse(raw);
    }catch(e){ return null; }
  }

  function clearSession(){
    session = null;
    user = null;
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('anesfact_sesion_ok');
  }

  function authHeaders(json){
    var h = { 'apikey': AF_SUPABASE_KEY };
    if(json) h['Content-Type'] = 'application/json';
    return h;
  }

  function getAccessToken(){
    if(session && session.access_token) return session.access_token;
    var s = loadStoredSession();
    return s && s.access_token ? s.access_token : '';
  }

  function getUserId(){
    if(user && user.id) return user.id;
    var s = loadStoredSession();
    return s && s.user && s.user.id ? s.user.id : '';
  }

  function isLoggedIn(){ return !!getAccessToken() && !!getUserId(); }

  function getUserEmail(){
    if(user && user.email) return user.email;
    var s = loadStoredSession();
    return s && s.user && s.user.email ? s.user.email : '';
  }

  function syncUserEmail(uid){
    var em = getUserEmail();
    if(!em || !uid) return Promise.resolve();
    return fetch(afSupabaseUrl() + '/rest/v1/anesfact_usuarios?id=eq.' + encodeURIComponent(uid), {
      method: 'PATCH',
      headers: afSupabaseHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
      body: JSON.stringify({ email: em })
    }).catch(function(){});
  }

  function claimOwnerAdminIfNeeded(){
    var em = (getUserEmail() || '').toLowerCase();
    var list = (typeof AF_OWNER_EMAILS !== 'undefined' && AF_OWNER_EMAILS) ? AF_OWNER_EMAILS : [];
    if(!em || !list.length) return Promise.resolve();
    var ok = false;
    for(var i = 0; i < list.length; i++){
      if(String(list[i]).toLowerCase() === em){ ok = true; break; }
    }
    if(!ok) return Promise.resolve();
    return fetch(afSupabaseUrl() + '/rest/v1/rpc/af_claim_owner_admin', {
      method: 'POST',
      headers: afSupabaseHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ p_email: em })
    }).catch(function(){});
  }

  function ensureUserProfile(uid){
    return fetchUserProfile(uid).then(function(row){
      if(row) return row;
      var em = getUserEmail();
      return createUserProfile(uid, '', '', '', em).then(function(){
        return fetchUserProfile(uid);
      });
    });
  }

  function afterAuthProfileLoad(){
    var uid = getUserId();
    return ensureUserProfile(uid).then(function(){
      return syncUserEmail(uid);
    }).then(function(){
      return claimOwnerAdminIfNeeded();
    }).then(function(){
      if(typeof loadUserPlan === 'function') return loadUserPlan();
    });
  }

  function applyUserProfile(profile){
    if(!profile) return;
    if(profile.nombre) localStorage.setItem('af_anest_nombre', String(profile.nombre).toUpperCase());
    if(profile.matricula) localStorage.setItem('af_anest_mp', profile.matricula);
    if(profile.matricula_especial) localStorage.setItem('af_anest_me', profile.matricula_especial);
  }

  function fetchUserProfile(uid){
    return fetch(afSupabaseUrl() + '/rest/v1/anesfact_usuarios?id=eq.' + encodeURIComponent(uid) + '&select=*&limit=1', {
      headers: afSupabaseHeaders()
    }).then(function(r){
      if(!r.ok) return null;
      return r.json();
    }).then(function(rows){
      if(rows && rows[0]) applyUserProfile(rows[0]);
      return rows && rows[0] ? rows[0] : null;
    }).catch(function(){ return null; });
  }

  function createUserProfile(uid, nombre, mp, me, email){
    return fetch(afSupabaseUrl() + '/rest/v1/anesfact_usuarios', {
      method: 'POST',
      headers: afSupabaseHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
      body: JSON.stringify({
        id: uid,
        email: email || getUserEmail() || '',
        nombre: nombre,
        matricula: mp,
        matricula_especial: me || ''
      })
    }).then(function(r){
      if(r.ok || r.status === 201 || r.status === 204) return true;
      return r.text().then(function(t){
        var msg = t || ('HTTP ' + r.status);
        try {
          var j = JSON.parse(t);
          if(j && j.message) msg = j.message;
        } catch (e1) {}
        throw new Error(msg);
      });
    });
  }

  function refreshSession(refreshToken){
    return fetch(authUrl('/token?grant_type=refresh_token'), {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({ refresh_token: refreshToken })
    }).then(function(r){
      return r.json().then(function(data){
        if(!r.ok) throw new Error(data.msg || data.error_description || 'Sesión expirada');
        var merged = {
          access_token: data.access_token,
          refresh_token: data.refresh_token || refreshToken,
          expires_at: data.expires_at || (Math.floor(Date.now()/1000) + (data.expires_in||3600)),
          user: data.user || (session && session.user) || (user ? { id: user.id, email: user.email } : null)
        };
        saveSession(merged);
        return merged;
      });
    });
  }

  function initSession(){
    var stored = loadStoredSession();
    if(!stored || !stored.access_token){
      ready = true;
      return Promise.resolve(false);
    }
    session = stored;
    user = stored.user || null;
    var p = Promise.resolve(stored);
    if(stored.refresh_token){
      p = refreshSession(stored.refresh_token).catch(function(){
        clearSession();
        return null;
      });
    }
    return p.then(function(s){
      if(!s) { ready = true; return false; }
      return afterAuthProfileLoad().then(function(){
        ready = true;
        if(typeof AfSesiones!=='undefined'&&AfSesiones.onAuthReady)AfSesiones.onAuthReady();
        if(typeof afSyncValoracionesPreop==='function')afSyncValoracionesPreop();
        return true;
      });
    });
  }

  function authErrMsg(data, fallback){
    if(!data) return fallback;
    var code = data.error_code || data.code || '';
    if(code === 'over_email_send_rate_limit') return 'Supabase bloqueó emails por exceso de intentos. Esperá 1 hora o reseteá la contraseña desde el panel de Supabase (Authentication → Users).';
    if(code === 'user_already_exists') return 'Ese email ya está registrado. Usá «Olvidé mi contraseña» o confirmá el email que te llegó al registrarte.';
    if(code === 'email_not_confirmed') return 'Tenés que confirmar el email antes de ingresar. Revisá la bandeja (y spam) o pedile a quien administra Supabase que confirme tu cuenta.';
    return data.error_description || data.msg || data.message || fallback;
  }

  function signIn(email, password){
    return fetch(authUrl('/token?grant_type=password'), {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({ email: email, password: password })
    }).then(function(r){
      return r.json().then(function(data){
        if(!r.ok) throw new Error(authErrMsg(data, 'Credenciales inválidas'));
        saveSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at || (Math.floor(Date.now()/1000) + (data.expires_in||3600)),
          user: data.user
        });
        return afterAuthProfileLoad().then(function(){
          if(typeof AfSesiones!=='undefined'&&AfSesiones.onAuthReady)AfSesiones.onAuthReady();
          if(typeof afSyncValoracionesPreop==='function')afSyncValoracionesPreop();
          return true;
        });
      });
    });
  }

  function signUp(email, password, nombre, mp, me){
    return fetch(authUrl('/signup'), {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({
        email: email,
        password: password,
        data: { nombre: nombre, matricula: mp }
      })
    }).then(function(r){
      return r.json().then(function(data){
        if(!r.ok) throw new Error(authErrMsg(data, 'No se pudo registrar'));
        var uid = data.user && data.user.id;
        var tok = data.access_token;
        if(!uid) throw new Error('Registro incompleto — revisá el email de confirmación');
        if(!tok){
          var needConfirm = data.user && (data.user.confirmation_sent_at || !data.user.email_confirmed_at);
          if(needConfirm) throw new Error('Cuenta creada. Abrí el link de confirmación en tu email (revisá spam) y después ingresá. Si no llega, desactivá confirmación en Supabase o confirmá manualmente en Authentication → Users.');
        }
        if(tok){
          saveSession({
            access_token: tok,
            refresh_token: data.refresh_token,
            expires_at: data.expires_at,
            user: data.user
          });
        }
        return createUserProfile(uid, nombre, mp, me, email).then(function(){
          applyUserProfile({ nombre: nombre, matricula: mp, matricula_especial: me, plan: 'demo' });
          if(typeof loadUserPlan === 'function') loadUserPlan();
          if(!tok) return signIn(email, password);
        });
      });
    });
  }

  function authRedirectUrl(){
    var base = window.location.origin + window.location.pathname;
    return base.replace(/\/index\.html$/i, '/').replace(/\/?$/, '/');
  }

  function recoverPassword(email){
    return fetch(authUrl('/recover'), {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({ email: email, redirect_to: authRedirectUrl() })
    }).then(function(r){
      return r.json().then(function(data){
        if(!r.ok) throw new Error(authErrMsg(data, 'Error al enviar email'));
      });
    });
  }

  function updatePassword(accessToken, password){
    return fetch(authUrl('/user'), {
      method: 'PUT',
      headers: {
        'apikey': AF_SUPABASE_KEY,
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: password })
    }).then(function(r){
      return r.json().then(function(data){
        if(!r.ok) throw new Error(data.msg || data.error_description || 'No se pudo cambiar la contraseña');
      });
    });
  }

  function signOut(){
    var tok = getAccessToken();
    if(typeof AfSesiones!=='undefined'&&AfSesiones.onSignOut)AfSesiones.onSignOut();
    clearSession();
    if(tok){
      fetch(authUrl('/logout'), {
        method: 'POST',
        headers: { 'apikey': AF_SUPABASE_KEY, 'Authorization': 'Bearer ' + tok }
      }).catch(function(){});
    }
    window.location.reload();
  }

  return {
    ready: false,
    initSession: initSession,
    signIn: signIn,
    signUp: signUp,
    recoverPassword: recoverPassword,
    updatePassword: updatePassword,
    signOut: signOut,
    getAccessToken: getAccessToken,
    getUserId: getUserId,
    getUserEmail: getUserEmail,
    isLoggedIn: isLoggedIn,
    get user(){ return user; }
  };
})();

function authShowRegister(){
  document.getElementById('auth-panel-login').style.display='none';
  document.getElementById('auth-panel-register').style.display='block';
  var rp=document.getElementById('auth-panel-reset'); if(rp) rp.style.display='none';
}
function authShowLogin(){
  document.getElementById('auth-panel-register').style.display='none';
  var rp=document.getElementById('auth-panel-reset'); if(rp) rp.style.display='none';
  document.getElementById('auth-panel-login').style.display='block';
}
function authSetErr(id,msg){ var el=document.getElementById(id); if(el){ el.textContent=msg||''; el.style.display=msg?'block':'none'; } }

function authSignIn(){
  var email=(document.getElementById('auth-email')||{}).value.trim();
  var pass=(document.getElementById('auth-pass')||{}).value;
  authSetErr('auth-err','');
  if(!email||!pass){ authSetErr('auth-err','Completá email y contraseña'); return; }
  AF_AUTH.signIn(email,pass).then(function(){
    if(typeof bootMainApp==='function') bootMainApp();
  }).catch(function(e){
    var msg=e.message||'Error al ingresar';
    if(/invalid login credentials/i.test(msg)) msg='Contraseña incorrecta o email sin confirmar. Si registraste hoy, revisá el mail de confirmación. Si pediste muchos resets, Supabase bloqueó emails ~1 h — reseteá desde Supabase → Authentication → Users.';
    authSetErr('auth-err',msg);
  });
}

function authSignUp(){
  var email=(document.getElementById('reg-email')||{}).value.trim();
  var p1=(document.getElementById('reg-pass')||{}).value;
  var p2=(document.getElementById('reg-pass2')||{}).value;
  var nombre=(document.getElementById('reg-nombre')||{}).value.trim().toUpperCase();
  var mp=(document.getElementById('reg-mp')||{}).value.trim();
  var me=(document.getElementById('reg-me')||{}).value.trim();
  authSetErr('reg-err','');
  if(!email||!p1||!nombre||!mp){ authSetErr('reg-err','Completá email, contraseña, nombre y M.P.'); return; }
  if(p1.length<6){ authSetErr('reg-err','La contraseña debe tener al menos 6 caracteres'); return; }
  if(p1!==p2){ authSetErr('reg-err','Las contraseñas no coinciden'); return; }
  AF_AUTH.signUp(email,p1,nombre,mp,me).then(function(){
    if(typeof bootMainApp==='function') bootMainApp();
  }).catch(function(e){ authSetErr('reg-err',e.message||'Error al registrar'); });
}

function authRecover(){
  var email=(document.getElementById('auth-email')||{}).value.trim();
  if(!email){ authSetErr('auth-err','Ingresá tu email primero'); return; }
  authSetErr('auth-err','');
  AF_AUTH.recoverPassword(email).then(function(){
    authSetErr('auth-err','Te enviamos un email. Abrí el link en menos de 1 hora (misma URL donde estás ahora: '+window.location.origin+').');
  }).catch(function(e){ authSetErr('auth-err',e.message); });
}

function authShowResetPanel(){
  ['auth-panel-login','auth-panel-register'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.style.display='none';
  });
  var rp=document.getElementById('auth-panel-reset');
  if(rp) rp.style.display='block';
}

function authApplyReset(){
  var tok=window._afRecoveryToken;
  var p1=(document.getElementById('reset-pass')||{}).value;
  var p2=(document.getElementById('reset-pass2')||{}).value;
  authSetErr('reset-err','');
  if(!tok){ authSetErr('reset-err','Link inválido — pedí otro email de recuperación'); return; }
  if(!p1||p1.length<6){ authSetErr('reset-err','Mínimo 6 caracteres'); return; }
  if(p1!==p2){ authSetErr('reset-err','Las contraseñas no coinciden'); return; }
  AF_AUTH.updatePassword(tok,p1).then(function(){
    delete window._afRecoveryToken;
    var rp=document.getElementById('auth-panel-reset'); if(rp) rp.style.display='none';
    authShowLogin();
    authSetErr('auth-err','Contraseña actualizada. Ingresá con la nueva contraseña.');
  }).catch(function(e){ authSetErr('reset-err',e.message||'Error'); });
}

function authHandleHash(){
  var h=(window.location.hash||'').replace(/^#/,'');
  if(!h) return;
  var p=new URLSearchParams(h);
  var err=p.get('error');
  if(err){
    var desc=p.get('error_description')||err;
    desc=decodeURIComponent(String(desc).replace(/\+/g,' '));
    if(p.get('error_code')==='otp_expired'){
      desc='El link del email expiró o ya se usó. Ingresá tu email, tocá «Olvidé mi contraseña» y abrí el link nuevo en menos de 1 hora.';
    }
    authSetErr('auth-err',desc);
    history.replaceState(null,'',window.location.pathname+window.location.search);
    return;
  }
  var type=p.get('type');
  var tok=p.get('access_token');
  if(type==='recovery'&&tok){
    window._afRecoveryToken=tok;
    authShowResetPanel();
    history.replaceState(null,'',window.location.pathname+window.location.search);
  }
}

function authLogout(){ AF_AUTH.signOut(); }
