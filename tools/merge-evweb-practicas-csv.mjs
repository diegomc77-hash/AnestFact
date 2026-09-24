/**
 * Merge CSVs de tandas evweb → docs/evweb_practicas_apross_pami_iosfa.csv
 * Dedup key: obraId|codigoEvweb
 * node tools/merge-evweb-practicas-csv.mjs [csv1 csv2 ...]
 * Sin args: mergea todos docs/evweb_practicas_tanda*.csv + base existente.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const basePath = path.join(root, 'docs', 'evweb_practicas_apross_pami_iosfa.csv');
const header = 'obra,obraId,codigoEvweb,descripcion,param1,param2';

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

function esc(v) {
  v = String(v == null ? '' : v);
  if (/[",\n\r]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
  return v;
}

function loadRows(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = parseCsv(raw);
  if (!parsed.length) return [];
  const h = parsed[0].map((x) => String(x).trim().toLowerCase());
  const idx = {
    obra: h.indexOf('obra'),
    obraId: h.indexOf('obraid'),
    codigoEvweb: h.indexOf('codigoevweb'),
    descripcion: h.indexOf('descripcion'),
    param1: h.indexOf('param1'),
    param2: h.indexOf('param2')
  };
  const out = [];
  for (let i = 1; i < parsed.length; i++) {
    const r = parsed[i];
    if (!r || r.length < 3) continue;
    const obraId = String(r[idx.obraId] || '').trim();
    const codigo = String(r[idx.codigoEvweb] || '').trim();
    if (!obraId || !codigo) continue;
    out.push({
      obra: String(r[idx.obra] || '').trim(),
      obraId,
      codigoEvweb: codigo,
      descripcion: String(r[idx.descripcion] || '').trim(),
      param1: String(r[idx.param1] || '').trim(),
      param2: String(r[idx.param2] || '').trim()
    });
  }
  return out;
}

const extras = process.argv.slice(2);
let files = [];
if (extras.length) {
  files = extras.map((f) => path.resolve(f));
} else {
  files = [basePath];
  const docs = path.join(root, 'docs');
  fs.readdirSync(docs)
    .filter((n) => /^evweb_practicas_tanda\d+.*\.csv$/i.test(n))
    .sort()
    .forEach((n) => files.push(path.join(docs, n)));
}

const map = new Map();
let added = 0;
const byFile = [];

for (const f of files) {
  const rows = loadRows(f);
  let fileAdded = 0;
  for (const r of rows) {
    const key = r.obraId + '|' + r.codigoEvweb;
    if (map.has(key)) continue;
    map.set(key, r);
    fileAdded++;
    added++;
  }
  byFile.push({
    file: path.basename(f),
    rows: rows.length,
    uniqueNew: fileAdded
  });
}

const all = [...map.values()].sort((a, b) => {
  if (a.obraId !== b.obraId) return Number(a.obraId) - Number(b.obraId) || a.obraId.localeCompare(b.obraId);
  return Number(a.codigoEvweb) - Number(b.codigoEvweb) || a.codigoEvweb.localeCompare(b.codigoEvweb);
});

const csv =
  header +
  '\n' +
  all
    .map((r) =>
      [r.obra, r.obraId, r.codigoEvweb, r.descripcion, r.param1, r.param2].map(esc).join(',')
    )
    .join('\n') +
  '\n';

fs.writeFileSync(basePath, csv);

const byObra = {};
for (const r of all) {
  byObra[r.obraId] = (byObra[r.obraId] || 0) + 1;
}

console.log(JSON.stringify({ basePath, total: all.length, byFile, byObra }, null, 2));
