/** Auscultación respiratoria / cardiovascular con chips interactivos. */
var _examenAusc={
  resp:{mode:'normal',mv:'',agregados:[],contexto:[],otro:''},
  cv:{mode:'normal',ruidos:'',ritmo:'',soplos:'',foco:'',intensidad:'',contexto:[],otro:''}
};

var AUSC_RESP_MV={
  conservado:'MV conservado bilateral',
  mv_bil:'MV disminuido bilateral',
  mv_base_der:'MV disminuido en base derecha',
  mv_base_izq:'MV disminuido en base izquierda',
  abolido:'MV abolido'
};

var AUSC_RESP_AGREG={
  sibilancias:'sibilancias',
  rales:'rales',
  roncus:'roncus',
  estridor:'estridor'
};

var AUSC_RESP_CTX={
  broncoespasmo:'broncoespasmo',
  neumonia:'neumonía',
  eap:'EAP',
  epoc:'EPOC',
  derrame:'derrame pleural',
  atelectasia:'atelectasia'
};

var AUSC_CV_RUIDOS={
  normofoneticos:'ruidos cardíacos normofonéticos',
  hipofoneticos:'ruidos cardíacos hipofonéticos',
  r3:'tercer ruido (R3)',
  r4:'cuarto ruido (R4)',
  frote:'frote pericárdico'
};

var AUSC_CV_RITMO={
  ritmico:'ritmo regular',
  fa:'ritmo irregular compatible con fibrilación auricular',
  bradicardia:'bradicardia',
  taquicardia:'taquicardia',
  extrasistoles:'extrasístoles'
};

var AUSC_CV_SOPLOS={
  sin_soplos:'sin soplos',
  sist_eject:'soplo sistólico eyectivo',
  sist_regurg:'soplo sistólico regurgitante',
  diastolico:'soplo diastólico',
  funcional:'soplo funcional'
};

var AUSC_CV_FOCO={
  aortico:'foco aórtico',
  mitral:'foco mitral',
  pulmonar:'foco pulmonar',
  tricuspid:'foco tricuspídeo'
};

var AUSC_CV_INT={
  i:'grado I/VI',
  ii:'grado II/VI',
  iii:'grado III/VI',
  iv:'grado IV/VI',
  v:'grado V/VI',
  vi:'grado VI/VI'
};

var AUSC_CV_CTX={
  ea:'estenosis aórtica',
  im:'insuficiencia mitral',
  icc:'insuficiencia cardíaca congestiva',
  marcapasos:'marcapasos',
  protesis:'prótesis valvular'
};

function _auscOn(on){
  return on?{bg:'rgba(29,185,84,.15)',border:'var(--green)',color:'var(--green)'}
         :{bg:'var(--bg3)',border:'var(--border)',color:'var(--text)'};
}

function _auscStyleBtn(btn,on){
  if(!btn)return;
  var s=_auscOn(on);
  btn.style.background=s.bg;
  btn.style.borderColor=s.border;
  btn.style.color=s.color;
}

function _auscJoinList(arr,conj){
  if(!arr.length)return '';
  var parts=arr.map(function(k){return conj[k]||k;});
  if(parts.length===1)return parts[0];
  if(parts.length===2)return parts[0]+' y '+parts[1];
  return parts.slice(0,-1).join(', ')+' y '+parts[parts.length-1];
}

function getTextoAuscResp(){
  return generarTextoResp();
}

function getTextoAuscCv(){
  return generarTextoCv();
}

function generarTextoResp(){
  return generarTextoRespFromState(_examenAusc.resp);
}

function generarTextoCv(){
  return generarTextoCvFromState(_examenAusc.cv);
}

function generarTextoRespFromState(r){
  if(!r||r.mode==='normal')return 'MV conservado bilateral, sin agregados';
  var parts=[];
  if(r.mv&&AUSC_RESP_MV[r.mv])parts.push(AUSC_RESP_MV[r.mv]);
  else parts.push('examen respiratorio alterado');
  if(r.agregados&&r.agregados.length){
    parts.push('con '+_auscJoinList(r.agregados,AUSC_RESP_AGREG));
  }
  if(r.contexto&&r.contexto.length){
    parts.push('('+_auscJoinList(r.contexto,AUSC_RESP_CTX)+')');
  }
  if(r.otro&&r.otro.trim())parts.push(r.otro.trim());
  return parts.join(', ');
}

