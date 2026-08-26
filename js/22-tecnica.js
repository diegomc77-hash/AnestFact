function getMetodoTipoDesdeTecnica(){
  var tipo=document.getElementById('fj-tec-tipo')?document.getElementById('fj-tec-tipo').value:'';
  var sub=(document.getElementById('fj-tec-subtipo')?document.getElementById('fj-tec-subtipo').value:'')||'';
  if(tipo==='general')return /TIVA/i.test(sub)?'tiva':'general';
  if(tipo==='neuroaxial'){
    if(!sub)return '';
    if(/ombinada|CSE/i.test(sub))return 'combinada';
    if(/pidural|at[eé]ter/i.test(sub))return 'peridural';
    return 'raquidea';
  }
  if(tipo==='bloqueo')return 'bloqueo';
  if(tipo==='sedacion')return 'sedacion';
  if(tipo==='local')return 'localasistida';
  return '';
}

function formatMaterialDescartable(){
  var tipoTec=document.getElementById('fj-tec-tipo')?document.getElementById('fj-tec-tipo').value:'';
  var sub=(document.getElementById('fj-tec-subtipo')?document.getElementById('fj-tec-subtipo').value:'')||'';
  var aguja=document.getElementById('fj-tec-aguja')?document.getElementById('fj-tec-aguja').value:'';
  var calibre=document.getElementById('fj-tec-calibre')?document.getElementById('fj-tec-calibre').value:'';
  if(tipoTec==='sedacion'||tipoTec==='local')return '';
  if(tipoTec!=='neuroaxial'&&tipoTec!=='bloqueo')return null;
  if(!aguja)return '';
  var esCSE=/ombinada|CSE/i.test(sub);
  if(esCSE){
    return 'Kit CSE (needle-through-needle): aguja '+aguja+' '+(calibre||'')+' + aguja raquídea. Catéter peridural.';
  }
  if(aguja==='Punta de Lápiz'){
    if(!calibre)return 'Aguja raquídea AR (calibre por seleccionar) PL';
    return 'Aguja raquídea AR '+calibre.replace(/G/i,'')+' PL';
  }
  if(aguja==='Cortante (Quincke)'){
    return 'Aguja raquídea Quincke '+(calibre||'')+'.';
  }
  if(aguja==='Tuohy'||aguja==='Crawford'){
    return 'Aguja '+aguja+' '+(calibre||'')+'. Catéter peridural.';
  }
  return aguja+(calibre?' '+calibre:'')+'.';
}

function actualizarMetodosResumen(){
  var el=document.getElementById('metodos-resumen-tipo');
  if(!el)return;
  var sub=document.getElementById('fj-tec-subtipo')?document.getElementById('fj-tec-subtipo').value:'';
  var val=document.getElementById('fj-tec')?document.getElementById('fj-tec').value:'';
  if(sub||val)el.textContent='Método (desde técnica): '+(sub||val);
  else el.textContent='';
}

function syncMetodosExtraUI(tipo){
  var extra=document.getElementById('metodos-extra');
  if(!extra)return;
  extra.setAttribute('data-tipo',tipo||'');
  if(tipo==='general'||tipo==='tiva'){
    if(!document.getElementById('metodos-tubo')){
      extra.style.display='block';
      extra.innerHTML='<div class="field" style="margin-bottom:8px"><label>Tubo endotraqueal Nº</label><select class="fi" id="metodos-tubo" onchange="actualizarMetodos()"><option>5</option><option>6</option><option>7</option><option>7 1/2</option><option>8</option></select></div>';
    } else extra.style.display='block';
  } else {
    extra.style.display='none';
    extra.innerHTML='';
  }
}

function setMetodos(tipo){
  // Drogas según subtipo real (TIVA ≠ balanceada). Nunca forzar 'general' a ciegas.
  if(typeof _sugerirDrogasPorTec==='function')_sugerirDrogasPorTec();
  else if(tipo&&typeof sugerirDrogas==='function'){
    var t=typeof getMetodoTipoDesdeTecnica==='function'?getMetodoTipoDesdeTecnica():tipo;
    if(t)sugerirDrogas(t);
  }
  actualizarMetodos();
}

