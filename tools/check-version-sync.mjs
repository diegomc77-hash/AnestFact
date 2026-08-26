/**
 * Fuente de verdad: CACHE_V en js/load-scripts.js (PWA) y
 * chrome-extension-geclisa-batch/manifest.json (extensión).
 *
 * Falla (exit 1) si algún bust de caché o lista de precache quedó desfasado.
 * node tools/check-version-sync.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function fail(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

function quotedStrings(block) {
  const out = [];
  const re = /'([^']+)'|"([^"]+)"/g;
  let m;
  while ((m = re.exec(block))) out.push(m[1] || m[2]);
  return out;
}

function extractArray(src, varName) {
  const re = new RegExp('(?:var|const|let)\\s+' + varName + '\\s*=\\s*\\[');
  const start = src.search(re);
  if (start < 0) {
    fail('No se encontró el array `' + varName + '`');
    return [];
  }
  const open = src.indexOf('[', start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') {
      depth--;
      if (depth === 0) return quotedStrings(src.slice(open, i + 1));
    }
  }
  fail('Array `' + varName + '` sin cierre');
  return [];
}

function localQueryVersions(html, rel) {
  const found = [];
  const re = /\b(?:src|href)=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const url = m[1];
    if (/^https?:\/\//i.test(url)) continue;
    const vm = url.match(/[?&]v=([0-9.]+)/);
    if (vm) found.push({ file: rel, url: url, version: vm[1] });
  }
  return found;
}

// --- PWA ---
const loadScripts = read('js/load-scripts.js');
const cacheVMatch = loadScripts.match(/var\s+CACHE_V\s*=\s*['"]([0-9.]+)['"]/);
if (!cacheVMatch) {
  fail('No se encontró `CACHE_V` en js/load-scripts.js');
}
const CACHE_V = cacheVMatch ? cacheVMatch[1] : '';

const swSrc = read('sw.js');
const cacheNameMatch = swSrc.match(/var\s+CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
const expectedCacheName = 'anesfact-v' + CACHE_V;
if (!cacheNameMatch) fail('No se encontró `CACHE_NAME` en sw.js');
else if (cacheNameMatch[1] !== expectedCacheName) {
  fail('sw.js CACHE_NAME=' + cacheNameMatch[1] + ' (esperado ' + expectedCacheName + ')');
}

const swReg = read('js/24-sw-register.js');
const swRegV = swReg.match(/sw\.js\?v=([0-9.]+)/);
if (!swRegV) fail('No se encontró sw.js?v= en js/24-sw-register.js');
else if (swRegV[1] !== CACHE_V) {
  fail('js/24-sw-register.js sw.js?v=' + swRegV[1] + ' (esperado ' + CACHE_V + ')');
}

const loadViews = read('js/load-views.js');
const viewsBust = loadViews.match(/\+\s*['"]v=([0-9.]+)['"]/);
if (!viewsBust) fail('No se encontró bust `v=` en js/load-views.js');
else if (viewsBust[1] !== CACHE_V) {
  fail('js/load-views.js v=' + viewsBust[1] + ' (esperado ' + CACHE_V + ')');
}

['index.html', 'valoracion.html'].forEach(function (rel) {
  localQueryVersions(read(rel), rel).forEach(function (hit) {
    if (hit.version !== CACHE_V) {
      fail(rel + ' ' + hit.url + ' → v=' + hit.version + ' (esperado ' + CACHE_V + ')');
    }
  });
});

const scripts = extractArray(loadScripts, 'SCRIPTS');
const staticCore = extractArray(swSrc, 'STATIC_CORE');
const views = extractArray(loadViews, 'VIEWS');
const fojaParts = extractArray(loadViews, 'FOJA_PARTS');
const coreSet = new Set(staticCore);

scripts.forEach(function (f) {
  if (!coreSet.has(f)) fail('SCRIPTS tiene `' + f + '` pero falta en sw.js STATIC_CORE');
});
['js/load-scripts.js', 'index.html', 'valoracion.html'].forEach(function (f) {
  if (!coreSet.has(f)) fail('STATIC_CORE no incluye `' + f + '`');
});
views.forEach(function (name) {
  const f = 'views/' + name + '.html';
  if (!coreSet.has(f)) fail('VIEWS `' + name + '` falta en STATIC_CORE (' + f + ')');
});
fojaParts.forEach(function (name) {
  const f = 'views/foja/' + name + '.html';
  if (!coreSet.has(f)) fail('FOJA_PARTS `' + name + '` falta en STATIC_CORE (' + f + ')');
});
['views/topbar.html', 'views/auth.html', 'views/foja.html'].forEach(function (f) {
  if (!coreSet.has(f)) fail('STATIC_CORE no incluye `' + f + '`');
});

// --- Extensión (versión propia, no tiene que coincidir con la PWA) ---
const extManifest = JSON.parse(read('chrome-extension-geclisa-batch/manifest.json'));
const EXT_V = extManifest.version || '';
if (!EXT_V) fail('chrome-extension-geclisa-batch/manifest.json sin version');

const bridge = read('chrome-extension-geclisa-batch/content/anesfact-bridge.js');
const bridgeV = bridge.match(/BRIDGE_VERSION\s*=\s*['"]([0-9.]+)['"]/);
if (!bridgeV) fail('No se encontró BRIDGE_VERSION en anesfact-bridge.js');
else if (bridgeV[1] !== EXT_V) {
  fail('anesfact-bridge.js BRIDGE_VERSION=' + bridgeV[1] + ' (esperado ' + EXT_V + ')');
}

const popup = read('chrome-extension-geclisa-batch/popup.html');
const popupV = popup.match(/Extensi[oó]n\s*<b>([0-9.]+)<\/b>/i);
if (!popupV) warn('popup.html no muestra "Extensión <b>x.y.z</b>"');
else if (popupV[1] !== EXT_V) {
  fail('popup.html muestra extensión ' + popupV[1] + ' (esperado ' + EXT_V + ')');
}

const hardcodedBridgeLog = bridge.match(/\[AFG bridge\]\s+([0-9.]+)\s+inyectado/);
if (hardcodedBridgeLog && hardcodedBridgeLog[1] !== EXT_V) {
  fail('anesfact-bridge.js console.log version=' + hardcodedBridgeLog[1] + ' (esperado ' + EXT_V + ' o usar BRIDGE_VERSION)');
}

// --- reporte ---
process.stdout.write('PWA CACHE_V=' + CACHE_V + '\n');
process.stdout.write('Extensión=' + EXT_V + '\n');
warnings.forEach(function (w) {
  process.stdout.write('WARN  ' + w + '\n');
});
if (errors.length) {
  errors.forEach(function (e) {
    process.stderr.write('FAIL  ' + e + '\n');
  });
  process.stderr.write('\n' + errors.length + ' desfasaje(s). Fuente PWA: js/load-scripts.js CACHE_V. Extensión: manifest.json.\n');
  process.exit(1);
}
process.stdout.write('OK    versiones y STATIC_CORE alineados\n');
