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

// Redacción afirmativa (Huerta): sin listas de opciones ni condicionales vagos
assert(texto.indexOf('según la vía elegida') < 0, 'tiroides: sin lista de vías');
assert(texto.indexOf('TOETVA /') < 0 && texto.indexOf('/ ablación') < 0, 'tiroides: sin otras vías en prosa');
assert(texto.indexOf('cuando corresponde') < 0, 'tiroides: sin «cuando corresponde»');
assert(texto.indexOf('si aplica') < 0, 'tiroides: sin «si aplica»');
assert(texto.indexOf('Se desarrolla la técnica por vía convencional (abierta).') >= 0, 'tiroides: vía afirmativa');
assert(texto.indexOf('Exéresis con identificación de paratiroides.') >= 0, 'tiroides: exéresis afirmativa');
assert(texto.indexOf('Se utilizó neuromonitoreo intraoperatorio (NIM).') >= 0, 'tiroides: NIM afirmativo');

const textoSinNim = sandbox.afProformaRender(p, {
  procedimiento_grupo: 'Cirugía de tiroides (vía + extensión)',
  via: 'Convencional (abierta)',
  extension: 'Tiroidectomía total',
  intubacion: 'Orotraqueal estándar',
  nlr: 'Identificado y preservado',
  aparatologia: ['Bisturí ultrasónico'],
});
assert(
  textoSinNim.indexOf('No se utilizó neuromonitoreo intraoperatorio.') >= 0,
  'tiroides: aparatología sin NIM → afirmación de no uso'
);
assert(
  textoSinNim.indexOf('Biopsia por congelación: no consignada') >= 0,
  'tiroides: biopsia vacía → neutral (no afirmar No se realizó)'
);
assert(
  textoSinNim.indexOf('No se realizó biopsia') < 0,
  'tiroides: sin negación inventada de biopsia'
);

const textoAparaVacia = sandbox.afProformaRender(p, {
  procedimiento_grupo: 'Cirugía de tiroides (vía + extensión)',
  via: 'Convencional (abierta)',
  extension: 'Tiroidectomía total',
  intubacion: 'Orotraqueal estándar',
  nlr: 'Identificado y preservado',
});
assert(
  textoAparaVacia.indexOf('Neuromonitoreo: no consignado.') >= 0,
  'tiroides: aparatología vacía → neuromonitoreo neutral'
);
assert(
  textoAparaVacia.indexOf('No se utilizó neuromonitoreo') < 0,
  'tiroides: aparatología vacía → no inventar No se utilizó NIM'
);

const textoAbl = sandbox.afProformaRender(p, {
  procedimiento_grupo: 'Cirugía de tiroides (vía + extensión)',
  via: 'Ablativa (percutánea)',
  extension_ablativa: 'Nodulectomía por ablación',
  intubacion: 'Orotraqueal estándar',
  nlr: 'Identificado y preservado',
});
assert(textoAbl.indexOf('Ablación de la lesión.') >= 0, 'ablativa: Ablación, no Exéresis');
assert(textoAbl.indexOf('Exéresis') < 0, 'ablativa: sin palabra Exéresis');

const textoCm = sandbox.afProformaRender(p, {
  procedimiento_grupo: 'Cirugía de tiroides (vía + extensión)',
  via: 'Convencional (abierta)',
  extension: 'Tiroidectomía total',
  intubacion: 'Orotraqueal estándar',
  nlr: 'Identificado y preservado',
  hallazgo_tamano: '2cm',
});
assert(textoCm.indexOf('2cm cm') < 0, 'tiroides: sin unidad duplicada 2cm cm');
assert(textoCm.indexOf('lesión de 2 cm') >= 0, 'tiroides: sanitiza 2cm → 2 cm');