function actualizarMetodos(soloMateriales){
  var tipo=getMetodoTipoDesdeTecnica();
  syncMetodosExtraUI(tipo);
  actualizarMetodosResumen();
  var ta=document.getElementById('fj-metodos');
  var esRegional=(tipo==='raquidea'||tipo==='peridural'||tipo==='combinada'||tipo==='bloqueo');
  var fn=tipo?METODOS_TEXTOS[tipo]:null;
  if(!soloMateriales&&ta&&fn){
    if(esRegional){
      // Relato largo lo arma tecNivel4Check (con fármacos). Solo seed corto si está vacío.
      if(!ta.value||ta.value.length<40)ta.value=fn();
    } else {
      var texto=fn();
      var anexo=typeof formatDrogasMetodosAnexo==='function'?formatDrogasMetodosAnexo():'';
      if(anexo)texto=(texto?texto.replace(/\s+$/,'')+' ':'')+anexo;
      ta.value=texto;
    }
  }
  var mat=document.getElementById('fj-materiales');
  if(!mat)return;
  var tipoTec=document.getElementById('fj-tec-tipo')?document.getElementById('fj-tec-tipo').value:'';
  if(tipoTec==='sedacion'||tipoTec==='local'){mat.value='';return;}
  var regionalMat=formatMaterialDescartable();
  if(regionalMat!==null){
    if(regionalMat)mat.value=regionalMat;
    return;
  }
  var via2=document.getElementById('fj-via')?document.getElementById('fj-via').value:'';
  if(via2==='TRAQUEO'||via2==='Traqueostomía'){
    if(!document.getElementById('metodos-tubo')){
      var extra=document.getElementById('metodos-extra');
      if(extra){
        extra.style.display='block';
        var prevVal=document.getElementById('metodos-tubo')?document.getElementById('metodos-tubo').value:'';
        extra.innerHTML='<div class="field"><label>Traqueoflex con balón Nº</label>'
          +'<select class="fi" id="metodos-tubo" onchange="actualizarMetodos()">'
          +'<option>6</option><option>7</option><option>7.5</option><option>8</option>'
          +'<option>8.5</option><option>9</option><option>9.5</option>'
          +'<option>10</option><option>10.5</option><option>11</option>'
          +'</select></div>';
        var sel=document.getElementById('metodos-tubo');
        if(sel&&prevVal&&['6','7','7.5','8','8.5','9','9.5','10','10.5','11'].indexOf(prevVal)>=0)sel.value=prevVal;
      }
    }
    var t=document.getElementById('metodos-tubo');
    mat.value='Traqueoflex con balón Nº '+(t?t.value:'8')+'.';
  } else if(tipo==='general'||tipo==='tiva'){
    if(via2==='ML'){
      mat.value='Máscara Laríngea (Dispositivo Supraglótico).';
    } else if(via2==='INT_NASO'){
      var t=document.getElementById('metodos-tubo');
      mat.value='Tubo nasotraqueal Nº '+(t?t.value:'7')+'.';
    } else {
      var t2=document.getElementById('metodos-tubo');
      mat.value='Tubo endotraqueal Nº '+(t2?t2.value:'7')+'.';
    }
  } else {
    mat.value='';
  }
}

// === RECUPERACIÓN ALDRETE + BROMAGE + RAMSAY + DESTINO ===
var _aldrete='',_destino='',_destinoExtra='',_arm='',_inotrop='';
var _bromage='',_ramsay='';
var _antecedentes=[];
var _viaEgreso='',_spo2='',_neuro='',_hemo='',_anal='',_ahem='';

var BROMAGE_LABELS={
  '0':'Nulo — movimiento libre de pies y rodillas (100% movilidad)',
  '1':'Parcial — puede doblar rodillas y mover los pies',
  '2':'Casi total — incapaz de doblar rodillas, solo mueve los pies',
  '3':'Total — incapaz de mover rodillas o pies'
};
var RAMSAY_LABELS={
  '1':'Ansioso, agitado o inquieto',
  '2':'Cooperador, orientado y tranquilo',
  '3':'Dormido, responde a órdenes verbales',
  '4':'Dormido, respuesta rápida a estímulo leve (glabela) o sonido fuerte',
  '5':'Dormido, respuesta lenta al mismo estímulo físico',
  '6':'Sin respuesta a ningún estímulo'
};

