function acSearch(list,q,keyFn){
  if(!q||q.length<1)return[];
  var ql=q.toLowerCase();
  return list.filter(function(x){return keyFn(x).toLowerCase().indexOf(ql)>=0;}).slice(0,10);
}
function renderAC(listId,items,labelFn,subFn,onSelect){
  var el=document.getElementById(listId);if(!el)return;
  if(!items.length){el.style.display='none';return;}
  var cap=items.slice();
  el.innerHTML=cap.map(function(item,i){
    return '<div class="ac-item" data-i="'+i+'" onmousedown="event.preventDefault()">'
      +labelFn(item)+(subFn?'<small>'+subFn(item)+'</small>':'')+'</div>';
  }).join('');
  el.onclick=function(e){
    var t=e.target;while(t&&t!==el){if(t.className&&t.className.indexOf('ac-item')>=0)break;t=t.parentNode;}
    if(!t||!t.className||t.className.indexOf('ac-item')<0)return;
    var i2=parseInt(t.getAttribute('data-i'));
    if(!isNaN(i2))onSelect(i2,cap);
  };
  el.style.display='block';
}
function acObraSocial(fieldId,listId){
  var q=document.getElementById(fieldId).value;
  var items=OBRAS_SOCIALES.filter(function(x){return x.toLowerCase().indexOf(q.toLowerCase())>=0;}).slice(0,10);
  renderAC(listId,items,function(x){return x;},null,function(i,cap){document.getElementById(fieldId).value=cap[i]||'';closeAllAC();});
}
function diagParts(val){return(val||'').split(/\s*[.;+/]\s*/);}
function diagSearchTail(val){var parts=diagParts(val);return(parts[parts.length-1]||'').trim();}
function appendDiagSelection(fieldId,chosen){
  var el=document.getElementById(fieldId);if(!el)return;
  var parts=diagParts(el.value);parts.pop();
  var prefix=parts.filter(function(p){return p&&p.trim();}).join('. ');
  el.value=(prefix?prefix+'. ':'')+chosen;
}
function acCirugia(fieldId,listId){
  var q=diagSearchTail(document.getElementById(fieldId).value);
  if(q.length<2){document.getElementById(listId).style.display='none';return;}
  var items=CIRUGIAS.filter(function(x){return x.toLowerCase().indexOf(q.toLowerCase())>=0;}).slice(0,10);
  renderAC(listId,items,function(x){return x;},null,function(i,cap){
    var chosen=cap[i]||'';
    appendDiagSelection(fieldId,chosen);
    var match=NOM.find(function(n){return n.desc.toLowerCase().indexOf(chosen.toLowerCase().slice(0,8))>=0;});
    if(match&&S.cur&&!S.cur.pracs.some(function(p){return p.cod===match.cod;})){
      toast('💡 Sugerida: '+match.cod+' '+match.desc);
    }
    if(typeof sugerirPosicion==='function')sugerirPosicion();
    closeAllAC();
  });
}

// Drug field autocomplete
function acDrugField(fieldId,listId){
  var q=document.getElementById(fieldId).value;
  if(!q||q.length<2){document.getElementById(listId).style.display='none';return;}
  var hits=DRUGS.filter(function(d){return d.n.toLowerCase().indexOf(q.toLowerCase())>=0||d.cat.toLowerCase().indexOf(q.toLowerCase())>=0;}).slice(0,8);
  renderAC(listId,hits,function(d){return d.n;},function(d){return d.cat;},function(i,cap){
    var d=cap[i];if(!d)return;
    var peso=parseFloat((S.cur&&S.cur.peso)||0);
    var doseStr=d.doses[0]||'';
    if(d.mgKg&&peso>0){var calc=(d.mgKg*peso).toFixed(0);doseStr=calc+'mg';}
    document.getElementById(fieldId).value=d.n+' '+doseStr+' '+(d.via||'EV');
    closeAllAC();
  });
}

