var AF_HELP_PREFIX='anesfact_help_';
var HELP_CAT_LABELS={plan:'Plan',sync:'Sync',geclisa:'GECLISA',foja:'Foja',scan:'Escaneo IA',nom:'Nomenclador',datos:'Datos',otro:'Otro'};

function helpStatus(msg,color){
  var el=document.getElementById('help-status');if(!el)return;
  el.style.display='block';
  el.style.background=color==='ok'?'rgba(29,185,84,.1)':color==='err'?'rgba(248,81,73,.1)':'rgba(56,139,253,.1)';
  el.style.color=color==='ok'?'var(--green)':color==='err'?'var(--red)':'var(--blue)';
  el.style.border='1px solid '+(color==='ok'?'rgba(29,185,84,.3)':color==='err'?'rgba(248,81,73,.3)':'rgba(56,139,253,.3)');
  el.textContent=msg;
}

function getHelpLocal(){try{return JSON.parse(localStorage.getItem('af_help')||'[]');}catch(e){return[];}}
function saveHelpLocal(list){localStorage.setItem('af_help',JSON.stringify(list.slice(0,80)));}

function buildHelpTicket(cat,msg,pasos,includeCtx){
  var vista=(S.hist&&S.hist.length)?S.hist[S.hist.length-1]:'home';
  var t={id:Date.now()+'_'+Math.random().toString(36).slice(2,6),fecha:new Date().toISOString(),categoria:cat,mensaje:msg,pasos:pasos||'',vista:vista,version:'AnesFact v7',anestesista:localStorage.getItem('af_anest_nombre')||'',ua:(navigator.userAgent||'').slice(0,180),estado:'nuevo'};
  if(includeCtx&&S.cur){
    t.contexto={pac:S.cur.pac||'',san:S.cur.san||'',diag:S.cur.diag||'',estado:S.cur.estado||''};
  }
  return t;
}

function postHelpTicket(ticket){
  var oid=(typeof AF_AUTH!=='undefined'&&AF_AUTH.getUserId)?AF_AUTH.getUserId():null;
  var row={clave:AF_HELP_PREFIX+ticket.id,datos:JSON.stringify(ticket)};
  if(oid)row.owner_id=oid;
  return fetch(afSupabaseUrl()+'/rest/v1/anesfact_datos',{
    method:'POST',
    headers:afSupabaseHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),
    body:JSON.stringify(row)
  });
}

function enviarReporteAyuda(){
  var msgEl=document.getElementById('help-msg');
  var msg=msgEl?msgEl.value.trim():'';
  if(!msg){toast('Escribí qué pasó');if(msgEl)msgEl.focus();return;}
  var cat=(document.getElementById('help-cat')||{value:'otro'}).value;
  var pasos=(document.getElementById('help-pasos')||{value:''}).value.trim();
  var ctx=(document.getElementById('help-ctx')||{checked:true}).checked;
  var ticket=buildHelpTicket(cat,msg,pasos,ctx);
  helpStatus('Enviando...','info');
  postHelpTicket(ticket).then(function(r){
    if(!r.ok&&r.status!==201)return r.text().then(function(t){throw new Error('HTTP '+r.status+': '+t.slice(0,80));});
    ticket.enviado=true;
    var list=getHelpLocal();list.unshift(ticket);saveHelpLocal(list);
    if(msgEl)msgEl.value='';
    var pasosEl=document.getElementById('help-pasos');if(pasosEl)pasosEl.value='';
    helpStatus('\u2713 Reporte enviado — gracias','ok');
    toast('Reporte enviado \u2713');
    renderAyudaList();
  }).catch(function(e){
    ticket.enviado=false;
    ticket.error=e.message;
    var list=getHelpLocal();list.unshift(ticket);saveHelpLocal(list);
    helpStatus('Guardado local (sin internet). Reintentá más tarde.','err');
    toast('Sin conexión — quedó guardado aquí');
    renderAyudaList();
  });
}

function reintentarReporte(id){
  var list=getHelpLocal();
  var ticket=list.find(function(t){return t.id===id;});
  if(!ticket)return;
  helpStatus('Reenviando...','info');
  postHelpTicket(ticket).then(function(r){
    if(!r.ok&&r.status!==201)return r.text().then(function(t){throw new Error('HTTP '+r.status);});
    ticket.enviado=true;delete ticket.error;saveHelpLocal(list);
    helpStatus('\u2713 Reenviado','ok');toast('Enviado \u2713');renderAyudaList();
  }).catch(function(e){
    helpStatus('Error: '+e.message,'err');toast('No se pudo enviar');
  });
}

