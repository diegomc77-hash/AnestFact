// === MÉTODOS ANESTÉSICOS SMART ===
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
  tiva:function(){return 'TIVA (Anestesia Total Intravenosa). Infusi\u00f3n continua de agentes anest\u00e9sicos EV.';},
  peridural:function(){return 'Anestesia peridural. T\u00e9cnica as\u00e9ptica estricta. Cat\u00e9ter peridural.';},
  localasistida:function(){return 'Anestesia local asistida / MAC (Monitoreo Anestesiologico Controlado).';},
  sedacion:function(){
    var via=document.getElementById('fj-via')?document.getElementById('fj-via').value:'';
    if(via==='Ventilación espontánea al aire ambiente'){
      return 'Se realiza procedimiento bajo Sedación Consciente superficial. Paciente en ventilación espontánea al aire ambiente, conservando reflejos de protección de la vía aérea y estabilidad hemodinámica.';
    }
    var sop=via||'puntas nasales';
    return 'Se realiza procedimiento bajo Sedación Consciente profunda. Paciente en ventilación espontánea, con soporte de oxígeno suplementario a través de '+sop+', manteniendo una adecuada dinámica respiratoria y estabilidad hemodinámica sin incidentes.';
  },
  bloqueo:function(){
    var ag=document.getElementById('fj-tec-aguja')?document.getElementById('fj-tec-aguja').value:'';
    var cal=document.getElementById('fj-tec-calibre')?document.getElementById('fj-tec-calibre').value:'';
    var det=(ag&&cal)?ag+' '+cal+'.':(ag?ag+'.':'');
    return 'Bloqueo nervioso periférico.'+(det?' '+det:'');
  }
};
// ═══════════════════════════════════════════════════
// DROGAS SUGERIDAS POR TÉCNICA
// ═══════════════════════════════════════════════════
function autoPremedRegional(){
  // Preselecciona drogas regionales en los selects de premed-selects
  // y las agrega a fj-premed si no están ya
  var fp=document.getElementById('fj-premed');
  if(!fp)return;
  var presets=[
    {nombre:'Ketorolac',txt:'Ketorolac 30 mg EV'},
    {nombre:'Dexametasona',txt:'Dexametasona 8 mg EV'},
    {nombre:'Metoclopramida',txt:'Metoclopramida 10 mg EV'}
  ];
  var actual=fp.value||'';
  presets.forEach(function(p){
    if(actual.toLowerCase().indexOf(p.nombre.toLowerCase())<0){
      fp.value=(actual?actual+'. ':'')+p.txt;
      actual=fp.value;
    }
  });
}

