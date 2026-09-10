/**
 * Lote 1 — texto A4 de antecedentes + mutex del sentinel.
 * Nombre de prueba / DNI ficticio only.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NEG = 'Sin antecedentes patológicos referidos';

function fail(msg) {
  process.stderr.write('FAIL  ' + msg + '\n');
  process.exit(1);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const tecHtml = read('views/foja/tecnica.html');
if (tecHtml.indexOf('id="antec-chips-tec"') < 0) fail('falta #antec-chips-tec');
if (tecHtml.indexOf('id="fj-antec-otros"') < 0) fail('falta #fj-antec-otros');
if (tecHtml.indexOf('data-antec="' + NEG + '"') < 0) fail('falta chip sentinel en Técnica');
['HTA', 'DBT', 'Anticoagulado', 'Fumador'].forEach(function (c) {
  if (tecHtml.indexOf('data-antec="' + c + '"') < 0) fail('falta chip ' + c + ' en Técnica');
});

const mayoHtml = read('views/foja/mayo-geclisa.html');
if (mayoHtml.indexOf('data-antec="' + NEG + '"') < 0) fail('falta chip sentinel en Mayo');
if (mayoHtml.indexOf('oninput="onAntecOtrosInput()"') < 0) fail('Mayo obs_geclisa debe disparar mutex al tipear');

const printSrc = read('js/12-imprimir-aero.js');
if (printSrc.indexOf('afTextoAntecedentesFoja') < 0) fail('A4 debe llamar afTextoAntecedentesFoja');
if (!/_printChartH\(i,\s*124\)/.test(printSrc)) fail('A4 debe compensar gráfico a 124px');
if (/_printChartH\(i,\s*140\)/.test(printSrc)) fail('A4 todavía usa 140px de gráfico');

const fojaSrc = read('js/08-foja.js');
if (!/antec_otros:gv\('fj-antec-otros'\)/.test(fojaSrc)) fail('flush debe persistir antec_otros');
if (fojaSrc.indexOf('antec_negados:') < 0) fail('flush debe persistir antec_negados');
if (!/restaurarAntecedentes\(f\.antecedentes\|\|\[\],f\)/.test(fojaSrc)) fail('cargarFojaUI debe pasar foja a restaurarAntecedentes');
if (!/restaurarAntecedentes\(\[\]\s*,\s*\{\}\)/.test(fojaSrc)) fail('resetFojaUIDom no debe rehidratar desde S.cur');

const reglas = read('js/23-reglas-clinicas.js');
if (reglas.indexOf('afAntecedentesClinicos') < 0) fail('reglas clínicas deben ignorar el sentinel');
if (reglas.indexOf('antec_otros') < 0) fail('reglas clínicas deben leer antec_otros');

const src = read('js/22-tecnica.js');
const start = src.indexOf('var _antecedentes=[];');
const end = src.indexOf('// === GENERADOR DE CURVA DE SIGNOS VITALES ===');
if (start < 0 || end < 0) fail('no se pudo recortar helpers de 22-tecnica.js');

const otros = { value: '' };
const obs = { value: '' };
const chips = [
  { getAttribute: function (k) { return k === 'data-antec' ? 'HTA' : null; }, textContent: 'HTA', style: {} },
  { getAttribute: function (k) { return k === 'data-antec' ? NEG : null; }, textContent: NEG, style: {} }
];
const ctx = {
  console,
  String,
  Array,
  document: {
    getElementById: function (id) {
      if (id === 'fj-antec-otros') return otros;
      if (id === 'fj-obs-geclisa') return obs;
      if (id === 'fj-tec-tipo') return null;
      return null;
    },
    querySelectorAll: function () { return chips; }
  }
};
vm.createContext(ctx);
vm.runInContext(src.slice(start, end), ctx);

function eq(got, want, label) {
  if (got !== want) fail(label + ': got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want));
}

eq(ctx.afTextoAntecedentesFoja({}), 'Antecedentes: (no consignados)', 'vacío');
eq(
  ctx.afTextoAntecedentesFoja({ antec_negados: true }),
  'Antecedentes: Sin antecedentes patológicos referidos.',
  'negados por flag'
);
eq(
  ctx.afTextoAntecedentesFoja({ antecedentes: [NEG] }),
  'Antecedentes: Sin antecedentes patológicos referidos.',
  'negados por chip'
);
eq(
  ctx.afTextoAntecedentesFoja({ antecedentes: ['HTA', 'DBT'] }),
  'Antecedentes: HTA, DBT.',
  'chips'
);
eq(
  ctx.afTextoAntecedentesFoja({ antecedentes: ['HTA'], antec_otros: 'asma infantil' }),
  'Antecedentes: HTA. Otros: asma infantil.',
  'chips + otros'
);
eq(
  ctx.afTextoAntecedentesFoja({ antec_otros: 'asma infantil' }),
  'Antecedentes: Otros: asma infantil.',
  'solo otros'
);
eq(
  ctx.afTextoAntecedentesFoja({ antecedentes: ['HTA', NEG], antec_negados: true }),
  'Antecedentes: HTA.',
  'patología gana al sentinel'
);

ctx._antecedentes = ['HTA'];
otros.value = 'x';
obs.value = 'Antecedentes: HTA. nota mayo';
ctx.toggleAntec(chips[1], NEG);
if (ctx._antecedentes.length !== 1 || ctx._antecedentes[0] !== NEG) {
  fail('mutex: sentinel debe dejar solo el chip de negados, got ' + JSON.stringify(ctx._antecedentes));
}
if (otros.value !== '') fail('mutex: sentinel debe vaciar fj-antec-otros');
if (obs.value !== 'Antecedentes: ' + NEG + '. ') {
  fail('mutex: sentinel debe reescribir obs_geclisa, got ' + JSON.stringify(obs.value));
}

ctx.toggleAntec(chips[0], 'HTA');
if (ctx._antecedentes.indexOf(NEG) >= 0) fail('mutex: chip clínico debe sacar el sentinel');
if (ctx._antecedentes.indexOf('HTA') < 0) fail('mutex: debe quedar HTA');

ctx._antecedentes = [NEG];
otros.value = 'asma infantil';
ctx.onAntecOtrosInput();
if (ctx._antecedentes.indexOf(NEG) >= 0) fail('tipear otros debe sacar el sentinel');

process.stdout.write('OK    antec foja (texto A4 + mutex)\n');
