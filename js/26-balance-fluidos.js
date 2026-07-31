/** Alertas de balance hídrico / hemoterapia (Aeronáutico y general). */
var _obsHemoLastSuger='';
var _obsHemoManual=false;

function resetObsHemoSuger(val){
  _obsHemoLastSuger=String(val||'').trim();
  _obsHemoManual=!!_obsHemoLastSuger;
}

function _balNormalizarSueroTipo(val){
  var v=String(val||'').trim();
  if(v==='Soluci\u00f3n fisiol\u00f3gica 0.9%')return 'Soluci\u00f3n fisiol\u00f3gica 0.9% (NaCl)';
  return v;
}

function _balSueroTipo(){
  var el=document.getElementById('fj-suero-tipo');
  return el?String(el.value||'').trim():'';
}

function balSueroTexto(){
  var volRaw=document.getElementById('fj-suero')?document.getElementById('fj-suero').value:'';
  var vol=String(volRaw||'').trim();
  if(!vol)return '';
  var tipo=_balSueroTipo();
  return tipo?(tipo+' '+vol):vol;
}

function _balFmtVol(raw,ml){
  if(!raw||!String(raw).trim())return ml?ml+' ml':'';
  return String(raw).trim();
}

function sugerirObsHemo(silencioso){
  var oh=document.getElementById('fj-obs-hemo');
  if(!oh)return;
  var sueroRaw=document.getElementById('fj-suero')?document.getElementById('fj-suero').value:'';
  var sangreRaw=document.getElementById('fj-sangre')?document.getElementById('fj-sangre').value:'';
  var plasmaRaw=document.getElementById('fj-plasma')?document.getElementById('fj-plasma').value:'';
  var otroRaw=document.getElementById('fj-otro')?document.getElementById('fj-otro').value:'';
  var suero=_balParseMl(sueroRaw);
  var sangre=_balParseMl(sangreRaw);
  var plasma=_balParseMl(plasmaRaw);
  var sangrado=_balParseMl(document.getElementById('fj-sangrado')?document.getElementById('fj-sangrado').value:'');
  var cardio=_balEsCardio();
  var hipo=_balHipotensionDetectada();
  var partes=[];

  if(sangre>0){
    var uMatch=String(sangreRaw).match(/(\d+)\s*unidad/i);
    if(uMatch)partes.push(uMatch[1]+' CH por sangrado intraoperatorio / anemia');
    else partes.push('Glóbulos rojos '+_balFmtVol(sangreRaw,sangre)+' por sangrado intraoperatorio');
  }
  if(plasma>0){
    var puMatch=String(plasmaRaw).match(/(\d+)\s*unidad/i);
    if(puMatch)partes.push(puMatch[1]+' PFC por coagulopatía / sangrado');
    else partes.push('Plasma '+_balFmtVol(plasmaRaw,plasma)+' por sangrado o coagulopatía');
  }
  if(suero>0){
    var stxt=balSueroTexto()||_balFmtVol(sueroRaw,suero);
    if(!_balSueroTipo()&&!silencioso&&typeof toast==='function')toast('Eleg\u00ed tipo de suero (SF, Dextrosa 5%, etc.)');
    if(cardio)partes.push(stxt+' titulado (cardiopat\u00eda — evitar sobrecarga)');
    else if(hipo)partes.push(stxt+' por hipotensi\u00f3n intraoperatoria');
    else if(sangrado>=500)partes.push(stxt+' por sangrado estimado '+sangrado+' ml');
    else partes.push(stxt);
  }else if(sangrado>=500&&!sangre){
    partes.push('Sangrado estimado '+sangrado+' ml — reposici\u00f3n vol\u00e9mica en evaluaci\u00f3n');
  }
  if(otroRaw&&String(otroRaw).trim())partes.push(String(otroRaw).trim());
  if(hipo&&suero===0&&sangrado<500&&!sangre)partes.push('Hipotensi\u00f3n — considerar bolus 250–500 ml SF 0.9% o Ringer lactato');

  if(!partes.length)return;
  var sug=partes.join('. ').replace(/\.\s*\./g,'.')+(partes.length?'.':'');
  var cur=String(oh.value||'').trim();
  if(cur&&!_obsHemoManual&&cur!==_obsHemoLastSuger)return;
  if(!cur||cur===_obsHemoLastSuger||!_obsHemoManual){
    oh.value=sug;
    _obsHemoLastSuger=sug;
    _obsHemoManual=false;
    if(!silencioso&&typeof toast==='function')toast('Observaciones hemoterapia sugeridas ✓');
  }
}

function _balParseMl(s){
  if(!s)return 0;
  var t=String(s).trim();
  var u=t.match(/(\d+)\s*unidad/i);
  if(u)return parseInt(u[1],10)*275;
  var m=t.match(/(\d+)/);
  return m?parseInt(m[1],10):0;
}

function _balEsCardio(){
  if(typeof getContextosActivos==='function'){
    var ctx=getContextosActivos();
    if(ctx.indexOf('ic_cardio')>=0)return true;
  }
  if(typeof _antecedentes!=='undefined'){
    return _antecedentes.some(function(a){
      return a==='IC'||a==='Coronario'||/cardio|coronario/i.test(a);
    });
  }
  return false;
}

