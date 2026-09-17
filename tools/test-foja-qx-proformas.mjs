/**
 * Tests Node del motor de proformas (CyC tiroides + condicionales).
 * Uso: node tools/test-foja-qx-proformas.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function load(file, sandbox) {
  const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
  vm.runInNewContext(code, sandbox);
}

const sandbox = { console };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

load('data/proformas/index.js', sandbox);
const cycFiles = fs
  .readdirSync(path.join(ROOT, 'data/proformas/cyc'))
  .filter((f) => f.endsWith('.js'));
for (const f of cycFiles) load('data/proformas/cyc/' + f, sandbox);
load('js/44-foja-qx-proformas.js', sandbox);

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL', msg);
    failed++;
  } else {
    console.log('OK', msg);
  }
}

const ESP = 'Cirugía de Cabeza y Cuello';
const list = sandbox.afProformasByEspecialidad(ESP);
assert(list.length === 13, 'CyC = 13 proformas (' + list.length + ')');

const matched = sandbox.afProformasMatchOperacion(ESP, 'Tiroidectomía total');
assert(matched.length >= 1 && matched[0].id === 'cyc-tiroides-paratiroides-v1', 'match tiroides primero');

const p = sandbox.afProformaById('cyc-tiroides-paratiroides-v1');
assert(!!p, 'carga tiroides');

const viaSlot = p.slots.find((s) => s.id === 'via');
assert(
  sandbox.afProformaSlotIsRequired(viaSlot, {
    procedimiento_grupo: 'Cirugía de tiroides (vía + extensión)',
  }) === true,
  'via required_if tiroides'
);
assert(
  sandbox.afProformaSlotIsRequired(viaSlot, {
    procedimiento_grupo: 'Resección de quiste tirogloso (Sistrunk)',
  }) === false,
  'via no required si Sistrunk'
);

const extSlot = p.slots.find((s) => s.id === 'extension');
assert(
  sandbox.afProformaSlotIsRequired(extSlot, {
    via: 'Convencional (abierta)',
  }) === true,
  'extension required_if convencional'
);

const values = {
  procedimiento_grupo: 'Cirugía de tiroides (vía + extensión)',
  via: 'Convencional (abierta)',
  extension: 'Hemitiroidectomía',
  lado: 'Derecho',
  intubacion: 'Orotraqueal estándar',
  nlr: 'Identificado y preservado',
  aparatologia: ['NIM intraoperatorio'],
  vaciamiento_asoc: ['Ninguno'],
};
const missing = sandbox.afProformaMissingRequired(p, values);
assert(missing.length === 0, 'sin faltantes con set completo (' + missing.join(',') + ')');

const texto = sandbox.afProformaRender(p, values);
assert(texto.indexOf('Hemitiroidectomía') >= 0, 'render incluye extensión');
assert(texto.indexOf('Lado: Derecho') >= 0, 'render lado_frase');
assert(texto.indexOf('{{') < 0, 'sin placeholders crudos');
assert(texto.indexOf('Sistrunk') < 0, 'tiroides: sin mención Sistrunk');
assert(texto.indexOf('Si paratiroid') < 0, 'tiroides: sin rama «Si paratiroid…»');
assert(texto.indexOf('enfoque') < 0 || texto.indexOf('Enfoque quirúrgico') < 0, 'tiroides: sin bloque enfoque para');
assert(texto.indexOf('PTH basal') < 0 && texto.indexOf('PTH post') < 0, 'tiroides: sin líneas PTH');

const pthSlot = p.slots.find((s) => s.id === 'pth_basal');
assert(
  sandbox.afProformaSlotIsVisible(pthSlot, values) === false,
  'PTH oculto si rama tiroides'
);
const viaSlot2 = p.slots.find((s) => s.id === 'via');
assert(sandbox.afProformaSlotIsVisible(viaSlot2, values) === true, 'vía visible en tiroides');
const paraSlot = p.slots.find((s) => s.id === 'para_tecnica');
assert(
  sandbox.afProformaSlotIsVisible(paraSlot, values) === false,
  'para_tecnica oculto en tiroides'
);

const ghost = Object.assign({}, values, {
  para_tecnica: 'Targeted',
  para_patologia: 'Adenoma',
  pth_basal: '40',
});
const pruned = sandbox.afProformaPruneValues(p, ghost);
assert(pruned.pth_basal == null && pruned.para_tecnica == null, 'prune limpia rama ajena');
const textoPruned = sandbox.afProformaRender(p, ghost);
assert(textoPruned.indexOf('PTH basal') < 0 && textoPruned.indexOf('Targeted') < 0, 'render ignora valores fantasma');

const textoPara = sandbox.afProformaRender(p, {
  procedimiento_grupo: 'Paratiroidectomía',
  para_tecnica: 'Targeted',
  para_patologia: 'Adenoma',
  para_lado: 'Izquierdo',
  para_cantidad: 'Única',
  para_ubicacion: ['Inferior'],
  intubacion: 'Orotraqueal estándar',
  nlr: 'Identificado y preservado',
  pth_basal: '80',
  pth_post: '20',
  pth_pct: '75',
});
assert(textoPara.indexOf('Paratiroidectomía') >= 0, 'para: menciona rama');
assert(textoPara.indexOf('PTH basal 80') >= 0, 'para: incluye PTH');
assert(textoPara.indexOf('Sistrunk') < 0, 'para: sin Sistrunk');
assert(textoPara.indexOf('Vía / abordaje') < 0, 'para: sin vía de tiroides');

const textoSis = sandbox.afProformaRender(p, {
  procedimiento_grupo: 'Resección de quiste tirogloso (Sistrunk)',
  intubacion: 'Orotraqueal estándar',
});
assert(textoSis.indexOf('Sistrunk') >= 0, 'sistrunk: menciona técnica');
assert(textoSis.indexOf('PTH basal') < 0 && textoSis.indexOf('PTH post') < 0, 'sistrunk: sin PTH');
assert(textoSis.indexOf('Vía / abordaje') < 0, 'sistrunk: sin vía');

const arm = sandbox.afProformaArmar(p, values, 'usar');
assert(arm.proforma_id === p.id && arm.modo_armado === 'usar' && arm.texto === texto, 'armar usar');

const cero = sandbox.afProformaArmar(null, { _texto: 'libre' }, 'cero');
assert(cero.modo_armado === 'cero' && cero.texto === 'libre', 'armar cero');

if (failed) {
  console.error(failed + ' fallos');
  process.exit(1);
}
console.log('ALL OK');
