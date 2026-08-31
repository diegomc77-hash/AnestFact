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
