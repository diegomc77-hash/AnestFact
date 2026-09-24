/**
 * Diagnóstico rápido: ¿el catálogo carga y matchea muestras típicas?
 * node tools/_diag-prac-match.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const s = fs.readFileSync(path.join(root, 'data/evweb-practicas-match.js'), 'utf8');
const i = s.indexOf('window.AF_EVWEB_PRACTICAS_CATALOG = ');
const C = JSON.parse(s.slice(i + 'window.AF_EVWEB_PRACTICAS_CATALOG = '.length).replace(/;\s*$/, ''));

function norm(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolve(desc, obraId) {
  const list = C.byObraId[String(obraId)] || [];
  const want = norm(desc);
  const exact = list.filter((x) => x[1] === want);
  if (exact.length === 1) return { resolved: true, codigo: exact[0][0], via: 'exact' };
  if (exact.length > 1) return { resolved: false, reason: 'exact_ambiguous', n: exact.length };
  const wantKey = want.split(' ').filter(Boolean).sort().join(' ');
  const tok = list.filter((x) => {
    const t = String(x[1] || '')
      .split(' ')
      .filter(Boolean)
      .sort()
      .join(' ');
    return t && t === wantKey;
  });
  if (tok.length === 1) return { resolved: true, codigo: tok[0][0], via: 'token_eq' };
  if (tok.length > 1) return { resolved: false, reason: 'token_ambiguous', n: tok.length };
  // fuzzy hint: starts with first 3 tokens
  const partial = list.filter((x) => x[1].includes(want.slice(0, 20))).slice(0, 3);
  return {
    resolved: false,
    reason: 'no_unique_match',
    want,
    sampleNear: partial.map((x) => [x[0], x[2].slice(0, 60)])
  };
}

console.log('obraIds', Object.keys(C.byObraId));
const samples = [
  ['259', 'HERNIOPLASTIA INGUINAL'],
  ['259', 'Colecistectomia laparoscopica'],
  ['382', 'COLECISTECTOMIA'],
  ['105', 'Cesarea']
];
for (const [oid, desc] of samples) {
  console.log(JSON.stringify({ obraId: oid, desc, ...resolve(desc, oid) }));
}
// show how catalog stores one APROSS row
const a = (C.byObraId['259'] || []).slice(0, 2);
console.log('apross_sample', a);
