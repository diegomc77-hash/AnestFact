// AnesFact -> GECLISA filler v10
// IDs mapeados desde DevTools reales de GECLISA Sanatorio Mayo
// Acceso: document.querySelectorAll('iframe')[0].contentDocument
(function(){

var SURL='https://xntvibfsuubedplptvzs.supabase.co';
var SKEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudHZpYmZzdXViZWRwbHB0dnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDk2MjgsImV4cCI6MjA5NTkyNTYyOH0.9SaZdO7knkzSREyaUfoOX8nanid9AQwlNbY5VudWcws';

try{window.onbeforeunload=null;}catch(e){}

// ── Obtener documento del iframe correcto ─────────────────────────────
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

if(!D){
  alert('No se encontró la foja anestésica.\nAsegurate de estar en la Foja Anestésica del paciente.');
  return void(0);
}

// Verificar que es la foja correcta buscando campo diagnóstico
if(!D.getElementById('8054')){
  alert('No estás en la Foja Anestésica.\nNavegá hasta la foja del paciente y ejecutá el marcador.');
  return void(0);
}

// Indicador visual
var toast=document.createElement('div');
toast.style.cssText='position:fixed;bottom:20px;right:20px;background:#1db954;color:#fff;padding:12px 18px;border-radius:10px;font-size:14px;font-family:sans-serif;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,.3)';
toast.textContent='⏳ Cargando datos de AnesFact...';
document.body.appendChild(toast);
function rmToast(){try{document.body.removeChild(toast);}catch(e){}}

// Detectar DNI del paciente desde la foja
function getClave(){
  try{
    var dniEl=D.getElementById('8031');// txt_dni
    if(dniEl&&dniEl.value){
      var v=dniEl.value.trim().replace(/^0+/,'');// sacar ceros iniciales
      if(/^\d{7,9}$/.test(v))return v;
    }
  }catch(e){}
  return 'ultimo';
}

var clave=getClave();

// XHR — funciona en HTTP sin bloqueo Mixed Content
function xhrGet(url,ok,fail){
  var x=new XMLHttpRequest();
  x.open('GET',url,true);
  x.setRequestHeader('apikey',SKEY);
  x.setRequestHeader('Authorization','Bearer '+SKEY);
  x.setRequestHeader('Content-Type','application/json');
  x.setRequestHeader('Prefer','return=representation');
  x.onload=function(){
    if(x.status===200||x.status===206){
      try{ok(JSON.parse(x.responseText));}
      catch(e){fail('Respuesta invalida: '+e.message);}
    } else {
      fail('Error HTTP '+x.status+': '+x.responseText.slice(0,100));
    }
  };
  x.onerror=function(){fail('Sin conexion a Supabase. Verificar red.');};
  x.send();
}

function cargarDatos(k){
  var url=SURL+'/rest/v1/anesfact_datos?clave=eq.'+encodeURIComponent(k)+'&select=datos&limit=1';
  console.log('AnesFact fetch URL:',url);
  xhrGet(url,function(rows){
    if(!rows||!rows.length){
      if(k!=='ultimo'){toast.textContent='⏳ Buscando último paciente...';cargarDatos('ultimo');return;}
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

function byId(id){return D.getElementById(id);}

function setId(id,val){return setVal(byId(id),val);}

function setSelect(id,texto){
  var sel=byId(id);if(!sel)return false;
  var t=(texto||'').toLowerCase();
  var opt=Array.from(sel.options).find(function(o){
    return o.text.toLowerCase().indexOf(t)>=0||o.value.toLowerCase()===t;
  });
  if(!opt)return false;
  sel.value=opt.value;
  sel.dispatchEvent(new Event('change',{bubbles:true}));
  return true;
}

// Clickear radio SI o NO de un grupo (name = el name compartido)
function setRadio(nameSI,nameNO,valor){
  // nameSI = id del botón SI, nameNO = id del botón NO
  var btn=byId(valor?nameSI:nameNO);
  if(btn){try{btn.click();}catch(e){}return true;}
  return false;
}

// ── Rellenar ──────────────────────────────────────────────────────────
function rellenar(d){
  var ok=0;

  // 1. Datos del paciente (ya vienen de GECLISA, pero por si acaso)
  // 8027=apellido 8028=nombre 8031=dni 8033=edad 8085=peso

  // 2. Diagnóstico / cx realizada
  if(setId('8054',d.diagnostico))ok++;

  // 3. Quirófano
  if(d.quirofano&&setSelect('8049',d.quirofano))ok++;

  // 4. Anestesista — buscar HUERTA en el select
  if(setSelect('8057','HUERTA'))ok++;

  // 5. Fecha cirugía
  if(d.fecha&&setId('8058',d.fecha))ok++;

  // 6. Hora inicio y fin
  if(d.horaInicio&&setId('8061',d.horaInicio))ok++;
  if(d.horaFin&&setId('8063',d.horaFin))ok++;

  // 7. Cirujano
  if(d.cirujano&&setSelect('8065',d.cirujano))ok++;

  // 8. Observaciones
  if(setId('8070',d.observaciones))ok++;

  // 9. Premedicación (medicamentos generales)
  var med=d.premedicacion||'';
  if(d.antibioticoprofilaxis)med+=(med?' / ':'')+d.antibioticoprofilaxis;
  if(setId('8075',med))ok++;

  // 10. Medicamentos anestésicos (drogas)
  if(d.drogas&&setId('8077',d.drogas))ok++;

  // 11. Evaluación preanestésica
  if(d.edad&&setId('8083',d.edad))ok++;
  if(d.peso&&setId('8085',d.peso))ok++;

  // 12. Examen físico / antecedentes
  if(d.antecedentes&&setId('8088',d.antecedentes))ok++;

  // 13. ASA
  if(d.asa&&setSelect('8090',String(d.asa)))ok++;

  // 14. Monitoreo — radios SI/NO
  // EtCO2: id 8095=SI, 8096=NO
  setRadio('8095','8096',d.monEtco2!==false);if(d.monEtco2!==false)ok++;
  // PAM: 8099=SI, 8100=NO
  setRadio('8099','8100',d.monPam!==false);if(d.monPam!==false)ok++;
  // ECG: 8103=SI, 8104=NO
  setRadio('8103','8104',d.monEcg!==false);if(d.monEcg!==false)ok++;
  // SAT O2: 8107=SI, 8108=NO
  setRadio('8107','8108',d.monSato2!==false);if(d.monSato2!==false)ok++;
  // PANI: 8111=SI, 8112=NO
  setRadio('8111','8112',d.monPani!==false);if(d.monPani!==false)ok++;
  // PROT.DECUB: 8115=SI, 8116=NO
  setRadio('8115','8116',d.monDecub||false);

  // 15. Recuperación
  if(d.recuperacion&&setId('8458',d.recuperacion))ok++;

  // 16. Fluidos / Balance
  if(d.fluido1&&setId('8448',d.fluido1))ok++;

  // 17. Signos vitales — grilla temporal
  // Columnas por fila: SIST, DIAST, SAT02, E-CO2, FC, PAM
  // IDs mapeados: DIAST14=8217, DIAST16=8236...
  // Usar selector por name para ser más robusto
  try{
    if(d.vitals&&d.vitals.length){
      // Buscar todas las filas de la grilla por el patrón de inputs seguidos
      var allInputs=Array.from(D.querySelectorAll('input[type=text],input:not([type])'));
      // Filtrar solo los de la grilla (id numérico > 8126)
      var grilaInputs=allInputs.filter(function(el){
        var n=parseInt(el.id);return n>8125&&n<9000;
      });
      // Agrupar en filas de 6
      var filas=[];
      for(var i=0;i<grilaInputs.length;i+=6){
        filas.push(grilaInputs.slice(i,i+6));
      }
      d.vitals.forEach(function(v,idx){
        if(!filas[idx])return;
        var cols=[v.sist,v.diast,v.sato2,v.eco2,v.fc,v.pam];
        cols.forEach(function(val,ci){
          if(filas[idx][ci]&&val!==undefined&&val!==''){
            setVal(filas[idx][ci],String(val));
          }
        });
      });
      ok+=d.vitals.length;
    }
  }catch(e){}

  alert('AnestFact → GECLISA ✓\n'+ok+' campos rellenados.\nRevisá y hacé clic en GRABAR.');
}

})();void(0);
