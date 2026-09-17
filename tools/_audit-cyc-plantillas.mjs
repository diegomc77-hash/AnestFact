/**
 * Barrido: líneas fijas de plantilla_texto que usan slots opcionales
 * o afirman hechos sin if_filled/if_eq.
 * Uso: node tools/_audit-cyc-plantillas.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function load(file, sandbox) {
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox);
}

const sandbox = { console };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
load('data/proformas/index.js', sandbox);
const dir = path.join(ROOT, 'data/proformas/cyc');
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
  load('data/proformas/cyc/' + f, sandbox);
}
load('js/44-foja-qx-proformas.js', sandbox);

function stripConditionals(tpl) {
  let out = String(tpl || '');
  let guard = 0;
  const reEq =
    /\{\{#if_eq\s+[a-zA-Z0-9_]+\s+"[^"]*"\s*\}\}[\s\S]*?\{\{\/if_eq\}\}/;
  const reFilled =
    /\{\{#if_filled\s+[a-zA-Z0-9_]+\s*\}\}[\s\S]*?\{\{\/if_filled\}\}/;
  while (guard++ < 50) {
    const prev = out;
    out = out.replace(reEq, '');
    out = out.replace(reFilled, '');
    if (out === prev) break;
  }
  return out;
}

const list = sandbox
  .afProformasByEspecialidad('Cirugía de Cabeza y Cuello')
  .slice()
  .sort((a, b) => a.id.localeCompare(b.id));

const findings = [];

for (const p of list) {
  const tpl = p.plantilla_texto || '';
  const fixed = stripConditionals(tpl);
  const slotMap = Object.fromEntries((p.slots || []).map((sl) => [sl.id, sl]));
  const refs = [...fixed.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)].map(
    (m) => m[1]
  );
  const local = [];

  for (const id of [...new Set(refs)]) {
    const sl = slotMap[id];
    if (!sl) {
      local.push({
        kind: 'derived_or_missing',
        id,
        note: 'usado en esqueleto fijo; no es slot (frase derivada u omitido)',
      });
      continue;
    }
    const reqIf = Object.keys(sl).some((k) => k.startsWith('required_if'));
    if (!sl.required || reqIf) {
      local.push({
        kind: 'optional_in_fixed',
        id,
        type: sl.type,
        required: !!sl.required,
        required_if: reqIf,
        empty_text: sl.empty_text != null ? String(sl.empty_text) : '',
        note:
          !sl.required && !reqIf
            ? 'slot opcional embebido en línea fija'
            : 'required_if: fuera de rama puede quedar vacío en esqueleto (revisar if_eq padre)',
      });
    }
  }

  for (const raw of fixed.split(/\n/)) {
    const l = raw.trim();
    if (!l) continue;
    if (/\{\{/.test(l)) continue;
    if (/[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(l)) {
      local.push({
        kind: 'fixed_prose',
        text: l,
        note: 'prosa fija sin slot — verificar si afirma un acto clínico no elegido',
      });
    }
  }

  findings.push({ id: p.id, titulo: p.titulo, local, fixed: fixed.trim() });
}

for (const f of findings) {
  console.log('\n======== ' + f.id + ' ========');
  console.log(f.titulo);
  console.log('--- esqueleto fijo (sin if_eq/if_filled) ---');
  console.log(f.fixed || '(vacío tras quitar condicionales)');
  console.log('--- hallazgos ---');
  if (!f.local.length) console.log('(ninguno)');
  for (const h of f.local) {
    if (h.kind === 'fixed_prose') {
      console.log('[FIXED_PROSE]', JSON.stringify(h.text));
    } else if (h.kind === 'optional_in_fixed') {
      console.log(
        '[OPTIONAL_SLOT]',
        h.id,
        'type=' + h.type,
        'required=' + h.required,
        'empty=' + JSON.stringify(h.empty_text)
      );
    } else {
      console.log('[DERIVED]', h.id);
    }
  }
}

console.log('\n\nTOTAL hallazgos:', findings.reduce((n, f) => n + f.local.length, 0));
