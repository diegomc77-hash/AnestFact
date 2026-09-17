/**
 * Chequeo ligero de data/proformas: ids únicos, slots, plantilla refs.
 * Uso: node tools/check-proformas.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'data', 'proformas');

function loadJs(file) {
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = { window: {}, globalThis: {} };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  vm.runInNewContext(code, sandbox);
  return sandbox;
}

const indexSand = loadJs(path.join(DIR, 'index.js'));
const index = indexSand.AF_PROFORMAS_INDEX || [];
if (!index.length) {
  console.error('FAIL: índice vacío');
  process.exit(1);
}

const ids = new Set();
let failed = 0;
const byEsp = {};

for (const entry of index) {
  if (ids.has(entry.id)) {
    console.error('FAIL id duplicado en índice:', entry.id);
    failed++;
  }
  ids.add(entry.id);
  const fpath = path.join(DIR, entry.file);
  if (!fs.existsSync(fpath)) {
    console.error('FAIL falta archivo', entry.file);
    failed++;
    continue;
  }
  const sand = loadJs(fpath);
  const p = (sand.AF_PROFORMAS || {})[entry.id];
  if (!p) {
    console.error('FAIL no registra', entry.id);
    failed++;
    continue;
  }
  if (!p.especialidad) {
    console.error('FAIL sin especialidad', entry.id);
    failed++;
  }
  if (!Array.isArray(p.slots) || !p.slots.length) {
    console.error('FAIL sin slots', entry.id);
    failed++;
  }
  if (!p.plantilla_texto) {
    console.error('FAIL sin plantilla', entry.id);
    failed++;
  }
  const slotIds = new Set((p.slots || []).map((s) => s && s.id).filter(Boolean));
  for (const s of p.slots || []) {
    if (!s.id) {
      console.error('FAIL slot sin id en', entry.id);
      failed++;
    }
    if (!['single', 'multi', 'free'].includes(s.type)) {
      console.error('FAIL tipo slot inválido', entry.id, s.id, s.type);
      failed++;
    }
  }
  const refs = [...String(p.plantilla_texto).matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)].map((m) => m[1]);
  for (const r of refs) {
    if (r.endsWith('_frase')) continue;
    if (!slotIds.has(r)) {
      console.warn('WARN plantilla ref sin slot:', entry.id, '→', r);
    }
  }
  byEsp[p.especialidad] = (byEsp[p.especialidad] || 0) + 1;
}

console.log('Proformas OK:', index.length, '| especialidades:', Object.keys(byEsp).length);
Object.keys(byEsp)
  .sort()
  .forEach((e) => console.log(' ', e, '→', byEsp[e]));
if (failed) {
  console.error('FAIL count', failed);
  process.exit(1);
}
console.log('OK');
