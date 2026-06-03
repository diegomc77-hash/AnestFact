// AnestFact -> GECLISA filler v7 - Supabase
// Lee datos desde Supabase usando el DNI del paciente como clave
(function(){

var SURL='https://xntvibfsuubedplptvzs.supabase.co';
var SKEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudHZpYmZzdXViZWRwbHB0dnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDk2MjgsImV4cCI6MjA5NTkyNTYyOH0.9SaZdO7knkzSREyaUfoOX8nanid9AQwlNbY5VudWcws';

// Desactivar beforeunload
try{window.onbeforeunload=null;}catch(e){}

// Detectar clave (DNI del paciente desde la página de GECLISA)
// O usar 'ultimo' como fallback
function getClave(){
  // Intentar leer DNI desde la foja
  try{
    var inputs=document.querySelectorAll('input');
    for(var i=0;i<Math.min(inputs.length,20);i++){
      var v=(inputs[i].value||'').trim();
      if(/^\d{7,9}$/.test(v))return v; // parece un DNI
    }
  }catch(e){}
  return 'ultimo';
}

// Verificar que estamos en la foja
if(!document.getElementById('tPrincipal')){
  alert('No estás en la Foja Anestésica.\nNavegá hasta la foja del paciente y ejecutá el marcador.');
  return void(0);
}

var clave=getClave();

// Leer datos desde Supabase
fetch(SURL+'/rest/v1/anesfact_datos?clave=eq.'+encodeURIComponent(clave)+'&select=datos&order=id.desc&limit=1',{
  headers:{
    'apikey':SKEY,
    'Authorization':'Bearer '+SKEY
  }
})
.then(function(r){return r.json();})
.then(function(rows){
  if(!rows||!rows.length){
    // Try 'ultimo' as fallback
    if(clave!=='ultimo'){
      return fetch(SURL+'/rest/v1/anesfact_datos?clave=eq.ultimo&select=datos&order=id.desc&limit=1',{
        headers:{'apikey':SKEY,'Authorization':'Bearer '+SKEY}
      }).then(function(r){return r.json();});
    }
    throw new Error('Sin datos. Abrí AnesFact, cargá el paciente y tocá "Abrir GECLISA" primero.');
  }
  return rows;
})
.then(function(rows){
  if(!rows||!rows.length) throw new Error('Sin datos en Supabase. Tocá "Abrir GECLISA" en AnesFact primero.');
  var d=JSON.parse(rows[0].datos);
  rellenar(d);
})
.catch(function(e){
  alert('Error: '+e.message);
});

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
    var m=Array.from(sel.options).find(function(o){return o.text.toLowerCase().indexOf(v)>=0;});
    if(!m)return false;
    sel.value=m.value;
    sel.dispatchEvent(new Event('change',{bubbles:true}));
    return true;
  }catch(e){return false;}
}

function inp(secId){
  try{var s=document.getElementById(secId);return s?s.querySelector('input:not([type=hidden]):not([type=radio]):not([type=checkbox]),textarea'):null;}catch(e){return null;}
}

function rellenar(d){
  var ok=0;

  // sec_diagnostico
  try{if(set(inp('sec_diagnostico'),d.diagnostico))ok++;}catch(e){}

  // sec_detallecirugia
  try{
    var sd=document.getElementById('sec_detallecirugia');
    if(sd){
      sd.querySelectorAll('select').forEach(function(s){
        var lbl='';try{var p=s.closest('tr');if(p)lbl=p.textContent.toLowerCase();}catch(e){}
        if(lbl.indexOf('anestesista')>=0||lbl.indexOf('profesional')>=0){if(setSelect(s,'HUERTA'))ok++;}
        if(lbl.indexOf('cirujano')>=0&&lbl.indexOf('anest')<0){if(d.cirujano&&setSelect(s,d.cirujano))ok++;}
        if(lbl.indexOf('quirofano')>=0||lbl.indexOf('quirófano')>=0){if(d.quirofano&&setSelect(s,d.quirofano))ok++;}
        if(lbl.indexOf('tipo')>=0&&lbl.indexOf('cirug')>=0){if(setSelect(s,'PROGRAMADA'))ok++;}
      });
      sd.querySelectorAll('input:not([type=hidden])').forEach(function(i){
        var lbl='';try{var p=i.closest('tr');if(p)lbl=p.textContent.toLowerCase();}catch(e){}
        if(lbl.indexOf('hora inicio')>=0&&d.horaInicio){if(set(i,d.horaInicio))ok++;}
        if(lbl.indexOf('hora fin')>=0&&d.horaFin){if(set(i,d.horaFin))ok++;}
      });
    }
  }catch(e){}

  // sec_observaciones
  try{if(set(inp('sec_observaciones'),d.observaciones))ok++;}catch(e){}

  // sec_medicamentosGenerales
  try{if(set(inp('sec_medicamentosGenerales'),d.premedicacion))ok++;}catch(e){}

  // sec_evaluacionpreanestesica
  try{
    var se=document.getElementById('sec_evaluacionpreanestesica');
    if(se){
      se.querySelectorAll('tr').forEach(function(tr){
        var lbl=tr.textContent.toLowerCase();
        var i2=tr.querySelector('input:not([type=hidden]):not([type=radio]):not([type=checkbox])');
        var s2=tr.querySelector('select');
        if(lbl.indexOf('edad')>=0&&i2&&d.edad){if(set(i2,d.edad))ok++;}
        if(lbl.indexOf('peso')>=0&&i2&&d.peso){if(set(i2,d.peso))ok++;}
        if((lbl.indexOf('asa')>=0||lbl.indexOf('riesgo')>=0)&&s2&&d.asa){if(setSelect(s2,'ASA '+d.asa)||setSelect(s2,d.asa))ok++;}
      });
    }
  }catch(e){}

  // Monitoreo SI/NO
  var monSecs={'sec_etco2':d.monEtco2,'sec_PAM':d.monPam,'sec_ECG':d.monEcg,'sec_SAT2':d.monSato2,'sec_Pani':d.monPani,'sec_PDec':d.monDecub||false};
  Object.keys(monSecs).forEach(function(sid){
    try{
      var sec=document.getElementById(sid);if(!sec)return;
      var btns=sec.querySelectorAll('input[type=radio],input[type=button],button');
      btns.forEach(function(btn){
        var v=(btn.value||btn.textContent||'').toLowerCase();
        if(monSecs[sid]&&(v==='si'||v==='sí'))try{btn.click();ok++;}catch(e){}
        if(!monSecs[sid]&&(v==='no'))try{btn.click();ok++;}catch(e){}
      });
    }catch(e){}
  });

  // sec_premedicacion
  try{if(set(inp('sec_premedicacion'),d.premedicacion))ok++;}catch(e){}

  // sec_fluidos
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

  // sec_recu
  try{if(set(inp('sec_recu'),d.recuperacion))ok++;}catch(e){}

  // sec_grafico - signos vitales
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
          try{if(inputs[i]&&val)set(inputs[i],String(val));}catch(e){}
        });
      });
    }
  }catch(e){}

  alert('AnestFact \u2192 GECLISA\n\u2713 '+ok+' campos rellenados.\nRevis\u00e1 y hac\u00e9 clic en GRABAR.');
}

})();void(0);