function _balHipotensionDetectada(){
  var sistEl=document.getElementById('aero-sist');
  var diastEl=document.getElementById('aero-diast');
  if(sistEl&&sistEl.value){
    var s=parseInt(sistEl.value,10);
    if(!isNaN(s)&&s>0&&s<90)return true;
  }
  if(diastEl&&diastEl.value){
    var d=parseInt(diastEl.value,10);
    if(!isNaN(d)&&d>0&&d<50)return true;
  }
  if(typeof VG!=='undefined'&&VG.cells){
    var low=false;
    Object.keys(VG.cells).forEach(function(k){
      var c=VG.cells[k];
      if(!c||c.param!=='ta')return;
      var v=parseInt(c.val,10);
      if(!isNaN(v)&&v>0&&v<90)low=true;
    });
    if(low)return true;
  }
  return false;
}

function renderBalanceAlertas(){
  var box=document.getElementById('balance-alertas');
  if(!box)return;
  var suero=_balParseMl(document.getElementById('fj-suero')?document.getElementById('fj-suero').value:'');
  var sangre=_balParseMl(document.getElementById('fj-sangre')?document.getElementById('fj-sangre').value:'');
  var plasma=_balParseMl(document.getElementById('fj-plasma')?document.getElementById('fj-plasma').value:'');
  var sangrado=_balParseMl(document.getElementById('fj-sangrado')?document.getElementById('fj-sangrado').value:'');
  var orina=_balParseMl(document.getElementById('fj-orina')?document.getElementById('fj-orina').value:'');
  var cardio=_balEsCardio();
  var hipo=_balHipotensionDetectada();
  var msgs=[];

  if(cardio){
    if(suero>=1500){
      msgs.push({n:'warn',t:'Cardiopatía: '+suero+' ml de '+(_balSueroTipo()||'suero')+' es agresivo. Preferir titular 250–500 ml y reevaluar PAM/diuresis.'});
    }else if(suero>=800){
      msgs.push({n:'info',t:'Cardiopatía: moderar carga de volumen. Considerar vasopresor antes de fluidos en exceso.'});
    }else if(suero===0&&(sangrado>=300||hipo)){
      msgs.push({n:'info',t:'Cardiopatía con pérdida/hipotensión: bolus cauteloso 250 ml SF 0.9% + noradrenalina/fenilefrina si no responde.'});
    }else if(suero===0){
      msgs.push({n:'info',t:'Cardiopatía: evitar sobrecarga. Mantener euvolemia restrictiva salvo sangrado activo.'});
    }
  }

  if(sangrado>=1000){
    msgs.push({n:'warn',t:'Sangrado '+sangrado+' ml: evaluar SF 0.9% / Ringer lactato 500–1000 ml + hemocomponentes según protocolo.'});
  }else if(sangrado>=500){
    msgs.push({n:'info',t:'Sangrado '+sangrado+' ml: considerar Ringer lactato o SF 0.9% 500 ml y control de PAM.'});
  }

  if(hipo){
    msgs.push({n:'warn',t:'Hipotensión en signos vitales: sugerencia bolus 250–500 ml SF 0.9% o Ringer lactato y revisar causa (anestesia/sangrado/vasoplejia).'});
  }

  if(suero>0&&!_balSueroTipo()){
    msgs.push({n:'info',t:'Elegí el tipo de suero (SF 0.9%, Dextrosa 5%, Ringer lactato…) para que figure bien en la foja y GECLISA.'});
  }

  if(suero>0&&orina>0&&orina<suero*0.1&&sangrado<300){
    msgs.push({n:'info',t:'Diuresis baja vs ingreso: valorar respuesta a volumen o soporte vasopresor.'});
  }

  if(sangre>0){
    var oh=document.getElementById('fj-obs-hemo');
    if(!oh||!String(oh.value||'').trim()){
      msgs.push({n:'info',t:'Documentá en observaciones de hemoterapia el motivo/indicación de la transfusión.'});
    }
  }

  if(!msgs.length){
    box.style.display='none';
    box.innerHTML='';
    return;
  }
  box.style.display='block';
  box.innerHTML=msgs.map(function(m){
    var col=m.n==='warn'?'#ffb400':'var(--blue)';
    var bg=m.n==='warn'?'rgba(255,180,0,.1)':'rgba(56,139,253,.1)';
    return '<div style="padding:6px 10px;margin-bottom:6px;border-radius:8px;font-size:12px;border:1px solid '+col+';background:'+bg+';color:'+col+'">'+(m.n==='warn'?'⚠️ ':'ℹ️ ')+m.t+'</div>';
  }).join('');
}

function _balOnFluidChange(){
  sugerirObsHemo(true);
  renderBalanceAlertas();
}

function initBalanceFluidosUI(){
  ['fj-suero-tipo','fj-suero','fj-sangre','fj-plasma','fj-sangrado','fj-orina','fj-otro','aero-sist','aero-diast'].forEach(function(id){
    var el=document.getElementById(id);
    if(el&&!el.getAttribute('data-bal-bound')){
      el.addEventListener('change',_balOnFluidChange);
      el.addEventListener('input',_balOnFluidChange);
      el.setAttribute('data-bal-bound','1');
    }
  });
  var oh=document.getElementById('fj-obs-hemo');
  if(oh&&!oh.getAttribute('data-hemo-bound')){
    oh.addEventListener('input',function(){
      var v=String(oh.value||'').trim();
      _obsHemoManual=!!v&&v!==_obsHemoLastSuger;
      renderBalanceAlertas();
    });
    oh.setAttribute('data-hemo-bound','1');
  }
  sugerirObsHemo(true);
  renderBalanceAlertas();
}
