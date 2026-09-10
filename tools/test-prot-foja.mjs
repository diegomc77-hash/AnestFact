/**
 * Lote 2 — protecciones: frases en Métodos + mutex del bloque.
 * Nombre de prueba / DNI ficticio only.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DECUB = 'Protección de decúbito: puntos de apoyo almohadillados.';
const OCULAR = 'Protección ocular: ungüento oftálmico y cierre palpebral.';

function fail(msg) {
  process.stderr.write('FAIL  ' + msg + '\n');
  process.exit(1);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const tecHtml = read('views/foja/tecnica.html');
if (tecHtml.indexOf('id="prot-wrap"') < 0) fail('falta #prot-wrap en Técnica');
if (tecHtml.indexOf('id="prot-decub"') < 0) fail('falta #prot-decub');
if (tecHtml.indexOf('id="prot-ocular-si"') < 0) fail('falta PROT. OCULAR Sí');
if (tecHtml.indexOf('id="prot-ocular-unguento"') < 0) fail('falta ungüento');
if (tecHtml.indexOf('id="prot-ocular-cierre"') < 0) fail('falta cierre palpebral');

const mayoHtml = read('views/foja/mayo-geclisa.html');
if (mayoHtml.indexOf('id="mon-decub"') < 0) fail('Mayo no debe perder #mon-decub');
if (mayoHtml.indexOf('onProtDecubChange(true)') < 0) fail('Mayo #mon-decub debe espejar');

const tecSrc = read('js/22-tecnica.js');
if (!/afApplyProtBlock\(\)/.test(tecSrc)) fail('falta afApplyProtBlock');
if (!/if\(metodos\)metodos\.value=txt;\s*if\(typeof afApplyProtBlock/.test(tecSrc.replace(/\n/g, ' '))) {
  fail('tecNivel4Check debe reaplicar el bloque PROT después de pisa el relato');
}

const fojaSrc = read('js/08-foja.js');
if (fojaSrc.indexOf('prot_ocular:') < 0) fail('flush debe persistir prot_ocular');
if (fojaSrc.indexOf("mon_decub:") < 0 && fojaSrc.indexOf('mon_decub:') < 0) fail('flush debe persistir mon_decub fuera de Mayo');
if (!/restaurarProtecciones\(f\)/.test(fojaSrc)) fail('cargarFojaUI debe restaurar protecciones');

const sendSrc = read('js/20-geclisa-send.js');
if (sendSrc.indexOf('8115') >= 0) fail('no tocar radios GECLISA en 20-geclisa-send.js');
const fillSrc = read('fill.js');
if (!/setRadio\('8115','8116',d\.monDecub/.test(fillSrc)) fail('fill.js PROT.DECUB 8115/8116 no se toca');

const start = tecSrc.indexOf("var AF_PROT_OPEN=");
const end = tecSrc.indexOf('// === GENERADOR DE CURVA DE SIGNOS VITALES ===');
if (start < 0 || end < 0) fail('no se pudo recortar helpers PROT de 22-tecnica.js');

const protDecub = { checked: false };
const monDecub = { checked: false };
const metodos = { value: '' };
const unguento = { checked: false };
const cierre = { checked: false };
const si = { style: {} };
const no = { style: {} };
const det = { style: { display: 'none' } };

const ctx = {
  console,
  String,
  Array,
  _protOcular: null,
  _protDecubSyncing: false,
  AF_PROT_OPEN: '\u00ABAF-PROT\u00BB',
  AF_PROT_CLOSE: '\u00AB/AF-PROT\u00BB',
  AF_PROT_DECUB: DECUB,
  AF_PROT_OCULAR: OCULAR,
  document: {
    getElementById: function (id) {
      if (id === 'prot-decub') return protDecub;
      if (id === 'mon-decub') return monDecub;
      if (id === 'fj-metodos') return metodos;
      if (id === 'prot-ocular-unguento') return unguento;
      if (id === 'prot-ocular-cierre') return cierre;
      if (id === 'prot-ocular-si') return si;
      if (id === 'prot-ocular-no') return no;
      if (id === 'prot-ocular-detalle') return det;
      return null;
    }
  }
};
vm.createContext(ctx);
vm.runInContext(tecSrc.slice(start, end), ctx);

function eq(got, want, label) {
  if (got !== want) fail(label + ': got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want));
}

eq(ctx.afTextoProteccionesInner(), '', 'ninguna');
protDecub.checked = true;
eq(ctx.afTextoProteccionesInner(), DECUB, 'solo decúbito');
ctx._protOcular = true;
eq(ctx.afTextoProteccionesInner(), DECUB + ' ' + OCULAR, 'ambas frases');
protDecub.checked = false;
monDecub.checked = false;
eq(ctx.afTextoProteccionesInner(), OCULAR, 'solo ocular');

metodos.value = 'Relato regional. «AF-PROT» viejo «/AF-PROT» ' + DECUB;
eq(
  ctx.afStripProtFromMetodos(metodos.value),
  'Relato regional.',
  'strip tags + frases'
);

metodos.value = 'Bajo estrictas medidas se realiza el procedimiento.';
protDecub.checked = true;
monDecub.checked = true;
ctx._protOcular = true;
ctx.afApplyProtBlock();
if (metodos.value.indexOf('Bajo estrictas medidas') < 0) fail('apply no debe pisar el relato');
if (metodos.value.indexOf(DECUB) < 0) fail('apply debe poner decúbito');
if (metodos.value.indexOf(OCULAR) < 0) fail('apply debe poner ocular');
if (metodos.value.indexOf('AF-PROT') >= 0) fail('el textarea no debe mostrar las etiquetas AF-PROT');

metodos.value = 'NUEVO RELATO TECNIVEL4';
ctx.afApplyProtBlock();
if (metodos.value.indexOf('NUEVO RELATO TECNIVEL4') < 0) fail('reapply tras pisa debe conservar el relato nuevo');
if (metodos.value.indexOf(DECUB) < 0 || metodos.value.indexOf(OCULAR) < 0) {
  fail('reapply tras pisa debe volver a poner ambas frases');
}

ctx._protOcular = false;
protDecub.checked = false;
monDecub.checked = false;
ctx.afApplyProtBlock();
eq(metodos.value, 'NUEVO RELATO TECNIVEL4', 'destildar debe borrar solo el bloque PROT');

eq(ctx.afMetodosSinTags('x «AF-PROT» ' + DECUB + ' «/AF-PROT» y'), 'x ' + DECUB + ' y', 'persist/print sin etiquetas');

process.stdout.write('OK    prot foja (frases Métodos + reapply)\n');
