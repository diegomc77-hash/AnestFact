function actualizarExamenFisico(){
  if(typeof generarTextoResp==='function'){
    var mall=document.getElementById('fj-mallampati')?document.getElementById('fj-mallampati').value:'';
    var partes=[];
    if(mall)partes.push('Mallampati '+mall+'.');
    partes.push('Apertura bucal conservada.');
    partes.push('Aparato respiratorio: '+generarTextoResp()+'.');
    partes.push('Aparato cardiovascular: '+generarTextoCv()+'.');
    var ta=document.getElementById('fj-examen-fisico');
    if(ta){
      var actual=ta.value||'';
      var regionalMatch=actual.match(/\s*(Examen regional:.*)$/);
      var regional=regionalMatch?regionalMatch[1]:'';
      ta.value=partes.join(' ')+(regional?' '+regional:'');
    }
    if(typeof renderAlertasClinicas==='function')renderAlertasClinicas();
    return;
  }
  var mall=document.getElementById('fj-mallampati')?document.getElementById('fj-mallampati').value:'';
  var partes=[];
  if(mall)partes.push('Mallampati '+mall+'.');
  partes.push('Apertura bucal conservada.');
  partes.push('Aparato respiratorio: MV conservado bilateral, sin agregados.');
  partes.push('Aparato cardiovascular: Ruidos cardíacos normofonéticos, sin soplos.');
  var ta=document.getElementById('fj-examen-fisico');
  if(ta)ta.value=partes.join(' ');
}

function renderExamenRegional(tipoTec){
  var wrap=document.getElementById('examen-regional-wrap');
  var cont=document.getElementById('examen-regional-selects');
  if(!wrap||!cont)return;
  var esNeuroaxial=(tipoTec==='neuroaxial');
  var esBloqueo=(tipoTec==='bloqueo');
  if(!esNeuroaxial&&!esBloqueo){wrap.style.display='none';return;}
  wrap.style.display='block';
  cont.innerHTML='';

  var grupos=[];
  if(esNeuroaxial){
    grupos=[
      {id:'er-anat',t:'Anatomía de superficie',items:[
        'Puntos de reparo palp. y conservados',
        'Difícil palpación por obesidad',
        'Puntos de reparo no palpables'
      ]},
      {id:'er-eje',t:'Eje de la columna',items:[
        'Alineada',
        'Escoliosis',
        'Cifosis',
        'Escoliosis corregida quirúrgicamente'
      ]},
      {id:'er-esp',t:'Espacios intervertebrales',items:[
        'Conservados',
        'Disminuidos',
        'Pinzamientos',
        'Calcificación de ligamentos'
      ]},
      {id:'er-mov',t:'Movilidad / Flexión',items:[
        'Buena flexión lumbar',
        'Limitada',
        'Rigidez total'
      ]},
      {id:'er-piel',t:'Piel en zona de punción',items:[
        'Piel sana, sin contraindicaciones',
        'Tatuaje en zona de punción',
        'Signos de infección local ⚠️'
      ]}
    ];
  } else {
    // Bloqueo periférico
    var lat=document.getElementById('fj-tec-lateral')?document.getElementById('fj-tec-lateral').value:'';
    var blq=document.getElementById('fj-tec-bloqueo')?document.getElementById('fj-tec-bloqueo').value:'';
    var region=lat?(blq||'miembro')+' '+lat:'región a bloquear';
    grupos=[
      {id:'er-acc',t:'Anatomía / Accesibilidad',items:[
        'Reparos anatómicos conservados',
        'Edema severo',
        'Deformidad ósea',
        'Vendaje o yeso limitante'
      ]},
      {id:'er-neuro',t:'Estado neurológico basal',items:[
        'Sin déficit neurológico previo',
        'Parestesias',
        'Déficit motor previo',
        'Hipoestesia en territorio a bloquear'
      ]},
      {id:'er-vasc',t:'Estado vascular periférico',items:[
        'Pulsos distales presentes y simétricos',
        'Pulsos disminuidos',
        'Perfusión conservada'
      ]},
      {id:'er-piel2',t:'Sitio de punción',items:[
        'Piel indémne, libre de infección',
        'Escoriaciones',
        'Infección cercana a la zona',
        'Hematoma'
      ]}
    ];
  }

  grupos.forEach(function(g){
    var row=document.createElement('div');
    row.style.marginBottom='6px';
    var sel=document.createElement('select');
    sel.className='fi';
    sel.id=g.id;
    sel.style.fontSize='12px';
    var opt0=document.createElement('option');
    opt0.value='';opt0.textContent=g.t+' — elegir...';
    sel.appendChild(opt0);
    g.items.forEach(function(it,idx){
      var op=document.createElement('option');
      op.value=it;op.textContent=it;
      sel.appendChild(op);
      if(idx===0)sel.value=it; // Preseleccionar la primera (normal)
    });
    sel.onchange=function(){generarTextoRegional(tipoTec);};
    row.appendChild(sel);
    cont.appendChild(row);
  });

  // Generar texto inicial con valores por defecto
  generarTextoRegional(tipoTec);
}

