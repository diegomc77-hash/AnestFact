// Planes por usuario — demo / basico / max / pro / bloqueado
// Fuente de verdad: anesfact_usuarios + RPC af_assert_plan (servidor).
var USER_PLAN = 'demo';
var USER_PROFILE = null;
var USER_IS_ADMIN = false;
var fojasEstaSemana = 0;
var _planAssertCache = {};
var AF_DEMO_FOJAS_SEMANA = 5;

function startOfWeek(d){
  var x = new Date(d);
  var day = x.getDay();
  var diff = (day === 0 ? -6 : 1) - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0,0,0,0);
  return x;
}

function countFojasEstaSemana(){
  var ws = startOfWeek(new Date()).getTime();
  var n = 0;
  (S.intervs||[]).forEach(function(i){
    var ts = i._ts || parseInt(String(i.id).replace(/\D/g,'').slice(0,13),10) || 0;
    if(ts >= ws) n++;
  });
  fojasEstaSemana = n;
  return n;
}

function loadUserPlan(){
  var uid = (typeof AF_AUTH !== 'undefined' && AF_AUTH.getUserId) ? AF_AUTH.getUserId() : '';
  if(!uid){
    USER_PLAN = 'demo';
    USER_IS_ADMIN = false;
    USER_PROFILE = null;
    countFojasEstaSemana();
    if(typeof AfCaptureGuard !== 'undefined') AfCaptureGuard.apply();
    if(typeof AfSanatoriosPlan !== 'undefined') AfSanatoriosPlan.filterSelect();
    return Promise.resolve(USER_PLAN);
  }
  return fetch(afSupabaseUrl() + '/rest/v1/anesfact_usuarios?id=eq.' + encodeURIComponent(uid) + '&select=*&limit=1', {
    headers: afSupabaseHeaders()
  }).then(function(r){
    if(!r.ok) throw new Error('HTTP '+r.status);
    return r.json();
  }).then(function(rows){
    USER_PROFILE = rows && rows[0] ? rows[0] : null;
    USER_IS_ADMIN = !!(USER_PROFILE && USER_PROFILE.rol === 'admin');
    USER_PLAN = (USER_PROFILE && USER_PROFILE.plan) ? USER_PROFILE.plan : 'demo';
    if(USER_IS_ADMIN) USER_PLAN = 'pro';
    if(USER_PROFILE && !USER_PROFILE.activo) USER_PLAN = 'bloqueado';
    if(typeof AfIdentidad !== 'undefined' && USER_PROFILE && USER_PROFILE.nombre){
      AfIdentidad.syncLocal({
        nombre: USER_PROFILE.nombre,
        mp: USER_PROFILE.matricula || '',
        me: USER_PROFILE.matricula_especial || ''
      });
    }
    if(USER_PROFILE && USER_PROFILE.fojas_semana != null && USER_PROFILE.semana_reset){
      var reset = new Date(USER_PROFILE.semana_reset);
      if(startOfWeek(reset).getTime() === startOfWeek(new Date()).getTime()){
        fojasEstaSemana = USER_PROFILE.fojas_semana;
      } else {
        fojasEstaSemana = countFojasEstaSemana();
      }
    } else {
      countFojasEstaSemana();
    }
    _planAssertCache = {};
    return USER_PLAN;
  }).catch(function(err){
    if(!USER_PROFILE){
      USER_PLAN = USER_PLAN || 'demo';
      USER_IS_ADMIN = false;
    }
    countFojasEstaSemana();
    console.warn('loadUserPlan:', err && err.message ? err.message : err);
    return USER_PLAN;
  }).then(function(plan){
    if(typeof refreshAdminUi === 'function') refreshAdminUi();
    if(typeof AfCaptureGuard !== 'undefined') AfCaptureGuard.apply();
    if(typeof AfSanatoriosPlan !== 'undefined') AfSanatoriosPlan.filterSelect();
    if(typeof refreshPlanCardUi === 'function') refreshPlanCardUi();
    return plan;
  });
}

