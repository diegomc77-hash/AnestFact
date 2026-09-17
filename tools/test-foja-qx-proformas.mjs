/**
 * Tests Node del motor de proformas (CyC tiroides v2 + condicionales).
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
assert(p.operaciones.indexOf('Sistrunk') < 0 && !p.operaciones.some((o) => /Sistrunk|Istmectomía/.test(o)), 'ops: sin Sistrunk/Istmectomía');
assert(p.slots.some((s) => s.id === 'variante'), 'slot variante top-level');

const varSlot = p.slots.find((s) => s.id === 'variante');
assert(sandbox.afProformaSlotIsRequired(varSlot, {}) === true, 'variante siempre required');

const nimDer = p.slots.find((s) => s.id === 'senal_nim_derecha');
assert(
  sandbox.afProformaSlotIsRequired(nimDer, {
    variante: 'Tiroidectomía total con neuromonitoreo',
  }) === true,
  'NIM der required en V1'
);
assert(
  sandbox.afProformaSlotIsRequired(nimDer, {
    variante: 'Tiroidectomía total sin neuromonitoreo',
  }) === false,
  'NIM der no required en V2'
);

const valuesV1 = {
  variante: 'Tiroidectomía total con neuromonitoreo',
  caracteristica_glandula_v1: 'Multinodular',
  signos_tiroiditis: 'Sin signos de tiroiditis',
  tamano_nodulo_cm: '2cm',
  lado_nodulo_predominante: 'Derecho',
  senal_nim_derecha: 'Positiva',
  senal_nim_izquierda: 'Adecuada',
  hallazgo_exploracion: 'Sin adenopatías ni lesiones adicionales',
  nodulo_adherencias: 'Sin adherencias',
  nervio_recurrente_estado_derecha: 'Identificado y preservado',
  nervio_recurrente_estado_izquierda: 'Identificado y preservado',
  paratiroides_estado_sd: 'Identificada y preservada in situ',
  paratiroides_estado_id: 'Identificada y preservada in situ',
  paratiroides_estado_si: 'Identificada y preservada in situ',
  paratiroides_estado_ii: 'Identificada y preservada in situ',
  cierre_muscular_posible: 'Cierre muscular posible',
  material_muscular_subcutaneo: 'Vicryl 3-0',
  material_piel: 'Nylon 4-0',
  tecnica_sutura: 'Puntos separados',
  tipo_drenaje_v1: 'Sin drenaje',
};
const missing = sandbox.afProformaMissingRequired(p, valuesV1);
assert(missing.length === 0, 'V1 sin faltantes (' + missing.join(',') + ')');

const texto = sandbox.afProformaRender(p, valuesV1);
assert(texto.indexOf('{{') < 0, 'V1: sin placeholders crudos');
assert(texto.indexOf('neuromonitoreo') >= 0, 'V1: menciona neuromonitoreo');
assert(texto.indexOf('incisión cervical transversa tipo Kocher') >= 0, 'V1: Kocher fijo');
assert(texto.indexOf('polo superior de lóbulo derecho') >= 0, 'V1: marca polo der fija');
assert(texto.indexOf('Sistrunk') < 0, 'V1: sin Sistrunk');
assert(texto.indexOf('PTH basal') < 0, 'V1: sin PTH');
assert(texto.indexOf('2cm cm') < 0, 'V1: sin unidad duplicada 2cm cm');
assert(texto.indexOf('Nódulo predominante de 2 cm') >= 0, 'V1: sanitiza 2cm → 2 cm');
assert(texto.indexOf('Señal NIM derecha: Positiva') >= 0, 'V1: NIM der');
assert(texto.indexOf('TOETVA') < 0, 'V1: sin TOETVA');
assert(texto.indexOf('Ablación') < 0 && texto.indexOf('ablación') < 0, 'V1: sin ablación');

const textoV2 = sandbox.afProformaRender(p, {
  variante: 'Tiroidectomía total sin neuromonitoreo',
  caracteristica_glandula_v2: 'Nodular',
  signos_tiroiditis: 'Sin signos de tiroiditis',
  tamano_nodulo_cm: '3',
  lado_nodulo_predominante: 'Izquierdo',
  hallazgo_exploracion: 'Sin adenopatías ni lesiones adicionales',
  nodulo_adherencias: 'Sin adherencias',
  nervio_recurrente_estado_derecha: 'Identificado y preservado',
  nervio_recurrente_estado_izquierda: 'Identificado y preservado',
  paratiroides_estado_sd: 'Identificada y preservada in situ',
  paratiroides_estado_id: 'Identificada y preservada in situ',
  paratiroides_estado_si: 'Identificada y preservada in situ',
  paratiroides_estado_ii: 'Identificada y preservada in situ',
  cierre_muscular_posible: 'Cierre muscular posible',
  material_muscular_subcutaneo: 'Vicryl 3-0',
  material_piel: 'Nylon 4-0',
  tecnica_sutura: 'Puntos separados',
  tipo_drenaje_v2: 'Sin drenaje',
});
assert(textoV2.indexOf('sin neuromonitoreo') >= 0, 'V2: identificación sin NIM');
assert(textoV2.indexOf('Señal NIM') < 0, 'V2: sin líneas Señal NIM');
assert(textoV2.indexOf('Colocación de electrodos de neuromonitoreo') < 0, 'V2: sin electrodos NIM');

const textoHemi = sandbox.afProformaRender(p, {
  variante: 'Hemitiroidectomía',
  usa_nim: 'Sí',
  lado_hemitiroidectomia: 'Derecho',
  signos_tiroiditis: 'Sin signos de tiroiditis',
  tamano_nodulo_cm: '1.5',
  caracteristicas_nodulo: 'Sólido',
  hallazgo_exploracion: 'Sin adenopatías ni lesiones adicionales',
  nodulo_adherencias: 'Sin adherencias',
  nervio_recurrente_estado_hemi: 'Identificado y preservado',
  senal_nim_hemi: 'Positiva',
  paratiroides_estado_hemi_sup: 'Identificada y preservada in situ',
  paratiroides_estado_hemi_inf: 'Identificada y preservada in situ',
  cierre_muscular_posible: 'Cierre muscular posible',
  material_muscular_subcutaneo: 'Vicryl 3-0',
  material_piel: 'Nylon 4-0',
  tecnica_sutura: 'Puntos separados',
  tipo_drenaje_hemi: 'Sin drenaje',
});
assert(textoHemi.indexOf('hemitiroidectomía lado Derecho') >= 0, 'hemi: lado');
assert(textoHemi.indexOf('electrodos de neuromonitoreo') >= 0, 'hemi: NIM si usa_nim Sí');
assert(textoHemi.indexOf('Señal NIM: Positiva') >= 0, 'hemi: señal');
assert(textoHemi.indexOf('tiroidectomía total') < 0, 'hemi: sin total');

const textoPara = sandbox.afProformaRender(p, {
  variante: 'Paratiroidectomía',
  paratiroidectomia_alcance: 'Unilateral',
  paratiroidectomia_lado: 'Izquierdo',
  paratiroidectomia_cual: 'Inferior',
  paratiroidectomia_extension: 'Resección de adenoma',
  paratiroides_descripcion: 'Adenoma de 1 cm',
  pth_basal: '80',
  pth_10min: '20',
  pth_caida_porcentaje: '75',
  incluir_evaluacion_nlr_para: 'No',
  cierre_muscular_posible: 'Cierre muscular posible',
  material_muscular_subcutaneo: 'Vicryl 3-0',
  material_piel: 'Nylon 4-0',
  tecnica_sutura: 'Puntos separados',
  tipo_drenaje_para: 'Sin drenaje',
});
assert(textoPara.indexOf('Paratiroidectomía Unilateral') >= 0, 'para: alcance');
assert(textoPara.indexOf('PTH basal 80') >= 0, 'para: PTH basal');
assert(textoPara.indexOf('PTH a los 10 min 20') >= 0, 'para: PTH 10min');
assert(textoPara.indexOf('caída 75 %') >= 0 || textoPara.indexOf('caída 75%') >= 0, 'para: % caída');
assert(textoPara.indexOf('Nervio laríngeo recurrente:') < 0, 'para: NLR oculto si No');
assert(textoPara.indexOf('Sistrunk') < 0, 'para: sin Sistrunk');
assert(textoPara.indexOf('Kocher') >= 0, 'para: menciona Kocher en prosa fija');

const textoToetva = sandbox.afProformaRender(p, {
  variante: 'TOETVA',
  trocar_central_mm: '10',
  co2_mmhg: '6',
  trocar_lateral_mm: '5',
  tamano_nodulo_toetva_cm: '2',
  lado_nodulo_toetva: 'Derecho',
  hallazgo_exploracion: 'Sin adenopatías ni lesiones adicionales',
  nodulo_adherencias: 'Sin adherencias',
  lobulo_abordado_primero: 'Derecho',
  conversion_toetva: 'Sin conversión',
  instrumento_hemostasia: 'Ligasure',
  nervio_recurrente_estado_derecha: 'Identificado y preservado',
  nervio_recurrente_estado_izquierda: 'Identificado y preservado',
  paratiroides_estado_sd: 'Identificada y preservada in situ',
  paratiroides_estado_id: 'Identificada y preservada in situ',
  paratiroides_estado_si: 'Identificada y preservada in situ',
  paratiroides_estado_ii: 'Identificada y preservada in situ',
});
assert(textoToetva.indexOf('incisión en región vestibular inferior') >= 0, 'TOETVA: vestibular literal');
assert(textoToetva.indexOf('trocar de 10 mm') >= 0, 'TOETVA: trocar central');
assert(textoToetva.indexOf('CO₂ a 6 mmHg') >= 0 || textoToetva.indexOf('CO2 a 6 mmHg') >= 0, 'TOETVA: CO2');
assert(textoToetva.indexOf('Sin conversión') < 0 || textoToetva.indexOf('endobag') >= 0, 'TOETVA: rama sin conversión');
assert(textoToetva.indexOf('endobag') >= 0, 'TOETVA: endobag');
assert(textoToetva.indexOf('cervicotomía abierta') < 0, 'TOETVA sin conversión: sin texto conversión');

const textoToetvaConv = sandbox.afProformaRender(p, {
  variante: 'TOETVA',
  trocar_central_mm: '10',
  co2_mmhg: '6',
  trocar_lateral_mm: '5',
  tamano_nodulo_toetva_cm: '2',
  lado_nodulo_toetva: 'Izquierdo',
  hallazgo_exploracion: 'Sin adenopatías ni lesiones adicionales',
  nodulo_adherencias: 'Sin adherencias',
  lobulo_abordado_primero: 'Izquierdo',
  conversion_toetva: 'Convertida a cervicotomía abierta',
  motivo_conversion: 'sangrado',
  instrumento_hemostasia: 'Bisturí armónico',
  nervio_recurrente_estado_derecha: 'Identificado y preservado',
  nervio_recurrente_estado_izquierda: 'Identificado y preservado',
  paratiroides_estado_sd: 'Identificada y preservada in situ',
  paratiroides_estado_id: 'Identificada y preservada in situ',
  paratiroides_estado_si: 'Identificada y preservada in situ',
  paratiroides_estado_ii: 'Identificada y preservada in situ',
  cierre_muscular_posible: 'Cierre muscular posible',
  material_muscular_subcutaneo: 'Vicryl 3-0',
  material_piel: 'Nylon 4-0',
  tecnica_sutura: 'Puntos separados',
  tipo_drenaje_toetva: 'Blake',
});
assert(textoToetvaConv.indexOf('Ante sangrado, se convierte a cervicotomía abierta') >= 0, 'TOETVA conv: motivo');
assert(textoToetvaConv.indexOf('endobag') < 0, 'TOETVA conv: sin endobag');

const baseAbl = {
  variante: 'Ablación percutánea',
  ablacion_lado: 'Derecho',
  ablacion_tamano_a_cm: '2',
  ablacion_tamano_b_cm: '1.5',
  ablacion_caracteristicas: 'Sólido',
  ablacion_ciclos: '3',
  ablacion_watts: '40',
  ablacion_tiempo_min: '8',
  componente_quistico: 'Sin componente quístico',
  hidrodiseccion_realizada: 'No',
  resultado_final_ablacion: 'Sin vascularización interna residual',
  complicacion_hemorragia: 'Sin sangrado significativo',
};
const textoRf = sandbox.afProformaRender(p, Object.assign({}, baseAbl, { tecnica_ablacion: 'Radiofrecuencia' }));
assert(textoRf.indexOf('mediante radiofrecuencia') >= 0, 'Abl RF: literal radiofrecuencia');
assert(textoRf.indexOf('microondas') < 0, 'Abl RF: sin microondas');
assert(textoRf.indexOf('2 cm x 1.5 cm') >= 0 || textoRf.indexOf('2 cm x 1.5') >= 0, 'Abl RF: tamaños con cm');

const textoMw = sandbox.afProformaRender(p, Object.assign({}, baseAbl, { tecnica_ablacion: 'Microondas' }));
assert(textoMw.indexOf('mediante microondas') >= 0, 'Abl MW: literal microondas');
assert(textoMw.indexOf('radiofrecuencia') < 0, 'Abl MW: sin radiofrecuencia');
assert(textoMw.indexOf('buen despertar anestésico') >= 0, 'Abl MW: cierre Huerta');

// Prune: valores de otra variante no aparecen
const ghost = Object.assign({}, valuesV1, {
  tecnica_ablacion: 'Radiofrecuencia',
  pth_basal: '99',
  trocar_central_mm: '10',
});
const pruned = sandbox.afProformaPruneValues(p, ghost);
assert(pruned.pth_basal == null && pruned.tecnica_ablacion == null && pruned.trocar_central_mm == null, 'prune limpia ramas ajenas');
const textoPruned = sandbox.afProformaRender(p, ghost);
assert(textoPruned.indexOf('PTH basal') < 0 && textoPruned.indexOf('radiofrecuencia') < 0, 'render ignora fantasmas');
assert(textoPruned.indexOf('trocar') < 0, 'render V1 sin trocar fantasma');

const arm = sandbox.afProformaArmar(p, valuesV1, 'usar');
assert(arm.proforma_id === p.id && arm.modo_armado === 'usar' && arm.texto === texto, 'armar usar');

const cero = sandbox.afProformaArmar(null, { _texto: 'libre' }, 'cero');
assert(cero.modo_armado === 'cero' && cero.texto === 'libre', 'armar cero');

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

if (failed) {
  console.error(failed + ' fallos');
  process.exit(1);
}
console.log('ALL OK');
