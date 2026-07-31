var VG={cols:[],cells:{},obs:{},fluidos:{},activeParam:'resp'};
var PARAMS={resp:{label:'Resp.',sym:'\u25cb',color:'#4fc3f7'},pulso:{label:'Pulso',sym:'\u25cf',color:'#ef5350'},ta:{label:'T.A.',sym:')(',color:'#ab47bc'},oximet:{label:'OXIMET',sym:'\u2014',color:'#66bb6a'},co2:{label:'El CO\u2082',sym:'\u25a1',color:'#ffa726'},operac:{label:'Operac.',sym:'\u25a0',color:'#78909c'},anest:{label:'Anestes.',sym:'\u00d7',color:'#26c6da'}};
var Y_VALS=[200,187.5,175,162.5,150,137.5,125,112.5,100,87.5,75,62.5,50,37.5,25,12.5];
function hm2min(s){var p=s.split(':');return parseInt(p[0])*60+parseInt(p[1]);}
function min2hm(m){var h=Math.floor(m/60)%24,mm=m%60;return(h<10?'0':'')+h+':'+(mm<10?'0':'')+mm;}
function selParam(btn){document.querySelectorAll('.param-btn').forEach(function(b){b.style.borderColor='var(--border)';b.style.color='var(--text2)';b.classList.remove('active');});btn.style.borderColor='var(--green)';btn.style.color='var(--green)';btn.classList.add('active');VG.activeParam=btn.getAttribute('data-p');}
function cellKey(ci,val){return ci+'_'+val;}
function roundTo25(v){return Math.round(v/12.5)*12.5;}
function generarColumnas(){
  var horas=readCirugiaHoras();
  var hi=horas.inicio,hf=horas.fin;
  if(!hi){toast('Completá la hora de inicio en Tiempos quirúrgicos');return;}
  if(!hf){toast('Completá la hora de fin en Tiempos quirúrgicos');return;}
  var span=duracionCirugiaMin(hi,hf);
  if(!span){toast('Horarios inválidos');return;}
  var sm=span.sm,em=span.em,dur=span.dur;
  VG.cols=[];VG.cells={};VG.obs={};VG.fluidos={};
  for(var t=sm;t<=em;t+=5)VG.cols.push({t:min2hm(t)});

  // Predicción si hay valores base
  var sist=parseInt((document.getElementById('aero-sist')||{value:'0'}).value)||0;
  var diast=parseInt((document.getElementById('aero-diast')||{value:'0'}).value)||0;
  var fc=parseInt((document.getElementById('aero-fc')||{value:'0'}).value)||0;
  var sat=parseInt((document.getElementById('aero-sat')||{value:'0'}).value)||0;
  var eco2=parseInt((document.getElementById('aero-eco2')||{value:'0'}).value)||0;
  var resp=parseInt((document.getElementById('aero-resp')||{value:'0'}).value)||0;
  var evol=(document.getElementById('aero-evol')||{value:'estable'}).value;

  if(sist>0||fc>0){
    function aeroCurva(base,p){
      if(!base)return 0;
      var f=1;
      if(evol==='estable'){
        // Variación suave pero visible entre filas de 25 unidades
        f=1+Math.sin(p*Math.PI*5)*0.12+(Math.random()-0.5)*0.08;
      }
      else if(evol==='leve_descenso')f=(p<0.33?1-(p/0.33)*0.12:0.88+(p-0.33)*0.18)+(Math.random()-0.5)*0.06;
      else if(evol==='descenso_mod')f=1-(p*0.15)+(Math.random()-0.5)*0.06;
      else if(evol==='leve_aumento')f=1+(p*0.12)+(Math.random()-0.5)*0.06;
      else f=1+Math.sin(p*Math.PI*3)*0.15+(Math.random()-0.5)*0.08;
      return Math.round(base*f);
    }

    VG.cols.forEach(function(col,ci){
      var tAbs=hm2min(col.t);
      var p=(tAbs-sm)/dur;
      // FC → Pulso ●
      if(fc>0){var fcV=aeroCurva(fc,p);if(fcV>0)VG.cells[cellKey(ci,fcV)]={param:'pulso',sym:PARAMS['pulso'].sym,color:PARAMS['pulso'].color,val:fcV};}
      // SIST → T.A. )(
      if(sist>0){var sV=aeroCurva(sist,p);if(sV>0)VG.cells[cellKey(ci,sV)]={param:'ta',sym:PARAMS['ta'].sym,color:PARAMS['ta'].color,val:sV};}
      // SAT → OXIMET —
      if(sat>0){var satV=Math.min(100,Math.max(90,Math.round(sat+(Math.random()-0.5)*2)));VG.cells[cellKey(ci,satV)]={param:'oximet',sym:PARAMS['oximet'].sym,color:PARAMS['oximet'].color,val:satV};}
      // CO2 → □
      if(eco2>0){var co2V=Math.round(eco2+(Math.random()-0.5)*3);VG.cells[cellKey(ci,co2V)]={param:'co2',sym:PARAMS['co2'].sym,color:PARAMS['co2'].color,val:co2V};}
      // Resp → ○ (valor real, con número si < 50)
      if(resp>0){var rV=Math.round(resp+(Math.random()-0.5)*2);VG.cells[cellKey(ci,rV)]={param:'resp',sym:PARAMS['resp'].sym,color:PARAMS['resp'].color,val:rV};}
    });

    // ■ Operac → columna de hora inicio y hora fin de cirugía
    var ciInicio=0;
    var ciFin=VG.cols.length-1;
    VG.cells[cellKey(ciInicio,162.5)]={param:'operac',sym:PARAMS['operac'].sym,color:PARAMS['operac'].color};
    VG.cells[cellKey(ciFin,162.5)]={param:'operac',sym:PARAMS['operac'].sym,color:PARAMS['operac'].color};

    // × Anestes → columna de hora intubación y extubación
    var hintEl=document.getElementById('fj-hint-vis');
    var hextEl=document.getElementById('fj-hext-vis');
    if(hintEl&&hintEl.value){
      var mHint=hm2min(hintEl.value);
      var ciHint=Math.round((mHint-sm)/5);
      if(ciHint>=0&&ciHint<VG.cols.length)VG.cells[cellKey(ciHint,175)]={param:'anestes',sym:PARAMS['anestes'].sym,color:PARAMS['anestes'].color};
    }
    if(hextEl&&hextEl.value){
      var mHext=hm2min(hextEl.value);
      var ciHext=Math.round((mHext-sm)/5);
      if(ciHext>=0&&ciHext<VG.cols.length)VG.cells[cellKey(ciHext,125)]={param:'anestes',sym:PARAMS['anestes'].sym,color:PARAMS['anestes'].color};
    }
  }

  renderVitalsGrid();
  toast('Gráfico generado ✓ '+VG.cols.length+' columnas ('+hi+' → '+hf+')');
  if(typeof renderBalanceAlertas==='function')renderBalanceAlertas();
}

