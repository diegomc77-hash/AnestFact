/**
 * P1: ranuras de adjuntos + pipeline (sin rasterizar en Node).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  process.stderr.write('FAIL  ' + msg + '\n');
  process.exit(1);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const html = read('views/facturacion.html');
['anest', 'qx', 'auth'].forEach(function (tipo) {
  ['badge', 'prev', 'label'].forEach(function (suf) {
    var id = 'doc-' + tipo + '-' + suf;
    if (html.indexOf('id="' + id + '"') < 0) fail('falta #' + id + ' en facturacion.html');
  });
  if (html.indexOf("adjuntarDoc(this,'" + tipo + "')") < 0) {
    fail('falta onchange adjuntarDoc ' + tipo);
  }
});
if (html.indexOf('Guardá primero los datos') >= 0) fail('placeholder viejo todavía en docs-card-body');
if (html.indexOf('Documentación (PDF o foto)') < 0 && html.indexOf('Documentaci&oacute;n (PDF o foto)') < 0) {
  fail('título de tarjeta de documentación');
}

const nav = read('js/06-nav-core.js');
if (!/cargarDocBadges/.test(nav)) fail('go(facturacion) debe llamar cargarDocBadges');

const sync = read('js/17-sync-export.js');
if (!/afPrepareAdjunto/.test(sync)) fail('adjuntarDoc debe usar afPrepareAdjunto');
if (!/syncAutoPushDebounced/.test(sync)) fail('adjuntar/borrar debe pushear sync');

const compress = read('js/41-adjuntos-compress.js');
if (compress.indexOf('function afPrepareAdjunto') < 0) fail('falta afPrepareAdjunto');
if (compress.indexOf('vendor/pdfjs/pdf.min.js') < 0) fail('pdf.js debe cargarse de vendor/');
if (compress.indexOf('STATIC_CORE') >= 0) fail('no meter pdf.js en comentarios de precache por error');

['vendor/pdfjs/pdf.min.js', 'vendor/pdfjs/pdf.worker.min.js'].forEach(function (rel) {
  var st = fs.statSync(path.join(root, rel));
  if (st.size < 10000) fail(rel + ' demasiado chico');
});

const sw = read('sw.js');
if (sw.indexOf('vendor/pdfjs') >= 0) fail('pdf.js no debe estar en sw.js / STATIC_CORE');

process.stdout.write('OK    P1 adjuntos (IDs, glue, vendor fuera de precache)\n');