/** Consulta servidor (af_assert_plan). Fallback local si RPC no desplegada. */
function afSanatorioAssertNombre(){
  if(typeof S !== 'undefined' && S.cur && S.cur.san) return String(S.cur.san);
  var el = document.getElementById('f-san');
  return el && el.value ? String(el.value) : '';
}

function assertPlanServer(funcion){
  if(typeof AF_AUTH === 'undefined' || !AF_AUTH.isLoggedIn || !AF_AUTH.isLoggedIn()){
    return Promise.resolve({ ok: false, error: 'no_auth' });
  }
  var san = afSanatorioAssertNombre();
  var cacheKey = funcion + ':' + (USER_PLAN || '') + ':' + san;
  if(_planAssertCache[cacheKey] && (Date.now() - _planAssertCache[cacheKey].t) < 15000){
    return Promise.resolve(_planAssertCache[cacheKey].v);
  }
  return fetch(afSupabaseUrl() + '/rest/v1/rpc/af_assert_plan', {
    method: 'POST',
    headers: afSupabaseHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ p_feature: funcion || '', p_sanatorio: san })
  }).then(function(r){
    if(!r.ok) throw new Error('rpc '+r.status);
    return r.json();
  }).then(function(j){
    _planAssertCache[cacheKey] = { t: Date.now(), v: j };
    if(j && j.plan && !USER_IS_ADMIN) USER_PLAN = j.plan;
    if(j && j.sanatorios && USER_PROFILE) USER_PROFILE.sanatorios_permitidos = j.sanatorios;
    return j;
  }).catch(function(){
    // RPC aún no migrada: usar chequeo local
    return { ok: checkPlanLocal(funcion), local: true };
  });
}

function afSetTileLabel(btn, text){
  if(!btn) return;
  var span = btn.querySelector('span');
  if(span) span.textContent = text;
  else btn.textContent = text;
}
function showPlanModal(title, msg){
  var m = document.getElementById('plan-modal');
  if(!m){ alert(title + '\n\n' + msg); return; }
  document.getElementById('plan-modal-title').textContent = title;
  document.getElementById('plan-modal-msg').textContent = msg;
  var ask = document.getElementById('plan-modal-ask');
  if(ask){ ask.disabled=false; afSetTileLabel(ask,'Activar'); }
  m.style.display = 'flex';
}
function closePlanModal(){
  var m = document.getElementById('plan-modal');
  if(m) m.style.display = 'none';
}

function mostrarMensajeBloqueado(){
  showPlanModal('Cuenta suspendida', 'Tu acceso está bloqueado. Pedí reactivación con el botón de abajo.');
}
function mostrarUpgrade(funcion){
  var labels = { imprimir: 'imprimir fojas', geclisa: 'usar GECLISA / fill.js', foja: 'crear más fojas', sanatorio: 'usar ese sanatorio' };
  showPlanModal('Plan demo', 'La función "' + (labels[funcion]||funcion) + '" requiere un plan activo (básico o pro). Tocá «Solicitar activación» para avisar al administrador.');
}
function afDemoVencido(){
  if(USER_IS_ADMIN) return false;
  if((USER_PLAN || '') !== 'demo') return false;
  var exp = USER_PROFILE && USER_PROFILE.plan_expires_at;
  if(!exp) return false;
  var t = Date.parse(exp);
  return !isNaN(t) && Date.now() >= t;
}

function mostrarDemoVencido(){
  showPlanModal('Demo vencida', 'El mes de prueba terminó. Pedí Básico o Pro para seguir creando fojas. El admin lo ve en el panel.');
}
function mostrarLimiteSemanal(){
  showPlanModal('Límite semanal', 'El plan demo permite 5 fojas por semana (ya las usaste o están contadas). Tocá «Solicitar activación» para pedir un plan completo; el admin lo ve en el panel.');
}

