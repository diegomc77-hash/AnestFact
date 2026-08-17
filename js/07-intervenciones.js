function limpiarFiltrosHome(){
  ['home-q','home-desde','home-hasta'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});
  ['home-san','home-estado'].forEach(function(id){var e=document.getElementById(id);if(e)e.selectedIndex=0;});
  renderHome();
}
function filterIntervs(list){
  var qEl=document.getElementById('home-q');
  var q=(qEl&&qEl.value?qEl.value:'').trim().toLowerCase();
  var san=(document.getElementById('home-san')||{value:''}).value;
  var est=(document.getElementById('home-estado')||{value:''}).value;
  var desde=(document.getElementById('home-desde')||{value:''}).value;
  var hasta=(document.getElementById('home-hasta')||{value:''}).value;
  return(list||[]).filter(function(x){
    if(san){
      var s=(x.san||'').toLowerCase();
      if(san==='mayo'&&s.indexOf('mayo')<0)return false;
      if(san==='aero'&&(s.indexOf('aero')<0&&s.indexOf('aeron')<0))return false;
      if(san==='otro'&&(s.indexOf('mayo')>=0||s.indexOf('aero')>=0||s.indexOf('aeron')>=0))return false;
    }
    if(est&&x.estado!==est)return false;
    if(desde&&x.fecha&&x.fecha<desde)return false;
    if(hasta&&x.fecha&&x.fecha>hasta)return false;
    if(!q)return true;
    var blob=((x.pac||'')+' '+(x.dni||'')+' '+(x.san||'')+' '+(x.diag||'')+' '+(x.ciru||'')+' '+(x.serv||'')).toLowerCase();
    return blob.indexOf(q)>=0;
  });
}
function renderHome(){
  if(typeof refreshAdminPlanAlerts==='function'&&typeof isAdmin==='function'&&isAdmin()){
    refreshAdminPlanAlerts();
  }
  if(typeof renderGeclisaQueuePanel==='function')renderGeclisaQueuePanel();
  var total=(S.intervs||[]).length;
  var filtradas=filterIntervs(S.intervs||[]);
  var n=filtradas.length;
  var countTxt=n+' de '+total+' intervención'+(total!==1?'es':'');
  if(n!==total)countTxt+=' (filtradas)';
  var hc=document.getElementById('home-count');
  if(hc)hc.textContent=countTxt;
  var lst=document.getElementById('inter-list');
  if(!total){lst.innerHTML='<div style="text-align:center;padding:48px 16px;color:var(--text3)"><div style="font-size:48px;margin-bottom:12px">🏥</div><div>Sin intervenciones</div><div style="font-size:12px;margin-top:6px">Tocá + Nueva para empezar</div></div>';return;}
  if(!n){lst.innerHTML='<div style="text-align:center;padding:32px 16px;color:var(--text3)"><div style="font-size:14px">Ninguna foja coincide con el filtro</div><button class="btn btn-s" style="width:auto;margin-top:12px;padding:8px 14px;font-size:12px" onclick="limpiarFiltrosHome()">Limpiar filtros</button></div>';return;}
  var EC={borrador:'#E3B341',listo:'#1DB954',enviado:'#388BFD',enviado_geclisa:'#388BFD',enviado_evweb:'#388BFD'};
  var EL={borrador:'Borrador',listo:'Listo ✓',enviado:'Enviado ✓✓',enviado_geclisa:'Enviado a GECLISA ✓✓',enviado_evweb:'Enviado a evweb ✓✓'};
  var html='';
  filtradas.slice().reverse().forEach(function(x){
    var c=EC[x.estado]||'#8B949E';var icon=x.san&&x.san.includes('Mayo')?'🏥':x.san&&x.san.includes('Aero')?'✈️':'🏨';
    var esMayo=typeof afIsMayoInterv==='function'?afIsMayoInterv(x):(x.san&&x.san.indexOf('Mayo')>=0);
    var inCola=typeof afGeclisaQueueIsQueued==='function'&&afGeclisaQueueIsQueued(x.id);
    html+='<div class="inter" onclick="abrirInter(\''+x.id+'\')">'
      +'<div style="width:10px;height:10px;border-radius:50%;background:'+c+';flex-shrink:0"></div>'
      +'<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(x.pac||'Sin nombre')+'</div>'
      +'<div style="font-size:12px;color:var(--text2);margin-top:2px">'+fmt(x.fecha)+' · '+icon+' '+(x.san||'—')+(x.dni?' · DNI '+x.dni:'')+'</div>'
      +(x.diag?'<div style="font-size:11px;color:var(--text3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+x.diag+'</div>':'')
      +'</div>'
      +(esMayo
        ?('<button type="button" class="badge" title="'+(inCola?'Sacar de cola GECLISA':'Agregar a cola GECLISA')+'" '
          +'onclick="afToggleColaGeclisa(\''+x.id+'\',event)" '
          +'style="border:1px solid '+(inCola?'rgba(56,139,253,.6)':'rgba(139,148,158,.4)')+';'
          +'background:'+(inCola?'rgba(56,139,253,.22)':'transparent')+';'
          +'color:'+(inCola?'var(--blue)':'var(--text3)')+';cursor:pointer;font-size:10px;flex-shrink:0">'
          +(inCola?'Cola ✓':'Cola')+'</button>')
        :'')
      +'<span class="badge" style="background:'+c+'22;color:'+c+'">'+(EL[x.estado]||'Borrador')+'</span></div>';
  });
  lst.innerHTML=html;
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
    go('nueva');
  }
}
function nuevaInter(){
  S.cur={id:Date.now()+'',estado:'borrador',fecha:new Date().toISOString().slice(0,10),hora:'',pac:'',edad:'',sexo:'',dni:'',peso:'',ciru:'',serv:'',diag:'',san:'Hospital Aeronáutico',sala:'',cama:'',mayo_sector:'',mayo_cama:'',mayo_quir:'',mayo_tipociru:'',mayo_posicion:'',obra:'',afil:'',docs:{},ob:false,env:true,pracs:[],foja:{drogas:[],vitals:[]}};
  S.vitals=[];
  var badge=document.getElementById('ia-badge');if(badge)badge.style.display='none';
  cargarForm(S.cur);
  if(typeof cargarFojaUI==='function')cargarFojaUI();
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
  // Learn cirujano
  if(S.cur.ciru&&S.cur.ciru.trim()){var c=S.cur.ciru.trim();if(cirujanos.indexOf(c)<0){cirujanos.push(c);localStorage.setItem('af_ciru',JSON.stringify(cirujanos));}}
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

