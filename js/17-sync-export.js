// === ACKEY + closeAllAC ===
function acKey(e,lid){
  var list=document.getElementById(lid);if(!list||list.style.display==='none')return;
  var items=list.querySelectorAll('.ac-item');var sel=list.querySelector('.ac-item.sel');var idx=-1;
  items.forEach(function(it,i){if(it===sel)idx=i;});
  if(e.key==='ArrowDown'){e.preventDefault();var n=Math.min(idx+1,items.length-1);items.forEach(function(it){it.classList.remove('sel');});if(items[n])items[n].classList.add('sel');}
  else if(e.key==='ArrowUp'){e.preventDefault();var n2=Math.max(idx-1,0);items.forEach(function(it){it.classList.remove('sel');});if(items[n2])items[n2].classList.add('sel');}
  else if(e.key==='Enter'||e.key==='Tab'){var s=list.querySelector('.ac-item.sel');if(s){e.preventDefault();s.click();}}
  else if(e.key==='Escape'){closeAllAC();}
}
function closeAllAC(){document.querySelectorAll('.ac-list').forEach(function(el){el.style.display='none';});}
document.addEventListener('click',function(e){if(!e.target.closest||!e.target.closest('.ac-wrap'))closeAllAC();});
// === CIRUJANOS POR LUGAR + ESPECIALIDAD (catálogo en data/cirujanos-esp.js) ===
function actualizarHintCirujano(){
  var hint=document.getElementById('ciru-hint');
  if(!hint)return;
  var san=(document.getElementById('f-san')||{value:''}).value||'';
  var esp=(document.getElementById('f-serv')||{value:''}).value||'';
  if(!esp){hint.textContent='Elegí servicio/especialidad para ver cirujanos del lugar.';return;}
  var map=typeof getCirujanosMapForLugar==='function'?getCirujanosMapForLugar(san):{};
  var tieneCatalogo=Object.keys(map).length>0;
  var n=(map[esp]||[]).length;
  if(san==='Hospital Aeronáutico'&&!n){
    hint.textContent='Aeronáutico: listado pendiente de cargar. Podés escribir el nombre a mano.';
    return;
  }
  if(!tieneCatalogo){
    hint.textContent='Sin catálogo fijo para este lugar. Se sugieren nombres ya usados ahí.';
    return;
  }
  if(!n){
    hint.textContent='Mayo: aún no hay nómina cargada para esta especialidad. Escribí a mano o avisá para completarla.';
    return;
  }
  hint.textContent=n+' cirujano'+(n===1?'':'s')+' de '+esp+' en '+san+'.';
}
function getCirujanosByEsp(){
  var esp=(document.getElementById('f-serv')||{value:''}).value||'';
  var san=(document.getElementById('f-san')||{value:''}).value||'';
  var map=typeof getCirujanosMapForLugar==='function'?getCirujanosMapForLugar(san):{};
  var all=(esp&&map[esp])?map[esp].slice():[];
  var seen={};
  all.forEach(function(c){seen[String(c).toUpperCase()]=true;});
  // Solo aprendidos del mismo lugar + misma especialidad (no mezclar Mayo/Aero ni otras esp.)
  if(typeof S!=='undefined'&&S.intervs){
    S.intervs.forEach(function(i){
      if(!i||!i.ciru)return;
      if(san&&i.san&&i.san!==san)return;
      if(esp&&i.serv&&i.serv!==esp)return;
      var c=String(i.ciru).trim();
      if(!c)return;
      var k=c.toUpperCase();
      if(!seen[k]){all.push(c);seen[k]=true;}
    });
  }
  return all;
}
function acGeneric(fieldId,listId,getListFn){
  var q=document.getElementById(fieldId).value;
  var items=getListFn().filter(function(x){return x.toLowerCase().indexOf(q.toLowerCase())>=0;}).slice(0,10);
  renderAC(listId,items,function(x){return x;},null,function(i,cap){document.getElementById(fieldId).value=cap[i]||'';closeAllAC();});
}
function getCirujanos(){
  var base=[];
  S.intervs.forEach(function(x){if(x.ciru&&x.ciru.trim()&&base.indexOf(x.ciru.trim())<0)base.push(x.ciru.trim());});
  return base.slice().reverse();
}
function onServChange(){
  if(typeof onSanChange==='function')onSanChange();
  actualizarHintCirujano();
  if(typeof acCirujano==='function')acCirujano();
}
function acCirujano(){
  var inp=document.getElementById('f-ciru');
  var list=document.getElementById('ac-ciru');
  if(!inp||!list)return;
  actualizarHintCirujano();
  var esp=(document.getElementById('f-serv')||{value:''}).value||'';
  if(!esp){list.style.display='none';return;}
  var q=inp.value||'';
  var src=getCirujanosByEsp();
  if(!q||q.length<1){
    if(src.length){
      renderAC('ac-ciru',src.slice(0,15),function(x){return x;},null,function(i,cap){
        inp.value=cap[i]||'';closeAllAC();
      });
    } else {
      list.style.display='none';
    }
    return;
  }
  var hits=src.filter(function(x){return x.toLowerCase().indexOf(q.toLowerCase())>=0;}).slice(0,12);
  if(!hits.length){list.style.display='none';return;}
  renderAC('ac-ciru',hits,function(x){return x;},null,function(i,cap){
    inp.value=cap[i]||'';closeAllAC();
  });
}
// === EXPORT/IMPORT ===
function exportarDatos(){
  var uid=(typeof AF_AUTH!=='undefined'&&AF_AUTH.getUserId)?AF_AUTH.getUserId():'';
  var data={
    intervs:S.intervs,
    cirujanos:(typeof cirujanos!=='undefined'?cirujanos:[]),
    key:S.key||'',
    owner_id:uid||null,
    exportado:new Date().toISOString(),
    version:'AnesFact v8'
  };
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download='AnesFact_backup_'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);toast('Datos exportados \u2713');
}
function importarDatos(input){
  var file=input.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var data=JSON.parse(e.target.result);
      var nueva=data.intervs||[];
      if(!nueva.length){toast('El archivo no tiene fojas');input.value='';return;}
      var uid=(typeof AF_AUTH!=='undefined'&&AF_AUTH.getUserId)?AF_AUTH.getUserId():'';
      if(data.owner_id&&uid&&data.owner_id!==uid){
        if(!confirm('Este backup pertenece a otro usuario.\nSolo importalo si es tu pareja/cuenta autorizada.\n¿Continuar?')){
          input.value='';return;
        }
      }
      var existentes=S.intervs||[];
      var ids=existentes.map(function(i){return i.id;});
      var agregados=0;
      nueva.forEach(function(i){if(ids.indexOf(i.id)<0){existentes.push(i);agregados++;}});
      S.intervs=existentes;saveIntervsToStorage();
      if(data.cirujanos&&data.cirujanos.length){
        var local=[];try{local=JSON.parse(localStorage.getItem('af_ciru')||'[]');}catch(e2){}
        data.cirujanos.forEach(function(c){if(local.indexOf(c)<0)local.push(c);});
        localStorage.setItem('af_ciru',JSON.stringify(local));
      }
      renderHome();
      if(typeof syncAutoPushDebounced==='function')syncAutoPushDebounced();
      toast('Import OK: '+agregados+' nuevas · total '+S.intervs.length+' fojas');
    }catch(err){toast('Error import: '+err.message);}
  };
  reader.readAsText(file);input.value='';
}
// === SYNC (Supabase principal + Apps Script opcional) ===
var AF_SYNC_LEGACY='anesfact_sync_backup';
var AF_SYNC_HUERTA='anesfact_sync_HUERTA_MARIA_SOLEDAD'; // solo admin / migración manual — no usar en sync automático
var _syncPushTimer=null;
var _syncBusy=false;
var _lastSyncPull=0;
var _lastSyncPush=0;
var _lastSyncErr='';

