// AnesFact — Cola evweb (independiente de la cola GECLISA, misma idea)
var AFE_QUEUE_KEY = 'afg_evweb_queue';
// Mapeo texto de foja -> value del <select> de evweb. Solo PAMI/Mayo por ahora.
var AFE_OBRA_MAP = { 'PAMI': '382' };
var AFE_SAN_MAP = { 'MAYO': '208', 'SANATORIO MAYO': '208' };
function afeNorm(s){ return (s||'').toString().trim().toUpperCase(); }
function afeMapObra(t){
  var k = afeNorm(t);
  if (AFE_OBRA_MAP[k]) return AFE_OBRA_MAP[k];
  for (var key in AFE_OBRA_MAP) {
    if (k.indexOf(key) !== -1) return AFE_OBRA_MAP[key];
  }
  return '';
}
function afeMapSan(t){
  var k = afeNorm(t);
  for (var key in AFE_SAN_MAP) { if (k.indexOf(key) !== -1) return AFE_SAN_MAP[key]; }
  return '';
}
function afEvwebQueueLoad(){
  try {
    var raw = localStorage.getItem(AFE_QUEUE_KEY);
    var p = raw ? JSON.parse(raw) : null;
    return (p && p.items) ? p : { version:1, updatedAt:Date.now(), items:[] };
  } catch(e){ return { version:1, updatedAt:Date.now(), items:[] }; }
}
function afEvwebQueuePublish(q){
  try {
    window.postMessage({
      source: 'AFG_ANESFACT',
      type: 'EVWEB_QUEUE',
      queue: q
    }, '*');
  } catch(e){}
  try {
    document.dispatchEvent(new CustomEvent('afg-evweb-queue', { detail: q }));
  } catch(e2){}
}
function afEvwebQueueSave(q){
  q.updatedAt = Date.now();
  try { localStorage.setItem(AFE_QUEUE_KEY, JSON.stringify(q)); } catch(e){}
  afEvwebQueuePublish(q);
}
function afEvwebQueueSnapshotFromInterv(i){
  return {
    id: String(i.id),
    pac:(i.pac||'').trim(), dni:(i.dni||'').trim(), fecha:(i.fecha||'').trim(),
    hora:(i.hora||'').trim(), ciru:(i.ciru||'').trim(), edad:(i.edad||'').trim(),
    obra:(i.obra||'').trim(), afil:(i.afil||'').trim(), san:(i.san||'').trim(),
    obraValue: afeMapObra(i.obra), sanValue: afeMapSan(i.san),
    status:'queued', message:'', addedAt:Date.now(), updatedAt:Date.now()
  };
}
function afEvwebQueueValidate(i){
  var e=[];
  if(!(i.pac||'').trim()) e.push('Falta paciente');
  if(!(i.fecha||'').trim()) e.push('Falta fecha');
  if(!(i.hora||'').trim()) e.push('Falta hora');
  if(!(i.dni||'').trim()) e.push('Falta DNI');
  if(!(i.edad||'').trim()) e.push('Falta edad');
  if(!(i.afil||'').trim()) e.push('Falta N° afiliado');
  if(!afeMapObra(i.obra)) e.push('Obra social "'+(i.obra||'')+'" sin mapear (AFE_OBRA_MAP)');
  if(!afeMapSan(i.san)) e.push('Sanatorio "'+(i.san||'')+'" sin mapear (AFE_SAN_MAP)');
  return e;
}
function afEvwebQueueHydrateCurFromDom(interv){
  try {
    var g=function(id){var e=document.getElementById(id); return e?e.value:'';};
    interv.pac = g('f-pac')||interv.pac;
    interv.dni = g('f-dni')||interv.dni;
    interv.fecha = g('f-fecha')||interv.fecha;
    interv.hora = g('foja-hora-inicio')||g('f-hora')||interv.hora;
    interv.ciru = g('f-ciru')||interv.ciru;
    interv.edad = g('f-edad')||interv.edad;
    interv.obra = g('f-obra')||interv.obra;
    interv.afil = g('f-afil')||interv.afil;
    interv.san = g('f-san')||interv.san;
  } catch(e){}
  return interv;
}
function afEvwebQueueAdd(interv){
  afEvwebQueueHydrateCurFromDom(interv);
  var errs = afEvwebQueueValidate(interv);
  if (errs.length) { toast('No se agregó a cola evweb: '+errs.join('; ')); return {ok:false, errors:errs}; }
  var snap = afEvwebQueueSnapshotFromInterv(interv);
  var q = afEvwebQueueLoad();
  var idx = q.items.findIndex(function(it){ return it.id===snap.id; });
  if (idx>=0) q.items[idx]=snap; else q.items.push(snap);
  afEvwebQueueSave(q);
  toast('Agregado a cola evweb: '+snap.pac);
  return {ok:true, item:snap};
}
function afAgregarAColaEvweb(){
  if (typeof guardarFoja==='function') { try{ guardarFoja(); }catch(e){} }
  return afEvwebQueueAdd(S.cur);
}
