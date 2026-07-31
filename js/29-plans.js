// Planes por usuario — demo / basico / pro / bloqueado
var USER_PLAN = 'demo';
var USER_PROFILE = null;
var USER_IS_ADMIN = false;
var fojasEstaSemana = 0;

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
    countFojasEstaSemana();
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
    return USER_PLAN;
  }).catch(function(){
    USER_PLAN = 'demo';
    USER_IS_ADMIN = false;
    countFojasEstaSemana();
    return USER_PLAN;
  }).then(function(plan){
    if(typeof refreshAdminUi === 'function') refreshAdminUi();
    return plan;
  });
}

function showPlanModal(title, msg){
  var m = document.getElementById('plan-modal');
  if(!m){ alert(title + '\n\n' + msg); return; }
  document.getElementById('plan-modal-title').textContent = title;
  document.getElementById('plan-modal-msg').textContent = msg;
  m.style.display = 'flex';
}
function closePlanModal(){
  var m = document.getElementById('plan-modal');
  if(m) m.style.display = 'none';
}

function mostrarMensajeBloqueado(){
  showPlanModal('Cuenta suspendida', 'Tu acceso está bloqueado. Contactanos para reactivar el plan.');
}
function mostrarUpgrade(funcion){
  var labels = { imprimir: 'imprimir fojas', geclisa: 'usar GECLISA / fill.js', foja: 'crear más fojas' };
  showPlanModal('Plan demo', 'La función "' + (labels[funcion]||funcion) + '" requiere un plan activo (básico o pro).');
}
function mostrarLimiteSemanal(){
  showPlanModal('Límite semanal', 'El plan demo permite 1 foja por semana. Contactanos para activar un plan completo.');
}

function checkPlan(funcion){
  if(USER_IS_ADMIN) return true;
  if(USER_PLAN === 'bloqueado'){ mostrarMensajeBloqueado(); return false; }
  if(funcion === 'imprimir' && USER_PLAN === 'demo'){ mostrarUpgrade('imprimir'); return false; }
  if(funcion === 'geclisa' && USER_PLAN === 'demo'){ mostrarUpgrade('geclisa'); return false; }
  if(funcion === 'foja' && USER_PLAN === 'demo'){
    countFojasEstaSemana();
    if(fojasEstaSemana >= 1){ mostrarLimiteSemanal(); return false; }
  }
  return true;
}

function imprimirFojaGuarded(){
  if(!checkPlan('imprimir')) return;
  imprimirFoja();
}

function nuevaInterGuarded(){
  if(!checkPlan('foja')) return;
  nuevaInter();
  bumpFojaSemana();
}

function bumpFojaSemana(){
  if(USER_PLAN !== 'demo') return;
  fojasEstaSemana++;
  var uid = AF_AUTH && AF_AUTH.getUserId ? AF_AUTH.getUserId() : '';
  if(!uid) return;
  fetch(afSupabaseUrl() + '/rest/v1/anesfact_usuarios?id=eq.' + encodeURIComponent(uid), {
    method: 'PATCH',
    headers: afSupabaseHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
    body: JSON.stringify({ fojas_semana: fojasEstaSemana, semana_reset: new Date().toISOString().slice(0,10) })
  }).catch(function(){});
}

function planBadgeText(){
  if(USER_IS_ADMIN) return 'Admin';
  if(!USER_PLAN) return '';
  return 'Plan: ' + USER_PLAN;
}