function getSyncUserSlug(){
  var n=(localStorage.getItem('af_anest_nombre')||'').trim().toUpperCase();
  if(!n)return 'SIN_NOMBRE';
  var s=n.replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,48);
  return s||'SIN_NOMBRE';
}
function getSyncClave(){
  var uid=(typeof AF_AUTH!=='undefined'&&AF_AUTH.getUserId)?AF_AUTH.getUserId():'';
  if(uid)return 'anesfact_sync_'+uid;
  // Sin login no hay sync multi-usuario seguro
  return 'anesfact_sync_local_'+getSyncUserSlug();
}

function syncStatus(msg,color){
  var el=document.getElementById('sync-status');if(!el)return;
  el.style.display='block';
  el.style.background=color==='ok'?'rgba(29,185,84,.1)':color==='err'?'rgba(248,81,73,.1)':'rgba(56,139,253,.1)';
  el.style.color=color==='ok'?'var(--green)':color==='err'?'var(--red)':'var(--blue)';
  el.style.border='1px solid '+(color==='ok'?'rgba(29,185,84,.3)':color==='err'?'rgba(248,81,73,.3)':'rgba(56,139,253,.3)');
  el.textContent=msg;
}

function intervTs(i){return i._ts||parseInt(String(i.id).replace(/\D/g,'').slice(0,13),10)||0;}

