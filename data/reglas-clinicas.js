/** Reglas clínicas editables — ayuda al criterio, no reemplaza protocolo institucional. */
var REGLAS_CLINICAS={
  contextos:[
    {id:'irc',label:'Insuficiencia renal',detect:/irc|insuficiencia renal|nefropat|creatinin|di[aá]lisis|clearance/i},
    {id:'ic_cardio',label:'Insuficiencia cardíaca / cardiopatía',detect:/\bic\b|insuficiencia card[ií]aca|icc|cardiopat|fevi|soplo|arritmia|coronario|valvul/i},
    {id:'cec',label:'Cirugía con CEC / cardioquirúrgica',detect:/cec|circulaci[oó]n extracorp|bypass|bomba\s*(?:de\s*)?(?:coraz[oó]n|card[ií]aca)|cardio(?:p|q)|valvul|a[oó]rt|coronari|trasplante card/i},
    {id:'anticoag',label:'Anticoagulación / antiagregación',detect:/anticoagul|antiagreg|warfarin|acenocumar|rivarox|apixaban|clopidogrel|aas\b|aspirin|heparin/i}
  ],
  revisar:{
    irc:['Creatinina / clearance estimado','Potasio sérico','Última diálisis (si aplica)','Evitar AINEs y aminoglucósidos','Ajustar opioides de depuración lenta'],
    ic_cardio:['Medicación crónica (IECA/ARA-II, betas, diuréticos)','Última ecocardiografía / FEVI','Acceso venoso periférico y central','Tener vasopresores preparados'],
    cec:['Suspensión antiagregantes según protocolo','Heparina / ACT — protocolo CEC','TEE / monitorización invasiva disponible','Noradrenalina y vasopresina accesibles','Profilaxis ATB según servicio'],
    anticoag:['Tiempo desde última dosis de anticoagulante','INR / anti-Xa si corresponde','Riesgo trombótico vs sangrado','Evitar neuroaxial salvo indicación formal y ventana segura']
  },
  preferir:{
    irc:['Remifentanilo','Cisatracurio','Rocuronio','Noradrenalina (si inestabilidad)'],
    ic_cardio:['Etomidato (inducción hemodinámica)','Opioides titulados','Cisatracurio / Rocuronio','Fenilefrina / Noradrenalina preparadas'],
    cec:['Etomidato o dosis baja de propofol','Opioides + relajante no despolarizante','Noradrenalina','Milrinona (si bajo gasto)','Heparina según protocolo CEC']
  },
  drogas:[
    {match:['ketorolac','diclofenac','meloxicam','dexketoprofeno','ibuprofeno','indometacina','piroxicam','nimesulide'],reglas:[
      {ctx:'irc',nivel:'evitar',msg:'AINE: riesgo de deterioro renal agudo. Preferir paracetamol u opioide.'},
      {ctx:'ic_cardio',nivel:'precaucion',msg:'AINE: puede empeorar retención hídrica e IC. Valorar alternativa.'}
    ]},
    {match:['gentamicina','amikacina','tobramicina','netilmicina'],reglas:[
      {ctx:'irc',nivel:'evitar',msg:'Aminoglucósido: nefrotoxicidad. Preferir cefalosporina / vancomicina según protocolo.'}
    ]},
    {match:['pancuronio'],reglas:[
      {ctx:'ic_cardio',nivel:'evitar',msg:'Pancuronio: taquicardia e hipertensión. Preferir rocuronio o cisatracurio.'},
      {ctx:'cec',nivel:'evitar',msg:'Pancuronio: efectos hemodinámicos adversos en cardio. Preferir rocuronio/cisatracurio.'}
    ]},
    {match:['succinilcolina','suxametonio'],reglas:[
      {ctx:'irc',nivel:'precaucion',msg:'Succinilcolina: hiperkalemia posible en IRC avanzada / diálisis. Valorar rocuronio.'}
    ]},
    {match:['morfina'],reglas:[
      {ctx:'irc',nivel:'precaucion',msg:'Morfina: metabolitos activos acumulables en IRC. Preferir fentanilo/remifentanilo.'}
    ]},
    {match:['propofol'],reglas:[
      {ctx:'ic_cardio',nivel:'precaucion',msg:'Propofol: vasodilatación. Inducción lenta o dosis reducida; considerar etomidato.'},
      {ctx:'cec',nivel:'precaucion',msg:'Propofol: precaución en disfunción ventricular. Titular o considerar etomidato.'}
    ]},
    {match:['dexmedetomidina'],reglas:[
      {ctx:'ic_cardio',nivel:'precaucion',msg:'Dexmedetomidina: bradicardia/hipotensión. Titular con cautela.'}
    ]},
    {match:['bupivacaína','levobupivacaína'],reglas:[
      {ctx:'anticoag',nivel:'precaucion',msg:'Anestesia local: evaluar riesgo LAST y coagulación antes de bloqueo.'}
    ]},
    {match:['rocuronio','cisatracurio','atracurio','remifentanilo','fentanilo','etomidato','noradrenalina','fenilefrina','milrinona'],reglas:[
      {ctx:'irc',nivel:'preferir',msg:'Opción favorable en IRC (depuración independiente de riñón o Hofmann).'},
      {ctx:'ic_cardio',nivel:'preferir',msg:'Opción habitual en paciente cardiovascular comprometido.'},
      {ctx:'cec',nivel:'preferir',msg:'Fármaco frecuentemente usado en cirugía cardiovascular / CEC.'}
    ]}
  ]
};