function generarTextoCvFromState(c){
  if(!c||c.mode==='normal')return 'Ruidos cardíacos normofonéticos, sin soplos';
  var frases=[];
  if(c.ruidos&&AUSC_CV_RUIDOS[c.ruidos])frases.push(AUSC_CV_RUIDOS[c.ruidos].charAt(0).toUpperCase()+AUSC_CV_RUIDOS[c.ruidos].slice(1));
  else frases.push('Examen cardiovascular alterado');
  if(c.ritmo&&AUSC_CV_RITMO[c.ritmo])frases.push(AUSC_CV_RITMO[c.ritmo].charAt(0).toUpperCase()+AUSC_CV_RITMO[c.ritmo].slice(1));
  if(c.soplos&&c.soplos!=='sin_soplos'&&AUSC_CV_SOPLOS[c.soplos]){
    var sop=AUSC_CV_SOPLOS[c.soplos];
    if(c.intensidad&&AUSC_CV_INT[c.intensidad])sop+=' '+AUSC_CV_INT[c.intensidad];
    if(c.foco&&AUSC_CV_FOCO[c.foco])sop+=' en '+AUSC_CV_FOCO[c.foco];
    frases.push(sop.charAt(0).toUpperCase()+sop.slice(1));
  }else if(c.soplos==='sin_soplos'){
    frases.push('Sin soplos');
  }
  if(c.contexto&&c.contexto.length){
    var ctxTxt=_auscJoinList(c.contexto,AUSC_CV_CTX);
    frases.push(ctxTxt.charAt(0).toUpperCase()+ctxTxt.slice(1));
  }
  if(c.otro&&c.otro.trim())frases.push(c.otro.trim());
  return frases.join('. ');
}

function _auscExtractSection(txt,label,nextLabels){
  var idx=txt.indexOf(label);
  if(idx<0)return '';
  var start=idx+label.length;
  var end=txt.length;
  nextLabels.forEach(function(nl){
    var ni=txt.indexOf(nl,start);
    if(ni>=0&&ni<end)end=ni;
  });
  return txt.slice(start,end).trim().replace(/\.\s*$/,'');
}

function buildHallazgosFisicos(f){
  var h=[];
  if(!f)f={};
  if(f.mallampati){
    var mRom={'I':1,'II':2,'III':3,'IV':4};
    var mVal=mRom[f.mallampati]||parseInt(f.mallampati,10)||0;
    if(mVal>=3)h.push('Mallampati '+f.mallampati);
  }
  var respNorm=/^MV conservado bilateral, sin agregados$/i;
  var cvNorm=/^Ruidos card[ií]acos normofon[eé]ticos, sin soplos$/i;
  if(f.examenAusc){
    if(f.examenAusc.resp&&f.examenAusc.resp.mode==='alterado'){
      var rt=generarTextoRespFromState(f.examenAusc.resp);
      if(rt&&!respNorm.test(rt))h.push('Resp: '+rt);
    }
    if(f.examenAusc.cv&&f.examenAusc.cv.mode==='alterado'){
      var ct=generarTextoCvFromState(f.examenAusc.cv);
      if(ct&&!cvNorm.test(ct))h.push('CV: '+ct);
    }
  }
  if(f.examenFisico){
    var txt=f.examenFisico;
    var respPart=_auscExtractSection(txt,'Aparato respiratorio:',['Aparato cardiovascular:','Examen regional:']);
    var cvPart=_auscExtractSection(txt,'Aparato cardiovascular:',['Examen regional:']);
    if(respPart&&!respNorm.test(respPart)&&h.indexOf('Resp: '+respPart)<0&&!h.some(function(x){return x.indexOf('Resp:')===0;})){
      h.push('Resp: '+respPart);
    }
    if(cvPart&&!cvNorm.test(cvPart)&&h.indexOf('CV: '+cvPart)<0&&!h.some(function(x){return x.indexOf('CV:')===0;})){
      h.push('CV: '+cvPart);
    }
    if(!respPart&&!cvPart){
      txt.split('.').forEach(function(fr){
        var ft=fr.trim();
        if(!ft)return;
        if(/patol|anormal|alterado|soplo|arritmia|fibril|sibilancia|rale|roncus|estertor|estridor|hipofon|frote|bradicard|taquicard|extrasist|epoc|eap|neumon|derrame|atelectas|broncoespasm|icc|insuficiencia card|pr[oó]tesis|marca.?pasos/i.test(ft)){
          if(ft.length<15)ft='Hallazgo: '+ft;
          h.push(ft);
        }
      });
    }
  }
  if(f.examenRegional&&/patol|anormal|alterado|edema|d[eé]ficit|hipoestesia|infecci/i.test(f.examenRegional)){
    h.push(f.examenRegional.slice(0,120));
  }
  return h.length?h.join('. '):'Sin hallazgos patológicos';
}

