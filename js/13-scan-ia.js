var PROMPT='Analizá todas las imágenes adjuntas (foja anestésica, quirúrgica y/o autorización). De la AUTORIZACIÓN extraé: afiliado, obra social, diagnóstico. SOLO JSON sin markdown:\n{"fecha":"DD/MM/AAAA","hora_inicio":"HH:MM","paciente":"APELLIDO Nombre","edad":null,"sexo":null,"dni":null,"peso":null,"obra_social":null,"afiliado":null,"cirujano":null,"sanatorio":null,"diagnostico":null,"tecnica":null,"asa":null,"obesidad":false,"premedicacion":null,"induccion":null,"hora_intubacion":null,"hora_extubacion":null,"hora_fin":null,"drogas":[{"n":"","d":"","v":""}],"metodos":null,"recuperacion":null,"practicas":["desc"],"observaciones":null,"suero":null,"sangre":null,"plasma":null,"confianza":"alta|media|baja","dudosos":[]}';
function onFiles(files){
  S.pendFiles=[];for(var k=0;k<files.length;k++){if(files[k].type.startsWith('image/')||files[k].type==='application/pdf')S.pendFiles.push(files[k]);}
  if(!S.pendFiles.length){toast('Solo imágenes o PDF');return;}
  var html='';S.pendFiles.forEach(function(f){html+='<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:22px">'+(f.type==='application/pdf'?'📄':'🖼')+'</span><div><div style="font-size:13px">'+f.name+'</div><div style="font-size:11px;color:var(--text3)">'+(f.size/1024).toFixed(0)+' KB</div></div></div>';});
  document.getElementById('file-prev').innerHTML=html;document.getElementById('btn-extraer').style.display='block';document.getElementById('err-panel').classList.remove('on');
}
function setSpin(on,msg){document.getElementById('spin-wrap').className='spin-wrap'+(on?' on':'');if(msg)document.getElementById('spin-msg').textContent=msg;}
function extraer(){
  if(!S.key){toast('Primero guardá la API Key');return;}if(!S.pendFiles.length){toast('Seleccioná archivos');return;}
  document.getElementById('err-panel').classList.remove('on');setSpin(true,'Procesando...');document.getElementById('btn-extraer').style.display='none';
  Promise.all(S.pendFiles.map(function(f){return new Promise(function(ok,fail){var r=new FileReader();r.onload=function(){ok({data:r.result.split(',')[1],mime:f.type||'image/jpeg'});};r.onerror=function(){fail(new Error('Error leyendo '+f.name));};r.readAsDataURL(f);});}))
  .then(function(imgs){setSpin(true,'Enviando a Gemini...');var parts=[{text:PROMPT}];imgs.forEach(function(img){parts.push({inline_data:{mime_type:img.mime,data:img.data}});});return fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key='+S.key,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:parts}]})});})
  .then(function(res){setSpin(true,'Interpretando...');return res.text().then(function(raw){if(!res.ok){var msg='HTTP '+res.status;try{msg=JSON.parse(raw).error.message;}catch(e){}throw new Error(msg);}return raw;});})
  .then(function(raw){var api=JSON.parse(raw);var txt=(api.candidates&&api.candidates[0]&&api.candidates[0].content&&api.candidates[0].content.parts&&api.candidates[0].content.parts[0]&&api.candidates[0].content.parts[0].text)||'';if(!txt)throw new Error('Respuesta vacía');aplicarIA(JSON.parse(txt.replace(/^```json\s*/,'').replace(/\s*```$/,'').trim()));setSpin(false);document.getElementById('btn-extraer').style.display='block';})
  .catch(function(e){document.getElementById('err-msg').textContent=e.message;document.getElementById('err-panel').classList.add('on');setSpin(false);document.getElementById('btn-extraer').style.display='block';});
}
function aplicarIA(j){
  var base={id:Date.now()+'',estado:'borrador',fecha:new Date().toISOString().slice(0,10),hora:'',pac:'',edad:'',sexo:'',dni:'',peso:'',ciru:'',serv:'',diag:'',san:'Hospital Aeronáutico',sala:'',cama:'',mayo_sector:'',mayo_cama:'',obra:'',afil:'',docs:{},ob:false,env:true,pracs:[],foja:{drogas:[],vitals:[]}};
  if(!S.cur)S.cur=base;
  var m={paciente:'pac',hora_inicio:'hora',obra_social:'obra',afiliado:'afil',cirujano:'ciru',sanatorio:'san',dni:'dni',diagnostico:'diag',sexo:'sexo'};
  Object.keys(m).forEach(function(k){if(j[k])S.cur[m[k]]=j[k];});
  if(j.diagnostico)S.cur.diag=Array.isArray(j.diagnostico)?j.diagnostico.filter(Boolean).join('. '):String(j.diagnostico);
  if(j.edad)S.cur.edad=String(j.edad);if(j.peso)S.cur.peso=String(j.peso);
  if(j.fecha)S.cur.fecha=argToISO(j.fecha);if(j.obesidad!==undefined)S.cur.ob=j.obesidad;
  if(!S.cur.foja)S.cur.foja={drogas:[],vitals:[]};
  var fm={tecnica:'tec',asa:'asa',premedicacion:'premed',induccion:'ind',hora_intubacion:'hint',hora_extubacion:'hext',hora_fin:'fin',observaciones:'obs',metodos:'metodos',recuperacion:'recup'};
  Object.keys(fm).forEach(function(k){if(j[k])S.cur.foja[fm[k]]=String(j[k]);});
  if(j.suero)S.cur.foja.suero=j.suero+' ml';if(j.sangre)S.cur.foja.sangre=j.sangre+' ml';if(j.plasma)S.cur.foja.plasma=j.plasma+' ml';
  if(j.drogas&&j.drogas.length)S.cur.foja.drogas=j.drogas;
  if(j.practicas&&j.practicas.length)j.practicas.forEach(function(p){S.cur.pracs.push({cod:'?',desc:p,comp:0});});
  var conf=j.confianza||'media';
  var badge=document.getElementById('ia-badge');badge.style.display='block';
  badge.innerHTML='<span class="badge '+(conf==='alta'?'bg':conf==='media'?'by':'br')+'">IA: '+conf+'</span>'+(j.dudosos&&j.dudosos.length?' <span class="badge by">⚠ '+j.dudosos.length+' dudoso(s)</span>':'');
  cargarForm(S.cur);go('facturacion');toast('Datos extraídos ✓ — revisá facturación evweb');
}

