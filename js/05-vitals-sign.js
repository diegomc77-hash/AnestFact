function generarFilasVitales(){
  var elH=document.getElementById('foja-hora-inicio');
  var horaI=(S.cur&&S.cur.hora)||(elH&&elH.value)||'';
  var horaF=document.getElementById('fj-fin').value||(S.cur&&S.cur.foja&&S.cur.foja.fin)||'';
  if(!horaI){toast('Completá la hora de inicio primero');return;}
  var startMin=parseInt(horaI.split(':')[0])*60+parseInt(horaI.split(':')[1]);
  var endMin=horaF?(parseInt(horaF.split(':')[0])*60+parseInt(horaF.split(':')[1])):startMin+60;
  S.vitals=[];
  for(var t=startMin;t<=endMin;t+=5){
    var hh=Math.floor(t/60)%24,mm=t%60;
    S.vitals.push({t:(hh<10?'0':'')+hh+':'+(mm<10?'0':'')+mm,ta_s:'',ta_d:'',fc:'',spo2:'',etco2:'',fr:''});
  }
  renderVitals();toast('Filas generadas: '+S.vitals.length);
}
function addVitalRow(){S.vitals.push({t:'',ta_s:'',ta_d:'',fc:'',spo2:'',etco2:'',fr:''});renderVitals();}
function renderVitals(){
  var tb=document.getElementById('vitals-body');if(!tb)return;
  if(!S.vitals||!S.vitals.length){tb.innerHTML='<tr><td colspan="7" style="padding:10px;color:var(--text3);font-size:12px">Sin registros</td></tr>';return;}
  tb.innerHTML=S.vitals.map(function(row,i){
    return '<tr>'
      +'<td><input value="'+(row.t||'')+'" placeholder="08:00" oninput="editV('+i+',\'t\',this.value)" style="min-width:48px"></td>'
      +'<td><div class="ta-wrap"><input value="'+(row.ta_s||'')+'" placeholder="120" oninput="editV('+i+',\'ta_s\',this.value)" style="min-width:28px"><span class="ta-sep">/</span><input value="'+(row.ta_d||'')+'" placeholder="80" oninput="editV('+i+',\'ta_d\',this.value)" style="min-width:28px"></div></td>'
      +'<td><input value="'+(row.fc||'')+'" placeholder="70" oninput="editV('+i+',\'fc\',this.value)"></td>'
      +'<td><input value="'+(row.spo2||'')+'" placeholder="99" oninput="editV('+i+',\'spo2\',this.value)"></td>'
      +'<td><input value="'+(row.etco2||'')+'" placeholder="35" oninput="editV('+i+',\'etco2\',this.value)"></td>'
      +'<td><input value="'+(row.fr||'')+'" placeholder="14" oninput="editV('+i+',\'fr\',this.value)"></td>'
      +'<td><button onclick="delV('+i+')" style="background:none;border:none;color:var(--red);font-size:16px;cursor:pointer;line-height:1">×</button></td>'
      +'</tr>';
  }).join('');
}
function editV(i,k,v){if(S.vitals&&S.vitals[i])S.vitals[i][k]=v;}
function delV(i){S.vitals.splice(i,1);renderVitals();}

// ═══════════════════════════════════════════════════
// FIRMA
// ═══════════════════════════════════════════════════
var _sD=false,_sCtx=null,_sEl=null;
function initSign(){
  // Preferir firma certificada de cuenta (Ajustes); sin canvas por foja
  if(typeof AfFirma!=='undefined'){
    if(AfFirma.isCertificada&&AfFirma.isCertificada()){
      S.signData=AfFirma.getPng();
      if(typeof AfFirma.applyFojaPreview==='function')AfFirma.applyFojaPreview();
      return;
    }
    if(typeof AfFirma.applyFojaPreview==='function')AfFirma.applyFojaPreview();
  }
  var c=document.getElementById('sign-canvas');if(!c)return;_sEl=c;
  c.width=c.offsetWidth||380;c.height=110;
  _sCtx=c.getContext('2d');
  _sCtx.strokeStyle='#000';_sCtx.lineWidth=2;_sCtx.lineCap='round';_sCtx.lineJoin='round';
  _sCtx.clearRect(0,0,c.width,c.height);
  if(S.signData){var img=new Image();img.onload=function(){_sCtx.drawImage(img,0,0);};img.src=S.signData;}
  c.onpointerdown=function(e){_sD=true;c.setPointerCapture(e.pointerId);_sCtx.beginPath();var r=c.getBoundingClientRect();_sCtx.moveTo(e.clientX-r.left,e.clientY-r.top);};
  c.onpointermove=function(e){if(!_sD)return;var r=c.getBoundingClientRect();_sCtx.lineTo(e.clientX-r.left,e.clientY-r.top);_sCtx.stroke();};
  c.onpointerup=c.onpointercancel=function(){_sD=false;};
}
function clearSign(){if(_sCtx&&_sEl){_sCtx.clearRect(0,0,_sEl.width,_sEl.height);S.signData=null;toast('Firma borrada');}}
function saveSign(){if(_sEl){S.signData=_sEl.toDataURL('image/png');toast('Firma guardada ✓');}}