function copiarReporte(id){
  var list=getHelpLocal();
  var t=list.find(function(x){return x.id===id;});
  if(!t){toast('No encontrado');return;}
  var txt='[AnesFact '+HELP_CAT_LABELS[t.categoria||'otro']+'] '+t.mensaje
    +(t.pasos?'\nPasos: '+t.pasos:'')
    +(t.contexto?'\nCtx: '+(t.contexto.pac||'')+' / '+(t.contexto.san||''):'')
    +'\n'+new Date(t.fecha).toLocaleString();
  copyVal(txt,'Reporte');
}

function renderAyudaList(){
  var box=document.getElementById('help-list');if(!box)return;
  var list=getHelpLocal();
  if(!list.length){box.innerHTML='<p style="font-size:12px;color:var(--text3)">Sin reportes todav\u00eda</p>';return;}
  box.innerHTML=list.slice(0,20).map(function(t){
    var cat=HELP_CAT_LABELS[t.categoria||'otro']||t.categoria;
    var st=t.enviado?'<span style="color:var(--green)">\u2713 Enviado</span>':'<span style="color:var(--yellow)">\u23f3 Pendiente</span>';
    var fecha=new Date(t.fecha).toLocaleString();
    var retry=!t.enviado?'<button class="btn btn-s" style="font-size:11px;padding:4px 8px" onclick="reintentarReporte(\''+t.id+'\')">Reintentar</button>':'';
    return '<div style="padding:10px 0;border-bottom:1px solid var(--border)">'
      +'<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">'
      +'<div style="font-size:12px;font-weight:600">'+cat+' · '+fecha+'</div>'+st+'</div>'
      +'<div style="font-size:13px;margin-top:4px">'+String(t.mensaje).replace(/</g,'&lt;')+'</div>'
      +'<div style="display:flex;gap:6px;margin-top:6px">'+retry
      +'<button class="btn btn-s" style="font-size:11px;padding:4px 8px" onclick="copiarReporte(\''+t.id+'\')">Copiar</button></div></div>';
  }).join('');
}

function cargarReportesNube(){
  var box=document.getElementById('help-cloud-list');if(!box)return;
  if(typeof USER_IS_ADMIN==='undefined'||!USER_IS_ADMIN){
    box.innerHTML='<p style="font-size:12px;color:var(--text3)">Solo el administrador puede ver reportes de todos los usuarios.</p>';
    return;
  }
  box.innerHTML='<p style="font-size:12px;color:var(--text3)">Cargando...</p>';
  fetch(afSupabaseUrl()+'/rest/v1/anesfact_datos?clave=like.'+encodeURIComponent(AF_HELP_PREFIX)+'*&select=clave,datos&order=clave.desc&limit=40',{
    headers:afSupabaseHeaders()
  }).then(function(r){
    if(!r.ok)throw new Error('HTTP '+r.status);
    return r.json();
  }).then(function(rows){
    if(!rows||!rows.length){box.innerHTML='<p style="font-size:12px;color:var(--text3)">No hay reportes en la nube</p>';return;}
    box.innerHTML=rows.map(function(row){
      var t;try{t=JSON.parse(row.datos||'{}');}catch(e){t={mensaje:row.datos};}
      var cat=HELP_CAT_LABELS[t.categoria||'otro']||t.categoria||'?';
      var fecha=t.fecha?new Date(t.fecha).toLocaleString():'';
      var who=t.anestesista||'';
      var ctxPac=(t.contexto&&t.contexto.pac)?' · [contexto paciente oculto en listado]':'';
      return '<div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:12px">'
        +'<div style="font-weight:600;color:var(--blue)">'+cat+(who?' · '+who:'')+ctxPac+'</div>'
        +'<div style="color:var(--text3);font-size:11px">'+fecha+'</div>'
        +'<div style="margin-top:4px">'+String(t.mensaje||'').replace(/</g,'&lt;')+'</div></div>';
    }).join('');
  }).catch(function(e){
    box.innerHTML='<p style="font-size:12px;color:var(--red)">No se pudieron cargar ('+e.message+').</p>';
  });
}

function renderAyuda(){renderAyudaList();}
