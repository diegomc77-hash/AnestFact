/**
 * Modismos AR → término médico (sugerido, editable por anestesista).
 * El paciente ve `paciente`; AnesFact recibe `medico` como sugerencia.
 */
var AF_DIAG_MODISMOS_MAYO = [
  { paciente: 'piedras en la vesícula / vesícula', medico: 'Colecistectomía', keys: ['vesicula', 'piedras vesicula', 'piedras en la vesicula', 'cole'] },
  { paciente: 'hernia', medico: 'Hernioplastia', keys: ['hernia'] },
  { paciente: 'hernia de ombligo', medico: 'Hernioplastia umbilical', keys: ['hernia de ombligo', 'ombligo', 'umbilical'] },
  { paciente: 'hernia inguinal', medico: 'Hernioplastia inguinal', keys: ['hernia inguinal', 'ingle'] },
  { paciente: 'próstata', medico: 'RTU de próstata / Prostatectomía', keys: ['prostata'] },
  { paciente: 'amígdalas / anginas', medico: 'Amigdalectomía', keys: ['amigdala', 'amigdalas', 'anginas'] },
  { paciente: 'apéndice / apendicitis', medico: 'Apendicectomía', keys: ['apendice', 'apendicitis'] },
  { paciente: 'tiroides / bocio', medico: 'Tiroidectomía', keys: ['tiroides', 'bocio'] },
  { paciente: 'várices', medico: 'Safenectomía / cirugía de várices', keys: ['varices', 'varice'] },
  { paciente: 'cataratas', medico: 'Facoemulsificación', keys: ['catarata', 'cataratas'] },
  { paciente: 'hemorroides / almorranas', medico: 'Hemorroidectomía', keys: ['hemorroide', 'hemorroides', 'almorrana', 'almorranas'] },
  { paciente: 'menisco / rodilla', medico: 'Meniscectomía / artroscopia de rodilla', keys: ['menisco', 'rodilla'] },
  { paciente: 'prótesis de cadera', medico: 'Artroplastia de cadera', keys: ['protesis de cadera', 'cadera'] },
  { paciente: 'prótesis de rodilla', medico: 'Artroplastia de rodilla', keys: ['protesis de rodilla'] },
  { paciente: 'hernia de disco / columna', medico: 'Discectomía', keys: ['hernia de disco', 'disco', 'columna'] },
  { paciente: 'útero / matriz', medico: 'Histerectomía', keys: ['utero', 'matriz'] },
  { paciente: 'quiste de ovario', medico: 'Ooforectomía / quistectomía ovárica', keys: ['quiste de ovario', 'ovario'] },
  { paciente: 'cesárea', medico: 'Cesárea', keys: ['cesarea'] },
  { paciente: 'ligadura de trompas', medico: 'Ligadura tubaria', keys: ['ligadura', 'trompas'] },
  { paciente: 'vasectomía', medico: 'Vasectomía', keys: ['vasectomia'] },
  { paciente: 'tabique / nariz tapada', medico: 'Septumplastia', keys: ['tabique', 'nariz tapada', 'nariz'] },
  { paciente: 'piedras en el riñón', medico: 'Litotricia / ureteroscopía', keys: ['piedras rinon', 'piedras en el rinon', 'rinon', 'riñon'] },
  { paciente: 'fimosis', medico: 'Circuncisión', keys: ['fimosis'] },
  { paciente: 'juanete', medico: 'Corrección de hallux valgus', keys: ['juanete'] },
  { paciente: 'mano dormida / túnel carpiano', medico: 'Liberación de túnel carpiano', keys: ['mano dormida', 'tunel carpiano', 'carpiano'] },
  { paciente: 'lipoma / bolita / quiste', medico: 'Exéresis de lesión', keys: ['lipoma', 'bolita', 'quiste'] },
  { paciente: 'nódulo en la mama', medico: 'Biopsia mamaria / tumorectomía', keys: ['nodulo mama', 'nodulo en la mama', 'mama'] },
  { paciente: 'bypass gástrico', medico: 'Cirugía bariátrica', keys: ['bypass', 'bypass gastrico', 'bariatrica'] },
  { paciente: 'pólipos', medico: 'Polipectomía', keys: ['polipo', 'polipos'] }
];

function afFoldDiag(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/** Sugerencias en lenguaje del paciente (no término médico crudo). */
function afDiagSugerenciasMayo(q) {
  q = afFoldDiag(q);
  if (q.length < 2) return [];
  var out = [];
  var seen = {};
  AF_DIAG_MODISMOS_MAYO.forEach(function (row) {
    var hit = false;
    if (afFoldDiag(row.paciente).indexOf(q) >= 0) hit = true;
    if (!hit) {
      for (var i = 0; i < (row.keys || []).length; i++) {
        var k = afFoldDiag(row.keys[i]);
        if (q.indexOf(k) >= 0 || k.indexOf(q) >= 0) { hit = true; break; }
      }
    }
    if (hit && !seen[row.paciente]) {
      seen[row.paciente] = true;
      out.push(row);
    }
  });
  return out.slice(0, 8);
}

/** Mapeo silencioso texto paciente → término médico sugerido. */
function afDiagMapearMedicoMayo(textoPaciente) {
  var q = afFoldDiag(textoPaciente);
  if (!q) return null;
  var best = null;
  var bestLen = 0;
  AF_DIAG_MODISMOS_MAYO.forEach(function (row) {
    (row.keys || []).concat([row.paciente]).forEach(function (k) {
      var kk = afFoldDiag(k);
      if (kk.length >= 3 && q.indexOf(kk) >= 0 && kk.length > bestLen) {
        bestLen = kk.length;
        best = row.medico;
      }
    });
  });
  return best;
}
