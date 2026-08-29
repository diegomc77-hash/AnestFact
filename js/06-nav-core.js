function afRepairViewsDom(){
  var mount=document.getElementById('views-mount');
  if(!mount) return;
  document.querySelectorAll('.view').forEach(function(v){
    if(v.parentElement!==mount) mount.appendChild(v);
  });
  var fact=document.getElementById('view-facturacion');
  if(fact){
    var obra=document.getElementById('f-obra');
    if(obra&&!fact.contains(obra)){
      var card=obra.closest('.card');
      if(card&&card.parentElement!==fact) fact.insertBefore(card,fact.querySelector('.card')||null);
    }
  }
  Array.prototype.forEach.call(mount.children,function(el){
    if(!el.classList.contains('view')) el.setAttribute('hidden','');
  });
}

function afShowView(id){
  afRepairViewsDom();
  var mount=document.getElementById('views-mount');
  var targetId='view-'+id;
  var views=mount?mount.querySelectorAll('.view'):document.querySelectorAll('.view');
  views.forEach(function(v){
    var on=(v.id===targetId);
    if(on){
      v.classList.add('active');
      v.removeAttribute('hidden');
      v.style.display='block';
    }else{
      v.classList.remove('active');
      v.setAttribute('hidden','');
      v.style.display='none';
    }
  });
  var vEl=document.getElementById(targetId);
  if(!vEl){alert('Vista no encontrada: '+id);return false;}
  if(mount)mount.scrollTop=0;
  window.scrollTo(0,0);
  return true;
}
function afSetShellTitle(id){
  var tag=document.getElementById('lockup-tag');
  if(tag){
    var v=(typeof AF_CACHE_V==='string'&&AF_CACHE_V)?AF_CACHE_V:'';
    tag.textContent=v?('Suite anestésica · v'+v):'Suite anestésica';
  }
  var sec=document.getElementById('t-section');
  if(!sec)return;
  var dockRoots={home:1,preop:1,sanatorios:1,geclisa:1,evweb:1,legales:1,herramientas:1};
  if(!id||dockRoots[id]){
    sec.textContent='';
    sec.style.display='none';
    return;
  }
  sec.textContent=(typeof TITLES!=='undefined'&&TITLES[id])?TITLES[id]:'';
  sec.style.display=sec.textContent?'block':'none';
}
var AF_DOCK_HIDE={foja:1,nueva:1,admin:1,facturacion:1,nom:1,resumen:1};
var AF_DOCK_MAP={home:'home',preop:'preop',sanatorios:'sanatorios',geclisa:'geclisa',evweb:'evweb',legales:'legales',herramientas:'herramientas',escanear:'herramientas',config:'herramientas',ayuda:'herramientas'};
function afActiveViewId(){
  var el=document.querySelector('#views-mount .view.active');
  if(!el||!el.id)return '';
  return String(el.id).replace(/^view-/,'');
}
function afSyncDockAlert(){
  var preopAlert=document.getElementById('dock-preop-alert');
  if(!preopAlert)return;
  var n=0;
  var list=(typeof S!=='undefined'&&S.intervs)?S.intervs:[];
  for(var j=0;j<list.length;j++){
    if(list[j]&&list[j].estado==='preoperatorio'&&list[j].alerta_seguridad)n++;
  }
  preopAlert.classList.toggle('on',n>0);
}
function afSyncDock(id){
  var dock=document.getElementById('af-dock');
  if(!dock)return;
  if(!id)id=afActiveViewId();
  var hide=!!AF_DOCK_HIDE[id];
  document.body.classList.toggle('has-dock',!hide);
  dock.hidden=hide;
  dock.setAttribute('aria-hidden',hide?'true':'false');
  if(hide)dock.style.display='none';
  else dock.style.removeProperty('display');
  var active=AF_DOCK_MAP[id]||'';
  var items=dock.querySelectorAll('.dock-item');
  for(var i=0;i<items.length;i++){
    items[i].classList.toggle('active',items[i].getAttribute('data-dock')===active);
  }
  afSyncDockAlert();
}
function goDock(id){
  try{
    var cur=(S.hist&&S.hist.length)?S.hist[S.hist.length-1]:'';
    if(cur==='foja'&&S.cur&&typeof guardarFoja==='function')guardarFoja();
    else if(S.cur&&typeof guardar==='function')guardar();
  }catch(e){}
  var prev=S.hist.slice();
  S.hist=[id];
  if(go(id,false)===false){
    S.hist=prev;
    var last=prev.length?prev[prev.length-1]:'home';
    if(typeof afSyncDock==='function')afSyncDock(last);
  }
}
function go(id,addH){
  if(addH===undefined)addH=true;
  if(id==='facturacion'&&!S.cur){toast('Abrí una intervención primero');return false;}
  if(id==='geclisa'&&typeof checkPlan==='function'&&!checkPlan('geclisa'))return false;
  if(id==='admin'&&(typeof isAdmin!=='function'||!isAdmin())){toast('Acceso denegado');return false;}
  if(!afShowView(id))return false;
  if(addH)S.hist.push(id);
  var bb=document.getElementById('back-btn');
  if(bb)bb.style.display=S.hist.length>1?'block':'none';
  afSetShellTitle(id);
  if(typeof afSyncDock==='function')afSyncDock(id);
  if(id==='home'){
    S.listMode='fojas';
    if(S.cur){try{guardar();}catch(e){}}
    renderHome();if(S.hist.length===1)cargarAnestesista();
  }
  if(id==='preop'){
    S.listMode='preop';
    renderHome();
  }
  if(id==='sanatorios'&&typeof renderSanatoriosHub==='function')renderSanatoriosHub();
  if(id==='evweb'&&typeof renderEvwebHub==='function')renderEvwebHub();
  if(id==='resumen')renderResumen();
  if(id==='foja'){
    // Evitar resetear la foja si ya está cargada la misma intervención (pisa sedación/vía/drogas a medias)
    var cid=S.cur?S.cur.id:null;
    if(typeof _fojaUiCurId==='undefined'||_fojaUiCurId!==cid){
      if(typeof cargarFojaUI==='function')cargarFojaUI();
    } else {
      if(typeof actualizarViaAerea==='function')actualizarViaAerea();
      if(typeof _sugerirDrogasPorTec==='function')_sugerirDrogasPorTec();
      if(typeof refrescarMetodosDesdeDrogas==='function')refrescarMetodosDesdeDrogas();
    }
    renderRecupSelects();
    if(typeof updateEscalasRecupPorTecnica==='function')updateEscalasRecupPorTecnica(true);
    setTimeout(function(){if(typeof initExamenAuscUI==='function')initExamenAuscUI();},120);
    setTimeout(initSign,80);
    renderPesoChips();
    renderFojaPorSanatorio();
  }
  if(id==='geclisa'){
    window._geclisaTexto='';
    var mayo=S.cur&&typeof afIsMayoInterv==='function'&&afIsMayoInterv(S.cur);
    var guia=document.getElementById('geclisa-guia');
    var empty=document.getElementById('geclisa-no-foja');
    if(guia)guia.style.display=mayo?'block':'none';
    if(empty)empty.style.display=mayo?'none':'block';
    if(mayo)renderGeclisa();
    if(typeof renderGeclisaQueuePanel==='function')renderGeclisaQueuePanel();
  }
  if(id==='admin'&&typeof renderAdmin==='function')renderAdmin();
  if(id==='nom'){document.getElementById('nom-q').value='';document.getElementById('nom-res').innerHTML='<p style="font-size:12px;color:var(--text3);text-align:center;padding:20px">Escribí para buscar</p>';}
  if(id==='config'){
    document.getElementById('cfg-key').value=S.key;actualizarKeyStatus();
    if(typeof refreshCfgUi==='function')refreshCfgUi();
    if(typeof cargarAnestesista==='function')cargarAnestesista();
  }
  if(id==='facturacion'){
    if(typeof refreshFacturacionHeader==='function')refreshFacturacionHeader();
    if(typeof renderPracs==='function')renderPracs();
    onSanChange();
  }
  if(id==='ayuda'&&typeof renderAyuda==='function')renderAyuda();
  return true;
}
function goFacturacion(){
  if(!S.cur){toast('Creá o abrí una intervención');return;}
  guardar();
  go('facturacion');
}
function goBack(){
  if(S.hist.length<=1)return;
  try{
    var cur=S.hist[S.hist.length-1];
    if(cur==='foja'&&S.cur)guardarFoja();
    else if((cur==='nueva'||cur==='facturacion'||cur==='resumen'||cur==='geclisa')&&S.cur)guardar();
  }catch(e){}
  S.hist.pop();
  var dest=S.hist[S.hist.length-1]||'home';
  go(dest,false);
}