/** Pedido de activación → ticket en nube (admin lo ve). No depende de mailto. */
function solicitarActivacionPlan(){
  if(typeof AF_AUTH==='undefined'||!AF_AUTH.isLoggedIn||!AF_AUTH.isLoggedIn()){
    toast('Iniciá sesión para solicitar activación');
    return;
  }
  var email=(AF_AUTH.getUserEmail&&AF_AUTH.getUserEmail())||'';
  var uid=(AF_AUTH.getUserId&&AF_AUTH.getUserId())||'';
  var nombre=(USER_PROFILE&&USER_PROFILE.nombre)||(localStorage.getItem('af_anest_nombre')||'');
  var wantEl=document.getElementById('plan-modal-want');
  var planPedido=(wantEl&&wantEl.value)||'consultar';
  var planLabels={basico:'Básico (1 lugar; Aero cuenta)',max:'Max (hasta 2 lugares)',pro:'Pro (hasta 3 lugares; más lo carga el admin)',consultar:'No sé — que me contacten'};
  var planLabel=planLabels[planPedido]||planPedido;
  var btn=document.getElementById('plan-modal-ask');
  if(btn){ btn.disabled=true; afSetTileLabel(btn,'Enviando…'); }
  var ticket={
    id:Date.now()+'_'+Math.random().toString(36).slice(2,6),
    fecha:new Date().toISOString(),
    categoria:'plan',
    mensaje:'Pedido desde plan DEMO. Quiere: '+planLabel+'. Email: '+(email||'(sin email)')+'. Facturación: coordinar afuera (transferencia / acuerdo).',
    pasos:'Usuario eligió plan «'+planPedido+'» y tocó Solicitar activación.',
    vista:'plan-modal',
    version:'AnesFact v11.3',
    anestesista:nombre,
    email:email,
    user_id:uid,
    plan_actual:USER_PLAN||'demo',
    plan_pedido:planPedido,
    ua:(navigator.userAgent||'').slice(0,180),
    estado:'nuevo'
  };
  var send=(typeof postHelpTicket==='function')
    ? postHelpTicket(ticket)
    : Promise.reject(new Error('ayuda no cargada'));
  send.then(function(r){
    if(!r.ok&&r.status!==201){
      return r.text().then(function(t){ throw new Error('HTTP '+r.status+': '+String(t).slice(0,80)); });
    }
    try{
      var list=typeof getHelpLocal==='function'?getHelpLocal():[];
      ticket.enviado=true;
      list.unshift(ticket);
      if(typeof saveHelpLocal==='function') saveHelpLocal(list);
    }catch(e){}
    toast('Pedido enviado ✓ — el admin lo ve en el panel');
    if(btn){ btn.disabled=false; afSetTileLabel(btn,'Enviado ✓'); }
    setTimeout(function(){ closePlanModal(); if(btn){ btn.disabled=false; afSetTileLabel(btn,'Activar'); } }, 1200);
  }).catch(function(e){
    console.warn('solicitarActivacionPlan', e);
    toast('No se pudo enviar el pedido. Probá de nuevo o escribinos por WhatsApp.');
    if(btn){ btn.disabled=false; afSetTileLabel(btn,'Activar'); }
  });
}

function checkPlanLocal(funcion){
  if(USER_IS_ADMIN) return true;
  if(USER_PLAN === 'bloqueado'){ return false; }
  if(afDemoVencido()) return false;
  if(funcion === 'imprimir' && USER_PLAN === 'demo'){ return false; }
  if(funcion === 'geclisa' && USER_PLAN === 'demo'){ return false; }
  if(funcion === 'foja' && USER_PLAN === 'demo'){
    if(typeof USER_PROFILE !== 'undefined' && USER_PROFILE && USER_PROFILE.fojas_semana != null){
      return USER_PROFILE.fojas_semana < AF_DEMO_FOJAS_SEMANA;
    }
    countFojasEstaSemana();
    if(fojasEstaSemana >= AF_DEMO_FOJAS_SEMANA) return false;
  }
  return true;
}