/** IDs borrados (tombstones): el merge NUNCA debe resucitarlos desde la nube. */
function afDeletedIntervsKey(){
  return 'af_deleted_intervs'+(typeof afUserSuffix==='function'?afUserSuffix():'');
}
function afGetDeletedIntervsMap(){
  try{return JSON.parse(localStorage.getItem(afDeletedIntervsKey())||'{}');}catch(e){return {};}
}
function afMarkIntervDeleted(id){
  var m=afGetDeletedIntervsMap();
  m[String(id)]=Date.now();
  try{localStorage.setItem(afDeletedIntervsKey(),JSON.stringify(m));}catch(e){}
  try{console.log('[AFG sync] tombstone',id,m[String(id)]);}catch(e2){}
}
function afFilterDeletedIntervs(list){
  var m=afGetDeletedIntervsMap();
  return (list||[]).filter(function(i){return i&&i.id&&!m[String(i.id)];});
}

function mergeIntervsLocalRemote(local,remote){
  var map={};
  var deleted=afGetDeletedIntervsMap();
  (local||[]).forEach(function(i){
    if(!i||!i.id)return;
    if(deleted[String(i.id)])return;
    map[i.id]=i;
  });
  (remote||[]).forEach(function(r){
    if(!r||!r.id)return;
    if(deleted[String(r.id)]){
      try{console.log('[AFG sync] merge: no resucitar borrada',r.id);}catch(e){}
      return;
    }
    var l=map[r.id];
    if(!l||intervTs(r)>intervTs(l))map[r.id]=r;
  });
  var out=[];Object.keys(map).forEach(function(k){out.push(map[k]);});
  return out;
}

function fetchSyncPayload(clave){
  var url=afSupabaseUrl()+'/rest/v1/anesfact_datos?clave=eq.'+encodeURIComponent(clave)+'&select=datos&limit=1';
  var uid=(typeof AF_AUTH!=='undefined'&&AF_AUTH.getUserId)?AF_AUTH.getUserId():'';
  var ownClave=(typeof getSyncClave==='function')?getSyncClave():'';
  // Solo filtrar owner_id en la clave propia (no en shares — RLS del servidor decide)
  if(uid&&clave===ownClave)url+='&owner_id=eq.'+encodeURIComponent(uid);
  return fetch(url,{
    headers:afSupabaseHeaders()
  }).then(function(r){
    if(!r.ok)return r.text().then(function(t){throw new Error('HTTP '+r.status+(t?(': '+t.slice(0,80)):''));});
    return r.json();
  }).then(function(rows){if(!rows||!rows.length)return null;try{return JSON.parse(rows[0].datos||'{}');}catch(e){return null;}});
}

/** Solo la clave del usuario autenticado — NUNCA fallback a Huerta/legacy (fuga entre usuarios). */
function fetchSyncPayloadWithFallbacks(primaryClave){
  if(!primaryClave)return Promise.resolve(null);
  return fetchSyncPayload(primaryClave);
}

function syncApplyMergedIntervs(merged,remoteMeta){
  var antes=(S.intervs||[]).length;
  S.intervs=merged;
  saveIntervsToStorage();
  if(remoteMeta)_syncMergeMeta(remoteMeta);
  if(typeof renderHome==='function')renderHome();
  return S.intervs.length-antes;
}

