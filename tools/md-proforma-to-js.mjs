/**
 * Extrae bloques ```text de docs de proformas → data/proformas/*.js
 * Uso: node tools/md-proforma-to-js.mjs [--write]
 * Sin --write: solo valida y reporta.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');

const SOURCES = [
  { dir: 'docs/proformas-cyc', folder: 'cyc' },
  { dir: 'docs/cirugia-general', folder: 'cg' },
  { dir: 'docs/cirugia-toracica', folder: 'torax' },
  { dir: 'docs/cirugia-urologica', folder: 'uro' },
  { dir: 'docs/cirugia-ginecologica', folder: 'gine' },
  { dir: 'docs/cirugia-traumatologia', folder: 'trauma' },
  { dir: 'docs/cirugia-vascular', folder: 'vascular' },
  { dir: 'docs/cirugia-plastica', folder: 'plastica' },
  { dir: 'docs/cirugia-neurocirugia', folder: 'neuro' },
  { dir: 'docs/cirugia-cardiovascular', folder: 'cv' },
  { dir: 'docs/cirugia-mano', folder: 'mano' },
  { dir: 'docs/cirugia-orl', folder: 'orl' },
  { dir: 'docs/cirugia-oftalmologia', folder: 'oftalmo' },
  { dir: 'docs/cirugia-hemodinamia', folder: 'hemo' },
  { dir: 'docs/cirugia-gastroenterologia', folder: 'gastro' },
];

function extractTextBlocks(md) {
  const blocks = [];
  const re = /```text\r?\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(md))) blocks.push(m[1]);
  return blocks;
}

function stripComments(line) {
  const hash = line.indexOf('#');
  if (hash < 0) return line;
  // keep # inside quotes
  const before = line.slice(0, hash);
  const dq = (before.match(/"/g) || []).length;
  if (dq % 2 === 1) return line;
  return before;
}

function parseScalar(raw) {
  const s = raw.trim();
  if (!s) return '';
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function parseInlineArray(s) {
  const inner = s.trim().replace(/^\[/, '').replace(/\]$/, '').trim();
  if (!inner) return [];
  const out = [];
  let cur = '';
  let inQ = false;
  let q = '';
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (inQ) {
      if (ch === q) inQ = false;
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQ = true;
      q = ch;
      continue;
    }
    if (ch === ',') {
      out.push(parseScalar(cur));
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(parseScalar(cur));
  return out;
}

function parseProformaText(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const obj = { slots: [] };
  let i = 0;
  let mode = 'top'; // top | slots | plantilla
  let plantillaLines = [];
  let currentSlot = null;
  let listKey = null; // options under slot
  let listIndent = 0;

  function flushSlot() {
    if (currentSlot) {
      obj.slots.push(currentSlot);
      currentSlot = null;
    }
    listKey = null;
  }

  while (i < lines.length) {
    let raw = lines[i];
    i++;
    let line = stripComments(raw).replace(/\s+$/, '');
    if (!line.trim() && mode !== 'plantilla') continue;

    if (mode === 'plantilla') {
      plantillaLines.push(raw.replace(/\r$/, ''));
      continue;
    }

    const trimmed = line.trim();

    if (mode === 'top') {
      if (/^slots:\s*$/.test(trimmed)) {
        mode = 'slots';
        continue;
      }
      if (/^plantilla_texto:\s*\|?\s*$/.test(trimmed)) {
        mode = 'plantilla';
        continue;
      }
      // key: value  / key: [ ... ] possibly multiline
      const km = trimmed.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
      if (!km) continue;
      const key = km[1];
      let val = km[2].trim();
      if (val === '[') {
        const buf = [];
        while (i < lines.length) {
          const L = stripComments(lines[i]).trim();
          i++;
          if (L === ']') break;
          if (!L || L.startsWith('#')) continue;
          const item = L.replace(/^-\s*/, '').replace(/,$/, '').trim();
          if (item) buf.push(parseScalar(item));
        }
        obj[key] = buf;
      } else if (val.startsWith('[') && val.endsWith(']')) {
        obj[key] = parseInlineArray(val);
      } else if (val === '|') {
        const buf = [];
        while (i < lines.length) {
          const L = lines[i];
          if (/^[A-Za-z0-9_]+:/.test(L.trim()) || /^```/.test(L.trim())) break;
          i++;
          buf.push(L.replace(/^\s{2}/, ''));
        }
        obj[key] = buf.join('\n').replace(/\s+$/, '');
      } else {
        obj[key] = parseScalar(val);
      }
      continue;
    }

    if (mode === 'slots') {
      if (/^plantilla_texto:\s*\|?\s*$/.test(trimmed)) {
        flushSlot();
        mode = 'plantilla';
        continue;
      }
      // new slot
      if (/^-\s+id:\s*/.test(trimmed)) {
        flushSlot();
        currentSlot = { id: parseScalar(trimmed.replace(/^-\s+id:\s*/, '')) };
        listKey = null;
        continue;
      }
      if (!currentSlot) continue;

      // options list item
      if (listKey && /^\s*-\s+/.test(line) && !/^\s*-\s+id:\s*/.test(line)) {
        const item = parseScalar(trimmed.replace(/^-\s+/, ''));
        if (!Array.isArray(currentSlot[listKey])) currentSlot[listKey] = [];
        currentSlot[listKey].push(item);
        continue;
      }

      const sm = trimmed.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
      if (!sm) continue;
      const key = sm[1];
      let val = sm[2].trim();

      if (key === 'options' && (val === '' || val === null)) {
        listKey = 'options';
        currentSlot.options = [];
        continue;
      }
      if (val === '' || val == null) {
        // possible nested list start next lines
        if (key === 'options') {
          listKey = 'options';
          currentSlot.options = [];
        }
        continue;
      }
      listKey = null;
      if (val.startsWith('[') && val.endsWith(']')) {
        currentSlot[key] = parseInlineArray(val);
      } else if (val === '[') {
        const buf = [];
        while (i < lines.length) {
          const L = stripComments(lines[i]).trim();
          i++;
          if (L === ']') break;
          if (!L || L.startsWith('#')) continue;
          const item = L.replace(/^-\s*/, '').replace(/,$/, '').trim();
          if (item) buf.push(parseScalar(item));
        }
        currentSlot[key] = buf;
      } else {
        currentSlot[key] = parseScalar(val);
      }
    }
  }
  flushSlot();
  if (plantillaLines.length) {
    // drop common leading indent
    let minIndent = Infinity;
    for (const L of plantillaLines) {
      if (!L.trim()) continue;
      const m = L.match(/^(\s*)/);
      if (m) minIndent = Math.min(minIndent, m[1].length);
    }
    if (!Number.isFinite(minIndent)) minIndent = 0;
    obj.plantilla_texto = plantillaLines
      .map((L) => L.slice(minIndent))
      .join('\n')
      .replace(/^\n+/, '')
      .replace(/\n+$/, '');
  }
  return obj;
}

function safeFileName(id) {
  return String(id || 'unknown').replace(/[^a-zA-Z0-9_-]+/g, '_');
}

function collectFiles() {
  const files = [];
  for (const src of SOURCES) {
    const abs = path.join(ROOT, src.dir);
    if (!fs.existsSync(abs)) continue;
    for (const name of fs.readdirSync(abs).sort()) {
      if (!name.endsWith('.md')) continue;
      if (name === 'README.md' || name.startsWith('HALLAZGOS')) continue;
      if (name.startsWith('_')) continue;
      files.push({ ...src, mdPath: path.join(abs, name), name });
    }
  }
  return files;
}

const all = [];
const errors = [];
const byId = new Map();

for (const f of collectFiles()) {
  const md = fs.readFileSync(f.mdPath, 'utf8');
  const blocks = extractTextBlocks(md);
  if (!blocks.length) {
    errors.push(`${f.mdPath}: sin bloque \`\`\`text`);
    continue;
  }
  for (let bi = 0; bi < blocks.length; bi++) {
    let parsed;
    try {
      parsed = parseProformaText(blocks[bi]);
    } catch (e) {
      errors.push(`${f.mdPath}#${bi}: parse ${e.message}`);
      continue;
    }
    if (!parsed.id) {
      errors.push(`${f.mdPath}#${bi}: sin id`);
      continue;
    }
    if (byId.has(parsed.id)) {
      errors.push(`id duplicado ${parsed.id}: ${byId.get(parsed.id)} y ${f.mdPath}`);
    }
    byId.set(parsed.id, f.mdPath);
    if (!parsed.especialidad) errors.push(`${parsed.id}: sin especialidad`);
    if (!Array.isArray(parsed.slots)) errors.push(`${parsed.id}: slots no array`);
    if (!parsed.plantilla_texto) errors.push(`${parsed.id}: sin plantilla_texto`);
    const slotIds = new Set((parsed.slots || []).map((s) => s.id));
    const refs = [...String(parsed.plantilla_texto || '').matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)].map((m) => m[1]);
    for (const r of refs) {
      if (!slotIds.has(r) && !r.endsWith('_frase')) {
        // _frase = derivados del motor; ok
        // soft: still allow unknown (motor may synthesize)
      }
    }
    all.push({ folder: f.folder, source: f.name, proforma: parsed });
  }
}

