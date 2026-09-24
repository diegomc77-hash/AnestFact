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
/** Nombres de prueba / basura que no deben sugerirse (viven en fojas o af_ciru, no en el catálogo). */
function afIsCirujanoBasura(name){
  var s=String(name||'').trim();
  if(!s)return true;
  // chupato/chupame/chupito/chupala y variantes
  if(/chupa/i.test(s))return true;
  if(/^(test|prueba|xxx+|asdf|foo|bar)$/i.test(s))return true;
  return false;
}
function afPurgeCirujanosBasuraLocal(){
  var changed=false;
  try{
    var raw=localStorage.getItem('af_ciru');
    if(raw){
      var arr=JSON.parse(raw);
      if(Array.isArray(arr)){
        var clean=arr.filter(function(c){return !afIsCirujanoBasura(c);});
        if(clean.length!==arr.length){
          localStorage.setItem('af_ciru',JSON.stringify(clean));
          changed=true;
        }
        if(typeof cirujanos!=='undefined')cirujanos=clean;
      }
    }
  }catch(e){}
  return changed;
}
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
    hint.textContent='Aeronáutico: sin nómina para esta especialidad. Escribí a mano o avisá para completarla.';
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
  var catalog=(esp&&map[esp])?map[esp].slice():[];
  var all=catalog.filter(function(c){return !afIsCirujanoBasura(c);});
  var seen={};
  all.forEach(function(c){seen[String(c).toUpperCase()]=true;});
  // Si hay nómina fija para esta esp+lugar, no mezclar aprendidos (evita placeholders “por todos lados”)
  var tieneNomina=all.length>0;
  if(tieneNomina)return all;
  // Sin nómina: solo aprendidos del mismo lugar + misma especialidad (serv vacío no cuenta)
  if(typeof S!=='undefined'&&S.intervs){
    S.intervs.forEach(function(i){
      if(!i||!i.ciru)return;
      if(san&&i.san&&i.san!==san)return;
      if(!esp||!i.serv||i.serv!==esp)return;
      var c=String(i.ciru).trim();
      if(!c||afIsCirujanoBasura(c))return;
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
  try{afPurgeCirujanosBasuraLocal();}catch(eP){}
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
  var intervs=S.intervs||[];
  if(typeof afIntervsPayloadForSync==='function')intervs=afIntervsPayloadForSync(intervs);
  var data={
    intervs:intervs,
    cirujanos:(typeof cirujanos!=='undefined'?cirujanos:[]),
    key:S.key||'',
    owner_id:uid||null,
    exportado:new Date().toISOString(),
    version:'AnesFact v8'
  };
  try{
    if(typeof afGeclisaQueueLoad==='function')data.geclisa_queue=afGeclisaQueueLoad();
    else if(typeof AFG_QUEUE_KEY==='string'){
      var rawQ=localStorage.getItem(AFG_QUEUE_KEY);
      if(rawQ)data.geclisa_queue=JSON.parse(rawQ);
    }
  }catch(eQ){}
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
      if(data.geclisa_queue&&typeof afSyncApplyGeclisaQueue==='function'){
        afSyncApplyGeclisaQueue(data.geclisa_queue);
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
  el.style.background=color==='ok'?'rgba(34,197,94,.1)':color==='err'?'rgba(239,68,68,.1)':'rgba(59,130,246,.1)';
  el.style.color=color==='ok'?'var(--green)':color==='err'?'var(--red)':'var(--blue)';
  el.style.border='1px solid '+(color==='ok'?'rgba(34,197,94,.3)':color==='err'?'rgba(239,68,68,.3)':'rgba(59,130,246,.3)');
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

var _afSyncLastKnownUpdatedAt={}; // clave -> updated_at remoto ya visto en esta sesión (memoria, no localStorage)
var AFG_SYNC_UNCHANGED='__AFG_SYNC_UNCHANGED__';

function fetchSyncPayload(clave){
  var uid=(typeof AF_AUTH!=='undefined'&&AF_AUTH.getUserId)?AF_AUTH.getUserId():'';
  var ownClave=(typeof getSyncClave==='function')?getSyncClave():'';
  function baseUrl(select){
    var u=afSupabaseUrl()+'/rest/v1/anesfact_datos?clave=eq.'+encodeURIComponent(clave)+'&select='+select+'&limit=1';
    if(uid&&clave===ownClave)u+='&owner_id=eq.'+encodeURIComponent(uid);
    return u;
  }
  function fullFetch(){
    return fetch(baseUrl('datos,updated_at'),{headers:afSupabaseHeaders()}).then(function(r){
      if(!r.ok)return r.text().then(function(t){throw new Error('HTTP '+r.status+(t?(': '+t.slice(0,80)):''));});
      return r.json();
    }).then(function(rows){
      if(!rows||!rows.length)return null;
      if(rows[0].updated_at)_afSyncLastKnownUpdatedAt[clave]=rows[0].updated_at;
      try{return JSON.parse(rows[0].datos||'{}');}catch(e){return null;}
    });
  }
  // Chequeo liviano: solo la fecha, antes de bajar el bloque grande (`datos`).
  // El json del chequeo va anidado para que fullFetch() por !r.ok no pase por el branch de filas.
  return fetch(baseUrl('updated_at'),{headers:afSupabaseHeaders()}).then(function(r){
    if(!r.ok)return fullFetch(); // si falla el chequeo liviano, comportamiento de siempre
    return r.json().then(function(rows){
      if(!rows||!rows.length)return null; // sin backup aún en Supabase
      var remoteAt=rows[0].updated_at||'';
      var known=_afSyncLastKnownUpdatedAt[clave]||'';
      if(remoteAt&&known&&remoteAt===known){
        try{console.log('[AFG sync] sin cambios remotos, salto fetch completo',clave);}catch(e){}
        return AFG_SYNC_UNCHANGED;
      }
      return fullFetch();
    });
  }).catch(function(){return fullFetch();}); // ante cualquier falla, no perder el comportamiento actual
}

/** Solo la clave del usuario autenticado — NUNCA fallback a Huerta/legacy (fuga entre usuarios). */
function fetchSyncPayloadWithFallbacks(primaryClave){
  if(!primaryClave)return Promise.resolve(null);
  return fetchSyncPayload(primaryClave);
}

function syncApplyMergedIntervs(merged,remoteMeta){
  var antes=(S.intervs||[]).length;
  function finish(list){
    S.intervs=list;
    try{saveIntervsToStorage();}catch(eQ){
      try{console.warn('[AF sync] save tras merge',eQ);}catch(eL){}
    }
    if(remoteMeta)_syncMergeMeta(remoteMeta);
    if(typeof renderHome==='function')renderHome();
    return S.intervs.length-antes;
  }
  if(typeof afDocsDetachListToIdb==='function'){
    return afDocsDetachListToIdb(merged||[]).then(function(list){
      return afDocsWarmCacheForList(list).then(function(){ return finish(list); });
    }).catch(function(){ return finish(merged||[]); });
  }
  return Promise.resolve(finish(merged||[]));
}

/**
 * Payload para anesfact_datos: migra data-URLs → IDB y NUNCA rehidrata blobs
 * al JSON de la nube (eso hinchaba ~MB y disparaba 57014 statement timeout).
 * Si hay Ticket 2 (Storage), sube y deja refs; si no, solo meta idb.
 */
function syncBuildCloudSafePayload(intervs){
  var list0=intervs||[];
  var audit=typeof afDocsAuditInlineData==='function'?afDocsAuditInlineData(list0):null;
  if(audit&&audit.inlineCount){
    try{console.warn('[AF sync] data-URLs inline → IDB',audit.inlineCount,audit.totalKB+'KB');}catch(eA){}
  }
  var detach=typeof afDocsDetachListToIdb==='function'
    ? afDocsDetachListToIdb(list0)
    : Promise.resolve(list0);
  return detach.then(function(list){
    if(typeof S!=='undefined')S.intervs=list;
    try{if(typeof saveIntervsToStorage==='function')saveIntervsToStorage();}catch(eS){}
    try{if(typeof afStripLocalDocQueues==='function')afStripLocalDocQueues();}catch(eQ){}
    var forCloud;
    if(typeof afDocsPayloadForStorageSync==='function'&&typeof afDocsHydrateIntervsForSync==='function'){
      forCloud=afDocsHydrateIntervsForSync(list).then(function(hydrated){
        return afDocsPayloadForStorageSync(hydrated).then(function(ready){
          // Seguridad: aunque falle algún upload, no mandar data-URL a la tabla
          return typeof afDocsStripDataForCloudSync==='function'
            ? afDocsStripDataForCloudSync(ready)
            : ready;
        });
      });
    }else if(typeof afDocsStripDataForCloudSync==='function'){
      forCloud=Promise.resolve(afDocsStripDataForCloudSync(list));
    }else{
      forCloud=Promise.resolve(list);
    }
    return forCloud.then(function(ready){
      var data=buildSyncPayloadFromIntervs(ready);
      data.total=data.intervs.length;
      try{
        var bodyKB=Math.round(JSON.stringify(data).length/1024);
        console.log('[AF sync] payload cloud',bodyKB+'KB','fojas',data.total,
          audit&&audit.inlineCount?('migratedInline='+audit.inlineCount):'');
      }catch(eL){}
      return data;
    });
  });
}

/** Tamaño real de la fila del usuario en anesfact_datos (chars del JSON `datos`). */
function afSyncMeasureRemoteRowSize(){
  var clave=getSyncClave();
  if(!clave||typeof afSupabaseUrl!=='function'){
    return Promise.resolve({ok:false,error:'no_clave'});
  }
  var uid=(typeof AF_AUTH!=='undefined'&&AF_AUTH.getUserId)?AF_AUTH.getUserId():'';
  var u=afSupabaseUrl()+'/rest/v1/anesfact_datos?clave=eq.'+encodeURIComponent(clave)+
    '&select=clave,updated_at,datos&limit=1';
  if(uid)u+='&owner_id=eq.'+encodeURIComponent(uid);
  return fetch(u,{headers:afSupabaseHeaders()}).then(function(r){
    if(!r.ok){
      return r.text().then(function(t){
        return {ok:false,error:'HTTP '+r.status,tip:String(t||'').slice(0,120)};
      });
    }
    return r.json().then(function(rows){
      if(!rows||!rows.length)return {ok:true,empty:true,clave:clave,chars:0,kb:0,mb:0};
      var raw=rows[0].datos;
      var chars=typeof raw==='string'?raw.length:JSON.stringify(raw||'').length;
      return {
        ok:true,
        empty:false,
        clave:rows[0].clave||clave,
        updated_at:rows[0].updated_at||'',
        chars:chars,
        kb:Math.round(chars/1024),
        mb:Math.round((chars/1048576)*100)/100
      };
    });
  }).catch(function(e){
    return {ok:false,error:String((e&&e.message)||e)};
  });
}

/**
 * Diagnóstico + migración IDB + push. Loguea tamaño remoto antes/después.
 * Uso: afSyncRepairInlineDocsAndPush() en consola (logueado).
 */
function afSyncRepairInlineDocsAndPush(opts){
  opts=opts||{};
  var silent=!!opts.silent;
  var before=null;
  var auditLocal=typeof afDocsAuditInlineData==='function'
    ? afDocsAuditInlineData(typeof S!=='undefined'?S.intervs:[])
    : null;
  try{console.log('[AF sync repair] audit local',auditLocal);}catch(e0){}
  return afSyncMeasureRemoteRowSize().then(function(m0){
    before=m0;
    try{console.log('[AF sync repair] remoto ANTES',m0);}catch(e1){}
    if(!silent&&typeof syncStatus==='function'){
      syncStatus('Reparando adjuntos y subiendo…','info');
    }
    return syncPrepareMergedPayload();
  }).then(function(data){
    return syncGuardarSupabase(data,silent);
  }).then(function(){
    return afSyncMeasureRemoteRowSize();
  }).then(function(m1){
    try{console.log('[AF sync repair] remoto DESPUÉS',m1,'ANTES',before);}catch(e2){}
    if(!silent&&typeof toast==='function'){
      var a=before&&before.kb!=null?before.kb+'KB':'?';
      var b=m1&&m1.kb!=null?m1.kb+'KB':'?';
      toast('Sync OK — nube '+a+' → '+b);
    }
    return {ok:true,before:before,after:m1,auditLocal:auditLocal};
  }).catch(function(e){
    try{console.error('[AF sync repair] FAIL',e);}catch(e3){}
    return {ok:false,error:String((e&&e.message)||e),before:before,auditLocal:auditLocal};
  });
}

function syncPrepareMergedPayload(){
  if(typeof afEmergencyNoSync==='function'&&afEmergencyNoSync()){
    return Promise.reject(new Error('emergency_no_sync'));
  }
  var clave=getSyncClave();
  return fetchSyncPayloadWithFallbacks(clave).then(function(remote){
    var local=afFilterDeletedIntervs(S.intervs||[]);
    S.intervs=local;
    var base;
    if(remote===AFG_SYNC_UNCHANGED||!remote||!remote.intervs||!remote.intervs.length){
      base=Promise.resolve(local);
    }else{
      var merged=mergeIntervsLocalRemote(local,remote.intervs);
      base=Promise.resolve(syncApplyMergedIntervs(merged,remote)).then(function(){ return S.intervs; });
    }
    return base.then(function(intervs){
      return syncBuildCloudSafePayload(intervs);
    });
  });
}

/**
 * Push inmediato post-borrado: sube el listado local (sin la foja) a Supabase.
 * No espera el debounce de 2.5s. Log explícito para diagnóstico.
 */
function syncPushAfterDelete(deletedId){
  if(typeof afEmergencyNoSync==='function'&&afEmergencyNoSync()){
    try{console.warn('[AF] syncPushAfterDelete bloqueado AF_EMERGENCY_NO_SYNC');}catch(e){}
    return Promise.resolve({ok:true,skipped:'emergency_no_sync'});
  }
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
    try{saveIntervsToStorage();}catch(eSave){}
    return syncBuildCloudSafePayload(S.intervs).then(function(data){
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
      });
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
  el.style.background=_lastSyncErr?'rgba(239,68,68,.08)':'rgba(34,197,94,.08)';
  el.style.color=_lastSyncErr?'var(--red)':'var(--text2)';
  el.style.border='1px solid '+(_lastSyncErr?'rgba(239,68,68,.25)':'var(--border)');
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
  return buildSyncPayloadFromIntervs(afFilterDeletedIntervs(S.intervs||[]));
}

function buildSyncPayloadFromIntervs(intervsIn){
  var intervs=intervsIn||[];
  if(typeof afIntervsPayloadForSync==='function')intervs=afIntervsPayloadForSync(intervs);
  var data={
    intervs:intervs,
    cirujanos:(typeof cirujanos!=='undefined'?cirujanos:[]),
    key:S.key||'',
    guardado:new Date().toISOString(),
    version:'AnesFact v7',
    total:intervs.length
  };
  try{
    if(typeof AFG_QUEUE_KEY==='string'&&AFG_QUEUE_KEY){
      var rawQ=localStorage.getItem(AFG_QUEUE_KEY);
      if(rawQ){
        var q=JSON.parse(rawQ);
        if(q&&typeof q==='object'&&!Array.isArray(q)&&Array.isArray(q.items)){
          data.geclisa_queue=q;
        }
      }
    }else if(typeof afGeclisaQueueLoad==='function'){
      data.geclisa_queue=afGeclisaQueueLoad();
    }
  }catch(eQ){}
  return data;
}

/** LWW cola Geclisa: updatedAt, luego version. No pisa local si remoto viene vacío/viejo. */
function afSyncApplyGeclisaQueue(remoteQueue){
  if(!remoteQueue||typeof remoteQueue!=='object'||Array.isArray(remoteQueue)||!Array.isArray(remoteQueue.items))return;
  var key=(typeof AFG_QUEUE_KEY==='string'&&AFG_QUEUE_KEY)?AFG_QUEUE_KEY:'afg_geclisa_queue';
  var local={version:0,updatedAt:0,items:[]};
  try{
    var raw=localStorage.getItem(key);
    if(raw){
      var p=JSON.parse(raw);
      if(p&&typeof p==='object'&&!Array.isArray(p)&&Array.isArray(p.items))local=p;
    }
  }catch(e1){}
  var rAt=Number(remoteQueue.updatedAt)||0;
  var lAt=Number(local.updatedAt)||0;
  var rV=Number(remoteQueue.version)||0;
  var lV=Number(local.version)||0;
  if(rAt<lAt||(rAt===lAt&&rV<=lV&&(local.items||[]).length))return;
  var envelope={
    version:rV||1,
    updatedAt:rAt||Date.now(),
    items:remoteQueue.items.slice()
  };
  try{
    localStorage.setItem(key,JSON.stringify(envelope));
  }catch(e2){
    try{console.warn('[AFG sync] geclisa_queue setItem fail',e2);}catch(e3){}
    return;
  }
  try{
    if(typeof afPublishGeclisaQueueSync==='function')afPublishGeclisaQueueSync(envelope,{skipCloudPush:true});
  }catch(e4){}
  try{
    if(typeof renderGeclisaQueuePanel==='function')renderGeclisaQueuePanel();
  }catch(e5){}
  try{console.log('[AFG sync] geclisa_queue aplicada v'+envelope.version+' items='+envelope.items.length);}catch(e6){}
}

function _syncMergeMeta(data){
  if(data.cirujanos&&data.cirujanos.length){var local=[];try{local=JSON.parse(localStorage.getItem('af_ciru')||'[]');}catch(e2){}data.cirujanos.forEach(function(c){if(local.indexOf(c)<0)local.push(c);});localStorage.setItem('af_ciru',JSON.stringify(local));}
  if(data.key&&!S.key){S.key=data.key;localStorage.setItem('af_k',S.key);}
  if(data.geclisa_queue)afSyncApplyGeclisaQueue(data.geclisa_queue);
}

function aplicarSyncData(data,reemplazar,silent){
  var nueva=afFilterDeletedIntervs((data&&data.intervs)||[]);
  if(!nueva.length&&!(data&&data.intervs&&data.intervs.length)){
    if(!silent){syncStatus('Backup vac\u00edo en la nube','err');toast('No hay fojas en el backup');}
    else syncAutoStatusUpdate();
    return Promise.resolve();
  }
  function after(list, statusMsg, toastMsg){
    S.intervs=list;
    try{saveIntervsToStorage();}catch(eQ){
      try{console.warn('[AF sync] aplicarSyncData save',eQ);}catch(eL){}
    }
    _syncMergeMeta(data);
    if(typeof renderHome==='function')renderHome();
    if(typeof afDocsWarmCacheForList==='function')afDocsWarmCacheForList(list);
    if(!silent){
      if(statusMsg)syncStatus('\u2713 '+statusMsg,'ok');
      if(toastMsg)toast(toastMsg);
    }else{_lastSyncPull=Date.now();syncAutoStatusUpdate();}
  }
  var detach=typeof afDocsDetachListToIdb==='function'
    ? afDocsDetachListToIdb
    : function(x){ return Promise.resolve(x); };

  if(reemplazar){
    return detach(nueva.slice()).then(function(list){
      after(list, list.length+' fojas cargadas (reemplaz\u00f3 todo)', 'Sync completo \u2713');
    });
  }
  var antes=(S.intervs||[]).length;
  var merged=mergeIntervsLocalRemote(S.intervs,nueva);
  return detach(merged).then(function(list){
    var agregados=list.length-antes;
    after(
      list,
      agregados>0
        ? ('Nube: '+nueva.length+' fojas. Nuevas aqu\u00ed: '+agregados+'. Total: '+list.length)
        : ('Nube: '+nueva.length+' fojas. Total: '+list.length),
      agregados>0 ? ('+'+agregados+' fojas') : 'Sync al d\u00eda'
    );
  });
}

function syncGuardarSupabase(data,silent){
  var n=(data.intervs||[]).length;
  var clave=getSyncClave();
  var row={clave:clave,datos:JSON.stringify(data)};
  var oid=(typeof AF_AUTH!=='undefined'&&AF_AUTH.getUserId)?AF_AUTH.getUserId():'';
  if(oid)row.owner_id=oid;
  var bodyStr=JSON.stringify(row);
  var bodyKB=Math.round(bodyStr.length/1024);
  return fetch(afSupabaseUrl()+'/rest/v1/anesfact_datos',{
    method:'POST',
    headers:afSupabaseHeaders({'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'}),
    body:bodyStr
  }).then(function(r){
    if(r.ok||r.status===201||r.status===204){
      _lastSyncPush=Date.now();
      if(!silent){syncStatus('\u2713 '+n+' fojas en Supabase ('+new Date().toLocaleTimeString()+')','ok');toast('Guardado en la nube \u2713 ('+n+' fojas)');}
      else syncAutoStatusUpdate();
      return true;
    }
    return r.text().then(function(t){
      var tip=String(t||'').slice(0,180);
      try{console.warn('[AF] syncGuardarSupabase fail',r.status,bodyKB+'KB',tip);}catch(eL){}
      if(/demo_sync_bloqueado/i.test(tip)){
        throw new Error(tip.indexOf('vencida')>=0
          ? 'Demo vencida — no se puede subir a la nube'
          : 'Demo: tope semanal de fojas en la nube (5)');
      }
      if(r.status===413||bodyKB>900){
        throw new Error('Payload sync demasiado grande ('+bodyKB+' KB). Liberá adjuntos o avisá a Diego.');
      }
      throw new Error('Supabase HTTP '+r.status+': '+tip);
    });
  });
}

function syncCargarSupabase(reemplazar,silent){
  var clave=getSyncClave();
  return fetchSyncPayloadWithFallbacks(clave).then(function(data){
    if(data===AFG_SYNC_UNCHANGED){
      _lastSyncErr='';
      if(!silent)syncStatus('Ya está al día','ok');
      else syncAutoStatusUpdate();
      return;
    }
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
  if(typeof afEmergencyNoSync==='function'&&afEmergencyNoSync()){
    try{console.warn('[AF] syncAutoPull bloqueado AF_EMERGENCY_NO_SYNC');}catch(e){}
    return Promise.resolve({ok:true,skipped:'emergency_no_sync'});
  }
  if(_syncBusy)return Promise.resolve();
  _syncBusy=true;
  return syncCargarSupabase(false,!!silent).catch(function(e){
    _lastSyncErr=e.message||'error';
    if(!silent)syncStatus('Auto-sync: '+_lastSyncErr,'err');
    syncAutoStatusUpdate();
  }).finally(function(){_syncBusy=false;});
}

function syncAutoPush(silent){
  if(typeof afEmergencyNoSync==='function'&&afEmergencyNoSync()){
    try{console.warn('[AF] syncAutoPush bloqueado AF_EMERGENCY_NO_SYNC');}catch(e){}
    return Promise.resolve({ok:true,skipped:'emergency_no_sync'});
  }
  if(_syncBusy)return Promise.resolve();
  _syncBusy=true;
  return syncPrepareMergedPayload().then(function(data){
    if(!data.total)return;
    _lastSyncErr='';
    return syncGuardarSupabase(data,!!silent);
  }).catch(function(e){
    if(e&&String(e.message||e)==='emergency_no_sync')return;
    _lastSyncErr=e.message||'error';
    if(!silent)syncStatus('Error al subir: '+_lastSyncErr,'err');
    syncAutoStatusUpdate();
  }).finally(function(){_syncBusy=false;});
}

function syncAutoPushDebounced(){
  if(typeof afEmergencyNoSync==='function'&&afEmergencyNoSync())return;
  clearTimeout(_syncPushTimer);
  _syncPushTimer=setTimeout(function(){syncAutoPush(true);},2500);
}
function syncCancelPushDebounced(){
  clearTimeout(_syncPushTimer);
  _syncPushTimer=null;
}

function initAutoSync(){
  if(typeof afEmergencyNoSync==='function'&&afEmergencyNoSync()){
    try{console.warn('[AF] initAutoSync: AF_EMERGENCY_NO_SYNC activo — sin pull/push');}catch(e){}
    syncAutoStatusUpdate();
    return;
  }
  // Migrar blobs de localStorage → IndexedDB (una vez por carga)
  var migrate=typeof afDocsDetachListToIdb==='function'
    ? afDocsDetachListToIdb(S.intervs||[])
    : Promise.resolve(S.intervs||[]);
  migrate.then(function(list){
    if(list&&list!==S.intervs)S.intervs=list;
    try{saveIntervsToStorage();}catch(eM){}
    if(typeof afDocsWarmCacheForList==='function')return afDocsWarmCacheForList(S.intervs);
  }).catch(function(){}).then(function(){
    setTimeout(function(){
      syncAutoPull(true).then(function(){
        return syncAutoPush(true);
      });
    },800);
  });
  document.addEventListener('visibilitychange',function(){
    if(document.visibilityState==='visible'){
      if(typeof afEmergencyNoSync==='function'&&afEmergencyNoSync())return;
      syncAutoPull(true).then(function(){return syncAutoPush(true);});
    }
  });
  setInterval(function(){
    if(document.visibilityState==='visible'){
      if(typeof afEmergencyNoSync==='function'&&afEmergencyNoSync())return;
      syncAutoPull(true).then(function(){return syncAutoPush(true);});
    }
  },180000);
  syncAutoStatusUpdate();
}
// === DOCUMENTOS ===
function afCommitAdjunto(tipo,doc){
  if(!S.cur||!doc)return;
  if(!S.cur.docs)S.cur.docs={};
  var prev=S.cur.docs[tipo];
  var hadKey=Object.prototype.hasOwnProperty.call(S.cur.docs,tipo);
  var intervId=String(S.cur.id);

  function persist(metaOrFull){
    S.cur.docs[tipo]=metaOrFull;
    var idx=S.intervs.findIndex(function(i){return i.id===S.cur.id;});
    if(idx>=0)S.intervs[idx]=S.cur;
    try{
      saveIntervsToStorage();
    }catch(e){
      if(hadKey)S.cur.docs[tipo]=prev;
      else delete S.cur.docs[tipo];
      if(e&&(e.afQuota||e.name==='QuotaExceededError'||e.code===22||e.code===1014)){
        if(typeof afToastMemoriaError==='function'){
          afToastMemoriaError('Memoria local llena: no se pudo guardar el adjunto. Liberá fojas/adjuntos viejos.');
        }else if(typeof toast==='function'){
          toast('Memoria local llena: no se pudo guardar el adjunto. Liberá fojas/adjuntos viejos.');
        }
        try{console.warn('[AF] QuotaExceeded afCommitAdjunto',e);}catch(eL){}
        return;
      }
      throw e;
    }
    if(typeof syncAutoPushDebounced==='function')syncAutoPushDebounced();
    renderDocBadges();
    toast(getNombreDoc(tipo)+' guardada \u2713');
  }

  if(typeof afDocIdbPut==='function'&&doc.data){
    afDocIdbPut(intervId,tipo,doc).then(function(ok){
      if(ok&&typeof afDocMetaFromFull==='function')persist(afDocMetaFromFull(doc));
      else persist(doc);
    }).catch(function(){ persist(doc); });
    return;
  }
  persist(doc);
}

var AF_GECLISA_PDF_MAX = 1572864; /* 1.5 MiB crudo; data-URL ~2 MB. No comprimir. */

function afDocIsP1bAlias(d){
  return !!(d && d.aliasOf && d.fuente==='geclisa_p1b' && !d.data);
}

/** PDF combinado: qx es un puntero a anest, sin duplicar el blob. */
function afResolveDoc(docs, tipo){
  var intervId=(typeof S!=='undefined'&&S.cur&&S.cur.id)?S.cur.id:'';
  if(typeof afDocsResolveWithCache==='function'){
    return afDocsResolveWithCache(docs,tipo,intervId);
  }
  var d=docs&&docs[tipo];
  if(!d)return null;
  if(!d.aliasOf)return d;
  var src=docs[d.aliasOf];
  if(!src||!src.data)return d;
  return{
    nombre:src.nombre,
    tipo:src.tipo,
    data:src.data,
    fecha:src.fecha,
    fuente:d.fuente||src.fuente,
    size:src.size,
    aliasOf:d.aliasOf
  };
}

/**
 * Si el parseo dice qx+anest, marcar docs.qx como alias (sin data).
 * No pisa un qx colgado a mano. Si el combinado aún no está completo, saca el alias.
 */
function afSyncGeclisaQxAlias(it, complete, opts){
  opts=opts||{};
  if(!it)return false;
  if(!it.docs)it.docs={};
  var qx=it.docs.qx;
  if(complete && it.docs.anest && it.docs.anest.fuente==='geclisa_p1b'){
    if(qx && qx.data && !qx.aliasOf)return false;
    if(opts.fromCommit)it.mayo_pdf_qx_alias_off=false;
    if(it.mayo_pdf_qx_alias_off && !opts.fromCommit)return false;
    if(afDocIsP1bAlias(qx))return false;
    it.docs.qx={ aliasOf:'anest', fuente:'geclisa_p1b' };
    return true;
  }
  if(afDocIsP1bAlias(qx)){
    delete it.docs.qx;
    return true;
  }
  return false;
}

function afFindIntervById(id){
  id=String(id||'');
  if(!id||typeof S==='undefined')return null;
  if(S.cur&&String(S.cur.id)===id)return S.cur;
  var list=S.intervs||[];
  for(var i=0;i<list.length;i++){
    if(String(list[i].id)===id)return list[i];
  }
  return null;
}

function afMayoPdfMeta(intervId){
  var it=afFindIntervById(intervId);
  if(!it)return{ok:false,error:'interv_not_found',intervId:String(intervId||'')};
  return{
    ok:true,
    intervId:String(it.id),
    nroAtencion:(typeof afNormMayoNroAtencion==='function'?afNormMayoNroAtencion(it.mayo_nro_atencion):String(it.mayo_nro_atencion||'').replace(/\D/g,'')),
    fecha:(it.fecha||'').trim(),
    hora:(it.hora||'').trim(),
    ciru:(it.ciru||'').trim(),
    pendingQx:!!it.mayo_pdf_qx_pendiente
  };
}

/**
 * PDF combinado GECLISA → docs.anest. No rasteriza. No pisa adjunto manual.
 * Toast solo si el combinado está completo.
 */
function afCommitGeclisaPdf(intervId,payload,opts){
  opts=opts||{};
  var id=String(intervId||'').trim();
  var it=afFindIntervById(id);
  if(!it)return Promise.resolve({ok:false,error:'interv_not_found',intervId:id});
  var existing=it.docs&&it.docs.anest;
  if(existing&&existing.fuente&&existing.fuente!=='geclisa_p1b'){
    try{console.log('[AFG] PDF GECLISA no pisa adjunto manual',id);}catch(e0){}
    return Promise.resolve({ok:false,skipped:'manual',intervId:id});
  }
  var size=Number(payload&&payload.size)||0;
  if(size>AF_GECLISA_PDF_MAX){
    return Promise.resolve({ok:false,error:'too_large',size:size,maxBytes:AF_GECLISA_PDF_MAX,intervId:id});
  }
  var data=payload&&payload.dataUrl;
  if(!data&&payload&&payload.base64){
    data='data:application/pdf;base64,'+payload.base64;
  }
  if(!data)return Promise.resolve({ok:false,error:'no_data',intervId:id});

  var doc={
    nombre:payload.nombre||'Reporte.pdf',
    tipo:payload.mime||'application/pdf',
    data:data,
    fecha:new Date().toISOString(),
    fuente:'geclisa_p1b',
    size:size
  };

  function inspect(look){
    look=look||{parseOk:false,complete:false};
    var complete=!!look.complete;
    if(!it.docs)it.docs={};
    it.docs.anest=doc;
    it.mayo_pdf_qx_pendiente=!complete;
    afSyncGeclisaQxAlias(it, complete, {fromCommit:true});
    it._ts=Date.now();
    var idx=S.intervs.findIndex(function(x){return String(x.id)===id;});
    if(idx>=0)S.intervs[idx]=it;
    if(S.cur&&String(S.cur.id)===id)S.cur=it;
    saveIntervsToStorage();
    if(typeof syncAutoPushDebounced==='function')syncAutoPushDebounced();
    if(typeof afGeclisaQueueSetPdfPending==='function')afGeclisaQueueSetPdfPending(id,!complete);
    if(S.cur&&String(S.cur.id)===id&&typeof renderDocBadges==='function')renderDocBadges();
    if(complete&&opts.toast!==false&&typeof toast==='function'){
      toast('Foja GECLISA (qx + anestesia) guardada \u2713');
    }
    try{
      console.log('[AFG] PDF GECLISA commit',id,'complete=',complete,'parseOk=',!!look.parseOk,'size=',size);
    }catch(eL){}
    return{
      ok:true,
      intervId:id,
      complete:complete,
      pendingQx:!complete,
      parseOk:!!look.parseOk,
      hasQx:!!look.hasQx,
      hasAnest:!!look.hasAnest,
      verify:look.verify||null,
      wide:!!opts.wide,
      size:size
    };
  }

  var meta={
    wide:!!opts.wide,
    ciru:(opts.ciru!=null?opts.ciru:(it.ciru||'')),
    fecha:it.fecha||'',
    hora:it.hora||''
  };
  var dry=!!opts.dryRun||(typeof window!=='undefined'&&!!window.AF_PDF_VERIFY_DRY);

  if(typeof afPdfLooksComplete!=='function'){
    if(dry) return Promise.resolve({ok:true,dryRun:true,intervId:id,complete:false,parseOk:false,wide:meta.wide});
    return Promise.resolve(inspect({parseOk:false,complete:false}));
  }
  return afPdfLooksComplete(data, meta).then(function(look){
    if(dry){
      try{console.log('[AFG] PDF GECLISA dry-run',id,'wide=',meta.wide,'complete=',!!(look&&look.complete),'verify=',look&&look.verify);}catch(eD){}
      return{
        ok:true,
        dryRun:true,
        intervId:id,
        complete:!!(look&&look.complete),
        pendingQx:!(look&&look.complete),
        parseOk:!!(look&&look.parseOk),
        hasQx:!!(look&&look.hasQx),
        hasAnest:!!(look&&look.hasAnest),
        verify:look&&look.verify||null,
        wide:meta.wide,
        size:size
      };
    }
    if(meta.wide && !(look && look.complete)){
      try{console.log('[AFG] PDF GECLISA wide no verifica, no pisa',id,look&&look.verify);}catch(eV){}
      return{
        ok:false,
        skipped:'verify',
        intervId:id,
        complete:false,
        pendingQx:true,
        parseOk:!!(look&&look.parseOk),
        hasQx:!!(look&&look.hasQx),
        hasAnest:!!(look&&look.hasAnest),
        verify:look&&look.verify||null,
        wide:true,
        size:size
      };
    }
    return inspect(look);
  });
}
function adjuntarDoc(input,tipo){
  var file=input&&input.files&&input.files[0];
  if(input)input.value='';
  if(!file)return;
  if(!S.cur){toast('Abrí una intervención primero');return;}
  if(file.size>500*1024)toast('Ajustando\u2026');
  // Ticket 6: confirmar DESPUÉS de preparar el doc (preview = lo que se va a guardar).
  var finish=function(doc){
    if(!doc||!doc.data){toast('No se pudo leer el archivo');return;}
    afConfirmAdjunto(doc,tipo).then(function(ok){
      if(ok)afCommitAdjunto(tipo,doc);
    });
  };
  var fallback=function(){
    var reader=new FileReader();
    reader.onload=function(e){
      finish({nombre:file.name,tipo:file.type,data:e.target.result,fecha:new Date().toISOString()});
    };
    reader.onerror=function(){toast('No se pudo leer el archivo');};
    reader.readAsDataURL(file);
  };
  if(typeof afPrepareAdjunto!=='function'){fallback();return;}
  afPrepareAdjunto(file).then(finish).catch(fallback);
}

/**
 * Ticket 6: cartel antes de afCommitAdjunto.
 * @param {object} doc — ya preparado ({nombre,tipo,data,...})
 * @param {string} tipo — anest|qx|auth
 * @returns {Promise<boolean>}
 */
function afConfirmAdjunto(doc,tipo){
  return new Promise(function(resolve){
    var existing=S.cur&&S.cur.docs&&S.cur.docs[tipo];
    var hasExisting=!!(existing&&(existing.data||existing.idb||existing.storage||existing.aliasOf||existing.nombre));
    var pac=(S.cur&&(S.cur.pac||'').trim())||'(sin paciente)';
    var dni=(S.cur&&(S.cur.dni||'').trim())||'';
    var fecha=(S.cur&&(S.cur.fecha||'').trim())||'';
    var slotName=typeof getNombreDoc==='function'?getNombreDoc(tipo):(tipo||'Adjunto');
    var mime=(doc&&doc.tipo)||'';
    var fname=(doc&&doc.nombre)||'archivo';
    var isImg=mime.indexOf('image/')===0||/^data:image\//i.test(doc.data||'');
    var isPdf=mime==='application/pdf'||/\.pdf$/i.test(fname)||/^data:application\/pdf/i.test(doc.data||'');
    var sizeApprox=doc.size!=null?doc.size:String(doc.data||'').length;

    var prev=document.getElementById('af-adjunto-confirm');
    if(prev&&prev.parentNode)prev.parentNode.removeChild(prev);

    var overlay=document.createElement('div');
    overlay.id='af-adjunto-confirm';
    overlay.className='af-adj-overlay';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');

    var box=document.createElement('div');
    box.className='af-adj-box card';

    var previewHtml='';
    if(isImg&&doc.data){
      previewHtml='<img class="af-adj-preview" src="'+doc.data+'" alt="Vista previa">';
    }else if(isPdf&&doc.data){
      previewHtml='<embed class="af-adj-preview-pdf" src="'+doc.data+'" type="application/pdf">';
    }else{
      previewHtml='<div class="af-adj-preview-fallback">'+String(fname).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</div>';
    }

    var replaceHtml=hasExisting
      ? '<p class="af-adj-warn">Ya hab&iacute;a un archivo en <strong>'+slotName+'</strong>'
        +(existing.nombre?' (&laquo;'+String(existing.nombre).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'&raquo;)':'')
        +'. Si confirm&aacute;s, se <strong>reemplaza</strong>.</p>'
      : '';

    function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}

    box.innerHTML=
      '<div class="ct">Confirmar adjunto</div>'
      +'<p class="af-adj-meta">Casilla: <strong>'+esc(slotName)+'</strong></p>'
      +'<p class="af-adj-meta">Paciente: <strong>'+esc(pac)+'</strong>'
      +(dni?' · DNI '+esc(dni):'')
      +(fecha?' · '+esc(fecha):'')
      +'</p>'
      +'<p class="af-adj-meta">Archivo: <strong>'+esc(fname)+'</strong>'
      +' · '+Math.max(1,Math.round(sizeApprox/1024))+' KB</p>'
      +replaceHtml
      +'<div class="af-adj-preview-wrap">'+previewHtml+'</div>'
      +'<p class="af-adj-hint">Confirm&aacute; que este archivo es <strong>'+esc(slotName)+'</strong> de este paciente.</p>'
      +'<div class="af-adj-actions">'
      +'<button type="button" class="btn btn-s af-adj-cancel" style="flex:1">Cancelar</button>'
      +'<button type="button" class="btn af-adj-ok" style="flex:1">'+(hasExisting?'Reemplazar':'Confirmar')+'</button>'
      +'</div>';

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    function cleanup(ok){
      if(overlay.parentNode)overlay.parentNode.removeChild(overlay);
      document.removeEventListener('keydown',onKey);
      resolve(!!ok);
    }
    function onKey(e){
      if(e.key==='Escape'){e.preventDefault();cleanup(false);}
    }
    document.addEventListener('keydown',onKey);
    box.querySelector('.af-adj-cancel').onclick=function(){cleanup(false);};
    box.querySelector('.af-adj-ok').onclick=function(){cleanup(true);};
    overlay.addEventListener('click',function(e){
      if(e.target===overlay)cleanup(false);
    });
  });
}
function getNombreDoc(tipo){return tipo==='anest'?'Foja Anest\u00e9sica':tipo==='qx'?'Foja Quir\u00fargica':'Autorizaci\u00f3n';}
function renderDocBadges(){
  if(S.cur&&S.cur.docs&&S.cur.docs.anest&&S.cur.docs.anest.fuente==='geclisa_p1b'&&!S.cur.mayo_pdf_qx_pendiente){
    if(afSyncGeclisaQxAlias(S.cur,true)){
      var idxBf=S.intervs.findIndex(function(i){return i.id===S.cur.id;});
      if(idxBf>=0)S.intervs[idxBf]=S.cur;
      saveIntervsToStorage();
      if(typeof syncAutoPushDebounced==='function')syncAutoPushDebounced();
    }
  }
  var docs=(S.cur&&S.cur.docs)||{};
  var intervId=S.cur&&S.cur.id;
  var needWarm=false;
  ['anest','qx','auth'].forEach(function(tipo){
    var raw=docs[tipo];
    if(!raw||raw.data||raw.aliasOf)return;
    if(raw.idb&&typeof afDocIdbGet==='function'&&intervId&&!afDocMemGet(intervId,tipo)){
      needWarm=true;
      afDocIdbGet(intervId,tipo).then(function(){ renderDocBadges(); });
    }
  });
  if(needWarm){
    // Primera pasada: mostrar badge por metadata mientras llega el blob
  }
  ['anest','qx','auth'].forEach(function(tipo){
    var badge=document.getElementById('doc-'+tipo+'-badge');
    var prev=document.getElementById('doc-'+tipo+'-prev');
    var label=document.getElementById('doc-'+tipo+'-label');
    if(!badge)return;
    var raw=docs[tipo];
    var d=afResolveDoc(docs,tipo);
    var hasSlot=!!raw;
    var hasData=!!(d&&d.data);
    var pendingIdb=!!(raw&&raw.idb&&!hasData&&!raw.aliasOf);
    var pendingStorage=!!(raw&&raw.storage&&raw.storagePath&&!hasData&&!raw.aliasOf);
    if(hasSlot&&(hasData||pendingIdb||pendingStorage||raw.aliasOf)){
      badge.style.display='inline-block';
      var isImg=hasData&&d.tipo&&d.tipo.startsWith('image/');
      var sub=d&&d.aliasOf
        ? 'mismo archivo (qx + anest)'
        : (pendingIdb?'cargando\u2026':(d&&d.fecha?new Date(d.fecha).toLocaleString():''));
      if(prev){
        prev.innerHTML='<div style="display:flex;align-items:center;gap:8px;background:var(--bg3);border:1px solid var(--green);border-radius:8px;padding:8px 10px;margin-top:4px">'
          +(isImg?'<img src="'+d.data+'" style="height:44px;border-radius:4px;object-fit:cover">':'<span style="font-size:24px">doc</span>')
          +'<div style="flex:1;overflow:hidden"><div style="font-size:12px;font-weight:500">'+(d&&d.nombre||raw.nombre||getNombreDoc(tipo))+'</div>'
          +'<div style="font-size:11px;color:var(--text3)">'+sub+'</div></div>'
          +'<button onclick="verDoc(\''+tipo+'\')" style="background:none;border:none;color:var(--blue);cursor:pointer;font-size:13px">ver</button>'
          +'<button onclick="borrarDoc(\''+tipo+'\')" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:18px">\u00d7</button></div>';
      }
      if(label)label.style.borderColor='var(--green)';
    }else{
      badge.style.display='none';
      if(prev)prev.innerHTML='';
      if(label)label.style.borderColor='var(--border)';
    }
  });
}
function afOpenDocData(d){
  if(!d||!d.data){
    if(typeof toast==='function')toast('Documento no disponible');
    return;
  }
  var w=window.open('','_blank');
  if(!w){if(typeof toast==='function')toast('Permit\u00ed ventanas emergentes');return;}
  if(d.tipo&&d.tipo.startsWith('image/')){
    w.document.write('<img src="'+d.data+'" style="max-width:100%">');
  }else{
    w.document.write('<embed src="'+d.data+'" width="100%" height="100%" type="application/pdf">');
  }
  w.document.close();
}
function verDoc(tipo){
  var docs=(S.cur&&S.cur.docs)||{};
  var intervId=S.cur&&S.cur.id;
  var d=afResolveDoc(docs,tipo);
  if(d&&d.data){afOpenDocData(d);return;}
  if(typeof afDocEnsureLocalData==='function'){
    if(typeof toast==='function')toast('Descargando adjunto…');
    afDocEnsureLocalData(docs,tipo,intervId).then(function(full){
      if(!full||!full.data){if(typeof toast==='function')toast('Documento no disponible');return;}
      afOpenDocData(full);
    });
    return;
  }
  var raw=docs[tipo];
  var srcTipo=(raw&&raw.aliasOf)?raw.aliasOf:tipo;
  if(intervId&&typeof afDocIdbGet==='function'&&((raw&&raw.idb)||(docs[srcTipo]&&docs[srcTipo].idb))){
    afDocIdbGet(intervId,srcTipo).then(function(full){
      if(!full||!full.data){if(typeof toast==='function')toast('Documento no disponible');return;}
      afOpenDocData({
        nombre:d&&d.nombre||full.nombre,
        tipo:full.tipo,
        data:full.data,
        fecha:full.fecha,
        fuente:d&&d.fuente||full.fuente,
        size:full.size,
        aliasOf:raw&&raw.aliasOf
      });
    });
    return;
  }
  if(typeof toast==='function')toast('Documento no disponible');
}
function borrarDoc(tipo){
  if(!S.cur||!S.cur.docs)return;
  var intervId=String(S.cur.id);
  if(tipo==='qx'&&afDocIsP1bAlias(S.cur.docs.qx)){
    S.cur.mayo_pdf_qx_alias_off=true;
  }
  if(tipo==='anest'&&afDocIsP1bAlias(S.cur.docs.qx)&&S.cur.docs.qx.aliasOf==='anest'){
    delete S.cur.docs.qx;
  }
  delete S.cur.docs[tipo];
  if(typeof afDocIdbDelete==='function'){
    try{afDocIdbDelete(intervId,tipo);}catch(eD){}
  }
  var idx=S.intervs.findIndex(function(i){return i.id===S.cur.id;});
  if(idx>=0)S.intervs[idx]=S.cur;
  saveIntervsToStorage();
  if(typeof syncAutoPushDebounced==='function')syncAutoPushDebounced();
  renderDocBadges();
  toast(getNombreDoc(tipo)+' eliminada');
}
function cargarDocBadges(){setTimeout(renderDocBadges,100);}
function verDocRes(tipo){verDoc(tipo);}
function descargarDoc(tipo){
  var docs=(S.cur&&S.cur.docs)||{};
  var intervId=S.cur&&S.cur.id;
  function doDl(d){
    if(!d||!d.data){if(typeof toast==='function')toast('Documento no disponible');return;}
    var a=document.createElement('a');
    a.href=d.data;
    a.download=d.nombre||('doc-'+tipo);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('Descargando '+d.nombre);
  }
  var d=afResolveDoc(docs,tipo);
  if(d&&d.data){doDl(d);return;}
  if(typeof afDocEnsureLocalData==='function'){
    afDocEnsureLocalData(docs,tipo,intervId).then(function(full){ doDl(full); });
    return;
  }
  var raw=docs[tipo];
  var srcTipo=(raw&&raw.aliasOf)?raw.aliasOf:tipo;
  if(intervId&&typeof afDocIdbGet==='function'&&((raw&&raw.idb)||(docs[srcTipo]&&docs[srcTipo].idb))){
    afDocIdbGet(intervId,srcTipo).then(function(full){
      doDl(full?Object.assign({},raw||{},full):null);
    });
    return;
  }
  if(typeof toast==='function')toast('Documento no disponible');
}

