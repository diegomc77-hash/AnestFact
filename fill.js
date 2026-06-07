// AnesFact -> GECLISA filler v9
// Usa XMLHttpRequest (compatible con HTTP) en lugar de fetch
// para evitar bloqueo Mixed Content desde http://sanatoriomayo.myvnc.com:84
(function(){

var SURL='https://xntvibfsuubedplptvzs.supabase.co';
var SKEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudHZpYmZzdXViZWRwbHB0dnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDk2MjgsImV4cCI6MjA5NTkyNTYyOH0.9SaZdO7knkzSREyaUfoOX8nanid9AQwlNbY5VudWcws';

try{window.onbeforeunload=null;}catch(e){}

// Verificar que estamos en la foja
if(!document.getElementById('tPrincipal')){
  alert('No estás en la Foja Anestésica.\nNavegá hasta la foja del paciente y ejecutá el marcador.');
  return void(0);
}

// Indicador visual
var toast=document.createElement('div');
toast.style.cssText='position:fixed;bottom:20px;right:20px;background:#1db954;color:#fff;padding:12px 18px;border-radius:10px;font-size:14px;font-family:sans-serif;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,.3)';
toast.textContent='⏳ Cargando datos de AnesFact...';
document.body.appendChild(toast);
function rmToast(){try{document.body.removeChild(toast);}catch(e){}}

// Detectar DNI del paciente en la página
function getClave(){
  try{
    var inputs=document.querySelectorAll('input');
    for(var i=0;i<Math.min(inputs.length,30);i++){
      var v=(inputs[i].value||'').trim();
      if(/^\d{7,9}$/.test(v))return v;
    }
  }catch(e){}
  return 'ultimo';
}

var clave=getClave();

// XHR helper — funciona en HTTP sin bloqueo Mixed Content
function xhrGet(url, ok, fail){
  var x=new XMLHttpRequest();
  x.open('GET', url, true);
  x.setRequestHeader('apikey', SKEY);
  x.setRequestHeader('Authorization', 'Bearer '+SKEY);
  x.onload=function(){
    if(x.status===200){
      try{ok(JSON.parse(x.responseText));}
      catch(e){fail('Respuesta inválida de Supabase: '+e.message);}
    } else {
      fail('Error HTTP '+x.status);
    }
  };
  x.onerror=function(){fail('Sin conexión a Supabase. Verificá la red.');};
  x.send();
}

function cargarDatos(k){
  var url=SURL+'/rest/v1/anesfact_datos?clave=eq.'+encodeURIComponent(k)+'&select=datos&order=id.desc&limit=1';
  xhrGet(url, function(rows){
    if(!rows||!rows.length){
      if(k!=='ultimo'){
        // Reintentar con clave 'ultimo'
        toast.textContent='⏳ Buscando último paciente...';
        cargarDatos('ultimo');
      } else {
        rmToast();
        alert('Sin datos en AnesFact.\nAbrí AnesFact, cargá el paciente y tocá "Abrir GECLISA" primero.');
      }
      return;
    }
    try{
      var d=JSON.parse(rows[0].datos);
      toast.textContent='✅ Rellenando foja...';
      setTimeout(function(){rmToast();},2000);
      rellenar(d);
    }catch(e){
      rmToast();
      alert('Error procesando datos: '+e.message);
    }
  }, function(err){
    rmToast();
    alert('Error cargando datos: '+err);
  });
}

cargarDatos(clave);

// ── Helpers ───────────────────────────────────────────────────────────
function set(el,val){
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

function setSelect(sel,val){
  if(!sel||!val)return false;
  try{
    var v=String(val).toLowerCase();
    var m=Array.from(sel.options).find(function(o){
      return o.text.toLowerCase().indexOf(v)>=0||o.value.toLowerCase().indexOf(v)>=0;
    });
    if(!m)return false;
    sel.value=m.value;
    sel.dispatchEvent(new Event('change',{bubbles:true}));
    return true;
  }catch(e){return false;}
}

function inp(secId){
  try{var s=document.getElementById(secId);return s?s.querySelector('input:not([type=hidden]):not([type=radio]):not([type=checkbox]),textarea'):null;}catch(e){return null;}
}

// ── Rellenar ──────────────────────────────────────────────────────────
function rellenar(d){
  var ok=0;

  // 1. Diagnóstico
  try{if(set(inp('sec_diagnostico'),d.diagnostico))ok++;}catch(e){}

  // 2. Detalle cirugía
  try{
    var sd=document.getElementById('sec_detallecirugia');
    if(sd){
      sd.querySelectorAll('select').forEach(function(s){
        var lbl='';try{var p=s.closest('tr');if(p)lbl=p.textContent.toLowerCase();}catch(e){}
        if(/anestesista|profesional/.test(lbl)){if(setSelect(s,'HUERTA'))ok++;}
        if(/cirujano/.test(lbl)&&!/anest/.test(lbl)){if(d.cirujano&&setSelect(s,d.cirujano))ok++;}
        if(/quirofano|quirófano/.test(lbl)){if(d.quirofano&&setSelect(s,d.quirofano))ok++;}
        if(/tipo.*cirug/.test(lbl)){if(setSelect(s,'PROGRAMADA'))ok++;}
      });
      sd.querySelectorAll('input:not([type=hidden])').forEach(function(i){
        var lbl='';try{var p=i.closest('tr');if(p)lbl=p.textContent.toLowerCase();}catch(e){}
        if(/hora inicio/.test(lbl)&&d.horaInicio){if(set(i,d.horaInicio))ok++;}
        if(/hora fin/.test(lbl)&&d.horaFin){if(set(i,d.horaFin))ok++;}
      });
    }
  }catch(e){}

  // 3. Observaciones
  try{if(set(inp('sec_observaciones'),d.observaciones))ok++;}catch(e){}

  // 4. Medicamentos generales (premedicación + antibiótico)
  try{
    var med=d.premedicacion||'';
    if(d.antibioticoprofilaxis)med+=(med?' / ':'')+d.antibioticoprofilaxis;
    if(set(inp('sec_medicamentosGenerales'),med))ok++;
  }catch(e){}

  // 5. Evaluación preanestésica
  try{
    var se=document.getElementById('sec_evaluacionpreanestesica');
    if(se){
      se.querySelectorAll('tr').forEach(function(tr){
        var lbl=tr.textContent.toLowerCase();
        var i2=tr.querySelector('input:not([type=hidden]):not([type=radio]):not([type=checkbox])');
        var s2=tr.querySelector('select');
        if(/edad/.test(lbl)&&i2&&d.edad){if(set(i2,d.edad))ok++;}
        if(/peso/.test(lbl)&&i2&&d.peso){if(set(i2,d.peso))ok++;}
        if((/asa|riesgo/).test(lbl)&&s2&&d.asa){if(setSelect(s2,'ASA '+d.asa)||setSelect(s2,String(d.asa)))ok++;}
      });
    }
  }catch(e){}

  // 6. Monitoreo SI/NO
  var monSecs={'sec_etco2':d.monEtco2,'sec_PAM':d.monPam,'sec_ECG':d.monEcg,'sec_SAT2':d.monSato2,'sec_Pani':d.monPani,'sec_PDec':d.monDecub||false};
  Object.keys(monSecs).forEach(function(sid){
    try{
      var sec=document.getElementById(sid);if(!sec)return;
      sec.querySelectorAll('input[type=radio],input[type=button],button').forEach(function(btn){
        var v=(btn.value||btn.textContent||'').toLowerCase().trim();
        if(monSecs[sid]&&(v==='si'||v==='sí')){try{btn.click();ok++;}catch(e){}}
        if(!monSecs[sid]&&v==='no'){try{btn.click();}catch(e){}}
      });
    }catch(e){}
  });

  // 7. Premedicación (campo específico)
  try{if(set(inp('sec_premedicacion'),d.premedicacion))ok++;}catch(e){}

  // 8. Fluidos / Balance
  try{
    var sf=document.getElementById('sec_fluidos');
    if(sf){
      var fi=sf.querySelectorAll('input:not([type=hidden]),textarea');
      if(fi[0]&&d.fluido1){if(set(fi[0],d.fluido1))ok++;}
      if(fi[1]&&d.fluido2){if(set(fi[1],d.fluido2))ok++;}
      if(fi[2]&&d.orina){if(set(fi[2],d.orina))ok++;}
      if(fi[3]&&d.sangrado){if(set(fi[3],d.sangrado))ok++;}
    }
  }catch(e){}

  // 9. Recuperación
  try{if(set(inp('sec_recu'),d.recuperacion))ok++;}catch(e){}

  // 10. Signos vitales
  try{
    if(d.vitals&&d.vitals.length){
      var sg1=document.getElementById('sec_grafico');
      var sg2=document.getElementById('sec_grafico1');
      var allRows=[];
      if(sg1)sg1.querySelectorAll('tr').forEach(function(r){allRows.push(r);});
      if(sg2)sg2.querySelectorAll('tr').forEach(function(r){allRows.push(r);});
      var dataRows=allRows.filter(function(tr){return tr.querySelectorAll('input:not([type=hidden])').length>=3;});
      d.vitals.forEach(function(v,idx){
        if(!dataRows[idx])return;
        var inputs=dataRows[idx].querySelectorAll('input:not([type=hidden])');
        [v.sist,v.diast,v.sato2,v.eco2,v.fc,v.pam].forEach(function(val,i){
          try{if(inputs[i]&&val!==undefined&&val!=='')set(inputs[i],String(val));}catch(e){}
        });
      });
    }
  }catch(e){}

  alert('AnestFact → GECLISA ✓\n'+ok+' campos rellenados.\nRevisá y hacé clic en GRABAR.');
}

})();void(0);
