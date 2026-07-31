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

function adminUpsertUser(uid, patch){
  var cached = (window._adminUsersCache || []).find(function(u){ return u.id === uid; });
  var row = {
    id: uid,
    email: (cached && cached.email) || '',
    nombre: (cached && cached.nombre) || '',
    matricula: (cached && cached.matricula) || null,
    rol: (cached && cached.rol) || 'user',
    activo: cached && cached.activo === false ? false : true,
    fojas_semana: (cached && cached.fojas_semana != null) ? cached.fojas_semana : 0,
    plan: (cached && cached.plan) || 'demo'
  };
  Object.keys(patch || {}).forEach(function(k){ row[k] = patch[k]; });
  return fetch(afSupabaseUrl() + '/rest/v1/anesfact_usuarios', {
    method: 'POST',
    headers: afSupabaseHeaders({
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal,resolution=merge-duplicates'
    }),
    body: JSON.stringify(row)
  }).then(function(r){
    if(r.ok || r.status === 201 || r.status === 204) return true;
    return r.text().then(function(t){ throw new Error(t || ('HTTP ' + r.status)); });
  });
}

function adminPatchUser(uid, patch){
  return adminUpsertUser(uid, patch);
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
      +'<button type="button" class="btn btn-g admin-save" data-uid="'+adminEscape(uid)+'" style="width:auto;padding:6px 10px;font-size:11px">Guardar</button>'
      +'</td></tr>';
  });
  html += '</tbody></table></div>';
  box.innerHTML = html;
  box.querySelectorAll('.admin-save').forEach(function(btn){
    btn.addEventListener('click', function(){
      adminSaveUserPlan(btn.getAttribute('data-uid'));
    });
  });
}

function renderAdminLegacy(rows, users){
  var box = document.getElementById('admin-legacy-list');
  if(!box) return;
  if(!rows || !rows.length){
    box.innerHTML = '<p class="admin-muted">No hay backups legacy sin vincular.</p>';
    return;
  }
  var opts = (users || []).map(function(u){
    var lab = (u.email || u.nombre || u.id.slice(0,8));
    return '<option value="'+adminEscape(u.id)+'">'+adminEscape(lab)+'</option>';
  }).join('');
  var html = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>'
    +'<th>Clave</th><th>Fojas</th><th>Owner</th><th>Vincular a</th><th></th>'
    +'</tr></thead><tbody>';
  rows.forEach(function(r){
    html += '<tr>'
      +'<td><code class="admin-code">'+adminEscape(r.clave)+'</code></td>'
      +'<td>'+(r.sync_fojas != null ? r.sync_fojas : '—')+'</td>'
      +'<td>'+(r.owner_id ? adminEscape(String(r.owner_id).slice(0,8))+'…' : '—')+'</td>'
      +'<td><select class="fi admin-link-user" data-clave="'+adminEscape(r.clave)+'" style="font-size:11px;padding:6px">'
      +'<option value="">— usuario —</option>'+opts+'</select></td>'
      +'<td><button type="button" class="btn btn-s admin-link-btn" data-clave="'+adminEscape(r.clave)+'" style="width:auto;padding:6px 10px;font-size:11px">Vincular</button></td>'
      +'</tr>';
  });
  html += '</tbody></table></div>';
  box.innerHTML = html;
  box.querySelectorAll('.admin-link-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var row = btn.closest('tr');
      var sel = row ? row.querySelector('.admin-link-user') : null;
      if(!sel || !sel.value){ toast('Elegí un usuario'); return; }
      adminLinkLegacy(btn.getAttribute('data-clave'), sel.value);
    });
  });
}

function loadAdminPanel(){
  if(!isAdmin()){
    adminSetStatus('Acceso denegado', false);
    return;
  }
  adminSetStatus('Cargando…', null);
  Promise.all([
    adminRpc('af_admin_list_users'),
    adminRpc('af_admin_legacy_backups')
  ]).then(function(res){
    var users = res[0] || [];
    renderAdminUsers(users);
    renderAdminLegacy(res[1] || [], users);
    adminSetStatus('Actualizado · '+users.length+' usuario(s)', true);
    window._adminUsersCache = users;
  }).catch(function(e){
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
      adminSetStatus('Plan guardado', true);
      loadAdminPanel();
    })
    .catch(function(e){
      adminSetStatus('No se pudo guardar: ' + (e.message || e), false);
    });
}

function adminLinkLegacy(clave, userId){
  if(!isAdmin()) return;
  if(!confirm('¿Vincular "'+clave+'" al usuario seleccionado? No se borran fojas.')) return;
  adminSetStatus('Vinculando backup…', null);
  adminRpc('af_admin_link_backup', { p_clave: clave, p_user_id: userId })
    .then(function(){
      toast('Backup vinculado ✓');
      adminSetStatus('Backup legacy vinculado', true);
      loadAdminPanel();
    })
    .catch(function(e){
      adminSetStatus('Error al vincular: ' + (e.message || e), false);
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
}
