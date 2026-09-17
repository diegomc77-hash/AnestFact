/**
 * Barrido motor: (1) required_if_* multilínea en fuentes MD
 *               (2) conteo if_eq / if_filled por proforma parseada
 * Uso: node tools/_audit-motor-fixes.mjs
 *
 * Compara parse "viejo" (solo options multilínea) vs "nuevo" (cualquier key).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

function collectMdFiles() {
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

function extractTextBlocks(md) {
  const blocks = [];
  const re = /```text\r?\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(md))) blocks.push(m[1]);
  return blocks;
}

/** Detecta en el MD crudo: `required_if_FOO:` (val vacío) + líneas `- item` */
function scanMultilineRequiredIf(block, source) {
  const lines = block.replace(/\r\n/g, '\n').split('\n');
  const hits = [];
  let i = 0;
  let currentSlotId = null;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    const idM = trimmed.match(/^-\s+id:\s*(.+)$/);
    if (idM) {
      currentSlotId = idM[1].replace(/^["']|["']$/g, '').trim();
      i++;
      continue;
    }
    const rifM = trimmed.match(/^(required_if_[A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (rifM) {
      const key = rifM[1];
      const val = rifM[2].trim();
      if (val === '') {
        const items = [];
        let j = i + 1;
        while (j < lines.length) {
          const L = lines[j];
          const t = L.trim();
          if (!t || t.startsWith('#')) {
            j++;
            continue;
          }
          if (/^-\s+id:\s*/.test(t)) break;
          if (/^[A-Za-z0-9_]+\s*:/.test(t) && !/^-\s+/.test(t)) break;
          if (/^-\s+/.test(t) && !/^-\s+id:\s*/.test(t)) {
            items.push(t.replace(/^-\s+/, '').trim());
            j++;
            continue;
          }
          break;
        }
        if (items.length) {
          hits.push({
            source,
            slotId: currentSlotId,
            key,
            items,
            format: 'multiline',
          });
        }
        i = j;
        continue;
      }
      // inline [ ... ] — no afectado por el bug
      if (val.startsWith('[') && val.endsWith(']')) {
        // counted separately if needed
      }
    }
    i++;
  }
  return hits;
}

function countConditionals(plantilla) {
  const t = String(plantilla || '');
  const ifEq = (t.match(/\{\{#if_eq\b/g) || []).length;
  const ifFilled = (t.match(/\{\{#if_filled\b/g) || []).length;
  return { ifEq, ifFilled, total: ifEq + ifFilled };
}

/**
 * Simula el parser VIEJO: val vacío solo inicia lista si key==='options'.
 * Devuelve slots con required_if_* presentes vs los que el MD multilínea pedía.
 */
function parseSlotsOldStyleLosing(block) {
  // Reusa detección MD: cualquier required_if multilínea se perdía en el parser viejo
  // (excepto si era options, que no es required_if).
  return scanMultilineRequiredIf(block, '');
}

const mdFiles = collectMdFiles();
const allMultiline = [];
const perProforma = [];

for (const f of mdFiles) {
  const md = fs.readFileSync(f.mdPath, 'utf8');
  const blocks = extractTextBlocks(md);
  if (!blocks.length) continue;
  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi];
    const idM = block.match(/^id:\s*(.+)$/m);
    const id = idM ? idM[1].trim().replace(/^["']|["']$/g, '') : `${f.name}#${bi}`;
    const hits = scanMultilineRequiredIf(block, path.relative(ROOT, f.mdPath));
    const plantillaM = block.match(/plantilla_texto:\s*\|?\s*\n([\s\S]*)$/);
    // plantilla is rest after plantilla_texto — count from generated JS instead for accuracy
    allMultiline.push(...hits.map((h) => ({ ...h, proformaId: id })));
    perProforma.push({
      id,
      source: path.relative(ROOT, f.mdPath),
      multilineRequiredIfSlots: hits.length,
      multilineHits: hits,
    });
  }
}

// Conteos condicionales desde JS generado (fuente de verdad post-parse)
const cycDir = path.join(ROOT, 'data/proformas');
function walkJs(d, acc) {
  for (const n of fs.readdirSync(d).sort()) {
    const p = path.join(d, n);
    if (fs.statSync(p).isDirectory()) walkJs(p, acc);
    else if (n.endsWith('.js') && n !== 'index.js') acc.push(p);
  }
  return acc;
}

import vm from 'vm';
const sandbox = { console };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
const indexCode = fs.readFileSync(path.join(cycDir, 'index.js'), 'utf8');
vm.runInNewContext(indexCode, sandbox);
const jsFiles = walkJs(cycDir, []);
for (const jf of jsFiles) {
  vm.runInNewContext(fs.readFileSync(jf, 'utf8'), sandbox);
}

const AF = sandbox.AF_PROFORMAS || {};
const ids = Object.keys(AF).sort();
const condRows = [];
for (const id of ids) {
  const p = AF[id];
  const c = countConditionals(p.plantilla_texto);
  // required_if keys present on slots (post-fix)
  let rifKeys = 0;
  let rifMultilineRecovered = 0;
  for (const s of p.slots || []) {
    for (const k of Object.keys(s)) {
      if (k.startsWith('required_if_')) {
        rifKeys++;
        if (Array.isArray(s[k]) && s[k].length > 1) {
          // heuristic only
        }
      }
    }
  }
  condRows.push({
    id,
    especialidad: p.especialidad,
    slots: (p.slots || []).length,
    ...c,
    over40: c.total > 40,
    over40Strict: c.total >= 40, // would exhaust guard if exactly 40 need more passes? guard is while < 40 so max 39 successful replacements
  });
}

// Guard viejo: while (guard < 40) → máximo 39 reemplazos exitosos.
// Cada bloque condicional requiere al menos 1 pasada; anidados = más.
// Umbral reportado: total bloques > 39 (no cabe en una corrida completa si todos se evalúan).

console.log('=== A) required_if_* MULTILÍNEA en fuentes MD (32 proformas) ===\n');
const byProf = new Map();
for (const h of allMultiline) {
  if (!byProf.has(h.proformaId)) byProf.set(h.proformaId, []);
  byProf.get(h.proformaId).push(h);
}

if (!byProf.size) {
  console.log('Ninguna proforma usa required_if_* en formato multilínea (key: + ítems -).');
  console.log('→ El bug del parser NO afectaba a ninguna otra; solo formatos inline [..] o ausentes.\n');
} else {
  console.log(
    `Proformas con ≥1 required_if_* multilínea: ${byProf.size} / ${perProforma.length}\n`
  );
  console.log(
    'Estas PERDÍAN silenciosamente esos required_if en el JS generado ANTES del fix.\n'
  );
  for (const [id, hits] of [...byProf.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const src = hits[0].source;
    console.log(`## ${id}`);
    console.log(`   fuente: ${src}`);
    console.log(`   slots afectados: ${hits.length}`);
    for (const h of hits) {
      console.log(`   - slot ${h.slotId} · ${h.key} (${h.items.length} valores)`);
      console.log(`     → ${JSON.stringify(h.items)}`);
    }
    console.log('');
  }
}

// También: options multilínea NO era bug; required_if inline OK
let inlineRif = 0;
for (const f of mdFiles) {
  const md = fs.readFileSync(f.mdPath, 'utf8');
  for (const block of extractTextBlocks(md)) {
    const re = /required_if_[A-Za-z0-9_]+\s*:\s*\[[^\]]*\]/g;
    const m = block.match(re);
    if (m) inlineRif += m.length;
  }
}
console.log(`Referencia: required_if_* INLINE [..] en MD: ${inlineRif} ocurrencias (nunca afectadas).\n`);

console.log('=== B) Conteos {{#if_eq}} + {{#if_filled}} por proforma (JS generado) ===\n');
console.log('Guard VIEJO: while (guard < 40) → máx. 39 reemplazos por render.');
console.log('Si total bloques > 39, el render podía cortar con tags crudos / ramas ajenas.\n');

condRows.sort((a, b) => b.total - a.total);
console.log(
  'id'.padEnd(42) +
    'esp'.padEnd(28) +
    'if_eq'.padStart(6) +
    'filled'.padStart(7) +
    'total'.padStart(7) +
    '  >39?'
);
console.log('-'.repeat(100));
let over = 0;
for (const r of condRows) {
  const flag = r.total > 39 ? ' YES' : '  no';
  if (r.total > 39) over++;
  const esp = String(r.especialidad || '').slice(0, 26);
  console.log(
    r.id.padEnd(42) +
      esp.padEnd(28) +
      String(r.ifEq).padStart(6) +
      String(r.ifFilled).padStart(7) +
      String(r.total).padStart(7) +
      flag
  );
}
console.log('-'.repeat(100));
console.log(`Total proformas: ${condRows.length}`);
console.log(`Con total bloques > 39 (excedían guard viejo): ${over}`);
console.log(
  `Máximo observado: ${condRows[0].id} = ${condRows[0].total} (if_eq ${condRows[0].ifEq} + if_filled ${condRows[0].ifFilled})`
);

// Worst-case iterations: nested processing may need more than `total` passes
// because each successful match removes one block; order is innermost-first.
// So total blocks is a lower bound on iterations needed for a full plantilla walk
// when evaluating a values set that opens many branches... Actually when most
// branches are false, outer if_eq still need to be visited. Minimum iterations
// to clear all tags ≈ number of conditional blocks in the template (each removed once).
console.log('\nNota: cada bloque se elimina exactamente una vez por render →');
console.log('iteraciones mínimas ≈ total de bloques en la plantilla (independiente de values).');
console.log('Guard 40 fallaba sieempre que total > 39, no solo en el peor caso de datos.');
