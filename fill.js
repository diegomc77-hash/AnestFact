// AnestFact → GECLISA filler v4 - Frame-recursive
(function(){

// ── 1. Leer datos ─────────────────────────────────────────────────────
var raw=null;
try{if(window.opener&&window.opener.AF_DATA)raw=JSON.stringify(window.opener.AF_DATA);}catch(e){}
if(!raw){try{var h=window.location.hash||'';var m=h.match(/AF=([^&]+)/);if(m)raw=decodeURIComponent(escape(atob(decodeURIComponent(m[1]))));}catch(e){}}
if(!raw){try{raw=localStorage.getItem('af_datos');}catch(e){}}
if(!raw){try{raw=sessionStorage.getItem('af_datos');}catch(e){}}
if(!raw){
  alert('Sin datos de AnestFact.\nPasos:\n1. Abrí AnesFact\n2. Cargá el paciente\n3. Tocá "Abrir GECLISA"\n4. Volvé aquí y ejecutá el marcador de nuevo.');
  return;
}
var d;
try{d=JSON.parse(raw);}catch(e){alert('Error leyendo datos: '+e.message);return;}

// ── 2. Helpers ────────────────────────────────────────────────────────
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

function setSelect(el,val){
  if(!el||!val)return false;
  var v=String(val).toLowerCase();
  var match=Array.from(el.options).find(function(o){
    return o.text.toLowerCase().indexOf(v)>=0||o.value.toLowerCase().indexOf(v)>=0;
  });
  if(!match)return false;
  el.value=match.value;
  try{el.dispatchEvent(new Event('change',{bubbles:true}));}catch(e){}
  return true;
}

// ── 3. Recolectar TODOS los documentos (frame-recursive) ──────────────
function getAllDocs(win,collected){
  collected=collected||[];
  try{
    if(win.document)collected.push(win.document);
  }catch(e){}
  try{
    var frames=win.frames||[];
    for(var i=0;i<frames.length;i++){
      try{getAllDocs(frames[i],collected);}catch(e){}
    }
  }catch(e){}
  // Also check iframes in the document
  try{
    var iframes=win.document.querySelectorAll('iframe,frame');
    for(var j=0;j<iframes.length;j++){
      try{
        var fw=iframes[j].contentWindow||iframes[j].contentDocument&&iframes[j].contentDocument.defaultView;
        if(fw)getAllDocs(fw,collected);
      }catch(e){}
    }
  }catch(e){}
  return collected;
}

var allDocs=getAllDocs(window);
console.log('AnestFact: encontrados '+allDocs.length+' documentos/frames');

// ── 4. Buscar campo por label en TODOS los docs ───────────────────────
var PROHIBIDOS=['apellido','nombre','dni','n° hc','n hc','obra social','fecha nac','domicilio','fecha de nac'];

function estaProhibido(el,doc){
  var txt='';
  try{
    if(el.id){var l=doc.querySelector('label[for="'+el.id+'"]');if(l)txt+=l.textContent.toLowerCase();}
    var p=el.closest?el.closest('tr,div,td'):null;
    if(p)txt+=p.textContent.toLowerCase().slice(0,80);
  }catch(e){}
  return PROHIBIDOS.some(function(k){return txt.indexOf(k)>=0;});
}

function buscarPorLabel(textos,docs){
  if(typeof textos==='string')textos=[textos];
  for(var di=0;di<docs.length;di++){
    var doc=docs[di];
    try{
      var candidatos=doc.querySelectorAll('label,td,th,span,div,b,p,strong');
      for(var i=0;i<candidatos.length;i++){
        var t=candidatos[i].textContent.trim().toLowerCase();
        for(var j=0;j<textos.length;j++){
          if(t.indexOf(textos[j].toLowerCase())>=0){
            // Buscar input cercano
            var contenedor=null;
            try{contenedor=candidatos[i].closest('tr,div,td,fieldset,li');}catch(e){}
            if(!contenedor)contenedor=candidatos[i].parentElement;
            if(contenedor){
              var inp=contenedor.querySelector('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),textarea,select');
              if(inp&&!estaProhibido(inp,doc))return {el:inp,doc:doc};
            }
            // Si es label con for=
            if(candidatos[i].htmlFor){
              var el=doc.getElementById(candidatos[i].htmlFor);
              if(el&&!estaProhibido(el,doc))return {el:el,doc:doc};
            }
          }
        }
      }
    }catch(e){}
  }
  return null;
}

function buscarPorId(id,docs){
  for(var di=0;di<docs.length;di++){
    try{
      var el=docs[di].getElementById(id);
      if(el)return {el:el,doc:docs[di]};
    }catch(e){}
  }
  return null;
}

// ── 5. Buscar la sección EVALUACION PREANESTESICA ─────────────────────
function buscarSeccionEval(docs){
  for(var di=0;di<docs.length;di++){
    try{
      var todos=docs[di].querySelectorAll('*');
      for(var i=0;i<todos.length;i++){
        if(todos[i].children.length===0&&
           todos[i].textContent.trim().toLowerCase().indexOf('evaluacion preanestesica')>=0){
          var sec=null;
          try{sec=todos[i].closest('table,div,fieldset,section');}catch(e){}
          if(!sec)sec=todos[i].parentElement;
          return {sec:sec,doc:docs[di]};
        }
      }
    }catch(e){}
  }
  return null;
}

// ── 6. Rellenar campos ────────────────────────────────────────────────
var ok=0;

// Campos por label
var mapaLabels=[
  [['Diagnostico/cx realizada','Diagnóstico/cx','diagnostico'],   d.diagnostico],
  [['Hora Inicio','hora de inicio','hora inicio'],                 d.horaInicio],
  [['Hora Fin','hora de fin','hora fin','hora finaliz'],           d.horaFin],
  [['Observaciones'],                                              d.observaciones],
  [['Medicamentos Generales','Monitorizacion','Med. General'],     d.premedicacion],
  [['Medicamentos Anestésicos','Med. Anest','anestesicos'],        d.medicamentos],
  [['Inducción','induccion'],                                      d.induccion],
  [['Mantenimiento'],                                              d.mantenimiento],
  [['Vía Aérea','via aerea','via aérea'],                          d.viaAerea],
  [['Métodos','metodos anest','metodo anest'],                     d.metodos],
  [['Recuperación','recuperacion'],                                d.recuperacion],
  [['Nivel Regional','nivel regional'],                            d.nivelRegional],
];

mapaLabels.forEach(function(entry){
  var res=buscarPorLabel(entry[0],allDocs);
  if(res&&entry[1]){if(set(res.el,entry[1]))ok++;}
});

// Selects en todos los docs
allDocs.forEach(function(doc){
  try{
    doc.querySelectorAll('select').forEach(function(sel){
      var lbl='';
      try{
        if(sel.id){var l=doc.querySelector('label[for="'+sel.id+'"]');if(l)lbl=l.textContent.toLowerCase();}
        if(!lbl){var p=sel.closest?sel.closest('tr,div,td'):sel.parentElement;if(p)lbl=p.textContent.toLowerCase().slice(0,80);}
      }catch(e){}
      if(lbl.indexOf('quirofano')>=0||lbl.indexOf('quirófano')>=0){if(setSelect(sel,d.quirofano))ok++;}
      if((lbl.indexOf('anestesista')>=0||lbl.indexOf('profesional')>=0)&&lbl.indexOf('cirujano')<0){if(setSelect(sel,'HUERTA'))ok++;}
      if(lbl.indexOf('cirujano')>=0&&lbl.indexOf('anest')<0){if(d.cirujano&&setSelect(sel,d.cirujano))ok++;}
      if(lbl.indexOf('tipo')>=0&&lbl.indexOf('cirug')>=0){if(setSelect(sel,'PROGRAMADA'))ok++;}
      if(lbl.indexOf('asa')>=0||lbl.indexOf('riesgo')>=0){if(d.asa&&setSelect(sel,'ASA '+d.asa))ok++;}
    });
  }catch(e){}
});

// Checkboxes monitoreo en todos los docs
var monMap={
  'etco2':d.monEtco2,'e-co2':d.monEtco2,'et co2':d.monEtco2,
  'pam':d.monPam,
  'ecg':d.monEcg,
  'sat o2':d.monSato2,'sato2':d.monSato2,
  'pani':d.monPani,
  'prot. decub':d.monDecub,'decubito':d.monDecub,
  'emergencia':d.monEmerg
};
allDocs.forEach(function(doc){
  try{
    doc.querySelectorAll('input[type=checkbox]').forEach(function(cb){
      var lbl='';
      try{
        if(cb.id){var l=doc.querySelector('label[for="'+cb.id+'"]');if(l)lbl=l.textContent.toLowerCase();}
        if(!lbl){var p=cb.closest?cb.closest('label,td,div,li'):cb.parentElement;if(p)lbl=p.textContent.toLowerCase().slice(0,40);}
      }catch(e){}
      Object.keys(monMap).forEach(function(k){
        if(lbl.indexOf(k)>=0&&monMap[k]!==undefined){
          if(cb.checked!==!!monMap[k]){try{cb.click();}catch(e){}}
        }
      });
    });
  }catch(e){}
});

// Evaluacion preanestesica - edad y peso en la sección correcta
var evalRes=buscarSeccionEval(allDocs);
if(evalRes){
  try{
    var sec=evalRes.sec;var docE=evalRes.doc;
    sec.querySelectorAll('label,td,span,div').forEach(function(lbl){
      var t=lbl.textContent.trim().toLowerCase();
      var p=null;try{p=lbl.closest('tr,div,td');}catch(e){p=lbl.parentElement;}
      var inp=p?p.querySelector('input:not([type=hidden]):not([type=checkbox])'):null;
      if(!inp)return;
      if((t==='edad'||t==='edad:')&&!estaProhibido(inp,docE)&&d.edad){if(set(inp,d.edad))ok++;}
      if((t==='peso'||t==='peso:'||t==='peso (kg)')&&!estaProhibido(inp,docE)&&d.peso){if(set(inp,d.peso))ok++;}
    });
  }catch(e){}
}

// Signos vitales en tabla
if(d.vitals&&d.vitals.length){
  allDocs.forEach(function(doc){
    try{
      doc.querySelectorAll('table').forEach(function(tabla){
        var h=tabla.textContent.toLowerCase();
        if(h.indexOf('sist')<0||h.indexOf('fc')<0)return;
        var rows=tabla.querySelectorAll('tbody tr');
        if(rows.length<2)return;
        d.vitals.forEach(function(v,idx){
          if(!rows[idx])return;
          var inputs=rows[idx].querySelectorAll('input:not([type=hidden])');
          var vals=[v.sist,v.diast,v.sato2,v.eco2,v.fc,v.pam];
          vals.forEach(function(val,i){if(inputs[i]&&val)set(inputs[i],String(val));});
        });
      });
    }catch(e){}
  });
}

// Fluidos
var fluRes=buscarPorLabel(['Fluidos','fluido','balance fluido'],allDocs);
if(fluRes&&d.fluido1){
  set(fluRes.el,d.fluido1);ok++;
  // Try to find second fluido field nearby
  try{
    var allInputsNearby=fluRes.doc.querySelectorAll('input[type=text]');
    var idx=Array.from(allInputsNearby).indexOf(fluRes.el);
    if(idx>=0&&allInputsNearby[idx+1]&&d.fluido2){set(allInputsNearby[idx+1],d.fluido2);ok++;}
  }catch(e){}
}

// ── 7. Resultado ──────────────────────────────────────────────────────
var msg='AnestFact → GECLISA\n';
msg+='✓ '+ok+' campos rellenados en '+allDocs.length+' frame'+(allDocs.length>1?'s':'')+'.\n';
if(ok===0){
  msg+='⚠ No se encontraron campos.\n';
  msg+='Asegurate de estar en la foja anestésica (no en la página de búsqueda).';
} else {
  msg+='Revisá los campos y hacé clic en GRABAR.';
}
alert(msg);

})();
