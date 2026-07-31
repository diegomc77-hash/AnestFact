function _premedRnd(n,dec){return parseFloat(n.toFixed(dec));}

/** Antibiótico: independiente de premed/peso (usa 70 kg solo para vancomicina si falta peso). */
function calcAtbProfilaxis(){
  var pesoEl=document.getElementById('f-peso');
  var peso=parseFloat((S.cur&&S.cur.peso)||(pesoEl?pesoEl.value:0)||0);
  if(!peso||peso<=0)peso=70;
  var irc=typeof _antecedentes!=='undefined'&&_antecedentes.some(function(a){return a.indexOf('IRC')>=0;});
  var diag=((S.cur&&S.cur.diag)||'').toLowerCase();
  var ciru=((S.cur&&S.cur.ciru)||'').toLowerCase();
  var diagCiru=diag+' '+ciru;
  var atbSuger=''; var atbAlerta='';
  var dCef=peso>=120?'3g':'2g';
  var esColorectal=/colon|recto|colect|apend|sigma|hartmann|miles|colosto|ileosto/i.test(diagCiru);
  var esGastro=/gástric|gastro|esofag|biliar|colecist|hígado|páncreas|hepátic/i.test(diagCiru);
  var esGineco=/cesar|histerec|miomect|oofor|trompa|vagina|vulva|perine|ginec|obstetr/i.test(diagCiru);
  var esTraumat=/ortop|fractur|prótesis|rodilla|cadera|columna|artroscop|osteosint/i.test(diagCiru);
  var esUro=/próstat|vejiga|uréter|riñon|nefr|urol|cistect|litotric/i.test(diagCiru);

  if(esColorectal){
    if(irc){
      atbSuger='Ertapenem 500mg EV + Metronidazol 500mg EV';
      atbAlerta='Esquema ajustado automáticamente por IRC/diálisis.';
    }else{
      atbSuger='Cefazolina 2g EV + Metronidazol 500mg EV';
    }
  }else if(esGineco){
    if(irc){
      atbSuger='Vancomicina '+_premedRnd(15*peso,0)+'mg EV';
      atbAlerta='Esquema ajustado automáticamente por IRC/diálisis.';
    }else{
      atbSuger='Cefazolina '+dCef+' EV';
      if(/cesar/i.test(diagCiru)) atbSuger+=' — ⚠️ Administrar ANTES de la incisión de piel';
    }
  }else if(esTraumat){
    if(irc){
      atbSuger='Vancomicina '+_premedRnd(15*peso,0)+'mg EV';
      atbAlerta='Esquema ajustado automáticamente por IRC/diálisis. Monitorear niveles si cirugía prolongada.';
    }else{
      atbSuger='Cefazolina '+dCef+' EV';
    }
  }else if(esUro){
    if(irc){
      atbSuger='Cefazolina 2g EV';
      atbAlerta='IRC/diálisis: evitar aminoglucósidos. Cefazolina con intervalo según diálisis o Ciprofloxacino 250mg EV si indicado.';
    }else{
      atbSuger='Cefazolina 2g EV';
    }
  }else if(esGastro){
    if(irc){
      atbSuger='Vancomicina '+_premedRnd(15*peso,0)+'mg EV';
      atbAlerta='Esquema ajustado automáticamente por IRC/diálisis (evitar aminoglucósidos).';
    }else{
      atbSuger='Cefazolina '+dCef+' EV';
    }
  }else{
    if(irc){
      atbSuger='Vancomicina '+_premedRnd(15*peso,0)+'mg EV';
      atbAlerta='Esquema ajustado automáticamente por IRC/diálisis.';
    }else{
      atbSuger='Cefazolina '+dCef+' EV';
    }
  }

  var atbEl=document.getElementById('fj-atb');
  if(atbEl)atbEl.value=atbSuger;
  var aa=document.getElementById('atb-alert');
  if(aa){
    if(atbAlerta){
      aa.style.display='block';
      aa.style.background='rgba(56,139,253,.12)';
      aa.style.borderColor='var(--blue)';
      aa.style.color='var(--blue)';
      aa.textContent='ℹ️ '+atbAlerta;
    }else{aa.style.display='none';}
  }
  if(typeof renderAlertasClinicas==='function')renderAlertasClinicas();
}