function generarTextoRegional(tipoTec){
  var ta=document.getElementById('fj-examen-fisico');
  if(!ta)return;
  // Mantener el texto de Mallampati+auscultación al principio
  var esNeuroaxial=(tipoTec==='neuroaxial');

  if(esNeuroaxial){
    var anat=document.getElementById('er-anat')?document.getElementById('er-anat').value:'';
    var eje=document.getElementById('er-eje')?document.getElementById('er-eje').value:'';
    var esp=document.getElementById('er-esp')?document.getElementById('er-esp').value:'';
    var mov=document.getElementById('er-mov')?document.getElementById('er-mov').value:'';
    var piel=document.getElementById('er-piel')?document.getElementById('er-piel').value:'';
    var txt='Examen regional: Columna vertebral con '+
      (anat||'puntos de reparo palpables y conservados')+', eje '+
      (eje||'alineado').toLowerCase()+', espacios intervertebrales '+
      (esp||'conservados').toLowerCase()+'. '+
      (mov||'Buena flexión lumbar')+'. '+
      (piel||'Piel sana sin contraindicaciones locales para el procedimiento')+'.';
    // Preservar examen general (Mallampati etc.) y agregar regional
    var actual=ta.value||'';
    var sinRegional=actual.replace(/\s*Examen regional:.*$/,'').trim();
    ta.value=(sinRegional?sinRegional+' ':'')+txt;
  } else {
    var lat=document.getElementById('fj-tec-lateral')?document.getElementById('fj-tec-lateral').value:'';
    var blq=document.getElementById('fj-tec-bloqueo')?document.getElementById('fj-tec-bloqueo').value:'';
    var region=(lat?lat+' ':'')+( blq?'('+blq+')':'');
    var acc=document.getElementById('er-acc')?document.getElementById('er-acc').value:'';
    var neuro=document.getElementById('er-neuro')?document.getElementById('er-neuro').value:'';
    var vasc=document.getElementById('er-vasc')?document.getElementById('er-vasc').value:'';
    var piel2=document.getElementById('er-piel2')?document.getElementById('er-piel2').value:'';
    var txt='Examen regional: '+( region||'Miembro a bloquear')+' con '+
      (acc||'reparos anatómicos conservados')+'. '+
      'Examen neurológico basal: '+(neuro||'sin déficit motor ni sensitivo previo')+'. '+
      (vasc||'Pulsos distales presentes, adecuado relleno capilar')+'. '+
      (piel2||'Piel sana, libre de signos de infección local')+'.';
    var actual=ta.value||'';
    var sinRegional=actual.replace(/\s*Examen regional:.*$/,'').trim();
    ta.value=(sinRegional?sinRegional+' ':'')+txt;
  }
}

