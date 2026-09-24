/**
 * Genera tools/_evweb-scan-terms.json (~mismo espíritu que el scan de 784
 * términos del nomenclador). node tools/gen-evweb-scan-terms.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nomPath = path.join(root, 'data', 'nomenclador.js');
const outPath = path.join(root, 'tools', '_evweb-scan-terms.json');

const src = fs.readFileSync(nomPath, 'utf8');
const sandbox = {};
vm.runInNewContext(src + '\nthis.NOM = NOM;', sandbox);
const nom = sandbox.NOM || [];

const STOP = new Set([
  'con', 'sin', 'por', 'para', 'como', 'unica', 'unico', 'menos', 'mas',
  'tipo', 'via', 'del', 'los', 'las', 'una', 'uno', 'que', 'bajo', 'sobre'
]);

function toks(desc) {
  return String(desc || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOP.has(t));
}

const set = new Set();
for (const row of nom) {
  const t = toks(row.desc);
  if (!t.length) continue;
  // raíz: 1ª palabra larga, o bigrama si la 1ª es corta
  if (t[0].length >= 5) set.add(t[0]);
  if (t.length >= 2) set.add(t.slice(0, 2).join(' '));
}

const terms = [...set].sort();
fs.writeFileSync(
  outPath,
  JSON.stringify({ version: 1, count: terms.length, fromNom: nom.length, terms })
);
console.log('OK', outPath, 'terms=', terms.length, 'from NOM', nom.length);
