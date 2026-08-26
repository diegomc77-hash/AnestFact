var _afHomeQUserTyped=false;

function afLooksLikeAutofillJunk(v){
  v=String(v||'').trim();
  if(!v)return false;
  // Chrome mete el mail de la cuenta guardada en el primer text input
  if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))return true;
  return false;
}

function afUpdateHomeQClearBtn(){
  var btn=document.getElementById('home-q-clear');
  var inp=document.getElementById('home-q');
  if(!btn||!inp)return;
  if(String(inp.value||'').length)btn.classList.add('is-on');
  else btn.classList.remove('is-on');
}

/** Limpia el buscador; hard=true recrea el input (única forma fiable de sacar autofill sticky). */
function afClearHomeQ(hard){
  _afHomeQUserTyped=false;
  var inp=document.getElementById('home-q');
  if(inp){
    inp.value='';
    try{inp.defaultValue='';}catch(e){}
  }
  if(hard)afMountHomeSearch(true);
  else{
    inp=document.getElementById('home-q');
    if(inp){
      inp.value='';
      try{inp.defaultValue='';}catch(e2){}
    }
    afUpdateHomeQClearBtn();
  }
  if(typeof renderHome==='function')renderHome();
}

/**
 * Monta el buscador de Home por JS (no en HTML estático) + form autocomplete=off
 * + honeypots + readonly hasta foco + strip de mail autofill.
 */
function afMountHomeSearch(force){
  var host=document.getElementById('home-q-mount');
  if(!host)return;
  if(!force&&document.getElementById('home-q')&&host.querySelector('form.af-home-q-form')){
    afUpdateHomeQClearBtn();
    return;
  }
  var keep='';
  var old=document.getElementById('home-q');
  if(old){
    var ov=String(old.value||'');
    if(ov&&!afLooksLikeAutofillJunk(ov)&&_afHomeQUserTyped)keep=ov;
  }

  host.innerHTML='';
  var form=document.createElement('form');
  form.className='af-home-q-form';
  form.setAttribute('autocomplete','off');
  form.setAttribute('autocapitalize','off');
  form.addEventListener('submit',function(e){e.preventDefault();return false;});

  // Cebos: Chrome suele llenar estos en vez del filtro real
  function decoy(type,name,ac){
    var d=document.createElement('input');
    d.type=type;
    d.name=name;
    d.autocomplete=ac;
    d.tabIndex=-1;
    d.setAttribute('aria-hidden','true');
    d.style.cssText='position:absolute;left:-10000px;top:auto;width:1px;height:1px;opacity:0;overflow:hidden';
    return d;
  }
  form.appendChild(decoy('text','username','username'));
  form.appendChild(decoy('email','email','email'));
  form.appendChild(decoy('password','password','current-password'));

  var wrap=document.createElement('div');
  wrap.className='home-q-wrap';

  var inp=document.createElement('input');
  inp.className='fi';
  inp.type='text';
  inp.id='home-q';
  // name random: sin search/query/user/email
  inp.name='af-filtro-x7k2-'+Math.random().toString(36).slice(2,8);
  inp.placeholder='Nombre, DNI, cirujano, diagnóstico...';
  inp.spellcheck=false;
  inp.setAttribute('autocapitalize','off');
  inp.setAttribute('autocorrect','off');
  inp.setAttribute('autocomplete','one-time-code');
  inp.setAttribute('data-lpignore','true');
  inp.setAttribute('data-1p-ignore','true');
  inp.setAttribute('data-bwignore','true');
  inp.setAttribute('data-form-type','other');
  inp.setAttribute('inputmode','search');
  inp.readOnly=true;
  if(keep)inp.value=keep;

  var clearBtn=document.createElement('button');
  clearBtn.type='button';
  clearBtn.id='home-q-clear';
  clearBtn.className='home-q-clear';
  clearBtn.setAttribute('aria-label','Limpiar búsqueda');
  clearBtn.title='Limpiar';
  clearBtn.textContent='\u00d7';
  clearBtn.addEventListener('click',function(e){
    e.preventDefault();
    e.stopPropagation();
    afClearHomeQ(true);
  });

  inp.addEventListener('focus',function(){
    var self=this;
    setTimeout(function(){try{self.removeAttribute('readonly');}catch(e){}},30);
  });
  inp.addEventListener('input',function(){
    _afHomeQUserTyped=true;
    afUpdateHomeQClearBtn();
    if(typeof renderHome==='function')renderHome();
  });
  inp.addEventListener('change',function(){
    // Autofill a veces dispara change sin input
    if(afLooksLikeAutofillJunk(this.value)&&!_afHomeQUserTyped){
      this.value='';
      afUpdateHomeQClearBtn();
      if(typeof renderHome==='function')renderHome();
      try{console.log('[AFG] home-q: stripped autofill on change');}catch(e){}
      return;
    }
    afUpdateHomeQClearBtn();
    if(typeof renderHome==='function')renderHome();
  });
  inp.addEventListener('keydown',function(e){
    if(e.key==='Escape'){e.preventDefault();afClearHomeQ(true);}
  });

  wrap.appendChild(inp);
  wrap.appendChild(clearBtn);
  form.appendChild(wrap);
  host.appendChild(form);

  [50,150,400,900,1800].forEach(function(ms){
    setTimeout(function(){
      if(_afHomeQUserTyped)return;
      var el=document.getElementById('home-q');
      if(!el)return;
      if(afLooksLikeAutofillJunk(el.value)){
        el.value='';
        try{el.defaultValue='';}catch(e){}
        afUpdateHomeQClearBtn();
        if(typeof renderHome==='function')renderHome();
        try{console.log('[AFG] home-q: stripped autofill @'+ms+'ms');}catch(e2){}
      }
    },ms);
  });
  afUpdateHomeQClearBtn();
}

