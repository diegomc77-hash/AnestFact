/**
 * Parser de ECG: SOLO interpretación automática impresa por el equipo.
 * No genera valoración cardiovascular narrativa (queda "completar manualmente").
 */
(function (global) {
  var MANUAL = 'completar manualmente';

  function normalize(raw) {
    return String(raw || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ');
  }

  function pickLine(text, patterns) {
    var lines = text.split('\n');
    var i, j, line;
    for (i = 0; i < lines.length; i++) {
      line = lines[i].trim();
      if (!line) continue;
      for (j = 0; j < patterns.length; j++) {
        if (patterns[j].test(line)) return line;
      }
    }
    // También buscar en texto continuo
    for (j = 0; j < patterns.length; j++) {
      var m = text.match(patterns[j]);
      if (m) return (m[0] || '').trim();
    }
    return '';
  }

  function extractFc(text) {
    var m = text.match(/(?:fc|frecuencia\s*card[ií]aca|heart\s*rate|hr)\s*[:=]?\s*(\d{2,3})\s*(?:\/\s*min|bpm|lpm)?/i)
      || text.match(/\b(\d{2,3})\s*(?:bpm|lpm)\b/i);
    return m ? m[1] : '';
  }

  function extractRitmo(text) {
    var m = text.match(/ritmo\s*(?:sinusal|auricular|junctional|idioventricular|de\s+la\s+uni[oó]n)[^\n.]{0,40}/i)
      || text.match(/sinus\s+(?:rhythm|bradycardia|tachycardia)[^\n.]{0,40}/i)
      || text.match(/(?:fibrilaci[oó]n|flutter)\s+auricular[^\n.]{0,40}/i)
      || text.match(/atrial\s+fibrillation[^\n.]{0,40}/i);
    return m ? m[0].trim() : '';
  }

  /**
   * Bloques típicos de interpretación automática de equipos
   * (Schiller, GE, Philips, CardioFax, etc.).
   */
  function extractInterpretacionAuto(text) {
    var chunks = [];
    var labeled = text.match(
      /(?:interpretaci[oó]n(?:\s+autom[aá]tica)?|an[aá]lisis\s+autom[aá]tico|auto\s*statement|interpretation|computer\s+interpretation|diagn[oó]stico\s+autom[aá]tico)\s*[:\-]?\s*([\s\S]{10,500}?)(?=\n\s*\n|confirm|unconfirmed|m[eé]dico|physician|revis|page\s+\d|$)/i
    );
    if (labeled && labeled[1]) {
      chunks.push(labeled[1].replace(/\s+/g, ' ').trim());
    }

    var phrases = [
      /ECG\s+normal/i,
      /Normal\s+ECG/i,
      /Within\s+normal\s+limits/i,
      /Sinus\s+rhythm[^\n.]{0,80}/i,
      /Ritmo\s+sinusal[^\n.]{0,80}/i,
      /Sinus\s+bradycardia[^\n.]{0,60}/i,
      /Sinus\s+tachycardia[^\n.]{0,60}/i,
      /Bradicardia\s+sinusal[^\n.]{0,60}/i,
      /Taquicardia\s+sinusal[^\n.]{0,60}/i,
      /Atrial\s+fibrillation[^\n.]{0,80}/i,
      /Fibrilaci[oó]n\s+auricular[^\n.]{0,80}/i,
      /(?:Left|Right)\s+bundle\s+branch\s+block[^\n.]{0,40}/i,
      /Bloqueo\s+de\s+rama\s+(?:izquierda|derecha)[^\n.]{0,40}/i,
      /(?:Left|Right)\s+ventricular\s+hypertrophy[^\n.]{0,40}/i,
      /Hipertrofia\s+ventricular[^\n.]{0,50}/i,
      /(?:ST|T)\s*(?:depression|elevation|abnormalit)[^\n.]{0,60}/i,
      /Alteraci[oó]n(?:es)?\s+(?:de\s+)?(?:la\s+)?repolarizaci[oó]n[^\n.]{0,60}/i,
      /Abnormal\s+ECG[^\n.]{0,80}/i,
      /ECG\s+anormal[^\n.]{0,80}/i,
      /Borderline\s+ECG[^\n.]{0,60}/i,
      /Poor\s+R\s+wave\s+progression[^\n.]{0,40}/i,
      /Prolonged\s+QT[^\n.]{0,40}/i,
      /QT\s+prolongado[^\n.]{0,40}/i
    ];
    phrases.forEach(function (re) {
      var m = text.match(re);
      if (m) {
        var s = m[0].replace(/\s+/g, ' ').trim();
        if (chunks.indexOf(s) < 0) chunks.push(s);
      }
    });

    // Una línea completa si el equipo imprime "**** Abnormal ECG ****"
    var star = pickLine(text, [/\*{2,}.*ECG.*/i, /UNCONFIRMED\s+REPORT/i]);
    if (star && chunks.indexOf(star) < 0) chunks.push(star);

    return chunks.join('; ');
  }

  function parseEcgText(raw) {
    var text = normalize(raw);
    var interp = extractInterpretacionAuto(text);
    var ritmo = extractRitmo(text);
    var fc = extractFc(text);
    var hallazgos = [];
    if (interp) {
      interp.split(/[;|]/).forEach(function (h) {
        h = h.trim();
        if (h && hallazgos.indexOf(h) < 0) hallazgos.push(h);
      });
    }
    if (ritmo && hallazgos.indexOf(ritmo) < 0) hallazgos.unshift(ritmo);

    var general = 'no_legible';
    if (interp || ritmo || fc) {
      if (/normal\s*ecg|ecg\s*normal|within\s+normal|ritmo\s+sinusal(?!\s+con)/i.test(interp + ' ' + ritmo)
        && !/abnormal|anormal|fibril|block|bloqueo|hipertrof|alteraci/i.test(interp)) {
        general = 'normal';
      } else if (/abnormal|anormal|fibril|block|bloqueo|hipertrof|alteraci|depression|elevation/i.test(interp)) {
        general = 'alterado';
      } else {
        general = ritmo || interp ? 'normal' : 'no_legible';
        if (/bradicardia|taquicardia|fibril|flutter/i.test(ritmo + ' ' + interp)) general = 'alterado';
      }
    }

    var pendientes = [];
    if (!interp) pendientes.push({ campo: 'interpretacion_automatica', nombre: 'Interpretación automática del equipo', etiqueta: MANUAL });
    if (!ritmo) pendientes.push({ campo: 'ritmo', nombre: 'Ritmo', etiqueta: MANUAL });
    if (!fc) pendientes.push({ campo: 'fc', nombre: 'Frecuencia cardíaca', etiqueta: MANUAL });
    // Valoración narrativa: NUNCA autocompletar
    pendientes.push({ campo: 'valoracion_cardiovascular', nombre: 'Valoración cardiovascular', etiqueta: MANUAL });

    var resumen = '';
    if (interp) {
      resumen = 'ECG (interpretación del equipo): ' + interp;
    } else if (ritmo || fc) {
      resumen = 'ECG parcial: ' + [ritmo, fc ? ('FC ' + fc) : ''].filter(Boolean).join(' · ') + '. Resto: ' + MANUAL + '.';
    } else {
      resumen = 'No se leyó la interpretación automática del ECG. ' + MANUAL + '.';
    }

    return {
      tipo: 'ecg',
      resultado_general: general,
      ritmo: ritmo || '',
      fc: fc || '',
      interpretacion_automatica: interp || '',
      hallazgos: hallazgos,
      valores_alterados: general === 'alterado' ? hallazgos.map(function (h) {
        return { nombre: 'Hallazgo ECG', valor: h, unidad: '', referencia: '', flag: 'alterado' };
      }) : [],
      valoracion_cardiovascular: '',
      campos_pendientes: pendientes,
      resumen_paciente: resumen,
      confianza: interp ? 'alta' : (ritmo || fc ? 'media' : 'baja'),
      fuente: 'pdf_parser',
      etiquetas: {
        valoracion_cardiovascular: MANUAL,
        interpretacion_automatica: interp ? '' : MANUAL
      }
    };
  }

  global.AfEcgParser = {
    parseEcgText: parseEcgText,
    MANUAL: MANUAL
  };
})(typeof window !== 'undefined' ? window : globalThis);