function setAldrete(val){
  _aldrete=val;
  var inp=document.getElementById('fj-aldrete');
  if(inp)inp.value=val?'Aldrete '+val+'/10':'';
  var sel=document.getElementById('fj-aldrete-sel');
  if(sel&&String(sel.value)!==String(val||''))sel.value=val||'';
  document.querySelectorAll('#aldrete-chips .chip').forEach(function(b){b.style.background='var(--bg3)';b.style.borderColor='var(--border)';b.style.color='var(--text)';});
  if(typeof event!=='undefined'&&event&&event.target&&event.target.classList&&event.target.classList.contains('chip')){
    event.target.style.background='rgba(34,197,94,.15)';event.target.style.borderColor='var(--green)';event.target.style.color='var(--green)';
  }
  actualizarRecup();
}
function setBromage(val,silent){
  _bromage=val?String(val):'';
  var inp=document.getElementById('fj-bromage');
  if(inp)inp.value=_bromage?('Bromage grado '+_bromage+' ('+(BROMAGE_LABELS[_bromage]||'')+')'):'';
  var sel=document.getElementById('fj-bromage-sel');
  if(sel&&String(sel.value)!==_bromage)sel.value=_bromage;
  if(!silent)actualizarRecup();
}
function setRamsay(val,silent){
  _ramsay=val?String(val):'';
  var inp=document.getElementById('fj-ramsay');
  if(inp)inp.value=_ramsay?('Ramsay nivel '+_ramsay+': '+(RAMSAY_LABELS[_ramsay]||'')):'';
  var sel=document.getElementById('fj-ramsay-sel');
  if(sel&&String(sel.value)!==_ramsay)sel.value=_ramsay;
  if(!silent)actualizarRecup();
}
/** Bromage solo neuroaxial; Ramsay solo sedacion; Aldrete siempre. */
function updateEscalasRecupPorTecnica(silentClear){
  var tipo=(document.getElementById('fj-tec-tipo')||{value:''}).value||'';
  var showB=tipo==='neuroaxial';
  var showR=tipo==='sedacion';
  var bw=document.getElementById('bromage-wrap');
  var rw=document.getElementById('ramsay-wrap');
  if(bw){
    bw.style.display=showB?'block':'none';
    if(!showB&&_bromage)setBromage('',!!silentClear);
  }
  if(rw){
    rw.style.display=showR?'block':'none';
    if(!showR&&_ramsay)setRamsay('',!!silentClear);
  }
}
function setDestino(val){_destino=val;_destinoExtra='';_arm='';_inotrop='';var extra=document.getElementById('destino-extra');var intoExtra=document.getElementById('intubado-extra');if(extra)extra.style.display=(val==='UTI'||val==='UCI')?'block':'none';if(intoExtra)intoExtra.style.display='none';actualizarRecup();}
function setDestinoExtra(val){_destinoExtra=val;_arm='';_inotrop='';var intoExtra=document.getElementById('intubado-extra');if(intoExtra)intoExtra.style.display=(val==='intubado')?'block':'none';actualizarRecup();}
function setARM(val){_arm=val;actualizarRecup();}
function setInotrop(val){_inotrop=val;actualizarRecup();}
function actualizarRecup(){
  var partes=[];
  if(_aldrete)partes.push('Aldrete '+_aldrete+'/10');
  if(_bromage)partes.push('Bromage grado '+_bromage+' ('+(BROMAGE_LABELS[_bromage]||'')+')');
  if(_ramsay)partes.push('Ramsay nivel '+_ramsay+': '+(RAMSAY_LABELS[_ramsay]||''));
  if(_destino)partes.push('Pasa a '+_destino);
  if(_viaEgreso)partes.push(_viaEgreso);
  if(_spo2)partes.push(_spo2);
  if(_neuro)partes.push(_neuro);
  if(_hemo)partes.push(_hemo);
  if(_anal)partes.push(_anal);
  if(_ahem)partes.push(_ahem);
  var recup=document.getElementById('fj-recup');
  if(recup)recup.value=partes.join('. ')+(partes.length?'.':'');
}
function toggleAntec(btn,val){
  var idx=_antecedentes.indexOf(val);
  if(idx>=0){_antecedentes.splice(idx,1);btn.style.background='var(--bg3)';btn.style.borderColor='var(--border)';btn.style.color='var(--text)';}
  else{_antecedentes.push(val);btn.style.background='rgba(34,197,94,.15)';btn.style.borderColor='var(--green)';btn.style.color='var(--green)';}
  document.querySelectorAll('#antec-chips button,#antec-chips-tec button').forEach(function(b){
    if(b.textContent===val||b.getAttribute('data-antec')===val){
      var on=_antecedentes.indexOf(val)>=0;
      b.style.background=on?'rgba(34,197,94,.15)':'var(--bg3)';
      b.style.borderColor=on?'var(--green)':'var(--border)';
      b.style.color=on?'var(--green)':'var(--text)';
    }
  });
  syncObsGeclisaAntecedentes();
  if(typeof renderAlertasClinicas==='function')renderAlertasClinicas();
  if(typeof _sugerirDrogasPorTec==='function'&&document.getElementById('fj-tec-tipo')){
    var t=document.getElementById('fj-tec-tipo').value;
    var st=document.getElementById('fj-tec-subtipo');
    _sugerirDrogasPorTec(st&&st.value?st.value:t);
  }
  if(typeof calcAtbProfilaxis==='function')calcAtbProfilaxis();
  if(typeof renderBalanceAlertas==='function')renderBalanceAlertas();
}
function syncObsGeclisaAntecedentes(){
  var ta=document.getElementById('fj-obs-geclisa');
  if(!ta)return;
  var extra=ta.value.replace(/^Antecedentes:[^.]*\.\s*/,'').trim();
  ta.value=(_antecedentes.length?'Antecedentes: '+_antecedentes.join(', ')+'. ':'')+(extra?extra:'');
}

function restaurarAntecedentes(arr){
  _antecedentes=Array.isArray(arr)?arr.slice():[];
  document.querySelectorAll('#antec-chips button,#antec-chips-tec button').forEach(function(b){
    var val=b.textContent.trim();
    var on=_antecedentes.indexOf(val)>=0;
    b.style.background=on?'rgba(34,197,94,.15)':'var(--bg3)';
    b.style.borderColor=on?'var(--green)':'var(--border)';
    b.style.color=on?'var(--green)':'var(--text)';
  });
  syncObsGeclisaAntecedentes();
  if(typeof renderAlertasClinicas==='function')renderAlertasClinicas();
}