/** Salto directo al menú principal (guarda foja/intervención abierta). */
function irInicio(){
  goDock('home');
}
function guardarAnestesista(){
  var nombre=document.getElementById('cfg-anest-nombre').value.trim().toUpperCase();
  var mp=document.getElementById('cfg-anest-mp').value.trim();
  var me=document.getElementById('cfg-anest-me').value.trim();
  if(!nombre){alert('Ingresá el nombre del anestesista titular de ESTA cuenta');return;}
  var uid=(typeof AF_AUTH!=='undefined'&&AF_AUTH.getUserId)?AF_AUTH.getUserId():'';
  if(!uid){
    toast('Iniciá sesión para vincular nombre y matrícula a tu plan');
    return;
  }
  // Si el servidor ya tiene identidad, no permitir "cambiar de anestesista" (prestarse la app)
  var serverNom=(typeof USER_PROFILE!=='undefined'&&USER_PROFILE&&USER_PROFILE.nombre)?String(USER_PROFILE.nombre).toUpperCase().trim():'';
  var serverMp=(USER_PROFILE&&USER_PROFILE.matricula)?String(USER_PROFILE.matricula).trim():'';
  if(serverNom&&serverNom!==nombre){
    if(!confirm('Tu cuenta ya está registrada a nombre de:\n'+serverNom+'\n\nUn plan es personal: no se puede usar para firmar como otro anestesista.\n¿Solo corregir un error de tipeo en TU nombre?'))return;
  }
  if(serverMp&&mp&&serverMp!==mp){
    if(!confirm('La matrícula provincial de tu cuenta es '+serverMp+'.\n¿Confirmás el cambio a '+mp+' (corrección, no otro profesional)?'))return;
  }
  fetch(afSupabaseUrl()+'/rest/v1/anesfact_usuarios?id=eq.'+encodeURIComponent(uid),{
    method:'PATCH',
    headers:afSupabaseHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),
    body:JSON.stringify({nombre:nombre,matricula:mp,matricula_especial:me||''})
  }).then(function(r){
    if(!r.ok)return r.text().then(function(t){throw new Error(t.slice(0,80)||('HTTP '+r.status));});
    if(typeof USER_PROFILE==='object'&&USER_PROFILE){
      USER_PROFILE.nombre=nombre;USER_PROFILE.matricula=mp;USER_PROFILE.matricula_especial=me;
    }
    if(typeof AfIdentidad!=='undefined')AfIdentidad.syncLocal({nombre:nombre,mp:mp,me:me});
    else{
      localStorage.setItem('af_anest_nombre',nombre);
      localStorage.setItem('af_anest_mp',mp);
      localStorage.setItem('af_anest_me',me);
    }
    var st=document.getElementById('anest-status');
    if(st)st.textContent='✓ Identidad de cuenta: '+nombre+' M.P.'+mp;
    var h=document.getElementById('header-anest-info');
    if(h)h.textContent=nombre+' · M.P.'+mp+' · ADAARC';
    toast('Identidad profesional guardada en tu plan ✓');
  }).catch(function(e){
    toast('No se pudo guardar en servidor: '+(e.message||e));
  });
}