function syncPrepareMergedPayload(){
  var clave=getSyncClave();
  return fetchSyncPayloadWithFallbacks(clave).then(function(remote){
    var local=afFilterDeletedIntervs(S.intervs||[]);
    S.intervs=local;
    if(!remote||!remote.intervs||!remote.intervs.length)return buildSyncPayload();
    var merged=mergeIntervsLocalRemote(local,remote.intervs);
    syncApplyMergedIntervs(merged,remote);
    var data=buildSyncPayload();
    data.total=data.intervs.length;
    return data;
  });
}

/**
 * Push inmediato post-borrado: sube el listado local (sin la foja) a Supabase.
 * No espera el debounce de 2.5s. Log explícito para diagnóstico.
 */
function syncPushAfterDelete(deletedId){
  var id=String(deletedId||'');
  function run(){
    if(_syncBusy){
      try{console.log('[AFG sync] push post-delete: busy, reintento…',id);}catch(e){}
      return new Promise(function(resolve){
        setTimeout(function(){resolve(run());},400);
      });
    }
    _syncBusy=true;
    S.intervs=afFilterDeletedIntervs(S.intervs||[]);
    saveIntervsToStorage();
    var data=buildSyncPayload();
    try{
      console.log('[AFG sync] push post-delete START',{
        deletedId:id,
        fojas:data.total,
        tombstones:Object.keys(afGetDeletedIntervsMap()).length,
        at:new Date().toISOString()
      });
    }catch(eL){}
    return syncGuardarSupabase(data,false).then(function(){
      try{
        console.log('[AFG sync] push post-delete OK',{
          deletedId:id,
          fojas:data.total,
          at:new Date().toISOString(),
          lastPush:_lastSyncPush
        });
      }catch(e2){}
      return{ok:true,deletedId:id,total:data.total};
    }).catch(function(e){
      try{console.error('[AFG sync] push post-delete FAIL',id,e&&e.message||e);}catch(e3){}
      throw e;
    }).finally(function(){_syncBusy=false;});
  }
  return run();
}

function syncAutoStatusUpdate(){
  var el=document.getElementById('sync-status');if(!el)return;
  el.style.display='block';
  el.style.background=_lastSyncErr?'rgba(248,81,73,.08)':'rgba(29,185,84,.08)';
  el.style.color=_lastSyncErr?'var(--red)':'var(--text2)';
  el.style.border='1px solid '+(_lastSyncErr?'rgba(248,81,73,.25)':'var(--border)');
  var slug=getSyncUserSlug();
  var who=slug.replace(/_/g,' ');
  var t='';
  if(_lastSyncPull)t+=' \u2193'+new Date(_lastSyncPull).toLocaleTimeString();
  if(_lastSyncPush)t+=' \u2191'+new Date(_lastSyncPush).toLocaleTimeString();
  var msg='\u9729 Sync \u00b7 '+who+' \u00b7 '+(S.intervs||[]).length+' fojas'+t;
  if(_lastSyncErr)msg+=' \u00b7 '+_lastSyncErr;
  el.textContent=msg;
}
function getSyncUrl(){
  var u=localStorage.getItem('af_sync_url')||'';
  if(u)return u;
  return(typeof AF_DEFAULT_SYNC_URL==='string')?AF_DEFAULT_SYNC_URL:'';
}
function saveSyncUrl(){var url=(document.getElementById('cfg-sync-url')||{value:''}).value.trim();if(!url){toast('Peg\u00e1 la URL del script');return;}localStorage.setItem('af_sync_url',url);toast('URL guardada \u2713');}
var APPS_SCRIPT_CODE=['function doGet(e){','  var action=(e&&e.parameter&&e.parameter.action)||"load";','  var props=PropertiesService.getScriptProperties();','  if(action==="save"){','    var data=(e&&e.parameter&&e.parameter.data)||"{}";','    try{data=Utilities.newBlob(Utilities.base64Decode(data)).getDataAsString();}catch(err){}','    props.setProperty("anesfact_backup",data);','    return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);','  }','  return ContentService.createTextOutput(props.getProperty("anesfact_backup")||"{}").setMimeType(ContentService.MimeType.JSON);','}','function doPost(e){','  var props=PropertiesService.getScriptProperties();','  var body=(e&&e.postData&&e.postData.contents)||"{}";','  props.setProperty("anesfact_backup",body);','  return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);','}'].join('\n');
function mostrarCodigoScript(){var p=document.getElementById('script-code-panel');var ta=document.getElementById('script-code-text');if(p&&ta){p.style.display='block';ta.value=APPS_SCRIPT_CODE;}}
function copiarCodigoScript(){var ta=document.getElementById('script-code-text');if(ta){ta.select();document.execCommand('copy');toast('C\u00f3digo copiado \u2713');}}

