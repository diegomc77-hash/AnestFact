/**
 * Parser heurístico de laboratorio preanestésico (PDF texto).
 * Estilo CyCCLabParser — sin IA.
 */
(function (global) {
  var NUM = '(\\d+[.,]\\d+|\\d+)';
  var MANUAL = 'completar manualmente';

  var ANALYTES = [
    { key: 'hemoglobina', nombre: 'Hemoglobina', labels: [/hemoglobina/i, /\bhb\b(?!\s*a1c)/i], unidad: 'g/dL' },
    { key: 'hematocrito', nombre: 'Hematocrito', labels: [/hematocrito/i, /\bhto\b/i, /\bhct\b/i], unidad: '%' },
    { key: 'plaquetas', nombre: 'Plaquetas', labels: [/plaquetas/i, /recuento\s+plaquetario/i], unidad: '/µL' },
    { key: 'leucocitos', nombre: 'Leucocitos', labels: [/leucocitos/i, /\bgb\b/i, /gl[oó]bulos\s+blancos/i], unidad: '/µL' },
    { key: 'glucemia', nombre: 'Glucemia', labels: [/glucemia/i, /glucosa(?:\s+en\s+sangre)?/i], unidad: 'mg/dL' },
    { key: 'urea', nombre: 'Urea', labels: [/\burea\b/i, /uremia/i], unidad: 'mg/dL' },
    { key: 'creatinina', nombre: 'Creatinina', labels: [/creatinina/i], unidad: 'mg/dL' },
    { key: 'sodio', nombre: 'Sodio', labels: [/\bsodio\b/i, /\bna\+\b/i, /\bna\b(?!\s*\/)/i], unidad: 'mEq/L' },
    { key: 'potasio', nombre: 'Potasio', labels: [/potasio/i, /\bk\+\b/i], unidad: 'mEq/L' },
    { key: 'inr', nombre: 'INR', labels: [/\binr\b/i, /r(?:az[oó]n|atio)\s+internacional/i], unidad: '' },
    { key: 'tp', nombre: 'TP / Quick', labels: [/\btp\b/i, /tiempo\s+de\s+protrombina/i, /\bquick\b/i], unidad: '%' },
    { key: 'kptt', nombre: 'KPTT', labels: [/kptt/i, /aptt/i, /ttpk/i, /tiempo\s+de\s+tromboplastina/i], unidad: 'seg' },
    { key: 'got', nombre: 'GOT / AST', labels: [/\bgot\b/i, /\bast\b/i, /aspartato/i], unidad: 'U/L' },
    { key: 'gpt', nombre: 'GPT / ALT', labels: [/\bgpt\b/i, /\balt\b/i, /alanina/i], unidad: 'U/L' },
    { key: 'bilirrubina', nombre: 'Bilirrubina total', labels: [/bilirrubina\s*total/i, /\bbt\b/i], unidad: 'mg/dL' },
    { key: 'hba1c', nombre: 'HbA1c', labels: [/hba1c/i, /hemoglobina\s+glicosilada/i, /hb\s*a1c/i], unidad: '%' }
  ];

  function normNum(s) {
    var v = String(s || '').trim().replace(',', '.');
    if (v.charAt(0) === '.') v = '0' + v;
    return v;
  }

  function normalizeLabText(raw) {
    var t = String(raw || '').replace(/\u00a0/g, ' ').replace(/\r/g, '\n');
    t = t.replace(/([A-Za-zÁÉÍÓÚáéíóúñ0-9().\-\/]{2,})\s*\n+\s*(\d+[.,]?\d*)/g, '$1 $2');
    t = t.replace(/[ \t]+/g, ' ');
    return t;
  }

  function pickBestNumber(slice, labelEnd) {
    var candidates = [];
    var re = new RegExp(NUM, 'g');
    var m;
    while ((m = re.exec(slice)) !== null) {
      if (m.index < labelEnd) continue;
      var val = normNum(m[1]);
      if (!val || isNaN(parseFloat(val))) continue;
      var after = slice.substring(m.index + m[0].length, m.index + m[0].length + 40);
      if (/^\s*[-–]\s*\d/.test(after)) continue;
      candidates.push({ val: val, pos: m.index, score: 0 });
    }
    if (!candidates.length) return null;
    candidates.forEach(function (c) {
      var ctx = slice.substring(c.pos, c.pos + 30).toLowerCase();
      if (/mg\/dl|g\/dl|u\/l|meq|mmol|seg|%|\/µl|\/ul|mil\/|10\^/i.test(ctx)) c.score += 4;
      c.score -= (c.pos - labelEnd) * 0.01;
    });
    candidates.sort(function (a, b) { return b.score - a.score; });
    return candidates[0];
  }

  function detectFlag(slice, valPos) {
    var around = slice.substring(Math.max(0, valPos - 10), valPos + 50);
    if (/\b(H|Alto|ALTO|High|\+)\b/.test(around) || /\*\s*H\b/i.test(around)) return 'alto';
    if (/\b(L|Bajo|BAJO|Low)\b/.test(around) || /\*\s*L\b/i.test(around)) return 'bajo';
    if (/fuera\s+de\s+rango|alterado/i.test(around)) return 'alterado';
    return '';
  }

  function detectRef(slice, valPos) {
    var after = slice.substring(valPos, valPos + 80);
    var m = after.match(/(\d+[.,]?\d*)\s*[-–a]\s*(\d+[.,]?\d*)/);
    if (m) return normNum(m[1]) + '-' + normNum(m[2]);
    return '';
  }

  function detectUnidad(slice, valPos, fallback) {
    var after = slice.substring(valPos, valPos + 40);
    var m = after.match(/\b(g\/dL|mg\/dL|U\/L|mEq\/L|mmol\/L|seg|s|%|\/µL|\/uL|x10\^3|mil\/mm3)\b/i);
    return m ? m[1] : (fallback || '');
  }

  function findAnalyte(text, analyte) {
    var i, j;
    for (i = 0; i < analyte.labels.length; i++) {
      var re = new RegExp(analyte.labels[i].source, 'gi');
      var match;
      while ((match = re.exec(text)) !== null) {
        var slice = text.substring(match.index, match.index + 180);
        var best = pickBestNumber(slice, match[0].length);
        if (best) {
          return {
            nombre: analyte.nombre,
            valor: best.val,
            unidad: detectUnidad(slice, best.pos, analyte.unidad),
            referencia: detectRef(slice, best.pos),
            flag: detectFlag(slice, best.pos)
          };
        }
      }
    }
    var lines = text.split('\n');
    for (j = 0; j < lines.length; j++) {
      for (i = 0; i < analyte.labels.length; i++) {
        if (!analyte.labels[i].test(lines[j])) continue;
        var best2 = pickBestNumber(lines[j], 0);
        if (best2) {
          return {
            nombre: analyte.nombre,
            valor: best2.val,
            unidad: detectUnidad(lines[j], best2.pos, analyte.unidad),
            referencia: detectRef(lines[j], best2.pos),
            flag: detectFlag(lines[j], best2.pos)
          };
        }
        if (j + 1 < lines.length && /^\d+[.,]?\d*$/.test(lines[j + 1].trim())) {
          return {
            nombre: analyte.nombre,
            valor: normNum(lines[j + 1].trim()),
            unidad: analyte.unidad || '',
            referencia: '',
            flag: ''
          };
        }
      }
    }
    return null;
  }

  function detectFecha(text) {
    var m = text.match(/(?:fecha|fcha|date)[^\d]{0,20}(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
      || text.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/);
    return m ? m[1] : null;
  }

  function parseLabText(raw) {
    var text = normalizeLabText(raw);
    var valores = [];
    var pendientes = [];
    ANALYTES.forEach(function (a) {
      var found = findAnalyte(text, a);
      if (found && found.valor) {
        valores.push(found);
      } else {
        pendientes.push({ campo: a.key, nombre: a.nombre, etiqueta: MANUAL });
      }
    });
    var alterados = valores.filter(function (v) {
      return v.flag === 'alto' || v.flag === 'bajo' || v.flag === 'alterado';
    });
    var general = 'no_legible';
    if (valores.length) {
      general = alterados.length ? 'alterado' : 'normal';
    }
    var resumen = '';
    if (!valores.length) {
      resumen = 'No se leyeron valores de laboratorio del PDF. ' + MANUAL + '.';
    } else if (alterados.length) {
      resumen = 'Laboratorio con alteraciones: ' + alterados.map(function (v) {
        return v.nombre + ' ' + v.valor + (v.unidad ? ' ' + v.unidad : '');
      }).join(', ');
    } else {
      resumen = 'Laboratorio: se leyeron ' + valores.length + ' valores sin marca de fuera de rango en el PDF.';
    }
    return {
      tipo: 'laboratorio',
      resultado_general: general,
      fecha: detectFecha(text),
      valores: valores,
      valores_alterados: alterados,
      campos_pendientes: pendientes,
      resumen_paciente: resumen,
      confianza: valores.length >= 6 ? 'alta' : (valores.length >= 2 ? 'media' : 'baja'),
      fuente: 'pdf_parser',
      valoracion_cardiovascular: '',
      etiquetas: { valoracion_cardiovascular: MANUAL }
    };
  }

  global.AfLabParser = {
    parseLabText: parseLabText,
    MANUAL: MANUAL,
    ANALYTE_KEYS: ANALYTES.map(function (a) { return a.key; })
  };
})(typeof window !== 'undefined' ? window : globalThis);