function cargarAnestesista(){
  var id=(typeof AfIdentidad!=='undefined')?AfIdentidad.get():null;
  var nombre=id?id.nombre:(localStorage.getItem('af_anest_nombre')||'');
  var mp=id?id.mp:(localStorage.getItem('af_anest_mp')||'');
  var me=id?id.me:(localStorage.getItem('af_anest_me')||'');
  var el=document.getElementById('cfg-anest-nombre');if(el){el.value=nombre;el.readOnly=false;}
  var el2=document.getElementById('cfg-anest-mp');if(el2){el2.value=mp;el2.readOnly=false;}
  var el3=document.getElementById('cfg-anest-me');if(el3){el3.value=me;el3.readOnly=false;}
  var h=document.getElementById('header-anest-info');
  if(h&&nombre)h.textContent=nombre+' · M.P.'+mp+' · ADAARC';
  var hint=document.getElementById('anest-plan-hint');
  if(hint){
    hint.textContent='Un plan = un anestesista. Nombre y matrícula quedan ligados a tu cuenta (no prestar la app).';
  }
  if(typeof AfFirma!=='undefined'&&AfFirma.boot)AfFirma.boot();
  if(typeof refreshPlanCardUi==='function')refreshPlanCardUi();
  if(!nombre&&!localStorage.getItem('af_anest_visto')){
    localStorage.setItem('af_anest_visto','1');
    setTimeout(function(){go('config');toast('Configurá tus datos de anestesista → Ajustes');},800);
  }
}

