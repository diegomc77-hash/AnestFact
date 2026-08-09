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

function _abrirGeclisaCore(){
  var i=S.cur;
  var f=(i&&i.foja)||{};
  if(!i){toast('Carg\u00e1 un paciente primero');return;}
  if(typeof syncFojaHoras==='function')syncFojaHoras();
  if(document.getElementById('fj-tec'))guardarFoja();
  else if(document.getElementById('f-pac'))guardar();
  i=S.cur;f=(i&&i.foja)||{};
  var parts=(i.pac||'').split(',');
  // Clave: DNI sin ceros, sino nombre+fecha, nunca 'ultimo'
  var _dni=(i.dni||'').trim().replace(/^0+/,'').replace(/\s+/g,'');
  var _nom=(i.pac||'').trim().replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'').slice(0,20);
  var _fec=(i.fecha||new Date().toISOString().slice(0,10)).replace(/-/g,'');
  var clave=_dni||(_nom?_nom+'_'+_fec:'sin_id_'+_fec);
  if(typeof afGeclisaClave==='function')clave=afGeclisaClave(clave);
  // Separar drogas por grupo: Inductores/Relajantes/Analgésicos -> inducción; Mantenimiento/Inotrópicos -> mantenimiento
  var _drogasInd=[],_drogasMant=[];
  (f.drogas||[]).forEach(function(dr){
    if(!dr.n||!dr.n.trim())return;
    var txt=(dr.n||'')+' '+(dr.d||'')+' '+(dr.v||'');
    var g=(dr.grupo||'').toLowerCase();
    if(g.indexOf('inotr')>=0){
      // Inotrópicos: van a mantenimiento GECLISA; la causa queda en métodos/obs Aero
      _drogasMant.push(txt+(dr.causa?' ('+dr.causa+')':''));
    } else if(g.indexOf('mantenimiento')>=0||g.indexOf('tiva total')>=0||g.indexOf('gas mac')>=0){
      _drogasMant.push(txt);
    } else if(g.indexOf('inducc')>=0||g.indexOf('inductor')>=0||g.indexOf('relajante')>=0||g.indexOf('analg')>=0||g.indexOf('sedac')>=0){
      _drogasInd.push(txt);
    } else if(g.indexOf('intratecal')>=0||g.indexOf('peridural')>=0||g.indexOf('local')>=0||g.indexOf('coadyuv')>=0){
      _drogasMant.push(txt);
    } else {
      // Sin grupo (agregado manual) -> va a inducción por defecto
      _drogasInd.push(txt);
    }
  });
  // Nivel regional: espacio intervertebral o bloqueo+lateralidad, solo si aplica
  var _tipoTec=document.getElementById('fj-tec-tipo')?document.getElementById('fj-tec-tipo').value:'';
  var _nivelRegional='';
  if(_tipoTec==='neuroaxial'){
    var _esp=document.getElementById('fj-tec-espacio')?document.getElementById('fj-tec-espacio').value:'';
    if(_esp)_nivelRegional='Espacio '+_esp;
  } else if(_tipoTec==='bloqueo'){
    var _lat=document.getElementById('fj-tec-lateral')?document.getElementById('fj-tec-lateral').value:'';
    var _tecVal=document.getElementById('fj-tec')?document.getElementById('fj-tec').value:'';
    if(_tecVal)_nivelRegional=_tecVal+(_lat?' - '+_lat:'');
  }
  var _mon=getMayoMonitoreoFlags(i);
  var _gest=typeof calcGestionFoja==='function'?calcGestionFoja(f,i):{};
  var payload={
    apellido:(parts[0]||'').trim().toUpperCase(),
    nombre:(parts[1]||'').trim().toUpperCase(),
    dni:i.dni||'',edad:i.edad||'',
    obraSocial:i.obra||'',nroAfiliado:i.afil||'',
    fechaCirugia:i.fecha||'',horaInicio:i.hora||'',
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
    antibioticoprofilaxis:(document.getElementById('fj-atb')?document.getElementById('fj-atb').value:'')||(f.atb||''),
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

  // Token de un solo uso (RPC 008) — el DNI va solo dentro del payload clínico
  if(typeof AF_AUTH==='undefined'||!AF_AUTH.isLoggedIn||!AF_AUTH.isLoggedIn()){
    toast('Iniciá sesión para enviar a GECLISA');
    return;
  }
  toast('Generando token GECLISA…');
  fetch(afSupabaseUrl()+'/rest/v1/rpc/af_geclisa_create_token',{
    method:'POST',
    headers:afSupabaseHeaders({'Content-Type':'application/json'}),
    body:JSON.stringify({ p_paciente_ref: clave, p_payload: payload })
  })
  .then(function(r){
    return r.text().then(function(t){
      var data=null;
      try{ data=t?JSON.parse(t):null; }catch(e){ data=null; }
      if(!r.ok){
        // Solo tratar como "RPC ausente" códigos PostgREST de schema cache / not found.
        // Antes: cualquier body con el nombre de la función se etiquetaba mal (p.ej. no_auth).
        var code=(data&&(data.code||data.error))||'';
        var msg=(data&&(data.message||data.error_description))||t.slice(0,160)||('HTTP '+r.status);
        if(r.status===404||code==='PGRST202'||code==='42883'||/Could not find the function/i.test(msg)){
          throw new Error('Falta ejecutar el SQL 008a/008 en Supabase (token GECLISA) o recargar schema PostgREST. Detalle: '+msg.slice(0,100));
        }
        throw new Error(msg);
      }
      return data;
    });
  })
  .then(function(res){
    if(!res||res.ok===false){
      var err=(res&&res.error)||'no_ok';
      if(err==='upgrade'||err==='bloqueado'){toast('Plan no permite GECLISA');return;}
      toast('No se pudo crear token: '+err);
      return;
    }
    var token=res.token||'';
    if(!token||token.length<32){toast('Token inválido del servidor');return;}
    try{
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(token);
    }catch(e){}
    window._afLastGeclisaToken=token;
    alert(
      'TOKEN GECLISA (un solo uso · 2 horas)\n\n'+
      token+
      '\n\nYa está en el portapapeles si el navegador lo permitió.\n'+
      'Abrí GECLISA → ejecutá el marcador → pegá este token cuando te lo pida.'
    );
    toast('Token listo ✓ Abrí GECLISA y usá el marcador');
    // Misma ventana nombrada: no abre una pestaña nueva por cada foja
    setTimeout(function(){
      var w=window.open('http://sanatoriomayo.myvnc.com:84','geclisa_mayo');
      try{ if(w) w.focus(); }catch(e){}
    },400);
  })
  .catch(function(e){
    toast('Error GECLISA: '+(e.message||e));
  });
}