function _sugerirDrogasPorTec(tec){
  var t=(tec||'').toLowerCase();
  // Leer subtipo y normalizar quitando tildes
  var sub=(document.getElementById('fj-tec-subtipo')?document.getElementById('fj-tec-subtipo').value||'':'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  var tn=t.normalize('NFD').replace(/[̀-ͯ]/g,'');
  var v=sub||tn;
  if(/tiva/.test(v))sugerirDrogas('tiva');
  else if(/raqui/.test(v)){sugerirDrogas('raquidea');setTimeout(autoPremedRegional,100);}
  else if(/peridural|epidural/.test(v)){sugerirDrogas('peridural');setTimeout(autoPremedRegional,100);}
  else if(/neuroaxial/.test(v)&&!/raqui|peridural/.test(v)){sugerirDrogas('raquidea');setTimeout(autoPremedRegional,100);}
  else if(/general/.test(v)&&!/raqui|peridural|neuroaxial/.test(v))sugerirDrogas('general');
  else if(/sedac|cam|local/.test(v))sugerirDrogas('sedacion');
  else if(/bloqueo|miembro_sup|miembro_inf|tronco/.test(v)){sugerirDrogas('bloqueo');setTimeout(autoPremedRegional,100);}
  else sugerirDrogas('');
}

function sugerirDrogas(tipo){
  var cont=document.getElementById('drogas-sugeridas');
  if(!cont)return;
  var peso=parseFloat((S.cur&&S.cur.peso)||(document.getElementById('f-peso')?document.getElementById('f-peso').value:0)||70);
  function rnd(n){return parseFloat(n.toFixed(1));}

  // Definir grupos segun tecnica
  var grupos=[];
  if(tipo==='general'||tipo==='tiva'){
    grupos.push({id:'sg-ind',t:'Inductores',items:[
      {n:'Propofol',d:rnd(2*peso),u:'mg EV'},
      {n:'Etomidato',d:rnd(0.25*peso),u:'mg EV'},
      {n:'Ketamina',d:rnd(1.5*peso),u:'mg EV'},
      {n:'Midazolam',d:rnd(0.05*peso),u:'mg EV'}
    ]});
    if(tipo==='general'){
      grupos.push({id:'sg-rel',t:'Relajantes',items:[
        {n:'Rocuronio',d:rnd(0.9*peso),u:'mg EV'},
        {n:'Succinilcolina',d:rnd(1.25*peso),u:'mg EV'},
        {n:'Atracurio',d:rnd(0.45*peso),u:'mg EV'},
        {n:'Vecuronio',d:rnd(0.1*peso),u:'mg EV'},
        {n:'Pancuronio',d:rnd(0.1*peso),u:'mg EV'}
      ]});
    }
    grupos.push({id:'sg-anal',t:'Analgésicos',items:[
      {n:'Fentanilo',d:rnd(3*peso),u:'mcg EV'},
      {n:'Remifentanilo',d:rnd(1*peso),u:'mcg EV'}
    ]});
    if(tipo==='general'){
      grupos.push({id:'sg-mant',t:'Mantenimiento',items:[
        {n:'Sevoflurano',d:'2',u:'% CAM'},
        {n:'Isoflurano',d:'1.5',u:'% CAM'},
        {n:'Remifentanilo',d:'0.2',u:'mcg/kg/min inf'},
        {n:'Fentanilo',d:rnd(1.5*peso),u:'mcg EV bolo'}
      ]});
    } else {
      grupos.push({id:'sg-mant',t:'Mantenimiento TIVA',items:[
        {n:'Propofol',d:'8',u:'mg/kg/h inf'},
        {n:'Remifentanilo',d:'0.2',u:'mcg/kg/min inf'},
        {n:'Dexmedetomidina',d:'0.5',u:'mcg/kg/h inf'}
      ]});
    }
  } else if(tipo==='raquidea'){
    grupos.push({t:'Anestésico intratecal',items:[
      {n:'Bupivacaína hiperbárica 0.5%',d:'12.5',u:'mg intratecal'},
      {n:'Ropivacaína 0.75%',d:'15',u:'mg intratecal'},
      {n:'Lidocaína 2%',d:rnd(4*peso),u:'mg intratecal'}
    ]});
    grupos.push({t:'Coadyuvantes intratecales',items:[
      {n:'Fentanilo',d:'25',u:'mcg intratecal'},
      {n:'Morfina s/conservantes',d:'200',u:'mcg intratecal'},
      {n:'Dexmedetomidina',d:'10',u:'mcg intratecal'},
      {n:'Clonidina',d:'15',u:'mcg intratecal'},
      {n:'Adrenalina 1:200.000',d:'0.1',u:'ml intratecal'}
    ]});
  } else if(tipo==='peridural'){
    grupos.push({t:'Anestésico peridural',items:[
      {n:'Ropivacaína 0.5%',d:'20',u:'ml peridural'},
      {n:'Ropivacaína 0.75%',d:'15',u:'ml peridural'},
      {n:'Bupivacaína 0.5%',d:'20',u:'ml peridural'},
      {n:'Lidocaína 2%',d:'15',u:'ml peridural'},
      {n:'Mepivacaína 2%',d:'15',u:'ml peridural'}
    ]});
    grupos.push({t:'Coadyuvantes peridurales',items:[
      {n:'Fentanilo',d:'100',u:'mcg peridural'},
      {n:'Morfina s/conservantes',d:'2',u:'mg peridural'},
      {n:'Dexmedetomidina',d:'20',u:'mcg peridural'},
      {n:'Clonidina',d:'30',u:'mcg peridural'},
      {n:'Adrenalina 1:200.000',d:'5',u:'mcg/ml peridural'}
    ]});
  } else if(tipo==='bloqueo'){
    grupos.push({t:'Anestésico local',items:[
      {n:'Ropivacaína 0.5%',d:rnd(3*peso),u:'mg'},
      {n:'Ropivacaína 0.75%',d:rnd(3*peso),u:'mg'},
      {n:'Bupivacaína 0.25%',d:rnd(2*peso),u:'mg'},
      {n:'Bupivacaína 0.5%',d:rnd(2*peso),u:'mg'},
      {n:'Lidocaína 1%',d:rnd(4*peso),u:'mg'},
      {n:'Lidocaína 2%',d:rnd(4*peso),u:'mg'},
      {n:'Mepivacaína 1%',d:rnd(5*peso),u:'mg'},
      {n:'Mepivacaína 2%',d:rnd(5*peso),u:'mg'}
    ]});
    grupos.push({t:'Coadyuvantes',items:[
      {n:'Fentanilo',d:'25',u:'mcg'},
      {n:'Dexmedetomidina',d:rnd(1*peso),u:'mcg'},
      {n:'Clonidina',d:rnd(1*peso),u:'mcg'},
      {n:'Adrenalina 1:200.000',d:'5',u:'mcg/ml'}
    ]});
  } else if(tipo==='sedacion'){
    grupos.push({id:'sg-sed',t:'Sedación',items:[
      {n:'Propofol',d:rnd(1*peso),u:'mg EV'},
      {n:'Midazolam',d:rnd(0.02*peso),u:'mg EV'},
      {n:'Fentanilo',d:rnd(1.5*peso),u:'mcg EV'},
      {n:'Ketamina',d:rnd(0.5*peso),u:'mg EV'}
    ]});
  }

  // Inotrópicos siempre
  grupos.push({id:'sg-inot',t:'Inotrópicos / Emergencia',items:[
    {n:'Efedrina',d:rnd(0.1*peso),u:'mg EV'},
    {n:'Noradrenalina',d:'4',u:'mcg/min inf'},
    {n:'Adrenalina',d:'0.1',u:'mcg/kg/min inf'},
    {n:'Atropina',d:rnd(0.015*peso),u:'mg EV'},
    {n:'Dopamina',d:'5',u:'mcg/kg/min inf'}
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
      else if(fil.ev&&fil.ev.nivel==='precaucion')op.style.color='#ffb400';
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

    // Al cambiar select -> agregar automáticamente
    sel.onchange=function(){
      if(!sel.value){inp.value='';inp.readOnly=true;btn.disabled=true;return;}
      var parts=sel.value.split('|');
      inp.value=parts[1]+' '+parts[2];
      inp.readOnly=false;
      btn.disabled=false;
      setTimeout(function(){btn.click();},10); // Auto-agregar sin presionar +
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
  S.cur.foja.drogas.push({n:nombre,d:d,v:v,grupo:grupo||''});
  renderDrogas();
  if(typeof _warnDrugToast==='function')_warnDrugToast(nombre);
  toast(nombre+' agregado');
}

