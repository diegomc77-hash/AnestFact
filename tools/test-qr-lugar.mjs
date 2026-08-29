/**
 * QR lugar: token gana sobre extras Mayo; pie Mayo vs Córdoba; persistencia.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'js', '31-valoracion-qr.js'), 'utf8');
const submitSrc = fs.readFileSync(
  path.join(root, 'supabase', 'functions', 'af-qr-submit', 'index.ts'),
  'utf8'
);

function fail(msg) {
  process.stderr.write('FAIL  ' + msg + '\n');
  process.exit(1);
}

if (!/const ctxSan = String\(ctx\.sanatorio/.test(submitSrc) ||
    !/const sanatorio = ctxSan \|\| extrasSan/.test(submitSrc)) {
  fail('af-qr-submit no prioriza ctx.sanatorio');
}

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
  AfSanatoriosPlan: {
    selectNames: function () {
      return ['Hospital Aeronáutico', 'Sanatorio Mayo', 'Hospital Córdoba'];
    }
  },
  URLSearchParams,
  toast: function () {}
};
vm.createContext(context);
vm.runInContext(src, context);

const win = context.afQrSanatorioDesdeToken(
  { sanatorio: 'Hospital Córdoba' },
  { sanatorio: 'Sanatorio Mayo' }
);
if (win !== 'Hospital Córdoba') fail('token debe ganar: ' + win);

const mayo = context.afQrSanatorioDesdeToken(
  { sanatorio: 'Sanatorio Mayo' },
  { sanatorio: 'Sanatorio Mayo' }
);
if (mayo !== 'Sanatorio Mayo') fail('Mayo+Mayo: ' + mayo);

const legacy = context.afQrSanatorioDesdeToken({}, { sanatorio: 'Sanatorio Mayo' });
if (legacy !== 'Sanatorio Mayo') fail('legacy extras: ' + legacy);

const importSan = context.afQrSanatorioDesdeToken(
  { sanatorio: 'Hospital Córdoba' },
  { sanatorio: 'Sanatorio Mayo' }
);
const fojaSan = importSan || 'Sanatorio Mayo';
if (fojaSan !== 'Hospital Córdoba') fail('foja importada sería ' + fojaSan);

context.afQrLugarGuardar('Hospital Córdoba');
if (context.afQrLugarActual() !== 'Hospital Córdoba') fail('persist Córdoba');

const pieMayo = context.afQrPieTarjeta('Sanatorio Mayo', {
  single_use: true,
  expires_at: '2026-08-30T12:00:00.000Z'
});
if (pieMayo.indexOf('Mayo · un uso') < 0) fail('pie Mayo: ' + pieMayo);

const pieCba = context.afQrPieTarjeta('Hospital Córdoba', {
  single_use: true,
  expires_at: '2026-08-30T12:00:00.000Z'
});
if (pieCba.indexOf('Hospital Córdoba') < 0 || pieCba.indexOf('Sanatorio Mayo') >= 0) {
  fail('pie Córdoba: ' + pieCba);
}

process.stdout.write('OK    token gana sobre Mayo; foja Córdoba; pie Mayo intacto\n');
process.stdout.write('      pie Córdoba: ' + pieCba + '\n');