// === GENERADOR DE CURVA DE SIGNOS VITALES ===
function generarCurvaVitales(){
  syncFojaHoras();
  var horas=readCirugiaHoras();
  var hi=horas.inicio,hf=horas.fin;
  if(!hi){toast('Ingres\u00e1 hora inicio de cirug\u00eda (Mayo o ficha del paciente)');return;}
  if(!hf){toast('Ingres\u00e1 hora fin de cirug\u00eda');return;}
  var span=duracionCirugiaMin(hi,hf);
  if(!span){toast('Horarios inv\u00e1lidos');return;}
  var dur=span.dur;
  var sist=parseInt((document.getElementById('sv-sist')||{value:'120'}).value)||120;
  var diast=parseInt((document.getElementById('sv-diast')||{value:'75'}).value)||75;
  var fc=parseInt((document.getElementById('sv-fc')||{value:'75'}).value)||75;
  var sat=parseInt((document.getElementById('sv-sat')||{value:'98'}).value)||98;
  var eco2=parseInt((document.getElementById('sv-eco2')||{value:'35'}).value)||35;
  var pam=parseInt((document.getElementById('sv-pam')||{value:'0'}).value)||Math.round((sist+2*diast)/3);
  var conCo2=document.getElementById('mon-etco2')&&document.getElementById('mon-etco2').checked;
  var conPam=document.getElementById('mon-pam')&&document.getElementById('mon-pam').checked;
  var evol=(document.getElementById('sv-evol')||{value:'estable'}).value;
  var MINS=[5,15,30,45,60,75,90,105,120,135,150,165,180,195,210,225,240];
  var puntos=MINS.filter(function(m){return m<=dur;});
  if(!puntos.length||puntos[puntos.length-1]<dur-5)puntos.push(dur);
  function c(base,t){
    var p=t/dur;var f=1;
    if(evol==='estable')f=1+(Math.random()-0.5)*0.08;
    else if(evol==='leve_descenso')f=(p<0.33?1-(p/0.33)*0.12:0.88+(p-0.33)*0.18)+(Math.random()-0.5)*0.06;
    else if(evol==='descenso_mod')f=1-(p*0.15)+(Math.random()-0.5)*0.06;
    else if(evol==='leve_aumento')f=1+(p*0.12)+(Math.random()-0.5)*0.06;
    else f=1+Math.sin(p*Math.PI*3)*0.15+(Math.random()-0.5)*0.08;
    return Math.round(base*f);
  }
  var rows=puntos.map(function(t){var s=c(sist,t);var d=c(diast,t);var f2=c(fc,t);var sa=Math.min(100,Math.max(90,Math.round(sat+(Math.random()-0.5)*2)));var e=conCo2?Math.round(eco2+(Math.random()-0.5)*3):'';var p=conPam?Math.round((s+2*d)/3):'';return {min:t,sist:s,diast:d,sato2:sa,eco2:e,fc:f2,pam:p};});
  var tbody=document.getElementById('mayo-vitals-body');
  if(tbody)tbody.innerHTML=rows.map(function(r){return '<tr><td style="border:1px solid var(--border);padding:3px 6px;text-align:center;font-size:11px;color:var(--text3);font-weight:bold">'+r.min+'</td>'+[r.sist,r.diast,r.sato2,r.eco2,r.fc,r.pam].map(function(v){return '<td style="border:1px solid var(--border);padding:3px 6px;text-align:center;font-size:12px">'+v+'</td>';}).join('')+'</tr>';}).join('');
  var preview=document.getElementById('mayo-vitals-preview');if(preview)preview.style.display='block';
  var info=document.getElementById('mayo-vitals-info');if(info)info.textContent='\u2713 '+rows.length+' filas generadas para '+dur+' min ('+hi+' \u2192 '+hf+')';
  if(S.cur){if(!S.cur.foja)S.cur.foja={drogas:[],vitals:[]};S.cur.foja.mayo_vitals=rows;var ix=S.intervs.findIndex(function(i){return i.id===S.cur.id;});if(ix>=0)S.intervs[ix]=S.cur;saveIntervsToStorage();}
  toast('Curva generada \u2713 '+rows.length+' filas');
}

// === COPIAR TODO GECLISA ===
function copiarTodoGeclisa(){
  if(!window._geclisaTexto)renderGeclisa();
  var txt=window._geclisaTexto||'';
  if(!txt){toast('No hay datos cargados en el paciente');return;}
  _copiarTexto(txt,
    function(){toast('\ud83d\udccb Todos los datos copiados \u2014 peg\u00e1 en GECLISA');},
    function(){_mostrarParaCopiar(txt,'Datos GECLISA');}
  );
}


