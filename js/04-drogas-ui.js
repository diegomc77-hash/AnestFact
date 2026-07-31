function renderDrogas(){
  var c=document.getElementById('drogas-list');if(!c||!S.cur)return;
  var d=(S.cur.foja&&S.cur.foja.drogas)||[];
  if(!d.length){c.innerHTML='<p style="font-size:12px;color:var(--text3)">Sin fármacos cargados</p>';if(typeof renderAlertasClinicas==='function')renderAlertasClinicas();return;}
  c.innerHTML=d.map(function(x,i){
    var vidOpts=VIAS.map(function(v){return'<option'+(v===x.v?' selected':'')+'>'+v+'</option>';}).join('');
    var ev=typeof evaluarReglaDroga==='function'?evaluarReglaDroga(x.n):null;
    var rowStyle=ev&&ev.nivel==='evitar'?'border-left:3px solid var(--red);padding-left:6px':ev&&ev.nivel==='precaucion'?'border-left:3px solid #ffb400;padding-left:6px':'';
    return '<div class="droga-row" id="dr-'+i+'" style="'+rowStyle+'">'
      +'<div class="ac-wrap" style="flex:2;min-width:0">'
        +'<input id="din-'+i+'" value="'+(x.n||'')+'" placeholder="Fármaco" autocomplete="off" oninput="editD('+i+',\'n\',this.value);acDrugRow('+i+',this.value)" onkeydown="acKey(event,\'ac-dr-'+i+'\')">'
        +'<div class="ac-list" id="ac-dr-'+i+'"></div>'
      +'</div>'
      +'<div style="flex:1;min-width:0;position:relative">'
        +'<input id="dds-'+i+'" value="'+(x.d||'')+'" placeholder="Dosis" autocomplete="off" oninput="editD('+i+',\'d\',this.value);acDoseRow('+i+',this.value)" onkeydown="acKey(event,\'ac-ds-'+i+'\')">'
        +'<div class="ac-list" id="ac-ds-'+i+'"></div>'
      +'</div>'
      +'<div style="flex:0 0 54px"><select onchange="editD('+i+',\'v\',this.value)">'+vidOpts+'</select></div>'
      +'<button onclick="delD('+i+')" style="background:none;border:none;color:var(--red);font-size:22px;cursor:pointer;flex-shrink:0;padding:0 2px;line-height:1">×</button>'
      +'</div>';
  }).join('');
  if(typeof renderAlertasClinicas==='function')renderAlertasClinicas();
}
function addDroga(){if(!S.cur)return;if(!S.cur.foja)S.cur.foja={drogas:[],vitals:[]};if(!S.cur.foja.drogas)S.cur.foja.drogas=[];S.cur.foja.drogas.push({n:'',d:'',v:'EV'});renderDrogas();}
function editD(i,k,v){
  if(S.cur&&S.cur.foja&&S.cur.foja.drogas&&S.cur.foja.drogas[i]){
    S.cur.foja.drogas[i][k]=v;
    if(k==='n'&&typeof showReglaDroga==='function'&&v.length>2)showReglaDroga(v);
  }
}
function delD(i){if(S.cur&&S.cur.foja&&S.cur.foja.drogas){S.cur.foja.drogas.splice(i,1);renderDrogas();}}
function micNewDrug(){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){toast('Voz requiere Chrome');return;}
  if(S.recog)S.recog.stop();
  var r=new SR();r.lang='es-AR';r.continuous=false;r.interimResults=false;
  var micEl=document.getElementById('m-droga-new');if(micEl){micEl.classList.add('rec');micEl.textContent='🔴';}
  S.recog=r;
  r.onresult=function(e){
    var txt=applyDrugDict(e.results[0][0].transcript);
    parseDrugSpeech(txt);stopMic(micEl);
  };
  r.onerror=function(ev){if(ev.error!=='aborted')toast('Error voz: '+ev.error);stopMic(micEl);};
  r.onend=function(){stopMic(micEl);};
  r.start();
}
function parseDrugSpeech(txt){
  if(!S.cur){return;}if(!S.cur.foja)S.cur.foja={drogas:[],vitals:[]};if(!S.cur.foja.drogas)S.cur.foja.drogas=[];
  var found=null;
  DRUGS.forEach(function(d){if(txt.toLowerCase().indexOf(d.n.toLowerCase())>=0&&(!found||d.n.length>found.n.length))found=d;});
  var drugName=found?found.n:txt.split(' ')[0];
  var doseMatch=txt.match(/(\d+\.?\d*\s*(mg|mcg|g|ml|ui|%|µg))/i);
  var dose=doseMatch?doseMatch[0]:'';
  if(!dose&&found&&found.mgKg){var peso=parseFloat((S.cur&&S.cur.peso)||0);if(peso>0)dose=(found.mgKg*peso).toFixed(0)+'mg';}
  if(!dose&&found)dose=found.doses[0]||'';
  var via=found?found.via:'EV';
  if(/\b(im|intramuscular)\b/i.test(txt))via='IM';
  else if(/\b(it|intratecal)\b/i.test(txt))via='IT';
  else if(/\b(peridural|epidural)\b/i.test(txt))via='Peridural';
  else if(/\b(inhal|sevo|volátil)\b/i.test(txt))via='INH';
  S.cur.foja.drogas.push({n:drugName,d:dose,v:via});
  renderDrogas();toast('Agregado: '+drugName+' '+dose);
  if(typeof showReglaDroga==='function')showReglaDroga(drugName);
  else if(found)showDoseInfo(found,parseFloat((S.cur&&S.cur.peso)||0));
}

