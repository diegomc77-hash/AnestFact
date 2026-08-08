/**
 * Extracción local de estudios: PDF.js + parsers propios.
 * Cero llamadas a APIs de IA de pago (Gemini/Claude/etc.).
 */
(function (global) {
  var MANUAL = 'completar manualmente';

  function emptyManual(tipo, motivo) {
    return {
      tipo: tipo,
      resultado_general: 'no_legible',
      resumen_paciente: (motivo || 'Sin datos automáticos') + '. ' + MANUAL + '.',
      valores_alterados: [],
      hallazgos: [],
      valoracion_cardiovascular: '',
      campos_pendientes: [
        { campo: 'resultado', nombre: 'Resultado del estudio', etiqueta: MANUAL },
        { campo: 'valoracion_cardiovascular', nombre: 'Valoración cardiovascular', etiqueta: MANUAL }
      ],
      etiquetas: { valoracion_cardiovascular: MANUAL },
      confianza: 'baja',
      fuente: 'manual_requerido'
    };
  }

  function ensureCvEmpty(extracted) {
    if (!extracted || typeof extracted !== 'object') return extracted;
    extracted.valoracion_cardiovascular = '';
    extracted.etiquetas = extracted.etiquetas || {};
    extracted.etiquetas.valoracion_cardiovascular = MANUAL;
    var tiene = (extracted.campos_pendientes || []).some(function (p) {
      return p.campo === 'valoracion_cardiovascular';
    });
    if (!tiene) {
      extracted.campos_pendientes = (extracted.campos_pendientes || []).concat([
        { campo: 'valoracion_cardiovascular', nombre: 'Valoración cardiovascular', etiqueta: MANUAL }
      ]);
    }
    return extracted;
  }

  function isPdf(mime, name) {
    return mime === 'application/pdf' || /\.pdf$/i.test(name || '');
  }

  /**
   * @param {object} opts
   * @param {string} opts.tipo
   * @param {File} [opts.file]
   * @param {string} [opts.mime]
   * @param {string} [opts.b64]
   * @param {string} [opts.name]
   * @returns {Promise<object>} extracted
   */
  function extractEstudioLocal(opts) {
    opts = opts || {};
    var tipo = opts.tipo || 'otro';

    // Eco y "otro": sin parser automático de IA
    if (tipo === 'ecocardiograma') {
      return Promise.resolve(ensureCvEmpty(emptyManual(
        tipo,
        'Ecocardiograma: no hay lectura automática por IA; cargue el resultado a mano'
      )));
    }
    if (tipo === 'otro') {
      return Promise.resolve(ensureCvEmpty(emptyManual(
        tipo,
        'Este tipo de estudio no tiene parser automático'
      )));
    }

    if (!isPdf(opts.mime, opts.name || (opts.file && opts.file.name))) {
      return Promise.reject(new Error(
        'La lectura automática solo funciona con PDF de texto (no foto). Use “cargar a mano” o suba el PDF.'
      ));
    }

    if (!global.AfPdfText) {
      return Promise.reject(new Error('Motor PDF no disponible. Recargue la página.'));
    }

    var textPromise = opts.file
      ? global.AfPdfText.extractFromFile(opts.file)
      : global.AfPdfText.extractFromBase64(opts.b64);

    return textPromise.then(function (text) {
      if (!text || text.replace(/\s/g, '').length < 20) {
        return ensureCvEmpty(emptyManual(
          tipo,
          'El PDF no tiene texto seleccionable (puede ser imagen escaneada). Use carga manual'
        ));
      }

      var extracted;
      if (tipo === 'laboratorio') {
        if (!global.AfLabParser) throw new Error('Parser de laboratorio no cargado');
        extracted = global.AfLabParser.parseLabText(text);
      } else if (tipo === 'ecg') {
        if (!global.AfEcgParser) throw new Error('Parser de ECG no cargado');
        extracted = global.AfEcgParser.parseEcgText(text);
      } else if (tipo === 'espirometria') {
        if (!global.AfEspirometriaParser) throw new Error('Parser de espirometría no cargado');
        extracted = global.AfEspirometriaParser.parseEspirometriaText(text);
      } else {
        extracted = emptyManual(tipo, 'Tipo no soportado en parser local');
      }

      return ensureCvEmpty(extracted);
    });
  }

  global.AfEstudioExtractLocal = {
    extract: extractEstudioLocal,
    MANUAL: MANUAL,
    emptyManual: emptyManual
  };
})(typeof window !== 'undefined' ? window : globalThis);
