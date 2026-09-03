/** Compresión de adjuntos de foja (P1). No cambia la forma de S.cur.docs. */
var AF_DOC_PASS = 500 * 1024;
var AF_DOC_TARGET = 450 * 1024;
var AF_DOC_MAX_EDGE = 1800;
var AF_DOC_PDFJS = 'vendor/pdfjs/pdf.min.js';
var AF_DOC_PDFJS_WORKER = 'vendor/pdfjs/pdf.worker.min.js';
var _afPdfJsPromise = null;

function afFileToDataURL(file) {
  return new Promise(function (resolve, reject) {
    var r = new FileReader();
    r.onload = function () { resolve(r.result); };
    r.onerror = function () { reject(r.error || new Error('read')); };
    r.readAsDataURL(file);
  });
}

function afFileToArrayBuffer(file) {
  if (file && typeof file.arrayBuffer === 'function') return file.arrayBuffer();
  return new Promise(function (resolve, reject) {
    var r = new FileReader();
    r.onload = function () { resolve(r.result); };
    r.onerror = function () { reject(r.error || new Error('read')); };
    r.readAsArrayBuffer(file);
  });
}

function afDataUrlToBlob(dataUrl) {
  var parts = String(dataUrl || '').split(',');
  var mime = (parts[0].match(/:(.*?);/) || [])[1] || 'image/jpeg';
  var bin = atob(parts[1] || '');
  var arr = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function afCanvasToJpegBlob(canvas, quality) {
  return new Promise(function (resolve, reject) {
    function fromUrl() {
      try {
        resolve(afDataUrlToBlob(canvas.toDataURL('image/jpeg', quality)));
      } catch (e) {
        reject(e);
      }
    }
    if (canvas.toBlob) {
      canvas.toBlob(function (b) {
        if (b) resolve(b);
        else fromUrl();
      }, 'image/jpeg', quality);
    } else {
      fromUrl();
    }
  });
}

function afCompressCanvasToTarget(srcCanvas) {
  var qualities = [0.82, 0.72, 0.62];
  function step(canvas, qIdx, tries) {
    var q = qualities[Math.min(qIdx, qualities.length - 1)];
    return afCanvasToJpegBlob(canvas, q).then(function (blob) {
      if (blob.size <= AF_DOC_TARGET || tries >= 8) return blob;
      if (qIdx < qualities.length - 1) return step(canvas, qIdx + 1, tries + 1);
      var w2 = Math.max(1, Math.round(canvas.width * 0.85));
      var h2 = Math.max(1, Math.round(canvas.height * 0.85));
      if (Math.max(w2, h2) < 640) return blob;
      var next = document.createElement('canvas');
      next.width = w2;
      next.height = h2;
      next.getContext('2d').drawImage(canvas, 0, 0, w2, h2);
      return step(next, 0, tries + 1);
    });
  }
  return step(srcCanvas, 0, 0);
}

function afDrawBitmapToCanvas(img, maxEdge) {
  var w = img.width || img.naturalWidth;
  var h = img.height || img.naturalHeight;
  if (!w || !h) throw new Error('empty image');
  var scale = Math.max(w, h) > maxEdge ? maxEdge / Math.max(w, h) : 1;
  var c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * scale));
  c.height = Math.max(1, Math.round(h * scale));
  var ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

function afDecodeImageFile(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () {
      return createImageBitmap(file);
    });
  }
  return new Promise(function (resolve, reject) {
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      reject(new Error('decode'));
    };
    img.src = url;
  });
}

function afCompressImageFile(file) {
  return afDecodeImageFile(file).then(function (img) {
    var canvas = afDrawBitmapToCanvas(img, AF_DOC_MAX_EDGE);
    if (img && typeof img.close === 'function') {
      try { img.close(); } catch (eClose) {}
    }
    return afCompressCanvasToTarget(canvas);
  });
}

function afEnsurePdfJs() {
  if (typeof pdfjsLib !== 'undefined' && pdfjsLib.getDocument) {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = AF_DOC_PDFJS_WORKER;
    }
    return Promise.resolve(pdfjsLib);
  }
  if (_afPdfJsPromise) return _afPdfJsPromise;
  _afPdfJsPromise = new Promise(function (resolve, reject) {
    var s = document.createElement('script');
    s.src = AF_DOC_PDFJS;
    s.onload = function () {
      if (typeof pdfjsLib === 'undefined' || !pdfjsLib.getDocument) {
        _afPdfJsPromise = null;
        reject(new Error('pdfjs'));
        return;
      }
      pdfjsLib.GlobalWorkerOptions.workerSrc = AF_DOC_PDFJS_WORKER;
      resolve(pdfjsLib);
    };
    s.onerror = function () {
      _afPdfJsPromise = null;
      reject(new Error('pdfjs load'));
    };
    document.head.appendChild(s);
  });
  return _afPdfJsPromise;
}

