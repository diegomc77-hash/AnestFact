function getMayoVitals(){
  var tbody=document.getElementById('mayo-vitals-body');
  if(!tbody)return[];
  var rows=[];
  for(var i=0;i<tbody.rows.length;i++){
    var tr=tbody.rows[i];
    var cells=tr.cells;
    if(cells.length>=7){
      var cv=function(c){if(!c)return'';var inp=c.querySelector('input');return(inp?inp.value:c.textContent||'').trim();};
      var r={min:cv(cells[0]),sist:cv(cells[1]),diast:cv(cells[2]),sato2:cv(cells[3]),eco2:cv(cells[4]),fc:cv(cells[5]),pam:cv(cells[6])};
      if(r.sist||r.fc||r.sato2)rows.push(r);
    }
  }
  return rows;
}
function getMayoMonitoreo(){
  var items=[];
  [['mon-etco2','EtCO2'],['mon-pam','PAM'],['mon-ecg','ECG'],['mon-sato2','SAT O2'],['mon-pani','PANI'],['mon-decub','PROT.DECUB.'],['mon-emerg','EMERGENCIA']].forEach(function(p){
    var el=document.getElementById(p[0]);
    if(el&&el.checked)items.push(p[1]);
  });
  return items.join(', ');
}

function getMayoMonitoreoFlags(cur){
  function chk(id,defOn){
    var el=document.getElementById(id);
    return el?!!el.checked:!!defOn;
  }
  return{
    monEtco2:chk('mon-etco2',false),
    monPam:chk('mon-pam',false),
    monEcg:chk('mon-ecg',true),
    monSato2:chk('mon-sato2',true),
    monPani:chk('mon-pani',true),
    monDecub:chk('mon-decub',false),
    monEmerg:document.getElementById('mon-emerg')?document.getElementById('mon-emerg').checked:((cur&&cur.mayo_tipociru)||'').toLowerCase()==='urgencia'
  };
}

/** Envelope portapapeles: popup de la extensión lo parsea sin depender del content script. */
function afBatchClipboardEnvelope(p){
  return 'AFG1|'+[
    String(p.apellido||'').replace(/\|/g,' '),
    String(p.nombre||'').replace(/\|/g,' '),
    String(p.dni||'').replace(/\|/g,' '),
    String(p.fechaCirugia||'').replace(/\|/g,' '),
    String(p.token||'')
  ].join('|');
}

/**
 * Separa apellido/nombre desde i.pac.
 * "BESCOS, DANIEL ALFREDO" → BESCOS / DANIEL ALFREDO
 * "BESCOS DANIEL ALFREDO" (sin coma) → BESCOS / DANIEL ALFREDO
 * Nunca descarta tokens del nombre: todo lo posterior a la coma (o al 1er token) se conserva.
 */
function afSplitPacienteNombre(pac){
  var raw=String(pac||'').trim().replace(/\s+/g,' ');
  if(!raw)return{apellido:'',nombre:''};
  if(raw.indexOf(',')>=0){
    var parts=raw.split(',');
    return{
      apellido:(parts[0]||'').trim().toUpperCase(),
      // slice(1).join: si hubiera más de una coma, no se pierde el resto
      nombre:parts.slice(1).join(' ').replace(/\s+/g,' ').trim().toUpperCase()
    };
  }
  var words=raw.split(/\s+/).filter(Boolean);
  return{
    apellido:(words[0]||'').toUpperCase(),
    nombre:words.slice(1).join(' ').toUpperCase()
  };
}

/**
 * Publica foja+token para la extensión.
 * CRÍTICO: no alcanza con window.__AFG_* — el content script vive en otro JS world.
 * localStorage + postMessage sí cruzan; CustomEvent también.
 */
function afPublishGeclisaBatch(batchPayload, opts){
  opts=opts||{};
  window.__AFG_PENDING_BATCH=batchPayload;
  try{
    localStorage.setItem('afg_pending_batch', JSON.stringify(batchPayload));
  }catch(e){}
  try{
    window.postMessage({ source:'AFG_ANESFACT', type:'GECLISA_TOKEN', payload:batchPayload }, '*');
  }catch(e){}
  try{
    window.dispatchEvent(new CustomEvent('afg-geclisa-token',{ detail:batchPayload }));
  }catch(e){}
  if(!opts.skipClipboard){
    try{
      var env=afBatchClipboardEnvelope(batchPayload);
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(env);
    }catch(eClip){}
  }
  try{
    console.log('[AFG] publish batch', batchPayload.apellido, batchPayload.nombre, 'tokenLen', String(batchPayload.token||'').length);
  }catch(e){}
}

