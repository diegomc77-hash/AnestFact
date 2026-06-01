// AnestFact -> GECLISA filler v5
// - try/catch en cada frame (cross-origin safe)
// - termina con void(0) para no navegar
// - no retorna valores al bookmarklet
(function(){

// ── 1. Leer datos ─────────────────────────────────────────────────────
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
  alert('Sin datos de AnestFact.\n1. Abrí AnesFact\n2. Cargá el paciente\n3. Tocá "Abrir GECLISA"\n4. Volvé aquí y ejecutá el marcador de nuevo.');
  return void(0);
}

// ── 2. Recolectar todos los docs con try/catch por frame ──────────────
var docs=[];

function recolectarDoc(win,nivel){
  if(nivel>5)return; // max profundidad
  try{
    if(win&&win.document){
      // Solo agregar si no está ya
      var yaEsta=false;
      for(var x=0;x<docs.length;x++){if(docs[x]===win.document){yaEsta=true;break;}}
      if(!yaEsta)docs.push(win.document);
    }
  }catch(e){return;} // cross-origin: ignorar silenciosamente

  // Intentar frames hijo
  try{
    var n=win.frames?win.frames.length:0;
    for(var i=0;i<n;i++){
      try{recolectarDoc(win.frames[i],nivel+1);}catch(e){}
    }
  }catch(e){}

  // Intentar iframes en el documento
  try{
    var iframes=win.document.querySelectorAll('iframe,frame');
    for(var j=0;j<iframes.length;j++){
      try{
        var cw=iframes[j].contentWindow;
        if(cw)recolectarDoc(cw,nivel+1);
      }catch(e){}
    }
  }catch(e){}
}

try{recolectarDoc(window,0);}catch(e){}

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

// ── 4. Prohibidos: no tocar bloque demográfico ────────────────────────
var PROHIBIDOS=['apellido','nombre','dni','n° hc','n hc','obra social','fecha nac','domicilio'];
function prohibido(el,doc){
  var txt='';
  try{
    if(el.id){var l=doc.querySelector('label[for="'+el.id+'"]');if(l)txt+=l.textContent.toLowerCase();}
  }catch(e){}
  try{
    var p=el.closest('tr,div,td');
    if(p)txt+=p.textContent.toLowerCase().slice(0,80);
  }catch(e){}
  return PROHIBIDOS.some(function(k){return txt.indexOf(k)>=0;});
}

// ── 5. Buscar por label en todos los docs ────────────────────────────
function buscarLabel(textos){
  if(typeof textos==='string')textos=[textos];
  for(var di=0;di<docs.length;di++){
    var doc=docs[di];
    try{
      var nodos=doc.querySelectorAll('label,td,th,span,div,b,p,strong');
      for(var i=0;i<nodos.length;i++){
        try{
          var t=nodos[i].textContent.trim().toLowerCase();
          for(var j=0;j<textos.length;j++){
            if(t.indexOf(textos[j].toLowerCase())>=0){
              var contenedor=null;
              try{contenedor=nodos[i].closest('tr,div,td,fieldset,li');}catch(e){contenedor=nodos[i].parentElement;}
              if(contenedor){
                try{
                  var inp=contenedor.querySelector('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),textarea,select');
                  if(inp&&!prohibido(inp,doc))return{el:inp,doc:doc};
                }catch(e){}
              }
              try{
                if(nodos[i].htmlFor){
                  var el=doc.getElementById(nodos[i].htmlFor);
                  if(el&&!prohibido(el,doc))return{el:el,doc:doc};
                }
              }catch(e){}
            }
          }
        }catch(e){}
      }
    }catch(e){}
  }
  return null;
}

// ── 6. Rellenar campos ────────────────────────────────────────────────
var ok=0;

// Campos de texto/textarea por label
var mapa=[
  [['Diagnostico/cx realizada','Diagnóstico/cx','diagnostico/cx'], d.diagnostico],
  [['Hora Inicio','hora de inicio'],                               d.horaInicio],
  [['Hora Fin','hora de fin','hora finaliz'],                      d.horaFin],
  [['Observaciones'],                                               d.observaciones],
  [['Medicamentos Generales','Monitorizacion','Med. Gral'],         d.premedicacion],
  [['Medicamentos Anestésicos','Med. Anest'],                       d.medicamentos],
  [['Inducción','induccion'],                                       d.induccion],
  [['Mantenimiento'],                                               d.mantenimiento],
  [['Vía Aérea','via aerea'],                                       d.viaAerea],
  [['Métodos','metodos anest'],                                     d.metodos],
  [['Recuperación','recuperacion'],                                 d.recuperacion],
  [['Nivel Regional'],                                              d.nivelRegional],
];
mapa.forEach(function(e){
  try{var r=buscarLabel(e[0]);if(r&&e[1]){if(set(r.el,e[1]))ok++;}}catch(e){}
});

// Selects en todos los docs
docs.forEach(function(doc){
  try{
    doc.querySelectorAll('select').forEach(function(sel){
      try{
        var lbl='';
        try{if(sel.id){var l=doc.querySelector('label[for="'+sel.id+'"]');if(l)lbl=l.textContent.toLowerCase();}}catch(e){}
        try{if(!lbl){var p=sel.closest('tr,div,td');if(p)lbl=p.textContent.toLowerCase().slice(0,80);}}catch(e){}
        if(lbl.indexOf('quirofano')>=0||lbl.indexOf('quirófano')>=0){try{if(setSelect(sel,d.quirofano))ok++;}catch(e){}}
        if((lbl.indexOf('anestesista')>=0||lbl.indexOf('profesional')>=0)&&lbl.indexOf('cirujano')<0){try{if(setSelect(sel,'HUERTA'))ok++;}catch(e){}}
        if(lbl.indexOf('cirujano')>=0&&lbl.indexOf('anest')<0){try{if(d.cirujano&&setSelect(sel,d.cirujano))ok++;}catch(e){}}
        if(lbl.indexOf('tipo')>=0&&lbl.indexOf('cirug')>=0){try{if(setSelect(sel,'PROGRAMADA'))ok++;}catch(e){}}
        if(lbl.indexOf('asa')>=0||lbl.indexOf('riesgo')>=0){try{if(d.asa&&setSelect(sel,'ASA '+d.asa))ok++;}catch(e){}}
      }catch(e){}
    });
  }catch(e){}
});

// Checkboxes monitoreo
var monMap={'etco2':d.monEtco2,'e-co2':d.monEtco2,'et co2':d.monEtco2,'pam':d.monPam,'ecg':d.monEcg,'sat o2':d.monSato2,'sato2':d.monSato2,'pani':d.monPani,'prot. decub':d.monDecub,'emergencia':d.monEmerg};
docs.forEach(function(doc){
  try{
    doc.querySelectorAll('input[type=checkbox]').forEach(function(cb){
      try{
        var lbl='';
        try{if(cb.id){var l=doc.querySelector('label[for="'+cb.id+'"]');if(l)lbl=l.textContent.toLowerCase();}}catch(e){}
        try{if(!lbl){var p=cb.closest('label,td,div,li');if(p)lbl=p.textContent.toLowerCase().slice(0,40);}}catch(e){}
        Object.keys(monMap).forEach(function(k){
          try{if(lbl.indexOf(k)>=0&&monMap[k]!==undefined&&cb.checked!==!!monMap[k])cb.click();}catch(e){}
        });
      }catch(e){}
    });
  }catch(e){}
});

// Edad y Peso en sección EVALUACION PREANESTESICA
docs.forEach(function(doc){
  try{
    var nodos=doc.querySelectorAll('*');
    for(var i=0;i<nodos.length;i++){
      try{
        if(nodos[i].children.length===0&&nodos[i].textContent.trim().toLowerCase().indexOf('evaluacion preanestesica')>=0){
          var sec=null;
          try{sec=nodos[i].closest('table,div,fieldset,section');}catch(e){sec=nodos[i].parentElement;}
          if(sec){
            try{
              sec.querySelectorAll('label,td,span').forEach(function(lbl){
                try{
                  var t=lbl.textContent.trim().toLowerCase();
                  var p=null;try{p=lbl.closest('tr,div,td');}catch(e){p=lbl.parentElement;}
                  var inp=p?p.querySelector('input:not([type=hidden]):not([type=checkbox])'):null;
                  if(!inp)return;
                  if((t==='edad'||t==='edad:')&&!prohibido(inp,doc)&&d.edad){if(set(inp,d.edad))ok++;}
                  if((t==='peso'||t==='peso:'||t==='peso (kg)')&&!prohibido(inp,doc)&&d.peso){if(set(inp,d.peso))ok++;}
                }catch(e){}
              });
            }catch(e){}
          }
          break;
        }
      }catch(e){}
    }
  }catch(e){}
});

// Signos vitales en tabla
if(d.vitals&&d.vitals.length){
  docs.forEach(function(doc){
    try{
      doc.querySelectorAll('table').forEach(function(tabla){
        try{
          var h=tabla.textContent.toLowerCase();
          if(h.indexOf('sist')<0||h.indexOf('fc')<0)return;
          var rows=tabla.querySelectorAll('tbody tr');
          if(rows.length<2)return;
          d.vitals.forEach(function(v,idx){
            try{
              if(!rows[idx])return;
              var inputs=rows[idx].querySelectorAll('input:not([type=hidden])');
              var vals=[v.sist,v.diast,v.sato2,v.eco2,v.fc,v.pam];
              vals.forEach(function(val,i){try{if(inputs[i]&&val)set(inputs[i],String(val));}catch(e){} });
            }catch(e){}
          });
        }catch(e){}
      });
    }catch(e){}
  });
}

// ── 7. Resultado ──────────────────────────────────────────────────────
var msg='AnestFact \u2192 GECLISA\n';
msg+='\u2713 '+ok+' campos rellenados ('+docs.length+' frame'+(docs.length!==1?'s':'')+' analizados).\n';
if(ok===0)msg+='\u26a0 No se encontraron campos.\nAsegurate de estar en la FOJA ANEST\u00c9SICA (no en b\u00fasqueda de paciente).';
else msg+='Revis\u00e1 y hac\u00e9 clic en GRABAR.';
alert(msg);

return void(0); // evita que Chrome navegue la ventana
})();
