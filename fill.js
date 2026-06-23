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
  // Intentar con apellido+nombre visible en la foja
  try{
    var ap=D.getElementById('8027');
    var nm=D.getElementById('8028');
    var fe=D.getElementById('8058');
    if(ap&&ap.value){
      var nom=(ap.value+'_'+(nm?nm.value:'')).trim().replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'').slice(0,20);
      var fec=(fe&&fe.value?fe.value.replace(/\//g,''):'');
      if(nom)return nom+(fec?'_'+fec:'');
    }
  }catch(e){}
  return 'ultimo';
}

function verificarPaciente(d){
  // Verificar que los datos son del paciente correcto antes de pegar
  try{
    var apEl=D.getElementById('8027');
    var apGeclisa=(apEl?apEl.value:'').toLowerCase().trim();
    var apAnesfact=(d.apellido||'').toLowerCase().trim();
    if(apGeclisa&&apAnesfact&&apGeclisa.length>2&&apAnesfact.length>2){
      // Comparar primer apellido
      var ap1=apGeclisa.split(/\s+/)[0];
      var ap2=apAnesfact.split(/[\s,]+/)[0];
      if(ap1&&ap2&&ap1!==ap2&&ap2.indexOf(ap1)<0&&ap1.indexOf(ap2)<0){
        return confirm('⚠️ ATENCIÓN\nDatos guardados: '+d.apellido+'\nPaciente en GECLISA: '+(apEl?apEl.value:'')+'\n\n¿Los datos son correctos? Presioná Cancelar para NO rellenar.');
      }
    }
  }catch(e){}
  return true;
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
      if(!verificarPaciente(d)){rmToast();return;}
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
  // 8072 Nivel Regional — ya viene vacío del payload si no aplica
  if(d.nivelRegional)setId('8072',d.nivelRegional);
  if(setId('8075',textoMonitoreo(d)))ok++;                     // Medicamentos generales = monitoreo
  if(d.medicamentos&&setId('8077',d.medicamentos))ok++;        // Medicamentos anestésicos
  if(d.materiales&&setId('8079',d.materiales))ok++;            // Materiales descartables

  // BLOQUE 4 — Evaluación preanestésica y monitoreo
  if(d.edad&&setId('8083',d.edad))ok++;                        // Edad
  if(d.peso&&setId('8085',d.peso))ok++;                        // Peso
  if(d.examenFisico&&setId('8088',d.examenFisico))ok++;      // Examen físico (Mallampati + auscultación)
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

  // BLOQUE 6 — Signos vitales (grilla Mayo)
  // IDs base de SIST por tiempo (cada columna: +0=SIST +1=DIAST +2=SAT02 +3=ECO2 +4=FC +5=PAM)
  var tiemposVitals=[
    {min:5,   base:8134},
    {min:15,  base:8147},
    {min:30,  base:8166},
    {min:45,  base:8185},
    {min:60,  base:8204},
    {min:75,  base:8222},
    {min:90,  base:8225},
    {min:105, base:8228},
    {min:120, base:8231},
    {min:125, base:8289},
    {min:135, base:8291},
    {min:150, base:8295},
    {min:165, base:8299},
    {min:180, base:8303},
    {min:195, base:8307},
    {min:210, base:8311},
    {min:225, base:8315},
    {min:240, base:8319}
  ];
  try{
    if(d.vitals&&d.vitals.length){
      d.vitals.forEach(function(v){
        // Buscar el tiempo que corresponde
        var min=parseInt(v.min)||0;
        var tv=tiemposVitals.find(function(t){return t.min===min;});
        if(!tv)return;
        var base=tv.base;
        var vals=[v.sist,v.diast,v.sato2,v.eco2,v.fc,v.pam];
        vals.forEach(function(val,ci){
          if(val===undefined||val===null||val==='')return;
          var el=D.getElementById(String(base+ci));
          if(el)setVal(el,String(val));
        });
        ok++;
      });
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
