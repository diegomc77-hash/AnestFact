/**
 * Lote B: hub Instituciones alineado con home-san; 3 públicos no van a Otros.
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

const KEYS = ['mayo', 'aero', 'cordoba', 'misericordia', 'san_roque', 'otro'];
const hubSrc = read('js/07-intervenciones.js');
const homeSrc = read('views/home.html');
const cssSrc = read('styles.css');
const topbar = read('views/topbar.html');
const vista = read('views/sanatorios.html');
const state = read('js/01-state.js');

if (topbar.indexOf('>Sanat.<') >= 0) fail('dock todavía dice Sanat.');
if (topbar.indexOf('>Instit.<') < 0) fail('dock debe decir Instit.');
if (vista.indexOf('>Sanatorios<') >= 0) fail('vista todavía dice Sanatorios');
if (vista.indexOf('>Instituciones<') < 0) fail('título de vista debe ser Instituciones');
if (!/sanatorios:'Instituciones'/.test(state)) fail('TITLES.sanatorios debe ser Instituciones');
if (homeSrc.indexOf('Todos los sanatorios') >= 0) fail('filtro Fojas: Todos los sanatorios');
if (homeSrc.indexOf('Todas las instituciones') < 0) fail('filtro Fojas: Todas las instituciones');

KEYS.forEach(function (k) {
  if (k === 'mayo' || k === 'aero' || k === 'otro') return;
  if (hubSrc.indexOf("k:'" + k + "'") < 0) fail('hub sin clave ' + k);
  if (homeSrc.indexOf('value="' + k + '"') < 0) fail('home-san sin value ' + k);
});
if (cssSrc.indexOf('--san-cordoba:') < 0) fail('falta --san-cordoba');
if (cssSrc.indexOf('--san-misericordia:') < 0) fail('falta --san-misericordia');
if (cssSrc.indexOf('--san-san-roque:') < 0) fail('falta --san-san-roque');
if (cssSrc.indexOf('.inter-san-cordoba') < 0) fail('falta clase inter-san-cordoba');

const PALETTE = {
  '--san-san-roque': '#0d9488',
  '--san-mayo': '#0ea5e9',
  '--san-cordoba': '#2563eb',
  '--san-aero': '#8b5cf6',
  '--san-misericordia': '#c026d3',
  '--san-allende': '#db2777',
  '--san-otro': '#64748b'
};
Object.keys(PALETTE).forEach(function (name) {
  var re = new RegExp(name.replace(/-/g, '\\-') + ':\\s*(' + PALETTE[name] + ')\\b', 'i');
  if (!re.test(cssSrc)) fail('paleta ' + name + ' debe ser ' + PALETTE[name]);
});
if (hubSrc.indexOf("c:'var(--san-mayo)'") < 0) fail('hub Mayo no usa var(--san-mayo)');
if (hubSrc.indexOf("c:'var(--san-aero)'") < 0) fail('hub Aero no usa var(--san-aero)');
if (hubSrc.indexOf("c:'var(--san-cordoba)'") < 0) fail('hub Córdoba no usa var(--san-cordoba)');
if (hubSrc.indexOf("c:'var(--san-misericordia)'") < 0) fail('hub Misericordia no usa var(--san-misericordia)');
if (hubSrc.indexOf("c:'var(--san-san-roque)'") < 0) fail('hub San Roque no usa var(--san-san-roque)');
if (hubSrc.indexOf("c:'var(--san-otro)'") < 0) fail('hub Otros no usa var(--san-otro)');

const context = {
  console,
  String,
  Array,
  Object,
  Date,
  Number,
  Error,
  S: { intervs: [], cur: null, hist: ['home'], listMode: 'fojas' },
  document: {
    getElementById: function () { return { value: '', selectedIndex: 0 }; }
  }
};
vm.createContext(context);
vm.runInContext(hubSrc, context);

function eq(got, want, msg) {
  if (got !== want) fail(msg + ': got ' + got + ' want ' + want);
}

eq(context.afSanFilterKey('Hospital Córdoba'), 'cordoba', 'Córdoba');
eq(context.afSanFilterKey('Hospital Misericordia'), 'misericordia', 'Misericordia');
eq(context.afSanFilterKey('Hospital San Roque'), 'san_roque', 'San Roque');
eq(context.afSanFilterKey('Sanatorio Mayo'), 'mayo', 'Mayo');
eq(context.afSanFilterKey('Hospital Aeronáutico'), 'aero', 'Aero');
eq(context.afSanFilterKey('Sanatorio Allende Nueva Córdoba'), 'otro', 'Allende no es Córdoba');
eq(context.afSanFilterKey(''), 'otro', 'vacío');
eq(context.afSanatorioCssClass('Hospital Córdoba'), 'inter-san-cordoba', 'css Córdoba');
eq(context.afSanatorioCssClass('Hospital Misericordia'), 'inter-san-misericordia', 'css Misericordia');
eq(context.afSanatorioCssClass('Hospital San Roque'), 'inter-san-san-roque', 'css San Roque');

process.stdout.write('OK    hub=home-san; Córdoba/Misericordia/Roque ≠ Otros; Allende no pisa Córdoba\n');
