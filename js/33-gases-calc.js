// MAC por edad — usado en desplegables de Mantenimiento inhalatorio (sin panel grande)
var GAS_MAC_BASE={sevoflurano:2.1,isoflurano:1.2,desflurano:6.0};

function getEdadPaciente(){
  var e=parseFloat((S.cur&&S.cur.edad)||(document.getElementById('f-edad')?document.getElementById('f-edad').value:0)||0);
  return e>0?e:40;
}

function calcMacAjustado(agente,edad){
  var base=GAS_MAC_BASE[agente]||2.1;
  var mac=base*(1-0.06*((edad-40)/10));
  if(mac<0.1)mac=0.1;
  return parseFloat(mac.toFixed(1));
}

function calcGasesResultado(opts){
  opts=opts||{};
  var edad=getEdadPaciente();
  var agente=opts.agente||'sevoflurano';
  var macAdj=calcMacAjustado(agente,edad);
  var macObj=parseFloat(opts.macObjetivo);
  if(isNaN(macObj)||macObj<=0)macObj=1;
  var concObj=parseFloat((macAdj*macObj).toFixed(1));
  return{edad:edad,agente:agente,macAdj:macAdj,concObj:concObj,macObj:macObj};
}

function hideGasesCalcPanel(){
  var p=document.getElementById('gases-calc-panel');
  if(p){p.style.display='none';p.innerHTML='';}
}
function renderGasesCalcPanel(){hideGasesCalcPanel();}
function syncGasesFromUI(){}
