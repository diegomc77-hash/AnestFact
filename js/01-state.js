// STATE
var S={intervs:[],cur:null,hist:['home'],listMode:'fojas',recog:null,recField:null,pendFiles:[],key:'',signData:null,vitals:[]};

function afUserSuffix(){
  try{
    var raw=localStorage.getItem('af_auth_session');
    if(!raw)return '';
    var s=JSON.parse(raw);
    return(s.user&&s.user.id)?('_'+s.user.id):'';
  }catch(e){return '';}
}
function afIntervsKey(){
  return 'af_i'+afUserSuffix();
}
function loadIntervsFromStorage(){
  try{S.intervs=JSON.parse(localStorage.getItem(afIntervsKey())||'[]');}catch(e){S.intervs=[];}
  // Migración legacy af_i → af_i_<uid>: solo con confirmación (evitar heredar pacientes de otro en PC compartida)
  if(!S.intervs.length&&afUserSuffix()){
    try{
      var leg=JSON.parse(localStorage.getItem('af_i')||'[]');
      if(leg.length){
        var ok=false;
        try{
          ok=confirm('Hay '+leg.length+' foja(s) guardadas de una versión anterior en este dispositivo.\n¿Importarlas a TU cuenta?\n(Cancelá si no son tuyas — secreto médico / aislamiento entre usuarios)');
        }catch(e3){ok=false;}
        if(ok){S.intervs=leg;saveIntervsToStorage();}
      }
    }catch(e2){}
  }
  // Estado legado "enviado" → destino (Mayo/Aero); saltea Gracias Juan / DNI inválido
  try{
    if(typeof afMigrateEnviadoLegado==='function')afMigrateEnviadoLegado();
  }catch(eMig){}
  try{
    if(typeof afPurgeCirujanosBasuraLocal==='function')afPurgeCirujanosBasuraLocal();
  }catch(ePur){}
}
function saveIntervsToStorage(){
  localStorage.setItem(afIntervsKey(),JSON.stringify(S.intervs||[]));
}

S.key=localStorage.getItem('af_k')||'';

var cirujanos=[];
try{cirujanos=JSON.parse(localStorage.getItem('af_ciru')||'[]');}catch(e){}

function afHomeTitle(){
  return (typeof AF_CACHE_V==='string'&&AF_CACHE_V) ? ('AnesFact v'+AF_CACHE_V) : 'AnesFact';
}
var TITLES={home:afHomeTitle(),preop:'Preoperatorio',sanatorios:'Sanatorios',evweb:'evweb',legales:'Legales',herramientas:'Herramientas',nueva:'Nueva intervención',facturacion:'Facturación evweb',escanear:'Escanear',config:'Configuración',foja:'Foja anestésica',nom:'Prácticas ADAARC',resumen:'Resumen evweb',geclisa:'GECLISA',ayuda:'Mesa de ayuda',admin:'Panel admin'};