function checkPlan(funcion){
  if(USER_IS_ADMIN) return true;
  if(USER_PLAN === 'bloqueado'){ mostrarMensajeBloqueado(); return false; }
  if(afDemoVencido()){ mostrarDemoVencido(); return false; }
  if(funcion === 'imprimir' && USER_PLAN === 'demo'){ mostrarUpgrade('imprimir'); return false; }
  if(funcion === 'geclisa' && USER_PLAN === 'demo'){ mostrarUpgrade('geclisa'); return false; }
  if(funcion === 'foja' && USER_PLAN === 'demo'){
    var n = (USER_PROFILE && USER_PROFILE.fojas_semana != null) ? USER_PROFILE.fojas_semana : fojasEstaSemana;
    if(n >= AF_DEMO_FOJAS_SEMANA){ mostrarLimiteSemanal(); return false; }
  }
  return true;
}

function handleAssertFail(res, funcion){
  if(!res || res.ok) return true;
  if(res.error === 'bloqueado'){ mostrarMensajeBloqueado(); return false; }
  if(res.error === 'demo_vencido'){ mostrarDemoVencido(); return false; }
  if(res.error === 'limite_semanal'){ mostrarLimiteSemanal(); return false; }
  if(res.error === 'sanatorio_no_permitido'){
    if(typeof showPlanModal === 'function'){
      showPlanModal('Sanatorio no incluido', 'Tu plan no incluye "' + (res.sanatorio || '') + '". Elegí uno permitido o pedí ampliar el plan.');
    }
    return false;
  }
  if(res.error === 'upgrade'){ mostrarUpgrade(funcion || res.feature); return false; }
  if(res.ok === false && !res.local){ mostrarUpgrade(funcion); return false; }
  if(res.local === true && res.ok === false){
    if(funcion === 'foja') mostrarLimiteSemanal();
    else if(USER_PLAN === 'bloqueado') mostrarMensajeBloqueado();
    else if(afDemoVencido()) mostrarDemoVencido();
    else mostrarUpgrade(funcion);
    return false;
  }
  return true;
}

function imprimirFojaGuarded(){
  if(!checkPlan('imprimir')) return;
  assertPlanServer('imprimir').then(function(res){
    if(!handleAssertFail(res, 'imprimir')) return;
    if(typeof imprimirFoja === 'function') imprimirFoja();
  });
}

function nuevaInterGuarded(){
  if(!checkPlan('foja')) return;
  assertPlanServer('foja').then(function(res){
    if(!handleAssertFail(res, 'foja')) return;
    // No contar acá: abrir «Nueva» sin guardar no consume la foja demo.
    nuevaInter();
  });
}

function bumpFojaSemana(){
  if(USER_PLAN !== 'demo' || USER_IS_ADMIN) return;
  if(typeof AF_AUTH === 'undefined' || !AF_AUTH.getUserId || !AF_AUTH.getUserId()) return;
  fetch(afSupabaseUrl() + '/rest/v1/rpc/af_consume_foja', {
    method: 'POST',
    headers: afSupabaseHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({})
  }).then(function(r){
    if(!r.ok) throw new Error('rpc '+r.status);
    return r.json();
  }).then(function(j){
    if(j && j.fojas_semana != null){
      fojasEstaSemana = j.fojas_semana;
      if(USER_PROFILE) USER_PROFILE.fojas_semana = j.fojas_semana;
    }
    if(j && j.ok === false){
      S.cur && (S.cur._demoCounted = false);
      if(typeof handleAssertFail === 'function') handleAssertFail(j, 'foja');
    }
  }).catch(function(){
    if(S.cur) S.cur._demoCounted = false;
  });
}

/** Cuenta la foja demo solo al guardar con datos mínimos (nombre o DNI). */
function maybeBumpDemoFojaOnSave(){
  if(USER_PLAN !== 'demo' || !S.cur) return;
  if(S.cur._demoCounted) return;
  var pac = String(S.cur.pac || '').trim();
  var dni = String(S.cur.dni || '').trim().replace(/^0+/, '');
  if(pac.length < 2 && !/^\d{7,9}$/.test(dni)) return;
  S.cur._demoCounted = true;
  bumpFojaSemana();
}