function getExamenAuscState(){
  return JSON.parse(JSON.stringify(_examenAusc));
}

function setAuscMode(app,mode){
  _examenAusc[app].mode=mode;
  if(mode==='normal'){
    if(app==='resp'){
      _examenAusc.resp.mv='';_examenAusc.resp.agregados=[];_examenAusc.resp.contexto=[];_examenAusc.resp.otro='';
      var ot=document.getElementById('ausc-resp-otro');if(ot)ot.value='';
    }else{
      _examenAusc.cv.ruidos='';_examenAusc.cv.ritmo='';_examenAusc.cv.soplos='';
      _examenAusc.cv.foco='';_examenAusc.cv.intensidad='';_examenAusc.cv.contexto=[];_examenAusc.cv.otro='';
      var ot2=document.getElementById('ausc-cv-otro');if(ot2)ot2.value='';
    }
  }
  syncAuscChipUI();
  actualizarExamenFisico();
}

function toggleAuscChip(btn,app,group,val,single){
  var st=_examenAusc[app];
  if(single){
    var cur=st[group];
    st[group]=(cur===val)?'':val;
  }else{
    var arr=st[group];
    if(!Array.isArray(arr))arr=st[group]=[];
    var idx=arr.indexOf(val);
    if(idx>=0)arr.splice(idx,1);
    else arr.push(val);
  }
  syncAuscChipUI();
  actualizarExamenFisico();
}

function syncAuscChipUI(){
  ['resp','cv'].forEach(function(app){
    var st=_examenAusc[app];
    var nBtn=document.getElementById('ausc-'+app+'-normal');
    var aBtn=document.getElementById('ausc-'+app+'-alterado');
    var detail=document.getElementById('ausc-'+app+'-detail');
    var otro=document.getElementById('ausc-'+app+'-otro');
    var isNorm=st.mode==='normal';
    _auscStyleBtn(nBtn,isNorm);
    _auscStyleBtn(aBtn,!isNorm);
    if(detail)detail.style.display=isNorm?'none':'block';
    if(otro)otro.style.display=isNorm?'none':'block';
  });
  document.querySelectorAll('.ausc-chip').forEach(function(btn){
    var app=btn.getAttribute('data-app');
    var group=btn.getAttribute('data-group');
    var val=btn.getAttribute('data-val');
    var single=btn.getAttribute('data-single')==='1';
    if(!app||!group||!val)return;
    var st=_examenAusc[app];
    var on=single?(st[group]===val):(Array.isArray(st[group])&&st[group].indexOf(val)>=0);
    _auscStyleBtn(btn,on);
  });
}

function resetExamenAusc(){
  _examenAusc={
    resp:{mode:'normal',mv:'',agregados:[],contexto:[],otro:''},
    cv:{mode:'normal',ruidos:'',ritmo:'',soplos:'',foco:'',intensidad:'',contexto:[],otro:''}
  };
  var rO=document.getElementById('ausc-resp-otro');if(rO)rO.value='';
  var cO=document.getElementById('ausc-cv-otro');if(cO)cO.value='';
  syncAuscChipUI();
}

function restaurarExamenAusc(state){
  if(!state||typeof state!=='object'){resetExamenAusc();return;}
  _examenAusc={
    resp:{
      mode:state.resp&&state.resp.mode==='alterado'?'alterado':'normal',
      mv:(state.resp&&state.resp.mv)||'',
      agregados:state.resp&&Array.isArray(state.resp.agregados)?state.resp.agregados.slice():[],
      contexto:state.resp&&Array.isArray(state.resp.contexto)?state.resp.contexto.slice():[],
      otro:(state.resp&&state.resp.otro)||''
    },
    cv:{
      mode:state.cv&&state.cv.mode==='alterado'?'alterado':'normal',
      ruidos:(state.cv&&state.cv.ruidos)||'',
      ritmo:(state.cv&&state.cv.ritmo)||'',
      soplos:(state.cv&&state.cv.soplos)||'',
      foco:(state.cv&&state.cv.foco)||'',
      intensidad:(state.cv&&state.cv.intensidad)||'',
      contexto:state.cv&&Array.isArray(state.cv.contexto)?state.cv.contexto.slice():[],
      otro:(state.cv&&state.cv.otro)||''
    }
  };
  var rO=document.getElementById('ausc-resp-otro');if(rO)rO.value=_examenAusc.resp.otro;
  var cO=document.getElementById('ausc-cv-otro');if(cO)cO.value=_examenAusc.cv.otro;
  syncAuscChipUI();
}

