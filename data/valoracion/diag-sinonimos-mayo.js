/**
 * Diccionario simple diagnóstico (Mayo) — sin IA.
 * Clave = palabra del paciente (minúsculas, sin tilde). Valor = texto sugerido.
 */
var AF_DIAG_SINONIMOS_MAYO = {
  'vesicula': 'Colecistectomía',
  'vesícula': 'Colecistectomía',
  'cole': 'Colecistectomía',
  'piedras vesicula': 'Colecistectomía por litiasis vesicular',
  'hernia': 'Hernioplastia',
  'ingle': 'Hernioplastia inguinal',
  'umbilical': 'Hernioplastia umbilical',
  'apendice': 'Apendicectomía',
  'apendicitis': 'Apendicectomía',
  'rodilla': 'Artroscopia de rodilla',
  'hombro': 'Artroscopia de hombro',
  'cadera': 'Artroplastia de cadera',
  'catarata': 'Cirugía de cataratas',
  'ojo': 'Cirugía oftalmológica',
  'amigdala': 'Amigdalectomía',
  'amigdalas': 'Amigdalectomía',
  'cesarea': 'Cesárea',
  'cesárea': 'Cesárea',
  'parto': 'Parto / obstetricia',
  'prostata': 'Cirugía prostática',
  'prostate': 'Cirugía prostática',
  'endoscopia': 'Endoscopía digestiva',
  'endoscopía': 'Endoscopía digestiva',
  'colon': 'Colonoscopía / cirugía colorrectal',
  'vesical': 'Cirugía urológica / vesical',
  'riñon': 'Cirugía urológica / renal',
  'rinon': 'Cirugía urológica / renal'
};

function afDiagSugerenciasMayo(q) {
  q = String(q || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (q.length < 2) return [];
  var out = [];
  var seen = {};
  Object.keys(AF_DIAG_SINONIMOS_MAYO).forEach(function (k) {
    var kk = k.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (q.indexOf(kk) >= 0 || kk.indexOf(q) >= 0) {
      var v = AF_DIAG_SINONIMOS_MAYO[k];
      if (!seen[v]) { seen[v] = true; out.push(v); }
    }
  });
  return out.slice(0, 6);
}
