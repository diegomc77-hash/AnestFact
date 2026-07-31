function fmt(iso){if(!iso)return'—';var p=iso.split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:iso;}
function argToISO(s){if(!s)return'';var p=s.split('/');return p.length===3?p[2]+'-'+(p[1].length<2?'0':'')+p[1]+'-'+(p[0].length<2?'0':'')+p[0]:s;}

function hm2minSafe(s){
  if(!s)return NaN;
  var p=String(s).trim().split(':');
  if(p.length<2)return NaN;
  var h=parseInt(p[0],10),m=parseInt(p[1],10);
  if(isNaN(h)||isNaN(m))return NaN;
  return h*60+m;
}
function readCirugiaHoras(){
  function pick(ids){
    for(var i=0;i<ids.length;i++){
      var el=document.getElementById(ids[i]);
      if(el&&el.value)return el.value;
    }
    return '';
  }
  return {
    inicio:pick(['foja-hora-inicio','vg-inicio'])||(S.cur&&S.cur.hora)||'',
    fin:pick(['foja-hora-fin','fj-fin','vg-fin'])||(S.cur&&S.cur.foja&&S.cur.foja.fin)||''
  };
}
function duracionCirugiaMin(hi,hf){
  var sm=hm2minSafe(hi),em=hm2minSafe(hf);
  if(isNaN(sm)||isNaN(em))return null;
  if(em<=sm)em+=24*60;
  return {inicio:hi,fin:hf,sm:sm,em:em,dur:em-sm};
}
var HORA_OFFSET_MIN=15;
var _horaLinked={hint:'',hext:'',cinicio:'',cfin:''};

function hmAddMin(hm,delta){
  var m=hm2minSafe(hm);
  if(isNaN(m))return '';
  m+=delta;
  while(m<0)m+=24*60;
  while(m>=24*60)m-=24*60;
  var h=Math.floor(m/60),mm=m%60;
  return (h<10?'0':'')+h+':'+(mm<10?'0':'')+mm;
}

function _horaShouldAuto(current,linkedKey){
  return !current||current===_horaLinked[linkedKey];
}

function _esAeroAnestesiaHoras(){
  if(S.cur&&(S.cur.san||'').indexOf('Mayo')>=0)return false;
  var el=document.getElementById('aero-tiempos-inline');
  return !el||el.style.display!=='none';
}

function syncFojaHoras(source){
  var hi=document.getElementById('foja-hora-inicio');
  var hf=document.getElementById('foja-hora-fin');
  var hintV=document.getElementById('fj-hint-vis');
  var hextV=document.getElementById('fj-hext-vis');
  var hintH=document.getElementById('fj-hint');
  var hextH=document.getElementById('fj-hext');
  var ff=document.getElementById('fj-fin');
  var vgI=document.getElementById('vg-inicio');
  var vgF=document.getElementById('vg-fin');
  var cinicio=hi&&hi.value?hi.value:'';
  var cfin=hf&&hf.value?hf.value:'';
  var anIn=hintV&&hintV.value?hintV.value:'';
  var anFin=hextV&&hextV.value?hextV.value:'';

  if(_esAeroAnestesiaHoras()&&source==='cir_inicio'&&cinicio){
    var nh=hmAddMin(cinicio,-HORA_OFFSET_MIN);
    if(hintV&&_horaShouldAuto(anIn,'hint')){_horaLinked.hint=nh;hintV.value=nh;anIn=nh;}
  }else if(_esAeroAnestesiaHoras()&&source==='anes_inicio'&&anIn){
    var nc=hmAddMin(anIn,HORA_OFFSET_MIN);
    if(hi&&_horaShouldAuto(cinicio,'cinicio')){_horaLinked.cinicio=nc;hi.value=nc;cinicio=nc;}
  }else if(_esAeroAnestesiaHoras()&&source==='cir_fin'&&cfin){
    var ne=hmAddMin(cfin,HORA_OFFSET_MIN);
    if(hextV&&_horaShouldAuto(anFin,'hext')){_horaLinked.hext=ne;hextV.value=ne;anFin=ne;}
  }else if(_esAeroAnestesiaHoras()&&source==='anes_fin'&&anFin){
    var nf=hmAddMin(anFin,-HORA_OFFSET_MIN);
    if(hf&&_horaShouldAuto(cfin,'cfin')){_horaLinked.cfin=nf;hf.value=nf;cfin=nf;}
  }

  if(hintH&&hintV)hintH.value=hintV.value;
  if(hextH&&hextV)hextH.value=hextV.value;
  if(ff&&cfin)ff.value=cfin;
  if(vgI&&cinicio)vgI.value=cinicio;
  if(vgF&&cfin)vgF.value=cfin;
  if(S.cur){
    if(cinicio)S.cur.hora=cinicio;
    if(cfin){
      if(!S.cur.foja)S.cur.foja={drogas:[],vitals:[]};
      S.cur.foja.fin=cfin;
    }
    if(hintH&&hintH.value){
      if(!S.cur.foja)S.cur.foja={drogas:[],vitals:[]};
      S.cur.foja.hint=hintH.value;
    }
    if(hextH&&hextH.value){
      if(!S.cur.foja)S.cur.foja={drogas:[],vitals:[]};
      S.cur.foja.hext=hextH.value;
    }
  }
}
function syncMayoHoras(){syncFojaHoras();}

/** Fecha/hora en que se confecciona la foja en GECLISA (fin cirugía + 20 min). */
function calcGestionFoja(f,i){
  f=f||{};
  i=i||{};
  var fin=f.fin||'';
  if(!fin&&typeof readCirugiaHoras==='function'){
    var h=readCirugiaHoras();
    fin=h.fin||'';
  }
  var horaGestion='';
  if(fin)horaGestion=hmAddMin(fin,20);
  if(!horaGestion){
    var now=new Date();
    horaGestion=(now.getHours()<10?'0':'')+now.getHours()+':'+(now.getMinutes()<10?'0':'')+now.getMinutes();
  }
  var fechaGestion=i.fecha||new Date().toISOString().slice(0,10);
  if(fin&&horaGestion){
    var fm=hm2minSafe(fin),gm=hm2minSafe(horaGestion);
    if(!isNaN(fm)&&!isNaN(gm)&&gm<fm){
      var d=new Date(fechaGestion+'T12:00:00');
      d.setDate(d.getDate()+1);
      fechaGestion=d.toISOString().slice(0,10);
    }
  }
  return {fechaGestion:fechaGestion,horaGestion:horaGestion};
}

function buildMantenimientoGeclisa(tipoTec,tecTexto,drogasMant){
  if(drogasMant&&drogasMant.length)return drogasMant.join(', ');
  if(tipoTec==='sedacion'||tipoTec==='neuroaxial'||tipoTec==='bloqueo'||tipoTec==='local')return '';
  return tecTexto||'';
}
