/**
 * Subconjunto CIE-10 quirúrgico (Paso 2.3). Buscador local + «otro a mano».
 * No es el catálogo completo — ampliar por especialidad cuando haga falta.
 */
(function (g) {
  'use strict';
  /** @type {{c:string,d:string}[]} */
  var AF_CIE_QX = [
    { c: 'C73', d: 'Tumor maligno de la glándula tiroides' },
    { c: 'D34', d: 'Tumor benigno de la glándula tiroides' },
    { c: 'E04.1', d: 'Bocio uninodular no tóxico' },
    { c: 'E04.2', d: 'Bocio multinodular no tóxico' },
    { c: 'E05.0', d: 'Tirotoxicosis con bocio difuso' },
    { c: 'E21.0', d: 'Hiperparatiroidismo primario' },
    { c: 'C32.9', d: 'Tumor maligno de la laringe, no especificado' },
    { c: 'C01', d: 'Tumor maligno de la base de la lengua' },
    { c: 'C02.9', d: 'Tumor maligno de la lengua, parte no especificada' },
    { c: 'C07', d: 'Tumor maligno de la glándula parótida' },
    { c: 'C08.0', d: 'Tumor maligno de la glándula submaxilar' },
    { c: 'C09.9', d: 'Tumor maligno de la amígdala, parte no especificada' },
    { c: 'C10.9', d: 'Tumor maligno de la orofaringe, parte no especificada' },
    { c: 'C11.9', d: 'Tumor maligno de la nasofaringe, parte no especificada' },
    { c: 'C14.0', d: 'Tumor maligno de la faringe, parte no especificada' },
    { c: 'C30.0', d: 'Tumor maligno de la fosa nasal' },
    { c: 'C31.0', d: 'Tumor maligno del seno maxilar' },
    { c: 'C44.3', d: 'Tumor maligno de la piel de otras partes y de las no especificadas de la cara' },
    { c: 'C77.0', d: 'Tumor maligno secundario y no especificado de los ganglios linfáticos de la cabeza, cara y cuello' },
    { c: 'J32.9', d: 'Sinusitis crónica, no especificada' },
    { c: 'J34.2', d: 'Desviación del tabique nasal' },
    { c: 'J35.1', d: 'Hipertrofia de las amígdalas' },
    { c: 'J35.2', d: 'Hipertrofia de las adenoides' },
    { c: 'J35.3', d: 'Hipertrofia de las amígdalas con hipertrofia de las adenoides' },
    { c: 'K35.8', d: 'Apendicitis aguda, otras y las no especificadas' },
    { c: 'K40.9', d: 'Hernia inguinal, unilateral o no especificada, sin obstrucción ni gangrena' },
    { c: 'K42.9', d: 'Hernia umbilical sin obstrucción ni gangrena' },
    { c: 'K43.9', d: 'Hernia ventral sin obstrucción ni gangrena' },
    { c: 'K80.2', d: 'Cálculo de la vesícula biliar sin colecistitis' },
    { c: 'K80.1', d: 'Cálculo de la vesícula biliar con otra colecistitis' },
    { c: 'K81.0', d: 'Colecistitis aguda' },
    { c: 'K40.3', d: 'Hernia inguinal, bilateral, con obstrucción, sin gangrena' },
    { c: 'K56.6', d: 'Otras obstrucciones intestinales y las no especificadas' },
    { c: 'K57.3', d: 'Enfermedad diverticular del intestino grueso sin perforación ni absceso' },
    { c: 'K60.3', d: 'Fístula anal' },
    { c: 'K61.0', d: 'Absceso anal' },
    { c: 'K64.9', d: 'Hemorroides, no especificadas' },
    { c: 'C18.9', d: 'Tumor maligno del colon, parte no especificada' },
    { c: 'C20', d: 'Tumor maligno del recto' },
    { c: 'C16.9', d: 'Tumor maligno del estómago, parte no especificada' },
    { c: 'C25.9', d: 'Tumor maligno del páncreas, parte no especificada' },
    { c: 'C22.0', d: 'Carcinoma de células hepáticas' },
    { c: 'N20.0', d: 'Cálculo del riñón' },
    { c: 'N20.1', d: 'Cálculo del uréter' },
    { c: 'N40', d: 'Hiperplasia de la próstata' },
    { c: 'C61', d: 'Tumor maligno de la próstata' },
    { c: 'C67.9', d: 'Tumor maligno de la vejiga urinaria, parte no especificada' },
    { c: 'N39.3', d: 'Incontinencia urinaria por tensión' },
    { c: 'N43.3', d: 'Hidrocele, no especificado' },
    { c: 'N47', d: 'Prepucio redundante, fimosis y parafimosis' },
    { c: 'D25.9', d: 'Leiomioma del útero, no especificado' },
    { c: 'N80.9', d: 'Endometriosis, no especificada' },
    { c: 'N81.4', d: 'Prolapso uterovaginal, no especificado' },
    { c: 'N83.2', d: 'Otros quistes ováricos y los no especificados' },
    { c: 'C56', d: 'Tumor maligno del ovario' },
    { c: 'C53.9', d: 'Tumor maligno del cuello del útero, sin otra especificación' },
    { c: 'O82.1', d: 'Parto por cesárea de emergencia' },
    { c: 'O82.0', d: 'Parto por cesárea electiva' },
    { c: 'M16.9', d: 'Coxartrosis, no especificada' },
    { c: 'M17.9', d: 'Gonartrosis, no especificada' },
    { c: 'S72.9', d: 'Fractura del fémur, parte no especificada' },
    { c: 'S82.9', d: 'Fractura de la pierna, parte no especificada' },
    { c: 'S52.5', d: 'Fractura de la epífisis inferior del radio' },
    { c: 'M23.2', d: 'Trastorno de menisco debido a desgarro o lesión antigua' },
    { c: 'M75.1', d: 'Síndrome de manguito rotatorio' },
    { c: 'G56.0', d: 'Síndrome del túnel carpiano' },
    { c: 'I70.2', d: 'Aterosclerosis de las arterias de los miembros' },
    { c: 'I83.9', d: 'Venas varicosas de los miembros inferiores sin úlcera ni inflamación' },
    { c: 'I65.2', d: 'Oclusión y estenosis de la arteria carótida' },
    { c: 'I71.4', d: 'Aneurisma de la aorta abdominal, sin mención de ruptura' },
    { c: 'I25.1', d: 'Enfermedad aterosclerótica del corazón' },
    { c: 'I35.0', d: 'Estenosis (de la válvula) aórtica' },
    { c: 'Q21.1', d: 'Comunicación auricular' },
    { c: 'J93.9', d: 'Neumotórax, no especificado' },
    { c: 'J90', d: 'Derrame pleural, no clasificado en otra parte' },
    { c: 'C34.9', d: 'Tumor maligno de los bronquios o del pulmón, parte no especificada' },
    { c: 'G40.9', d: 'Epilepsia, tipo no especificado' },
    { c: 'G91.9', d: 'Hidrocefalo, no especificado' },
    { c: 'M51.1', d: 'Trastornos de disco lumbar y de otros discos intervertebrales con radiculopatía' },
    { c: 'C71.9', d: 'Tumor maligno del encéfalo, parte no especificada' },
    { c: 'H25.9', d: 'Catarata senil, no especificada' },
    { c: 'H40.9', d: 'Glaucoma, no especificado' },
    { c: 'H33.0', d: 'Desprendimiento de la retina con defecto retiniano' },
    { c: 'K21.0', d: 'Enfermedad del reflujo gastroesofágico con esofagitis' },
    { c: 'K25.9', d: 'Úlcera gástrica, no especificada como aguda ni crónica, sin hemorragia ni perforación' },
    { c: 'K26.9', d: 'Úlcera duodenal, no especificada como aguda ni crónica, sin hemorragia ni perforación' },
    { c: 'K29.7', d: 'Gastritis, no especificada' },
    { c: 'K92.2', d: 'Hemorragia gastrointestinal, no especificada' },
    { c: 'L98.9', d: 'Trastorno de la piel y del tejido subcutáneo, no especificado' },
    { c: 'D17.9', d: 'Tumor benigno lipomatoso, de sitio no especificado' },
    { c: 'L72.1', d: 'Quiste pilonidal' },
    { c: 'T14.1', d: 'Herida abierta de región no especificada del cuerpo' },
    { c: 'Z40.0', d: 'Cirugía profiláctica por factores de riesgo relacionados con tumores malignos' },
    { c: 'Z98.8', d: 'Otros estados postquirúrgicos especificados' },
  ];

  function afCieQxSearch(q, limit) {
    var lim = limit || 20;
    var s = String(q || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    if (!s) return AF_CIE_QX.slice(0, lim);
    var out = [];
    for (var i = 0; i < AF_CIE_QX.length && out.length < lim; i++) {
      var row = AF_CIE_QX[i];
      var hay =
        row.c.toLowerCase().indexOf(s) >= 0 ||
        String(row.d)
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .indexOf(s) >= 0;
      if (hay) out.push(row);
    }
    return out;
  }

  function afCieQxLabel(code) {
    var c = String(code || '').trim().toUpperCase();
    if (!c) return '';
    for (var i = 0; i < AF_CIE_QX.length; i++) {
      if (AF_CIE_QX[i].c.toUpperCase() === c) return AF_CIE_QX[i].c + ' — ' + AF_CIE_QX[i].d;
    }
    return c;
  }

  g.AF_CIE_QX = AF_CIE_QX;
  g.afCieQxSearch = afCieQxSearch;
  g.afCieQxLabel = afCieQxLabel;
})(typeof window !== 'undefined' ? window : globalThis);