// Drug row autocomplete
function acDrugRow(i,q){
  if(!q||q.length<2){closeAllAC();return;}
  var hits=DRUGS.filter(function(d){return d.n.toLowerCase().indexOf(q.toLowerCase())>=0||d.cat.toLowerCase().indexOf(q.toLowerCase())>=0;}).slice(0,8);
  renderAC('ac-dr-'+i,hits,function(d){return d.n;},function(d){return d.cat;},function(idx,cap){
    var hits2=DRUGS.filter(function(d){return d.n.toLowerCase().indexOf((document.getElementById('din-'+i)||{value:''}).value.toLowerCase())>=0;}).slice(0,8);
    var drug=hits2[idx];if(!drug)return;
    if(S.cur&&S.cur.foja&&S.cur.foja.drogas&&S.cur.foja.drogas[i]){
      S.cur.foja.drogas[i].n=drug.n;
      // Calculate dose by weight
      var peso=parseFloat((S.cur&&S.cur.peso)||0);
      var doseStr=drug.doses[0]||'';
      if(drug.mgKg&&peso>0){doseStr=(drug.mgKg*peso).toFixed(0)+'mg';}
      S.cur.foja.drogas[i].d=doseStr;
      S.cur.foja.drogas[i].v=drug.via||'EV';
    }
    renderDrogas();closeAllAC();
    if(typeof showReglaDroga==='function')showReglaDroga(drug.n);
    else showDoseInfo(drug,parseFloat((S.cur&&S.cur.peso)||0));
  });
}
function acDoseRow(i,q){
  if(!q)return;
  var drugName=(S.cur&&S.cur.foja&&S.cur.foja.drogas&&S.cur.foja.drogas[i]&&S.cur.foja.drogas[i].n)||'';
  var drug=DRUGS.find(function(d){return d.n.toLowerCase()===drugName.toLowerCase();});
  if(!drug)return;
  var hits=drug.doses.filter(function(d){return d.toLowerCase().indexOf(q.toLowerCase())>=0;}).slice(0,6);
  renderAC('ac-ds-'+i,hits,function(x){return x;},null,function(idx2){
    var drug2=DRUGS.find(function(d){return d.n.toLowerCase()===((S.cur&&S.cur.foja&&S.cur.foja.drogas&&S.cur.foja.drogas[i]&&S.cur.foja.drogas[i].n)||'').toLowerCase();});
    var hits2=(drug2&&drug2.doses.filter(function(d){return d.toLowerCase().indexOf((document.getElementById('dds-'+i)||{value:''}).value.toLowerCase())>=0;}))||[];
    var chosen=hits2[idx2]||'';
    if(S.cur.foja.drogas[i])S.cur.foja.drogas[i].d=chosen;
    var inp=document.getElementById('dds-'+i);if(inp)inp.value=chosen;
    closeAllAC();
  });
}
function showDoseInfo(drug,peso){
  var bar=document.getElementById('dose-info-bar');if(!bar)return;
  if(typeof showReglaDroga==='function'&&drug&&drug.n){
    var ev=typeof evaluarReglaDroga==='function'?evaluarReglaDroga(drug.n):null;
    if(ev&&ev.nivel!=='preferir'){showReglaDroga(drug.n);return;}
  }
  bar.style.color='var(--blue)';
  bar.style.background='rgba(56,139,253,.1)';
  bar.style.borderColor='rgba(56,139,253,.4)';
  if(!drug.mgKg||!peso){bar.style.display='none';return;}
  var calc=(drug.mgKg*peso).toFixed(1);
  var rango=drug.rangoMgKg?((drug.rangoMgKg[0]*peso).toFixed(0)+' – '+(drug.rangoMgKg[1]*peso).toFixed(0)+' mg'):'';
  bar.style.display='block';
  bar.textContent='💊 '+drug.n+': dosis '+drug.mgKg+' mg/kg × '+peso+' kg = '+calc+' mg'+(rango?' (rango: '+rango+')':'');
}
function onPesoEdadChange(){
  // Update dose hint bar if visible
  var bar=document.getElementById('dose-info-bar');
  if(bar&&bar.style.display!=='none')bar.style.display='none';
  if(typeof renderTivaCalcPanel==='function'){
    var p=document.getElementById('tiva-calc-panel');
    if(p&&p.style.display!=='none')renderTivaResults();
  }
}

// Recovery autocomplete
function acRecup(val){
  if(typeof val!=='string')val=document.getElementById('fj-recup').value;
  var q=val.split(/[,.\n]/).pop().trim().toLowerCase();
  if(q.length<2){document.getElementById('ac-recup').style.display='none';return;}
  var hits=RECUP_DRUGS.filter(function(r){return r.toLowerCase().indexOf(q)>=0;});
  var dhits=DRUGS.filter(function(d){return d.n.toLowerCase().indexOf(q)>=0;}).map(function(d){return d.n+' EV';});
  hits=hits.concat(dhits).slice(0,8);
  renderAC('ac-recup',hits,function(x){return x;},null,function(idx,cap){var chosen=cap[idx]||'';var cur=document.getElementById('fj-recup').value;var parts=cur.split(/[,.]/);parts.pop();document.getElementById('fj-recup').value=(parts.length?parts.join('. ')+'. ':'')+chosen;closeAllAC();
  });
}

