function _fojaSv(id,v){var e=document.getElementById(id);if(!e)return;if(e.type==='checkbox')e.checked=!!v;else e.value=v==null||v===undefined?'':v;}

function resetFojaUIDom(){
  ['fj-asa','fj-via','fj-ind','fj-fin','fj-tec','fj-tec-tipo','fj-tec-subtipo','fj-examen-fisico','fj-mallampati',
   'fj-premed','fj-metodos','fj-materiales','fj-recup','fj-obs','fj-aldrete','fj-bromage','fj-ramsay',
   'fj-aldrete-sel','fj-bromage-sel','fj-ramsay-sel',
   'fj-suero-tipo','fj-suero','fj-sangre','fj-plasma','fj-otro','fj-obs-hemo',
   'fj-fluido1','fj-fluido2','fj-orina','fj-sangrado',
   'fj-mayo-quir','fj-posicion','fj-nivel-regional','fj-obs-geclisa',
   'fj-hint','fj-hext','fj-hint-vis','fj-hext-vis','foja-hora-inicio','foja-hora-fin',
   'vg-inicio','vg-fin',
   'fj-tec-bloqueo','fj-tec-espacio','fj-tec-lateral','fj-tec-aguja','fj-tec-calibre','fj-tec-guia','fj-tec-resultado',
   'fj-atb','metodos-tubo',
   'aero-sist','aero-diast','aero-fc','aero-sat','aero-eco2','aero-resp','aero-evol',
   'sv-sist','sv-diast','sv-fc','sv-sat','sv-eco2','sv-pam','sv-evol'].forEach(function(id){_fojaSv(id,'');});
  ['mon-etco2','mon-pam','mon-decub','mon-emerg'].forEach(function(id){_fojaSv(id,false);});
  ['mon-ecg','mon-sato2','mon-pani'].forEach(function(id){_fojaSv(id,true);});
  if(typeof VG!=='undefined'){VG.cols=[];VG.cells={};VG.obs={};VG.fluidos={};}
  var vgBody=document.getElementById('vitals-body');if(vgBody)vgBody.innerHTML='';
  var chartDiv=document.getElementById('vitals-chart');if(chartDiv)chartDiv.innerHTML='';
  var vitGrid=document.getElementById('vitals-grid');if(vitGrid)vitGrid.innerHTML='';
  var tbody=document.getElementById('mayo-vitals-body');if(tbody)tbody.innerHTML='';
  var mp=document.getElementById('mayo-vitals-preview');if(mp)mp.style.display='none';
  var mi=document.getElementById('mayo-vitals-info');if(mi)mi.textContent='';
  S.signData=null;
  if(typeof _antecedentes!=='undefined')_antecedentes=[];
  if(typeof _aldrete!=='undefined'){_aldrete='';_destino='';_destinoExtra='';_arm='';_inotrop='';_viaEgreso='';_spo2='';_neuro='';_hemo='';_anal='';_ahem='';}
  if(typeof _bromage!=='undefined')_bromage='';
  if(typeof _ramsay!=='undefined')_ramsay='';
  if(typeof updateEscalasRecupPorTecnica==='function')updateEscalasRecupPorTecnica(true);
  if(typeof _horaLinked!=='undefined')_horaLinked={hint:'',hext:'',cinicio:'',cfin:''};
  if(typeof _monUserEdited!=='undefined')_monUserEdited=false;
  if(typeof _monTecPrev!=='undefined')_monTecPrev='';
  if(typeof resetExamenAusc==='function')resetExamenAusc();
  if(typeof resetObsHemoSuger==='function')resetObsHemoSuger('');
  if(typeof restaurarAntecedentes==='function')restaurarAntecedentes([]);
  if(typeof tecNivel1==='function')tecNivel1();
  var exReg=document.getElementById('examen-regional-wrap');if(exReg)exReg.style.display='none';
  var recupSel=document.getElementById('recup-selects');if(recupSel)recupSel.innerHTML='';
  var droList=document.getElementById('drogas-list');if(droList)droList.innerHTML='';
  var droSug=document.getElementById('drogas-sugeridas');if(droSug){droSug.innerHTML='';droSug.style.display='none';}
  if(typeof hideTivaCalcPanel==='function')hideTivaCalcPanel();
  if(typeof hideGasesCalcPanel==='function')hideGasesCalcPanel();
  var premedSel=document.getElementById('premed-selects');if(premedSel)premedSel.innerHTML='';
  var metExtra=document.getElementById('metodos-extra');if(metExtra){metExtra.innerHTML='';metExtra.style.display='none';}
  var ba=document.getElementById('balance-alertas');if(ba){ba.style.display='none';ba.innerHTML='';}
  if(typeof actualizarMetodosResumen==='function')actualizarMetodosResumen();
}