function esAnestesiaRegionalMayo(){
  var tipo=document.getElementById('fj-tec-tipo')?document.getElementById('fj-tec-tipo').value:'';
  return tipo==='neuroaxial'||tipo==='bloqueo'||tipo==='local';
}

var _monTecPrev='';
var _monUserEdited=false;

function bindMonitoreoMayoUI(){
  ['mon-etco2','mon-pam'].forEach(function(id){
    var el=document.getElementById(id);
    if(el&&!el.getAttribute('data-mon-bound')){
      el.addEventListener('change',function(){_monUserEdited=true;});
      el.setAttribute('data-mon-bound','1');
    }
  });
}

/** Ajusta monitoreo GECLISA según técnica. Respeta cambios manuales del usuario. */
function actualizarMonitoreoMayo(opts){
  opts=opts||{};
  var tipo=document.getElementById('fj-tec-tipo')?document.getElementById('fj-tec-tipo').value:'';
  var etco2=document.getElementById('mon-etco2');
  var pam=document.getElementById('mon-pam');
  if(!etco2&&!pam)return;
  var tipoCambio=tipo!==_monTecPrev;
  if(tipoCambio){_monTecPrev=tipo;_monUserEdited=false;}
  if(_monUserEdited&&!opts.force&&!opts.init)return;
  if(!tipoCambio&&!opts.force&&!opts.init)return;
  var esReg=tipo==='neuroaxial'||tipo==='bloqueo'||tipo==='local';
  var esSed=tipo==='sedacion';
  if(esReg||esSed){
    if(etco2)etco2.checked=false;
    if(pam)pam.checked=false;
  }else if(tipo==='general'){
    if(etco2)etco2.checked=true;
    if(pam)pam.checked=true;
  }
}

function actualizarViaAerea(){
  var tipo=document.getElementById('fj-tec-tipo')?document.getElementById('fj-tec-tipo').value:'';
  var sel=document.getElementById('fj-via');
  var viaWrap=sel?sel.closest('.field'):null;
  var viaLabel=viaWrap?viaWrap.querySelector('label'):null;
  if(!sel)return;
  var prevVal=sel.value;
  if(prevVal==='Puntas nasales')prevVal='C\u00e1nula nasal';
  sel.innerHTML='<option value="">&mdash;</option>';
  if(tipo==='general'){
    if(viaLabel)viaLabel.textContent='V\u00eda a\u00e9rea';
    [['IOT','Intubaci\u00f3n Orotraqueal'],
     ['INT_NASO','Intubaci\u00f3n Nasotraqueal'],
     ['TRAQUEO','Traqueostom\u00eda'],
     ['ML','M\u00e1scara Lar\u00edngea (Dispositivo Supragl\u00f3tico)']
    ].forEach(function(op){
      var o=document.createElement('option');o.value=op[0];o.textContent=op[1];sel.appendChild(o);
    });
    if(viaWrap)viaWrap.style.display='block';
  } else if(tipo==='sedacion'){
    // Sedación — soporte de oxígeno (no dispositivos de AG)
    if(viaLabel)viaLabel.textContent='Soporte de ox\u00edgeno';
    ['C\u00e1nula nasal','M\u00e1scara simple','M\u00e1scara con reservorio','Ventilaci\u00f3n espont\u00e1nea al aire ambiente'
    ].forEach(function(op){
      var o=document.createElement('option');o.value=op;o.textContent=op;sel.appendChild(o);
    });
    if(viaWrap)viaWrap.style.display='block';
  } else {
    if(viaLabel)viaLabel.textContent='V\u00eda a\u00e9rea';
    var o=document.createElement('option');o.value='no_aplica';o.textContent='No aplica';sel.appendChild(o);
    sel.value='no_aplica';
    if(viaWrap)viaWrap.style.display='none';
    actualizarMetodos();
    actualizarMonitoreoMayo({force:true});
    return;
  }
  actualizarMonitoreoMayo({force:true});
  // Restaurar solo si la opción existe en el select actual
  if(prevVal){
    var ok=false;
    for(var i=0;i<sel.options.length;i++){if(sel.options[i].value===prevVal){ok=true;break;}}
    sel.value=ok?prevVal:'';
  }
  actualizarMetodos();
}