function limpiarFiltrosHome(){
  afClearHomeQ(true);
  ['home-desde','home-hasta'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});
  ['home-san','home-estado'].forEach(function(id){var e=document.getElementById(id);if(e)e.selectedIndex=0;});
  renderHome();
}
/** Quita tildes para buscar "Garcia" ≈ "García". */
function afFoldSearchText(s){
  return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
/** Todas las palabras del query deben aparecer en el blob (cualquier orden). */
function afMatchSearchQuery(blob,q){
  if(!q)return true;
  var b=afFoldSearchText(blob);
  var tokens=afFoldSearchText(q).split(/\s+/).filter(Boolean);
  if(!tokens.length)return true;
  for(var i=0;i<tokens.length;i++){
    if(b.indexOf(tokens[i])<0)return false;
  }
  return true;
}
function filterIntervs(list){
  var mode=(S.listMode==='preop')?'preop':'fojas';
  var qEl=document.getElementById(mode==='preop'?'preop-q':'home-q');
  var q=(qEl&&qEl.value?qEl.value:'').trim();
  var san=(document.getElementById('home-san')||{value:''}).value;
  var est=(document.getElementById('home-estado')||{value:''}).value;
  var desde=(document.getElementById('home-desde')||{value:''}).value;
  var hasta=(document.getElementById('home-hasta')||{value:''}).value;
  return(list||[]).filter(function(x){
    if(!x)return false;
    if(mode==='preop'){
      if(x.estado!=='preoperatorio')return false;
    }else if(x.estado==='preoperatorio'){
      return false;
    }
    if(mode==='fojas'){
      if(san){
        var s=(x.san||'').toLowerCase();
        if(san==='mayo'&&s.indexOf('mayo')<0)return false;
        if(san==='aero'&&(s.indexOf('aero')<0&&s.indexOf('aeron')<0))return false;
        if(san==='otro'&&(s.indexOf('mayo')>=0||s.indexOf('aero')>=0||s.indexOf('aeron')>=0))return false;
      }
      if(est&&x.estado!==est)return false;
      if(desde&&x.fecha&&x.fecha<desde)return false;
      if(hasta&&x.fecha&&x.fecha>hasta)return false;
    }
    if(!q)return true;
    var blob=(x.pac||'')+' '+(x.dni||'')+' '+(x.san||'')+' '+(x.diag||'')+' '+(x.ciru||'')+' '+(x.serv||'');
    return afMatchSearchQuery(blob,q);
  });
}
function afSanatorioCssClass(san){
  var s=String(san||'').toLowerCase();
  if(s.indexOf('mayo')>=0)return 'inter-san-mayo';
  if(s.indexOf('aero')>=0||s.indexOf('aeron')>=0)return 'inter-san-aero';
  if(s.indexOf('allende')>=0)return 'inter-san-allende';
  if(s.indexOf('sucre')>=0)return 'inter-san-sucre';
  if(s.indexOf('privado')>=0)return 'inter-san-privado';
  if(s.trim())return 'inter-san-otro';
  return '';
}

function afIsAeroInterv(i){
  if(!i)return false;
  var s=String(i.san||'').toLowerCase();
  return s.indexOf('aero')>=0||s.indexOf('aeron')>=0;
}

function afDestinoEnviadoPorSan(i){
  var s=String((i&&i.san)||'').toLowerCase();
  if(s.indexOf('mayo')>=0)return 'enviado_geclisa';
  if(s.indexOf('aero')>=0||s.indexOf('aeron')>=0)return 'enviado_evweb';
  return null;
}

/**
 * Saca una foja de "preoperatorio" → borrador (marca local explícita).
 * Misma idea que desmarcar GECLISA/evweb: no borra datos clínicos.
 */
function afSalirPreoperatorio(intervId, ev){
  if(ev){try{ev.stopPropagation();ev.preventDefault();}catch(e){}}
  var id=String(intervId||(S.cur&&S.cur.id)||'').trim();
  if(!id||!S.intervs){if(typeof toast==='function')toast('Sin foja');return false;}
  var idx=-1;
  for(var i=0;i<S.intervs.length;i++){
    if(String(S.intervs[i].id)===id){idx=i;break;}
  }
  if(idx<0){if(typeof toast==='function')toast('Foja no encontrada');return false;}
  var it=S.intervs[idx];
  if(it.estado!=='preoperatorio'){
    if(typeof toast==='function')toast('No está en preoperatorio');
    return false;
  }
  if(!confirm('¿Sacar de “Preoperatorio pendiente”?\nPasará a Borrador (podés seguir cargando o marcar Listo/enviado después).'))return false;
  it.estado='borrador';
  it._ts=Date.now();
  if(S.cur&&String(S.cur.id)===id)S.cur.estado='borrador';
  if(typeof saveIntervsToStorage==='function')saveIntervsToStorage();
  if(typeof syncAutoPushDebounced==='function')syncAutoPushDebounced();
  if(typeof toast==='function')toast('Ya no está pendiente → Borrador');
  try{
    if(typeof renderHome==='function')renderHome();
    if(typeof afUpdateEstadoAccionesUI==='function')afUpdateEstadoAccionesUI(S.cur);
  }catch(e2){}
  return false;
}

/**
 * Confirma el diagnóstico del QR: diagnostico_sin_confirmar=false.
 * Explícito (no se limpia al editar el texto del diagnóstico).
 */
function afConfirmarDiagnostico(intervId, ev){
  if(ev){try{ev.stopPropagation();ev.preventDefault();}catch(e){}}
  var id=String(intervId||(S.cur&&S.cur.id)||'').trim();
  if(!id||!S.intervs){if(typeof toast==='function')toast('Sin foja');return false;}
  var idx=-1;
  for(var i=0;i<S.intervs.length;i++){
    if(String(S.intervs[i].id)===id){idx=i;break;}
  }
  if(idx<0){if(typeof toast==='function')toast('Foja no encontrada');return false;}
  var it=S.intervs[idx];
  if(!it.diagnostico_sin_confirmar){
    if(typeof toast==='function')toast('Diagnóstico ya confirmado');
    return false;
  }
  if(!confirm('¿Confirmar diagnóstico?\nQuitará el aviso “sin confirmar” (marca local; no cambia el texto del diagnóstico).'))return false;
  it.diagnostico_sin_confirmar=false;
  it._ts=Date.now();
  if(S.cur&&String(S.cur.id)===id)S.cur.diagnostico_sin_confirmar=false;
  if(typeof saveIntervsToStorage==='function')saveIntervsToStorage();
  if(typeof syncAutoPushDebounced==='function')syncAutoPushDebounced();
  if(typeof toast==='function')toast('Diagnóstico confirmado ✓');
  try{
    if(typeof renderHome==='function')renderHome();
    if(typeof afUpdateDiagConfirmUI==='function')afUpdateDiagConfirmUI(S.cur);
  }catch(e2){}
  return false;
}

/** Muestra/oculta fila “Confirmar diagnóstico” junto a f-diag. */
function afUpdateDiagConfirmUI(i){
  var row=document.getElementById('diag-sin-confirmar-row');
  if(!row)return;
  var show=!!(i&&i.diagnostico_sin_confirmar);
  row.style.display=show?'block':'none';
}

/**
 * Actualiza botones de estado en ficha (preop / labels Marcar GECLISA|evweb).
 */
function afUpdateEstadoAccionesUI(i){
  var preop=document.getElementById('preop-estado-row');
  if(preop)preop.style.display=(i&&i.estado==='preoperatorio')?'block':'none';
  var btnG=document.getElementById('btn-mark-enviado-geclisa');
  if(btnG){
    btnG.textContent=i&&i.estado==='enviado_geclisa'
      ?'✕ Quitar marca GECLISA'
      :'✓ Marcar enviado GECLISA';
  }
  var btnE=document.getElementById('btn-mark-enviado-evweb');
  if(btnE){
    btnE.textContent=i&&i.estado==='enviado_evweb'
      ?'✕ Quitar marca evweb'
      :'✓ Marcar enviado evweb';
  }
}

/**
 * Migra estado legado "enviado" → enviado_geclisa / enviado_evweb.
 * No migra DNI inválidos (prueba) ni ids en la lista de skip.
 */
function afMigrateEnviadoLegado(){
  var SKIP_IDS={'1782999661173':true}; // Gracias Juan — no migrar
  var changed=0;
  var list=S.intervs||[];
  for(var i=0;i<list.length;i++){
    var it=list[i];
    if(!it||it.estado!=='enviado')continue;
    if(SKIP_IDS[String(it.id)])continue;
    if(typeof afCheckDni==='function'){
      var chk=afCheckDni(it.dni);
      if(!chk.ok)continue; // DNI dudoso: no migrar
    }
    var dest=afDestinoEnviadoPorSan(it);
    if(!dest)continue;
    it.estado=dest;
    it.enviadoDestino=dest==='enviado_geclisa'?'geclisa':'evweb';
    it.enviadoVia=it.enviadoVia||'migration_estado_legado';
    if(!it.enviadoAt)it.enviadoAt=it._ts?new Date(it._ts).toISOString():new Date().toISOString();
    changed++;
  }
  if(changed){
    try{saveIntervsToStorage();}catch(e){}
    try{console.log('[AFG] migrados enviado→destino:',changed);}catch(e2){}
  }
  return changed;
}

function borrarIntervencion(intervId,ev){
  if(ev){try{ev.stopPropagation();ev.preventDefault();}catch(e){}}
  var id=String(intervId||'');
  if(!id)return false;
  var it=null;
  for(var i=0;i<(S.intervs||[]).length;i++){
    if(String(S.intervs[i].id)===id){it=S.intervs[i];break;}
  }
  if(!it){toast('No encontré esa foja');return false;}
  var label=(it.pac||'Sin nombre')+' · '+(typeof fmt==='function'?fmt(it.fecha):it.fecha||'—');
  if(!confirm('¿Borrar esta intervención?\n\n'+label+'\n\nNo se puede deshacer.'))return false;
  var wasCurrent=!!(S.cur&&String(S.cur.id)===id);
  S.intervs=S.intervs.filter(function(x){return String(x.id)!==id;});
  if(wasCurrent)S.cur=null;
  if(typeof afMarkIntervDeleted==='function')afMarkIntervDeleted(id);
  if(typeof afGeclisaQueueRemove==='function'){
    try{afGeclisaQueueRemove(id);}catch(eQ){}
  }
  saveIntervsToStorage();
  // Cancelar debounce: el merge viejo reintroducía la foja desde la nube
  if(typeof syncCancelPushDebounced==='function')syncCancelPushDebounced();
  toast('Borrando y sincronizando con la nube…');
  try{console.log('[AFG sync] delete local OK',id,'→ push inmediato');}catch(eL){}
  var afterUi=function(){
    if(wasCurrent&&typeof go==='function'){
      try{S.hist=['home'];go('home',false);}catch(eGo){}
    }else if(typeof renderHome==='function'){
      renderHome();
    }
    if(typeof renderGeclisaQueuePanel==='function')renderGeclisaQueuePanel();
  };
  if(typeof syncPushAfterDelete==='function'){
    syncPushAfterDelete(id).then(function(r){
      toast('Foja borrada · nube actualizada ('+(r&&r.total!=null?r.total:'?')+' fojas)');
      afterUi();
    }).catch(function(e){
      toast('Foja borrada en este equipo, pero falló el sync nube. No refresques hasta “Subir ahora”.');
      try{console.error('[AFG sync] delete: sync falló',e);}catch(e2){}
      afterUi();
    });
  }else{
    if(typeof syncAutoPushDebounced==='function')syncAutoPushDebounced();
    toast('Foja borrada (sync diferido)');
    afterUi();
  }
  return false;
}

function renderHome(){
  var mode=(S.listMode==='preop')?'preop':'fojas';
  if(mode==='fojas'&&typeof afMountHomeSearch==='function')afMountHomeSearch(false);
  if(mode==='fojas'&&typeof refreshAdminPlanAlerts==='function'&&typeof isAdmin==='function'&&isAdmin()){
    refreshAdminPlanAlerts();
  }
  if(typeof renderGeclisaQueuePanel==='function')renderGeclisaQueuePanel();
  if(typeof afSyncDockAlert==='function')afSyncDockAlert();
  var pool=(S.intervs||[]).filter(function(x){
    if(!x)return false;
    return mode==='preop'?(x.estado==='preoperatorio'):(x.estado!=='preoperatorio');
  });
  var total=pool.length;
  var filtradas=filterIntervs(S.intervs||[]);
  var n=filtradas.length;
  var countTxt=n+' de '+total+' intervención'+(total!==1?'es':'');
  if(n!==total)countTxt+=' (filtradas)';
  var hc=document.getElementById(mode==='preop'?'preop-count':'home-count');
  if(hc)hc.textContent=countTxt;
  var banner=document.getElementById('preop-alert-banner');
  if(banner){
    var anyAlert=false;
    for(var ai=0;ai<pool.length;ai++){
      if(pool[ai]&&pool[ai].alerta_seguridad){anyAlert=true;break;}
    }
    banner.style.display=(mode==='preop'&&anyAlert)?'block':'none';
  }
  var lst=document.getElementById(mode==='preop'?'preop-list':'inter-list');
  if(!lst)return;
  if(!total){
    lst.innerHTML=mode==='preop'
      ?'<div style="text-align:center;padding:48px 16px;color:var(--text3)"><div style="font-size:48px;margin-bottom:12px">🩺</div><div>Sin valoraciones preoperatorias</div><div style="font-size:12px;margin-top:6px">Generá un QR o esperá que el paciente complete el formulario</div></div>'
      :'<div style="text-align:center;padding:48px 16px;color:var(--text3)"><div style="font-size:48px;margin-bottom:12px">🏥</div><div>Sin intervenciones</div><div style="font-size:12px;margin-top:6px">Tocá + Nueva para empezar</div></div>';
    return;
  }
  if(!n){
    lst.innerHTML=mode==='preop'
      ?'<div style="text-align:center;padding:32px 16px;color:var(--text3)"><div style="font-size:14px">Ninguna foja preoperatoria coincide</div></div>'
      :'<div style="text-align:center;padding:32px 16px;color:var(--text3)"><div style="font-size:14px">Ninguna foja coincide con el filtro</div><button class="btn btn-s" style="width:auto;margin-top:12px;padding:8px 14px;font-size:12px" onclick="limpiarFiltrosHome()">Limpiar filtros</button></div>';
    return;
  }
  lst.innerHTML=afInterCardsHtml(filtradas);
}
function afInterCardsHtml(filtradas){
  // Estado GECLISA/evweb: marca LOCAL (auto o manual) — no verifica destino en vivo
  var EC={borrador:'#6b7280',listo:'#3b82f6',enviado:'#3b82f6',enviado_geclisa:'#22c55e',enviado_evweb:'#14b8a6',preoperatorio:'#6b7280'};
  var EL={borrador:'Borrador',listo:'Listo ✓',enviado:'Enviado ✓✓',enviado_geclisa:'GECLISA ✓✓',enviado_evweb:'evweb ✓✓',preoperatorio:'Preoperatorio pendiente'};
  var ET={
    enviado_geclisa:'Confirmado en AnesFact (automatización o marca manual). No consulta Geclisa en vivo. Clic para quitar marca.',
    enviado_evweb:'Confirmado en AnesFact (marca manual). No consulta evweb/ADAARC en vivo. Clic para quitar marca.',
    enviado:'Marca local de enviado.',
    preoperatorio:'Vino del QR y sigue marcada pendiente. Clic para pasar a Borrador.'
  };
  var html='';
  (filtradas||[]).slice().reverse().forEach(function(x){
    var c=EC[x.estado]||'#8B949E';var icon=x.san&&x.san.includes('Mayo')?'🏥':x.san&&x.san.includes('Aero')?'✈️':'🏨';
    var esMayo=typeof afIsMayoInterv==='function'?afIsMayoInterv(x):(x.san&&x.san.indexOf('Mayo')>=0);
    var esAero=typeof afIsAeroInterv==='function'?afIsAeroInterv(x):(String(x.san||'').toLowerCase().indexOf('aero')>=0);
    var inCola=typeof afGeclisaQueueIsQueued==='function'&&afGeclisaQueueIsQueued(x.id);
    var sanCls=afSanatorioCssClass(x.san);
    var safeId=String(x.id||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    var viaHint=x.enviadoVia?(' · vía '+x.enviadoVia):'';
    var estadoTitle=ET[x.estado]||'';
    if((x.estado==='enviado_geclisa'||x.estado==='enviado_evweb')&&estadoTitle)estadoTitle+=viaHint;
    var estadoBadgeHtml='';
    if(x.estado==='preoperatorio'){
      estadoBadgeHtml='<button type="button" class="badge" title="'+estadoTitle+'" '
        +'onclick="afSalirPreoperatorio(\''+safeId+'\',event)" '
        +'style="background:'+c+'22;color:'+c+';border:1px solid rgba(107,114,128,.55);cursor:pointer;font-size:10px;flex-shrink:0">'
        +'Preop. · Ya no pendiente</button>';
    }else if(esMayo&&x.estado==='enviado_geclisa'){
      estadoBadgeHtml='<button type="button" class="badge" title="'+estadoTitle+'" '
        +'onclick="afToggleEnviadoGeclisaManual(\''+safeId+'\',event,\'manual_lista\')" '
        +'style="background:'+c+'22;color:'+c+';border:1px solid rgba(34,197,94,.45);cursor:pointer;font-size:10px">'
        +(EL[x.estado]||'GECLISA ✓✓')+'</button>';
    }else if(esAero&&x.estado==='enviado_evweb'){
      estadoBadgeHtml='<button type="button" class="badge" title="'+estadoTitle+'" '
        +'onclick="afToggleEnviadoEvwebManual(\''+safeId+'\',event,\'manual_lista\')" '
        +'style="background:'+c+'22;color:'+c+';border:1px solid rgba(20,184,166,.5);cursor:pointer;font-size:10px">'
        +(EL[x.estado]||'evweb ✓✓')+'</button>';
    }else{
      estadoBadgeHtml='<span class="badge" style="background:'+c+'22;color:'+c+'"'+(estadoTitle?' title="'+estadoTitle+'"':'')+'>'+(EL[x.estado]||'Borrador')+'</span>';
    }
    var markExtraHtml='';
    if(esMayo&&x.estado!=='enviado_geclisa'){
      markExtraHtml+='<button type="button" class="badge" title="Marcar a mano como enviada a GECLISA (no verifica Geclisa en vivo)" '
        +'onclick="afToggleEnviadoGeclisaManual(\''+safeId+'\',event,\'manual_lista\')" '
        +'style="border:1px dashed rgba(34,197,94,.5);background:transparent;color:var(--green);cursor:pointer;font-size:10px;flex-shrink:0">'
        +'Marcar GECLISA</button>';
    }
    if(esAero&&x.estado!=='enviado_evweb'){
      markExtraHtml+='<button type="button" class="badge" title="Marcar a mano como enviada a evweb (no verifica ADAARC/evweb en vivo)" '
        +'onclick="afToggleEnviadoEvwebManual(\''+safeId+'\',event,\'manual_lista\')" '
        +'style="border:1px dashed rgba(20,184,166,.55);background:transparent;color:#14B8A6;cursor:pointer;font-size:10px;flex-shrink:0">'
        +'Marcar evweb</button>';
    }
    var diagSinHtml='';
    if(x.diagnostico_sin_confirmar){
      diagSinHtml=' · <button type="button" title="Confirmar diagnóstico (quita el aviso; no cambia el texto)" '
        +'onclick="afConfirmarDiagnostico(\''+safeId+'\',event)" '
        +'style="border:none;background:transparent;color:var(--warn);cursor:pointer;font-size:11px;padding:0;text-decoration:underline">'
        +'sin confirmar · confirmar</button>';
    }
    html+='<div class="inter '+(sanCls||'')+'" onclick="abrirInter(\''+safeId+'\')">'
      +'<div class="inter-main">'
      +'<div class="inter-dot" style="background:'+c+'"></div>'
      +'<div class="inter-body">'
      +'<div class="inter-name">'+(x.pac||'Sin nombre')+'</div>'
      +'<div class="inter-meta">'+fmt(x.fecha)+' · '+icon+' '+(x.san||'—')+(x.dni?' · DNI '+x.dni:'')+'</div>'
      +(x.diag?'<div class="inter-diag">'+x.diag+diagSinHtml+(x.diagnostico_paciente&&x.diagnostico_paciente!==x.diag?' · “'+x.diagnostico_paciente+'”':'')+'</div>':'')
      +(x.origen==='qr_valoracion'&&x.foja&&x.foja.antecedentes&&x.foja.antecedentes.length?'<div class="inter-antec">Antecedentes: '+x.foja.antecedentes.join(', ')+'</div>':'')
      +'</div></div>'
      +'<div class="inter-actions">'
      +(esMayo
        ?('<button type="button" class="badge" title="'+(inCola?'Sacar de cola GECLISA':'Agregar a cola GECLISA')+'" '
          +'onclick="afToggleColaGeclisa(\''+safeId+'\',event)" '
          +'style="border:1px solid '+(inCola?'rgba(234,179,8,.65)':'rgba(139,148,158,.4)')+';'
          +'background:'+(inCola?'rgba(234,179,8,.18)':'transparent')+';'
          +'color:'+(inCola?'var(--estado-cola)':'var(--text3)')+';cursor:pointer;font-size:10px">'
          +(inCola?'⏱ En cola':'Cola')+'</button>')
        :'')
      +(x.alerta_seguridad
        ?('<span class="badge" style="background:rgba(239,68,68,.22);color:var(--red);border:1px solid rgba(239,68,68,.55);font-size:10px;max-width:140px;text-align:center;line-height:1.25">⚠ Revisar medicación/alergias</span>')
        :'')
      +estadoBadgeHtml
      +markExtraHtml
      +'<button type="button" class="badge" title="Borrar foja" onclick="borrarIntervencion(\''+safeId+'\',event)" '
      +'style="border:1px solid rgba(239,68,68,.45);background:transparent;color:var(--red);cursor:pointer;font-size:10px">Borrar</button>'
      +'</div></div>';
  });
  return html;
}
function afSanFilterKey(san){
  var s=String(san||'').toLowerCase();
  if(s.indexOf('mayo')>=0)return 'mayo';
  if(s.indexOf('aero')>=0||s.indexOf('aeron')>=0)return 'aero';
  return 'otro';
}
function afGoFojasFiltrado(sanKey){
  var sel=document.getElementById('home-san');
  if(sel)sel.value=sanKey||'';
  goDock('home');
}
function renderSanatoriosHub(){
  var host=document.getElementById('sanatorios-hub');
  if(!host)return;
  var counts={mayo:0,aero:0,otro:0};
  (S.intervs||[]).forEach(function(x){
    if(!x||x.estado==='preoperatorio')return;
    counts[afSanFilterKey(x.san)]++;
  });
  var cards=[
    {k:'mayo',l:'Sanatorio Mayo',hint:'Cola GECLISA y fojas Mayo',c:'var(--san-mayo)'},
    {k:'aero',l:'Hospital Aeronáutico',hint:'Facturación evweb / ADAARC',c:'var(--san-aero)'},
    {k:'otro',l:'Otros',hint:'Resto de instituciones',c:'var(--san-otro)'}
  ];
  var html='';
  for(var i=0;i<cards.length;i++){
    var t=cards[i];
    var n=counts[t.k]||0;
    html+='<div class="card hub-card" style="border-left-color:'+t.c+'" onclick="afGoFojasFiltrado(\''+t.k+'\')">'
      +'<div class="hub-n">'+n+'</div>'
      +'<div class="hub-l" style="color:'+t.c+'">'+t.l+'</div>'
      +'<div class="hub-c">'+t.hint+' · tocá para ver fojas</div>'
      +'</div>';
  }
  host.innerHTML=html;
}
function renderEvwebHub(){
  var abierta=document.getElementById('evweb-abierta');
  var nom=document.getElementById('evweb-abierta-nom');
  if(abierta){
    if(S.cur){
      abierta.style.display='block';
      if(nom)nom.textContent=(S.cur.pac||'Sin nombre')+(S.cur.san?(' · '+S.cur.san):'');
    }else{
      abierta.style.display='none';
    }
  }
  var list=document.getElementById('evweb-list');
  if(!list)return;
  var pending=(S.intervs||[]).filter(function(x){
    return x&&typeof afIsAeroInterv==='function'&&afIsAeroInterv(x)&&x.estado!=='enviado_evweb'&&x.estado!=='preoperatorio';
  });
  if(!pending.length){
    list.innerHTML='<div class="card" style="color:var(--text3);font-size:13px">No hay fojas Aeronáutico pendientes de marca evweb.</div>';
    return;
  }
  list.innerHTML=afInterCardsHtml(pending);
}
function abrirInter(id){
  if(S.cur&&S.cur.id!==id){
    try{
      var view=S.hist[S.hist.length-1];
      if(view==='foja')guardarFoja();
      else if(view==='nueva'||view==='facturacion'||view==='resumen'||view==='geclisa'||view==='foja')guardar();
    }catch(e){}
  }
  S.cur=S.intervs.find(function(i){return i.id===id;})||null;
  if(S.cur){
    S.vitals=S.cur.foja&&S.cur.foja.vitals||[];
    cargarForm(S.cur);
    if(typeof cargarFojaUI==='function')cargarFojaUI();
    var badge=document.getElementById('ia-badge');if(badge)badge.style.display='none';
    if(S.cur.origen==='qr_valoracion'&&S.cur.foja&&S.cur.foja.antecedentes&&S.cur.foja.antecedentes.length&&typeof toast==='function'){
      toast('Antecedentes QR: '+S.cur.foja.antecedentes.join(', ')+' (ver Foja)');
    }
    if(typeof afUpdateAlertaSeguridadFicha==='function')afUpdateAlertaSeguridadFicha(S.cur);
    if(typeof afUpdateDiagConfirmUI==='function')afUpdateDiagConfirmUI(S.cur);
    if(typeof afUpdateEstadoAccionesUI==='function')afUpdateEstadoAccionesUI(S.cur);
    go('nueva');
  }
}
function nuevaInter(){
  S.cur={id:Date.now()+'',estado:'borrador',fecha:new Date().toISOString().slice(0,10),hora:'',pac:'',edad:'',sexo:'',dni:'',peso:'',ciru:'',serv:'',diag:'',san:'Hospital Aeronáutico',sala:'',cama:'',mayo_sector:'',mayo_cama:'',mayo_quir:'',mayo_tipociru:'',mayo_posicion:'',obra:'',afil:'',docs:{},ob:false,env:true,pracs:[],foja:{drogas:[],vitals:[]}};
  S.vitals=[];
  var badge=document.getElementById('ia-badge');if(badge)badge.style.display='none';
  cargarForm(S.cur);
  if(typeof cargarFojaUI==='function')cargarFojaUI();
  if(typeof afUpdateAlertaSeguridadFicha==='function')afUpdateAlertaSeguridadFicha(null);
  if(typeof afUpdateDiagConfirmUI==='function')afUpdateDiagConfirmUI(S.cur);
  if(typeof afUpdateEstadoAccionesUI==='function')afUpdateEstadoAccionesUI(S.cur);
  go('nueva');
}
function sv(id,v){var e=document.getElementById(id);if(e)e.value=v||'';}
function gv(id){var e=document.getElementById(id);return e?e.value:'';}
function sanitizeAfil(v){
  if(!v) return '';
  var s=String(v).trim();
  if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return '';
  return s;
}
/** Solo dígitos del DNI (puede incluir ceros de padding GECLISA). */
function afDniDigits(d){
  return String(d==null?'':d).replace(/\D/g,'');
}
/** DNI de documento: sin ceros a la izquierda. */
function afDniCanonical(d){
  return afDniDigits(d).replace(/^0+/,'');
}
/**
 * Valida 7–8 dígitos sobre el canónico (ignora 0 de padding).
 * Vacío = ok. No bloquea guardado.
 */
function afCheckDni(d){
  var raw=String(d==null?'':d).trim();
  var dig=afDniDigits(raw);
  if(!raw)return{ok:true,empty:true};
  if(!dig){
    return{ok:false,empty:false,message:'DNI: usá solo números (7 u 8 dígitos).'};
  }
  var canon=afDniCanonical(dig);
  if(!canon){
    return{ok:false,empty:false,message:'DNI inválido.'};
  }
  var n=canon.length;
  if(n>=7&&n<=8){
    return{ok:true,empty:false,canonical:canon,digits:dig,padded:dig.length>canon.length};
  }
  return{
    ok:false,
    empty:false,
    canonical:canon,
    digits:dig,
    message:'DNI con '+n+' dígitos — un DNI argentino tiene 7 u 8. Revisá el número (no se bloqueó el guardado).'
  };
}
function afWarnDniIfInvalid(d){
  var r=afCheckDni(d);
  if(r.ok)return r;
  if(typeof toast==='function')toast(r.message||'DNI con formato dudoso');
  try{console.warn('[AFG DNI]',r.message,d);}catch(e){}
  return r;
}
function cargarForm(i){
  sv('f-fecha',i.fecha);sv('f-pac',i.pac);
  sv('f-edad',i.edad);sv('f-sexo',i.sexo||'');sv('f-dni',i.dni);
  sv('f-peso',i.peso||'');sv('f-ciru',i.ciru);sv('f-serv',i.serv||'');sv('f-diag',i.diag||'');
  sv('f-san',i.san);onSanChange();sv('f-mayo-sector',i.mayo_sector||'');sv('f-mayo-quir',i.mayo_quir||'');sv('f-mayo-tipociru',i.mayo_tipociru||'');sv('f-mayo-posicion',i.mayo_posicion||'');if(i.mayo_sector)setTimeout(function(){updateMayoCamas();sv('f-mayo-cama',i.mayo_cama||'');},50);sv('f-sala',i.sala||'');sv('f-cama',i.cama||'');
  sv('f-obra',i.obra);sv('f-afil',sanitizeAfil(i.afil));
  var ob=document.getElementById('f-ob');if(ob)ob.checked=!!i.ob;
  var en=document.getElementById('f-env');if(en)en.checked=i.env!==false;
  onSanChange();renderPracs();
  if(typeof afUpdateDiagConfirmUI==='function')afUpdateDiagConfirmUI(i);
  if(typeof afUpdateEstadoAccionesUI==='function')afUpdateEstadoAccionesUI(i);
}
function refreshFacturacionHeader(){
  var el=document.getElementById('fact-pac-badge');
  if(!el||!S.cur) return;
  var t=S.cur.pac||'Sin nombre';
  if(S.cur.fecha) t+=' · '+fmt(S.cur.fecha);
  if(S.cur.san) t+=' · '+S.cur.san;
  el.textContent=t;
}
function guardar(extra){
  if(!S.cur)return;
  if(document.getElementById('f-san')&&typeof AfSanatoriosPlan!=='undefined'&&!AfSanatoriosPlan.assertCurrent())return;
  if(document.getElementById('f-fecha')){
    S.cur.fecha=gv('f-fecha');S.cur.pac=gv('f-pac');
    S.cur.edad=gv('f-edad');S.cur.sexo=gv('f-sexo');S.cur.dni=gv('f-dni');
    S.cur.peso=gv('f-peso');S.cur.ciru=gv('f-ciru');S.cur.serv=gv('f-serv');S.cur.diag=gv('f-diag');
    S.cur.san=gv('f-san');S.cur.mayo_sector=gv('f-mayo-sector')||'';S.cur.mayo_cama=gv('f-mayo-cama')||'';S.cur.mayo_quir=gv('f-mayo-quir')||'';S.cur.mayo_tipociru=gv('f-mayo-tipociru')||'';S.cur.mayo_posicion=gv('f-mayo-posicion')||'';S.cur.sala=gv('f-sala');S.cur.cama=gv('f-cama');
    if(typeof afWarnDniIfInvalid==='function')afWarnDniIfInvalid(S.cur.dni);
  }
  if(document.getElementById('f-obra')){
    S.cur.obra=gv('f-obra');S.cur.afil=sanitizeAfil(gv('f-afil'));
    var ob=document.getElementById('f-ob');S.cur.ob=ob?ob.checked:false;
    var en=document.getElementById('f-env');S.cur.env=en?en.checked:true;
  }
  if(extra)Object.assign(S.cur,extra);
  if(typeof AF_AUTH!=='undefined'&&AF_AUTH.getUserId)S.cur.owner_id=AF_AUTH.getUserId();
  var idx=S.intervs.findIndex(function(i){return i.id===S.cur.id;});
  if(idx>=0)S.intervs[idx]=S.cur;else S.intervs.push(S.cur);
  S.cur._ts=Date.now();
  saveIntervsToStorage();
  if(typeof maybeBumpDemoFojaOnSave==='function')maybeBumpDemoFojaOnSave();
  // Learn cirujano (ignorar placeholders de prueba)
  if(S.cur.ciru&&S.cur.ciru.trim()){
    var c=S.cur.ciru.trim();
    if(!(typeof afIsCirujanoBasura==='function'&&afIsCirujanoBasura(c))){
      if(cirujanos.indexOf(c)<0){cirujanos.push(c);localStorage.setItem('af_ciru',JSON.stringify(cirujanos));}
    }
  }
  if(typeof syncAutoPushDebounced==='function')syncAutoPushDebounced();
  toast('Guardado ✓');
}
function marcarListo(){
  guardar({estado:'listo'});
  if(S.cur&&document.getElementById('fj-tec')){
    if(!S.cur.foja)S.cur.foja={drogas:[],vitals:[]};
    var f2=S.cur.foja;
    function gfv2(id){var e=document.getElementById(id);return(e&&e.value)?e.value:'';}
    ['tec','asa','via','ind','hint','hext','fin','premed','metodos','recup','obs','suero','sangre','plasma','outro'].forEach(function(k){
      var id='fj-'+(k==='outro'?'otro':k);if(!f2[k]&&gfv2(id))f2[k]=gfv2(id);
    });
    guardarFojaVG();
    var idx2=S.intervs.findIndex(function(i){return i.id===S.cur.id;});
    if(idx2>=0)S.intervs[idx2]=S.cur;
    saveIntervsToStorage();
  }
  go('resumen');
}
function renderPracs(){
  var c=document.getElementById('pracs-list');if(!c||!S.cur)return;
  var p=S.cur.pracs||[];
  if(!p.length){c.innerHTML='<p style="font-size:12px;color:var(--text3)">Sin prácticas</p>';return;}
  c.innerHTML=p.map(function(x,i){
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border)">'
      +'<div><span style="font-size:11px;font-family:monospace;color:var(--green)">'+x.cod+'</span> <span style="font-size:13px">'+x.desc+'</span> <span style="font-size:11px;color:var(--text3)">comp.'+(x.comp||0)+'</span></div>'
      +'<button onclick="quitarPrac('+i+')" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:20px">×</button></div>';
  }).join('');
}
function quitarPrac(i){S.cur.pracs.splice(i,1);renderPracs();}

