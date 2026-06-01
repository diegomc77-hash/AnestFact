// AnestFact -> GECLISA filler v6
// IDs exactos mapeados desde DevTools de GECLISA 4.0
// Secciones: sec_diagnostico, sec_detallecirugia, sec_observaciones,
// sec_medicamentosGenerales, sec_evaluacionpreanestesica, sec_premedicacion,
// sec_grafico, sec_fluidos, sec_recu
(function(){

// ── 0. Desactivar beforeunload ────────────────────────────────────────
try{window.onbeforeunload=null;}catch(e){}
try{window.removeEventListener('beforeunload',function(){});}catch(e){}

// ── 1. Leer datos de AnesFact ─────────────────────────────────────────
var d=null;
try{
  var raw=null;
  try{if(window.opener&&window.opener.AF_DATA)raw=JSON.stringify(window.opener.AF_DATA);}catch(e){}
  if(!raw){try{var _h=window.location.hash||'';var _m=_h.match(/AF=([^&]+)/);if(_m)raw=decodeURIComponent(escape(atob(decodeURIComponent(_m[1]))));}catch(e){}}
  if(!raw){try{raw=localStorage.getItem('af_datos');}catch(e){}}
  if(!raw){try{raw=sessionStorage.getItem('af_datos');}catch(e){}}
  if(raw)d=JSON.parse(raw);
}catch(e){}

if(!d){
  alert('Sin datos de AnestFact.\n1. Abrí AnesFact\n2. Cargá el paciente\n3. Tocá "Abrir GECLISA"\n4. Volvé aquí y ejecutá el marcador.');
  return void(0);
}

// ── 2. Verificar que estamos en la foja ───────────────────────────────
if(!document.getElementById('tPrincipal')||
   !document.querySelector('table#tPrincipal td')||
   document.querySelector('table#tPrincipal td').textContent.indexOf('FOJA ANESTESICA')<0){
  alert('No estás en la Foja Anestésica.\nNavegá hasta la foja del paciente y ejecutá el marcador de nuevo.');
  return void(0);
}

// ── 3. Helper: setear valor con eventos nativos ───────────────────────
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

function setById(id,val){
  try{var el=document.getElementById(id);return set(el,val);}catch(e){return false;}
}

function setSelect(sel,val){
  if(!sel||!val)return false;
  try{
    var v=String(val).toLowerCase();
    var match=Array.from(sel.options).find(function(o){
      return o.text.toLowerCase().indexOf(v)>=0||o.value.toLowerCase().indexOf(v)>=0;
    });
    if(!match)return false;
    sel.value=match.value;
    sel.dispatchEvent(new Event('change',{bubbles:true}));
    return true;
  }catch(e){return false;}
}

// Helper: primer input/textarea/select de una sección
function inp(secId){
  try{
    var sec=document.getElementById(secId);
    if(!sec)return null;
    return sec.querySelector('input:not([type=hidden]):not([type=radio]):not([type=checkbox]),textarea');
  }catch(e){return null;}
}

function sel(secId){
  try{
    var sec=document.getElementById(secId);
    if(!sec)return null;
    return sec.querySelector('select');
  }catch(e){return null;}
}

var ok=0;

// ── 4. sec_diagnostico — Diagnóstico/cx realizada (input#8054) ────────
try{if(set(inp('sec_diagnostico'),d.diagnostico))ok++;}catch(e){}

// ── 5. sec_detallecirugia — Anestesista, Hora inicio/fin, Cirujano ────
try{
  var secDet=document.getElementById('sec_detallecirugia');
  if(secDet){
    // Todos los selects de esta sección
    var selects=secDet.querySelectorAll('select');
    selects.forEach(function(s){
      var lbl='';
      try{var p=s.closest('tr');if(p)lbl=p.textContent.toLowerCase();}catch(e){}
      if(lbl.indexOf('anestesista')>=0||lbl.indexOf('profesional')>=0){
        if(setSelect(s,'HUERTA'))ok++;
      }
      if(lbl.indexOf('cirujano')>=0&&lbl.indexOf('anest')<0){
        if(d.cirujano&&setSelect(s,d.cirujano))ok++;
      }
      if(lbl.indexOf('quirofano')>=0||lbl.indexOf('quirófano')>=0){
        if(d.quirofano&&setSelect(s,d.quirofano))ok++;
      }
      if(lbl.indexOf('tipo')>=0&&lbl.indexOf('cirug')>=0){
        if(setSelect(s,'PROGRAMADA'))ok++;
      }
    });
    // Inputs de hora
    var inputs=secDet.querySelectorAll('input:not([type=hidden])');
    inputs.forEach(function(inp2){
      var lbl='';
      try{var p=inp2.closest('tr');if(p)lbl=p.textContent.toLowerCase();}catch(e){}
      if((lbl.indexOf('hora inicio')>=0||lbl.indexOf('hora de inicio')>=0)&&d.horaInicio){
        if(set(inp2,d.horaInicio))ok++;
      }
      if((lbl.indexOf('hora fin')>=0||lbl.indexOf('hora de fin')>=0||lbl.indexOf('finaliz')>=0)&&d.horaFin){
        if(set(inp2,d.horaFin))ok++;
      }
    });
  }
}catch(e){}

// ── 6. sec_observaciones (input#8070) ─────────────────────────────────
try{if(set(inp('sec_observaciones'),d.observaciones))ok++;}catch(e){}

// ── 7. sec_medicamentosGenerales (input#8075) ─────────────────────────
try{if(set(inp('sec_medicamentosGenerales'),d.premedicacion))ok++;}catch(e){}

// ── 8. sec_evaluacionpreanestesica — Edad, Peso, ASA ──────────────────
try{
  var secEval=document.getElementById('sec_evaluacionpreanestesica');
  if(secEval){
    // Buscar por label dentro de la sección
    secEval.querySelectorAll('tr').forEach(function(tr){
      var lbl=tr.textContent.toLowerCase();
      var inp2=tr.querySelector('input:not([type=hidden]):not([type=radio]):not([type=checkbox])');
      var sel2=tr.querySelector('select');
      if(lbl.indexOf('edad')>=0&&inp2&&d.edad){if(set(inp2,d.edad))ok++;}
      if(lbl.indexOf('peso')>=0&&inp2&&d.peso){if(set(inp2,d.peso))ok++;}
      if((lbl.indexOf('asa')>=0||lbl.indexOf('riesgo')>=0)&&sel2&&d.asa){
        if(setSelect(sel2,'ASA '+d.asa)||setSelect(sel2,d.asa))ok++;
      }
    });
  }
}catch(e){}

// ── 9. sec_RadioButtons — Checkboxes EtCO2, PAM, ECG, SAT O2, PANI ───
try{
  var monMap={
    'sec_etco2': d.monEtco2!==false,
    'sec_PAM':   d.monPam!==false,
    'sec_ECG':   d.monEcg!==false,
    'sec_SAT2':  d.monSato2!==false,
    'sec_Pani':  d.monPani!==false,
    'sec_PDec':  d.monDecub||false
  };
  Object.keys(monMap).forEach(function(secId){
    try{
      var sec=document.getElementById(secId);
      if(!sec)return;
      // Buscar botón SI/NO
      var btns=sec.querySelectorAll('input[type=radio],input[type=button],button');
      btns.forEach(function(btn){
        var lbl=(btn.value||btn.textContent||'').toLowerCase();
        if(monMap[secId]&&(lbl==='si'||lbl==='sí'||lbl==='1')){
          try{btn.click();}catch(e){}ok++;
        }
      });
    }catch(e){}
  });
}catch(e){}

// ── 10. sec_premedicacion (input#8119) ────────────────────────────────
try{if(set(inp('sec_premedicacion'),d.premedicacion))ok++;}catch(e){}

// ── 11. sec_prunem — Examen Físico (input#8088) ───────────────────────
try{
  var secPru=document.getElementById('sec_prunem');
  if(secPru){
    var inp3=secPru.querySelector('input:not([type=hidden]),textarea');
    if(inp3&&d.observaciones)if(set(inp3,d.observaciones))ok++;
  }
}catch(e){}

// ── 12. sec_fluidos (input#8448) ──────────────────────────────────────
try{
  var secFlu=document.getElementById('sec_fluidos');
  if(secFlu){
    var fluInputs=secFlu.querySelectorAll('input:not([type=hidden]),textarea');
    if(fluInputs[0]&&d.fluido1){if(set(fluInputs[0],d.fluido1))ok++;}
    if(fluInputs[1]&&d.fluido2){if(set(fluInputs[1],d.fluido2))ok++;}
    if(fluInputs[2]&&d.orina){if(set(fluInputs[2],d.orina))ok++;}
    if(fluInputs[3]&&d.sangrado){if(set(fluInputs[3],d.sangrado))ok++;}
  }
}catch(e){}

// ── 13. sec_recu — Recuperación (input#8458) ──────────────────────────
try{if(set(inp('sec_recu'),d.recuperacion))ok++;}catch(e){}

// ── 14. sec_grafico — Tabla de signos vitales ─────────────────────────
// sec_grafico (input#8126) y sec_grafico1 (input#8289)
// Son dos bloques: minutos 5-120 y 125-240
try{
  if(d.vitals&&d.vitals.length){
    var secG1=document.getElementById('sec_grafico');
    var secG2=document.getElementById('sec_grafico1');
    var allGrafRows=[];
    if(secG1){var r1=secG1.querySelectorAll('tr');r1.forEach(function(r){allGrafRows.push(r);});}
    if(secG2){var r2=secG2.querySelectorAll('tr');r2.forEach(function(r){allGrafRows.push(r);});}
    // Filtrar filas con inputs
    var dataRows=allGrafRows.filter(function(tr){
      return tr.querySelectorAll('input:not([type=hidden])').length>=3;
    });
    d.vitals.forEach(function(v,idx){
      try{
        if(!dataRows[idx])return;
        var inputs=dataRows[idx].querySelectorAll('input:not([type=hidden])');
        // Orden GECLISA: SIST, DIAST, SAT O2, E-CO2, FC, PAM
        var vals=[v.sist,v.diast,v.sato2,v.eco2,v.fc,v.pam];
        vals.forEach(function(val,i){
          try{if(inputs[i]&&val)set(inputs[i],String(val));}catch(e){}
        });
      }catch(e){}
    });
  }
}catch(e){}

// ── 15. Resultado ─────────────────────────────────────────────────────
var msg='AnestFact \u2192 GECLISA\n\u2713 '+ok+' campos rellenados.\n';
if(ok>0)msg+='Revis\u00e1 los campos y hac\u00e9 clic en GRABAR.';
else msg+='\u26a0 No se rellenaron campos.\nAsegurate de estar en la Foja Anest\u00e9sica.';
alert(msg);

})();void(0);