function buildSyncPayload(){
  var intervs=afFilterDeletedIntervs(S.intervs||[]);
  return{intervs:intervs,cirujanos:(typeof cirujanos!=='undefined'?cirujanos:[]),key:S.key||'',guardado:new Date().toISOString(),version:'AnesFact v7',total:intervs.length};
}

function _syncMergeMeta(data){
  if(data.cirujanos&&data.cirujanos.length){var local=[];try{local=JSON.parse(localStorage.getItem('af_ciru')||'[]');}catch(e2){}data.cirujanos.forEach(function(c){if(local.indexOf(c)<0)local.push(c);});localStorage.setItem('af_ciru',JSON.stringify(local));}
  if(data.key&&!S.key){S.key=data.key;localStorage.setItem('af_k',S.key);}
}

function aplicarSyncData(data,reemplazar,silent){
  var nueva=afFilterDeletedIntervs((data&&data.intervs)||[]);
  if(!nueva.length&&!(data&&data.intervs&&data.intervs.length)){
    if(!silent){syncStatus('Backup vac\u00edo en la nube','err');toast('No hay fojas en el backup');}
    else syncAutoStatusUpdate();
    return;
  }
  // Si la nube solo tenía fojas ya tombstoned, nueva puede quedar vacía pero es válido
  if(reemplazar){
    S.intervs=nueva.slice();
    saveIntervsToStorage();
    _syncMergeMeta(data);
    renderHome();
    if(!silent){syncStatus('\u2713 '+nueva.length+' fojas cargadas (reemplaz\u00f3 todo)','ok');toast('Sync completo \u2713');}
    else{_lastSyncPull=Date.now();syncAutoStatusUpdate();}
    return;
  }
  var antes=(S.intervs||[]).length;
  S.intervs=mergeIntervsLocalRemote(S.intervs,nueva);
  saveIntervsToStorage();
  _syncMergeMeta(data);
  renderHome();
  var agregados=S.intervs.length-antes;
  if(!silent){
    var msg='Nube: '+nueva.length+' fojas. Nuevas aqu\u00ed: '+Math.max(0,agregados)+'. Total: '+S.intervs.length;
    syncStatus('\u2713 '+msg,'ok');
    toast(agregados>0?('+'+agregados+' fojas'):'Sync al d\u00eda');
  }else{_lastSyncPull=Date.now();syncAutoStatusUpdate();}
}

function syncGuardarSupabase(data,silent){
  var n=(data.intervs||[]).length;
  var clave=getSyncClave();
  var row={clave:clave,datos:JSON.stringify(data)};
  var oid=(typeof AF_AUTH!=='undefined'&&AF_AUTH.getUserId)?AF_AUTH.getUserId():'';
  if(oid)row.owner_id=oid;
  return fetch(afSupabaseUrl()+'/rest/v1/anesfact_datos',{
    method:'POST',
    headers:afSupabaseHeaders({'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'}),
    body:JSON.stringify(row)
  }).then(function(r){
    if(r.ok||r.status===201||r.status===204){
      _lastSyncPush=Date.now();
      if(!silent){syncStatus('\u2713 '+n+' fojas en Supabase ('+new Date().toLocaleTimeString()+')','ok');toast('Guardado en la nube \u2713 ('+n+' fojas)');}
      else syncAutoStatusUpdate();
      return true;
    }
    return r.text().then(function(t){throw new Error('Supabase HTTP '+r.status+': '+t.slice(0,100));});
  });
}

function syncCargarSupabase(reemplazar,silent){
  var clave=getSyncClave();
  return fetchSyncPayloadWithFallbacks(clave).then(function(data){
    if(!data||!(data.intervs&&data.intervs.length)){
      _lastSyncErr='';
      if(!silent){syncStatus('No hay backup en Supabase todav\u00eda','err');toast('Todav\u00eda no hay backup en la nube');}
      else syncAutoStatusUpdate();
      return;
    }
    _lastSyncErr='';
    aplicarSyncData(data,reemplazar,silent);
  });
}