// ═══ SELECTOR EN CASCADA DE TÉCNICA ANESTÉSICA ═══════════════════════
var TEC_OPCIONES = {
  general: {
    label: 'Tipo de anestesia general',
    opciones: [
      {val:'Anestesia General Balanceada', txt:'Anestesia General Balanceada (inducci\u00f3n EV + mantenimiento inhalatorio)'},
      {val:'Anestesia General TIVA', txt:'Anestesia General TIVA (Total Intravenosa)'}
    ],
    nivel3: false
  },
  neuroaxial: {
    label: 'Tipo de anestesia neuroaxial',
    opciones: [
      {val:'Anestesia Raqu\u00eddea', txt:'Anestesia Raqu\u00eddea (Subaracnoidea / Intratecal)'},
      {val:'Anestesia Epidural con cat\u00e9ter', txt:'Anestesia Epidural (Peridural) con cat\u00e9ter'},
      {val:'Anestesia Combinada Raqui-Epidural', txt:'Anestesia Combinada Raqui-Epidural (CSE)'}
    ],
    nivel3: false
  },
  bloqueo: {
    label: 'Regi\u00f3n a bloquear',
    opciones: [
      {val:'miembro_sup', txt:'Miembro Superior'},
      {val:'miembro_inf', txt:'Miembro Inferior'},
      {val:'tronco', txt:'Tronco / Abdomen / T\u00f3rax'}
    ],
    nivel3: {
      miembro_sup: {
        label: 'Bloqueo de miembro superior',
        opciones: [
          'Bloqueo Interescal\u00e9nico (plexo braquial C5-C7) - hombro y clav\u00edcula',
          'Bloqueo Supraclavicular (plexo braquial - troncos) - brazo, codo, antebrazo y mano',
          'Bloqueo Infraclavicular (plexo braquial - cordones) - codo hasta mano',
          'Bloqueo Axilar (plexo braquial - ramas terminales) - antebrazo y mano',
          'Bloqueos distales de mu\u00f1eca (Mediano / Cubital / Radial)'
        ]
      },
      miembro_inf: {
        label: 'Bloqueo de miembro inferior',
        opciones: [
          'Bloqueo Plexo Lumbar - Compartimento del Psoas (cadera y muslo anterior)',
          'Bloqueo Nervio Femoral (f\u00e9mur, r\u00f3tula, muslo anterior)',
          'Bloqueo Canal Aductor - Nervio Safeno (analgesia rodilla sin bloqueo motor)',
          'Bloqueo Nervio Ci\u00e1tico Abordaje Subgl\u00fateo (pierna entera o pie)',
          'Bloqueo Nervio Ci\u00e1tico Fosa Popl\u00edtea (tobillo y pie)',
          'Bloqueo de Tobillo - Ankle Block (5 nervios terminales)'
        ]
      },
      tronco: {
        label: 'Bloqueo de tronco / abdomen / t\u00f3rax',
        opciones: [
          'Bloqueo TAP (Plano Transverso del Abdomen) - pared abdominal infraumbilical',
          'Bloqueo Erector de la Espina - ESP Block (cirug\u00eda tor\u00e1cica, mamaria o espinal)',
          'Bloqueo PECS I y II (cirug\u00eda mamaria y axilar)',
          'Bloqueo Serrato-Intercostal - BRILMA / Serratus Plane (t\u00f3rax anterolateral)',
          'Bloqueo Cuadrado Lumbar - QL Block (analgesia abdominal profunda y cadera)',
          'Bloqueo de la Vaina del Recto (analgesia línea media abdominal)'
        ]
      }
    }
  },
  local: {
    label: 'Tipo de anestesia local',
    opciones: [
      {val:'Anestesia Local T\u00f3pica', txt:'Anestesia Local T\u00f3pica (cremas, geles o aerosoles)'},
      {val:'Anestesia Local por Infiltraci\u00f3n', txt:'Anestesia Local por Infiltraci\u00f3n directa en tejidos'}
    ],
    nivel3: false
  },
  sedacion: {
    label: 'Nivel de sedaci\u00f3n',
    opciones: [
      {val:'Sedaci\u00f3n M\u00ednima (Ansiolisis)', txt:'Sedaci\u00f3n M\u00ednima / Ansiolisis - paciente responde normalmente'},
      {val:'Sedaci\u00f3n Moderada (Consciente)', txt:'Sedaci\u00f3n Moderada / Consciente - responde a \u00f3rdenes verbales o t\u00e1ctiles'},
      {val:'Sedaci\u00f3n Profunda', txt:'Sedaci\u00f3n Profunda - responde solo a est\u00edmulos dolorosos repetidos'},
      {val:'Cuidado Anest\u00e9sico Monitorizado (CAM)', txt:'Cuidado Anest\u00e9sico Monitorizado (CAM)'}
    ],
    nivel3: false
  }
};

function tecNivel1(){
  var tipo = document.getElementById('fj-tec-tipo').value;
  if(typeof onTecnicaCambioDetectar==='function')onTecnicaCambioDetectar();
  var n2wrap = document.getElementById('tec-nivel2-wrap');
  var n3wrap = document.getElementById('tec-nivel3-wrap');
  var resumen = document.getElementById('tec-resumen');
  document.getElementById('fj-tec').value = '';
  document.getElementById('tec-resumen-txt').textContent = '';
  resumen.style.display = 'none';
  n3wrap.style.display = 'none';
  // Al cambiar tipo, vaciar relato previo (se regenera al completar técnica/drogas)
  if(typeof _tecRestaurando==='undefined'||!_tecRestaurando){
    var met=document.getElementById('fj-metodos');
    if(met)met.value='';
  }

  if(!tipo){ n2wrap.style.display='none'; return; }

  var cfg = TEC_OPCIONES[tipo];
  if(!cfg){ n2wrap.style.display='none'; return; }

  document.getElementById('tec-nivel2-label').textContent = cfg.label;
  var sel2 = document.getElementById('fj-tec-subtipo');
  sel2.innerHTML = '<option value="">Seleccionar...</option>';
  cfg.opciones.forEach(function(op){
    var o = document.createElement('option');
    o.value = op.val || op;
    o.textContent = op.txt || op;
    sel2.appendChild(o);
  });
  n2wrap.style.display = 'block';
  if(typeof _tecSubPrev!=='undefined')_tecSubPrev='';
  if(typeof actualizarViaAerea==='function')actualizarViaAerea();
  else if(typeof actualizarMonitoreoMayo==='function')actualizarMonitoreoMayo();
  // Tubo + drogas: setMetodos ya resuelve TIVA vs gases según subtipo
  if(tipo==='general'||tipo==='tiva')setMetodos(tipo);
  else{
    actualizarMetodos();
    if(typeof _sugerirDrogasPorTec==='function')_sugerirDrogasPorTec();
  }
  renderExamenRegional(tipo);
  if(typeof updateEscalasRecupPorTecnica==='function')updateEscalasRecupPorTecnica();
}