var _fojaLoadGen=0;
var _fojaUiCurId=null;

function cargarFojaUI(){
  var gen=++_fojaLoadGen;
  _fojaUiCurId=S.cur?S.cur.id:null;
  resetFojaUIDom();
  cargarFojaVG();
  if(typeof _tecRestaurando!=='undefined')_tecRestaurando=true;
  if(typeof _tecTipoPrev!=='undefined')_tecTipoPrev='';
  if(typeof _tecSubPrev!=='undefined')_tecSubPrev='';
  setTimeout(function(){
    if(gen!==_fojaLoadGen)return;
    tecRestaurar((S.cur&&S.cur.foja&&S.cur.foja.tec)||'');
    if(typeof renderTivaCalcPanel==='function')renderTivaCalcPanel();
    if(typeof renderGasesCalcPanel==='function')renderGasesCalcPanel();
  },50);
  if(S.cur){
    sv('foja-hora-inicio',S.cur.hora||'');
    sv('foja-hora-fin',(S.cur.foja&&S.cur.foja.fin)||'');
  }
  if(!S.cur||!S.cur.foja){
    if(typeof _tecRestaurando!=='undefined')_tecRestaurando=false;
    setTimeout(function(){if(gen===_fojaLoadGen&&typeof initExamenAuscUI==='function')initExamenAuscUI();},80);
    return;
  }
  var f=S.cur.foja;
  var viaSaved=(f.via==='Puntas nasales'?'Cánula nasal':f.via)||'';
  if(f.drogas&&typeof limpiarDrogasVacias==='function'){
    S.cur.foja.drogas=(f.drogas||[]).filter(function(d){return d&&d.n&&String(d.n).trim();});
  }
  sv('fj-tec',f.tec);sv('fj-asa',f.asa);sv('fj-fin',f.fin);
  // NO setear fj-via aún: primero hay que armar las opciones según técnica
  if(f.tec_tipo){sv('fj-tec-tipo',f.tec_tipo);tecNivel1();}else{sv('fj-tec-tipo','');tecNivel1();}
  if(f.tec_subtipo){sv('fj-tec-subtipo',f.tec_subtipo);tecNivel2();}else{sv('fj-tec-subtipo','');}
  if(typeof _tecTipoPrev!=='undefined')_tecTipoPrev=f.tec_tipo||'';
  if(typeof _tecSubPrev!=='undefined')_tecSubPrev=f.tec_subtipo||'';
  setTimeout(function(){
    if(gen!==_fojaLoadGen)return;
    sv('fj-tec-bloqueo',f.tec_bloqueo||'');
    sv('fj-tec-lateral',f.tec_lateral||'');
    sv('fj-tec-espacio',f.tec_espacio||'');
    if(f.tec_aguja){sv('fj-tec-aguja',f.tec_aguja);if(typeof tecActualizarCalibres==='function')tecActualizarCalibres();}else{sv('fj-tec-aguja','');}
    sv('fj-tec-calibre',f.tec_calibre||'');
    sv('fj-tec-guia',f.tec_guia||'');
    sv('fj-tec-resultado',f.tec_resultado||'');
    if(typeof actualizarViaAerea==='function')actualizarViaAerea();
    if(viaSaved){
      var viaEl=document.getElementById('fj-via');
      if(viaEl)viaEl.value=viaSaved;
    }
    if(typeof _sugerirDrogasPorTec==='function')_sugerirDrogasPorTec(f.tec_subtipo||f.tec_tipo||'');
    if(typeof refrescarMetodosDesdeDrogas==='function')refrescarMetodosDesdeDrogas();
    else if(typeof actualizarMetodos==='function')actualizarMetodos();
    if(f.metodos&&(f.tec_tipo==='neuroaxial'||f.tec_tipo==='bloqueo')){
      var ta=document.getElementById('fj-metodos');
      if(ta&&(!ta.value||ta.value.length<80)&&f.metodos)ta.value=f.metodos;
    }
    if(typeof _tecRestaurando!=='undefined')_tecRestaurando=false;
  },150);
  setTimeout(function(){
    if(gen!==_fojaLoadGen)return;
    sv('metodos-tubo',f.tubo||'');
    if(typeof actualizarMetodos==='function')actualizarMetodos(true);
  },250);
  sv('fj-ind',f.ind||'');sv('fj-hint',f.hint||'');sv('fj-hext',f.hext||'');
  var hintV=document.getElementById('fj-hint-vis');if(hintV)hintV.value=f.hint||'';
  var hextV=document.getElementById('fj-hext-vis');if(hextV)hextV.value=f.hext||'';
  if(typeof syncFojaHoras==='function')syncFojaHoras();
  sv('fj-premed',f.premed||'');sv('fj-atb',f.atb||'');sv('fj-metodos',f.metodos||'');sv('fj-materiales',f.materiales||'');
  sv('fj-recup',f.recup||'');sv('fj-obs',f.obs||'');sv('fj-examen-fisico',f.examenFisico||'');sv('fj-mallampati',f.mallampati||'');sv('fj-orina',f.orina||'');sv('fj-sangrado',f.sangrado||'');
  if(typeof updateEscalasRecupPorTecnica==='function')updateEscalasRecupPorTecnica(true);
  if(typeof setBromage==='function'&&f.bromage!=null&&f.bromage!=='')setBromage(String(f.bromage),true);
  if(typeof setRamsay==='function'&&f.ramsay!=null&&f.ramsay!=='')setRamsay(String(f.ramsay),true);
  if(f.aldrete!=null&&f.aldrete!==''&&typeof setAldrete==='function'){
    try{setAldrete(String(f.aldrete));}catch(eA){}
    // setAldrete reescribe recup: restaurar texto guardado
    sv('fj-recup',f.recup||'');
  }
  sv('fj-suero-tipo',_balNormalizarSueroTipo(f.suero_tipo||'')||f.suero_tipo||'');sv('fj-suero',f.suero||'');sv('fj-sangre',f.sangre||'');sv('fj-plasma',f.plasma||'');sv('fj-otro',f.otro||'');
  sv('fj-obs-hemo',f.obs_hemo||'');
  if(typeof resetObsHemoSuger==='function')resetObsHemoSuger(f.obs_hemo||'');
  if(typeof restaurarAntecedentes==='function')restaurarAntecedentes(f.antecedentes||[]);
  setTimeout(function(){
    if(typeof initExamenAuscUI==='function')initExamenAuscUI();
    if(typeof restaurarExamenAusc==='function')restaurarExamenAusc(f.examenAusc||null);
  },80);
  S.vitals=f.vitals||[];
  S.signData=f.sign||null;
  renderDrogas();renderVitals();
  setTimeout(function(){
    if(typeof syncObsInotropicos==='function')syncObsInotropicos();
    if(typeof renderAlertasClinicas==='function')renderAlertasClinicas();
    if(typeof initBalanceFluidosUI==='function')initBalanceFluidosUI();
  },200);
}
function flushFojaDomIntoCur(){
  if(typeof guardarFojaVG==='function')guardarFojaVG();
  if(!S.cur)return;
  if(!S.cur.foja)S.cur.foja={drogas:[],vitals:[]};
  if(typeof syncFojaHoras==='function')syncFojaHoras();
  if(typeof syncTivaFromUI==='function')syncTivaFromUI();
  if(typeof syncGasesFromUI==='function')syncGasesFromUI();
  // Sync drug inputs from DOM y descartar filas vacías (evita transmitir borradas)
  if(S.cur.foja&&S.cur.foja.drogas){
    S.cur.foja.drogas.forEach(function(d,i){
      var ni=document.getElementById('din-'+i);var di=document.getElementById('dds-'+i);
      var si=document.querySelector('#dr-'+i+' select');
      if(ni)d.n=ni.value;if(di)d.d=di.value;if(si)d.v=si.value;
    });
    S.cur.foja.drogas=S.cur.foja.drogas.filter(function(d){return d&&d.n&&String(d.n).trim();});
  }
  // Preservar datos del gráfico VG antes de sobreescribir
  var _vgCols=S.cur.foja.vg_cols;var _vgCells=S.cur.foja.vg_cells;
  var _vgObs=S.cur.foja.vg_obs;var _vgFluidos=S.cur.foja.vg_fluidos;
  var _aeroBase={sist:S.cur.foja.aero_sist,diast:S.cur.foja.aero_diast,fc:S.cur.foja.aero_fc,
    sat:S.cur.foja.aero_sat,eco2:S.cur.foja.aero_eco2,resp:S.cur.foja.aero_resp,evol:S.cur.foja.aero_evol};
  var _tiva=S.cur.foja.tiva;
  var _gases=S.cur.foja.gases;
  S.cur.foja={
    tec:gv('fj-tec'),tec_tipo:gv('fj-tec-tipo'),tec_subtipo:gv('fj-tec-subtipo'),
    tec_bloqueo:gv('fj-tec-bloqueo'),tec_lateral:gv('fj-tec-lateral'),tec_espacio:gv('fj-tec-espacio'),
    tec_aguja:gv('fj-tec-aguja'),tec_calibre:gv('fj-tec-calibre'),tec_guia:gv('fj-tec-guia'),tec_resultado:gv('fj-tec-resultado'),
    asa:gv('fj-asa'),via:gv('fj-via'),fin:gv('fj-fin'),tubo:gv('metodos-tubo'),
    ind:gv('fj-ind'),hint:gv('fj-hint'),hext:gv('fj-hext'),
    premed:gv('fj-premed'),atb:gv('fj-atb'),metodos:gv('fj-metodos'),recup:gv('fj-recup'),obs:gv('fj-obs'),examenFisico:gv('fj-examen-fisico'),mallampati:gv('fj-mallampati'),
    aldrete:typeof _aldrete!=='undefined'?_aldrete:'',
    bromage:typeof _bromage!=='undefined'?_bromage:'',
    ramsay:typeof _ramsay!=='undefined'?_ramsay:'',
    examenAusc:typeof getExamenAuscState==='function'?getExamenAuscState():null,
    suero:gv('fj-suero'),suero_tipo:gv('fj-suero-tipo'),sangre:gv('fj-sangre'),plasma:gv('fj-plasma'),otro:gv('fj-otro'),orina:gv('fj-orina'),sangrado:gv('fj-sangrado'),
    obs_hemo:gv('fj-obs-hemo'),
    antecedentes:typeof _antecedentes!=='undefined'?_antecedentes.slice():[],
    drogas:S.cur.foja.drogas||[],vitals:S.vitals||[],sign:S.signData||null,
    vg_cols:_vgCols,vg_cells:_vgCells,vg_obs:_vgObs,vg_fluidos:_vgFluidos,
    aero_sist:_aeroBase.sist,aero_diast:_aeroBase.diast,aero_fc:_aeroBase.fc,
    aero_sat:_aeroBase.sat,aero_eco2:_aeroBase.eco2,aero_resp:_aeroBase.resp,aero_evol:_aeroBase.evol,
    tiva:_tiva||null,
    gases:_gases||null
  };
  // Save Mayo-specific fields
  if(S.cur&&(S.cur.san||'').indexOf('Mayo')>=0){
    function _gv(id){var e=document.getElementById(id);return(e&&e.value)?e.value:'';}
    S.cur.foja.posicion=_gv('fj-posicion');
    S.cur.foja.nivel_regional=_gv('fj-nivel-regional');
    S.cur.foja.obs_geclisa=_gv('fj-obs-geclisa');
    S.cur.foja.materiales=_gv('fj-materiales');
    // Combinar fluidos inteligentes en fluido1/fluido2
    var _flu=[];
    var _sue=gv('fj-suero'),_tipo=gv('fj-suero-tipo'),_san=gv('fj-sangre'),_pla=gv('fj-plasma'),_otr=gv('fj-otro');
    if(_sue){
      var _stxt=(typeof balSueroTexto==='function'?balSueroTexto():(_tipo?_tipo+' '+_sue:_sue));
      _flu.push(_stxt);
    }
    if(_san&&_san!=='0 ml')_flu.push('Sangre '+_san);
    if(_pla&&_pla!=='0 ml')_flu.push('Plasma '+_pla);
    if(_otr&&_otr!=='0 ml')_flu.push('Otro '+_otr);
    var _f1=document.getElementById('fj-fluido1');if(_f1&&_flu.length)_f1.value=_flu[0]||'';
    var _f2=document.getElementById('fj-fluido2');if(_f2&&_flu.length>1)_f2.value=_flu.slice(1).join('. ')||'';
    S.cur.foja.fluido1=_gv('fj-fluido1');
    S.cur.foja.fluido2=_gv('fj-fluido2');
    S.cur.foja.orina=_gv('fj-orina');
    S.cur.foja.sangrado=_gv('fj-sangrado');
    S.cur.foja.mayo_vitals=getMayoVitals();
    S.cur.foja.monitoreo=getMayoMonitoreo();
    function _monChk(id){var e=document.getElementById(id);return e?!!e.checked:undefined;}
    S.cur.foja.mon_etco2=_monChk('mon-etco2');S.cur.foja.mon_pam=_monChk('mon-pam');
    S.cur.foja.mon_ecg=_monChk('mon-ecg');S.cur.foja.mon_sato2=_monChk('mon-sato2');
    S.cur.foja.mon_pani=_monChk('mon-pani');S.cur.foja.mon_decub=_monChk('mon-decub');
    S.cur.foja.mon_emerg=_monChk('mon-emerg');
  }
}

function guardarFoja(){
  flushFojaDomIntoCur();
  if(!S.cur) return Promise.resolve(false);
  return guardar().then(function(ok){
    if(ok) toast('Foja guardada ✓');
    return ok;
  });
}

