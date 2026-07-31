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
function go(id,addH){
  if(addH===undefined)addH=true;
  if(id==='facturacion'&&!S.cur){toast('Abrí una intervención primero');return;}
  if(id==='geclisa'&&typeof checkPlan==='function'&&!checkPlan('geclisa'))return;
  if(id==='admin'&&(typeof isAdmin!=='function'||!isAdmin())){toast('Acceso denegado');return;}
  if(!afShowView(id))return;
  if(addH)S.hist.push(id);
  document.getElementById('back-btn').style.display=S.hist.length>1?'block':'none';
  document.getElementById('t-title').textContent=TITLES[id]||'AnesFact v5';
  if(id==='home'){
    if(S.cur){try{guardar();}catch(e){}}
    renderHome();if(S.hist.length===1)cargarAnestesista();
  if(id==='resumen')renderResumen();
  if(id==='foja'){
    cargarFojaUI();
    renderRecupSelects();
    setTimeout(function(){if(typeof initExamenAuscUI==='function')initExamenAuscUI();},120);
    setTimeout(initSign,80);
    renderPesoChips();
    renderFojaPorSanatorio();
  }
  if(id==='geclisa'){window._geclisaTexto='';renderGeclisa();}
  if(id==='admin'&&typeof renderAdmin==='function')renderAdmin();
  if(id==='nom'){document.getElementById('nom-q').value='';document.getElementById('nom-res').innerHTML='<p style="font-size:12px;color:var(--text3);text-align:center;padding:20px">Escribí para buscar</p>';}
  if(id==='config'){
    document.getElementById('cfg-key').value=S.key;actualizarKeyStatus();
    if(typeof refreshCfgUi==='function')refreshCfgUi();
  }
  if(id==='facturacion'){
    if(typeof refreshFacturacionHeader==='function')refreshFacturacionHeader();
    if(typeof renderPracs==='function')renderPracs();
    onSanChange();
  }
  if(id==='ayuda'&&typeof renderAyuda==='function')renderAyuda();
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
function guardarAnestesista(){
  var nombre=document.getElementById('cfg-anest-nombre').value.trim().toUpperCase();
  var mp=document.getElementById('cfg-anest-mp').value.trim();
  var me=document.getElementById('cfg-anest-me').value.trim();
  if(!nombre){alert('Ingresá el nombre del anestesista');return;}
  localStorage.setItem('af_anest_nombre',nombre);
  localStorage.setItem('af_anest_mp',mp);
  localStorage.setItem('af_anest_me',me);
  document.getElementById('anest-status').textContent='✓ Guardado: '+nombre+' M.P.'+mp;
  // Actualizar header
  var h=document.getElementById('header-anest-info');
  if(h)h.textContent=nombre+' · M.P.'+mp+' · ADAARC';
  toast('Datos del anestesista guardados ✓');
  if(typeof syncAutoPull==='function'){
    syncAutoPull(true).then(function(){
      if(typeof syncAutoPush==='function')return syncAutoPush(true);
    });
  }
}

function cargarAnestesista(){
  var nombre=localStorage.getItem('af_anest_nombre')||'';
  var mp=localStorage.getItem('af_anest_mp')||'';
  var me=localStorage.getItem('af_anest_me')||'';
  var el=document.getElementById('cfg-anest-nombre');if(el)el.value=nombre;
  var el2=document.getElementById('cfg-anest-mp');if(el2)el2.value=mp;
  var el3=document.getElementById('cfg-anest-me');if(el3)el3.value=me;
  var h=document.getElementById('header-anest-info');
  if(h&&nombre)h.textContent=nombre+' · M.P.'+mp+' · ADAARC';
  // Primera vez: redirigir a config
  if(!nombre&&!localStorage.getItem('af_anest_visto')){
    localStorage.setItem('af_anest_visto','1');
    setTimeout(function(){go('config');toast('Configurá tus datos de anestesista → Ajustes');},800);
  }
}

function irConfig(){go('config');}
function irScan(){go('escanear');}
var _tt;
function toast(msg){var t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(_tt);_tt=setTimeout(function(){t.classList.remove('show');},2600);}
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
  var s=document.getElementById('f-san').value;
  // Also update foja view if visible
  setTimeout(renderFojaPorSanatorio,50);
  document.getElementById('f-aero-wrap').style.display=s==='Hospital Aeronáutico'?'block':'none';
  var mw=document.getElementById('f-mayo-wrap');if(mw)mw.style.display=s==='Sanatorio Mayo'?'block':'none';
  var mb=document.getElementById('btn-mayo-wrap');if(mb)mb.style.display=s==='Sanatorio Mayo'?'block':'none';
  if(s==='Sanatorio Mayo')updateMayoCamas();
}
function updateMayoCamas(){
  var sec=document.getElementById('f-mayo-sector');var cam=document.getElementById('f-mayo-cama');
  if(!sec||!cam)return;var sector=sec.value;
  var opts=['<option value="">—</option>'];
  if(sector==='PISO'){for(var hab=1;hab<=15;hab++){var c1=200+hab*2-1;var c2=200+hab*2;opts.push('<option>Hab.'+hab+' — Cama '+c1+'</option><option>Hab.'+hab+' — Cama '+c2+'</option>');}}
  else if(sector==='VIP'){opts.push('<option>VIP 1</option><option>VIP 2</option>');}
  else if(sector==='UCI'){for(var j=1;j<=16;j++)opts.push('<option>UCI '+j+'</option>');}
  else if(sector==='UTI'){for(var j=1;j<=16;j++)opts.push('<option>UTI1-'+j+'</option>');for(var j=1;j<=16;j++)opts.push('<option>UTI2-'+j+'</option>');}
  else if(sector==='HOSPITAL DE DIA'){for(var j=1;j<=10;j++)opts.push('<option>HD '+j+'</option>');}
  else if(sector==='GUARDIA'){for(var j=1;j<=8;j++)opts.push('<option>G '+j+'</option>');}
  cam.innerHTML=opts.join('');
}
