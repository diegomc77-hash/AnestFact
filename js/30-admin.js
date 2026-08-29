// Panel admin — UI only; permisos reales en Supabase (RLS + RPC af_is_admin)

function isAdmin(){
  return USER_IS_ADMIN === true;
}

function adminSetStatus(msg, ok){
  var el = document.getElementById('admin-status');
  if(!el) return;
  el.textContent = msg || '';
  el.style.color = ok === false ? 'var(--red)' : ok === true ? 'var(--green)' : 'var(--text3)';
}

function adminRpc(name, body){
  return fetch(afSupabaseUrl() + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: afSupabaseHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body || {})
  }).then(function(r){
    if(r.ok) return r.json();
    return r.text().then(function(t){
      var err = new Error(t || ('HTTP ' + r.status));
      err.status = r.status;
      throw err;
    });
  });
}

function adminPatchUser(uid, patch){
  // Preferir RPC (bypassa RLS de INSERT ajeno). Fallback PATCH directo.
  if(patch && patch.plan){
    return adminRpc('af_admin_set_plan', { p_user_id: uid, p_plan: patch.plan }).then(function(){ return true; });
  }
  return fetch(afSupabaseUrl() + '/rest/v1/anesfact_usuarios?id=eq.' + encodeURIComponent(uid), {
    method: 'PATCH',
    headers: afSupabaseHeaders({
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    }),
    body: JSON.stringify(patch || {})
  }).then(function(r){
    if(r.ok || r.status === 204) return true;
    return r.text().then(function(t){ throw new Error(t || ('HTTP ' + r.status)); });
  });
}

function adminEscape(s){
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
}

function adminPlanOptions(current){
  var plans = ['demo','basico','pro','bloqueado'];
  return plans.map(function(p){
    return '<option value="'+p+'"'+(p===current?' selected':'')+'>'+p+'</option>';
  }).join('');
}

function renderAdminUsers(rows){
  var box = document.getElementById('admin-user-list');
  if(!box) return;
  if(!rows || !rows.length){
    box.innerHTML = '<p class="admin-muted">Sin usuarios en anesfact_usuarios.</p>';
    return;
  }
  var html = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>'
    +'<th>Email / Nombre</th><th>Plan</th><th>Fojas nube</th><th>Semana</th><th>Estado</th><th></th>'
    +'</tr></thead><tbody>';
  rows.forEach(function(u){
    var uid = u.id;
    var label = (u.email || u.nombre || uid.slice(0,8));
    var sub = u.nombre && u.email ? ('<div class="admin-sub">'+adminEscape(u.nombre)+'</div>') : '';
    html += '<tr data-uid="'+adminEscape(uid)+'">'
      +'<td><div>'+adminEscape(label)+'</div>'+sub
      +'<div class="admin-sub">'+adminEscape(uid)+'</div></td>'
      +'<td><select class="fi admin-plan" data-uid="'+adminEscape(uid)+'" style="font-size:12px;padding:6px">'
      +adminPlanOptions(u.plan)+'</select></td>'
      +'<td>'+(u.sync_fojas != null ? u.sync_fojas : '—')+'</td>'
      +'<td>'+(u.fojas_semana != null ? u.fojas_semana : 0)+'</td>'
      +'<td>'+(u.activo === false ? '<span class="admin-badge admin-badge-off">off</span>' : '<span class="admin-badge admin-badge-on">ok</span>')
      +(u.rol === 'admin' ? ' <span class="admin-badge admin-badge-admin">admin</span>' : '')+'</td>'
      +'<td class="admin-actions">'
      +'<button type="button" class="btn btn-g admin-save" data-uid="'+adminEscape(uid)+'" style="width:auto;padding:6px 10px;font-size:11px">Guardar plan</button>'
      +'</td></tr>'
      +'<tr class="admin-san-row"><td colspan="6">'
      +'<div class="admin-sub" style="margin-bottom:4px">Lugares (un nombre por línea). Tope extra &gt;3 solo si hace falta.</div>'
      +'<textarea class="fi admin-sans" data-uid="'+adminEscape(uid)+'" rows="3" style="width:100%;font-size:12px">'
      +adminEscape((u.sanatorios_permitidos||[]).join('\n'))+'</textarea>'
      +'<div style="display:flex;gap:8px;align-items:center;margin-top:6px;flex-wrap:wrap">'
      +'<label class="admin-sub" style="margin:0">Tope extra <input class="fi admin-override" data-uid="'+adminEscape(uid)+'" data-orig="'
      +(u.privados_max_override != null ? String(u.privados_max_override) : '')
      +'" type="number" min="4" step="1" placeholder="—" style="width:72px;font-size:12px;padding:6px" value="'
      +(u.privados_max_override != null ? String(u.privados_max_override) : '')+'"></label>'
      +'<button type="button" class="btn btn-s admin-save-sans" data-uid="'+adminEscape(uid)+'" style="width:auto;padding:6px 10px;font-size:11px">Guardar lugares</button>'
      +'</div></td></tr>';
  });
  html += '</tbody></table></div>';
  box.innerHTML = html;
  box.querySelectorAll('.admin-save').forEach(function(btn){
    btn.addEventListener('click', function(){
      adminSaveUserPlan(btn.getAttribute('data-uid'));
    });
  });
  box.querySelectorAll('.admin-save-sans').forEach(function(btn){
    btn.addEventListener('click', function(){
      adminSaveUserLugares(btn.getAttribute('data-uid'));
    });
  });
}