function syncGuardarAppsScript(data){
  var url=getSyncUrl();
  if(!url){syncStatus('Error Supabase y sin URL Apps Script','err');return;}
  var b64=btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  if(b64.length>900000){syncStatus('Demasiadas fojas para Apps Script — us\u00e1 Exportar JSON','err');return;}
  fetch(url,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(data)})
  .then(function(r){return r.json();})
  .then(function(res){
    if(res.ok){syncStatus('\u2713 Guardado Apps Script ('+new Date().toLocaleTimeString()+')','ok');toast('Guardado \u2713');}
    else syncStatus('Error Apps Script','err');
  }).catch(function(){
    fetch(url+'?action=save&data='+encodeURIComponent(b64)).then(function(r){return r.json();}).then(function(res){
      if(res.ok){syncStatus('\u2713 Guardado Apps Script','ok');toast('Guardado \u2713');}
      else syncStatus('Error al guardar','err');
    }).catch(function(e2){syncStatus('Error: '+e2.message,'err');});
  });
}

function syncCargarAppsScript(reemplazar){
  var url=getSyncUrl();
  if(!url){syncStatus('No hay backup (Supabase vac\u00edo)','err');return;}
  fetch(url+'?t='+Date.now()).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.text();}).then(function(txt){
    var data=JSON.parse(txt);
    if(!data||!data.intervs){syncStatus('No hay backup a\u00fan','err');return;}
    aplicarSyncData(data,reemplazar);
  }).catch(function(e){syncStatus('Error: '+e.message,'err');});
}

function syncGuardar(){
  syncStatus('Uniendo con la nube y guardando...','info');
  syncPrepareMergedPayload().then(function(data){
    var n=data.total;
    if(!n){toast('No hay fojas para guardar');syncAutoStatusUpdate();return;}
    return syncGuardarSupabase(data).catch(function(e){
      // Apps Script compartido DESHABILITADO como fallback automático (fuga entre usuarios)
      _lastSyncErr=e.message||'error';
      syncStatus('Error Supabase (sin fallback compartido): '+_lastSyncErr,'err');
      toast('No se pudo guardar en la nube');
      throw e;
    });
  }).catch(function(e){
    _lastSyncErr=e.message||'error';
    syncStatus('Error al subir: '+_lastSyncErr,'err');
    syncAutoStatusUpdate();
  });
}

function syncCargar(reemplazar){
  syncStatus('Cargando desde la nube...','info');
  syncCargarSupabase(!!reemplazar).catch(function(e){
    _lastSyncErr=e.message||'error';
    syncStatus('Error Supabase: '+_lastSyncErr+' (Apps Script compartido desactivado)','err');
    toast('No se pudo cargar desde la nube');
  });
}

function syncTraerTodo(){
  if(!confirm('Reemplazar TODAS las fojas de este equipo con las de la nube?\n(Las que solo est\u00e9n aqu\u00ed se pierden)'))return;
  syncCargar(true);
}

function syncAutoPull(silent){
  if(_syncBusy)return Promise.resolve();
  _syncBusy=true;
  return syncCargarSupabase(false,!!silent).catch(function(e){
    _lastSyncErr=e.message||'error';
    if(!silent)syncStatus('Auto-sync: '+_lastSyncErr,'err');
    syncAutoStatusUpdate();
  }).finally(function(){_syncBusy=false;});
}

function syncAutoPush(silent){
  if(_syncBusy)return Promise.resolve();
  _syncBusy=true;
  return syncPrepareMergedPayload().then(function(data){
    if(!data.total)return;
    _lastSyncErr='';
    return syncGuardarSupabase(data,!!silent);
  }).catch(function(e){
    _lastSyncErr=e.message||'error';
    if(!silent)syncStatus('Error al subir: '+_lastSyncErr,'err');
    syncAutoStatusUpdate();
  }).finally(function(){_syncBusy=false;});
}

function syncAutoPushDebounced(){
  clearTimeout(_syncPushTimer);
  _syncPushTimer=setTimeout(function(){syncAutoPush(true);},2500);
}
function syncCancelPushDebounced(){
  clearTimeout(_syncPushTimer);
  _syncPushTimer=null;
}

