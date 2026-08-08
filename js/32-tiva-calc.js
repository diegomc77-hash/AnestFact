// Cálculo TIVA — usado por los desplegables (inducción vs mantenimiento)
var TIVA_TRAMOS=[
  {coef:10,label:'0 – 10 min'},
  {coef:8,label:'10 – 20 min'},
  {coef:6,label:'20 – 60 min'},
  {coef:4.5,label:'> 60 min'}
];
var REMI_ESTIMULO={bajo:0.1,medio:0.2,alto:0.5};

function getTivaState(){
  if(!S.cur)return null;
  if(!S.cur.foja)S.cur.foja={drogas:[],vitals:[]};
  if(!S.cur.foja.tiva)S.cur.foja.tiva={estimulo:'medio',talla:''};
  return S.cur.foja.tiva;
}

function getDuracionCirugiaTiva(){
  if(typeof readCirugiaHoras==='function'&&typeof duracionCirugiaMin==='function'){
    var h=readCirugiaHoras();
    if(h.inicio&&h.fin){
      var d=duracionCirugiaMin(h.inicio,h.fin);
      if(d&&d.dur>0)return{minutos:d.dur,inicio:h.inicio,fin:h.fin,origen:'cirugía'};
    }
  }
  var hint=document.getElementById('fj-hint-vis');
  var hext=document.getElementById('fj-hext-vis');
  if(hint&&hext&&hint.value&&hext.value&&typeof duracionCirugiaMin==='function'){
    var da=duracionCirugiaMin(hint.value,hext.value);
    if(da&&da.dur>0)return{minutos:da.dur,inicio:hint.value,fin:hext.value,origen:'anestesia'};
  }
  return null;
}

function pesoIdealDevine(pesoKg,tallaCm,sexo){
  if(!tallaCm||tallaCm<100)return null;
  var htIn=tallaCm/2.54;
  var base=(sexo==='F'||sexo==='f')?45.5:50;
  var ibw=base+2.3*(htIn-60);
  return ibw>0?ibw:null;
}

function pesoCorregidoObeso(pesoKg,pesoIdeal){
  if(!pesoIdeal||pesoKg<=pesoIdeal)return pesoKg;
  return pesoIdeal+0.4*(pesoKg-pesoIdeal);
}

function calcImc(pesoKg,tallaCm){
  if(!pesoKg||!tallaCm||tallaCm<100)return null;
  var m=tallaCm/100;
  return pesoKg/(m*m);
}

function isObesidadActiva(){
  var obEl=document.getElementById('f-ob');
  if(obEl&&obEl.checked)return true;
  return !!(S.cur&&S.cur.ob);
}

function getPesoPaciente(){
  var p=parseFloat((S.cur&&S.cur.peso)||(document.getElementById('f-peso')?document.getElementById('f-peso').value:0)||0);
  return p>0?p:0;
}

function getSexoPaciente(){
  if(S.cur&&S.cur.sexo)return S.cur.sexo;
  var el=document.getElementById('f-sexo');
  return el?el.value:'';
}

function getTivaPesos(st){
  var peso=getPesoPaciente();
  var talla=parseFloat(st&&st.talla)||0;
  var sexo=getSexoPaciente();
  var ideal=pesoIdealDevine(peso,talla,sexo);
  var imc=calcImc(peso,talla);
  var obAct=isObesidadActiva();
  var usarCorregido=obAct||(imc!=null&&imc>30);
  var remiKg=ideal||peso;
  var propKg=ideal||peso;
  if(usarCorregido&&ideal)propKg=pesoCorregidoObeso(peso,ideal);
  else if(usarCorregido&&!ideal)propKg=peso;
  return{peso:peso,ideal:remiKg,corregido:propKg,propKg:propKg,remiKg:remiKg,imc:imc,usarCorregido:usarCorregido,obAct:obAct,tallaOk:!!ideal};
}

function minutosPorTramo(duracionMin){
  var d=Math.max(0,parseFloat(duracionMin)||0);
  return[
    Math.min(10,d),
    Math.min(10,Math.max(0,d-10)),
    Math.min(40,Math.max(0,d-20)),
    Math.max(0,d-60)
  ];
}

function fmt1(n){return parseFloat(n.toFixed(1));}
function fmt0(n){return Math.round(n);}

function tivaEsCardiopata(){
  if(typeof getContextosActivos!=='function')return false;
  var ctx=getContextosActivos();
  return ctx.indexOf('ic_cardio')>=0||ctx.indexOf('cec')>=0;
}