/** Resuelve intervención por id o usa el objeto; prioriza S.intervs / S.cur. */
function afResolveInterv(intervOrId){
  if(intervOrId&&typeof intervOrId==='object'&&intervOrId.id!=null)return intervOrId;
  var id=String(intervOrId||'');
  if(!id)return(typeof S!=='undefined'?S.cur:null)||null;
  if(typeof S!=='undefined'&&S.cur&&String(S.cur.id)===id)return S.cur;
  var list=(typeof S!=='undefined'&&S.intervs)?S.intervs:[];
  for(var k=0;k<list.length;k++){
    if(String(list[k].id)===id)return list[k];
  }
  return null;
}

function afIsCurrentInterv(i){
  return !!(typeof S!=='undefined'&&S.cur&&i&&String(S.cur.id)===String(i.id));
}

/** DOM solo si la foja está abierta; si no, i.foja. */
function afFojaField(i, fojaKey, domId, fallback){
  var f=(i&&i.foja)||{};
  if(afIsCurrentInterv(i)&&domId){
    var el=document.getElementById(domId);
    if(el&&el.value!=null&&String(el.value).trim()!=='')return el.value;
  }
  if(fojaKey&&f[fojaKey]!=null&&String(f[fojaKey]).trim()!=='')return f[fojaKey];
  return fallback!=null?fallback:'';
}

/** Pide a la extensión reusar/enfocar GECLISA (sin window.open acá — el fallback va después del alert). */
function afOpenOrFocusGeclisa(){
  window.__AFG_EXT_OPEN_ACK=false;
  try{
    window.postMessage({ source:'AFG_ANESFACT', type:'OPEN_GECLISA' }, '*');
  }catch(e){}
}

/** Fallback si la extensión no contestó OPEN_ACK (llamar DESPUÉS del alert). */
function afOpenGeclisaFallbackIfNeeded(){
  if(window.__AFG_EXT_OPEN_ACK){
    try{ console.log('[AFG] GECLISA: extensión reusó/enfocó pestaña'); }catch(e){}
    return;
  }
  setTimeout(function(){
    if(window.__AFG_EXT_OPEN_ACK)return;
    var w=window.open('http://sanatoriomayo.myvnc.com:84','geclisa_mayo');
    try{ if(w) w.focus(); }catch(e2){}
    try{ console.log('[AFG] GECLISA: fallback window.open nombre=geclisa_mayo', !!w); }catch(e3){}
  }, 200);
}

/**
 * Arma payload clínico + clave para af_geclisa_create_token.
 * Usa i / i.foja; DOM solo si esa foja está abierta (cola puede mintear otra).
 */
