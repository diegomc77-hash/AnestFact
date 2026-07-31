/**
 * Divide index.html monolítico en views/*.html + js/*.js + data/*.js
 * Ejecutar: node tools/split-index.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'index.html');
const BACKUP = path.join(ROOT, 'backup', 'index.pre-split.html');

const lines = fs.readFileSync(SRC, 'utf8').split(/\r?\n/);

function slice(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

function write(rel, content) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.trim() + '\n', 'utf8');
  console.log('  +', rel, '(' + content.split('\n').length + ' lines)');
}

if (!fs.existsSync(BACKUP)) {
  fs.copyFileSync(SRC, BACKUP);
  console.log('Backup:', BACKUP);
}

console.log('\n--- HTML views ---');
const views = {
  'views/home.html': [28, 43],
  'views/nueva.html': [45, 169],
  'views/scan.html': [170, 226],
  'views/foja.html': [227, 712],
  'views/nom.html': [713, 726],
  'views/geclisa.html': [727, 733],
  'views/resumen.html': [735, 735],
};
for (const [file, [s, e]] of Object.entries(views)) {
  write(file, slice(s, e));
}

console.log('\n--- Data ---');
write('data/obras-sociales.js', slice(767, 774));
write('data/cirugias.js', slice(779, 866));
write('data/drogas-catalogo.js', slice(871, 924));
write('data/cirujanos-esp.js', slice(2346, 2346));

console.log('\n--- JS modules ---');
const jsModules = {
  'js/02-premed.js': [929, 1057],
  'js/03-autocomplete.js': [1062, 1178],
  'js/04-drogas-ui.js': [1183, 1365],
  'js/05-vitals-sign.js': [1370, 1418],
  'js/06-nav-core.js': [1423, 1543],
  'js/07-intervenciones.js': [1547, 1651],
  'js/08-foja.js': [1656, 1741],
  'js/09-nomenclador-ui.js': [1746, 1763],
  'js/10-geclisa-ui.js': [1768, 1895],
  'js/11-resumen.js': [1900, 1945],
  'js/12-imprimir-aero.js': [1950, 2073],
  'js/13-scan-ia.js': [2078, 2112],
  'js/14-voz.js': [2117, 2154],
  'js/15-utils.js': [2159, 2160],
  'js/16-vitals-grid.js': [2171, 2332],
  'js/17-sync-export.js': [2333, 2379],
  'js/18-posicion.js': [2385, 2424],
  'js/19-examen-mayo.js': [2426, 2700],
  'js/20-geclisa-send.js': [2702, 2830],
  'js/21-metodos.js': [2832, 3087],
  'js/22-tecnica.js': [3090, 3653],
};

for (const [file, [s, e]] of Object.entries(jsModules)) {
  write(file, slice(s, e));
}

write('js/01-state.js', [
  '// STATE',
  slice(752, 755),
  slice(759, 762)
].join('\n'));

write('js/24-sw-register.js', slice(3655, 3655));

console.log('\n--- New index.html shell ---');

const scriptTags = [
  'data/nomenclador.js',
  'data/obras-sociales.js',
  'data/cirugias.js',
  'data/drogas-catalogo.js',
  'js/01-state.js',
  'js/02-premed.js',
  'js/03-autocomplete.js',
  'js/04-drogas-ui.js',
  'js/05-vitals-sign.js',
  'js/06-nav-core.js',
  'js/07-intervenciones.js',
  'js/08-foja.js',
  'js/09-nomenclador-ui.js',
  'js/10-geclisa-ui.js',
  'js/11-resumen.js',
  'js/12-imprimir-aero.js',
  'js/13-scan-ia.js',
  'js/14-voz.js',
  'js/15-utils.js',
  'js/16-vitals-grid.js',
  'data/cirujanos-esp.js',
  'js/17-sync-export.js',
  'js/18-posicion.js',
  'js/19-examen-mayo.js',
  'js/20-geclisa-send.js',
  'js/21-metodos.js',
  'js/22-tecnica.js',
  'js/load-views.js',
  'js/24-sw-register.js',
].map(function (s) { return '<script src="' + s + '"></script>'; }).join('\n');

const head = slice(1, 18);
const topbar = slice(21, 26);

const newIndex = head + '\n</head>\n<body><div id="app">\n' + topbar + '\n<div id="views-mount"></div>\n</div>\n\n<div id="toast"></div>\n\n' + scriptTags + '\n</body>\n</html>\n';

write('index.html', newIndex);
console.log('\nDone. index.html reduced to shell + script tags.');