function actualizarExamenFisico(){
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
}

function _auscMakeChip(label,app,group,val,single){
  var b=document.createElement('button');
  b.type='button';
  b.className='chip ausc-chip';
  b.textContent=label;
  b.setAttribute('data-app',app);
  b.setAttribute('data-group',group);
  b.setAttribute('data-val',val);
  b.setAttribute('data-single',single?'1':'0');
  b.style.cssText='border-radius:20px;padding:5px 10px;font-size:12px;cursor:pointer;background:var(--bg3);border:1px solid var(--border)';
  b.onclick=function(){toggleAuscChip(b,app,group,val,single);};
  return b;
}

function _auscFillRow(id,app,group,single,items){
  var row=document.getElementById(id);
  if(!row)return;
  row.innerHTML='';
  items.forEach(function(it){
    row.appendChild(_auscMakeChip(it[0],app,group,it[1],single));
  });
}

function initExamenAuscUI(){
  if(!document.getElementById('ausc-resp-normal'))return;
  var bound=document.getElementById('ausc-resp-normal').getAttribute('data-bound')==='1';
  var chipsReady=!!document.querySelector('#ausc-cv-ruidos .ausc-chip');
  if(bound&&chipsReady){syncAuscChipUI();return;}

  document.getElementById('ausc-resp-normal').onclick=function(){setAuscMode('resp','normal');};
  document.getElementById('ausc-resp-alterado').onclick=function(){setAuscMode('resp','alterado');};
  document.getElementById('ausc-cv-normal').onclick=function(){setAuscMode('cv','normal');};
  document.getElementById('ausc-cv-alterado').onclick=function(){setAuscMode('cv','alterado');};

  _auscFillRow('ausc-resp-mv','resp','mv',true,[
    ['Conservado','conservado'],['↓ bil','mv_bil'],['↓ base der','mv_base_der'],
    ['↓ base izq','mv_base_izq'],['Abolido','abolido']
  ]);
  _auscFillRow('ausc-resp-agreg','resp','agregados',false,[
    ['Sibilancias','sibilancias'],['Rales','rales'],['Roncus','roncus'],['Estridor','estridor']
  ]);
  _auscFillRow('ausc-resp-ctx','resp','contexto',false,[
    ['Broncoespasmo','broncoespasmo'],['Neumonía','neumonia'],['EAP','eap'],
    ['EPOC','epoc'],['Derrame','derrame'],['Atelectasia','atelectasia']
  ]);
  _auscFillRow('ausc-cv-ruidos','cv','ruidos',true,[
    ['Normofonéticos','normofoneticos'],['Hipofonéticos','hipofoneticos'],
    ['R3','r3'],['R4','r4'],['Frote','frote']
  ]);
  _auscFillRow('ausc-cv-ritmo','cv','ritmo',true,[
    ['Rítmico','ritmico'],['FA','fa'],['Bradicardia','bradicardia'],
    ['Taquicardia','taquicardia'],['Extrasístoles','extrasistoles']
  ]);
  _auscFillRow('ausc-cv-soplos','cv','soplos',true,[
    ['Sin soplos','sin_soplos'],['Sist. eyectivo','sist_eject'],['Sist. regurgitante','sist_regurg'],
    ['Diastólico','diastolico'],['Funcional','funcional']
  ]);
  _auscFillRow('ausc-cv-foco','cv','foco',true,[
    ['Aórtico','aortico'],['Mitral','mitral'],['Pulmonar','pulmonar'],['Tricuspídeo','tricuspid']
  ]);
  _auscFillRow('ausc-cv-int','cv','intensidad',true,[
    ['I/VI','i'],['II/VI','ii'],['III/VI','iii'],['IV/VI','iv'],['V/VI','v'],['VI/VI','vi']
  ]);
  _auscFillRow('ausc-cv-ctx','cv','contexto',false,[
    ['EA','ea'],['IM','im'],['ICC','icc'],['Marcapasos','marcapasos'],['Prótesis','protesis']
  ]);

  var rO=document.getElementById('ausc-resp-otro');
  if(rO)rO.oninput=function(){_examenAusc.resp.otro=rO.value;actualizarExamenFisico();};
  var cO=document.getElementById('ausc-cv-otro');
  if(cO)cO.oninput=function(){_examenAusc.cv.otro=cO.value;actualizarExamenFisico();};

  document.getElementById('ausc-resp-normal').setAttribute('data-bound','1');
  syncAuscChipUI();
}