function afBuildGeclisaClinicalPayload(i){
  if(!i)return{ok:false,error:'missing_interv'};
  var f=i.foja||{};
  var splitNom=afSplitPacienteNombre(i.pac||'');
  try{
    console.log('[AFG] pac raw →', JSON.stringify(i.pac||''), '→ apellido=', splitNom.apellido, 'nombre=', splitNom.nombre);
  }catch(ePacLog){}
  var _dni=(i.dni||'').trim().replace(/^0+/,'').replace(/\s+/g,'');
  var _nom=(i.pac||'').trim().replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'').slice(0,20);
  var _fec=(i.fecha||new Date().toISOString().slice(0,10)).replace(/-/g,'');
  var clave=_dni||(_nom?_nom+'_'+_fec:'sin_id_'+_fec);
  if(typeof afGeclisaClave==='function')clave=afGeclisaClave(clave);

  var _drogasInd=[],_drogasMant=[];
  (f.drogas||[]).forEach(function(dr){
    if(!dr.n||!dr.n.trim())return;
    var txt=(dr.n||'')+' '+(dr.d||'')+' '+(dr.v||'');
    var g=(dr.grupo||'').toLowerCase();
    if(g.indexOf('inotr')>=0){
      _drogasMant.push(txt+(dr.causa?' ('+dr.causa+')':''));
    } else if(g.indexOf('mantenimiento')>=0||g.indexOf('tiva total')>=0||g.indexOf('gas mac')>=0){
      _drogasMant.push(txt);
    } else if(g.indexOf('inducc')>=0||g.indexOf('inductor')>=0||g.indexOf('relajante')>=0||g.indexOf('analg')>=0||g.indexOf('sedac')>=0){
      _drogasInd.push(txt);
    } else if(g.indexOf('intratecal')>=0||g.indexOf('peridural')>=0||g.indexOf('local')>=0||g.indexOf('coadyuv')>=0){
      _drogasMant.push(txt);
    } else {
      _drogasInd.push(txt);
    }
  });

  var _tipoTec=afFojaField(i,'tecTipo','fj-tec-tipo','')||afFojaField(i,'tec_tipo','fj-tec-tipo','');
  var _nivelRegional=f.nivel_regional||'';
  if(!_nivelRegional&&afIsCurrentInterv(i)){
    if(_tipoTec==='neuroaxial'){
      var _esp=document.getElementById('fj-tec-espacio')?document.getElementById('fj-tec-espacio').value:'';
      if(_esp)_nivelRegional='Espacio '+_esp;
    } else if(_tipoTec==='bloqueo'){
      var _lat=document.getElementById('fj-tec-lateral')?document.getElementById('fj-tec-lateral').value:'';
      var _tecVal=document.getElementById('fj-tec')?document.getElementById('fj-tec').value:'';
      if(_tecVal)_nivelRegional=_tecVal+(_lat?' - '+_lat:'');
    }
  }

  var _mon=afIsCurrentInterv(i)
    ? getMayoMonitoreoFlags(i)
    : {
        monEtco2:!!f.monEtco2, monPam:!!f.monPam, monEcg:f.monEcg!==false,
        monSato2:f.monSato2!==false, monPani:f.monPani!==false,
        monDecub:!!f.monDecub,
        monEmerg:!!f.monEmerg||((i.mayo_tipociru||'').toLowerCase()==='urgencia')
      };
  var _gest=typeof calcGestionFoja==='function'?calcGestionFoja(f,i):{};
  var atb=afFojaField(i,'atb','fj-atb','');
  var payload={
    apellido:splitNom.apellido,
    nombre:splitNom.nombre,
    dni:i.dni||'',edad:i.edad||'',
    obraSocial:i.obra||'',nroAfiliado:i.afil||'',
    fechaCirugia:i.fecha||'',horaInicio:i.hora||'',
    sector:(i.mayo_sector||'').trim(),
    mayo_cama:i.mayo_cama||'',
    quirofano:i.mayo_quir||i.sala||'',
    tipoCirugia:i.mayo_tipociru||'PROGRAMADA',
    posicion:i.mayo_posicion||'',
    diagnostico:i.diag||'',
    anestesista:(typeof AfIdentidad!=='undefined'?AfIdentidad.get().nombre:(localStorage.getItem('af_anest_nombre')||'')),
    matricula:(typeof AfIdentidad!=='undefined'?AfIdentidad.get().mp:(localStorage.getItem('af_anest_mp')||'')),
    horaFin:f.fin||'',cirujano:i.ciru||'',especialidad:i.serv||'',
    fechaGestion:_gest.fechaGestion||i.fecha||'',
    horaGestion:_gest.horaGestion||'',
    observaciones:f.obs_geclisa||f.obs||'',
    observacionesFinal:((f.obs_geclisa||'')+(f.obs?(f.obs_geclisa?' | ':'')+f.obs:'')).trim(),
    examenFisico:f.examenFisico||'',
    premedicacion:f.premed||'',
    antibioticoprofilaxis:atb,
    medicamentos:(f.drogas||[]).filter(function(d){return d.n&&d.n.trim();}).map(function(d){return(d.n||'')+' '+(d.d||'')+' '+(d.v||'');}).join(', '),
    peso:i.peso||'',asa:f.asa||'',
    monEtco2:_mon.monEtco2,
    monPam:_mon.monPam,
    monEcg:_mon.monEcg,
    monSato2:_mon.monSato2,
    monPani:_mon.monPani,
    monDecub:_mon.monDecub,
    monEmerg:_mon.monEmerg,
    induccion:(_tipoTec==='general'||_tipoTec==='tiva')?((f.ind||'')+(_drogasInd.length?'. '+_drogasInd.join(', '):'')):(_tipoTec==='sedacion'&&_drogasInd.length?_drogasInd.join(', '):''),
    mantenimiento:typeof buildMantenimientoGeclisa==='function'?buildMantenimientoGeclisa(_tipoTec,f.tec||'',_drogasMant):((f.tec||'')+(_drogasMant.length?' con '+_drogasMant.join(', '):'')),
    nivelRegional:_nivelRegional,
    viaAerea:f.via||'',metodos:f.metodos||'',materiales:f.materiales||'',
    vitals:f.mayo_vitals||[],
    fluido1:f.fluido1||(f.suero_tipo&&f.suero?f.suero_tipo+' '+f.suero:f.suero)||'',fluido2:f.fluido2||'',
    sangre:f.sangre||'',plasma:f.plasma||'',otro:f.otro||'',
    orina:(f.orina!==undefined&&f.orina!==''?f.orina:'0'),sangrado:(f.sangrado||'0'),
    recuperacion:f.recup||'S/p',
    timestamp:new Date().toISOString()
  };
  return{ok:true,interv:i,clave:clave,payload:payload,splitNom:splitNom};
}

