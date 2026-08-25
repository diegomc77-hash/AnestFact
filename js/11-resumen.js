function renderResumen(){
  var c=document.getElementById('resumen-cont');if(!c||!S.cur)return;
  var i=S.cur;var f=i.foja||{};
  function campo(icon,label,val){
    return'<div style="margin-bottom:10px"><div style="font-size:11px;color:var(--text3);font-weight:500;margin-bottom:3px">'+icon+' '+label+'</div>'
      +'<div class="cp-row"><span style="font-family:monospace;font-size:13px;color:'+(val?'var(--text)':'var(--text3)')+'">'+( val||'— vacío')+'</span>'
      +(val?'<button onclick="copyVal(\''+val.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\',\''+label+'\')" style="background:none;border:none;font-size:18px;cursor:pointer">📋</button>':'')+'</div></div>';
  }
  var mods=calcMods(i);
  var modsHtml=mods.length?'<div class="card"><div class="ct">Modificadores</div>'+mods.map(function(m){return'<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px"><span>'+m.l+'</span>'+(m.r?'<span class="badge by">+'+m.r+'%</span>':'')+(m.cp?'<span class="badge by">+'+m.cp+' comp.</span>':'')+'</div>';}).join('')+'</div>':'';
  var pracsHtml=i.pracs&&i.pracs.length?'<div class="card"><div class="ct">Prácticas ADAARC</div>'+i.pracs.map(function(p){return'<div style="margin-bottom:8px"><div style="font-size:11px;color:var(--text3);margin-bottom:3px">'+p.cod+' · comp.'+p.comp+'</div><div class="cp-row"><span style="font-family:monospace;font-size:13px">'+p.desc+'</span><button onclick="copyVal(\''+p.cod+'\',\'Código\')" style="background:none;border:none;font-size:18px;cursor:pointer">📋</button></div></div>';}).join('')+'</div>':'';
  var chkHtml='<div class="card"><div class="ct">Checklist evweb</div>'
    +[{id:'ck1',txt:'<b>Foja anestésica</b> — impresa con firma y sello',done:!!(f.tec||f.obs)},{id:'ck2',txt:'<b>Foja quirúrgica</b> — cargada en GECLISA o adjuntada',done:false},{id:'ck3',txt:'<b>Autorización</b> — recibida por WhatsApp/mail',done:false},{id:'ck4',txt:'<b>Subida a evweb</b> — 3 documentos a ADAARC',done:false}]
    .map(function(x){return'<div style="display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="toggleChk(\''+x.id+'\')">'+'<div class="chk-box'+(x.done?' checked':'')+'" id="'+x.id+'">'+(x.done?'✓':'')+'</div><div style="font-size:13px;color:var(--text2)">'+x.txt+'</div></div>';}).join('')+'</div>';
  c.innerHTML=chkHtml+'<div class="card"><div class="ct">Campos para evweb</div>'
    +campo('🏥','Obra social',i.obra)+campo('📅','Fecha',fmt(i.fecha))+campo('🕐','Hora inicio',i.hora)
    +campo('👤','Paciente',i.pac)+campo('🎂','Edad',i.edad?i.edad+' años':'')+campo('🪪','DNI',i.dni)
    +campo('🔬','Diagnóstico',i.diag)+campo('👨‍⚕️','Cirujano',i.ciru)+campo('🏨','Sanatorio',i.san)+campo('🔖','Afiliado N°',i.afil)+'</div>'
    +pracsHtml+modsHtml
    +'<div class="brow" style="margin-bottom:8px"><button class="btn btn-s" onclick="go(\'foja\')">📋 Foja</button>'+(i.san&&i.san.includes('Mayo')?'<button class="btn btn-b" onclick="go(\'geclisa\')">🏥 GECLISA</button>':'')+'</div>'
    +'<button class="btn btn-g" style="margin-bottom:8px" onclick="copiarTodo()">📋 Copiar resumen</button>'
    +'<button class="btn btn-s" style="margin-bottom:8px" onclick="marcarEnviado()">✅ Marcar enviado</button>'
    +'<p style="font-size:11px;color:var(--text3);margin:-4px 0 12px;line-height:1.35">Marca local en AnesFact (Mayo → GECLISA / Aero → evweb). No consulta el sistema destino.</p>'
    +'<button class="btn btn-s" style="margin-bottom:24px;color:var(--red);border-color:rgba(248,81,73,.45)" onclick="borrarIntervencion(S.cur&&S.cur.id)">🗑 Borrar foja</button>';
}
function toggleChk(id){var b=document.getElementById(id);if(!b)return;var d=b.classList.contains('checked');b.classList.toggle('checked',!d);b.textContent=d?'':'✓';}
function calcMods(i){
  var m=[];
  if(i.fecha&&i.hora){var dt=new Date(i.fecha+'T'+i.hora),h=dt.getHours(),d=dt.getDay();if(h>=20||h<7)m.push({l:'Nocturno (20–7hs)',r:35});if(d===0||(d===6&&h>=13))m.push({l:'Fin de semana',r:50});}
  if(i.ob)m.push({l:'Obesidad mórbida',cp:2});
  var e=parseInt(i.edad);if(!isNaN(e)){if(e<3)m.push({l:'Pediátrico <3 años',r:40});else if(e<14)m.push({l:'Pediátrico 3–14 años',r:30});else if(e>=70)m.push({l:'Mayor 70 años',r:30});}
  return m;
}
function copiarTodo(){
  if(!S.cur)return;var i=S.cur,f=i.foja||{};
  var txt='RESUMEN ANESFACT — Dra.Huerta M.P.32393\n'+'─'.repeat(38)+'\n'
    +'Paciente: '+(i.pac||'')+' | DNI: '+(i.dni||'')+' | Edad: '+(i.edad||'')+'\n'
    +'Fecha: '+fmt(i.fecha)+' | Hora: '+(i.hora||'')+'\nCirugía: '+(i.diag||'')+'\nCirujano: '+(i.ciru||'')+'\n'
    +'Sanatorio: '+(i.san||'')+'\nObra social: '+(i.obra||'')+' | Afiliado: '+(i.afil||'')+'\n'
    +'Técnica: '+(f.tec||'')+' | ASA: '+(f.asa||'')+'\nMedicación: '+((f.drogas||[]).map(function(d){return d.n+' '+d.d+' '+d.v;}).join(', '))+'\n'
    +'Prácticas: '+((i.pracs||[]).map(function(p){return p.cod+' '+p.desc;}).join('; '));
  copyVal(txt,'Resumen');
}
function marcarEnviado(){
  if(!S.cur)return;
  var dest=(typeof afDestinoEnviadoPorSan==='function')?afDestinoEnviadoPorSan(S.cur):null;
  if(!dest){
    // Sanatorio no Mayo/Aero: pedir confirmación y dejar genérico legado solo si hace falta
    if(!confirm('Sanatorio no es Mayo ni Aeronáutico.\n¿Marcar como Enviado genérico?'))return;
    S.cur.estado='enviado';
  }else{
    S.cur.estado=dest;
    S.cur.enviadoDestino=dest==='enviado_geclisa'?'geclisa':'evweb';
  }
  S.cur.enviadoAt=new Date().toISOString();
  S.cur.enviadoVia='manual_resumen';
  var idx=S.intervs.findIndex(function(i){return i.id===S.cur.id;});if(idx>=0)S.intervs[idx]=S.cur;
  saveIntervsToStorage();
  if(typeof syncAutoPushDebounced==='function')syncAutoPushDebounced();
  var msg=dest==='enviado_geclisa'?'Marcada enviada a GECLISA (manual) ✓'
    :(dest==='enviado_evweb'?'Marcada enviada a evweb (manual) ✓':'Marcado como enviado ✓');
  toast(msg);setTimeout(function(){go('home');},1400);
}