function calcPremed(silencioso){
  calcAtbProfilaxis();
  var pesoEl=document.getElementById('f-peso');
  var peso=parseFloat((S.cur&&S.cur.peso)||(pesoEl?pesoEl.value:0)||0);
  var tecTipo=(document.getElementById('fj-tec-tipo')?document.getElementById('fj-tec-tipo').value:'').toLowerCase();
  var reflujo=typeof _antecedentes!=='undefined'&&_antecedentes.some(function(a){return /reflujo|erge|gerd/i.test(a);});

  if(!peso||peso<=0){if(!silencioso)alert('Ingresá el peso del paciente primero (premed). El ATB ya se sugirió.');return;}

  var esGeneral=tecTipo==='general';
  var esRegional=tecTipo==='neuroaxial'||tecTipo==='bloqueo'||tecTipo==='local';
  var esSedacion=/sedaci/i.test(tecTipo);
  var rnd=_premedRnd;
  var midazFull=rnd(0.03*peso,2);
  var midazLow=rnd(0.02*peso,2);
  var atro=rnd(0.015*peso,2);
  var rani=Math.min(rnd(1*peso,0),300);
  var ondan=Math.min(rnd(0.1*peso,2),8);
  var dexameta=8;
  var lineas=[];
  var alerta='';
  var extras=[];

  if(esGeneral){
    lineas.push('Midazolam '+midazFull+'mg EV');
    lineas.push('Ranitidina '+rani+'mg EV');
    extras.push('Atropina '+atro+'mg EV');
    lineas.push('Ondansetrón '+ondan+'mg EV');
    lineas.push('Dexametasona '+dexameta+'mg EV');
    if(rani===50)alerta+='Ranitidina limitada a techo 50mg. ';
    if(ondan===4)alerta+='Ondansetrón limitado a techo 4mg. ';
    extras.push('Metoclopramida '+Math.min(rnd(0.15*peso,1),10)+'mg EV');
    extras.push('Ketorolac 30mg EV');
    extras.push('Diclofenac 75mg EV');
  }else if(esRegional){
    lineas.push('Midazolam '+midazLow+'mg EV (dosis reducida – regional)');
    lineas.push('Ketorolac 30mg EV');
    lineas.push('Dexametasona 8mg EV');
    lineas.push('Metoclopramida 10mg EV');
    if(reflujo)lineas.push('Ranitidina '+rani+'mg EV');
    extras.push('Atropina '+atro+'mg EV');
    extras.push('Ondansetrón '+ondan+'mg EV');
  }else if(esSedacion){
    lineas.push('Ondansetrón '+ondan+'mg EV');
    lineas.push('Sedación: a demanda intraoperatoria');
    if(ondan===4)alerta+='Ondansetrón limitado a techo 4mg. ';
    extras.push('Midazolam '+midazLow+'mg EV');
    extras.push('Dexametasona 8mg EV');
  }else{
    lineas.push('Midazolam '+midazFull+'mg EV');
    lineas.push('Ondansetrón '+ondan+'mg EV');
    lineas.push('Ranitidina '+rani+'mg EV');
    extras.push('Atropina '+atro+'mg EV');
    extras.push('Dexametasona 8mg EV');
  }

  var fp=document.getElementById('fj-premed');
  if(fp)fp.value=lineas.join('. ');
  var sc=document.getElementById('premed-smart-chips');
  if(sc){
    var etiq='<span style="font-size:11px;color:var(--text3);margin-right:4px">Agregar:</span>';
    sc.innerHTML=etiq+extras.map(function(c){
      return '<span class="chip" style="background:rgba(29,185,84,.12);border:1px solid var(--green);color:var(--green);cursor:pointer" onclick="addChipTo(\'fj-premed\',\''+c.replace(/'/g,"\\'")+'\')">'+(c.length>36?c.slice(0,34)+'…':c)+'</span>';
    }).join('');
  }
  var pa=document.getElementById('premed-alert');
  if(pa){
    if(alerta){pa.style.display='block';pa.textContent='⚠️ '+alerta.trim();}
    else{pa.style.display='none';}
  }
}
// ═══════════════════════════════════════════════════
var RECUP_CHIPS_BASE=['Extubado/a SpO₂ 99%','Despierto/a conforme','Hemodinámicamente estable','Ketorolac 30mg EV','Ondansetrón 8mg EV','Paracetamol 1g EV','Morfina 2mg EV','Tramadol 100mg EV','Atropina 0.5mg EV'];
var RECUP_DRUGS=RECUP_CHIPS_BASE;
