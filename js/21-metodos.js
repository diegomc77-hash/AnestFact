// === MÉTODOS ANESTÉSICOS SMART ===
function clasificarGrupoDroga(grupo){
  var g=(grupo||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  if(/inotr|vasopres|emergencia/.test(g))return 'inot';
  if(/mantenimiento|gas mac|tiva total/.test(g))return 'mant';
  if(/inducc|inductor|relajante|analg|sedac/.test(g))return 'ind';
  if(/intratecal|peridural|anest|coadyuv|adyuv|local|perineural|plano/.test(g))return 'mant';
  return 'otro';
}
function formatDrogaLinea(dr){
  if(!dr||!dr.n)return '';
  return ((dr.n||'')+' '+(dr.d||'')+(dr.v?' '+dr.v:'')).replace(/\s+/g,' ').trim();
}
function formatDrogasMetodosAnexo(){
  var tipo=typeof getMetodoTipoDesdeTecnica==='function'?getMetodoTipoDesdeTecnica():'';
  var drogas=limpiarDrogasVacias(false);
  // Sedación / local: no usar "inducción/mantenimiento"
  if(tipo==='sedacion'||tipo==='localasistida'){
    var sed=[],inotS=[];
    drogas.forEach(function(dr){
      if(!dr.n||!String(dr.n).trim())return;
      var line=formatDrogaLinea(dr);
      if(!line)return;
      if(clasificarGrupoDroga(dr.grupo)==='inot')inotS.push(line+(dr.causa?' ('+dr.causa+')':''));
      else sed.push(line);
    });
    var partsS=[];
    if(sed.length){
      partsS.push((tipo==='sedacion'?'Sedación / medicación con ':'Anestesia local con ')
        +(sed.length===1?sed[0]:sed.slice(0,-1).join(', ')+' y '+sed[sed.length-1])+'.');
    }
    if(inotS.length)partsS.push('Inotrópicos / vasoactivos: '+inotS.join(', ')+'.');
    return partsS.join(' ');
  }
  var ind=[],mant=[],inot=[];
  drogas.forEach(function(dr){
    if(!dr.n||!String(dr.n).trim())return;
    var cat=clasificarGrupoDroga(dr.grupo);
    var line=formatDrogaLinea(dr);
    if(!line)return;
    if(cat==='inot'){
      inot.push(line+(dr.causa?' ('+dr.causa+')':''));
    } else if(cat==='mant')mant.push(line);
    else if(cat==='ind')ind.push(line);
  });
  var parts=[];
  if(ind.length)parts.push('Inducción con '+ind.join(', ')+'.');
  if(mant.length)parts.push('Mantenimiento con '+mant.join(', ')+'.');
  if(inot.length)parts.push('Inotrópicos / vasoactivos: '+inot.join(', ')+'.');
  return parts.join(' ');
}

function _subtipoSedacionNorm(){
  var sub=(document.getElementById('fj-tec-subtipo')?document.getElementById('fj-tec-subtipo').value:'')||'';
  return sub.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function _nivelSedacion(){
  var s=_subtipoSedacionNorm();
  if(/minima|ansiolisis/.test(s))return 'minima';
  if(/moderada|consciente/.test(s))return 'moderada';
  if(/profunda/.test(s))return 'profunda';
  if(/cam|monitorizado/.test(s))return 'cam';
  return '';
}

/** Lista limpia de drogas con nombre (opcionalmente escribe de vuelta en S.cur). */
function limpiarDrogasVacias(persistir){
  if(!S.cur||!S.cur.foja)return [];
  var limpios=(S.cur.foja.drogas||[]).filter(function(d){return d&&d.n&&String(d.n).trim();});
  if(persistir!==false)S.cur.foja.drogas=limpios;
  return limpios;
}

function _esViaDroga(dr,viaWanted){
  var g=(dr.grupo||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  var via=(dr.v||'').toLowerCase();
  if(viaWanted==='intratecal')return /intratecal/.test(g)||/intratecal/.test(via)||/\bit\b/.test(via);
  if(viaWanted==='peridural')return /peridural/.test(g)||/peridural/.test(via)||/epidural/.test(g);
  return false;
}

function _listarFarmacosVia(viaWanted){
  var drogas=limpiarDrogasVacias(false);
  var locals=[],adj=[];
  drogas.forEach(function(dr){
    if(!_esViaDroga(dr,viaWanted))return;
    var line=formatDrogaLinea(dr);
    if(!line)return;
    var g=(dr.grupo||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    var nom=(dr.n||'').toLowerCase();
    var esLocal=/anest[eé]sico|local/.test(g)||/bupivac|levobupiv|ropivac|lidocain|prilocain|mepivac/.test(nom);
    var esAdj=/opioide|alfa-2|alfa 2|coadyuv|agonista|componente/.test(g)
      ||/fentan|sufentan|morfina|clonidin|dexmedetom|adrenalina/.test(nom);
    if(esLocal&&!esAdj)locals.push(line);
    else adj.push(line);
  });
  var all=locals.concat(adj);
  if(!all.length)return '';
  if(all.length===1)return all[0];
  return all.slice(0,-1).join(', ')+' y '+all[all.length-1];
}

/** Texto de fármacos para el relato regional (raquídea / peridural / combinada / bloqueo). */
function formatFarmacosTecRegional(){
  var tipo=typeof getMetodoTipoDesdeTecnica==='function'?getMetodoTipoDesdeTecnica():'';
  if(tipo==='combinada'){
    var it=_listarFarmacosVia('intratecal');
    var peri=_listarFarmacosVia('peridural');
    var parts=[];
    if(it)parts.push(it);
    if(peri)parts.push(peri);
    return parts.join('; ');
  }
  if(tipo==='raquidea')return _listarFarmacosVia('intratecal');
  if(tipo==='peridural')return _listarFarmacosVia('peridural');
  // Bloqueo u otros: todo lo cargado no inotrópico
  var drogas=limpiarDrogasVacias(false);
  var lines=[];
  drogas.forEach(function(dr){
    if(clasificarGrupoDroga(dr.grupo)==='inot')return;
    var line=formatDrogaLinea(dr);
    if(line)lines.push(line);
  });
  if(!lines.length)return '';
  if(lines.length===1)return lines[0];
  return lines.slice(0,-1).join(', ')+' y '+lines[lines.length-1];
}

/** Relato CSE: separa claramente componente IT vs peridural. */
function formatFarmacosCSE(){
  var it=_listarFarmacosVia('intratecal');
  var peri=_listarFarmacosVia('peridural');
  var parts=[];
  if(it){
    parts.push('Tras aspiración negativa, se administra por vía intratecal '+it);
  } else {
    parts.push('Tras aspiración negativa, se administra el componente intratecal');
  }
  if(peri){
    parts.push('por el catéter peridural se administra '+peri);
  } else {
    parts.push('se deja catéter peridural para eventual refuerzo / mantenimiento');
  }
  return parts.join('; ');
}

/** Quita de Observaciones (Aero) notas "Inotrópico X: ..." que ya no están en medicación. */
function syncObsInotropicos(){
  var obs=document.getElementById('fj-obs');
  if(!obs)return;
  var cur=String(obs.value||'');
  if(!cur)return;
  var activos={};
  limpiarDrogasVacias(false).forEach(function(dr){
    if(clasificarGrupoDroga(dr.grupo)==='inot'&&dr.n)activos[String(dr.n).toLowerCase().trim()]=true;
  });
  // Quitar frases auto-generadas de inotrópicos (con o sin causa)
  var limpio=cur.replace(/Inotr[oó]pico\s+([^:]+):\s*[^.]*\./gi,function(m,nom){
    var key=String(nom||'').toLowerCase().trim();
    return activos[key]?m:'';
  });
  // Si no queda ningún inotrópico activo, limpiar también restos huérfanos
  if(!Object.keys(activos).length){
    limpio=limpio.replace(/Inotr[oó]pico\s+[^:]+:\s*[^.]*\./gi,'');
  }
  limpio=limpio.replace(/\s{2,}/g,' ').replace(/\s+\./g,'.').replace(/^\s*\.\s*/,'').trim();
  if(limpio!==cur.trim())obs.value=limpio;
}

var _tecRestaurando=false;
var _tecTipoPrev='';
var _tecSubPrev='';

/** Al cambiar tipo/subtipo: vaciar medicación previa para que no quede ni se transmita. */
function limpiarDrogasPorCambioTecnica(){
  if(_tecRestaurando)return;
  if(!S.cur||!S.cur.foja)return;
  var habia=(S.cur.foja.drogas||[]).some(function(d){return d&&d.n&&String(d.n).trim();});
  S.cur.foja.drogas=[];
  if(typeof renderDrogas==='function')renderDrogas();
  if(typeof syncObsInotropicos==='function')syncObsInotropicos();
  if(habia&&typeof toast==='function')toast('Medicación anterior borrada al cambiar técnica');
}

function onTecnicaCambioDetectar(){
  if(_tecRestaurando)return;
  var tipo=(document.getElementById('fj-tec-tipo')?document.getElementById('fj-tec-tipo').value:'')||'';
  var sub=(document.getElementById('fj-tec-subtipo')?document.getElementById('fj-tec-subtipo').value:'')||'';
  var cambioTipo=!!(_tecTipoPrev&&tipo&&tipo!==_tecTipoPrev);
  var cambioSub=!!(_tecSubPrev&&sub&&sub!==_tecSubPrev);
  if(cambioTipo||cambioSub)limpiarDrogasPorCambioTecnica();
  _tecTipoPrev=tipo;
  _tecSubPrev=sub;
}

/** Tras agregar/borrar drogas: regenerar métodos (relato regional o TIVA/balanceada). */
function refrescarMetodosDesdeDrogas(){
  limpiarDrogasVacias(true);
  if(typeof syncObsInotropicos==='function')syncObsInotropicos();
  var tipoTec=(document.getElementById('fj-tec-tipo')?document.getElementById('fj-tec-tipo').value:'')||'';
  if((tipoTec==='neuroaxial'||tipoTec==='bloqueo')&&typeof tecNivel4Check==='function'){
    tecNivel4Check();
    if(typeof actualizarMetodos==='function')actualizarMetodos(true); // solo materiales si relato ya listo
    return;
  }
  if(typeof actualizarMetodos==='function')actualizarMetodos();
}

var METODOS_TEXTOS={
  raquidea:function(){
    var ag=document.getElementById('fj-tec-aguja')?document.getElementById('fj-tec-aguja').value:'';
    var cal=document.getElementById('fj-tec-calibre')?document.getElementById('fj-tec-calibre').value:'';
    var agTxt='AR 25 PL';
    if(ag==='Punta de Lápiz'&&cal)agTxt='AR '+cal.replace(/G/i,'')+' PL';
    else if(ag==='Cortante (Quincke)'&&cal)agTxt='Quincke '+cal;
    else if(ag&&cal)agTxt=ag+' '+cal;
    return 'Raqu\u00eddea. T\u00e9cnica as\u00e9ptica estricta con materiales provistos por la instituci\u00f3n. Punci\u00f3n \u00fanica atraumatica con aguja '+agTxt+' (aguja raqu\u00eddea punta l\u00e1piz).';
  },
  general:function(){
    var t=document.getElementById('metodos-tubo');
    var via=document.getElementById('fj-via')?document.getElementById('fj-via').value:'';
    var dispTxt='';
    if(via==='TRAQUEO'||via==='Traqueostomía'){
      dispTxt='manejo de la vía aérea mediante Traqueostomía con Traqueoflex Nº '+(t?t.value:'8')+' con manguito de baja presión';
    } else if(via==='INT_NASO'){
      dispTxt='manejo de la vía aérea mediante Intubación Nasotraqueal con tubo Nº '+(t?t.value:'7')+' con manguito de baja presión';
    } else if(via==='ML'){
      dispTxt='manejo de la vía aérea mediante Máscara Laríngea (Dispositivo Supraglótico)';
    } else {
      dispTxt='manejo de la vía aérea mediante Intubación Orotraqueal con tubo endotraqueal Nº '+(t?t.value:'7')+' con manguito de baja presión';
    }
    return 'Anestesia general balanceada. Bajo estrictas medidas de seguridad, se realiza inducción anestésica. Se procede al '+dispTxt+' al primer intento, confirmando la correcta colocación mediante capnografía y auscultación simétrica del murmullo vesicular.';
  },
  tiva:function(){
    var t=document.getElementById('metodos-tubo');
    var via=document.getElementById('fj-via')?document.getElementById('fj-via').value:'';
    var viaTxt='';
    if(via==='ML')viaTxt=' Manejo de vía aérea con Máscara Laríngea.';
    else if(via==='INT_NASO')viaTxt=' Intubación nasotraqueal con tubo Nº '+(t?t.value:'7')+'.';
    else if(via&&via!=='')viaTxt=' Intubación orotraqueal con tubo Nº '+(t?t.value:'7')+'.';
    return 'TIVA (Anestesia Total Intravenosa). Infusión continua de agentes anestésicos EV.'+viaTxt;
  },
  peridural:function(){return 'Anestesia peridural. T\u00e9cnica as\u00e9ptica estricta. Cat\u00e9ter peridural.';},
  combinada:function(){return 'Anestesia combinada raqui-epidural (CSE). Componente intratecal + catéter peridural.';},
  localasistida:function(){
    var sub=(document.getElementById('fj-tec-subtipo')?document.getElementById('fj-tec-subtipo').value:'')||'';
    if(/t[oó]pica/i.test(sub)){
      return 'Se realiza procedimiento bajo anestesia local tópica. Aplicación de anestésico local sobre mucosas o piel, con monitoreo clínico según necesidad.';
    }
    if(/infiltraci/i.test(sub)){
      return 'Se realiza procedimiento bajo anestesia local por infiltración. Infiltración de anestésico local en tejidos, con monitoreo clínico según necesidad.';
    }
    return 'Anestesia local. Seleccioná el subtipo (tópica o infiltración).';
  },
  sedacion:function(){
    var nivel=_nivelSedacion();
    var via=document.getElementById('fj-via')?document.getElementById('fj-via').value:'';
    var base='';
    if(nivel==='minima'){
      base='Se realiza procedimiento bajo Sedación Mínima (Ansiolisis). Paciente despierto, responde normalmente a estímulos verbales, conserva reflejos protectores de la vía aérea y estabilidad hemodinámica.';
    } else if(nivel==='moderada'){
      base='Se realiza procedimiento bajo Sedación Moderada (Consciente). Paciente responde a órdenes verbales o táctiles, ventilación espontánea adecuada, con conservación de reflejos protectores de la vía aérea.';
    } else if(nivel==='profunda'){
      base='Se realiza procedimiento bajo Sedación Profunda. Paciente responde solo a estímulos dolorosos repetidos; se mantiene vigilancia estrecha de vía aérea, ventilación y estabilidad hemodinámica.';
    } else if(nivel==='cam'){
      base='Se realiza procedimiento bajo Cuidado Anestésico Monitorizado (CAM). Monitoreo continuo por anestesiólogo, con sedación titulada según requerimiento del procedimiento y de la respuesta del paciente.';
    } else {
      return 'Sedación / CAM. Seleccioná el nivel de sedación.';
    }
    if(via==='Ventilación espontánea al aire ambiente'){
      base+=' Paciente en ventilación espontánea al aire ambiente.';
    } else if(via&&via!=='no_aplica'){
      base+=' Soporte de oxígeno mediante '+via+'.';
    } else {
      base+=' Ventilación espontánea.';
    }
    return base;
  },
  bloqueo:function(){
    var sub=(document.getElementById('fj-tec-subtipo')?document.getElementById('fj-tec-subtipo').value:'')||'';
    var bloq=(document.getElementById('fj-tec')?document.getElementById('fj-tec').value:'')||'';
    var ag=document.getElementById('fj-tec-aguja')?document.getElementById('fj-tec-aguja').value:'';
    var cal=document.getElementById('fj-tec-calibre')?document.getElementById('fj-tec-calibre').value:'';
    var reg=/miembro_sup/i.test(sub)?'miembro superior':/miembro_inf/i.test(sub)?'miembro inferior':/tronco/i.test(sub)?'tronco / pared':'';
    var det=(ag&&cal)?ag+' '+cal:(ag||'');
    var base='Bloqueo de nervio periférico';
    if(reg)base+=' de '+reg;
    if(bloq&&bloq!==sub)base+=' ('+bloq+')';
    base+='.';
    if(det)base+=' Aguja '+det+'.';
    return base;
  }
};
// ═══════════════════════════════════════════════════
// DROGAS SUGERIDAS POR TÉCNICA
// ═══════════════════════════════════════════════════
function autoPremedRegional(){
  // Solo chips de sugerencia — NO escribe solo en la foja
  if(typeof calcPremed==='function')calcPremed(true);
}

function _sugerirDrogasPorTec(tec){
  // Fuente de verdad: tipo + subtipo en DOM (no el argumento suelto "general")
  var tipoTec=(document.getElementById('fj-tec-tipo')?document.getElementById('fj-tec-tipo').value:'')||'';
  var subRaw=(document.getElementById('fj-tec-subtipo')?document.getElementById('fj-tec-subtipo').value:'')||'';
  var sub=subRaw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  var fallback=(tec||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  if(tipoTec==='general'){
    if(/tiva/.test(sub)){sugerirDrogas('tiva');return;}
    if(/balancead/.test(sub)){sugerirDrogas('general');return;}
    // Solo "Anestesia General" sin subtipo: esperar TIVA o Balanceada
    sugerirDrogas('');
    return;
  }
  if(tipoTec==='neuroaxial'){
    if(/combinada|cse/.test(sub)||/combinada|cse/.test(fallback)){
      sugerirDrogas('combinada');setTimeout(autoPremedRegional,100);return;
    }
    if(/peridural|epidural|cateter/.test(sub)||/peridural|epidural/.test(fallback)){
      sugerirDrogas('peridural');setTimeout(autoPremedRegional,100);return;
    }
    if(/raqui|subarac|intratecal/.test(sub)||!sub){
      if(!sub){sugerirDrogas('');return;} // esperar subtipo
      sugerirDrogas('raquidea');setTimeout(autoPremedRegional,100);return;
    }
    sugerirDrogas('raquidea');setTimeout(autoPremedRegional,100);return;
  }
  if(tipoTec==='bloqueo'){
    // Esperar región (miembro_sup / miembro_inf / tronco) — no mezclar con local/neuroaxial
    if(!/miembro_sup|miembro_inf|tronco/.test(sub)&&!/miembro_sup|miembro_inf|tronco/.test(fallback)){
      sugerirDrogas('');
      return;
    }
    sugerirDrogas('bloqueo');
    setTimeout(autoPremedRegional,100);
    return;
  }
  if(tipoTec==='sedacion'){
    if(!sub){sugerirDrogas('');return;}
    sugerirDrogas('sedacion');
    setTimeout(autoPremedRegional,100);
    return;
  }
  if(tipoTec==='local'){
    if(!sub){sugerirDrogas('');return;}
    sugerirDrogas('local');
    return;
  }

  // Fallback si aún no hay tipo en DOM (no cruzar técnicas)
  var v=sub||fallback;
  if(/tiva/.test(v))sugerirDrogas('tiva');
  else if(/combinada|cse/.test(v)){sugerirDrogas('combinada');setTimeout(autoPremedRegional,100);}
  else if(/raqui/.test(v)&&!/epidural|peridural|combinada/.test(v)){sugerirDrogas('raquidea');setTimeout(autoPremedRegional,100);}
  else if(/peridural|epidural/.test(v)&&!/combinada|cse|raqui/.test(v)){sugerirDrogas('peridural');setTimeout(autoPremedRegional,100);}
  else if(/cam|monitorizado|ansiolisis|sedaci/.test(v))sugerirDrogas('sedacion');
  else if(/t[oó]pica|infiltraci/.test(v))sugerirDrogas('local');
  else if(/miembro_sup|miembro_inf|tronco/.test(v)){sugerirDrogas('bloqueo');setTimeout(autoPremedRegional,100);}
  else sugerirDrogas('');
}

function _concGasMac(agente){
  if(typeof calcMacAjustado!=='function'){
    return{sevoflurano:2.1,isoflurano:1.2,desflurano:6}[agente]||2;
  }
  var edad=typeof getEdadPaciente==='function'?getEdadPaciente():40;
  return calcMacAjustado(agente,edad); // 1.0 MAC
}

var _pendingSugerirTipo=null;
function sugerirDrogas(tipo){
  var cont=document.getElementById('drogas-sugeridas');
  if(!cont){
    // Vista drogas aún no montada: reintentar (evita “no aparece nada” al elegir técnica temprano)
    _pendingSugerirTipo=tipo;
    clearTimeout(window._sugerirRetryTimer);
    window._sugerirRetryTimer=setTimeout(function(){
      if(_pendingSugerirTipo!=null)sugerirDrogas(_pendingSugerirTipo);
    },120);
    return;
  }
  _pendingSugerirTipo=null;
  var peso=parseFloat((S.cur&&S.cur.peso)||(document.getElementById('f-peso')?document.getElementById('f-peso').value:0)||70);
  function rnd(n){return parseFloat(n.toFixed(1));}
  // Sin paneles grandes: solo nota TIVA si aplica
  if(typeof hideGasesCalcPanel==='function')hideGasesCalcPanel();
  if(tipo==='tiva'){
    if(typeof renderTivaCalcPanel==='function')renderTivaCalcPanel();
  } else if(typeof hideTivaCalcPanel==='function')hideTivaCalcPanel();

  var hint=document.getElementById('drogas-hint');
  if(hint){
    if(tipo==='tiva')hint.textContent='TIVA: Inducción = bolos IV · Mantenimiento = infusión (kg + duración en Tiempos).';
    else if(tipo==='general')hint.textContent='Balanceada: Inducción = IV · Mantenimiento = gas / coadyuvantes (MAC por edad).';
    else if(tipo==='raquidea')hint.textContent='Raquídea: solo fármacos intratecales (no peridural).';
    else if(tipo==='peridural')hint.textContent='Peridural: solo fármacos por catéter / espacio epidural (no intratecal).';
    else if(tipo==='combinada')hint.textContent='CSE: elegí por separado Intratecal y Peridural/catéter (no se mezclan las listas).';
    else if(tipo==='sedacion'){
      var nv=_nivelSedacion();
      if(nv==='minima')hint.textContent='Sedación mínima: ansiolisis leve (dosis bajas).';
      else if(nv==='moderada')hint.textContent='Sedación moderada: fármacos titulables, paciente responde a órdenes.';
      else if(nv==='profunda')hint.textContent='Sedación profunda: mayor profundidad; vigilancia de vía aérea.';
      else if(nv==='cam')hint.textContent='CAM: monitoreo + sedación titulada según procedimiento.';
      else hint.textContent='Sedación / CAM: elegí el subtipo para ver medicación.';
    }
    else if(tipo==='local')hint.textContent='Anestesia local: solo tópico o infiltración (sin sedación ni bloqueo).';
    else if(tipo==='bloqueo'){
      var sb=(document.getElementById('fj-tec-subtipo')?document.getElementById('fj-tec-subtipo').value:'')||'';
      if(sb==='miembro_sup')hint.textContent='Bloqueo miembro superior: AL perineural (plexo / nervios).';
      else if(sb==='miembro_inf')hint.textContent='Bloqueo miembro inferior: AL perineural (plexo / nervios).';
      else if(sb==='tronco')hint.textContent='Bloqueo de tronco/pared: AL diluido, volúmenes de plano.';
      else hint.textContent='Bloqueo: elegí la región para ver medicación.';
    }
    else hint.textContent='Primeras letras → sugerencias. Dosis por peso del paciente.';
  }

  var tivaP=null;
  if(tipo==='tiva'&&typeof getTivaPesos==='function'&&typeof getTivaState==='function'){
    tivaP=getTivaPesos(getTivaState());
  }
  var pesoProp=tivaP&&tivaP.propKg?tivaP.propKg:peso;
  var pesoRemi=tivaP&&tivaP.remiKg?tivaP.remiKg:peso;
  var tivaInd=typeof calcTivaInduccion==='function'?calcTivaInduccion():null;
  var tivaMant=typeof getTivaDosisActual==='function'?getTivaDosisActual():null;
  var sev=_concGasMac('sevoflurano');
  var iso=_concGasMac('isoflurano');
  var des=_concGasMac('desflurano');

  var grupos=[];
  if(tipo==='tiva'){
    var indProp=tivaInd?tivaInd.propMg:rnd(2*pesoProp);
    var indRemi=tivaInd?tivaInd.remiMcg:rnd(1*pesoRemi);
    var mantProp=(tivaMant&&tivaMant.propTotal)?tivaMant.propTotal:null;
    var mantRemi=(tivaMant&&tivaMant.remiTotal)?tivaMant.remiTotal:null;
    var remiRate=(tivaMant&&tivaMant.remiRate)?tivaMant.remiRate:0.2;
    grupos.push({id:'sg-ind',t:'Inducción TIVA (IV)',items:[
      {n:'Propofol',d:indProp,u:'mg EV'},
      {n:'Etomidato',d:rnd(0.25*peso),u:'mg EV'},
      {n:'Ketamina',d:rnd(1.5*peso),u:'mg EV'},
      {n:'Midazolam',d:rnd(0.05*peso),u:'mg EV'},
      {n:'Fentanilo',d:rnd(3*peso),u:'mcg EV'},
      {n:'Remifentanilo',d:indRemi,u:'mcg EV'}
    ]});
    grupos.push({id:'sg-mant',t:'Mantenimiento TIVA (IV)',items:[
      {n:'Propofol',d:mantProp!=null?String(mantProp):'8',u:mantProp!=null?'mg EV':'mg/kg/h inf'},
      {n:'Remifentanilo',d:mantRemi!=null?String(mantRemi):String(remiRate),u:mantRemi!=null?'mcg EV':'mcg/kg/min inf'},
      {n:'Midazolam',d:'0.05',u:'mg/kg/h inf'},
      {n:'Dexmedetomidina',d:'0.5',u:'mcg/kg/h inf'}
    ]});
  } else if(tipo==='general'){
    // Balanceada: inducción IV + mantenimiento gas / coadyuvantes
    grupos.push({id:'sg-ind',t:'Inducción IV (balanceada)',items:[
      {n:'Propofol',d:rnd(2*peso),u:'mg EV'},
      {n:'Etomidato',d:rnd(0.25*peso),u:'mg EV'},
      {n:'Ketamina',d:rnd(1.5*peso),u:'mg EV'},
      {n:'Midazolam',d:rnd(0.05*peso),u:'mg EV'},
      {n:'Fentanilo',d:rnd(3*peso),u:'mcg EV'}
    ]});
    grupos.push({id:'sg-rel',t:'Relajantes',items:[
      {n:'Rocuronio',d:rnd(0.9*peso),u:'mg EV'},
      {n:'Succinilcolina',d:rnd(1.25*peso),u:'mg EV'},
      {n:'Atracurio',d:rnd(0.45*peso),u:'mg EV'},
      {n:'Vecuronio',d:rnd(0.1*peso),u:'mg EV'},
      {n:'Pancuronio',d:rnd(0.1*peso),u:'mg EV'}
    ]});
    grupos.push({id:'sg-mant',t:'Mantenimiento inhalatorio',items:[
      {n:'Sevoflurano',d:String(sev),u:'% CAM'},
      {n:'Isoflurano',d:String(iso),u:'% CAM'},
      {n:'Desflurano',d:String(des),u:'% CAM'},
      {n:'Remifentanilo',d:'0.2',u:'mcg/kg/min inf'},
      {n:'Fentanilo',d:rnd(1.5*peso),u:'mcg EV bolo'},
      {n:'Dexmedetomidina',d:'0.5',u:'mcg/kg/h inf'},
      {n:'Lidocaína',d:'1.5',u:'mg/kg/h inf'}
    ]});
  } else if(tipo==='raquidea'){
    // Solo intratecal — no mezclar con peridural
    grupos.push({t:'Anestésico local intratecal',items:[
      {n:'Bupivacaína hiperbárica 0.5%',d:'12.5',u:'mg intratecal'},
      {n:'Bupivacaína isobárica 0.5%',d:'12.5',u:'mg intratecal'},
      {n:'Levobupivacaína 0.5%',d:'12.5',u:'mg intratecal'},
      {n:'Ropivacaína 0.5%',d:'15',u:'mg intratecal'},
      {n:'Ropivacaína 0.75%',d:'15',u:'mg intratecal'},
      {n:'Prilocaína hiperbárica 2%',d:'40',u:'mg intratecal'},
      {n:'Lidocaína 2%',d:'60',u:'mg intratecal'}
    ]});
    grupos.push({t:'Opioides intratecales',items:[
      {n:'Fentanilo',d:'25',u:'mcg intratecal'},
      {n:'Sufentanilo',d:'5',u:'mcg intratecal'},
      {n:'Morfina s/conservantes',d:'100',u:'mcg intratecal'}
    ]});
    grupos.push({t:'Alfa-2 agonistas intratecales',items:[
      {n:'Clonidina',d:'30',u:'mcg intratecal'},
      {n:'Dexmedetomidina',d:'5',u:'mcg intratecal'}
    ]});
  } else if(tipo==='peridural'){
    // Solo peridural — no hiperbáricas ni dosis IT
    grupos.push({t:'Anestésico local peridural',items:[
      {n:'Ropivacaína 0.2%',d:'10',u:'ml peridural'},
      {n:'Ropivacaína 0.375%',d:'10',u:'ml peridural'},
      {n:'Ropivacaína 0.5%',d:'15',u:'ml peridural'},
      {n:'Ropivacaína 0.75%',d:'12',u:'ml peridural'},
      {n:'Bupivacaína 0.125%',d:'10',u:'ml peridural'},
      {n:'Bupivacaína 0.25%',d:'10',u:'ml peridural'},
      {n:'Bupivacaína 0.5%',d:'15',u:'ml peridural'},
      {n:'Levobupivacaína 0.25%',d:'10',u:'ml peridural'},
      {n:'Levobupivacaína 0.5%',d:'15',u:'ml peridural'},
      {n:'Lidocaína 1%',d:'10',u:'ml peridural'},
      {n:'Lidocaína 2%',d:'10',u:'ml peridural'},
      {n:'Lidocaína 2% + adrenalina (dosis test)',d:'3',u:'ml peridural'}
    ]});
    grupos.push({t:'Opioides peridurales',items:[
      {n:'Fentanilo',d:'50',u:'mcg peridural'},
      {n:'Sufentanilo',d:'10',u:'mcg peridural'},
      {n:'Morfina s/conservantes',d:'2',u:'mg peridural'}
    ]});
    grupos.push({t:'Alfa-2 / adyuvantes peridurales',items:[
      {n:'Clonidina',d:'75',u:'mcg peridural'},
      {n:'Dexmedetomidina',d:'30',u:'mcg peridural'},
      {n:'Adrenalina 1:200.000',d:'5',u:'mcg/ml peridural'}
    ]});
  } else if(tipo==='combinada'){
    // CSE: listas separadas IT (dosis algo menores) + peridural/catéter — sin mezclar en un solo combo
    grupos.push({t:'CSE — Intratecal (raquídea)',items:[
      {n:'Bupivacaína hiperbárica 0.5%',d:'10',u:'mg intratecal'},
      {n:'Bupivacaína isobárica 0.5%',d:'10',u:'mg intratecal'},
      {n:'Levobupivacaína 0.5%',d:'10',u:'mg intratecal'},
      {n:'Ropivacaína 0.5%',d:'12',u:'mg intratecal'}
    ]});
    grupos.push({t:'CSE — Opioides / adyuvantes intratecales',items:[
      {n:'Fentanilo',d:'20',u:'mcg intratecal'},
      {n:'Sufentanilo',d:'5',u:'mcg intratecal'},
      {n:'Morfina s/conservantes',d:'100',u:'mcg intratecal'},
      {n:'Clonidina',d:'30',u:'mcg intratecal'},
      {n:'Dexmedetomidina',d:'5',u:'mcg intratecal'}
    ]});
    grupos.push({t:'CSE — Peridural / catéter',items:[
      {n:'Lidocaína 2% + adrenalina (dosis test)',d:'3',u:'ml peridural'},
      {n:'Ropivacaína 0.2%',d:'8',u:'ml peridural'},
      {n:'Ropivacaína 0.375%',d:'8',u:'ml peridural'},
      {n:'Ropivacaína 0.5%',d:'10',u:'ml peridural'},
      {n:'Bupivacaína 0.125%',d:'8',u:'ml peridural'},
      {n:'Bupivacaína 0.25%',d:'8',u:'ml peridural'},
      {n:'Bupivacaína 0.5%',d:'10',u:'ml peridural'},
      {n:'Levobupivacaína 0.25%',d:'8',u:'ml peridural'}
    ]});
    grupos.push({t:'CSE — Opioides / adyuvantes peridurales',items:[
      {n:'Fentanilo',d:'50',u:'mcg peridural'},
      {n:'Sufentanilo',d:'10',u:'mcg peridural'},
      {n:'Morfina s/conservantes',d:'2',u:'mg peridural'},
      {n:'Clonidina',d:'75',u:'mcg peridural'},
      {n:'Dexmedetomidina',d:'30',u:'mcg peridural'}
    ]});
  } else if(tipo==='bloqueo'){
    // Listas por región — sin fármacos de raquídea/peridural/sedación
    var regBloq=(document.getElementById('fj-tec-subtipo')?document.getElementById('fj-tec-subtipo').value:'')||'';
    if(regBloq==='miembro_sup'){
      grupos.push({t:'AL perineural — miembro superior',items:[
        {n:'Ropivacaína 0.5%',d:'25',u:'ml'},
        {n:'Ropivacaína 0.375%',d:'30',u:'ml'},
        {n:'Bupivacaína 0.25%',d:'30',u:'ml'},
        {n:'Bupivacaína 0.5%',d:'20',u:'ml'},
        {n:'Levobupivacaína 0.5%',d:'20',u:'ml'},
        {n:'Mepivacaína 1%',d:'30',u:'ml'},
        {n:'Lidocaína 1.5% + adrenalina',d:'30',u:'ml'}
      ]});
    } else if(regBloq==='miembro_inf'){
      grupos.push({t:'AL perineural — miembro inferior',items:[
        {n:'Ropivacaína 0.5%',d:'20',u:'ml'},
        {n:'Ropivacaína 0.375%',d:'25',u:'ml'},
        {n:'Bupivacaína 0.25%',d:'25',u:'ml'},
        {n:'Bupivacaína 0.5%',d:'15',u:'ml'},
        {n:'Levobupivacaína 0.5%',d:'15',u:'ml'},
        {n:'Mepivacaína 1%',d:'25',u:'ml'},
        {n:'Lidocaína 1% + adrenalina',d:'20',u:'ml'}
      ]});
    } else if(regBloq==='tronco'){
      grupos.push({t:'AL de plano — tronco / pared',items:[
        {n:'Ropivacaína 0.2%',d:'20',u:'ml'},
        {n:'Ropivacaína 0.25%',d:'20',u:'ml'},
        {n:'Ropivacaína 0.375%',d:'15',u:'ml'},
        {n:'Bupivacaína 0.25%',d:'20',u:'ml'},
        {n:'Levobupivacaína 0.25%',d:'20',u:'ml'},
        {n:'Lidocaína 0.5%',d:'20',u:'ml'}
      ]});
    } else {
      cont.style.display='none';cont.innerHTML='';return;
    }
    grupos.push({t:'Adyuvantes perineurales',items:[
      {n:'Dexametasona',d:'4',u:'mg'},
      {n:'Dexmedetomidina',d:'50',u:'mcg'},
      {n:'Clonidina',d:'50',u:'mcg'},
      {n:'Adrenalina 1:200.000',d:'5',u:'mcg/ml'}
    ]});
  } else if(tipo==='sedacion'){
    var nivel=_nivelSedacion();
    if(!nivel){
      cont.style.display='none';cont.innerHTML='';return;
    }
    if(nivel==='minima'){
      grupos.push({id:'sg-sed',t:'Ansiolisis / sedación mínima',items:[
        {n:'Midazolam',d:Math.max(1,rnd(0.02*peso)),u:'mg EV'},
        {n:'Fentanilo',d:'25',u:'mcg EV'},
        {n:'Dexmedetomidina',d:'0.3',u:'mcg/kg/h inf'}
      ]});
      grupos.push({id:'sg-sed-sop',t:'Soporte / coadyuvantes',items:[
        {n:'Ondansetrón',d:'4',u:'mg EV'},
        {n:'Atropina',d:rnd(0.01*peso),u:'mg EV'}
      ]});
    } else if(nivel==='moderada'){
      grupos.push({id:'sg-sed',t:'Sedación moderada (consciente)',items:[
        {n:'Midazolam',d:rnd(0.03*peso),u:'mg EV'},
        {n:'Propofol',d:rnd(0.75*peso),u:'mg EV'},
        {n:'Fentanilo',d:rnd(1*peso),u:'mcg EV'},
        {n:'Remifentanilo',d:'0.05',u:'mcg/kg/min inf'},
        {n:'Ketamina',d:rnd(0.3*peso),u:'mg EV'},
        {n:'Dexmedetomidina',d:'0.4',u:'mcg/kg/h inf'}
      ]});
      grupos.push({id:'sg-sed-sop',t:'Soporte / coadyuvantes',items:[
        {n:'Lidocaína',d:rnd(0.5*peso),u:'mg EV'},
        {n:'Ondansetrón',d:'4',u:'mg EV'},
        {n:'Dexametasona',d:'4',u:'mg EV'}
      ]});
    } else if(nivel==='profunda'){
      grupos.push({id:'sg-sed',t:'Sedación profunda',items:[
        {n:'Propofol',d:rnd(1.5*peso),u:'mg EV'},
        {n:'Propofol infusión',d:'3',u:'mg/kg/h inf'},
        {n:'Midazolam',d:rnd(0.04*peso),u:'mg EV'},
        {n:'Fentanilo',d:rnd(1.5*peso),u:'mcg EV'},
        {n:'Remifentanilo',d:'0.1',u:'mcg/kg/min inf'},
        {n:'Ketamina',d:rnd(0.5*peso),u:'mg EV'},
        {n:'Dexmedetomidina',d:'0.5',u:'mcg/kg/h inf'}
      ]});
      grupos.push({id:'sg-sed-sop',t:'Soporte / vía aérea',items:[
        {n:'Lidocaína',d:rnd(1*peso),u:'mg EV'},
        {n:'Atropina',d:rnd(0.01*peso),u:'mg EV'},
        {n:'Succinilcolina',d:rnd(1*peso),u:'mg EV'},
        {n:'Ondansetrón',d:'4',u:'mg EV'}
      ]});
    } else if(nivel==='cam'){
      grupos.push({id:'sg-sed',t:'CAM — sedación titulada',items:[
        {n:'Midazolam',d:rnd(0.03*peso),u:'mg EV'},
        {n:'Propofol',d:rnd(0.5*peso),u:'mg EV'},
        {n:'Fentanilo',d:'50',u:'mcg EV'},
        {n:'Remifentanilo',d:'0.05',u:'mcg/kg/min inf'},
        {n:'Ketamina',d:rnd(0.25*peso),u:'mg EV'},
        {n:'Dexmedetomidina',d:'0.4',u:'mcg/kg/h inf'}
      ]});
      grupos.push({id:'sg-sed-sop',t:'CAM — soporte',items:[
        {n:'Ondansetrón',d:'4',u:'mg EV'},
        {n:'Dexametasona',d:'4',u:'mg EV'},
        {n:'Atropina',d:rnd(0.01*peso),u:'mg EV'},
        {n:'Lidocaína',d:rnd(0.5*peso),u:'mg EV'}
      ]});
    }
  } else if(tipo==='local'){
    // Solo local — sin sedación, sin bloqueo perineural, sin neuroaxial
    var subLoc=(document.getElementById('fj-tec-subtipo')?document.getElementById('fj-tec-subtipo').value:'')||'';
    var sl=subLoc.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(/topica/.test(sl)){
      grupos.push({t:'Anestésico local tópico',items:[
        {n:'Lidocaína gel 2%',d:'5',u:'ml tópico'},
        {n:'Lidocaína spray 10%',d:'2',u:'puff tópico'},
        {n:'Lidocaína/Prilocaína (EMLA)',d:'1',u:'aplicación tópica'},
        {n:'Benzocaína tópica',d:'1',u:'aplicación tópica'},
        {n:'Tetracaína tópica',d:'1',u:'aplicación tópica'}
      ]});
    } else if(/infiltraci/.test(sl)){
      grupos.push({t:'Anestésico local infiltración',items:[
        {n:'Lidocaína 1%',d:'10',u:'ml'},
        {n:'Lidocaína 2%',d:'10',u:'ml'},
        {n:'Lidocaína 2% + adrenalina',d:'10',u:'ml'},
        {n:'Bupivacaína 0.25%',d:'10',u:'ml'},
        {n:'Bupivacaína 0.5%',d:'10',u:'ml'},
        {n:'Ropivacaína 0.2%',d:'10',u:'ml'},
        {n:'Ropivacaína 0.5%',d:'10',u:'ml'},
        {n:'Mepivacaína 1%',d:'10',u:'ml'},
        {n:'Mepivacaína 2%',d:'10',u:'ml'}
      ]});
    } else {
      cont.style.display='none';cont.innerHTML='';return;
    }
  }

  // Inotrópicos: no en local pura (sí en bloqueo por toxicidad AL / hipotensión)
  if(tipo!=='local')grupos.push({id:'sg-inot',t:'Inotrópicos / Emergencia',items:[
    {n:'Efedrina',d:rnd(0.1*peso),u:'mg EV'},
    {n:'Noradrenalina',d:'4',u:'mcg/min inf'},
    {n:'Adrenalina',d:'0.1',u:'mcg/kg/min inf'},
    {n:'Vasopresina',d:'0.03',u:'U/min inf'},
    {n:'Dobutamina',d:'5',u:'mcg/kg/min inf'},
    {n:'Dopamina',d:'5',u:'mcg/kg/min inf'},
    {n:'Isoproterenol',d:'0.05',u:'mcg/kg/min inf'},
    {n:'Milrinona',d:'0.5',u:'mcg/kg/min inf'},
    {n:'Atropina',d:rnd(0.015*peso),u:'mg EV'}
  ]});

  if(!tipo){cont.style.display='none';cont.innerHTML='';return;}
  cont.style.display='block';
  cont.innerHTML='';

  grupos.forEach(function(g){
    var wrap=document.createElement('div');
    wrap.style.cssText='display:grid;grid-template-columns:1fr 70px 60px;gap:4px;margin-bottom:6px;align-items:center';

    // Select con las drogas del grupo
    var sel=document.createElement('select');
    sel.className='fi';
    sel.style.cssText='width:100%;font-size:10px;padding:4px 2px;height:32px;box-sizing:border-box';
    var opt0=document.createElement('option');
    opt0.value='';
    opt0.textContent=g.t+' — elegir...';
    sel.appendChild(opt0);
    g.items.forEach(function(it){
      var op=document.createElement('option');
      var fil=typeof filtrarSugerenciaDroga==='function'?filtrarSugerenciaDroga(it.n):{label:it.n,ev:null};
      op.value=it.n+'|'+it.d+'|'+it.u;
      op.textContent=fil.label+' ('+it.d+' '+it.u+')';
      if(fil.ev&&fil.ev.nivel==='evitar')op.style.color='var(--red)';
      else if(fil.ev&&fil.ev.nivel==='precaucion')op.style.color='var(--warn)';
      sel.appendChild(op);
    });

    // Input de dosis (editable)
    var inp=document.createElement('input');
    inp.type='text';
    inp.placeholder='dosis';
    inp.style.cssText='width:100%;font-size:10px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:4px 2px;height:32px;color:var(--text);box-sizing:border-box;text-align:center';
    inp.readOnly=true;

    // Boton agregar
    var btn=document.createElement('button');
    btn.className='btn btn-s';
    btn.style.cssText='width:100%;font-size:10px;padding:4px 2px;height:32px;white-space:nowrap;box-sizing:border-box';
    btn.textContent='+ Agregar';
    btn.disabled=true;

    // Al cambiar select -> agregar (como antes)
    sel.onchange=function(){
      if(!sel.value){inp.value='';inp.readOnly=true;btn.disabled=true;return;}
      var parts=sel.value.split('|');
      inp.value=parts[1]+' '+parts[2];
      inp.readOnly=false;
      btn.disabled=false;
      if(typeof showReglaDroga==='function')showReglaDroga(parts[0]);
      setTimeout(function(){btn.click();},10);
    };

    // Al confirmar -> agregar a la lista
    (function(grupoNombre){
      btn.onclick=function(){
        if(!sel.value)return;
        var parts=sel.value.split('|');
        var nombre=parts[0];
        var dosis=inp.value.trim()||parts[1]+' '+parts[2];
        addDrogaDirecta(nombre,dosis,grupoNombre);
        sel.value='';inp.value='';inp.readOnly=true;btn.disabled=true;
      };
    })(g.t);

    wrap.appendChild(sel);
    wrap.appendChild(inp);
    wrap.appendChild(btn);
    cont.appendChild(wrap);
  });
  if(typeof renderAlertasClinicas==='function')renderAlertasClinicas();
}
function addDrogaDirecta(nombre,dosis,grupo){
  if(!S.cur)return;
  if(!S.cur.foja)S.cur.foja={drogas:[],vitals:[]};
  if(!S.cur.foja.drogas)S.cur.foja.drogas=[];
  // Compatibilidad: si se llama con un solo string "Nombre dosis unidad" (legacy)
  if(dosis===undefined){
    var parts=nombre.split(' ');
    nombre=parts[0]||'';
    dosis=parts.slice(1).join(' ')||'';
  }
  var dparts=(dosis||'').trim().split(' ');
  var d=dparts[0]||'';
  var v=dparts.slice(1).join(' ')||'EV';
  var causa='';
  var esInot=clasificarGrupoDroga(grupo)==='inot';
  if(esInot){
    causa=(prompt('¿Por qué se utiliza '+nombre+' (inotrópico / vasoactivo)?\nEj: hipotensión, bajo gasto, bradicardia, vasodilatación','')||'').trim();
    if(!causa)causa='causa no indicada';
  }
  S.cur.foja.drogas.push({n:nombre,d:d,v:v,grupo:grupo||'',causa:causa});
  // Causa del inotrópico: solo en Métodos (no ensuciar Observaciones Aero)
  renderDrogas();
  if(typeof refrescarMetodosDesdeDrogas==='function')refrescarMetodosDesdeDrogas();
  else if(typeof actualizarMetodos==='function')actualizarMetodos();
  if(typeof _warnDrugToast==='function')_warnDrugToast(nombre);
  toast(nombre+(esInot&&causa&&causa!=='causa no indicada'?' ('+causa+')':'')+' agregado');
}