var _adminPlanFetch = null;
var _adminPlanCache = [];

function adminPlanSeenMap(){
  try{ return JSON.parse(localStorage.getItem('af_admin_plan_seen')||'{}'); }catch(e){ return {}; }
}
function adminPlanIsNew(clave){
  var m = adminPlanSeenMap();
  return !m[clave];
}
function adminMarkPlanRequestSeen(clave){
  if(!clave) return;
  var m = adminPlanSeenMap();
  m[clave] = Date.now();
  try{ localStorage.setItem('af_admin_plan_seen', JSON.stringify(m)); }catch(e){}
  renderAdminPlanRequestsList(_adminPlanCache);
  refreshAdminPlanAlertsFromCache();
}
function adminMarkAllPlanRequestsSeen(){
  var m = adminPlanSeenMap();
  (_adminPlanCache||[]).forEach(function(it){ if(it.clave) m[it.clave] = Date.now(); });
  try{ localStorage.setItem('af_admin_plan_seen', JSON.stringify(m)); }catch(e){}
  toast('Solicitudes marcadas como vistas');
  renderAdminPlanRequestsList(_adminPlanCache);
  refreshAdminPlanAlertsFromCache();
}

function fetchAdminPlanRequests(){
  if(!isAdmin()) return Promise.resolve([]);
  if(_adminPlanFetch && (Date.now() - _adminPlanFetch.t) < 8000){
    return Promise.resolve(_adminPlanFetch.items);
  }
  return fetch(afSupabaseUrl()+'/rest/v1/anesfact_datos?clave=like.anesfact_help_*&select=clave,datos,owner_id&order=clave.desc&limit=80',{
    headers: afSupabaseHeaders()
  }).then(function(r){
    if(!r.ok) throw new Error('HTTP '+r.status);
    return r.json();
  }).then(function(rows){
    var items = [];
    (rows||[]).forEach(function(row){
      var t; try{ t=JSON.parse(row.datos||'{}'); }catch(e){ t=null; }
      if(!t || t.categoria !== 'plan') return;
      var ts = t.fecha ? Date.parse(t.fecha) : 0;
      if(!ts || isNaN(ts)){
        var m = String(row.clave||'').match(/anesfact_help_(\d+)/);
        ts = m ? parseInt(m[1],10) : 0;
      }
      items.push({ clave: row.clave, owner_id: row.owner_id, t: t, ts: ts||0 });
    });
    items.sort(function(a,b){ return b.ts - a.ts; });
    _adminPlanCache = items;
    _adminPlanFetch = { t: Date.now(), items: items };
    return items;
  });
}

