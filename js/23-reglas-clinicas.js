function _normDrugName(n){
  return String(n||'').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\d[\d.,%]*/g,' ')
    .replace(/[^a-z\s]/g,' ')
    .trim();
}

function _matchDrugRule(nombre){
  var norm=_normDrugName(nombre);
  if(!norm)return null;
  var rules=REGLAS_CLINICAS.drogas||[];
  for(var i=0;i<rules.length;i++){
    var r=rules[i];
    for(var j=0;j<r.match.length;j++){
      var m=r.match[j].toLowerCase();
      if(norm.indexOf(m)>=0)return r;
    }
  }
  return null;
}

function getTextoClinicoCaso(){
  var parts=[];
  if(typeof _antecedentes!=='undefined'&&_antecedentes.length)parts.push(_antecedentes.join(' '));
  var i=S.cur||{};
  var f=i.foja||{};
  ['diag','ciru','pac'].forEach(function(k){if(i[k])parts.push(i[k]);});
  ['obs','examenFisico','obs_geclisa','premed','metodos'].forEach(function(k){if(f[k])parts.push(f[k]);});
  if(i.pracs&&i.pracs.length)i.pracs.forEach(function(p){if(p.desc)parts.push(p.desc);});
  var ids=['fj-examen-fisico','fj-obs','fj-obs-geclisa'];
  ids.forEach(function(id){
    var el=document.getElementById(id);
    if(el&&el.value)parts.push(el.value);
  });
  return parts.join(' ').toLowerCase();
}

function getContextosActivos(){
  if(typeof REGLAS_CLINICAS==='undefined')return [];
  var texto=getTextoClinicoCaso();
  var asaEl=document.getElementById('fj-asa');
  var asa=asaEl?asaEl.value:'';
  var cvPat=false;
  if(typeof getTextoAuscCv==='function'){
    var cvTxt=getTextoAuscCv().toLowerCase();
    cvPat=/soplo|arritmia|fa\b|fibril|icc|insuficiencia card|hipofon|frote|r3|r4|taquicard|bradicard|extrasist|pr[oó]tesis|marca.?pasos|alterado/i.test(cvTxt)
      &&!/normofon[eé]ticos, sin soplos/i.test(cvTxt);
  }
  var found=[];
  (REGLAS_CLINICAS.contextos||[]).forEach(function(c){
    if(c.detect.test(texto))found.push(c.id);
  });
  if(typeof _antecedentes!=='undefined'){
    if(_antecedentes.some(function(a){return a.indexOf('IRC')>=0;})&&found.indexOf('irc')<0)found.push('irc');
    if(_antecedentes.some(function(a){return a==='IC'||/cardio|coronario/i.test(a);})&&found.indexOf('ic_cardio')<0)found.push('ic_cardio');
    if(_antecedentes.some(function(a){return a==='Coronario';})&&found.indexOf('ic_cardio')<0)found.push('ic_cardio');
    if(_antecedentes.some(function(a){return a==='Anticoagulado';})&&found.indexOf('anticoag')<0)found.push('anticoag');
  }
  if(cvPat&&found.indexOf('ic_cardio')<0)found.push('ic_cardio');
  if((asa==='IV'||asa==='V')&&/cardio|coron|valv|cec|bypass/i.test(texto)&&found.indexOf('ic_cardio')<0)found.push('ic_cardio');
  return found;
}

function _ctxLabel(id){
  var c=(REGLAS_CLINICAS.contextos||[]).find(function(x){return x.id===id;});
  return c?c.label:id;
}

function evaluarReglaDroga(nombre){
  var ctxs=getContextosActivos();
  if(!ctxs.length)return null;
  var rule=_matchDrugRule(nombre);
  if(!rule)return null;
  var best=null;
  rule.reglas.forEach(function(r){
    if(ctxs.indexOf(r.ctx)<0)return;
    var rank=r.nivel==='evitar'?3:r.nivel==='precaucion'?2:1;
    if(!best||rank>(best.rank||(best.nivel==='evitar'?3:best.nivel==='precaucion'?2:1))){
      best={nivel:r.nivel,msg:r.msg,ctx:r.ctx,ctxLabel:_ctxLabel(r.ctx),rank:rank};
    }
  });
  return best;
}

