function renderGeclisa(){
  var i=S.cur;var campos=document.getElementById('geclisa-campos');var steps=document.getElementById('geclisa-steps');var fojaqx=document.getElementById('geclisa-fojaqx');
  if(!i){campos.innerHTML='<p style="font-size:12px;color:var(--text3)">Abrí una intervención primero</p>';return;}
  var f=i.foja||{};
  var parts=(i.pac||'').split(',');var ape=parts[0]?parts[0].trim():'';var nom=parts[1]?parts[1].trim():'';
  function cpRow(label,val){
    if(!val)return'';
    return '<div style="margin-bottom:8px"><div style="font-size:11px;color:var(--text3);margin-bottom:3px">'+label+'</div>'
      +'<div class="cp-row"><span style="font-family:monospace;font-size:13px;flex:1;word-wrap:break-word;overflow-wrap:break-word;white-space:pre-wrap;min-width:0">'+val+'</span>'
      +'<button onclick="copyVal(\''+val.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\',\''+label+'\')" style="background:none;border:none;font-size:18px;cursor:pointer;flex-shrink:0">📋</button></div></div>';
  }
  var sectorCama=(i.mayo_sector&&i.mayo_cama)?(i.mayo_sector+' - '+i.mayo_cama):(i.sala&&i.cama?i.sala+' - Cama '+i.cama:'');
  var pracsStr=(i.pracs&&i.pracs.length)?i.pracs.map(function(p){return p.cod+' '+p.desc;}).join(' / '):'';
  var codigoQx=(i.pracs&&i.pracs.length)?i.pracs[0].cod:'';
  var drogasStr=(f.drogas&&f.drogas.length)?f.drogas.filter(function(d){return d.n&&d.n.trim();}).map(function(d){return(d.n||'')+' '+(d.d||'')+' '+(d.v||'');}).join(', '):'';
  function secT(t){return '<div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;padding:10px 0 4px;border-top:1px solid var(--border);margin-top:4px">'+t+'</div>';}
  campos.innerHTML=
    secT('1 — Datos del Paciente')
    +cpRow('Apellido',ape)+cpRow('Nombre',nom)
    +cpRow('DNI',i.dni||'')+cpRow('Edad',i.edad||'')
    +cpRow('N° Afiliado',i.afil||'')+cpRow('Obra Social',i.obra||'')
    +cpRow('Fecha de Cirugía',fmt(i.fecha))
    +cpRow('Hora Admisión / Inicio',i.hora||'')
    +cpRow('Quirófano',i.mayo_quir||i.sala||sectorCama||'')
    +cpRow('Tipo de Cirugía',(i.mayo_tipociru||'PROGRAMADA').toUpperCase()+(i.ob?' - Obesidad Mórbida':''))
    +cpRow('Diagnóstico/cx realizada',i.diag||'')
    +secT('2 — Equipo y Procedimiento')
    +cpRow('Anestesista',localStorage.getItem('af_anest_nombre')||'HUERTA MARIA SOLEDAD')
    +cpRow('Matrícula',localStorage.getItem('af_anest_mp')||'32393')
    +cpRow('Hora Inicio',i.hora||'')+cpRow('Hora Fin',f.fin||'')
    +cpRow('Cirujano',i.ciru||'')+cpRow('Especialidad',i.serv||'')
    +cpRow('Observaciones generales',f.obs_geclisa||f.obs||'')
    +cpRow('Nivel Regional',f.nivel_regional||'')
    +cpRow('Materiales descartables',f.materiales||'')
    +cpRow('Monitoreo',f.monitoreo||'EtCO2, PAM, ECG, SAT O2, PANI')
    +cpRow('Posición quirúrgica',f.posicion||'')
    +cpRow('Código Quirúrgico',codigoQx)
    +cpRow('Prácticas',pracsStr)
    +secT('3 — Medicación')
    +cpRow('Premedicación',f.premed||'')
    +cpRow('Antibioticoprofilaxis',f.atb||'')
    +cpRow('Medicamentos Anestésicos',drogasStr)
    +secT('4 — Evaluación Preanestésica')
    +cpRow('Peso (kg)',i.peso||'')+cpRow('Edad',i.edad||'')
    +cpRow('Riesgo ASA','ASA '+(f.asa||'?'))
    +cpRow('Examen Físico',f.examenFisico||'')
    +secT('5 — Técnica Anestésica')
    +cpRow('Premedicación',f.premed||'')
    +cpRow('Inducción',(function(){
      var base=f.ind||'';
      var drogas=(f.drogas||[]).filter(function(d){
        if(!d.n||!d.n.trim())return false;
        var g=(d.grupo||'').toLowerCase();
        return g.indexOf('inductor')>=0||g.indexOf('relajante')>=0||g.indexOf('analg')>=0;
      }).map(function(d){return d.n+' '+d.d+' '+d.v;}).join(', ');
      return base+(drogas?(base?'. ':'')+drogas:'');
    })())
    +cpRow('Mantenimiento / Técnica',(function(){
      var base=f.tec||'';
      var drogas=(f.drogas||[]).filter(function(d){
        if(!d.n||!d.n.trim())return false;
        var g=(d.grupo||'').toLowerCase();
        return g.indexOf('mantenimiento')>=0||g.indexOf('inotr')>=0||
               g.indexOf('intratecal')>=0||g.indexOf('peridural')>=0||
               g.indexOf('local')>=0||g.indexOf('coadyuv')>=0;
      }).map(function(d){return d.n+' '+d.d+' '+d.v;}).join(', ');
      return base+(drogas?' con '+drogas:'');
    })())
    +cpRow('Vía Aérea',f.via||'')
    +secT('6 — Signos Vitales (resumen)')
    +(f.mayo_vitals&&f.mayo_vitals.length?
      f.mayo_vitals.filter(function(r){return r.sist||r.fc;}).slice(0,5).map(function(r){
        return cpRow(r.min+' min','SIST:'+r.sist+' DIAST:'+r.diast+' SAT:'+r.sato2+'% FC:'+r.fc+' PAM:'+r.pam);
      }).join('')
      :'<div style="font-size:12px;color:var(--text3);padding:6px 0">Registrá los valores en la tabla de la Foja Mayo</div>')
    +secT('7 — Balance')
    +cpRow('Fluidos / Suero',f.suero||'')
    +cpRow('Sangre / Glóbulos rojos',f.sangre||'')
    +cpRow('Plasma',f.plasma||'')
    +cpRow('Orina / Diuresis',f.orina||'')
    +cpRow('Sangrado intraoperatorio',f.sangrado||'')
    +cpRow('Otro',f.otro||'')
    +secT('8 — Postoperatorio')
    +cpRow('Recuperación',f.recup||'S/p')
    +cpRow('Observación/Complicación',f.obs||'S/p')
    +cpRow('Observaciones finales (foja)',f.obs||'');
  var gS=[{n:1,t:'Ingresar a GECLISA',d:'<b>sanatoriomayo.myvnc.com:84</b> — usuario Mhuerta'},{n:2,t:'Ubicación y sector',d:'Ubicación: <b>SANATORIO MAYO</b> → Sector: <b>PRE-QUIRÚRGICO</b> → Consultor'},{n:3,t:'Buscar paciente',d:'Click en ≡ de <b>'+(i.pac||'el paciente')+'</b>'},{n:4,t:'Evoluciones',d:'Tocar <b>Evoluciones</b>'},{n:5,t:'Nuevo protocolo',d:'Columna derecha → <b>Nuevo</b>'},{n:6,t:'Plantilla',d:'Elegir <b>"Anestesia - Ficha Anestesia"</b> → Seleccionar'},{n:7,t:'Llenar con 📋',d:'Copiar cada campo y pegarlo en GECLISA'},{n:8,t:'Guardar',d:'Click en <b>GRABAR</b>'}];
  steps.innerHTML=gS.map(function(s){return'<div class="step-item"><div class="step-num">'+s.n+'</div><div class="step-txt"><b>'+s.t+'</b><br>'+s.d+'</div></div>';}).join('');
  fojaqx.innerHTML='<div style="font-size:12px;color:var(--text2);line-height:2">'
    +'<div>• <b>Apellidos / Nombres</b>: '+ape+' / '+nom+'</div>'
    +'<div>• <b>Cirujano</b>: '+(i.ciru||'—')+'</div>'
    +'<div>• <b>Anestesiólogo</b>: HUERTA MARIA SOLEDAD</div>'
    +'<div>• <b>Tipo anestesia</b>: '+(f.tec||'—')+'</div>'
    +'<div>• <b>Diag. Pre/Operatorio</b>: '+(i.diag||'—')+'</div>'
    +'<div>• <b>Riesgo quirúrgico</b>: ASA '+(f.asa||'?')+'</div>'
    +'<div>• <b>Código Qx</b>: '+(i.pracs&&i.pracs.length?i.pracs[0].cod:'—')+'</div>'
    +'<div>• <b>Hora inicio / fin</b>: '+(i.hora||'—')+' / '+(f.fin||'—')+'</div>'+'</div>';

  // Build text + copy button
  var lineas=[
    '=== GECLISA - '+(i.pac||'').toUpperCase()+' - '+fmt(i.fecha)+' ===',
    'Quirofano: '+(i.sala||sectorCama||'')+'  Hora: '+(i.hora||'')+' - '+(f.fin||''),
    'Diagnostico: '+(i.diag||''),
    '','MEDICACION:','Premed: '+(f.premed||''),'Antibioticoprofilaxis: '+(f.atb||''),'Anestesicos: '+drogasStr,
    '','PREANESTESICA:',
    'Peso: '+(i.peso||'')+'kg  Edad: '+(i.edad||'')+'  ASA: '+(f.asa?'ASA '+f.asa:''),
    'Monitoreo: '+(f.monitoreo||'EtCO2, PAM, ECG, SAT O2, PANI'),
    '','TECNICA:',
    'Induccion: '+(f.ind||'')+'  Via: '+(f.via||''),
    'Mantenimiento: '+(f.tec||''),
    'Metodos: '+(f.metodos||''),
  ];
  if(f.mayo_vitals&&f.mayo_vitals.length){
    lineas.push('','SIGNOS VITALES:','MIN  SIST  DIAST  SAT  CO2  FC  PAM');
    f.mayo_vitals.forEach(function(r){
      lineas.push(String(r.min).padEnd(5)+String(r.sist).padEnd(6)+String(r.diast).padEnd(7)+String(r.sato2).padEnd(5)+String(r.eco2).padEnd(5)+String(r.fc).padEnd(4)+String(r.pam));
    });
  }
  lineas=lineas.concat(['','BALANCE:',
    'Fluido 1: '+(f.fluido1||f.suero||''),
    'Fluido 2: '+(f.fluido2||''),
    'Orina: '+(f.orina||''),
    'Sangrado: '+(f.sangrado||f.sangre||''),
    '','POSTOP:','Recuperacion: '+(f.recup||'S/p')
  ]);
  window._geclisaTexto=lineas.join('\n');
  var btnCopy='<button class="btn btn-g" style="width:100%;margin-bottom:14px;font-size:14px;padding:14px" onclick="copiarTodoGeclisa()">📋 Copiar todos los datos para GECLISA</button>';
  campos.innerHTML=btnCopy+campos.innerHTML;
}