function planBadgeText(){
  if(USER_IS_ADMIN) return 'Admin';
  if(!USER_PLAN) return '';
  return 'Plan: ' + USER_PLAN;
}

function refreshPlanCardUi(){
  var actual = document.getElementById('cfg-plan-actual');
  var detail = document.getElementById('cfg-plan-detail');
  var btn = document.getElementById('cfg-plan-ask-btn');
  var card = document.getElementById('cfg-plan-card');
  var pb = document.getElementById('plan-badge');
  if(pb){
    pb.textContent = planBadgeText();
    pb.style.cursor = USER_IS_ADMIN ? 'default' : 'pointer';
    pb.title = USER_IS_ADMIN ? '' : 'Tocar para pedir o cambiar plan';
  }
  if(!actual && !detail) return;
  if(USER_IS_ADMIN){
    if(card) card.style.display = 'none';
    return;
  }
  if(card) card.style.display = '';
  var plan = USER_PLAN || 'demo';
  if(actual) actual.textContent = 'Plan actual: ' + plan;
  var texts = {
    demo: 'Demo: 1 mes, 5 fojas/semana, sin imprimir ni GECLISA. Pedí Básico, Max o Pro cuando quieras.',
    basico: 'Básico: 1 lugar (Aero cuenta) y 1 hospital público. Pedí Max (2) o Pro (3) si necesitás más.',
    max: 'Max: hasta 2 lugares (Aero cuenta) y 1 hospital público. Pedí Pro si necesitás un tercero.',
    pro: 'Pro: hasta 3 lugares (Aero cuenta) y 1 hospital público. Más lugares los carga el admin.',
    bloqueado: 'Cuenta suspendida. Pedí reactivación acá.'
  };
  if(detail) detail.textContent = texts[plan] || ('Plan: ' + plan);
  if(btn){
    btn.style.display = '';
    afSetTileLabel(btn, (plan === 'demo' || plan === 'bloqueado') ? 'Pedir plan' : 'Cambiar');
  }
}

/** Abrir pedido desde Ajustes / badge — no hace falta chocar con un límite. */
function pedirCambioPlan(){
  if(USER_IS_ADMIN){ toast('Sos admin: cambiá planes en el panel'); return; }
  var plan = USER_PLAN || 'demo';
  var titles = {
    demo: 'Activar plan',
    basico: 'Cambiar plan',
    max: 'Cambiar plan',
    pro: 'Consultar / cambiar plan',
    bloqueado: 'Reactivar cuenta'
  };
  var msgs = {
    demo: 'Estás en plan demo (1 mes, 5 fojas/semana). Elegí Básico (1 lugar), Max (2) o Pro (3) y enviá el pedido. El admin lo ve en el panel; la facturación se coordina afuera.',
    basico: 'Ya tenés Básico (1 lugar). Si querés Max (2) o Pro (3), elegí abajo y enviá el pedido.',
    max: 'Ya tenés Max (2 lugares). Si querés Pro (3) u otro cambio, elegí abajo y enviá el pedido.',
    pro: 'Ya tenés Pro. Si necesitás otro arreglo, elegí abajo o «No sé» y enviá el pedido.',
    bloqueado: 'Tu cuenta está suspendida. Enviá el pedido para que el admin la reactive.'
  };
  showPlanModal(titles[plan] || 'Pedir plan', msgs[plan] || 'Elegí el plan que necesitás y enviá el pedido.');
  var want = document.getElementById('plan-modal-want');
  if(want){
    if(plan === 'demo') want.value = 'basico';
    else if(plan === 'basico') want.value = 'max';
    else if(plan === 'max') want.value = 'pro';
    else want.value = 'consultar';
  }
}