function tecNivel2(){
  var tipo = document.getElementById('fj-tec-tipo').value;
  var subtipo = document.getElementById('fj-tec-subtipo').value;
  var n3wrap = document.getElementById('tec-nivel3-wrap');
  var resumen = document.getElementById('tec-resumen');
  document.getElementById('fj-tec').value = '';
  resumen.style.display = 'none';

  if(!subtipo){
    n3wrap.style.display='none';
    if(typeof _sugerirDrogasPorTec==='function')_sugerirDrogasPorTec();
    return;
  }

  var cfg = TEC_OPCIONES[tipo];
  // Check if this subtipo needs a nivel3 (bloqueos por región)
  if(cfg && cfg.nivel3 && cfg.nivel3[subtipo]){
    var n3cfg = cfg.nivel3[subtipo];
    document.getElementById('tec-nivel3-label').textContent = n3cfg.label;
    var sel3 = document.getElementById('fj-tec-bloqueo');
    sel3.innerHTML = '<option value="">Seleccionar...</option>';
    n3cfg.opciones.forEach(function(op){
      var o = document.createElement('option');
      o.value = op; o.textContent = op;
      sel3.appendChild(o);
    });
    n3wrap.style.display = 'block';
    // Región elegida: medicación de esa región (aún sin bloqueo específico)
    if(typeof onTecnicaCambioDetectar==='function')onTecnicaCambioDetectar();
    if(typeof actualizarViaAerea==='function')actualizarViaAerea();
    if(typeof _sugerirDrogasPorTec==='function')_sugerirDrogasPorTec(subtipo);
    if(typeof actualizarMetodos==='function')actualizarMetodos();
  } else {
    // No nivel3 needed - set the value directly (local, sedación, general, neuroaxial)
    n3wrap.style.display = 'none';
    tecSetFinal(subtipo);
  }
}

function tecNivel3(){
  var val = document.getElementById('fj-tec-bloqueo').value;
  if(val) tecSetFinal(val);
}

function tecSetFinal(val){
  if(typeof onTecnicaCambioDetectar==='function')onTecnicaCambioDetectar();
  document.getElementById('fj-tec').value = val;
  var res = document.getElementById('tec-resumen');
  document.getElementById('tec-resumen-txt').textContent = '✓ ' + val;
  res.style.display = 'block';
  var tipo = document.getElementById('fj-tec-tipo').value;
  // Activar nivel4 si es bloqueo regional
  if(tipo==='neuroaxial'||tipo==='bloqueo'){
    tecNivel4Activar(tipo);
  } else {
    document.getElementById('tec-nivel4-wrap').style.display='none';
  }
  // Refrescar vía/oxígeno + agentes (con tick para que el DOM del subtipo esté estable)
  if(typeof actualizarViaAerea==='function')actualizarViaAerea();
  if(typeof _sugerirDrogasPorTec==='function')_sugerirDrogasPorTec(val);
  setTimeout(function(){
    if(typeof actualizarViaAerea==='function')actualizarViaAerea();
    if(typeof _sugerirDrogasPorTec==='function')_sugerirDrogasPorTec(val);
    if(typeof actualizarMetodos==='function')actualizarMetodos();
  },30);
}

function tecNivel4Activar(tipo){
  var wrap=document.getElementById('tec-nivel4-wrap');
  wrap.style.display='block';
  var esNeuroaxial=(tipo==='neuroaxial');
  // Espacio intervertebral — solo neuroaxial, opciones según subtipo
  document.getElementById('tec-espacio-wrap').style.display=esNeuroaxial?'block':'none';
  if(esNeuroaxial){
    var subtipo2=document.getElementById('fj-tec-subtipo').value||'';
    var selEsp=document.getElementById('fj-tec-espacio');
    selEsp.innerHTML='<option value="">Seleccionar...</option>';
    var espacios=[];
    if(subtipo2.indexOf('pidural')>=0||subtipo2.indexOf('at\u00e9ter')>=0||subtipo2.indexOf('CSE')>=0||subtipo2.indexOf('ombinada')>=0){
      // Peridural o Combinada: T3-T4 hasta L4-L5
      espacios=['T3-T4','T4-T5','T5-T6','T6-T7','T7-T8','T8-T9','T9-T10','T10-T11','T11-T12','T12-L1','L1-L2','L2-L3','L3-L4','L4-L5'];
    } else {
      // Raquídea subaracnoidea: T11-T12 hasta L4-L5
      espacios=['T11-T12','T12-L1','L1-L2','L2-L3','L3-L4','L4-L5'];
    }
    espacios.forEach(function(e){
      var op=document.createElement('option');op.value=e;op.textContent=e;selEsp.appendChild(op);
    });
  }
  // Lateralidad — solo bloqueos periféricos
  document.getElementById('tec-lateral-wrap').style.display=esNeuroaxial?'none':'block';
  // Aguja — según subtipo
  var subtipo3=document.getElementById('fj-tec-subtipo').value||'';
  var selAguja=document.getElementById('fj-tec-aguja');
  var agujas=[];
  if(esNeuroaxial){
    if(subtipo3.indexOf('pidural')>=0||subtipo3.indexOf('atéter')>=0||subtipo3.indexOf('ombinada')>=0||subtipo3.indexOf('CSE')>=0){
      agujas=['Tuohy','Crawford'];
    } else {
      agujas=['Punta de Lápiz','Cortante (Quincke)'];
    }
  } else {
    agujas=['Aguja Ecogénica','Aguja Estimulable','Aguja de Bisel Corto'];
  }
  selAguja.innerHTML='<option value="">Seleccionar...</option>';
  agujas.forEach(function(a){var op=document.createElement('option');op.value=a;op.textContent=a;selAguja.appendChild(op);});
  document.getElementById('tec-aguja-wrap').style.display='block';
  document.getElementById('tec-calibre-wrap').style.display='none';
  document.getElementById('fj-tec-aguja').value='';
  document.getElementById('fj-tec-calibre').value='';
  // Guía — siempre
  document.getElementById('tec-guia-wrap').style.display='block';
  // Resultado clínico — opciones según tipo
  var selRes=document.getElementById('fj-tec-resultado');
  selRes.innerHTML='<option value="">Seleccionar...</option>';
  var opts=esNeuroaxial
    ?['T4','T6','T8','T10','T12','L1']
    :['Bloqueo sensitivo completo','Bloqueo sensitivo parcial','Bloqueo no satisfactorio'];
  opts.forEach(function(o){
    var op=document.createElement('option');op.value=o;op.textContent=o;selRes.appendChild(op);
  });
  document.getElementById('tec-resultado-wrap').style.display='block';
  // Limpiar selects
  ['fj-tec-espacio','fj-tec-lateral','fj-tec-guia','fj-tec-resultado'].forEach(function(id){
    var el=document.getElementById(id);if(el)el.value='';
  });
}

