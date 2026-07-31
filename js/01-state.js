// STATE
var S={intervs:[],cur:null,hist:['home'],recog:null,recField:null,pendFiles:[],key:'',signData:null,vitals:[]};

function afUserSuffix(){
  try{
    var raw=localStorage.getItem('af_auth_session');
    if(!raw)return '';
    var s=JSON.parse(raw);
    return(s.user&&s.user.id)?('_'+s.user.id):'';
  }catch(e){return '';}
}
function afIntervsKey(){return 'af_i'+afUserSuffix();}
function loadIntervsFromStorage(){
  try{S.intervs=JSON.parse(localStorage.getItem(afIntervsKey())||'[]');}catch(e){S.intervs=[];}
  if(!S.intervs.length&&afUserSuffix()){
    try{
      var leg=JSON.parse(localStorage.getItem('af_i')||'[]');
      if(leg.length){S.intervs=leg;saveIntervsToStorage();}
    }catch(e2){}
  }
}
function saveIntervsToStorage(){
  localStorage.setItem(afIntervsKey(),JSON.stringify(S.intervs||[]));
}

S.key=localStorage.getItem('af_k')||'';

var cirujanos=[];
try{cirujanos=JSON.parse(localStorage.getItem('af_ciru')||'[]');}catch(e){}

var TITLES={home:'AnesFact v8',nueva:'Nueva intervención',facturacion:'Facturación evweb',escanear:'Escanear',config:'Configuración',foja:'Foja anestésica',nom:'Prácticas ADAARC',resumen:'Resumen evweb',geclisa:'Guía GECLISA',ayuda:'Mesa de ayuda',admin:'Panel admin'};