function afRasterizePdfPage1(file) {
  return afEnsurePdfJs().then(function (lib) {
    return afFileToArrayBuffer(file).then(function (buf) {
      return lib.getDocument({ data: new Uint8Array(buf) }).promise;
    });
  }).then(function (pdf) {
    return pdf.getPage(1);
  }).then(function (page) {
    var base = page.getViewport({ scale: 1 });
    var scale = AF_DOC_MAX_EDGE / Math.max(base.width, base.height);
    if (scale > 2) scale = 2;
    var vp = page.getViewport({ scale: scale });
    var canvas = document.createElement('canvas');
    canvas.width = Math.round(vp.width);
    canvas.height = Math.round(vp.height);
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return page.render({ canvasContext: ctx, viewport: vp }).promise.then(function () {
      return afCompressCanvasToTarget(canvas);
    });
  });
}

function afPdfExtractTextFromDataUrl(dataUrl) {
  return afEnsurePdfJs().then(function (lib) {
    var blob = afDataUrlToBlob(dataUrl);
    return afFileToArrayBuffer(blob).then(function (buf) {
      return lib.getDocument({ data: new Uint8Array(buf) }).promise;
    });
  }).then(function (pdf) {
    var n = pdf.numPages || 0;
    var acc = Promise.resolve('');
    var i;
    for (i = 1; i <= n; i++) {
      acc = (function (pageNo, seq) {
        return seq.then(function (text) {
          return pdf.getPage(pageNo).then(function (page) {
            return page.getTextContent().then(function (tc) {
              var bits = (tc.items || []).map(function (it) { return it.str || ''; }).join(' ');
              return text + ' ' + bits;
            });
          });
        });
      })(i, acc);
    }
    return acc;
  });
}

