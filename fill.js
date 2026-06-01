// AnestFact → GECLISA filler v3
// Loaded dynamically by bookmarklet
(function(){

// ── Leer datos: opener → hash → localStorage ─────────────────────────
var raw = null;

// 1. Intentar desde window.opener (relay page abierta en background)
try{
  if(window.opener && window.opener.AF_DATA){
    raw = JSON.stringify(window.opener.AF_DATA);
  }
}catch(e){}

// 2. Intentar desde hash de la URL actual
if(!raw){
  try{
    var h=window.location.hash||'';
    var m=h.match(/AF=([^&]+)/);
    if(m)raw=decodeURIComponent(escape(atob(decodeURIComponent(m[1]))));
  }catch(e){}
}

// 3. Intentar localStorage/sessionStorage
if(!raw){
  try{raw=localStorage.getItem('af_datos');}catch(e){}
}
if(!raw){
  try{raw=sessionStorage.getItem('af_datos');}catch(e){}
}

// 4. Sin datos - pedir al usuario
if(!raw){
  alert('Sin datos de AnestFact.\n\nPasos:\n1. Abrí AnesFact\n2. Cargá el paciente\n3. Tocá "Abrir GECLISA"\n4. Volvé a esta página y ejecutá el bookmarklet de nuevo.');
  return;
}

var d;
try{ d = JSON.parse(raw); }
catch(e){ alert('Datos inválidos: ' + e.message); return; }

function set(el,val){
  if(!el||!val)return false;
  try{
    var desc=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value');
    if(desc&&desc.set)desc.set.call(el,String(val));
    else el.value=String(val);
  }catch(e){el.value=String(val);}
  el.dispatchEvent(new Event('input',{bubbles:true}));
  el.dispatchEvent(new Event('change',{bubbles:true}));
  return true;
}

function byLabel(textos){
  if(typeof textos==='string')textos=[textos];
  var all=document.querySelectorAll('label,td,th,span,div,b');
  for(var i=0;i<all.length;i++){
    var t=all[i].textContent.trim().toLowerCase();
    for(var j=0;j<textos.length;j++){
      if(t.indexOf(textos[j].toLowerCase())>=0){
        var p=all[i].closest('tr,div,td,fieldset')||all[i].parentElement;
        if(p){var inp=p.querySelector('input:not([type=hidden]):not([type=checkbox]),textarea,select');if(inp)return inp;}
        if(all[i].htmlFor){var el=document.getElementById(all[i].htmlFor);if(el)return el;}
      }
    }
  }
  return null;
}

var PROHIBIDOS=['apellido','nombre','dni','n° hc','obra social','fecha nac','domicilio'];
function prohibido(el){
  var txt='';
  if(el.id){var l=document.querySelector('label[for="'+el.id+'"]');if(l)txt=l.textContent.toLowerCase();}
  if(!txt){var p=el.closest('tr,div,td');if(p)txt=p.textContent.toLowerCase().slice(0,60);}
  return PROHIBIDOS.some(function(k){return txt.indexOf(k)>=0;});
}

var ok=0;
[
  [['Diagnostico/cx realizada','Diagnóstico'],d.diagnostico],
  [['Hora Inicio','hora inicio'],d.horaInicio],
  [['Hora Fin','hora fin'],d.horaFin],
  [['Observaciones'],d.observaciones],
  [['Medicamentos Generales','Monitorizacion'],d.premedicacion],
  [['Medicamentos Anestésicos'],d.medicamentos],
  [['Inducción','induccion'],d.induccion],
  [['Mantenimiento'],d.mantenimiento],
  [['Vía Aérea','via aerea'],d.viaAerea],
  [['Métodos','metodos'],d.metodos],
  [['Recuperación'],d.recuperacion],
].forEach(function(e){
  var inp=byLabel(e[0]);
  if(inp&&!prohibido(inp)&&e[1])if(set(inp,e[1]))ok++;
});

document.querySelectorAll('select').forEach(function(sel){
  var lbl='';
  if(sel.id){var l=document.querySelector('label[for="'+sel.id+'"]');if(l)lbl=l.textContent.toLowerCase();}
  if(!lbl){var p=sel.closest('tr,div,td');if(p)lbl=p.textContent.toLowerCase().slice(0,60);}
  function trySet(val){
    if(!val)return;
    var m=Array.from(sel.options).find(function(o){return o.text.toLowerCase().indexOf(val.toLowerCase())>=0;});
    if(m){sel.value=m.value;sel.dispatchEvent(new Event('change',{bubbles:true}));ok++;}
  }
  if(lbl.indexOf('quirofano')>=0||lbl.indexOf('quirófano')>=0)trySet(d.quirofano);
  if(lbl.indexOf('anestesista')>=0||lbl.indexOf('profesional')>=0)trySet('HUERTA');
  if(lbl.indexOf('asa')>=0)trySet(d.asa?'ASA '+d.asa:null);
  if(lbl.indexOf('cirujano')>=0)trySet(d.cirujano);
});

var mon={etco2:d.monEtco2,'e-co2':d.monEtco2,pam:d.monPam,ecg:d.monEcg,'sat o2':d.monSato2,sato2:d.monSato2,pani:d.monPani};
document.querySelectorAll('input[type=checkbox]').forEach(function(cb){
  var lbl='';
  if(cb.id){var l=document.querySelector('label[for="'+cb.id+'"]');if(l)lbl=l.textContent.toLowerCase();}
  if(!lbl){var p=cb.closest('label,td,div');if(p)lbl=p.textContent.toLowerCase().slice(0,30);}
  Object.keys(mon).forEach(function(k){
    if(lbl.indexOf(k)>=0&&mon[k]!==undefined&&cb.checked!==!!mon[k])cb.click();
  });
});

// Evaluacion preanestesica - edad y peso
document.querySelectorAll('*').forEach(function(el){
  if(el.children.length===0&&el.textContent.trim().toLowerCase().indexOf('evaluacion preanestesica')>=0){
    var sec=el.closest('table,div,fieldset')||el.parentElement;
    if(sec){
      sec.querySelectorAll('label,td,span').forEach(function(lbl){
        var t=lbl.textContent.trim().toLowerCase();
        var p=lbl.closest('tr,div,td');var inp=p?p.querySelector('input'):null;
        if((t==='edad'||t==='edad:')&&inp&&!prohibido(inp)&&d.edad){set(inp,d.edad);ok++;}
        if(t.indexOf('peso')===0&&inp&&!prohibido(inp)&&d.peso){set(inp,d.peso);ok++;}
      });
    }
  }
});

// Signos vitales
if(d.vitals&&d.vitals.length){
  document.querySelectorAll('table').forEach(function(tabla){
    var h=tabla.textContent.toLowerCase();
    if(h.indexOf('sist')<0&&h.indexOf('fc')<0)return;
    var rows=tabla.querySelectorAll('tbody tr');
    d.vitals.forEach(function(v,idx){
      if(!rows[idx])return;
      var inputs=rows[idx].querySelectorAll('input');
      [v.sist,v.diast,v.sato2,v.eco2,v.fc,v.pam].forEach(function(val,i){
        if(inputs[i]&&val)set(inputs[i],val);
      });
    });
  });
}

alert('AnestFact → GECLISA\n✓ ' + ok + ' campos rellenados.\nRevisá y hacé clic en GRABAR.');
})();
