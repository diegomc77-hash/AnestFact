var DRUG_ALIASES={
  'propo':'Propofol','mida':'Midazolam','fenta':'Fentanilo','keta':'Ketamina',
  'rocu':'Rocuronio','succi':'Succinilcolina','sevo':'Sevoflurano','bupi':'Bupivacaína',
  'levo':'Levobupivacaína','ropi':'Ropivacaína','dexa':'Dexametasona',
  'ondansetron':'Ondansetrón','metoclo':'Metoclopramida','neostig':'Neostigmina',
  'sugamma':'Sugammadex','efedrina':'Efedrina','fenilefrina':'Fenilefrina',
  'aeronáutico':'Hospital Aeronáutico','aeronautico':'Hospital Aeronáutico',
  'mayo':'Sanatorio Mayo','iosfa':'IOSFA','pami':'PAMI','apross':'APROSS',
  'osde':'OSDE','ampara':'AMPARA','tensión':'T.A.','tención':'T.A.','presión':'PA'
};
DRUGS.forEach(function(d){DRUG_ALIASES[d.n.toLowerCase()]=d.n;});
function applyDrugDict(t){
  var r=t.toLowerCase();
  Object.keys(DRUG_ALIASES).sort(function(a,b){return b.length-a.length;}).forEach(function(k){
    r=r.replace(new RegExp('\\b'+k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','gi'),DRUG_ALIASES[k]);
  });
  return r.charAt(0).toUpperCase()+r.slice(1);
}
function mic(fieldId,micId){
  var field=document.getElementById(fieldId),micEl=document.getElementById(micId);
  if(!field||!micEl)return;
  if(S.recField===fieldId&&S.recog){S.recog.stop();return;}
  if(S.recog)S.recog.stop();
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){toast('Voz requiere Chrome o Safari');return;}
  S.recog=new SR();S.recog.lang='es-AR';S.recog.continuous=false;S.recog.interimResults=false;
  S.recField=fieldId;micEl.classList.add('rec');micEl.textContent='🔴';
  S.recog.onresult=function(e){
    var txt=applyDrugDict(e.results[0][0].transcript);
    if(field.tagName==='TEXTAREA')field.value+=(field.value?'\n':'')+txt;else field.value=txt;
    if(fieldId==='nom-q')buscarNom(field.value);
    stopMic(micEl);
  };
  S.recog.onerror=function(ev){if(ev.error!=='aborted')toast('Error voz: '+ev.error);stopMic(micEl);};
  S.recog.onend=function(){stopMic(micEl);};
  S.recog.start();
}
function stopMic(el){if(!el)return;el.classList.remove('rec');el.textContent='🎙';S.recog=null;S.recField=null;}

