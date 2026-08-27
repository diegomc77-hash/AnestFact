function _printPremedConAtb(f){
  var p=String((f&&f.premed)||'').trim();
  var a=String((f&&f.atb)||'').trim();
  if(p&&a)return p+' / ATB: '+a;
  if(a)return 'ATB: '+a;
  return p;
}

function getHallazgosFisicos(f){
  if(typeof buildHallazgosFisicos==='function')return buildHallazgosFisicos(f);
  var h=[];
  if(f.mallampati){
    var mRom={'I':1,'II':2,'III':3,'IV':4};
    var mVal=mRom[f.mallampati]||parseInt(f.mallampati)||0;
    if(mVal>=3)h.push('Mallampati '+f.mallampati);
  }
  if(f.examenFisico){
    var frases=f.examenFisico.split('.');
    frases.forEach(function(fr){
      var ft=fr.trim();
      if(!ft)return;
      if(/patol|anormal|soplo|arritmia|sibilancia|rale|estertore|limitad|rigidez|infecci|tatuaje|déficit|edema/i.test(ft)){
        if(ft.length<15)ft='Hallazgo: '+ft;
        h.push(ft);
      }
    });
  }
  if(f.examenRegional&&/patol|anormal|edema|déficit|hipoestesia|infecci/i.test(f.examenRegional)){
    h.push(f.examenRegional.slice(0,80));
  }
  return h.length?h.join('. '):'Sin hallazgos patológicos';
}