/**
 * Mint token on-demand (cola / Enviar ahora / bridge).
 * opts: { publish?:true, skipClipboard?:bool, saveCurrent?:bool, toastProgress?:bool }
 * @returns {Promise<{ok, foja?, error?, token?}>}
 */
function afMintGeclisaToken(intervOrId, opts){
  opts=opts||{};
  var publish=opts.publish!==false;
  var skipClipboard=!!opts.skipClipboard;
  var toastProgress=opts.toastProgress!==false;

  return Promise.resolve().then(function(){
    if(typeof checkPlan==='function'&&!checkPlan('geclisa')){
      return{ok:false,error:'plan_geclisa'};
    }
    if(typeof assertPlanServer==='function'){
      return assertPlanServer('geclisa').then(function(res){
        if(typeof handleAssertFail==='function'&&!handleAssertFail(res,'geclisa')){
          return{ok:false,error:'plan_assert'};
        }
        return null;
      });
    }
    return null;
  }).then(function(early){
    if(early)return early;

    var i=afResolveInterv(intervOrId);
    if(!i)return{ok:false,error:'interv_not_found'};

    if(opts.saveCurrent!==false&&afIsCurrentInterv(i)){
      try{
        if(typeof syncFojaHoras==='function')syncFojaHoras();
        if(document.getElementById('fj-tec')&&typeof guardarFoja==='function')guardarFoja();
        else if(document.getElementById('f-pac')&&typeof guardar==='function')guardar();
      }catch(eSave){}
      i=afResolveInterv(i.id)||i;
    }

    if(typeof AF_AUTH==='undefined'||!AF_AUTH.isLoggedIn||!AF_AUTH.isLoggedIn()){
      if(toastProgress)toast('Iniciá sesión para enviar a GECLISA');
      return{ok:false,error:'not_logged_in'};
    }

    var built=afBuildGeclisaClinicalPayload(i);
    if(!built.ok)return built;
    var payload=built.payload;
    var clave=built.clave;

    if(toastProgress)toast('Generando token GECLISA…');

    // cache:'no-store' — evita SW/cache atascado entre fojas
    return fetch(afSupabaseUrl()+'/rest/v1/rpc/af_geclisa_create_token',{
      method:'POST',
      cache:'no-store',
      headers:afSupabaseHeaders({'Content-Type':'application/json','Cache-Control':'no-cache'}),
      body:JSON.stringify({ p_paciente_ref: clave, p_payload: payload })
    }).then(function(r){
      return r.text().then(function(t){
        var data=null;
        try{ data=t?JSON.parse(t):null; }catch(e){ data=null; }
        if(!r.ok){
          var code=(data&&(data.code||data.error))||'';
          var msg=(data&&(data.message||data.error_description))||t.slice(0,160)||('HTTP '+r.status);
          if(r.status===404||code==='PGRST202'||code==='42883'||/Could not find the function/i.test(msg)){
            throw new Error('Falta ejecutar el SQL 008a/008 en Supabase (token GECLISA) o recargar schema PostgREST. Detalle: '+msg.slice(0,100));
          }
          throw new Error(msg);
        }
        return data;
      });
    }).then(function(res){
      if(!res||res.ok===false){
        var err=(res&&res.error)||'no_ok';
        if(toastProgress){
          if(err==='upgrade'||err==='bloqueado')toast('Plan no permite GECLISA');
          else toast('No se pudo crear token: '+err);
        }
        return{ok:false,error:String(err)};
      }
      var token=res.token||'';
      if(!token||token.length<32){
        if(toastProgress)toast('Token inválido del servidor');
        return{ok:false,error:'invalid_token'};
      }
      window._afLastGeclisaToken=token;
      var foja={
        token:token,
        intervId:String(i.id),
        apellido:payload.apellido||'',
        nombre:payload.nombre||'',
        dni:payload.dni||i.dni||'',
        fechaCirugia:payload.fechaCirugia||i.fecha||'',
        horaInicio:payload.horaInicio||i.hora||'',
        horaFin:payload.horaFin||'',
        sector:payload.sector||i.mayo_sector||'',
        mayo_cama:payload.mayo_cama||i.mayo_cama||'',
        pac:i.pac||'',
        clave:clave,
        updatedAt:Date.now()
      };
      try{
        console.log('[AFG] mint ok', foja.intervId, foja.apellido, '|', foja.nombre, '|', foja.sector, 'tokenLen', token.length);
      }catch(eLog){}
      if(publish){
        try{ afPublishGeclisaBatch(foja,{ skipClipboard:skipClipboard }); }catch(eBatch){
          try{ console.warn('[AFG] publish batch falló', eBatch); }catch(e2){}
        }
      }
      if(toastProgress)toast('Token listo ✓');
      return{ok:true,token:token,foja:foja,clave:clave};
    });
  }).catch(function(e){
    var msg=String(e&&e.message||e);
    if(toastProgress)toast('Error GECLISA: '+msg);
    return{ok:false,error:msg};
  });
}