function calcTivaInduccion(st){
  st=st||getTivaState();
  var pesos=getTivaPesos(st);
  var cardio=tivaEsCardiopata();
  var propCoef=cardio?1:2;
  return{
    propMg:fmt0(propCoef*pesos.propKg),
    propCoef:propCoef,
    remiMcg:fmt0(1*pesos.remiKg),
    etomidatoMg:fmt1(0.25*(pesos.peso||pesos.propKg)),
    ketaminaMg:fmt1(1.5*(pesos.peso||pesos.propKg)),
    midazolamMg:fmt1(0.05*(pesos.peso||pesos.propKg)),
    fentaniloMcg:fmt0(3*(pesos.peso||pesos.propKg)),
    pesos:pesos,
    cardio:cardio
  };
}

function calcTivaTotales(st){
  st=st||getTivaState();
  var pesos=getTivaPesos(st);
  var durInfo=getDuracionCirugiaTiva();
  var dur=durInfo?durInfo.minutos:0;
  var remiRate=REMI_ESTIMULO[st.estimulo]||0.2;
  var mins=minutosPorTramo(dur);
  var filas=[];
  var totalProp=0;
  var totalRemi=0;
  TIVA_TRAMOS.forEach(function(t,i){
    var m=mins[i];
    if(m<=0)return;
    var propMg=fmt1(t.coef*pesos.propKg*m/60);
    var remiMcg=fmt1(remiRate*pesos.remiKg*m);
    totalProp+=propMg;
    totalRemi+=remiMcg;
    filas.push({label:t.label,minutos:m,propMgKgH:t.coef,propMg:propMg,remiMcg:remiMcg});
  });
  return{
    duracion:dur,
    durInfo:durInfo,
    remiRate:remiRate,
    pesos:pesos,
    filas:filas,
    totalProp:fmt0(totalProp),
    totalRemi:fmt0(totalRemi),
    totalRemiMg:fmt1(totalRemi/1000)
  };
}

function getTivaDosisActual(){
  var st=getTivaState();
  if(!st)return{propTotal:0,remiTotal:0,propInd:0,remiInd:0,remiRate:0.2};
  var t=calcTivaTotales(st);
  var ind=calcTivaInduccion(st);
  return{
    propTotal:t.totalProp,
    remiTotal:t.totalRemi,
    propInd:ind.propMg,
    remiInd:ind.remiMcg,
    remiRate:t.remiRate,
    duracion:t.duracion
  };
}

function hideTivaCalcPanel(){
  var p=document.getElementById('tiva-calc-panel');
  if(p)p.style.display='none';
}

function syncTivaFromUI(){
  var st=getTivaState();if(!st)return;
  var e=document.getElementById('tiva-estimulo');
  var t=document.getElementById('tiva-talla');
  if(e)st.estimulo=e.value||'medio';
  if(t)st.talla=String(t.value||'').replace(',','.');
}

function loadTivaToUI(){
  var st=getTivaState();if(!st)return;
  var e=document.getElementById('tiva-estimulo');
  var t=document.getElementById('tiva-talla');
  if(e)e.value=st.estimulo||'medio';
  if(t&&st.talla!=null)t.value=st.talla;
}

function onTivaInputChange(){
  syncTivaFromUI();
  // Recalcular opciones del desplegable (sin cuadro grande)
  if(typeof sugerirDrogas==='function'&&typeof getMetodoTipoDesdeTecnica==='function'){
    if(getMetodoTipoDesdeTecnica()==='tiva')sugerirDrogas('tiva');
  }
}

function renderTivaResults(){ /* panel mínimo: sin tabla */ }

function renderTivaCalcPanel(){
  var panel=document.getElementById('tiva-calc-panel');
  if(!panel)return;
  var tipo=typeof getMetodoTipoDesdeTecnica==='function'?getMetodoTipoDesdeTecnica():'';
  if(tipo!=='tiva'){hideTivaCalcPanel();return;}
  panel.style.display='block';
  loadTivaToUI();
  syncTivaFromUI();
  var note=panel.querySelector('.tiva-mini-note');
  if(note){
    var dur=getDuracionCirugiaTiva();
    var extra=dur?' Duración: '+dur.minutos+' min.':' Completá Tiempos para totales de mantenimiento.';
    note.innerHTML='TIVA: dosis por <b>kg</b> y <b>duración</b> (inicio/fin en Tiempos). Elegí inductores y mantenimiento en los desplegables.'+extra;
  }
}