function afPdfFold(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function afPdfFormatFecha(fecha) {
  var s = String(fecha || '').trim();
  var iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[3] + '/' + iso[2] + '/' + iso[1];
  var dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (!dmy) return '';
  var dd = dmy[1].length === 1 ? '0' + dmy[1] : dmy[1];
  var mm = dmy[2].length === 1 ? '0' + dmy[2] : dmy[2];
  var y = dmy[3];
  if (y.length === 2) y = '20' + y;
  return dd + '/' + mm + '/' + y;
}

/** Primer apellido usable (≥4 letras), sin dr/dra. */
function afPdfCirujanoToken(name) {
  var s = afPdfFold(name).replace(/[^a-z0-9\s]/g, ' ');
  s = s.replace(/\b(dr|dra|prof|doctor|doctora)\b/g, ' ');
  var parts = s.replace(/\s+/g, ' ').trim().split(' ');
  var i;
  for (i = 0; i < parts.length; i++) {
    if (parts[i].length >= 4) return parts[i];
  }
  return '';
}

function afPdfParseGeclisaLabels(raw) {
  var t = afPdfFold(raw).replace(/\s+/g, ' ');
  var next = '(?=\\s+(?:cirujanos\\s*:|diagnostico\\s*\\d*\\s*:|fecha\\s+admision|hora\\s+inicio|hora\\s+fin|n[°ºo.]?\\s*atenc|protocolo\\s*(?:quir|anest)|posicion\\s*:|$))';
  var cirujanos = [];
  var reC = new RegExp('cirujanos\\s*:\\s*(.+?)' + next, 'g');
  var m;
  while ((m = reC.exec(t))) cirujanos.push(String(m[1] || '').trim());
  var fechasQx = [];
  var reF = /(\d{1,2}\/\d{1,2}\/\d{4})\s+hora\s+inicio\s+de\s+cirugia/g;
  while ((m = reF.exec(t))) {
    var f = afPdfFormatFecha(m[1]);
    if (f) fechasQx.push(f);
  }
  return {
    text: t,
    cirujanos: cirujanos,
    fechasQx: fechasQx,
    hasHoraInicio: /hora\s+inicio\s+de\s+cirugia\s*:/.test(t),
    hasQx: /protocolo\s*quir[uú]rgico/.test(t) || /protocoloquirurgico/.test(t),
    hasAnest: /protocolo\s*anest/.test(t)
  };
}

/**
 * Ventana ancha: cirujano fuzzy gana; fecha = la pegada a hora inicio de cirugia.
 * meta: { ciru, fecha }
 */
function afPdfVerifyGeclisaMatch(rawOrLabels, meta) {
  meta = meta || {};
  var labels = (rawOrLabels && rawOrLabels.cirujanos)
    ? rawOrLabels
    : afPdfParseGeclisaLabels(rawOrLabels);
  var token = afPdfCirujanoToken(meta.ciru);
  var fojaFecha = afPdfFormatFecha(meta.fecha);
  var surgeonMatch = false;
  var i;
  if (token) {
    var re = new RegExp('\\b' + token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
    for (i = 0; i < labels.cirujanos.length; i++) {
      if (re.test(afPdfFold(labels.cirujanos[i]))) {
        surgeonMatch = true;
        break;
      }
    }
  }
  var dateMatch = false;
  for (i = 0; i < labels.fechasQx.length; i++) {
    if (labels.fechasQx[i] === fojaFecha) {
      dateMatch = true;
      break;
    }
  }
  var surgeonRequired = !!token;
  var accept = surgeonRequired ? surgeonMatch : dateMatch;
  return {
    accept: !!accept,
    surgeonRequired: surgeonRequired,
    surgeonMatch: surgeonMatch,
    dateMatch: dateMatch,
    cirujanoToken: token || '',
    fojaFecha: fojaFecha,
    cirujanos: labels.cirujanos,
    fechasQx: labels.fechasQx,
    hasHoraInicio: !!labels.hasHoraInicio
  };
}

/** Completo = títulos qx+anest. Si meta.wide, también candados (cirujano > fecha). */
function afPdfLooksComplete(dataUrl, meta) {
  meta = meta || {};
  if (!dataUrl) return Promise.resolve({ parseOk: false, complete: false });
  return afPdfExtractTextFromDataUrl(dataUrl).then(function (raw) {
    var labels = afPdfParseGeclisaLabels(raw);
    var look = {
      parseOk: true,
      hasQx: labels.hasQx,
      hasAnest: labels.hasAnest,
      complete: !!(labels.hasQx && labels.hasAnest)
    };
    if (meta.wide) {
      var v = afPdfVerifyGeclisaMatch(labels, meta);
      look.verify = v;
      look.complete = !!(look.complete && v.accept);
    }
    return look;
  }).catch(function () {
    return { parseOk: false, complete: false, hasQx: false, hasAnest: false };
  });
}

function afAdjuntoFromFile(file) {
  return afFileToDataURL(file).then(function (data) {
    return {
      nombre: file.name || 'documento',
      tipo: file.type || 'application/octet-stream',
      data: data,
      fecha: new Date().toISOString()
    };
  });
}

function afAdjuntoFromJpegBlob(file, blob) {
  var base = String(file.name || 'documento').replace(/\.[^.]+$/, '');
  return afFileToDataURL(blob).then(function (data) {
    return {
      nombre: base + '.jpg',
      tipo: 'image/jpeg',
      data: data,
      fecha: new Date().toISOString()
    };
  });
}

/** Si el archivo ya es chico, lo deja igual. Si no, JPEG ~450 KB. Ante cualquier fallo, original. */
function afPrepareAdjunto(file) {
  if (!file) return Promise.reject(new Error('file'));
  if (file.size <= AF_DOC_PASS) return afAdjuntoFromFile(file);

  var mime = String(file.type || '').toLowerCase();
  var name = String(file.name || '').toLowerCase();
  var isPdf = mime === 'application/pdf' || /\.pdf$/.test(name);
  var isImg = mime.indexOf('image/') === 0 || /\.(jpe?g|png|webp|gif|heic|heif)$/.test(name);

  var work;
  if (isImg) work = afCompressImageFile(file);
  else if (isPdf) work = afRasterizePdfPage1(file);
  else return afAdjuntoFromFile(file);

  return work.then(function (blob) {
    return afAdjuntoFromJpegBlob(file, blob);
  }).catch(function () {
    return afAdjuntoFromFile(file);
  });
}