const textoToetva = sandbox.afProformaRender(p, {
  procedimiento_grupo: 'Cirugía de tiroides (vía + extensión)',
  via: 'TOETVA',
  extension: 'Hemitiroidectomía',
  lado: 'Izquierdo',
  intubacion: 'Orotraqueal estándar',
  nlr: 'Identificado y preservado',
});
assert(textoToetva.indexOf('vía TOETVA') >= 0, 'TOETVA: vía afirmativa');
assert(textoToetva.indexOf('Convencional') < 0, 'TOETVA: sin mencionar convencional');
assert(textoToetva.indexOf('ablativa') < 0 && textoToetva.indexOf('Ablación') < 0, 'TOETVA: sin ablativa');

// Salivales: mon_facial + Enucleación
const sal = sandbox.afProformaById('cyc-salivales-v1');
const textoSalVacio = sandbox.afProformaRender(sal, {
  procedimiento: 'Enucleación extracapsular',
  lateralidad: 'Derecha',
  facial_estado: 'Íntegro y funcional',
});
assert(
  textoSalVacio.indexOf('Neuromonitoreo facial: no consignado.') >= 0,
  'salivales: mon vacío → neutral'
);
assert(
  textoSalVacio.indexOf('Neuromonitoreo continuo') < 0,
  'salivales: mon vacío → no afirma continuo'
);
assert(
  textoSalVacio.indexOf('Enucleación extracapsular de la lesión') >= 0,
  'salivales: rama Enucleación presente'
);
assert(
  textoSalVacio.indexOf('tragus') < 0 && textoSalVacio.indexOf('Wharton') < 0,
  'salivales: Enucleación sin texto parótida/submaxilar'
);

const textoSalMon = sandbox.afProformaRender(sal, {
  procedimiento: 'Parotidectomía superficial',
  lateralidad: 'Izquierda',
  facial_estado: 'Íntegro y funcional',
  mon_facial: ['Frontal', 'Orbicular'],
});
assert(
  textoSalMon.indexOf('Neuromonitoreo continuo del nervio facial (canales Frontal, Orbicular).') >= 0,
  'salivales: mon filled → continuo'
);

// Oncología: required_if_reseccion_includes + if_filled
const onc = sandbox.afProformaById('cyc-oncologia-reconstruccion-v1');
const gExt = onc.slots.find((x) => x.id === 'glosectomia_ext');
assert(
  sandbox.afProformaSlotIsVisible(gExt, { reseccion: ['Glosectomía'] }) === true,
  'onc: glosectomia_ext visible si reseccion includes Glosectomía'
);
assert(
  sandbox.afProformaSlotIsVisible(gExt, { reseccion: ['Mandibulectomía'] }) === false,
  'onc: glosectomia_ext oculto sin Glosectomía'
);
const textoOnc = sandbox.afProformaRender(onc, {
  reseccion: ['Glosectomía'],
  glosectomia_ext: 'Parcial',
  recon_modo: 'Colgajo libre',
});
assert(textoOnc.indexOf('Glosectomía: Parcial.') >= 0, 'onc: extensión glosa en texto');
assert(textoOnc.indexOf('Anastomosis:') < 0, 'onc: sin anastomosis si vacía');
assert(textoOnc.indexOf('Márgenes por congelación') < 0, 'onc: sin márgenes si vacíos');
assert(textoOnc.indexOf('Bloqueo intermaxilar') < 0, 'onc: N/A');

// RIFO: sin afirmación fija de bloqueo; focos solo si filled
const rifo = sandbox.afProformaById('cyc-rifo-v1');
const textoRifo = sandbox.afProformaRender(rifo, {
  fractura_grupo: ['Mandibular'],
  mandib_sitio: ['Cuerpo'],
  mandib_lado: 'Derecho',
  intubacion: 'Nasotraqueal',
  oclusion: 'Oclusión estable',
});
assert(textoRifo.indexOf('Bloqueo intermaxilar') < 0, 'rifo: sin Bloqueo fijo');
assert(textoRifo.indexOf('CNEO') < 0 && textoRifo.indexOf('Maxilar:') < 0, 'rifo: sin focos no elegidos');
assert(textoRifo.indexOf('Mandíbula: Cuerpo (Derecho).') >= 0, 'rifo: solo mandibular filled');

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
