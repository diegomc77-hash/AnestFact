/**
 * AnesFact — EVWEB scan Tanda 1/3
 * Obras: 228=FEDERACION PATRONAL ART | 119=OMINT ART- Serena ART | 258=EXPERTA ART | 433=ANDINA ART S.A.
 * Pegar TAL CUAL en F12 de adaarc.evweb.com.ar (sesión Sole, misma pestaña).
 * Auto-run: ~4 obras × 784 términos ≈ 30–35 min. No abrir otra tanda en paralelo.
 * Al terminar descarga CSV automáticamente.
 */
(async function () {
  'use strict';
  var TANDA = 1;
  var OBRAS = [{"id":"228","nombre":"FEDERACION PATRONAL ART"},{"id":"119","nombre":"OMINT ART- Serena ART"},{"id":"258","nombre":"EXPERTA ART"},{"id":"433","nombre":"ANDINA ART S.A."}];
  var TERMS = ["abdomen","abdominoplastia","ablacion","ablacion radiofrecuencia","abocamiento","aborto","absceso","acortamiento","acromioplastia","acupuntura","adenomastectomia","adhesiolisis","adrenalectomia","alcoholizacion","alcoholizacion fenolizacion","amigdalectomia","amigdalectomia adenoidectomia","amigdalectomia septumplastia","amniocentesis","amputacion","amputacion dedos","amputacion inter","analgesia","analgesia regional","anastomosis","anestesia","anestesia sedacion","anestesiologo","aneurisma","aneurismas","angiodisplasia","angiografia","angiografia medular","angiografia vasos","angioplastia","anquilosis","antrotomia","anuloplastia","aortografia","apendicectomia","apendicectomia videolaparoscopia","aplicacion","aponeurotomia","area","areas","arreglos","arreglos dentales","arteriografia","artrocentesis","artrodesis","artrodesis dedos","artrodesis tibio","artrolisis","artroplastia","artroplastia cadera","artrotomia","aspiracion","atresia","atresia esofago","auriculotomia","barbotaje","bermellectomia","biopsia","biopsia ganglios","biopsia higado","biopsia quirurgica","biopsia renal","blefaroplastia","bloqueo","bloqueo diagnostico","bloqueo nervio","bocio","braquiterapia","braquiterapia ginecologica","broncorrafia","broncoscopia","broncoscopia broncoscopio","bursitis","bursitis miembro","cadera","calcificaciones","cambio","canalizacion","cantotomia","capsulectomia","capsuloplastia","capsulotomia","cardiomioplastia","cardiorrafia","cardioversion","caruncula","cateterismo","cauterizacion","cavernostomia","cavo","cavografia","cecostomia","centellograma","cerclaje","cerebro","cesarea","chalazion","cicatriz","cierre","cierre defectos","cierre fistula","cierre gastrostomia","cierre hartmann","circuncision","cirugia","cirugia antireflujo","cirugia artroscopica","cirugia obesidad","cirugia videoartroscopica","cirugias","cirugias cardiopatias","cistectomia","cistectomia parcial","cistoplastia","cistorrafia","cistostomia","coagulacion","coartacion","cobalto","colecistectomia","colecistectomia videolaparoscopia","colecistostomia","colectomia","colectomia hemicolectomia","colectomia total","colectomia transversa","coledoco","coledocotomia","colesteatoma","colgajo","colgajos","coloboma","colocacion","colocacion cateter","colocacion extraccion","colocacion percutanea","colocacion protesis","colocacion stent","colocacion tutor","colocacion yeso","colonoscopia","colonovideoscopia","colpoperineorrafia","colpopexia","colpotomia","comisuroplastia","condilomas","condilomas acuminados","conduccion","conizacion","conjuntivoplastia","conversion","cordocentesis","cordotomia","correccion","correccion diastasis","correccion fistula","correccion incontinencia","correccion quirurgica","correccion reflujo","correccion tunel","corticoides","corticoterapia","corticoterapia peridural","craneo","craneoestenosis","craneoplastia","craneotomia","cricotomia","crioneurolisis","criptorquidea","criptorquidea orquidopexia","cuadrantectomia","cuadrantectomia tumorectomia","cuerpo","cuerpo extrano","curacion","curetaje","dacrio","decorticacion","decorticacion pleuropulmonar","dedo","dedos","denervacion","derivacion","derivacion aorto","derivacion paliativa","dermoabrasion","dermolipectomia","desarticulacion","descompresion","desgarro","desgarro muscular","desgarro vagina","determinacion","devolvulacion","devolvulacion desinvaginacion","diagnostico","diastasis","diatermia","dilatacion","dilatacion anal","dilatacion endoscopica","dilatacion esofago","dilatacion uretral","dinamica","discografia","discograma","diseccion","displasia","diverticulo","diverticulo esofago","diverticulo meckel","drenaje","drenaje absceso","drenaje percutaneo","duodeno","duodenopancreatectomia","ecocardiografia","ecocardiograma","ecocardiograma transesofagico","ecografia","ectropion","electro","electrocoagulacion","emasculacion","embarazo","embarazo ectopico","embolectomia","embolizacion","encefalo","endometriosis","endoprotesis","endoscopia","enfermedad","enterolisis","enterorrafia","enteroscopia","enterostomia","enucleacion","epicanto","epididimectomia","epididimotomia","epidurograma","epiduroplastia","epiduroscopia","epifisiolisis","episiorrafia","escapula","escara","escision","escision lesion","esclerotomia","escrotoplastia","esfenoidectomia","esfinteroplastia","esfinterotomia","esofago","esofago gastrectomia","esofagostomia","esofaguectomia","esofaguectomia laparoscopica","esofaguectomia total","espina","esplenectomia","espleno","esplenopancreatectomia","esqueletizacion","esquiascopias","estafiloma","estafilorrafia","estapedectomia","estenosis","estenosis traqueal","estimulacion","estomatoplastia","estrabismo","estudio","etmoidectomia","evacuacion","eventracion","evisceracion","examen","excentracion","exeresis","exoftalmia","expansor","exploracion","exploracion vias","extirpacion","extirpacion aponeurosis","extirpacion calculos","extirpacion nevus","extirpacion quiste","extirpacion tumor","extraccion","extraccion calculo","extraccion cateter","extraccion cuerpo","extraccion dentaria","extraccion material","extraccion placas","extraccion protesis","extracciones","facoexeresis","facofragmentacion","faringectomia","faringoplastia","fenestracion","feocromocitoma","fijacion","fimosis","fistula","fistula vesico","fistulografia","fisura","flap","flap unilateral","flebectomia","flebografia","flemon","fondo","formacion","fotocoagulacion","fractura","frenulotomia","fulguracion","gastrectomia","gastrectomia total","gastroenteroanastomosis","gastroquisis","gastrorrafia","gastrostomia","gastrostomia endoscopica","ginecomastia","ginecomastia unilateral","gingivectomia","glosectomia","glosoplastia","glosotomia","gonioscopia","gran","grandes","granuloma","granuloma traquea","hallux","hematoma","hemi","hemicolectomia","hemicolectomia videolaparoscopia","hemihepatectomia","hemitiroidectomia","hemorragia","hemorroidectomia","hepatectomia","herida","heridas","hernia","hernia diafragmatica","hernia disco","hernia estrangulada","hernia hiatal","hernia inguinal","hidrocele","himenectomia","hipema","hiperhidrosis","hiperhidrosis selectiva","hipertelorismo","hipertrofia","hipertrofia piloro","hipofisectomia","hipospadia","hipospadia epispadia","hipotermia","histerectomia","histerectomia anexectomia","histeroscopia","histeroscopia video","huevo","ileostomia","imperforado","imperforado recto","implantacion","implante","implantes","incision","incision drenaje","inclusion","infiltracion","infiltracion articulacion","inflado","injerto","injerto colgajo","insuficiencia","interconsulta","intervenciones","intubacion","inyeccion","laberintectomia","labio","labio leporino","laminectomia","laminectomia descompresiva","laparotomia","laparotomia exploradora","laringectomia","laringo","laringoplastia","laringotomia","laser","lavado","lavado bronquial","lavado cavidad","legrado","legrado uterino","lesion","lesiones","levantamiento","lifting","ligadura","ligadura bilateral","ligamentopexia","limpieza","limpieza quirurgica","linfadenectomia","linfadenectomia retroperitoneal","lipoaspiracion","lipoma","liposuccion","litotricia","litotricia endoluminal","litotricia extracorporea","litotricia ureteral","lobectomia","lobulo","luxacion","malformaciones","malformaciones congenitas","mama","marsupializacion","mastectomia","mastectomia bilateral","mastoidectomia","mastomegalia","mastopexia","mastotomia","maxilar","maxilectomia","maxilectomia radical","maxilectomia simple","meatotomia","mediastinitis","mediastinitis toilette","mediastinoscopia","medicacion","megacolon","megaesofago","meningocele","meniscectomia","metastasis","metatarsalgia","microcirugia","microcirugia tubaria","microsomia","microtia","mielografia","mielomeningocele","miomectomia","miringoplastia","miringotomia","morfina","movilizacion","movilizaciones","mucosectomia","nariz","nefrectomia","nefrectomia parcial","nefrectomia total","nefro","nefrolitotomia","nefropexia","nefrostomia","neumoencefalografia","neumonectomia","neumonectomia video","neuroablacion","neurolisis","neurolisis ganglio","neurolisis modulacion","neurolisis nervio","neurolisis nervios","neurolisis plexo","neurolisis quimica","neurolisis simpatico","neuromodulacion","neuromodulacion pulsada","neurorrafia","neurorrafia injerto","neurotomia","nodulectomia","nucleoplastia","obtencion","oclusion","omentectomia","onfalitis","ooforectomia","ooforo","operacion","operacion comando","operacion dixon","operacion hueco","operacion wertheim","operaciones","orbitotomia","oreja","orquidectomia","orquidopexia","orzuelo","osteoclasia","osteoplastia","osteosintesis","osteosintesis cubito","osteosintesis fractura","osteosintesis hombro","osteosintesis malar","osteosintesis reduccion","osteosintesis tarso","osteotomia","osteotomia correctora","osteotomia craneo","otoplastia","paciente","palatoplastia","palatorrafia","panadizo","panarteriografia","pancreatectomia","papilotomia","papilotomia endoscopica","paratiroidectomia","paratiroidectomia total","parche","parotidectomia","pass","patelectomia","pectus","pectus excavatum","perforaciones","perforaciones esofago","pericardiectomia","pericardiocentesis","pericardiotomia","peridural","perineorrafia","peritonectomia","peritoneocentesis","peritonitis","pielografia","pielolitotomia","pieloplastia","pielotomia","plano","plastica","plastica manguito","plastica pielo","plastica ureteral","plastica uretra","pleurectomia","pleurodesis","pleurodesis quimica","plicatura","polidactilia","polipectomia","polipo","potenciales","procedimiento","proctectomia","proctorrafia","prolapso","prostatectomia","prostatectomia adenectomia","prostatectomia radical","protesis","ptosis","puncion","puncion biopsia","queiloplastia","querato","queratocentesis","quiste","quiste hidatidico","quiste tumor","radioneurocirugia","radioterapia","reanimacion","recambio","recarga","reconstruccion","reconstruccion mamaria","reconstruccion pene","reconstruccion total","reconstruccion vulva","recto","rectoscopia","reduccion","reduccion cruenta","reduccion fractura","reduccion incruenta","reduccion quirurgica","reemplazo","reemplazo esofago","reemplazo total","reemplazo valvular","reimplante","reimplante dedo","reimplante dedos","reimplante miembro","reimplante ureteral","reintervencion","remodelacion","reparacion","reparacion artroscopica","reparacion hernia","reparacion ligamentaria","reparacion plastica","reseccion","reseccion cicatriz","reseccion cuneiforme","reseccion esofago","reseccion exostosis","reseccion parcial","reseccion plexo","reseccion tumor","resecciones","resonancia","retinografia","retinopexia","retiro","retoque","retromentonismo","revision","revision osteosintesis","revision protesis","rino","rinofima","rinoplastia","rinoseptumplastia","rizotomia","safenectomia","safenectomia interna","salpingolisis","salpingolisis salpingoplastia","salpinguectomia","seccion","secuelas","secuestrectomia","segmentectomia","segmentectomia lobectomia","septostomia","septumplastia","shunt","shunt porto","sialografia","sigmoidectomia","simpatectomia","simpatectomia lumbar","simulacion","sindactilia","sindrome","sinequias","sinovectomia","sintesis","sinusotomia","sinusotomias","sinusotomias combinadas","sondaje","spect","suprarrenalectomia","suprarrenalectomia laparoscopica","sutura","sutura herida","sutura simple","taponaje","taponamiento","tarsorrafia","telecanto","tenolisis","tenoplastia","tenorrafia","tenotomia","tens","terapia","termolesion","test","tetralogia","timectomia","timpano","timpanoplastia","tiroidectomia","tiroidectomia total","toilette","toilette quirurgico","toillete","toillete quirurgico","toma","tomografia","toracoplastia","toracotomia","torax","torticolis","torticolis congenita","trabajo","traccion","tractotomia","transferencias","transferencias tendinosas","transposicion","traqueoplastia","traqueorrafia","traqueostomia","traqueostomia percutanea","trasplante","trasplante alargamiento","trasplante corazon","trasplante oseo","tratamiento","tratamiento endovascular","tratamiento quirurgico","tratamiento varices","tridimensional","trombectomia","trombo","trombosis","tumor","tumor benigno","tumor pared","tumor retroperitoneal","tumoracion","tumorectomia","tumores","tumores mediastinales","turbinectomia","ulcera","ureterectomia","ureterolitotomia","ureteroscopia","ureterostomia","uretro","uretrografia","uretrorrafia","uretrotomia","vaciamiento","vaciamiento inguino","vaciamiento radical","vagotomia","valvuloplastia","vaporizacion","varices","varicocele","varicocele hidrocele","vasectomia","vejiga","ventana","ventana pleuro","ventriculo","vertebroplastia","video","video artroscopia","video laparoscopia","videobroncofibroscopia","videolaparoscopia","videolaparoscopia terapeutica","videolaparoscopica","videotoracoscopia","vitrectomia","vulvectomia","yeyunostomia","zambo"];
  var DELAY_MS = 550;
  var ENDPOINT = new URL('/Pages/Asociaciones/WSautocomplete.asmx/GetAvaliableTags3', location.origin).href;

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function esc(v) {
    v = String(v == null ? '' : v);
    if (/[",\n\r]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
    return v;
  }
  function parseHit(s) {
    var head = String(s || '').split('&');
    var left = (head[0] || '').trim();
    var m = left.match(/^(\d+)\s*[-–—]\s*(.+)$/);
    if (!m) return null;
    return {
      codigoEvweb: m[1],
      descripcion: m[2].trim(),
      param1: (head[1] || '').trim(),
      param2: (head[2] || '').trim()
    };
  }

  if (!/adaarc\.evweb\.com\.ar/i.test(location.hostname)) {
    console.error('[AF] Esto hay que pegarlo en adaarc.evweb.com.ar, no en AnesFact.');
    return;
  }
  console.log('%c[AF] Tanda ' + TANDA + '/3 — ' + OBRAS.length + ' obras × ' + TERMS.length + ' términos. Arranca…', 'color:#22c55e;font-weight:bold');
  console.log('[AF] Obras:', OBRAS.map(function (o) { return o.id + ' ' + o.nombre; }));

  var rows = [];
  var seen = {};
  var errors = 0;
  var started = Date.now();

  for (var oi = 0; oi < OBRAS.length; oi++) {
    var obra = OBRAS[oi];
    console.log('[AF] >>> obra ' + (oi + 1) + '/' + OBRAS.length + ' id=' + obra.id + ' ' + obra.nombre);
    for (var ti = 0; ti < TERMS.length; ti++) {
      var term = TERMS[ti];
      try {
        var res = await fetch(ENDPOINT, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ DescripcionConCodigo: term, idObraSocial: String(obra.id) })
        });
        if (!res.ok) {
          errors++;
          if (errors > 25) throw new Error('too_many_http_errors status=' + res.status);
          await sleep(DELAY_MS * 2);
          continue;
        }
        var json = await res.json();
        var list = (json && json.d) || [];
        for (var hi = 0; hi < list.length; hi++) {
          var p = parseHit(list[hi]);
          if (!p) continue;
          var key = obra.id + '|' + p.codigoEvweb;
          if (seen[key]) continue;
          seen[key] = 1;
          rows.push({
            obra: obra.nombre,
            obraId: String(obra.id),
            codigoEvweb: p.codigoEvweb,
            descripcion: p.descripcion,
            param1: p.param1,
            param2: p.param2
          });
        }
      } catch (e) {
        errors++;
        console.warn('[AF] fail', obra.id, term, e && e.message || e);
        if (errors > 30) throw e;
      }
      if (ti % 80 === 0) {
        var mins = ((Date.now() - started) / 60000).toFixed(1);
        console.log('[AF] progress obra=' + obra.id + ' term=' + ti + '/' + TERMS.length + ' rows=' + rows.length + ' err=' + errors + ' t=' + mins + 'm');
      }
      await sleep(DELAY_MS + Math.floor(Math.random() * 150));
    }
  }

  var header = 'obra,obraId,codigoEvweb,descripcion,param1,param2';
  var csv = header + '\n' + rows.map(function (r) {
    return [r.obra, r.obraId, r.codigoEvweb, r.descripcion, r.param1, r.param2].map(esc).join(',');
  }).join('\n');
  var fname = 'evweb_practicas_tanda' + TANDA + '_228-119-258-433_' + Date.now() + '.csv';
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fname;
  a.click();

  window.__AF_SCAN_TANDA = TANDA;
  window.__AF_SCAN_ROWS = rows;
  window.__AF_SCAN_FILE = fname;
  console.log('%c[AF] Tanda ' + TANDA + ' LISTA — rows=' + rows.length + ' errors=' + errors + ' file=' + fname, 'color:#22c55e;font-weight:bold');
  console.log('[AF] Guardá el CSV descargado y avisá a Cursor para merge + regenerar match.js');
  return { tanda: TANDA, rows: rows.length, errors: errors, file: fname };
})().catch(function (e) {
  console.error('[AF] Tanda abortada', e);
});
