/**
 * Alertas de seguridad preanestésica (anticoag/antiagregante + alergias).
 * Helper único: formulario paciente + AnesFact (Home / ficha).
 * No instruye suspender medicación — solo aviso y derivación.
 */
var AF_ALERTA_SEGURIDAD_TEXTO_PACIENTE =
  '⚠️ Esta información es importante para su anestesia. Coméntesela cuanto antes a su médico o anestesiólogo. No suspenda ni cambie ninguna medicación por su cuenta.';

var AF_ALERTA_SEGURIDAD_TEXTO_ANEST =
  '⚠️ Revisar medicación/alergias — el paciente declaró medicación que fluidifica la sangre y/o alergias. Confirmar antes de la anestesia.';

var AF_ALERTA_ANTICOAG_KEYS = [
  'acido acetilsalicilico', 'aspirineta', 'aspirina', 'bayaspirina', 'cafiaspirina', 'aas',
  'aspirina prevent', 'prevent',
  'clopidogrel', 'plavix',
  'rivaroxaban', 'xarelto', 'remexal',
  'apixaban', 'eliquis',
  'warfarina', 'coumadin',
  'acenocumarol', 'sintrom',
  'dabigatran', 'pradaxa',
  'enoxaparina', 'clexane',
  'antiagregante', 'anticoagulante', 'fluidifica'
];

function afFoldAlerta(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function afEsNingunAnticoag(text) {
  var q = afFoldAlerta(text);
  if (!q) return true;
  return q.indexOf('no tomo') >= 0 || q === 'ninguno' || q === 'ninguna' || q === 'no';
}

function afEsTextoAnticoagRiesgo(text) {
  var q = afFoldAlerta(text);
  if (!q || afEsNingunAnticoag(q)) return false;
  for (var i = 0; i < AF_ALERTA_ANTICOAG_KEYS.length; i++) {
    if (q.indexOf(AF_ALERTA_ANTICOAG_KEYS[i]) >= 0) return true;
  }
  if (typeof MED_HABITUAL !== 'undefined' && typeof medHabitualMatch === 'function') {
    for (var j = 0; j < MED_HABITUAL.length; j++) {
      var d = MED_HABITUAL[j];
      if (d.cat === 'Fluidifica sangre' && medHabitualMatch(d, text)) return true;
    }
  }
  return false;
}

/**
 * @param {object} snap
 *   anticoagFarmaco?: string
 *   alergiasItems?: string[]
 *   alergiasTexto?: string
 *   medicacion?: Array<{nombre?:string,nombre_comercial?:string,cat?:string}>
 *   antecedentes?: object (payload valoracion)
 *   extras?: object
 */
function afDetectarAlertasSeguridad(snap) {
  snap = snap || {};
  var motivos = [];
  var detalle = { anticoag: [], alergias: [], meds_riesgo: [] };

  var anticoag =
    snap.anticoagFarmaco != null
      ? snap.anticoagFarmaco
      : (snap.antecedentes && snap.antecedentes.anticoag && snap.antecedentes.anticoag.farmaco) || '';

  if (afEsTextoAnticoagRiesgo(anticoag)) {
    motivos.push('anticoag');
    detalle.anticoag.push(String(anticoag).trim());
  }

  var alItems = snap.alergiasItems;
  if (!alItems && snap.antecedentes) {
    alItems = snap.antecedentes.alergias_items || null;
  }
  var alTexto = snap.alergiasTexto;
  if (alTexto == null && snap.antecedentes) {
    alTexto = snap.antecedentes.alergias || '';
  }
  var hasAlergia = false;
  if (Array.isArray(alItems) && alItems.length) {
    for (var a = 0; a < alItems.length; a++) {
      var it = String(alItems[a] || '').trim();
      if (!it) continue;
      var fold = afFoldAlerta(it);
      if (fold === 'ninguna' || fold.indexOf('ninguna') === 0) continue;
      hasAlergia = true;
      detalle.alergias.push(it);
    }
  } else if (alTexto) {
    var foldT = afFoldAlerta(alTexto);
    if (foldT && foldT !== 'ninguna' && foldT.indexOf('ninguna') !== 0) {
      hasAlergia = true;
      detalle.alergias.push(String(alTexto).trim());
    }
  }
  if (hasAlergia) motivos.push('alergia');

  var meds = snap.medicacion;
  if (!meds && snap.foja && snap.foja.valoracion) meds = snap.foja.valoracion.medicacion;
  if (Array.isArray(meds)) {
    for (var m = 0; m < meds.length; m++) {
      var med = meds[m] || {};
      var blob = [med.nombre, med.nombre_comercial, med.cat].filter(Boolean).join(' ');
      if (!blob) continue;
      var riesgo = false;
      if (med.cat === 'Fluidifica sangre') riesgo = true;
      else if (afEsTextoAnticoagRiesgo(blob)) riesgo = true;
      else if (typeof MED_HABITUAL !== 'undefined' && typeof medHabitualMatch === 'function') {
        for (var k = 0; k < MED_HABITUAL.length; k++) {
          if (MED_HABITUAL[k].cat === 'Fluidifica sangre' && medHabitualMatch(MED_HABITUAL[k], blob)) {
            riesgo = true;
            break;
          }
        }
      }
      if (riesgo) {
        detalle.meds_riesgo.push(med.nombre || blob);
        if (motivos.indexOf('antiagregante') < 0) motivos.push('antiagregante');
      }
    }
  }

  // dedupe motivos
  var seen = {};
  motivos = motivos.filter(function (m) {
    if (seen[m]) return false;
    seen[m] = true;
    return true;
  });

  return {
    alerta: motivos.length > 0,
    motivos: motivos,
    detalle: detalle,
    texto_paciente: AF_ALERTA_SEGURIDAD_TEXTO_PACIENTE,
    texto_anest: AF_ALERTA_SEGURIDAD_TEXTO_ANEST
  };
}
