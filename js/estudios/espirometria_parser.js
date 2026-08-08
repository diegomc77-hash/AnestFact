/**
 * Parser de espirometría (PDF texto) — volúmenes / flujos habituales.
 * Sin IA.
 */
(function (global) {
  var MANUAL = 'completar manualmente';
  var NUM = '(\\d+[.,]\\d+|\\d+)';

  var METRICS = [
    { key: 'fvc', nombre: 'FVC', labels: [/\bfvc\b/i, /capacidad\s+vital\s+forzada/i], unidad: 'L' },
    { key: 'fev1', nombre: 'FEV1', labels: [/\bfev1\b/i, /\bvef1\b/i, /volumen\s+espiratorio\s+forzado/i], unidad: 'L' },
    { key: 'fev1_fvc', nombre: 'FEV1/FVC', labels: [/fev1\s*\/\s*fvc/i, /vef1\s*\/\s*cvf/i, /tiffs?/i, /índice\s+de\s+tiffeneau/i], unidad: '%' },
    { key: 'pef', nombre: 'PEF', labels: [/\bpef\b/i, /\bpemf\b/i, /flujo\s+espiratorio\s+m[aá]ximo/i], unidad: 'L/s' },
    { key: 'fef2575', nombre: 'FEF25-75', labels: [/fef\s*25\s*[-–]\s*75/i, /fef25-75/i, /mme[fs]/i], unidad: 'L/s' }
  ];

  function normNum(s) {
    return String(s || '').trim().replace(',', '.');
  }

  function normalize(raw) {
    var t = String(raw || '').replace(/\u00a0/g, ' ').replace(/\r/g, '\n');
    t = t.replace(/([A-Za-z0-9\/\-]{2,})\s*\n+\s*(\d+[.,]?\d*)/g, '$1 $2');
    return t.replace(/[ \t]+/g, ' ');
  }

  function findMetric(text, metric) {
    var i;
    for (i = 0; i < metric.labels.length; i++) {
      var re = new RegExp(metric.labels[i].source + '[^\\d\\n]{0,40}' + NUM + '(?:\\s*%\\s*(?:pred|te[oó]r)?)?', 'i');
      var m = text.match(re);
      if (m) {
        var flag = '';
        var ctx = m[0];
        if (/%\s*pred/i.test(ctx) || /%\s*te[oó]r/i.test(ctx)) {
          // valor absoluto suele estar antes del %; si solo hay %, lo guardamos como %
        }
        if (/\b(bajo|low|reduced|disminu)/i.test(ctx)) flag = 'bajo';
        return {
          nombre: metric.nombre,
          valor: normNum(m[1] || m[2] || m[m.length - 1]),
          unidad: /%/.test(metric.unidad) || /\/\s*fvc/i.test(metric.key) ? metric.unidad : metric.unidad,
          referencia: '',
          flag: flag,
          key: metric.key
        };
      }
    }
    // Buscar "FVC 3.45 (92%)" estilo tabla
    for (i = 0; i < metric.labels.length; i++) {
      var re2 = new RegExp(metric.labels[i].source, 'i');
      var idx = text.search(re2);
      if (idx < 0) continue;
      var slice = text.substring(idx, idx + 120);
      var nums = slice.match(new RegExp(NUM, 'g'));
      if (nums && nums.length) {
        return {
          nombre: metric.nombre,
          valor: normNum(nums[0]),
          unidad: metric.unidad,
          referencia: nums[1] ? ('pred ~' + normNum(nums[1])) : '',
          flag: '',
          key: metric.key
        };
      }
    }
    return null;
  }

  function extractInterpretacion(text) {
    var m = text.match(
      /(?:interpretaci[oó]n|conclusi[oó]n|impresi[oó]n|pattern|patr[oó]n)\s*[:\-]?\s*([^\n]{8,200})/i
    );
    if (m) return m[1].trim();
    var patterns = [
      /espirometr[ií]a\s+normal/i,
      /normal\s+spirometry/i,
      /obstrucci[oó]n\s+(?:leve|moderada|grave|severa)/i,
      /(?:mild|moderate|severe)\s+obstruction/i,
      /restricci[oó]n\s+(?:leve|moderada|grave)?/i,
      /patron\s+mixto/i,
      /mixed\s+pattern/i
    ];
    for (var i = 0; i < patterns.length; i++) {
      var hit = text.match(patterns[i]);
      if (hit) return hit[0];
    }
    return '';
  }

  function parseEspirometriaText(raw) {
    var text = normalize(raw);
    var valores = [];
    var pendientes = [];
    METRICS.forEach(function (metric) {
      var found = findMetric(text, metric);
      if (found && found.valor) valores.push(found);
      else pendientes.push({ campo: metric.key, nombre: metric.nombre, etiqueta: MANUAL });
    });
    var interp = extractInterpretacion(text);
    if (!interp) {
      pendientes.push({ campo: 'interpretacion', nombre: 'Interpretación / patrón', etiqueta: MANUAL });
    }
    pendientes.push({ campo: 'valoracion_cardiovascular', nombre: 'Valoración cardiovascular', etiqueta: MANUAL });

    var general = 'no_legible';
    if (valores.length || interp) {
      if (/normal/i.test(interp) && !/obstruc|restric|anormal|abnormal/i.test(interp)) general = 'normal';
      else if (/obstruc|restric|mixto|abnormal|alterado|grave|severa|moderada/i.test(interp)) general = 'alterado';
      else general = valores.length ? 'normal' : 'no_legible';
    }

    var hallazgos = [];
    if (interp) hallazgos.push(interp);
    valores.forEach(function (v) {
      hallazgos.push(v.nombre + ' ' + v.valor + (v.unidad ? ' ' + v.unidad : ''));
    });

    var resumen = '';
    if (interp || valores.length) {
      resumen = 'Espirometría: ' + (interp || valores.map(function (v) {
        return v.nombre + ' ' + v.valor;
      }).join(', '));
    } else {
      resumen = 'No se leyeron valores de espirometría del PDF. ' + MANUAL + '.';
    }

    return {
      tipo: 'espirometria',
      resultado_general: general,
      interpretacion: interp || '',
      valores: valores,
      hallazgos: hallazgos,
      valores_alterados: general === 'alterado' ? hallazgos.map(function (h) {
        return { nombre: 'Espirometría', valor: h, unidad: '', referencia: '', flag: 'alterado' };
      }) : [],
      valoracion_cardiovascular: '',
      campos_pendientes: pendientes,
      resumen_paciente: resumen,
      confianza: (valores.length >= 2 || interp) ? 'media' : 'baja',
      fuente: 'pdf_parser',
      etiquetas: {
        valoracion_cardiovascular: MANUAL,
        interpretacion: interp ? '' : MANUAL
      }
    };
  }

  global.AfEspirometriaParser = {
    parseEspirometriaText: parseEspirometriaText,
    MANUAL: MANUAL
  };
})(typeof window !== 'undefined' ? window : globalThis);
