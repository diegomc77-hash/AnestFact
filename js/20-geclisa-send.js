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
    if(g.indexOf('mantenimiento')>=0||g.indexOf('inotr')>=0){
      _drogasMant.push(txt);
    } else if(g.indexOf('inductor')>=0||g.indexOf('relajante')>=0||g.indexOf('analg')>=0){
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
    anestesista:(localStorage.getItem('af_anest_nombre')||'HUERTA MARIA SOLEDAD'),matricula:(localStorage.getItem('af_anest_mp')||'32393'),
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

  var SURL='https://xntvibfsuubedplptvzs.supabase.co';
  var SKEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudHZpYmZzdXViZWRwbHB0dnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDk2MjgsImV4cCI6MjA5NTkyNTYyOH0.9SaZdO7knkzSREyaUfoOX8nanid9AQwlNbY5VudWcws';

  // Upsert en Supabase
  fetch(SURL+'/rest/v1/anesfact_datos',{
    method:'POST',
    headers:{
      'apikey':SKEY,
      'Authorization':'Bearer '+SKEY,
      'Content-Type':'application/json',
      'Prefer':'resolution=merge-duplicates,return=minimal'
    },
    body:JSON.stringify({clave:clave,datos:JSON.stringify(payload)})
  })
  .then(function(r){
    if(r.ok||r.status===201||r.status===200||r.status===204){
      toast('Datos guardados \u2713 Abr\u00ed GECLISA y us\u00e1 el marcador'+(typeof AF_ENV!=='undefined'&&AF_ENV.dev?' (DEV)':''));
      setTimeout(function(){window.open('http://sanatoriomayo.myvnc.com:84','_blank');},500);
    } else {
      r.text().then(function(t){toast('Error guardando: '+t.slice(0,60));});
    }
  })
  .catch(function(e){
    toast('Error de red: '+e.message);
  });
}

