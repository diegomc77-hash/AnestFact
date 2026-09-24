/**
 * Genera data/evweb-practicas-match.js desde CSVs en docs/.
 * Base + tandas ya fusionadas en evweb_practicas_apross_pami_iosfa.csv;
 * extras (p.ej. preanest 9000) en CSVs aparte.
 * node tools/gen-evweb-practicas-match.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(root, 'docs');
const outPath = path.join(root, 'data', 'evweb-practicas-match.js');

/** Orden: base grande primero; después extras (preanest, etc.). */
const CSV_FILES = [
  'evweb_practicas_apross_pami_iosfa.csv',
  'evweb_practicas_preanest_9000.csv'
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (q) {
      if (c === '"' && n === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        q = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      q = true;
    } else if (c === ',') {
      row.push(cur);
      cur = '';
    } else if (c === '\n' || (c === '\r' && n === '\n')) {
      if (c === '\r') i++;
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
    } else if (c === '\r') {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

function norm(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const out = { version: 2, byObraId: {} };
const seen = new Set();
let dataRows = 0;

CSV_FILES.forEach((name) => {
  const csvPath = path.join(docsDir, name);
  if (!fs.existsSync(csvPath)) {
    process.stderr.write('SKIP missing ' + name + '\n');
    return;
  }
  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(raw);
  const data = rows.slice(1).filter((r) => r.length >= 4 && r[0]);
  data.forEach((r) => {
    const obraId = String(r[1]);
    const codigo = String(r[2]);
    const key = obraId + '|' + codigo;
    if (seen.has(key)) return;
    seen.add(key);
    dataRows++;
    const desc = String(r[3] || '');
    const p2raw = r[5];
    const param2 =
      p2raw !== undefined && p2raw !== '' && !Number.isNaN(Number(p2raw))
        ? Number(p2raw)
        : null;
    if (!out.byObraId[obraId]) out.byObraId[obraId] = [];
    out.byObraId[obraId].push([codigo, norm(desc), desc, param2]);
  });
});

const js =
  '/** Auto-generado: node tools/gen-evweb-practicas-match.mjs — no editar a mano.\n' +
  ' * v2: cada fila [codigo, descNorm, desc, param2] — param2 = complejidad EVWEB (fija por código). */\n' +
  'window.AF_EVWEB_PRACTICAS_CATALOG = ' +
  JSON.stringify(out) +
  ';\n';

fs.writeFileSync(outPath, js);
const counts = Object.keys(out.byObraId)
  .map((k) => k + '=' + out.byObraId[k].length)
  .join(' ');
process.stdout.write(
  'OK ' + outPath + ' rows=' + dataRows + ' ' + counts + ' bytes=' + js.length + '\n'
);