function tecActualizarCalibres(){
  var aguja=document.getElementById('fj-tec-aguja').value;
  if(!aguja)return;
  var calibresMap={
    'Punta de Lápiz':['25G','27G'],
    'Cortante (Quincke)':['22G','25G','27G'],
    'Tuohy':['16G','17G','18G'],
    'Crawford':['16G','17G','18G'],
    'Aguja Ecogénica':['21G','22G'],
    'Aguja Estimulable':['21G','22G'],
    'Aguja de Bisel Corto':['21G','22G']
  };
  var calibres=calibresMap[aguja]||[];
  var selCal=document.getElementById('fj-tec-calibre');
  selCal.innerHTML='<option value="">Seleccionar calibre...</option>';
  calibres.forEach(function(c){var op=document.createElement('option');op.value=c;op.textContent=c;selCal.appendChild(op);});
  selCal.value='';
  document.getElementById('tec-calibre-wrap').style.display='block';
  actualizarMetodos();
}

function tecActualizarDermatomas(){
  var espacio=document.getElementById('fj-tec-espacio').value;
  var selRes=document.getElementById('fj-tec-resultado');
  if(!selRes||!espacio)return;
  var tipo=document.getElementById('fj-tec-tipo').value;
  if(tipo!=='neuroaxial')return;
  // Matriz de dermatomas según espacio
  var matriz={
    'T3-T4':['T2','T4','T6'],
    'T4-T5':['T2','T4','T6'],
    'T5-T6':['T2','T4','T6'],
    'T6-T7':['T4','T6','T8','T10'],
    'T7-T8':['T4','T6','T8','T10'],
    'T8-T9':['T4','T6','T8','T10'],
    'T9-T10':['T6','T8','T10','T12'],
    'T10-T11':['T6','T8','T10','T12'],
    'T11-T12':['T6','T8','T10','T12'],
    'T12-L1':['T8','T10','T12','L1'],
    'L1-L2':['T8','T10','T12','L1'],
    'L2-L3':['T6','T8','T10','T12','L1'],
    'L3-L4':['T10','T12','L1','L2','L3'],
    'L4-L5':['T12','L1','L2','L3','L4','L5']
  };
  var opts=matriz[espacio]||[];
  selRes.innerHTML='<option value="">Seleccionar dermatoma...</option>';
  opts.forEach(function(d){
    var op=document.createElement('option');op.value=d;op.textContent=d;selRes.appendChild(op);
  });
  selRes.value='';
}