function renderAdminPlanRequestsList(items){
  var box = document.getElementById('admin-plan-requests');
  var countEl = document.getElementById('admin-plan-new-count');
  if(!box) return;
  items = items || [];
  var nNew = items.filter(function(it){ return adminPlanIsNew(it.clave); }).length;
  if(countEl){
    if(nNew > 0){
      countEl.style.display = 'inline-block';
      countEl.textContent = nNew + ' nueva' + (nNew===1?'':'s');
    } else {
      countEl.style.display = 'none';
    }
  }
  if(!items.length){
    box.innerHTML = '<p class="admin-muted">Sin solicitudes de plan por ahora.</p>';
    return;
  }
  box.innerHTML = items.map(function(it){
    var t = it.t;
    var isNew = adminPlanIsNew(it.clave);
    var fecha = it.ts ? new Date(it.ts).toLocaleString() : '';
    var who = adminEscape(t.email || t.anestesista || it.owner_id || '?');
    var actual = adminEscape(t.plan_actual || 'demo');
    var pedido = adminEscape(t.plan_pedido || 'consultar');
    var msg = adminEscape(t.mensaje || '');
    var border = isNew ? 'rgba(239,68,68,.55)' : 'var(--border)';
    var bg = isNew ? 'rgba(239,68,68,.08)' : 'transparent';
    var titleColor = isNew ? 'var(--red)' : 'var(--yellow)';
    return '<div style="padding:10px;margin:0 0 8px;border:1px solid '+border+';border-radius:8px;background:'+bg+'">'
      +'<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">'
      +'<div style="font-size:13px;font-weight:700;color:'+titleColor+'">'+(isNew?'NUEVO · ':'')+who+'</div>'
      +(isNew?'<button type="button" class="btn btn-s" style="width:auto;padding:4px 8px;font-size:11px;flex-shrink:0" data-clave="'+adminEscape(it.clave)+'">Visto</button>':'')
      +'</div>'
      +'<div style="font-size:12px;margin-top:2px">Actual: <b>'+actual+'</b> → pide: <b>'+pedido+'</b></div>'
      +'<div style="font-size:11px;color:var(--text3)">'+adminEscape(fecha)+' · facturación manual afuera</div>'
      +'<div style="font-size:12px;margin-top:4px;color:var(--text2)">'+msg+'</div>'
      +'</div>';
  }).join('');
  box.querySelectorAll('button[data-clave]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      adminMarkPlanRequestSeen(btn.getAttribute('data-clave'));
    });
  });
}

function refreshAdminPlanAlertsFromCache(){
  var items = _adminPlanCache || [];
  var nNew = items.filter(function(it){ return adminPlanIsNew(it.clave); }).length;
  var alert = document.getElementById('admin-plan-alert');
  var title = document.getElementById('admin-plan-alert-title');
  var badge = document.getElementById('admin-btn-badge');
  if(alert){
    if(isAdmin() && nNew > 0){
      alert.style.display = 'block';
      if(title) title.textContent = nNew + ' pedido' + (nNew===1?'':'s') + ' de plan nuevo' + (nNew===1?'':'s');
    } else {
      alert.style.display = 'none';
    }
  }
  if(badge){
    if(isAdmin() && nNew > 0){
      badge.style.display = 'inline-block';
      badge.textContent = String(nNew);
    } else {
      badge.style.display = 'none';
      badge.textContent = '';
    }
  }
}

function refreshAdminPlanAlerts(){
  if(!isAdmin()){
    _adminPlanCache = [];
    refreshAdminPlanAlertsFromCache();
    return Promise.resolve([]);
  }
  return fetchAdminPlanRequests().then(function(items){
    refreshAdminPlanAlertsFromCache();
    return items;
  }).catch(function(){
    return [];
  });
}

function loadAdminPlanRequests(){
  var box = document.getElementById('admin-plan-requests');
  if(!box) return refreshAdminPlanAlerts();
  box.innerHTML = '<p class="admin-muted">Cargando solicitudes…</p>';
  return fetchAdminPlanRequests().then(function(items){
    renderAdminPlanRequestsList(items);
    refreshAdminPlanAlertsFromCache();
  }).catch(function(e){
    box.innerHTML = '<p class="admin-muted" style="color:var(--red)">No se pudieron cargar: '+adminEscape(e.message||e)+'</p>';
  });
}

function loadAdminPanel(){
  if(!isAdmin()){
    adminSetStatus('Acceso denegado', false);
    return;
  }
  adminSetStatus('Cargando…', null);
  _adminPlanFetch = null; // forzar lista fresca al abrir panel
  loadAdminPlanRequests();
  adminRpc('af_admin_list_users')
    .then(function(users){
      users = users || [];
      renderAdminUsers(users);
      adminSetStatus('Actualizado · '+users.length+' usuario(s)', true);
      window._adminUsersCache = users;
    })
    .catch(function(e){
      adminSetStatus((e.status === 401 || String(e.message).indexOf('42501') >= 0 || String(e.message).indexOf('forbidden') >= 0)
        ? 'Sin permisos admin en Supabase (¿ejecutaste 002_admin_panel.sql?)'
        : ('Error: ' + (e.message || e)), false);
    });
}