function initAutoSync(){
  setTimeout(function(){
    syncAutoPull(true).then(function(){
      return syncAutoPush(true);
    });
  },800);
  document.addEventListener('visibilitychange',function(){
    if(document.visibilityState==='visible'){
      syncAutoPull(true).then(function(){return syncAutoPush(true);});
    }
  });
  setInterval(function(){
    if(document.visibilityState==='visible'){
      syncAutoPull(true).then(function(){return syncAutoPush(true);});
    }
  },180000);
  syncAutoStatusUpdate();
}
// === DOCUMENTOS ===
function adjuntarDoc(input,tipo){var file=input.files[0];if(!file)return;var reader=new FileReader();reader.onload=function(e){var data=e.target.result;if(!S.cur)return;if(!S.cur.docs)S.cur.docs={};S.cur.docs[tipo]={nombre:file.name,tipo:file.type,data:data,fecha:new Date().toISOString()};var idx=S.intervs.findIndex(function(i){return i.id===S.cur.id;});if(idx>=0)S.intervs[idx]=S.cur;saveIntervsToStorage();renderDocBadges();toast(getNombreDoc(tipo)+' guardada \u2713');};reader.readAsDataURL(file);}
function getNombreDoc(tipo){return tipo==='anest'?'Foja Anest\u00e9sica':tipo==='qx'?'Foja Quir\u00fargica':'Autorizaci\u00f3n';}
function renderDocBadges(){var docs=(S.cur&&S.cur.docs)||{};['anest','qx','auth'].forEach(function(tipo){var badge=document.getElementById('doc-'+tipo+'-badge');var prev=document.getElementById('doc-'+tipo+'-prev');var label=document.getElementById('doc-'+tipo+'-label');if(!badge)return;if(docs[tipo]){badge.style.display='inline-block';var d=docs[tipo];var isImg=d.tipo&&d.tipo.startsWith('image/');if(prev)prev.innerHTML='<div style="display:flex;align-items:center;gap:8px;background:var(--bg3);border:1px solid var(--green);border-radius:8px;padding:8px 10px;margin-top:4px">'+(isImg?'<img src="'+d.data+'" style="height:44px;border-radius:4px;object-fit:cover">':'<span style="font-size:24px">doc</span>')+'<div style="flex:1;overflow:hidden"><div style="font-size:12px;font-weight:500">'+d.nombre+'</div><div style="font-size:11px;color:var(--text3)">'+new Date(d.fecha).toLocaleString()+'</div></div><button onclick="verDoc(\''+tipo+'\')" style="background:none;border:none;color:var(--blue);cursor:pointer;font-size:13px">ver</button><button onclick="borrarDoc(\''+tipo+'\')" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:18px">\u00d7</button></div>';if(label)label.style.borderColor='var(--green)';}else{badge.style.display='none';if(prev)prev.innerHTML='';if(label)label.style.borderColor='var(--border)';}});}
function verDoc(tipo){var docs=(S.cur&&S.cur.docs)||{};var d=docs[tipo];if(!d)return;var w=window.open('','_blank');if(d.tipo&&d.tipo.startsWith('image/')){w.document.write('<img src="'+d.data+'" style="max-width:100%">');}else{w.document.write('<embed src="'+d.data+'" width="100%" height="100%" type="application/pdf">');}w.document.close();}
function borrarDoc(tipo){if(!S.cur||!S.cur.docs)return;delete S.cur.docs[tipo];var idx=S.intervs.findIndex(function(i){return i.id===S.cur.id;});if(idx>=0)S.intervs[idx]=S.cur;saveIntervsToStorage();renderDocBadges();toast(getNombreDoc(tipo)+' eliminada');}
function cargarDocBadges(){setTimeout(renderDocBadges,100);}
function verDocRes(tipo){verDoc(tipo);}
function descargarDoc(tipo){var docs=(S.cur&&S.cur.docs)||{};var d=docs[tipo];if(!d)return;var a=document.createElement('a');a.href=d.data;a.download=d.nombre;document.body.appendChild(a);a.click();document.body.removeChild(a);toast('Descargando '+d.nombre);}

