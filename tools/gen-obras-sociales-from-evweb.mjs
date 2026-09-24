/**
 * Regenera data/obras-sociales.js desde docs/evweb_catalogo_completo.md.
 * Las 15 claves de AFE_OBRA_MAP (Huerta) van primero para priorizar el autocomplete.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const md = fs.readFileSync(path.join(root, 'docs/evweb_catalogo_completo.md'), 'utf8');
const m = md.match(/## OBRAS SOCIALES[^\n]*\n+[\s\S]*?```\n([\s\S]*?)\n```/);
if (!m) {
  console.error('No se encontró el bloque OBRAS SOCIALES en evweb_catalogo_completo.md');
  process.exit(1);
}

const names = [];
for (const line of m[1].split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
  const hit = line.match(/^\d+\|\d+\s+-\s+(.+)$/);
  if (!hit) {
    console.error('Línea inválida:', line);
    process.exit(1);
  }
  names.push(hit[1].trim());
}

/** Mismos textos exactos que AFE_OBRA_MAP en js/40-evweb-queue.js */
const huerta = [
  'PAMI',
  'IOSFA',
  'APROSS',
  'FEDERACION PATRONAL ART',
  'OMINT ART',
  'EXPERTA ART',
  'ANDINA ART',
  'HORIZONTE',
  'BERKLEY',
  'OSPECOR',
  'LA HOLANDO ART',
  'PREVENCION',
  'APOS',
  'PROVINCIA ART',
  'PRODUCTORES DE FRUTAS'
];

const huertaSet = new Set(huerta);
const rest = names.filter((n) => !huertaSet.has(n));
const all = huerta.concat(rest);

function esc(s) {
  return "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

const out =
  '// Autogen desde docs/evweb_catalogo_completo.md + 15 claves AFE_OBRA_MAP (Huerta) al inicio.\n' +
  '// Regenerar: node tools/gen-obras-sociales-from-evweb.mjs\n' +
  'var AF_OBRAS_HUERTA = [\n' +
  huerta.map((n) => '  ' + esc(n)).join(',\n') +
  '\n];\n' +
  'var OBRAS_SOCIALES = [\n' +
  all.map((n) => '  ' + esc(n)).join(',\n') +
  '\n];\n';

const dest = path.join(root, 'data/obras-sociales.js');
fs.writeFileSync(dest, out);
console.log(JSON.stringify({
  catalogParsed: names.length,
  huerta: huerta.length,
  totalInList: all.length,
  dest
}, null, 2));
