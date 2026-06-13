// AnesFact -> GECLISA filler v13
// IDs mapeados al 100% desde DevTools reales de GECLISA Sanatorio Mayo
// Acceso: iframe[0].contentDocument (340+ inputs)
(function(){

var SURL='https://xntvibfsuubedplptvzs.supabase.co';
var SKEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudHZpYmZzdXViZWRwbHB0dnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDk2MjgsImV4cCI6MjA5NTkyNTYyOH0.9SaZdO7knkzSREyaUfoOX8nanid9AQwlNbY5VudWcws';

try{window.onbeforeunload=null;}catch(e){}

// ── Obtener documento del iframe con la foja (>50 inputs) ─────────────
var D=null;
try{
  var frs=document.querySelectorAll('iframe');
  for(var i=0;i<frs.length;i++){
    try{
      var td=frs[i].contentDocument||frs[i].contentWindow.document;
      if(td&&td.querySelectorAll('input').length>50){D=td;break;}
    }catch(e){}
  }
}catch(e){}

if(!D||!D.getElementById('8054')){
  alert('No estás en la Foja Anestésica.\nNavegá hasta la foja del paciente y ejecutá el marcador.');
  return void(0);
}

// Toast
var toast=document.createElement('div');
toast.style.cssText='position:fixed;bottom:20px;right:20px;background:#1db954;color:#fff;padding:12px 18px;border-radius:10px;font-size:14px;font-family:sans-serif;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,.3)';
toast.textContent='\u23f3 Cargando datos de AnesFact...';
document.body.appendChild(toast);
function rmToast(){try{document.body.removeChild(toast);}catch(e){}}

// DNI desde foja — sacar ceros iniciales
function getClave(){
  try{
    var el=D.getElementById('8031');
    if(el&&el.value){
      var v=el.value.trim().replace(/^0+/,'');
      if(/^\d{7,9}$/.test(v))return v;
    }
  }catch(e){}
  return 'ultimo';
}

// XHR compatible con HTTP (sin bloqueo Mixed Content)
function xhrGet(url,ok,fail){
  var x=new XMLHttpRequest();
  x.open('GET',url,true);
  x.setRequestHeader('apikey',SKEY);
  x.setRequestHeader('Authorization','Bearer '+SKEY);
  x.setRequestHeader('Content-Type','application/json');
  x.onload=function(){
    if(x.status===200||x.status===206){
      try{ok(JSON.parse(x.responseText));}
      catch(e){fail('Respuesta invalida: '+e.message);}
    }else{
      fail('Error HTTP '+x.status+': '+x.responseText.slice(0,120));
    }
  };
  x.onerror=function(){fail('Sin conexion a Supabase.');};
  x.send();
}

function cargarDatos(k){
  var url=SURL+'/rest/v1/anesfact_datos?clave=eq.'+encodeURIComponent(k)+'&select=datos&limit=1';
  xhrGet(url,function(rows){
    if(!rows||!rows.length){
      if(k!=='ultimo'){
        toast.textContent='\u23f3 Buscando ultimo registro...';
        cargarDatos('ultimo');
        return;
      }
      rmToast();
      alert('Sin datos.\nAbri AnesFact, carga el paciente y toca "Enviar a GECLISA" primero.');
      return;
    }
    try{
      var d=JSON.parse(rows[0].datos);
      toast.textContent='\u2705 Rellenando foja...';
      setTimeout(rmToast,2500);
      rellenar(d);
    }catch(e){rmToast();alert('Error procesando datos: '+e.message);}
  },function(err){rmToast();alert('Error: '+err);});
}

cargarDatos(getClave());

// ── Helpers ───────────────────────────────────────────────────────────
function setVal(el,val){
  if(!el||val===undefined||val===null||String(val).trim()==='')return false;
  try{
    var desc=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value');
    if(desc&&desc.set)desc.set.call(el,String(val));
    else el.value=String(val);
  }catch(e){try{el.value=String(val);}catch(e2){return false;}}
  try{el.dispatchEvent(new Event('input',{bubbles:true}));}catch(e){}
  try{el.dispatchEvent(new Event('change',{bubbles:true}));}catch(e){}
  return true;
}

function byId(id){return D.getElementById(String(id));}
function setId(id,val){return setVal(byId(id),val);}

// Normalizar — quita tildes, DR./DRA., espacios extra
function norm(s){
  return String(s||'').toLowerCase()
    .replace(/dr\.|dra\./gi,'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\s+/g,' ').trim();
}

function setSelect(id,texto){
  var sel=byId(id);if(!sel||!texto)return false;
  var t=norm(texto);
  var opt=Array.from(sel.options).find(function(o){return norm(o.text)===t;});
  if(!opt)opt=Array.from(sel.options).find(function(o){return norm(o.text).indexOf(t)>=0;});
  if(!opt)opt=Array.from(sel.options).find(function(o){
    var on=norm(o.text);
    return on.length>3&&t.indexOf(on.split(' ')[0])>=0;
  });
  if(!opt){
    var ap=t.split(' ')[0];
    if(ap.length>3)opt=Array.from(sel.options).find(function(o){
      return norm(o.text).indexOf(ap)>=0;
    });
  }
  if(!opt)return false;
  sel.value=opt.value;
  sel.dispatchEvent(new Event('change',{bubbles:true}));
  return true;
}

function setRadio(idSI,idNO,valor){
  var btn=byId(valor?idSI:idNO);
  if(btn){
    btn.checked=true;
    try{btn.click();}catch(e){}
    try{btn.dispatchEvent(new Event('change',{bubbles:true}));}catch(e){}
    return true;
  }
  return false;
}

// ISO AAAA-MM-DD -> DD/MM/AAAA
function fmtFecha(s){
  if(!s)return '';
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(s))return s;
  var p=s.split('-');
  return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s;
}

// Texto monitoreo segun tecnica
function textoMonitoreo(d){
  var va=(d.viaAerea||'').toLowerCase();
  var tec=(d.tecnica||d.mantenimiento||d.induccion||'').toLowerCase();
  var esGen=/iot|intub|tubo|general|balanceada|tiva/.test(va+' '+tec);
  return esGen
    ? 'Paciente bajo monitoreo cardiovascular con oximetria de pulso, control de tension arterial cada 5 minutos y medicion de capnografia.'
    : 'Paciente bajo monitoreo cardiovascular con oximetria de pulso y control de tension arterial cada 5 minutos.';
}

// ── Inyectar CSS correctivo en el iframe ─────────────────────────────
function inyectarCSS(){
  try{
    var st=D.createElement('style');
    st.innerHTML=[
      'input[id="8134"],input[id="8140"],input[id="8147"],input[id="8153"],input[id="8159"],',
      'input[id="8166"],input[id="8172"],input[id="8178"],input[id="8185"],input[id="8191"],',
      'input[id="8197"],input[id="8204"],input[id="8210"],input[id="8216"],input[id="8222"],',
      'input[id="8223"],input[id="8224"],',
      'input[name^="txtd_"],input[name^="SIST"],input[name^="DIAST"],input[name^="SAT"],',
      'input[name^="ECO"],input[name^="FC"],input[name^="PAM"]{',
      'width:52px!important;min-width:52px!important;max-width:52px!important;',
      'box-sizing:border-box!important;text-align:center!important;',
      'padding:2px!important;font-size:11px!important;}',
      'table{table-layout:fixed!important;}',
      'td,th{overflow:hidden!important;}'
    ].join('');
    D.head.appendChild(st);
  }catch(e){}
}

// ── Rellenar ──────────────────────────────────────────────────────────
function rellenar(d){
  inyectarCSS();
  var ok=0;

  // BLOQUE 1 — Quirófano y tiempos
  if(d.quirofano&&setSelect('8049',d.quirofano))ok++;          // Quirófano
  if(d.tipoCirugia&&setSelect('8050',d.tipoCirugia))ok++;      // Tipo cirugía
  if(d.fechaCirugia&&setId('8058',fmtFecha(d.fechaCirugia)))ok++; // Fecha DD/MM/AAAA
  if(d.horaInicio&&setId('8061',d.horaInicio))ok++;            // Hora inicio HH:MM
  if(d.horaFin&&setId('8063',d.horaFin))ok++;                  // Hora fin HH:MM

  // BLOQUE 2 — Staff y posición
  if(setSelect('8057',d.anestesista||'HUERTA'))ok++;           // Anestesista
  if(d.cirujano&&setSelect('8065',d.cirujano))ok++;            // Cirujano
  if(d.posicion&&setSelect('8067',d.posicion))ok++;            // Posición

  // BLOQUE 3 — Textos libres
  if(d.diagnostico&&setId('8054',d.diagnostico))ok++;          // Diagnóstico
  if(d.metodos&&setId('8070',d.metodos))ok++;                  // Observaciones (metodos)
  // 8072 Nivel Regional — solo si es bloqueo, dejar vacio si general
  var esBloqueo=/raquid|bloqueo|peridural|regional|espinal/i.test(
    (d.tecnica||d.mantenimiento||d.induccion||''));
  if(esBloqueo&&d.nivelRegional)setId('8072',d.nivelRegional);
  if(setId('8075',textoMonitoreo(d)))ok++;                     // Medicamentos generales = monitoreo
  if(d.medicamentos&&setId('8077',d.medicamentos))ok++;        // Medicamentos anestésicos
  if(d.materiales&&setId('8079',d.materiales))ok++;            // Materiales descartables

  // BLOQUE 4 — Evaluación preanestésica y monitoreo
  if(d.edad&&setId('8083',d.edad))ok++;                        // Edad
  if(d.peso&&setId('8085',d.peso))ok++;                        // Peso
  if(d.observaciones&&setId('8088',d.observaciones))ok++;      // Examen físico / antecedentes
  if(d.asa){
    var asaV=String(d.asa).replace(/ASA\s*/i,'').trim();
    if(setSelect('8090',asaV))ok++;                            // Riesgo ASA
  }
  if(d.tipoCirugia&&d.tipoCirugia.toLowerCase()==='urgencia'){
    var emerg=byId('8091');
    if(emerg){emerg.checked=true;ok++;}                        // EMERGENCIA checkbox
  }
  // Monitoreo radios SI/NO
  setRadio('8095','8096',d.monEtco2!==false);    // EtCO2
  setRadio('8099','8100',d.monPam!==false);       // PAM
  setRadio('8103','8104',d.monEcg!==false);       // ECG
  setRadio('8107','8108',d.monSato2!==false);     // SAT O2
  setRadio('8111','8112',d.monPani!==false);      // PANI
  setRadio('8115','8116',d.monDecub||false);      // PROT.DECUB
  ok+=6;

  // BLOQUE 5 — Protocolo farmacológico
  var premed=d.premedicacion||'';
  if(d.antibioticoprofilaxis)premed+=(premed?' / ':'')+d.antibioticoprofilaxis;
  if(premed&&setId('8119',premed))ok++;           // Premedicación (typo nativo: txt_premeicacion)
  if(d.induccion&&setId('8121',d.induccion))ok++;             // Inducción
  if(d.mantenimiento&&setId('8123',d.mantenimiento))ok++;     // Mantenimiento (typo nativo: MANTEMIENTO)

  // BLOQUE 6 — Signos vitales (grilla 108 inputs)
  // IDs SIST por columna temporal:
  var sistIds=[8134,8140,8147,8153,8159,8166,8172,8178,8185,
               8191,8197,8204,8210,8216,8222,8223,8224];
  // Cada columna: SIST(+0), DIAST(+1), SAT02(+2), ECO2(+3), FC(+4), PAM(+5)
  try{
    if(d.vitals&&d.vitals.length){
      d.vitals.forEach(function(v,idx){
        if(idx>=sistIds.length)return;
        var base=sistIds[idx];
        var vals=[v.sist,v.diast,v.sato2,v.eco2,v.fc,v.pam];
        vals.forEach(function(val,ci){
          if(val===undefined||val===null||val==='')return;
          var el=D.getElementById(String(base+ci));
          if(el)setVal(el,String(val));
        });
      });
      ok+=d.vitals.length;
    }
  }catch(e){}

  // BLOQUE 7 — Balances y cierre
  // Fluidos — dos inputs correlativos, buscar por posicion relativa
  try{
    var allInp=Array.from(D.querySelectorAll('input[type=text],input:not([type])'));
    var rec=D.getElementById('8458');
    var recIdx=allInp.indexOf(rec);
    // Fluidos, orina, sangrado estan antes de recuperacion
    // Buscar inputs numericos antes del 8458
    if(d.fluido1){
      var flu=D.querySelector('input[name*="fluido"],input[name*="FLUIDO"]');
      if(!flu){
        // Buscar por posicion: ~10 inputs antes de recuperacion
        if(recIdx>10)flu=allInp[recIdx-10];
      }
      if(flu)setVal(flu,d.fluido1);
    }
  }catch(e){}

  // Orina y sangrado — solo si tienen valor distinto de 0
  // (no pisar campos si no hay dato real)
  if(d.orina&&d.orina!=='0'&&d.orina!==0){
    var orinaEl=D.querySelector('input[name*="orina"],input[name*="ORINA"]');
    if(orinaEl)setVal(orinaEl,String(d.orina));
  }
  if(d.sangrado&&d.sangrado!=='0'&&d.sangrado!==0){
    var sangEl=D.querySelector('input[name*="sangrado"],input[name*="SANGRADO"],input[name*="sangre"]');
    if(sangEl)setVal(sangEl,String(d.sangrado));
  }

  // Recuperación — id=8458
  if(d.recuperacion&&setId('8458',d.recuperacion))ok++;

  alert('AnestFact \u2192 GECLISA \u2713\n'+ok+' campos rellenados.\nRevisa y haz clic en GRABAR.');
}

})();void(0);