// Selects sectorizados de premedicación
function renderPesoChips(){
  var cont=document.getElementById('premed-selects');if(!cont)return;
  var peso=parseFloat((S.cur&&S.cur.peso)||(document.getElementById('f-peso')?document.getElementById('f-peso').value:0)||70);
  function rnd(n){return parseFloat(n.toFixed(1));}
  var grupos=[
    {t:'Benzodiacepinas',items:[
      {n:'Midazolam',d:rnd(0.04*peso),u:'mg EV'},
      {n:'Diazepam',d:'5',u:'mg EV'},
      {n:'Lorazepam',d:'2',u:'mg EV'}
    ]},
    {t:'Anticolinérgicos',items:[
      {n:'Atropina',d:rnd(0.015*peso),u:'mg EV'},
      {n:'Escopolamina',d:'20',u:'mg EV'}
    ]},
    {t:'Protectores gástricos',items:[
      {n:'Ranitidina',d:'50',u:'mg EV'},
      {n:'Omeprazol',d:'40',u:'mg EV'},
      {n:'Pantoprazol',d:'40',u:'mg EV'}
    ]},
    {t:'Antieméticos',items:[
      {n:'Ondansetrón',d:rnd(0.1*peso),u:'mg EV'},
      {n:'Metoclopramida',d:'10',u:'mg EV'}
    ]},
    {t:'Corticoides',items:[
      {n:'Dexametasona',d:'8',u:'mg EV'}
    ]},
    {t:'AINEs / Analgésicos',items:[
      {n:'Ketorolac',d:'30',u:'mg EV'},
      {n:'Diclofenac',d:'75',u:'mg EV'},
      {n:'Dexketoprofeno',d:'50',u:'mg EV'},
      {n:'Meloxicam',d:'15',u:'mg EV'},
      {n:'Dipirona',d:'1',u:'g EV'},
      {n:'Paracetamol',d:'1',u:'g EV'}
    ]},
    {t:'Antibióticos',items:[
      {n:'Cefazolina',d:'2',u:'g EV'},
      {n:'Cefalotina',d:'2',u:'g EV'},
      {n:'Cefoxitina',d:'2',u:'g EV'},
      {n:'Clindamicina',d:'900',u:'mg EV'},
      {n:'Vancomicina',d:'1',u:'g EV'},
      {n:'Metronidazol',d:'500',u:'mg EV'}
    ]}
  ];
  cont.innerHTML='';
  grupos.forEach(function(g){
    var wrap=document.createElement('div');
    wrap.style.cssText='display:grid;grid-template-columns:1fr 70px 60px;gap:4px;margin-bottom:6px;align-items:center';
    var sel=document.createElement('select');
    sel.className='fi';
    sel.style.cssText='width:100%;font-size:10px;padding:4px 2px;height:32px;box-sizing:border-box';
    var opt0=document.createElement('option');opt0.value='';opt0.textContent=g.t+' — elegir...';sel.appendChild(opt0);
    g.items.forEach(function(it){
      var op=document.createElement('option');
      op.value=it.n+'|'+it.d+'|'+it.u;
      op.textContent=it.n+' ('+it.d+' '+it.u+')';
      sel.appendChild(op);
    });
    var inp=document.createElement('input');
    inp.type='text';inp.placeholder='dosis';inp.readOnly=true;
    inp.style.cssText='width:100%;font-size:10px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:4px 2px;height:32px;color:var(--text);box-sizing:border-box;text-align:center';
    var btn=document.createElement('button');
    btn.className='btn btn-s';
    btn.style.cssText='width:100%;font-size:10px;padding:4px 2px;height:32px;white-space:nowrap;box-sizing:border-box';
    btn.textContent='+ Agregar';btn.disabled=true;
    sel.onchange=function(){
      if(!sel.value){inp.value='';inp.readOnly=true;btn.disabled=true;return;}
      var p=sel.value.split('|');inp.value=p[1]+' '+p[2];inp.readOnly=false;btn.disabled=false;
    };
    btn.onclick=function(){
      if(!sel.value)return;
      var p=sel.value.split('|');
      var txt=p[0]+' '+(inp.value.trim()||p[1]+' '+p[2]);
      var fp=document.getElementById('fj-premed');
      if(fp){fp.value=(fp.value?fp.value+'. ':'')+txt;}
      sel.value='';inp.value='';inp.readOnly=true;btn.disabled=true;
    };
    wrap.appendChild(sel);wrap.appendChild(inp);wrap.appendChild(btn);
    cont.appendChild(wrap);
  });
}
function renderRecupSelects(){
  var cont=document.getElementById('recup-selects');
  if(!cont)return;
  cont.innerHTML='';
  var grupos=[
    {t:'Destino',campo:'_destino',items:['URPA','UTI','UCI','Sala general','Alta domiciliaria']},
    {t:'Vía aérea al egreso',campo:'_viaEgreso',items:['Extubado/a','Intubado/a','Máscara laríngea retirada','Sin dispositivo']},
    {t:'SpO₂ al egreso',campo:'_spo2',items:['SpO₂ 99%','SpO₂ 98%','SpO₂ 97%','SpO₂ 96%','SpO₂ 95%','SpO₂ <95% - requiere O₂ suplementario']},
    {t:'Estado neurológico',campo:'_neuro',items:['Despierto/a y orientado/a','Somnoliento/a pero reactivo/a','Sin despertar']},
    {t:'Hemodinamia',campo:'_hemo',items:['Hemodinámicamente estable','Requiere Efedrina EV','Requiere Noradrenalina EV','Requiere Dopamina EV','Hipertenso/a','Bradicárdico/a - requiere Atropina']},
    {t:'Analgesia post-operatoria',campo:'_anal',items:['Ketorolac 30mg EV','Diclofenac 75mg EV','Paracetamol 1g EV','Morfina 2mg EV','Tramadol 100mg EV','Dipirona 1g EV','Sin analgesia adicional']},
    {t:'Antieméticos',campo:'_ahem',items:['Ondansetrón 8mg EV','Metoclopramida 10mg EV','Sin antieméticos']}
  ];
  grupos.forEach(function(g){
    var row=document.createElement('div');
    row.style.marginBottom='6px';
    var sel=document.createElement('select');
    sel.className='fi';
    sel.style.fontSize='12px';
    var opt0=document.createElement('option');
    opt0.value='';opt0.textContent=g.t+' — elegir...';
    sel.appendChild(opt0);
    g.items.forEach(function(it){
      var op=document.createElement('option');
      op.value=it;op.textContent=it;sel.appendChild(op);
    });
    (function(campo){
      sel.onchange=function(){
        if(!sel.value)return;
        window[campo]=sel.value;
        actualizarRecup();
      };
    })(g.campo);
    row.appendChild(sel);
    cont.appendChild(row);
  });
}
function renderRecupChips(){
  var c=document.getElementById('recup-chips');if(!c)return;
  c.innerHTML=RECUP_DRUGS.slice(0,12).map(function(r){return'<span class="chip" onclick="addChipTo(\'fj-recup\',\''+r.replace(/'/g,"\\'")+'\')">'+(r.length>28?r.slice(0,26)+'…':r)+'</span>';}).join('');
}
function addChipTo(fieldId,txt){
  var f=document.getElementById(fieldId);if(!f)return;
  f.value=(f.value?(f.value.replace(/[.\s]+$/,'')+'. '):'')+ txt;
  closeAllAC();
}