function irConfig(){go('config');}
function afGetDockSize(){
  try{
    var s=localStorage.getItem('af_dock_size');
    if(s==='s'||s==='l')return s;
  }catch(e){}
  return 'm';
}
function afSyncDockSizeUi(){
  var cur=afGetDockSize();
  ['s','m','l'].forEach(function(k){
    var el=document.getElementById('cfg-dock-'+k);
    if(el)el.classList.toggle('on',k===cur);
  });
}
function afApplyDockSize(size){
  var s=(size==='s'||size==='m'||size==='l')?size:afGetDockSize();
  document.body.classList.remove('dock-size-s','dock-size-m','dock-size-l');
  document.body.classList.add('dock-size-'+s);
  afSyncDockSizeUi();
}
function afSetDockSize(size){
  var s=(size==='s'||size==='l')?size:'m';
  try{localStorage.setItem('af_dock_size',s);}catch(e){}
  afApplyDockSize(s);
  toast(s==='s'?'Menú chico':s==='l'?'Menú grande':'Menú mediano');
}
afApplyDockSize();
function irScan(){go('escanear');}
var _tt;
function toast(msg){
  var t=document.getElementById('toast');
  if(!t)return;
  t.textContent=msg;
  t.classList.add('show');
  t.setAttribute('aria-hidden','false');
  clearTimeout(_tt);
  _tt=setTimeout(function(){
    t.classList.remove('show');
    t.setAttribute('aria-hidden','true');
  },2600);
}
function _copiarTexto(text,onOk,onFail){
  if(navigator.clipboard&&window.isSecureContext){
    navigator.clipboard.writeText(text).then(onOk).catch(function(){_copiarFallback(text,onOk,onFail);});
    return;
  }
  _copiarFallback(text,onOk,onFail);
}
function _copiarFallback(text,onOk,onFail){
  try{
    var ta=document.createElement('textarea');
    ta.value=text;ta.style.position='fixed';ta.style.top='-9999px';ta.style.left='-9999px';
    document.body.appendChild(ta);ta.focus();ta.select();
    var ok=document.execCommand('copy');
    document.body.removeChild(ta);
    if(ok){if(onOk)onOk();}else{if(onFail)onFail();}
  }catch(e){if(onFail)onFail();}
}
function _mostrarParaCopiar(text,label){
  var overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
  var box=document.createElement('div');
  box.style.cssText='background:var(--bg2);border-radius:12px;padding:16px;width:100%;max-width:480px;display:flex;flex-direction:column;gap:10px';
  var title=document.createElement('div');
  title.style.cssText='font-weight:600;font-size:13px;color:var(--green)';
  title.textContent='\u2705 Selección lista — presioná Ctrl+C para copiar';
  var ta=document.createElement('textarea');
  ta.value=text;
  ta.style.cssText='width:100%;min-height:140px;max-height:45vh;background:var(--bg3);color:var(--text);border:1px solid var(--green);border-radius:8px;padding:10px;font-size:12px;font-family:monospace;resize:vertical';
  var btn=document.createElement('button');
  btn.className='btn btn-g';btn.style.marginTop='4px';
  btn.textContent='\u2715 Cerrar';
  btn.onclick=function(){document.body.removeChild(overlay);};
  box.appendChild(title);box.appendChild(ta);box.appendChild(btn);
  overlay.appendChild(box);document.body.appendChild(overlay);
  ta.focus();ta.select();
  try{var ok=document.execCommand('copy');if(ok)title.textContent='\u2705 Copiado — listo para pegar en GECLISA';}catch(e){}
}
function copyVal(text,label){
  _copiarTexto(text,
    function(){toast('\ud83d\udccb '+(label||'Copiado'));},
    function(){_mostrarParaCopiar(text,label||'Campo');}
  );
}
function saveKey(){S.key=document.getElementById('cfg-key').value.trim();localStorage.setItem('af_k',S.key);actualizarKeyStatus();toast('API Key guardada');}
function actualizarKeyStatus(){var el=document.getElementById('key-status');if(!el)return;el.textContent=S.key?'Key: '+S.key.slice(0,8)+'...':'Sin key';el.style.color=S.key?'var(--green)':'var(--yellow)';}
function onSanChange(){
  var sanEl=document.getElementById('f-san');
  if(!sanEl)return;
  if(typeof AfSanatoriosPlan!=='undefined'&&!AfSanatoriosPlan.assertCurrent()){
    return;
  }
  var s=sanEl.value;
  // Also update foja view if visible
  setTimeout(renderFojaPorSanatorio,50);
  var aw=document.getElementById('f-aero-wrap');
  if(aw)aw.style.display=s==='Hospital Aeronáutico'?'block':'none';
  var sw=document.getElementById('f-sisalud-ubic-wrap');
  if(sw)sw.style.display=(typeof afFojaEsSisalud==='function'&&afFojaEsSisalud(s))?'block':'none';
  if(typeof afSyncSalaInstUi==='function')afSyncSalaInstUi();
  var mw=document.getElementById('f-mayo-wrap');if(mw)mw.style.display=s==='Sanatorio Mayo'?'block':'none';
  var mb=document.getElementById('btn-mayo-wrap');if(mb)mb.style.display=s==='Sanatorio Mayo'?'block':'none';
  if(s==='Sanatorio Mayo')updateMayoCamas();
  if(typeof actualizarHintCirujano==='function')actualizarHintCirujano();
  if(typeof acCirujano==='function')acCirujano();
}
function afSyncSalaInstUi(){
  var sanEl=document.getElementById('f-san');
  var inp=document.getElementById('f-sala-sisalud');
  var sel=document.getElementById('f-sala-inst');
  if(!inp||!sel)return;
  var san=sanEl?sanEl.value:'';
  var list=(typeof afFojaQuirofanos==='function')?afFojaQuirofanos(san):[];
  var prev=sel.value||inp.value||'';
  if(list.length){
    sel.innerHTML='<option value="">—</option>';
    list.forEach(function(n){
      var o=document.createElement('option');
      o.value=n;
      o.textContent=n;
      sel.appendChild(o);
    });
    if(prev)sel.value=prev;
    sel.style.display='';
    inp.style.display='none';
  }else{
    if(sel.value&&!inp.value)inp.value=sel.value;
    sel.style.display='none';
    while(sel.options.length)sel.remove(0);
    inp.style.display='';
  }
}
function updateMayoCamas(){
  var sec=document.getElementById('f-mayo-sector');var cam=document.getElementById('f-mayo-cama');
  if(!sec||!cam)return;var sector=sec.value;
  var opts=['<option value="">—</option>'];
  // Sectores GECLISA #ddlSector (Mayo). PRE-QUIRÚRGICO / HEMODINAMIA: sin cama asignada.
  if(sector==='PISO'){for(var hab=1;hab<=15;hab++){var c1=200+hab*2-1;var c2=200+hab*2;opts.push('<option>Hab.'+hab+' — Cama '+c1+'</option><option>Hab.'+hab+' — Cama '+c2+'</option>');}}
  else if(sector==='VIP'){opts.push('<option>VIP 1</option><option>VIP 2</option>');}
  else if(sector==='UCI'){for(var j=1;j<=16;j++)opts.push('<option>UCI '+j+'</option>');}
  else if(sector==='UTI'){for(var j=1;j<=16;j++)opts.push('<option>UTI1-'+j+'</option>');}
  else if(sector==='UTI2'){for(var j=1;j<=16;j++)opts.push('<option>UTI2-'+j+'</option>');}
  else if(sector==='HOSPITAL DE DIA'){for(var j=1;j<=10;j++)opts.push('<option>HD '+j+'</option>');}
  else if(sector==='GUARDIA'){for(var j=1;j<=8;j++)opts.push('<option>G '+j+'</option>');}
  // PRE-QUIRÚRGICO y HEMODINAMIA VIRTUAL: solo "—" (paciente sin cama / virtual)
  cam.innerHTML=opts.join('');
}
