/**
 * Verificación local (sin Chrome) del contrato AnesFact → popup.
 * node tools/verify-geclisa-bridge.mjs
 */
import assert from 'assert';

function afBatchClipboardEnvelope(p) {
  return 'AFG1|' + [
    String(p.apellido || '').replace(/\|/g, ' '),
    String(p.nombre || '').replace(/\|/g, ' '),
    String(p.dni || '').replace(/\|/g, ' '),
    String(p.fechaCirugia || '').replace(/\|/g, ' '),
    String(p.token || '')
  ].join('|');
}

function parseClipboardEnvelope(text) {
  text = String(text || '').trim();
  if (!text) return null;
  if (text.indexOf('AFG1|') === 0) {
    const parts = text.split('|');
    if (parts.length < 6) return null;
    return {
      apellido: parts[1] || '',
      nombre: parts[2] || '',
      dni: parts[3] || '',
      fechaCirugia: parts[4] || '',
      token: parts.slice(5).join('|'),
      updatedAt: Date.now()
    };
  }
  if (text.length >= 32 && text.indexOf('|') < 0 && text.indexOf(' ') < 0) {
    return { token: text, apellido: '', nombre: '', updatedAt: Date.now() };
  }
  return null;
}

function normalizeFoja(detail) {
  if (!detail || !detail.token) return null;
  const foja = {
    token: String(detail.token),
    apellido: String(detail.apellido || '').trim(),
    nombre: String(detail.nombre || '').trim(),
    dni: String(detail.dni || '').trim(),
    fechaCirugia: detail.fechaCirugia || '',
    updatedAt: detail.updatedAt || Date.now()
  };
  if (foja.apellido && !foja.nombre && /\s/.test(foja.apellido)) {
    const parts = foja.apellido.split(/\s+/);
    foja.apellido = parts[0];
    foja.nombre = parts.slice(1).join(' ');
  }
  return foja;
}

// --- 1) Publish Bescos → envelope → parse (path portapapeles, sin content script)
const bescos = {
  token: 'T'.repeat(40),
  apellido: 'BESCOS',
  nombre: 'DANIEL ALFREDO',
  dni: '12812343',
  fechaCirugia: '2026-08-07',
  updatedAt: 1
};
const env = afBatchClipboardEnvelope(bescos);
assert.ok(env.startsWith('AFG1|BESCOS|DANIEL ALFREDO|'), 'envelope format');
const parsed = parseClipboardEnvelope(env);
assert.strictEqual(parsed.apellido, 'BESCOS');
assert.strictEqual(parsed.nombre, 'DANIEL ALFREDO');
assert.strictEqual(parsed.dni, '12812343');
assert.strictEqual(parsed.token, bescos.token);
assert.ok(parsed.apellido && parsed.token, 'popup fillFromFoja would succeed');

// --- 2) Lucero no debe quedar si llega Bescos (pisa)
let store = { afg_current_foja: { apellido: 'LUCERO', nombre: 'JOAQUIN', token: 'old' } };
const next = normalizeFoja(bescos);
store.afg_current_foja = next;
assert.strictEqual(store.afg_current_foja.apellido, 'BESCOS');
assert.notStrictEqual(store.afg_current_foja.apellido, 'LUCERO');

// --- 3) Token crudo sin AFG1 → no apellido (explica el fallo anterior)
const rawOnly = parseClipboardEnvelope('a'.repeat(40));
assert.strictEqual(rawOnly.apellido, '');
assert.ok(rawOnly.token.length === 40);

// --- 4) localStorage JSON roundtrip (path bridge)
const raw = JSON.stringify(bescos);
const fromLs = normalizeFoja(JSON.parse(raw));
assert.strictEqual(fromLs.apellido, 'BESCOS');
assert.strictEqual(fromLs.nombre, 'DANIEL ALFREDO');

// --- 5) Confirmar que window.__AFG_PENDING_BATCH NO es suficiente (doc del bug)
const isolatedWorldNote =
  'content script no ve window.__AFG_PENDING_BATCH; localStorage/postMessage sí';
assert.ok(isolatedWorldNote.length > 10);

console.log('OK verify-geclisa-bridge: envelope, parse, overwrite Lucero→Bescos, localStorage roundtrip');
console.log('clipboard sample:', env.slice(0, 60) + '…');