window.addEventListener('message', function(ev){
  if(ev.source!==window)return;
  var d=ev.data;
  if(!d||d.source!=='AFG_EXT')return;
  if(d.type==='OPEN_ACK') window.__AFG_EXT_OPEN_ACK=true;
  if(d.type==='BRIDGE_ALIVE') window.__AFG_BRIDGE_ALIVE=true;
  // Extensión pide token para una foja de la cola (pieza 2)
  if(d.type==='MINT_TOKEN'){
    var reqId=d.requestId||('m'+Date.now());
    var intervId=d.intervId||d.id||null;
    afMintGeclisaToken(intervId,{
      publish:true,
      skipClipboard:true,
      saveCurrent:true,
      toastProgress:false
    }).then(function(r){
      try{
        window.postMessage({
          source:'AFG_ANESFACT',
          type:'MINT_TOKEN_RESULT',
          requestId:reqId,
          ok:!!(r&&r.ok),
          foja:r&&r.foja||null,
          error:(r&&r.error)||null,
          tokenLen:r&&r.token?String(r.token).length:0
        },'*');
      }catch(ePost){}
    });
  }
  // Tras fillOk: marcar intervención como enviada a GECLISA
  if(d.type==='MARK_ENVIADO_GECLISA'){
    var markRes={ok:false,error:'mark_fn_missing',intervId:d.intervId||'',atMs:Date.now()};
    try{
      if(typeof afMarkEnviadoGeclisa==='function'){
        markRes=afMarkEnviadoGeclisa(d.intervId||d.id,{
          at:d.at||null,
          via:d.via||'extension',
          toast:true
        })||markRes;
      }
    }catch(eMark){
      markRes={ok:false,error:String(eMark&&eMark.message||eMark),intervId:d.intervId||'',atMs:Date.now()};
    }
    markRes.atMs=Date.now();
    markRes.intervId=String(d.intervId||d.id||markRes.intervId||'');
    try{window.__AFG_LAST_MARK_ENVIADO=markRes;}catch(eW){}
    try{console.log('[AFG] MARK_ENVIADO_GECLISA',markRes);}catch(eL){}
  }
});