console.log(`Proformas parseadas: ${all.length}`);
if (errors.length) {
  console.log('Avisos/errores:');
  errors.forEach((e) => console.log(' -', e));
}

if (WRITE) {
  const outRoot = path.join(ROOT, 'data', 'proformas');
  fs.mkdirSync(outRoot, { recursive: true });
  const indexEntries = [];
  for (const item of all) {
    const dir = path.join(outRoot, item.folder);
    fs.mkdirSync(dir, { recursive: true });
    const fname = safeFileName(item.proforma.id) + '.js';
    const fpath = path.join(dir, fname);
    const json = JSON.stringify(item.proforma, null, 2);
    const body =
      '/* auto-generated by tools/md-proforma-to-js.mjs — no editar a mano */\n' +
      '(function (g) {\n' +
      '  g.AF_PROFORMAS = g.AF_PROFORMAS || {};\n' +
      '  g.AF_PROFORMAS[' +
      JSON.stringify(item.proforma.id) +
      '] = ' +
      json +
      ';\n' +
      '})(typeof window !== "undefined" ? window : globalThis);\n';
    fs.writeFileSync(fpath, body, 'utf8');
    indexEntries.push({
      id: item.proforma.id,
      folder: item.folder,
      file: item.folder + '/' + fname,
      especialidad: item.proforma.especialidad,
      titulo: item.proforma.titulo || '',
      operaciones: item.proforma.operaciones || [],
    });
  }
  const indexJs =
    '/* auto-generated index — tools/md-proforma-to-js.mjs */\n' +
    '(function (g) {\n' +
    '  g.AF_PROFORMAS_INDEX = ' +
    JSON.stringify(indexEntries, null, 2) +
    ';\n' +
    '})(typeof window !== "undefined" ? window : globalThis);\n';
  fs.writeFileSync(path.join(outRoot, 'index.js'), indexJs, 'utf8');
  console.log(`Escritos ${all.length} archivos + index.js en data/proformas/`);
}

if (errors.some((e) => e.includes('duplicado') || e.includes('sin id') || e.includes('sin bloque'))) {
  process.exitCode = 1;
}