function _printEsc(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _obsFitInBox(text){
  var t=String(text||'').trim();
  if(!t)return {main:'',overflow:'',fs:10};
  var limits=[280,380,520,720,1000];
  var sizes=[10,9,8,7,6.5];
  var fs=6.5,i;
  for(i=0;i<limits.length;i++){
    if(t.length<=limits[i]){fs=sizes[i];return {main:t,overflow:'',fs:fs};}
  }
  var cut=900, main=t.slice(0,cut), overflow=t.slice(cut).trim();
  var lastSpace=main.lastIndexOf(' ');
  if(lastSpace>cut*0.7){overflow=main.slice(lastSpace+1)+' '+overflow;main=main.slice(0,lastSpace);}
  return {main:main,overflow:overflow,fs:6.5};
}

function _splitObsContinuation(text, chunkSize){
  var t=String(text||'').trim();
  if(!t)return [];
  var parts=[], cur='', words=t.split(/\s+/);
  words.forEach(function(w){
    var next=cur?(cur+' '+w):w;
    if(next.length>chunkSize&&cur){parts.push(cur);cur=w;}
    else cur=next;
  });
  if(cur)parts.push(cur);
  return parts;
}

var _afPrintFirmaOpts={};
var AF_PRINT_GOV_STRIP='assets/foja-headers/provincia-cba-salud-escudo.png';

function _printAbs(rel){
  try{return new URL(rel,window.location.href).href;}catch(e){return rel;}
}

function _printHasHeader(i){
  var inst=typeof afFojaInst==='function'?afFojaInst(i&&i.san):null;
  return !!(inst&&inst.header&&inst.header.mode&&inst.header.mode!=='none');
}

function _printHeaderHtml(i){
  var inst=typeof afFojaInst==='function'?afFojaInst(i&&i.san):null;
  if(!inst||!inst.header||inst.header.mode==='none')return '';
  if(inst.header.mode==='png'&&inst.header.asset){
    return '<div class="af-ph af-ph-png"><img alt="" src="'+_printEsc(_printAbs(inst.header.asset))+'"></div>';
  }
  if(inst.header.mode==='compose'){
    var lineas=inst.header.lineas&&inst.header.lineas.length?inst.header.lineas:[String((i&&i.san)||'')];
    var name=lineas.map(function(l){return _printEsc(l);}).join('<br>');
    return '<div class="af-ph"><div class="af-ph-name">'+name+'</div>'
      +'<img class="af-ph-gov" alt="" src="'+_printEsc(_printAbs(AF_PRINT_GOV_STRIP))+'"></div>';
  }
  return '';
}

function _printPgOpen(i){
  return '<div class="pg'+(_printHasHeader(i)?' af-pg-hdr':'')+'">'+_printHeaderHtml(i);
}

function _printChartH(i,base){
  return _printHasHeader(i)?Math.max(100,base-22):base;
}

function _buildSignBlock(signImg){
  var firma=(typeof AfIdentidad!=='undefined'&&AfIdentidad.firmaHtml)?AfIdentidad.firmaHtml(_afPrintFirmaOpts)
    :('<b>'+((localStorage.getItem('af_anest_nombre')||'ANESTESISTA').replace(/</g,''))+'</b><br>Anestesiólogo/a'+((_afPrintFirmaOpts&&_afPrintFirmaOpts.colegio===false)?'':' · ADAARC'));
  return '<div style="flex:0 0 138px;display:flex;flex-direction:column;justify-content:flex-end;text-align:center">'+signImg
    +'<div style="border-top:1.5px solid #000;padding-top:3px;font-size:8px">'+firma+'</div></div>';
}

function _buildObsSignRow(obsText, obsFs, signImg, boxStyle, obsLabel){
  if(!signImg)return '';
  var box=boxStyle||'min-height:58px;max-height:58px';
  var label=obsLabel||'Observaciones:';
  var obsSection=obsText
    ?('<div style="flex:2;min-width:0;display:flex;flex-direction:column"><div class="s">'+label+'</div>'
      +'<div style="border:1px solid #ccc;padding:3px;'+box+';font-size:'+(obsFs||9)+'px;word-wrap:break-word;overflow-wrap:break-word;overflow:hidden">'+_printEsc(obsText)+'</div>'
      +'<div style="border:1px solid #ccc;border-top:none;padding:2px 3px;text-align:center;font-size:7.5px;font-weight:bold">FIRMA Y SELLO DEL ANESTESISTA</div></div>')
    :('<div style="flex:1;text-align:right;font-size:7.5px;font-weight:bold;padding-top:4px;align-self:flex-end">FIRMA Y SELLO DEL ANESTESISTA</div>');
  return '<div style="display:flex;gap:8px;align-items:flex-end">'+obsSection+_buildSignBlock(signImg)+'</div>';
}

function _chartColsPerPage(n){
  if(n<=0)return 24;
  var minCw=6,maxCw=14,chartW=170;
  if(Math.floor(chartW/n)>=minCw)return n;
  return Math.max(1,Math.floor(chartW/minCw));
}

function _buildPrintStyles(){
  return '*{box-sizing:border-box;margin:0;padding:0}'
    +'@page{size:A4 portrait;margin:0}'
    +'html,body{margin:0;padding:0;background:#fff}'
    +'.pg{width:210mm;height:297mm;max-height:297mm;padding:5mm 8mm;page-break-after:always;overflow:hidden;font-family:Arial,Helvetica,sans-serif;font-size:10.5px;color:#000;line-height:1.3;display:flex;flex-direction:column}'
    +'.pg:last-child{page-break-after:auto}'
    +'.pg-fill{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}'
    +'.pg-footer{flex-shrink:0}'
    +'.hoja-n{text-align:right;font-size:8px;font-weight:bold;color:#333;margin:-2px 0 4px}'
    +'h1{font-size:14px;text-align:center;font-weight:bold;border-bottom:2px solid #000;padding-bottom:5px;margin-bottom:7px;letter-spacing:.07em}'
    +'.af-pg-hdr{padding-top:4mm}'
    +'.af-pg-hdr h1{font-size:13px;margin-bottom:4px;padding-bottom:3px}'
    +'.af-ph{display:flex;align-items:stretch;height:13.5mm;margin:0 0 2.5mm;flex-shrink:0;overflow:hidden}'
    +'.af-ph-png{display:block}'
    +'.af-ph-png img{height:13.5mm;width:auto;max-width:100%;display:block;object-fit:contain}'
    +'.af-ph-name{flex:0 0 34%;border:0.3mm solid #555;display:flex;flex-direction:column;justify-content:center;padding:0 2mm;font-weight:700;font-size:9px;letter-spacing:.05em;color:#444;line-height:1.12;text-transform:uppercase}'
    +'.af-ph-gov{flex:1;min-width:0;height:13.5mm;object-fit:contain;object-position:left center}'
    +'.r{display:flex;gap:5px;margin-bottom:5px;align-items:flex-end}'
    +'.f{border-bottom:1.5px solid #000;padding:0 2px 1px;min-height:17px;flex:1;font-size:10.5px;word-wrap:break-word}'
    +'.l{font-size:8px;color:#333;font-weight:bold;text-transform:uppercase;display:block;margin-bottom:1px}'
    +'.s{font-size:9px;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #555;margin:5px 0 3px;padding-bottom:1px}'
    +'.chk{display:inline-block;width:10px;height:10px;border:1px solid #000;margin-right:3px;text-align:center;line-height:9px;font-size:9px;vertical-align:middle}';
}

function _buildChartLegend(){
  return '<div style="flex:0 0 56px;border-right:1px solid #000;padding:2px 3px;font-size:7px">'
    +'<div style="font-weight:bold;line-height:1.2;margin-bottom:4px">Plano de 3er.<br>Estudio</div>'
    +'<div style="text-align:right">200</div><div style="height:22px"></div><div style="text-align:right">150</div>'
    +'<div style="height:22px"></div><div style="text-align:right">100</div><div style="height:22px"></div><div style="text-align:right">50</div>'
    +'<div style="margin-top:6px;font-size:6.5px;line-height:1.7">Resp.: &#9675;<br>Pulso: &#9679;<br>T.A: )(<br>OXIMET: &#8212;<br>El CO&#8322;: &#9633;<br>Operac.: &#9632;<br>Anestes.: &#215;</div>'
    +'<div style="margin-top:5px;font-size:6.5px;font-weight:bold">Hora de las<br>Observac.</div>'
    +'<div style="margin-top:3px;font-size:6.5px;font-weight:bold">FLUIDOS</div></div>';
}

function _buildChartHtml(vgCols, vgCells, vgObs, vgFluidos, start, end, useEmptyGrid){
  if(useEmptyGrid||!vgCols.length){
    var COLS=24;
    var rDefs=[];for(var r=0;r<16;r++){var yv=200-r*12.5;rDefs.push({lb:(yv===200||yv===150||yv===100||yv===50)?String(yv):'',th:(yv%50===0)});}
    var html='<table style="width:100%;border-collapse:collapse;table-layout:fixed"><colgroup><col style="width:54px">';
    for(var c0=0;c0<COLS;c0++)html+='<col>';
    html+='</colgroup>';
    rDefs.forEach(function(rd){
      html+='<tr><td style="border:1px solid #999;font-size:6.5px;padding:0 2px;background:#f5f5f5;text-align:right;font-weight:'+(rd.lb?'bold':'normal')+'">'+rd.lb+'</td>';
      for(var c=0;c<COLS;c++)html+='<td style="border:1px solid '+(rd.th?'#aaa':'#ddd')+';height:13px"></td>';
      html+='</tr>';
    });
    html+='<tr><td style="font-size:6px;text-align:right;padding:0 2px;background:#f5f5f5;line-height:1.1">Hora<br>obs.</td>';
    for(var c2=0;c2<COLS;c2++)html+='<td style="border:1px solid #ddd;height:13px"></td>';
    html+='</tr><tr><td style="font-size:6.5px;font-weight:bold;text-align:right;padding:0 2px;background:#f5f5f5">FLUIDOS</td>';
    for(var c3=0;c3<COLS;c3++)html+='<td style="border:1px solid #ddd;height:13px"></td>';
    html+='</tr></table>';
    return html;
  }
  var slice=vgCols.slice(start,end);
  var n=slice.length;
  var YVALS=[];for(var yv=200;yv>=50;yv-=5)YVALS.push(yv);
  var chartHtml='<table style="border-collapse:collapse;width:100%;table-layout:fixed"><colgroup><col style="width:54px">';
  for(var ci=0;ci<n;ci++)chartHtml+='<col>';
  chartHtml+='</colgroup><tbody>';
  chartHtml+='<tr><td></td>';
  slice.forEach(function(col){
    chartHtml+='<td style="font-size:5px;text-align:center;border:1px solid #ccc">'+_printEsc(col.t)+'</td>';
  });
  chartHtml+='</tr>';
  YVALS.forEach(function(yval){
    var sl=(yval%25===0), th=(yval%25===0);
    chartHtml+='<tr><td style="font-size:6.5px;text-align:right;padding-right:3px;font-weight:'+(sl?'bold':'normal')+'">'+(sl?yval:'')+'</td>';
    slice.forEach(function(col,si){
      var ci2=start+si;
      var _colMap={};
      Object.keys(vgCells).forEach(function(k2){
        var pts=k2.split('_');
        if(parseInt(pts[0],10)===ci2){
          var v=parseFloat(pts[1]);
          var targetRow=v<50?50:(v>200?200:Math.round(v/5)*5);
          if(!_colMap[targetRow]||Math.abs(v-targetRow)<Math.abs(parseFloat(_colMap[targetRow].split('_')[1])-targetRow)){
            _colMap[targetRow]=k2;
          }
        }
      });
      var mappedKey=_colMap[yval];
      var cell=mappedKey?vgCells[mappedKey]:null;
      var valReal=cell&&cell.val?cell.val:null;
      var fuera=valReal&&(valReal<50||valReal>200);
      var sym=cell?('<b style="font-size:8px">'+cell.sym+(fuera?'<sup style="font-size:5px">'+valReal+'</sup>':'')+'</b>'):'';
      chartHtml+='<td style="height:10px;border:1px solid '+(th?'#aaa':'#e0e0e0')+';text-align:center;vertical-align:middle">'+sym+'</td>';
    });
    chartHtml+='</tr>';
  });
  chartHtml+='<tr><td style="font-size:6px;text-align:right;padding-right:3px;line-height:1.1">Hora<br>obs.</td>';
  slice.forEach(function(col,si){
    var ci3=start+si;
    chartHtml+='<td style="height:10px;border:1px solid #ddd;font-size:6px;text-align:center">'+_printEsc(vgObs[ci3]||'')+'</td>';
  });
  chartHtml+='</tr><tr><td style="font-size:6px;font-weight:bold;text-align:right;padding-right:3px">FLUIDOS</td>';
  slice.forEach(function(col,si){
    var ci4=start+si;
    chartHtml+='<td style="height:10px;border:1px solid #ddd;font-size:6px;text-align:center">'+_printEsc(vgFluidos[ci4]||'')+'</td>';
  });
  chartHtml+='</tr></tbody></table>';
  return chartHtml;
}

function _buildChartBlock(chartInner, minHeight){
  return '<div style="border:1.5px solid #000;margin:3px 0;display:flex;min-height:'+(minHeight||140)+'px;flex-shrink:0">'
    +_buildChartLegend()
    +'<div style="flex:1;min-width:0">'+chartInner+'</div></div>';
}

function _buildFojaSheet(i,f,drogaLines,signImg,obsMain,obsFs,chartInner){
  return _printPgOpen(i)+'<h1>FOJA DE ANESTESIA</h1><div class="pg-fill">'
    +'<div class="r"><div style="flex:3"><span class="l">Apellido y nombres</span><div class="f">'+_printEsc(i.pac)+'</div></div>'
    +'<div style="flex:0 0 118px"><span class="l">D.N.I. N&#176;</span><div class="f">'+_printEsc(i.dni)+'</div></div></div>'
    +'<div class="r"><div style="flex:2"><span class="l">Servicio</span><div class="f">'+_printEsc(i.serv)+'</div></div>'
    +'<div style="flex:3"><span class="l">Procedimiento</span><div class="f">'+_printEsc(i.diag)+'</div></div>'
    +'<div style="flex:0 0 72px"><span class="l">Sala</span><div class="f">'+_printEsc(i.sala)+'</div></div>'
    +'<div style="flex:0 0 60px"><span class="l">Cama N&#176;</span><div class="f">'+_printEsc(i.cama)+'</div></div></div>'
    +'<div class="r"><div style="flex:0 0 64px"><span class="l">Fecha</span><div class="f">'+fmt(i.fecha)+'</div></div>'
    +'<div style="flex:0 0 36px"><span class="l">Edad</span><div class="f">'+_printEsc(i.edad)+'</div></div>'
    +'<div style="flex:0 0 26px"><span class="l">Sexo</span><div class="f">'+_printEsc(i.sexo)+'</div></div>'
    +'<div style="flex:0 0 42px"><span class="l">Peso</span><div class="f">'+(i.peso?_printEsc(i.peso+' kg'):'')+'</div></div>'
    +'<div style="flex:1"><span class="l">Premedicaci&#243;n</span><div class="f">'+_printEsc(_printPremedConAtb(f))+'</div></div>'
    +'<div style="flex:0 0 44px"><span class="l">Hora</span><div class="f">'+_printEsc(i.hora)+'</div></div></div>'
    +'<div class="r"><div style="flex:1"><span class="l">Hallazgos f&#237;sicos anormales</span>'
    +'<div class="f" style="min-height:22px;font-size:7px;line-height:1.35">'+_printEsc(getHallazgosFisicos(f))+'</div></div></div>'
    +'<div style="margin:2px 0;font-size:9px"><b>Inducci&#243;n:</b>&nbsp;'
    +'<span class="chk">'+(f.ind==='Satisfactoria'?'&#10003;':'')+'</span>Satisfactoria&nbsp;&nbsp;'
    +'<span class="chk">'+(f.ind==='Prolongada'?'&#10003;':'')+'</span>Prolongada&nbsp;&nbsp;'
    +'<span class="chk">'+(f.ind==='Tormentosa'?'&#10003;':'')+'</span>Tormentosa</div>'
    +'<div class="r"><div style="flex:1"><span class="l">Inicio anestesia/intub.</span><div class="f">'+_printEsc(f.hint)+'</div></div>'
    +'<div style="flex:2"></div><div style="flex:1"><span class="l">Fin anestesia/extub.</span><div class="f">'+_printEsc(f.hext)+'</div></div></div>'
    +_buildChartBlock(chartInner,_printChartH(i,140))
    +'<div class="s" style="margin-top:3px">Agentes Anest&#233;sicos:</div><div style="border-bottom:1px solid #ccc;padding:1px 3px;min-height:16px;font-size:9.5px;line-height:1.25">'+_printEsc(drogaLines)+'</div>'
    +'<div class="s" style="margin-top:3px">M&#233;todos Anest&#233;sicos:</div><div style="border-bottom:1px solid #ccc;padding:1px 3px;min-height:16px;font-size:9.5px;line-height:1.25">'+_printEsc(f.metodos)+'</div>'
    +'<div class="s" style="margin-top:3px">Recuperaci&#243;n:</div><div style="border-bottom:1px solid #ccc;padding:1px 3px;min-height:16px;font-size:9.5px;line-height:1.25">'+_printEsc(f.recup)+'</div>'
    +'</div><div class="pg-footer">'
    +_buildObsSignRow(obsMain,obsFs,signImg,'min-height:58px;max-height:58px')
    +'<div style="display:flex;gap:8px;margin-top:3px;border-top:2px solid #000;padding-top:3px"><div style="flex:1"><div class="s">Hemoterapia:</div><div style="font-size:9px;line-height:1.85">'
    +'Sangre: <span style="border-bottom:1px solid #000;display:inline-block;min-width:38px">'+_printEsc(f.sangre)+'</span> cm&#179;<br>'
    +'Plasma: <span style="border-bottom:1px solid #000;display:inline-block;min-width:38px">'+_printEsc(f.plasma)+'</span> cm&#179;<br>'
    +'Suero: <span style="border-bottom:1px solid #000;display:inline-block;min-width:38px">'+_printEsc(f.suero)+'</span> cm&#179;<br>'
    +'Otro: <span style="border-bottom:1px solid #000;display:inline-block;min-width:38px">'+_printEsc(f.otro)+'</span> cm&#179;</div></div>'
    +'<div style="flex:2"><div class="s">Observaciones</div>'
    +'<div style="border:1px solid #ccc;min-height:58px;max-height:58px;padding:3px;font-size:9.5px;overflow:hidden;word-wrap:break-word">'+_printEsc(f.obs_hemo||'')+'</div></div>'
    +'</div></div></div>';
}

/** Continuación: paciente + gráfico + obs sobrantes + firma (todo en flujo normal, sin pie oculto). */
function _buildChartContinuationSheet(i,f,chartInner,pageNum,obsOverflow,signImg){
  var obsHtml='';
  if(obsOverflow){
    obsHtml='<div class="s" style="margin-top:8px">Observaciones (continuaci&#243;n):</div>'
      +'<div style="border:1px solid #ccc;padding:4px 6px;font-size:8.5px;line-height:1.45;word-wrap:break-word;margin-bottom:6px">'
      +_printEsc(obsOverflow)+'</div>';
  }
  var signHtml='<div style="display:flex;gap:8px;margin-top:6px;justify-content:flex-end;align-items:flex-end">'
    +'<div style="flex:1;text-align:right;font-size:7.5px;font-weight:bold;padding-bottom:4px">FIRMA Y SELLO DEL ANESTESISTA</div>'
    +_buildSignBlock(signImg)+'</div>';
  return _printPgOpen(i)+'<h1>FOJA DE ANESTESIA</h1>'
    +'<div class="hoja-n">Hoja '+pageNum+' — Signos vitales (continuaci&#243;n)</div>'
    +'<div class="r"><div style="flex:3"><span class="l">Apellido y nombres</span><div class="f">'+_printEsc(i.pac)+'</div></div>'
    +'<div style="flex:0 0 118px"><span class="l">D.N.I. N&#176;</span><div class="f">'+_printEsc(i.dni)+'</div></div></div>'
    +'<div class="r"><div style="flex:2"><span class="l">Servicio</span><div class="f">'+_printEsc(i.serv)+'</div></div>'
    +'<div style="flex:3"><span class="l">Procedimiento</span><div class="f">'+_printEsc(i.diag)+'</div></div>'
    +'<div style="flex:0 0 64px"><span class="l">Fecha</span><div class="f">'+fmt(i.fecha)+'</div></div>'
    +'<div style="flex:0 0 72px"><span class="l">Sala</span><div class="f">'+_printEsc(i.sala)+'</div></div></div>'
    +_buildChartBlock(chartInner,_printChartH(i,120))
    +obsHtml
    +signHtml
    +'</div>';
}

function _buildObsAdicionalSheet(i,obsText,signImg,pageNum){
  return _printPgOpen(i)+'<h1>FOJA DE ANESTESIA</h1>'
    +'<div class="hoja-n">Observaciones — Hoja '+pageNum+'</div>'
    +'<div class="r"><div style="flex:3"><span class="l">Apellido y nombres</span><div class="f">'+_printEsc(i.pac)+'</div></div>'
    +'<div style="flex:0 0 118px"><span class="l">D.N.I. N&#176;</span><div class="f">'+_printEsc(i.dni)+'</div></div></div>'
    +'<div class="r"><div style="flex:2"><span class="l">Servicio</span><div class="f">'+_printEsc(i.serv)+'</div></div>'
    +'<div style="flex:3"><span class="l">Procedimiento</span><div class="f">'+_printEsc(i.diag)+'</div></div>'
    +'<div style="flex:0 0 64px"><span class="l">Fecha</span><div class="f">'+fmt(i.fecha)+'</div></div></div>'
    +'<div class="s" style="margin-top:10px">Observaciones (continuaci&#243;n):</div>'
    +'<div style="border:1px solid #ccc;padding:6px;font-size:9px;line-height:1.45;word-wrap:break-word">'+_printEsc(obsText)+'</div>'
    +'<div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end">'
    +'<div style="width:180px;text-align:center">'+signImg
    +'<div style="border-top:1.5px solid #000;padding-top:3px;font-size:8px">'
    +((typeof AfIdentidad!=='undefined'&&AfIdentidad.firmaHtml)?AfIdentidad.firmaHtml(_afPrintFirmaOpts):'')
    +'</div></div></div>'
    +'</div>';
}

function imprimirFoja(){
  // Defensa en profundidad: no confiar solo en el botón guarded
  if(typeof checkPlan==='function' && !checkPlan('imprimir')) return;
  if(document.getElementById('f-pac'))guardar();
  if(document.getElementById('fj-tec'))guardarFoja();
  var i=S.cur;if(!i){toast('Complet\u00e1 los datos primero');return;}
  var f=i.foja||{};
  _afPrintFirmaOpts={colegio:!(typeof afFojaEsSisalud==='function'&&afFojaEsSisalud(i.san))};
  // La ventana de impresión NO incluye overlay de secreto médico (solo pantalla app)
  var signSrc=(typeof AfFirma!=='undefined'&&AfFirma.getPng&&AfFirma.getPng())||f.sign||S.signData||'';
  var signImg=signSrc?('<img src="'+signSrc+'" style="max-height:46px;max-width:130px;display:block;margin:0 auto 3px;filter:grayscale(1) brightness(0) contrast(2)">'):('<div style="height:46px"></div>');
  var drogaLines=(f.drogas||[]).map(function(d){return(d.n||'')+' '+(d.d||'')+' '+(d.v||'');}).filter(function(x){return x.trim();}).join(' \u00b7 ');
  var vgCols=(VG.cols&&VG.cols.length)?VG.cols:(f.vg_cols&&f.vg_cols.length?f.vg_cols:[]);
  var vgCells=(VG.cols&&VG.cols.length)?VG.cells:(f.vg_cells||{});
  var vgObs=(VG.cols&&VG.cols.length)?VG.obs:(f.vg_obs||{});
  var vgFluidos=(VG.cols&&VG.cols.length)?VG.fluidos:(f.vg_fluidos||{});

  var perPage=vgCols.length?_chartColsPerPage(vgCols.length):24;
  var chartChunks=[];
  if(!vgCols.length){
    chartChunks.push({start:0,end:0,empty:true});
  } else {
    for(var c=0;c<vgCols.length;c+=perPage){
      chartChunks.push({start:c,end:Math.min(c+perPage,vgCols.length),empty:false});
    }
  }

  var obsFit=_obsFitInBox(f.obs||'');
  var hasChartCont=chartChunks.length>1;
  var obsOverflow=obsFit.overflow||'';
  var lastChartIdx=chartChunks.length-1;

  var pagesHtml='';
  chartChunks.forEach(function(chunk,idx){
    var chartInner=_buildChartHtml(vgCols,vgCells,vgObs,vgFluidos,chunk.start,chunk.end,chunk.empty);
    if(idx===0){
      pagesHtml+=_buildFojaSheet(i,f,drogaLines,signImg,obsFit.main,obsFit.fs,chartInner);
    } else {
      var isLast=idx===lastChartIdx;
      pagesHtml+=_buildChartContinuationSheet(i,f,chartInner,idx+1,isLast?obsOverflow:'',signImg);
    }
  });

  if(!hasChartCont&&obsOverflow){
    pagesHtml+=_buildObsAdicionalSheet(i,obsOverflow,signImg,2);
  }

  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Foja de Anestesia</title><style>'
    +_buildPrintStyles()+'</style></head><body>'+pagesHtml+'</body></html>';

  var w=window.open('','_blank');if(!w){toast('Permitir ventanas emergentes');return;}
  w.document.write(html);w.document.close();
  setTimeout(function(){w.print();},signSrc?700:400);
}