/**
 * Marca una intervención como enviada a GECLISA (fillOk desde la extensión).
 * estado: enviado_geclisa + enviadoAt (ISO) + enviadoVia.
 */
function afMarkEnviadoGeclisa(intervId, opts){
  opts=opts||{};
  var id=String(intervId||'').trim();
  if(!id){
    return{ok:false,error:'missing_intervId'};
  }
  if(typeof S==='undefined'||!S.intervs){
    return{ok:false,error:'no_state',intervId:id};
  }
  var idx=-1;
  for(var i=0;i<S.intervs.length;i++){
    if(String(S.intervs[i].id)===id){idx=i;break;}
  }
  if(idx<0){
    try{console.warn('[AFG] mark enviado: interv no encontrada',id);}catch(e){}
    return{ok:false,error:'interv_not_found',intervId:id};
  }
  var at=opts.at||new Date().toISOString();
  var via=opts.via||'extension';
  var it=S.intervs[idx];
  it.estado='enviado_geclisa';
  it.enviadoAt=at;
  it.enviadoVia=via;
  it.enviadoDestino='geclisa';
  it._ts=Date.now();
  if(S.cur&&String(S.cur.id)===id){
    S.cur.estado=it.estado;
    S.cur.enviadoAt=it.enviadoAt;
    S.cur.enviadoVia=it.enviadoVia;
    S.cur.enviadoDestino=it.enviadoDestino;
  }
  if(typeof saveIntervsToStorage==='function')saveIntervsToStorage();
  else{
    try{
      localStorage.setItem(
        typeof afIntervsKey==='function'?afIntervsKey():'af_i',
        JSON.stringify(S.intervs)
      );
    }catch(eS){}
  }
  if(typeof syncAutoPushDebounced==='function')syncAutoPushDebounced();
  if(opts.toast!==false&&typeof toast==='function'){
    toast('Marcada Enviado a GECLISA ✓✓');
  }
  try{
    if(typeof renderHome==='function'&&document.getElementById('view-home')&&
       document.getElementById('view-home').classList.contains('active')){
      renderHome();
    }
  }catch(eR){}
  try{console.log('[AFG] enviado_geclisa',id,at,via);}catch(eL){}
  return{ok:true,intervId:id,estado:'enviado_geclisa',enviadoAt:at,via:via};
}

function abrirGeclisa(){
  if(typeof checkPlan==='function'&&!checkPlan('geclisa'))return;
  var run=function(){ _abrirGeclisaCore(); };
  if(typeof assertPlanServer==='function'){
    assertPlanServer('geclisa').then(function(res){
      if(typeof handleAssertFail==='function'&&!handleAssertFail(res,'geclisa'))return;
      run();
    });
    return;
  }
  run();
}

/** Enviar ahora (1 foja): mint + alert + foco GECLISA. Nav automática = piezas 3–4. */
function _abrirGeclisaCore(){
  if(!S.cur){toast('Carg\u00e1 un paciente primero');return;}
  afMintGeclisaToken(S.cur,{ publish:true, skipClipboard:false, toastProgress:true })
    .then(function(r){
      if(!r||!r.ok)return;
      try{ afOpenOrFocusGeclisa(); }catch(eOpen){}
      alert(
        'TOKEN GECLISA (un solo uso · 2 horas)\n\n'+
        r.token+
        '\n\nPortapapeles: AFG1|apellido|nombre|dni|fecha|token (el popup de la extensión lo lee solo).\n'+
        'Si usás el marcador manual: pegá solo el token cuando te lo pida.\n\n'+
        '(Pieza 2) El disparo automático de navegación llega con el runner de cola.'
      );
      toast('Token listo ✓ Extensión / marcador GECLISA');
      try{ afOpenGeclisaFallbackIfNeeded(); }catch(eFb){}
    });
}

