/**
 * Impresiones de prueba (nombre prueba / DNI ficticio).
 * Usa las mismas funciones A4 que la PWA (12-imprimir-aero.js).
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHIPS = [
  'HTA', 'DBT', 'IRC s/diálisis', 'IRC c/diálisis', 'IC', 'Obesidad',
  'EPOC', 'Asma', 'Coronario', 'ACV previo', 'Fumador', 'Anticoagulado'
];
const DECUB = 'Protección de decúbito: puntos de apoyo almohadillados.';
const OCULAR = 'Protección ocular: ungüento oftálmico y cierre palpebral.';
const RELATO = 'Anestesia general balanceada. Bajo estrictas medidas de seguridad, se realiza inducción anestésica. Se procede al manejo de la vía aérea mediante Intubación Orotraqueal con tubo endotraqueal Nº 7 con manguito de baja presión al primer intento, confirmando la correcta colocación mediante capnografía y auscultación simétrica del murmullo vesicular.';

function fail(msg) {
  process.stderr.write('FAIL  ' + msg + '\n');
  process.exit(1);
}

function min2hm(m) {
  var h = Math.floor(m / 60) % 24, mm = m % 60;
  return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
}

function makeVg4h() {
  var cols = [];
  var cells = {};
  var start = 8 * 60;
  var end = 12 * 60;
  var seed = 42;
  function rnd() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  function curva(base, p) {
    return Math.round(base * (1 + Math.sin(p * Math.PI * 5) * 0.12 + (rnd() - 0.5) * 0.08));
  }
  for (var t = start; t <= end; t += 5) {
    var ci = cols.length;
    var p = (t - start) / (end - start || 1);
    cols.push({ t: min2hm(t) });
    var fc = curva(75, p);
    var sist = curva(120, p);
    var sat = Math.min(100, Math.max(90, Math.round(98 + (rnd() - 0.5) * 2)));
    var co2 = Math.round(35 + (rnd() - 0.5) * 3);
    var resp = Math.round(14 + (rnd() - 0.5) * 2);
    cells[ci + '_' + fc] = { param: 'pulso', sym: '\u25cf', val: fc };
    cells[ci + '_' + sist] = { param: 'ta', sym: ')(', val: sist };
    cells[ci + '_' + sat] = { param: 'oximet', sym: '\u2014', val: sat };
    cells[ci + '_' + co2] = { param: 'co2', sym: '\u25a1', val: co2 };
    cells[ci + '_' + resp] = { param: 'resp', sym: '\u25cb', val: resp };
  }
  cells['0_162.5'] = { param: 'operac', sym: '\u25a0' };
  cells[(cols.length - 1) + '_162.5'] = { param: 'operac', sym: '\u25a0' };
  cells['0_175'] = { param: 'anestes', sym: '\u00d7' };
  cells[(cols.length - 1) + '_125'] = { param: 'anestes', sym: '\u00d7' };
  return { cols: cols, cells: cells, obs: {}, fluidos: {} };
}

function loadPrintCtx() {
  var ctx = {
    console: console,
    String: String,
    Array: Array,
    Object: Object,
    Math: Math,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    URL: URL,
    window: { location: { href: 'http://127.0.0.1:8765/' } },
    document: { getElementById: function () { return null; } },
    localStorage: { getItem: function () { return 'ANESTESISTA PRUEBA'; } },
    VG: { cols: [], cells: {}, obs: {}, fluidos: {} },
    S: { cur: null, signData: null },
    AF_ANTEC_NEGADOS: 'Sin antecedentes patológicos referidos'
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'data', 'instituciones-foja.js'), 'utf8'), ctx);
  vm.runInContext(
    'function fmt(iso){if(!iso)return"\\u2014";var p=iso.split("-");return p.length===3?p[2]+"/"+p[1]+"/"+p[0]:iso;}\n',
    ctx
  );
  var tec = fs.readFileSync(path.join(root, 'js', '22-tecnica.js'), 'utf8');
  var a0 = tec.indexOf('function afTextoAntecedentesFoja');
  var a1 = tec.indexOf('function afPaintAntecChips');
  if (a0 < 0 || a1 < 0) fail('no se encontró afTextoAntecedentesFoja');
  vm.runInContext(tec.slice(a0, a1), ctx);
  var p0 = tec.indexOf('function afMetodosSinTags');
  var p1 = tec.indexOf('function afStripProtFromMetodos');
  if (p0 < 0 || p1 < 0) fail('no se encontró afMetodosSinTags');
  vm.runInContext(tec.slice(p0, p1), ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'js', '12-imprimir-aero.js'), 'utf8'), ctx);
  return ctx;
}

function embedAssets(html) {
  return html.replace(/src="([^"]+)"/g, function (m, src) {
    if (src.indexOf('data:') === 0) return m;
    var rel = src.replace(/^https?:\/\/[^/]+\//, '').replace(/^\.\//, '');
    try { rel = decodeURIComponent(rel); } catch (eDec) {}
    var abs = path.join(root, rel.replace(/\//g, path.sep));
    if (!fs.existsSync(abs)) return m;
    var b64 = fs.readFileSync(abs).toString('base64');
    return 'src="data:image/png;base64,' + b64 + '"';
  });
}

function buildHtml(ctx, san) {
  var vg = makeVg4h();
  if (vg.cols.length !== 49) fail('VG 4h debía tener 49 cols, tiene ' + vg.cols.length);
  var f = {
    premed: 'Midazolam 2 mg EV',
    atb: 'Cefazolina 2 g EV',
    mallampati: 'II',
    examenFisico: 'Auscultación respiratoria y cardiovascular sin hallazgos patológicos.',
    ind: 'Satisfactoria',
    hint: '08:00',
    hext: '12:00',
    antecedentes: CHIPS.slice(),
    antec_otros: '',
    antec_negados: false,
    mon_decub: true,
    prot_ocular: true,
    prot_ocular_unguento: true,
    prot_ocular_cierre: true,
    metodos: RELATO + ' ' + DECUB + ' ' + OCULAR,
    recup: 'Aldrete 10/10. Destino sala.',
    sangre: '0',
    plasma: '0',
    suero: '500',
    otro: '',
    obs_hemo: '',
    obs: '',
    drogas: [
      { n: 'Propofol', d: '150 mg', v: 'EV' },
      { n: 'Fentanilo', d: '150 mcg', v: 'EV' },
      { n: 'Rocuronio', d: '50 mg', v: 'EV' },
      { n: 'Sevoflurano', d: '1.8%', v: 'inh' }
    ],
    vg_cols: vg.cols,
    vg_cells: vg.cells,
    vg_obs: vg.obs,
    vg_fluidos: vg.fluidos
  };
  var i = {
    pac: 'prueba',
    dni: '30111222',
    serv: 'Cirugía general',
    diag: 'Colecistectomía laparoscópica (prueba)',
    sala: '1',
    cama: '12',
    fecha: '2026-09-10',
    edad: '45',
    sexo: 'M',
    peso: '80',
    hora: '08:00',
    san: san
  };
  ctx.S.cur = i;
  ctx.VG = { cols: vg.cols, cells: vg.cells, obs: vg.obs, fluidos: vg.fluidos };
  ctx._afPrintFirmaOpts = { colegio: !ctx.afFojaEsSisalud(san) };
  var signImg = '<div style="height:46px"></div>';
  var drogaLines = f.drogas.map(function (d) {
    return (d.n || '') + ' ' + (d.d || '') + ' ' + (d.v || '');
  }).join(' \u00b7 ');
  var perPage = ctx._chartColsPerPage(vg.cols.length);
  var chartInner = ctx._buildChartHtml(vg.cols, vg.cells, vg.obs, vg.fluidos, 0, vg.cols.length, false, 0);
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Foja de Anestesia</title><style>'
    + ctx._buildPrintStyles() + '</style></head><body>'
    + ctx._buildFojaSheet(i, f, drogaLines, signImg, '', 10, chartInner, '')
    + '</body></html>';
  return embedAssets(html);
}

function findChrome() {
  var cands = [
    process.env.CHROME_PATH,
    'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
    'C:\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
    'C:\\\\Program Files\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe',
    'C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe'
  ].filter(Boolean);
  for (var i = 0; i < cands.length; i++) {
    if (fs.existsSync(cands[i])) return cands[i];
  }
  return null;
}

const ctx = loadPrintCtx();
const jobs = [
  { san: 'Hospital Aeronáutico', html: 'foja-prueba-aero-4h-antec-prot.html', pdf: 'foja-prueba-aero-4h-antec-prot.pdf' },
  { san: 'Hospital Córdoba', html: 'foja-prueba-cordoba-4h-antec-prot.html', pdf: 'foja-prueba-cordoba-4h-antec-prot.pdf' }
];

jobs.forEach(function (job) {
  var html = buildHtml(ctx, job.san);
  if (html.indexOf('HTA, DBT') < 0) fail(job.san + ': faltan los 12 chips en Antecedentes');
  if (html.indexOf(DECUB) < 0 || html.indexOf(OCULAR) < 0) fail(job.san + ': faltan frases de protecciones');
  if (job.san.indexOf('Aero') >= 0 && /class="af-ph[\s"]/.test(html)) fail('Aero no debe llevar header SISalud');
  if (job.san.indexOf('Córdoba') >= 0 && html.indexOf('HOSPITAL') < 0) fail('Córdoba debe llevar header compuesto');
  fs.writeFileSync(path.join(root, job.html), html);
  process.stdout.write('HTML  ' + job.html + '\n');
});

const chrome = findChrome();
if (!chrome) fail('no se encontró Chrome/Edge para imprimir PDF');

jobs.forEach(function (job) {
  var htmlPath = path.join(root, job.html);
  var pdfPath = path.join(root, job.pdf);
  var fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
  var r = spawnSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    '--print-to-pdf=' + pdfPath,
    fileUrl
  ], { encoding: 'utf8', timeout: 60000 });
  if (r.status !== 0 || !fs.existsSync(pdfPath)) {
    fail('PDF ' + job.pdf + ' status=' + r.status + ' ' + (r.stderr || r.stdout || ''));
  }
  var kb = Math.round(fs.statSync(pdfPath).size / 1024);
  process.stdout.write('PDF   ' + job.pdf + ' (' + kb + ' KB) via ' + path.basename(chrome) + '\n');
});
