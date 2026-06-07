// AnesFact -> GECLISA filler v11
// IDs mapeados desde DevTools reales de GECLISA Sanatorio Mayo
(function(){

var SURL='https://xntvibfsuubedplptvzs.supabase.co';
var SKEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudHZpYmZzdXViZWRwbHB0dnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDk2MjgsImV4cCI6MjA5NTkyNTYyOH0.9SaZdO7knkzSREyaUfoOX8nanid9AQwlNbY5VudWcws';

try{window.onbeforeunload=null;}catch(e){}

// ── Obtener documento del iframe con la foja ──────────────────────────
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

// Indicador visual
var toast=document.createElement('div');
toast.style.cssText='position:fixed;bottom:20px;right:20px;background:#1db954;color:#fff;padding:12px 18px;border-radius:10px;font-size:14px;font-family:sans-serif;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,.3)';
toast.textContent='⏳ Cargando datos de AnesFact...';
document.body.appendChild(toast);
function rmToast(){try{document.body.removeChild(toast);}catch(e){}}

// DNI desde la foja — sacar ceros iniciales
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

var clave=getClave();

// XHR compatible con HTTP
function xhrGet(url,ok,fail){
  var x=new XMLHttpRequest();
  x.open('GET',url,true);
  x.setRequestHeader('apikey',SKEY);
  x.setRequestHeader('Authorization','Bearer '+SKEY);
  x.setRequestHeader('Content-Type','application/json');
  x.onload=function(){
    if(x.status===200||x.status===206){
      try{ok(JSON.parse(x.responseText));}
      catch(e){fail('Respuesta inválida: '+e.message);}
    }else{
      fail('Error HTTP '+x.status+': '+x.responseText.slice(0,120));
    }
  };
  x.onerror=function(){fail('Sin conexión a Supabase.');};
  x.send();
}

function cargarDatos(k){
  var url=SURL+'/rest/v1/anesfact_datos?clave=eq.'+encodeURIComponent(k)+'&select=datos&limit=1';
  xhrGet(url,function(rows){
    if(!rows||!rows.length){
      if(k!=='ultimo'){
        toast.textContent='⏳ Buscando último registro...';
        cargarDatos('ultimo');
        return;
      }
      rmToast();
      alert('Sin datos en AnesFact.\nAbrí AnesFact, cargá el paciente y tocá "Enviar a GECLISA" primero.');
      return;
    }
    try{
      var d=JSON.parse(rows[0].datos);
      toast.textContent='✅ Rellenando foja...';
      setTimeout(rmToast,2500);
      rellenar(d);
    }catch(e){rmToast();alert('Error procesando datos: '+e.message);}
  },function(err){rmToast();alert('Error: '+err);});
}

cargarDatos(clave);

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

function setSelect(id,texto){
  var sel=byId(id);if(!sel||!texto)return false;
  var t=String(texto).toLowerCase().replace(/dr\.|dra\./gi,'').trim();
  var opt=Array.from(sel.options).find(function(o){
    var ot=o.text.toLowerCase().replace(/dr\.|dra\./gi,'').trim();
    return ot.indexOf(t)>=0||t.indexOf(ot)>=0||
           // coincidencia por primer apellido
           (t.split(' ')[0].length>3&&ot.indexOf(t.split(' ')[0])>=0);
  });
  if(!opt)return false;
  sel.value=opt.value;
  sel.dispatchEvent(new Event('change',{bubbles:true}));
  return true;
}

function setRadio(idSI,idNO,valor){
  var btn=byId(valor?idSI:idNO);
  if(btn){try{btn.click();}catch(e){}return true;}
  return false;
}

// Convertir fecha ISO a DD/MM/AAAA
function fmtFecha(iso){
  if(!iso)return '';
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(iso))return iso; // ya está en formato correcto
  var p=iso.split('-');
  if(p.length===3)return p[2]+'/'+p[1]+'/'+p[0];
  return iso;
}

// Detectar si hay tubo (anestesia general) por vía aérea o técnica
function esGeneral(d){
  var va=(d.viaAerea||'').toLowerCase();
  var tec=(d.tecnica||d.mantenimiento||'').toLowerCase();
  return /iot|intub|tubo|general|balanceada|tiva/.test(va+' '+tec);
}

// Texto de monitoreo según técnica
function textoMonitoreo(d){
  if(esGeneral(d)){
    return 'Paciente bajo monitoreo cardiovascular con oximetría de pulso, control de tensión arterial cada 5 minutos y medición de capnografía.';
  }
  return 'Paciente bajo monitoreo cardiovascular con oximetría de pulso y control de tensión arterial cada 5 minutos.';
}

// ── Rellenar ──────────────────────────────────────────────────────────
function rellenar(d){
  var ok=0;

  // 1. Diagnóstico
  if(setId('8054',d.diagnostico))ok++;

  // 2. Quirófano (select — mapeo directo desde AnesFact)
  if(d.quirofano){
    if(setSelect('8049',d.quirofano))ok++;
  }

  // 3. Anestesista — buscar HUERTA
  if(setSelect('8057','HUERTA'))ok++;

  // 4. Fecha cirugía DD/MM/AAAA
  if(d.fechaCirugia&&setId('8058',fmtFecha(d.fechaCirugia)))ok++;

  // 5. Horas
  if(d.horaInicio&&setId('8061',d.horaInicio))ok++;
  if(d.horaFin&&setId('8063',d.horaFin))ok++;

  // 6. Cirujano — buscar por apellido
  if(d.cirujano&&setSelect('8065',d.cirujano))ok++;

  // 7. Observaciones — fj-metodos (descripción técnica)
  if(d.metodos&&setId('8070',d.metodos))ok++;

  // 8. Medicamentos generales — texto de monitoreo según técnica
  if(setId('8075',textoMonitoreo(d)))ok++;

  // 9. Medicamentos anestésicos — drogas
  if(d.medicamentos&&setId('8077',d.medicamentos))ok++;

  // 10. Materiales descartables — tubo o aguja según técnica
  if(d.materiales&&setId('8079',d.materiales))ok++;

  // 11. Evaluación preanestésica
  if(d.edad&&setId('8083',d.edad))ok++;
  if(d.peso&&setId('8085',d.peso))ok++;

  // 12. ASA
  if(d.asa&&setSelect('8090',String(d.asa)))ok++;

  // 13. Monitoreo radios SI/NO
  setRadio('8095','8096',d.monEtco2!==false);   // EtCO2
  setRadio('8099','8100',d.monPam!==false);      // PAM
  setRadio('8103','8104',d.monEcg!==false);      // ECG
  setRadio('8107','8108',d.monSato2!==false);    // SAT O2
  setRadio('8111','8112',d.monPani!==false);     // PANI
  setRadio('8115','8116',d.monDecub||false);     // PROT.DECUB
  ok+=6;

  // 14. Premedicación (campo específico) + antibiótico
  var premed=d.premedicacion||'';
  if(d.antibioticoprofilaxis)premed+=(premed?' / ':'')+d.antibioticoprofilaxis;
  if(premed&&setId('8119',premed))ok++;

  // 15. Inducción
  if(d.induccion&&setId('8121',d.induccion))ok++;

  // 16. Mantenimiento
  if(d.mantenimiento&&setId('8123',d.mantenimiento))ok++;

  // 17. Fluidos
  if(d.fluido1&&setId('8448',d.fluido1))ok++;

  // 18. Recuperación
  if(d.recuperacion&&setId('8458',d.recuperacion))ok++;

  // 19. Signos vitales — grilla
  try{
    if(d.vitals&&d.vitals.length){
      // Nombres por columna (SIST): cols 1-13 usan txtd_, 14+ sin prefijo
      var sistIds=['8134','8140','8147','8153','8159','8166','8172','8178','8185','8191','8197','8204','8210','8216','8222','8223','8224'];
      // Cada fila tiene 6 valores: SIST, DIAST, SAT02, ECO2, FC, PAM
      // Los IDs siguen un patrón: SIST+1=DIAST, +2=SAT02, +3=ECO2, +4=FC, +5=PAM (aprox)
      d.vitals.forEach(function(v,idx){
        if(idx>=sistIds.length)return;
        var base=parseInt(sistIds[idx]);
        var vals=[v.sist,v.diast,v.sato2,v.eco2,v.fc,v.pam];
        vals.forEach(function(val,ci){
          if(val===undefined||val==='')return;
          var el=D.getElementById(String(base+ci));
          if(el)setVal(el,String(val));
        });
      });
      ok+=d.vitals.length;
    }
  }catch(e){}

  alert('AnestFact → GECLISA ✓\n'+ok+' campos rellenados.\nRevisá y hacé clic en GRABAR.');
}

})();void(0);