function toggleCell(ci,val){var k=cellKey(ci,val);var p=VG.activeParam;if(VG.cells[k]&&VG.cells[k].param===p){delete VG.cells[k];}else{VG.cells[k]={param:p,sym:PARAMS[p].sym,color:PARAMS[p].color};}renderVitalsGrid();}
function renderVitalsGrid(){
  var wrap=document.getElementById('vitals-grid-wrap');if(!wrap)return;
  if(!VG.cols.length){wrap.innerHTML='<p style="font-size:12px;color:var(--text3);text-align:center;padding:20px">Gener\u00e1 las columnas de tiempo para empezar</p>';return;}
  var CELL=28,LABEL_W=50;
  var html='<div style="font-family:Arial,sans-serif;user-select:none"><div style="display:flex;margin-left:'+LABEL_W+'px;border-bottom:1px solid var(--border)">';
  VG.cols.forEach(function(col){html+='<div style="width:'+CELL+'px;font-size:6.5px;text-align:center;color:var(--text3);padding:2px 0;overflow:hidden;flex-shrink:0">'+col.t+'</div>';});
  html+='</div>';
  Y_VALS.forEach(function(yval){
    var showLabel=(yval===200||yval===150||yval===100||yval===50);
    var isMajor=(yval%50===0);
    html+='<div style="display:flex;align-items:stretch"><div style="width:'+LABEL_W+'px;font-size:8px;color:var(--text2);text-align:right;padding-right:4px;flex-shrink:0;display:flex;align-items:flex-end;justify-content:flex-end;padding-bottom:1px;font-weight:'+(showLabel?'bold':'normal')+'">'+(showLabel?yval:'')+'</div>';
    VG.cols.forEach(function(col,ci){
      // Buscar el valor real más cercano a este yval en VG.cells
      var cell=VG.cells[cellKey(ci,yval)];
      if(!cell){
        // Solo mostrar si yval es el más cercano a ese valor real
        var nearest=null,minDist=13;
        Object.keys(VG.cells).forEach(function(k2){
          var parts=k2.split('_');
          if(parseInt(parts[0])===ci){
            var v=parseFloat(parts[1]);
            var dist=Math.abs(v-yval);
            // Verificar que yval sea efectivamente el más cercano en Y_VALS
            var closestYval=Y_VALS.reduce(function(a,b){return Math.abs(b-v)<Math.abs(a-v)?b:a;});
            if(dist<minDist&&closestYval===yval){minDist=dist;nearest=VG.cells[k2];}
          }
        });
        cell=nearest;
      }var bt=isMajor?'1.5px solid rgba(100,100,100,.5)':'1px solid rgba(48,54,61,.5)';var bg=cell?'rgba(29,185,84,.12)':'transparent';var sym=cell?('<span style="font-size:13px;font-weight:bold;line-height:1;color:'+cell.color+'">'+cell.sym+'</span>'):'';html+='<div onclick="toggleCell('+ci+','+yval+')" style="width:'+CELL+'px;height:18px;border-left:1px solid rgba(48,54,61,.4);border-top:'+bt+';background:'+bg+';display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0">'+sym+'</div>';});
    html+='</div>';
  });
  html+='<div style="display:flex;margin-top:2px;align-items:stretch"><div style="width:'+LABEL_W+'px;font-size:7px;color:var(--text3);text-align:right;padding-right:4px;flex-shrink:0;line-height:1.2">Hora<br>obs.</div>';
  VG.cols.forEach(function(col,ci){var val=VG.obs[ci]||'';html+='<div style="width:'+CELL+'px;height:20px;border:1px solid rgba(48,54,61,.5);flex-shrink:0;overflow:hidden"><input oninput="VG.obs['+ci+']=this.value" value="'+val+'" style="width:100%;height:100%;background:transparent;border:none;font-size:6px;text-align:center;color:var(--text);padding:0;outline:none"></div>';});
  html+='</div><div style="display:flex;margin-top:1px;align-items:stretch"><div style="width:'+LABEL_W+'px;font-size:8px;color:var(--text3);text-align:right;padding-right:4px;flex-shrink:0;font-weight:bold">FLUIDOS</div>';
  VG.cols.forEach(function(col,ci){var val=VG.fluidos[ci]||'';html+='<div style="width:'+CELL+'px;height:20px;border:1px solid rgba(48,54,61,.5);flex-shrink:0;overflow:hidden"><input oninput="VG.fluidos['+ci+']=this.value" value="'+val+'" style="width:100%;height:100%;background:transparent;border:none;font-size:6px;text-align:center;color:var(--text);padding:0;outline:none"></div>';});
  html+='</div><div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;font-size:11px">';
  Object.keys(PARAMS).forEach(function(k){var p=PARAMS[k];html+='<span style="color:'+p.color+'"><b>'+p.sym+'</b> '+p.label+'</span>';});
  html+='</div></div>';
  wrap.innerHTML=html;
}
function limpiarGrafico(){VG.cells={};VG.obs={};VG.fluidos={};renderVitalsGrid();toast('Gr\u00e1fico limpiado');}
function generarFilasVitales(){generarColumnas();}
function addVitalRow(){}
function renderVitals(){}
function editV(){}
function delV(){}
function guardarFojaVG(){
  if(S.cur&&S.cur.foja){
    S.cur.foja.vg_cols=VG.cols;
    S.cur.foja.vg_cells=VG.cells;
    S.cur.foja.vg_obs=VG.obs;
    S.cur.foja.vg_fluidos=VG.fluidos;
    // Guardar campos base del gráfico Aeronáutico
    function gv2(id){var e=document.getElementById(id);return e?e.value:'';}
    S.cur.foja.aero_sist=gv2('aero-sist');
    S.cur.foja.aero_diast=gv2('aero-diast');
    S.cur.foja.aero_fc=gv2('aero-fc');
    S.cur.foja.aero_sat=gv2('aero-sat');
    S.cur.foja.aero_eco2=gv2('aero-eco2');
    S.cur.foja.aero_resp=gv2('aero-resp');
    S.cur.foja.aero_evol=gv2('aero-evol');
  }
}
function cargarFojaVG(){
  var f=(S.cur&&S.cur.foja)||{};
  if(f.vg_cols&&f.vg_cols.length){
    VG.cols=f.vg_cols;VG.cells=f.vg_cells||{};VG.obs=f.vg_obs||{};VG.fluidos=f.vg_fluidos||{};
    setTimeout(renderVitalsGrid,80);
  }else{
    VG.cols=[];VG.cells={};VG.obs={};VG.fluidos={};
    var vgBody=document.getElementById('vitals-body');if(vgBody)vgBody.innerHTML='';
    var vitGrid=document.getElementById('vitals-grid');if(vitGrid)vitGrid.innerHTML='';
  }
  function sv2(id,val){var e=document.getElementById(id);if(e)e.value=val||'';}
  sv2('aero-sist',f.aero_sist);sv2('aero-diast',f.aero_diast);
  sv2('aero-fc',f.aero_fc);sv2('aero-sat',f.aero_sat);
  sv2('aero-eco2',f.aero_eco2);sv2('aero-resp',f.aero_resp);
  sv2('aero-evol',f.aero_evol);
}

