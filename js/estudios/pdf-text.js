/**
 * Extracción de texto de PDF con PDF.js (sin OCR ni APIs externas de IA).
 * Misma idea que CyCCEcoParser.extractPdfText en la app de cabeza y cuello.
 */
(function (global) {
  function ensurePdfJsReady() {
    if (!global.pdfjsLib) {
      return Promise.reject(new Error('PDF.js no está cargado'));
    }
    if (!global.pdfjsLib.GlobalWorkerOptions.workerSrc) {
      global.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    return Promise.resolve(global.pdfjsLib);
  }

  function itemsToLines(items) {
    var rows = {};
    (items || []).forEach(function (it) {
      var y = Math.round((it.transform && it.transform[5]) || 0);
      if (!rows[y]) rows[y] = [];
      rows[y].push({ x: (it.transform && it.transform[4]) || 0, str: it.str || '' });
    });
    var lines = [];
    Object.keys(rows)
      .sort(function (a, b) { return parseFloat(b) - parseFloat(a); })
      .forEach(function (y) {
        rows[y].sort(function (a, b) { return a.x - b.x; });
        lines.push(rows[y].map(function (it) { return it.str; }).join(' '));
      });
    return lines.join('\n');
  }

  function extractPdfTextFromArrayBuffer(buf) {
    return ensurePdfJsReady().then(function (pdfjsLib) {
      var typed = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
      return pdfjsLib.getDocument({ data: typed }).promise.then(function (pdf) {
        var parts = [];
        var chain = Promise.resolve();
        for (var i = 1; i <= pdf.numPages; i++) {
          (function (pageNum) {
            chain = chain.then(function () {
              return pdf.getPage(pageNum).then(function (page) {
                return page.getTextContent().then(function (tc) {
                  parts.push(itemsToLines(tc.items));
                });
              });
            });
          })(i);
        }
        return chain.then(function () {
          return parts.join('\n').replace(/\u00a0/g, ' ').trim();
        });
      });
    });
  }

  function extractPdfTextFromFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('Sin archivo'));
      var reader = new FileReader();
      reader.onload = function () {
        extractPdfTextFromArrayBuffer(reader.result).then(resolve).catch(reject);
      };
      reader.onerror = function () { reject(new Error('No se pudo leer el PDF')); };
      reader.readAsArrayBuffer(file);
    });
  }

  function extractPdfTextFromBase64(b64) {
    try {
      var bin = atob(b64);
      var arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return extractPdfTextFromArrayBuffer(arr);
    } catch (e) {
      return Promise.reject(new Error('PDF inválido'));
    }
  }

  global.AfPdfText = {
    extractFromFile: extractPdfTextFromFile,
    extractFromBase64: extractPdfTextFromBase64,
    extractFromArrayBuffer: extractPdfTextFromArrayBuffer
  };
})(typeof window !== 'undefined' ? window : globalThis);