function getAlertasClinicas(){
  var ctxs=getContextosActivos();
  var revisar=[];
  ctxs.forEach(function(c){
    var items=(REGLAS_CLINICAS.revisar&&REGLAS_CLINICAS.revisar[c])||[];
    items.forEach(function(it){
      if(revisar.indexOf(it)<0)revisar.push(it);
    });
  });
  var preferir=[];
  ctxs.forEach(function(c){
    var items=(REGLAS_CLINICAS.preferir&&REGLAS_CLINICAS.preferir[c])||[];
    items.forEach(function(it){
      if(preferir.indexOf(it)<0)preferir.push(it);
    });
  });
  var drogasFoja=[];
  if(S.cur&&S.cur.foja&&S.cur.foja.drogas){
    S.cur.foja.drogas.forEach(function(d){
      if(!d.n)return;
      var ev=evaluarReglaDroga(d.n);
      if(ev&&(ev.nivel==='evitar'||ev.nivel==='precaucion'))drogasFoja.push({n:d.n,ev:ev});
    });
  }
  return {contextos:ctxs,ctxLabels:ctxs.map(_ctxLabel),revisar:revisar,preferir:preferir,drogasFoja:drogasFoja};
}

function renderAlertasClinicas(){
  var panel=document.getElementById('alertas-clinicas');
  if(!panel)return;
  var a=getAlertasClinicas();
  if(!a.contextos.length){
    panel.style.display='none';
    panel.innerHTML='';
    return;
  }
  var html='<div style="font-size:12px;font-weight:600;margin-bottom:6px;color:var(--amber,#ffb400)">&#9888; Contexto: '+a.ctxLabels.join(' · ')+'</div>';
  if(a.revisar.length){
    html+='<div style="font-size:11px;margin-bottom:6px"><b>Revisar antes:</b><ul style="margin:4px 0 0 16px;padding:0;line-height:1.45">';
    a.revisar.forEach(function(r){html+='<li>'+r+'</li>';});
    html+='</ul></div>';
  }
  if(a.preferir.length){
    html+='<div style="font-size:11px;margin-bottom:6px;color:var(--green)"><b>Preferir:</b> '+a.preferir.join(' · ')+'</div>';
  }
  if(a.drogasFoja.length){
    html+='<div style="font-size:11px;color:var(--red)"><b>Atención en foja:</b><ul style="margin:4px 0 0 16px;padding:0">';
    a.drogasFoja.forEach(function(d){
      html+='<li><b>'+d.n+'</b> — '+d.ev.msg+'</li>';
    });
    html+='</ul></div>';
  }
  html+='<div style="font-size:10px;color:var(--text3);margin-top:6px">Ayuda al criterio clínico. Verificar con protocolo institucional.</div>';
  panel.innerHTML=html;
  panel.style.display='block';
}

function showReglaDroga(nombre){
  var bar=document.getElementById('dose-info-bar');
  if(!bar)return;
  var ev=evaluarReglaDroga(nombre);
  if(!ev){
    var drug=DRUGS&&DRUGS.find(function(d){return d.n.toLowerCase()===String(nombre||'').toLowerCase();});
    if(drug)showDoseInfo(drug,parseFloat((S.cur&&S.cur.peso)||0));
    else bar.style.display='none';
    return;
  }
  var color=ev.nivel==='evitar'?'var(--red)':ev.nivel==='preferir'?'var(--green)':'#ffb400';
  var bg=ev.nivel==='evitar'?'rgba(255,80,80,.12)':ev.nivel==='precaucion'?'rgba(255,180,0,.12)':'rgba(29,185,84,.12)';
  var border=ev.nivel==='evitar'?'#ff5050':ev.nivel==='precaucion'?'#ffb400':'var(--green)';
  var icon=ev.nivel==='evitar'?'&#9940;':ev.nivel==='precaucion'?'&#9888;':'&#10003;';
  bar.style.display='block';
  bar.style.color=color;
  bar.style.background=bg;
  bar.style.borderColor=border;
  bar.innerHTML=icon+' <b>'+nombre+'</b> ('+ev.ctxLabel+'): '+ev.msg;
}

function _warnDrugToast(nombre){
  var ev=evaluarReglaDroga(nombre);
  if(!ev||ev.nivel==='preferir')return true;
  if(ev.nivel==='evitar'){
    toast('⚠ EVITAR: '+nombre+' — '+ev.msg);
    return true;
  }
  toast('⚠ '+nombre+': '+ev.msg);
  return true;
}

function filtrarSugerenciaDroga(nombre){
  var ev=evaluarReglaDroga(nombre);
  if(!ev||ev.nivel==='preferir')return {ok:true,label:nombre,ev:null};
  if(ev.nivel==='evitar')return {ok:true,label:'⚠ EVITAR: '+nombre,ev:ev};
  return {ok:true,label:'⚠ '+nombre,ev:ev};
}
