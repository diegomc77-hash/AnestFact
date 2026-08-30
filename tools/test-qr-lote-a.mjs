/**
 * Lote A: peek no cae a Mayo; cfg/badge; contador por institución; sin nómina Mayo en públicos.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  process.stderr.write('FAIL  ' + msg + '\n');
  process.exit(1);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const peekSrc = read('supabase/functions/af-qr-peek/index.ts');
if (/Sanatorio Mayo/.test(peekSrc)) fail('af-qr-peek no debe mencionar Mayo');
if (!/const sanatorio = String\(ctx\.sanatorio \|\| ''\)\.trim\(\)/.test(peekSrc)) {
  fail('af-qr-peek debe usar contexto.sanatorio sin fallback');
}
if (!/select\('expires_at, activo, contexto'\)/.test(peekSrc)) {
  fail('af-qr-peek no debe devolver PII extra');
}

const formSrc = read('js/valoracion-form.js');
if (/var SANATORIO = 'Sanatorio Mayo'/.test(formSrc)) fail('form no debe inicializar Mayo');
if (/applyMayoCfg/.test(formSrc)) fail('applyMayoCfg debió renombrarse');
if (!/\.catch\(function \(\) \{ return ''; \}\)/.test(formSrc)) {
  fail('peek fallido debe devolver cadena vacía');
}

const cfgSrc = read('data/valoracion/cfg-instituciones.js');
const fojaSrc = read('data/instituciones-foja.js');
const qrSrc = read('js/31-valoracion-qr.js');
const ciruSrc = read('data/cirujanos-esp.js');

const storage = {};
const context = {
  console,
  Date,
  JSON,
  String,
  Array,
  Object,
  Number,
  Error,
  Intl,
  document: {
    getElementById: function () { return null; },
    createElement: function () { return { appendChild: function () {} }; },
    body: { appendChild: function () {}, classList: { add: function () {}, remove: function () {} } },
    head: { appendChild: function () {} }
  },
  window: { addEventListener: function () {}, location: { pathname: '/AnestFact/', origin: 'https://x' } },
  location: { pathname: '/AnestFact/', origin: 'https://x' },
  navigator: {},
  localStorage: {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null; },
    setItem: function (k, v) { storage[k] = String(v); }
  },
  AF_AUTH: { isLoggedIn: function () { return true; }, getUserId: function () { return 'uid-test'; } },
  afUserSuffix: function () { return '_uid-test'; },
  toast: function () {}
};
vm.createContext(context);
vm.runInContext(ciruSrc, context);
vm.runInContext(fojaSrc, context);
vm.runInContext(cfgSrc, context);
vm.runInContext(qrSrc, context);

const emptyCfg = context.afValoracionCfg('');
if (emptyCfg.label === 'Sanatorio Mayo' || emptyCfg.id === 'mayo') {
  fail('cfg vacío no debe ser Mayo: ' + JSON.stringify(emptyCfg));
}
if (context.afValoracionBadgeTexto('') !== '') fail('badge peek-fail debe ser vacío');
if (context.afValoracionBadgeTexto('Hospital Córdoba') !== 'Institución: Hospital Córdoba') {
  fail('badge Córdoba: ' + context.afValoracionBadgeTexto('Hospital Córdoba'));
}
if (context.afValoracionBadgeTexto('Sanatorio Mayo') !== 'Institución: Sanatorio Mayo') {
  fail('badge Mayo intacto');
}

const cba = context.afValoracionCfg('Hospital Córdoba');
if (cba.id !== 'h_cordoba' || cba.label !== 'Hospital Córdoba' || cba.cirujanosSource) {
  fail('cfg Córdoba: ' + JSON.stringify(cba));
}
if (cba.id === 'mayo') fail('cfg_id Córdoba no puede ser mayo');

const specCba = context.afValoracionEspecialidadesParaLugar('Hospital Córdoba');
if (specCba.indexOf('Cirugía General') < 0) fail('especialidad Córdoba ausente');
const ciruCba = context.getCirujanosMapForLugar('Hospital Córdoba');
if ((ciruCba['Cirugía General'] || []).indexOf('Prof. Dr. José A. Cooke') < 0) {
  fail('Córdoba debe autocompletar su nómina');
}

const specMayo = context.afValoracionEspecialidadesParaLugar('Sanatorio Mayo');
if (specMayo.indexOf('Cirugía General') < 0) fail('Mayo debe seguir con especialidades del catálogo');
const ciruMayo = context.getCirujanosMapForLugar('Sanatorio Mayo');
const mayoNames = (ciruMayo['Cirugía General'] || []).join(' ');
if (mayoNames.indexOf('COOKE') < 0) fail('Mayo debe conservar su nómina');
const specMis = context.afValoracionEspecialidadesParaLugar('Hospital Misericordia');
if (specMis.indexOf('Cirugía General') < 0) fail('Misericordia QR usa catálogo');
if ((context.getCirujanosMapForLugar('Hospital Misericordia')['Cirugía General'] || []).indexOf('Dr. Fernando Craievich') < 0) {
  fail('Misericordia debe autocompletar');
}
const specRoque = context.afValoracionEspecialidadesParaLugar('Hospital San Roque');
if (specRoque.indexOf('Proctología') < 0) fail('San Roque sigue lista genérica');
if (Object.keys(context.getCirujanosMapForLugar('Hospital San Roque') || {}).length) {
  fail('San Roque no debe tener catálogo');
}
if (specMayo.indexOf('Proctología') >= 0) fail('Mayo no debe listar especialidades sin nómina');

const kMayo = context.afQrOrdenKey('Sanatorio Mayo');
const kCba = context.afQrOrdenKey('Hospital Córdoba');
const kMis = context.afQrOrdenKey('Hospital Misericordia');
if (kMayo === kCba || kCba === kMis) fail('claves de orden no son por institución: ' + kMayo + ' / ' + kCba);
if (kMayo.indexOf('_mayo') < 0) fail('clave Mayo: ' + kMayo);
if (kCba.indexOf('_h_cordoba') < 0) fail('clave Córdoba: ' + kCba);
if (kMis.indexOf('_h_misericordia') < 0) fail('clave Misericordia: ' + kMis);

const n1 = context.afNextQrOrdenDia('Hospital Córdoba');
const n2 = context.afNextQrOrdenDia('Hospital Córdoba');
const m1 = context.afNextQrOrdenDia('Sanatorio Mayo');
if (n1 !== 1 || n2 !== 2) fail('contador Córdoba: ' + n1 + ',' + n2);
if (m1 !== 1) fail('contador Mayo debe ser independiente, arranca en 1, fue ' + m1);

process.stdout.write('OK    peek sin Mayo; badge vacío si falla; cfg_id Córdoba; contador por lugar\n');
process.stdout.write('      ' + kCba + ' vs ' + kMayo + '\n');