function getDescTecnica(aguja, calibre){
  var c=calibre||'';
  var sub=(document.getElementById('fj-tec-subtipo')?document.getElementById('fj-tec-subtipo').value:'')||'';
  var esCSE=/ombinada|CSE/i.test(sub);
  if(esCSE&&(aguja==='Tuohy'||aguja==='Crawford')){
    return 'se realiza punción con aguja de tipo '+aguja+' número '+c+', identificando el espacio epidural mediante pérdida de resistencia; a través de su lumen se avanza aguja raquídea (técnica needle-through-needle), constatando flujo de líquido cefalorraquídeo libre, límpido y filante; tras la inyección intratecal se retira la aguja raquídea y se coloca catéter epidural avanzado sin dificultad';
  }
  if(aguja==='Tuohy'||aguja==='Crawford'){
    return 'se realiza punción con aguja de tipo '+aguja+' número '+c+', identificando el espacio epidural mediante la técnica de pérdida de resistencia con solución salina/aire, procediendo a la colocación de catéter epidural avanzado sin dificultad';
  } else if(aguja==='Punta de Lápiz'){
    return 'se realiza punción lumbar con aguja número '+c+' de tipo Punta de Lápiz, logrando el correcto posicionamiento tras constatar flujo de líquido cefalorraquideo libre, límpido y filante';
  } else if(aguja==='Cortante (Quincke)'){
    return 'se realiza punción lumbar con aguja número '+c+' de tipo Cortante (Quincke), orientando el bisel de forma paralela a las fibras longitudinales de la duramadre y constatando el retorno inmediato de líquido cefalorraquideo';
  } else if(aguja==='Aguja Ecogénica'){
    return 'bajo guía ecográfica en tiempo real, se avanza aguja de alta ecogenicidad número '+c+', manteniendo la correcta visibilidad de la punta en todo momento hasta posicionarla en el plano diana';
  } else if(aguja==='Aguja Estimulable'){
    return 'se introduce aguja aislada número '+c+' conectada a neuroestimulador periférico, buscando la respuesta motora específica con un umbral de intensidad óptimo entre 0.3 y 0.5 mA antes de la inyección';
  } else if(aguja==='Aguja de Bisel Corto'){
    return 'se avanza aguja de bisel corto número '+c+' mediante referencias anatómicas de superficie, avanzando con precaución hasta percibir los clics fasciales correspondientes';
  }
  return '';
}

function tecNivel4Check(){
  // Verificar si todos los campos requeridos están completos
  var tipo=document.getElementById('fj-tec-tipo').value;
  var esNeuroaxial=(tipo==='neuroaxial');
  var espacio=document.getElementById('fj-tec-espacio').value;
  var lateral=document.getElementById('fj-tec-lateral').value;
  var guia=document.getElementById('fj-tec-guia').value;
  var resultado=document.getElementById('fj-tec-resultado').value;
  if(!guia||!resultado)return;
  if(esNeuroaxial&&!espacio)return;
  if(!esNeuroaxial&&!lateral)return;
  var aguja=document.getElementById('fj-tec-aguja')?document.getElementById('fj-tec-aguja').value:'';
  var calibre=document.getElementById('fj-tec-calibre')?document.getElementById('fj-tec-calibre').value:'';
  if(!aguja||!calibre)return;
  var descTec=getDescTecnica(aguja,calibre);
  var subtipo=document.getElementById('fj-tec-subtipo').value||document.getElementById('fj-tec').value||'';
  var bloqueo=document.getElementById('fj-tec-bloqueo')?document.getElementById('fj-tec-bloqueo').value:'';
  var farmacos=typeof formatFarmacosTecRegional==='function'?formatFarmacosTecRegional():'';
  var esCSE=/ombinada|CSE/i.test(subtipo);
  var txt='';
  if(esNeuroaxial){
    var adminTxt;
    if(esCSE&&typeof formatFarmacosCSE==='function'){
      adminTxt=formatFarmacosCSE();
    } else if(farmacos){
      adminTxt='Tras realizar aspiración manual negativa para sangre, se procede a la administración de '+farmacos+' de forma segura';
    } else {
      adminTxt='Tras realizar aspiración manual negativa para sangre, se procede a la administración del fármaco de forma segura';
    }
    txt='Bajo estrictas medidas de asepsia y antisepsia, se realiza preparación del campo quirúrgico. '
      +'Se realiza procedimiento bajo anestesia regional de tipo '+subtipo+'. '
      +'Mediante guía por '+guia+' en el espacio intervertebral '+espacio+', '+descTec+'. '
      +adminTxt+', comprobando posteriormente '
      +'un nivel sensitivo máximo alcanzado en el dermatoma '+resultado+' con éxito.';
  } else {
    var nombre=bloqueo||subtipo||'bloqueo nervioso periférico';
    var depositoTxt=farmacos
      ?('se efectúa el depósito de '+farmacos+' sin incidentes')
      :'se efectúa el depósito del anestésico local sin incidentes';
    txt='Bajo estrictas medidas de asepsia y antisepsia, se realiza preparación del campo quirúrgico. '
      +'Se realiza procedimiento bajo anestesia regional de tipo Bloqueo de Nervio Periférico. '
      +'Mediante el uso de '+guia+', se procede al abordaje del '+nombre+' de localización '+lateral+'; '
      +descTec+'. '
      +'Tras comprobar el correcto posicionamiento y realizar aspiración manual negativa '
      +'para descartar inyección intravascular, '+depositoTxt+', '
      +'constatando un '+resultado+' previo al inicio de la cirugía.';
  }
  var metodos=document.getElementById('fj-metodos');
  if(metodos)metodos.value=txt;
  actualizarMetodos(true);
}

function tecLimpiar(){
  document.getElementById('fj-tec-tipo').value = '';
  document.getElementById('tec-nivel2-wrap').style.display = 'none';
  document.getElementById('tec-nivel3-wrap').style.display = 'none';
  document.getElementById('tec-nivel4-wrap').style.display = 'none';
  document.getElementById('tec-resumen').style.display = 'none';
  document.getElementById('fj-tec').value = '';
}

// Restore cascade on cargarFojaUI
function tecRestaurar(val){
  if(!val) return;
  document.getElementById('fj-tec').value = val;
  var res = document.getElementById('tec-resumen');
  if(res){ document.getElementById('tec-resumen-txt').textContent = '✓ ' + val; res.style.display='block'; }
}