function toggleMayoHelper(){
  var body=document.getElementById('mayo-helper-body');
  var arrow=document.getElementById('mayo-helper-arrow');
  if(!body)return;
  var open=body.style.display!=='none';
  body.style.display=open?'none':'block';
  if(arrow)arrow.style.transform=open?'':'rotate(180deg)';
}

function restaurarMayoVitals(rows){
  var tbody=document.getElementById('mayo-vitals-body');
  if(!tbody)return;
  tbody.innerHTML='';
  var preview=document.getElementById('mayo-vitals-preview');
  var info=document.getElementById('mayo-vitals-info');
  if(!rows||!rows.length){
    if(preview)preview.style.display='none';
    if(info)info.textContent='';
    return;
  }
  rows.forEach(function(r){
    var tr=document.createElement('tr');
    var minVal=r.min!=null?String(r.min):'';
    tr.innerHTML='<td style="border:1px solid var(--border);padding:2px 4px;font-size:11px;color:var(--text3);text-align:center;background:var(--bg3);font-weight:bold">'+(minVal||'')+'</td>'
      +['sist','diast','sato2','eco2','fc','pam'].map(function(p){
        var v=r[p]!=null?String(r[p]):'';
        return '<td style="border:1px solid var(--border);padding:1px"><input type="text" data-min="'+minVal+'" data-param="'+p+'" value="'+v.replace(/"/g,'&quot;')+'" style="width:38px;background:transparent;border:none;color:var(--text);font-size:12px;text-align:center;outline:none;padding:3px 0" placeholder=""></td>';
      }).join('');
    tbody.appendChild(tr);
  });
  if(preview)preview.style.display='block';
  if(info)info.textContent='\u2713 '+rows.length+' filas cargadas';
}

function renderFojaPorSanatorio(){
  // Read from live form OR saved data
  var sanEl=document.getElementById('f-san');
  var san=(sanEl&&sanEl.value)||((S.cur&&S.cur.san)||'');
  var esMayo=san.indexOf('Mayo')>=0;
  var quirWrap=document.getElementById('foja-mayo-quir-wrap');if(quirWrap)quirWrap.style.display=esMayo?'block':'none';
  // VG grid card - hide for Mayo
  var vc=document.getElementById('vitals-card');
  if(vc)vc.style.display=esMayo?'none':'block';
  // Mayo helper - show for Mayo
  var mh=document.getElementById('mayo-foja-helper');
  if(mh)mh.style.display=esMayo?'block':'none';
  // Acciones GECLISA al final de la foja (no a mitad de pantalla)
  var mga=document.getElementById('mayo-geclisa-actions');
  if(mga)mga.style.display=esMayo?'block':'none';
  var aea=document.getElementById('aero-evweb-actions');
  var esAero=san.toLowerCase().indexOf('aero')>=0||san.toLowerCase().indexOf('aeron')>=0;
  if(aea)aea.style.display=(!esMayo&&esAero)?'block':'none';
  if(typeof afUpdateEstadoAccionesUI==='function')afUpdateEstadoAccionesUI(S.cur);
  // Imprimir button - hide for Mayo (they use GECLISA)
  var bi=document.getElementById('btn-imprimir-foja');
  if(bi)bi.style.display=esMayo?'none':'block';
  var atw=document.getElementById('aero-tiempos-inline');if(atw)atw.style.display=esMayo?'none':'block';
  var ohw=document.getElementById('obs-hemo-wrap');if(ohw)ohw.style.display=esMayo?'none':'block';
  var atec=document.getElementById('antec-tec-wrap');if(atec)atec.style.display=esMayo?'none':'block';
  // Generate Mayo vitals rows if Mayo and no rows yet
  if(esMayo){
    bindMonitoreoMayoUI();
    var tbody=document.getElementById('mayo-vitals-body');
    if(S.cur&&S.cur.foja&&S.cur.foja.mayo_vitals&&S.cur.foja.mayo_vitals.length){
      restaurarMayoVitals(S.cur.foja.mayo_vitals);
    }else if(tbody&&!tbody.children.length){
      generarFilasMayo();
    }
  }else if(typeof restaurarMayoVitals==='function'){
    restaurarMayoVitals([]);
  }
  if(esMayo&&S.cur&&S.cur.foja){
    var f=S.cur.foja;
    function sv2(id,val){var e=document.getElementById(id);if(e)e.value=val||'';}
    sv2('foja-hora-inicio',S.cur.hora||'');
    sv2('foja-hora-fin',f.fin||'');
    if(typeof syncFojaHoras==='function')syncFojaHoras();
    sv2('fj-posicion',f.posicion);
    sv2('fj-nivel-regional',f.nivel_regional);
    sv2('fj-obs-geclisa',f.obs_geclisa);
    if(typeof syncObsGeclisaAntecedentes==='function')syncObsGeclisaAntecedentes();
    sv2('fj-materiales',f.materiales);
    sv2('fj-fluido1',f.fluido1);
    sv2('fj-fluido2',f.fluido2);
    if(f.mon_etco2!==undefined||f.mon_pam!==undefined){
      function scb(id,v){var e=document.getElementById(id);if(e)e.checked=!!v;}
      var esRegSaved=(f.tec_tipo==='neuroaxial'||f.tec_tipo==='bloqueo'||f.tec_tipo==='local'||f.tec_tipo==='sedacion');
      scb('mon-etco2',esRegSaved?false:!!f.mon_etco2);
      scb('mon-pam',esRegSaved?false:!!f.mon_pam);
      scb('mon-ecg',f.mon_ecg!==false);
      scb('mon-sato2',f.mon_sato2!==false);
      scb('mon-pani',f.mon_pani!==false);
      scb('mon-decub',!!f.mon_decub);
      scb('mon-emerg',!!f.mon_emerg);
      _monUserEdited=true;
    }else if(typeof actualizarMonitoreoMayo==='function'){
      actualizarMonitoreoMayo({init:true});
    }
  }
}

var MAYO_MINS=[5,15,30,45,60,75,90,105,120,135,150,165,180,195,210,225,240];

function generarFilasMayo(){
  var tbody=document.getElementById('mayo-vitals-body');
  if(!tbody)return;
  tbody.innerHTML='';
  MAYO_MINS.forEach(function(min){
    var tr=document.createElement('tr');
    tr.innerHTML='<td style="border:1px solid var(--border);padding:2px 4px;font-size:11px;color:var(--text3);text-align:center;background:var(--bg3);font-weight:bold">'+min+'</td>'
      +['sist','diast','sato2','eco2','fc','pam'].map(function(p){
        return '<td style="border:1px solid var(--border);padding:1px"><input type="text" data-min="'+min+'" data-param="'+p+'" style="width:38px;background:transparent;border:none;color:var(--text);font-size:12px;text-align:center;outline:none;padding:3px 0" placeholder=""></td>';
      }).join('');
    tbody.appendChild(tr);
  });
}

function agregarFilaMayo(){
  var tbody=document.getElementById('mayo-vitals-body');
  if(!tbody)return;
  var tr=document.createElement('tr');
  tr.innerHTML='<td style="border:1px solid var(--border);padding:2px"><input type="text" style="width:34px;background:transparent;border:none;color:var(--text);font-size:11px;text-align:center;outline:none" placeholder="min"></td>'
    +['sist','diast','sato2','eco2','fc','pam'].map(function(p){
      return '<td style="border:1px solid var(--border);padding:1px"><input type="text" style="width:38px;background:transparent;border:none;color:var(--text);font-size:12px;text-align:center;outline:none;padding:3px 0" placeholder=""></td>';
    }).join('');
  tbody.appendChild(tr);
}