function adminSaveUserPlan(uid){
  if(!isAdmin()) return;
  var sel = document.querySelector('.admin-plan[data-uid="'+uid+'"]');
  if(!sel) return;
  var plan = sel.value;
  var patch = { plan: plan };
  if(plan !== 'demo') patch.fojas_semana = 0;
  adminSetStatus('Guardando plan…', null);
  adminPatchUser(uid, patch)
    .then(function(){
      toast('Plan actualizado ✓');
      adminSetStatus('Plan guardado: ' + plan, true);
      loadAdminPanel();
    })
    .catch(function(e){
      var msg = e.message || String(e);
      if(String(msg).indexOf('af_admin_set_plan') >= 0 || String(msg).indexOf('42883') >= 0 || String(msg).indexOf('PGRST202') >= 0 || String(msg).indexOf('Could not find') >= 0){
        adminSetStatus('Falta ejecutar en Supabase el SQL: 006_admin_set_plan_view_fojas.sql', false);
      } else {
        adminSetStatus('No se pudo guardar: ' + msg, false);
      }
    });
}

function adminParseLugares(text){
  return String(text || '').split(/\r?\n/).map(function(s){ return s.trim(); }).filter(Boolean);
}

function adminSaveUserLugares(uid){
  if(!isAdmin()) return;
  var ta = document.querySelector('.admin-sans[data-uid="'+uid+'"]');
  var ovEl = document.querySelector('.admin-override[data-uid="'+uid+'"]');
  if(!ta) return;
  var names = adminParseLugares(ta.value);
  var ovRaw = ovEl ? String(ovEl.value || '').trim() : '';
  var ovOrig = ovEl ? String(ovEl.getAttribute('data-orig') || '') : '';
  adminSetStatus('Guardando lugares…', null);
  var chain = Promise.resolve();
  if(ovRaw !== ovOrig){
    var pMax = ovRaw === '' ? null : parseInt(ovRaw, 10);
    if(ovRaw !== '' && (!isFinite(pMax) || pMax <= 3)){
      adminSetStatus('El tope extra tiene que ser mayor a 3, o vacío.', false);
      return;
    }
    chain = adminRpc('af_admin_set_privados_override', { p_user_id: uid, p_max: pMax });
  }
  chain.then(function(){
    return adminRpc('af_admin_set_sanatorios', { p_user_id: uid, p_nombres: names });
  }).then(function(){
    toast('Lugares actualizados ✓');
    adminSetStatus('Lugares guardados', true);
    loadAdminPanel();
  }).catch(function(e){
    adminSetStatus('No se pudo guardar lugares: ' + (e.message || e), false);
  });
}

function goAdminGuarded(){
  if(!isAdmin()){ toast('Acceso denegado'); return; }
  go('admin');
}

function renderAdmin(){
  if(!isAdmin()){ toast('Acceso denegado'); go('home'); return; }
  loadAdminPanel();
}

function refreshAdminUi(){
  var btn = document.getElementById('admin-btn');
  if(btn) btn.style.display = isAdmin() ? 'flex' : 'none';
  refreshCfgUi();
  if(typeof refreshAdminPlanAlerts === 'function') refreshAdminPlanAlerts();
}

function refreshCfgUi(){
  var admin = isAdmin();
  document.querySelectorAll('.cfg-admin-only').forEach(function(el){
    el.style.display = admin ? '' : 'none';
  });
  var note = document.getElementById('cfg-sync-user-note');
  if(note) note.style.display = admin ? 'none' : 'block';
  var ab = document.getElementById('admin-btn');
  if(ab){
    ab.style.display = admin ? 'flex' : 'none';
    ab.style.visibility = admin ? 'visible' : 'hidden';
  }
  var ban = document.getElementById('admin-view-banner');
  if(ban){ ban.style.display = 'none'; ban.innerHTML = ''; }
  try{ localStorage.removeItem('af_admin_follow'); }catch(e){}
  if(typeof S !== 'undefined') S._adminViewAs = null;
  if(typeof afSyncDockSizeUi === 'function') afSyncDockSizeUi();
}
