/**
 * Simula popup.loadFoja paths: session → local → clipboard AFG1.
 * No Chrome APIs: mock storage.
 * node tools/verify-popup-load.mjs
 */
import assert from 'assert';

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

function loadFojaMock({ session, local, clipboard }) {
  const sessFoja = session && session.afg_current_foja;
  if (sessFoja && sessFoja.token && sessFoja.apellido) {
    return { ok: true, source: 'session', foja: sessFoja };
  }
  const locFoja = local && local.afg_current_foja;
  if (locFoja && locFoja.token && locFoja.apellido) {
    return { ok: true, source: 'local', foja: locFoja };
  }
  const parsed = parseClipboardEnvelope(clipboard || '');
  if (parsed && parsed.token && parsed.apellido) {
    return { ok: true, source: 'clipboard', foja: parsed };
  }
  if (parsed && parsed.token && !parsed.apellido) {
    return { ok: false, source: 'clipboard_token_only', foja: parsed };
  }
  return { ok: false, source: 'none' };
}

// Caso real que fallaba: Lucero hardcode / storage vacío / token crudo
{
  const r = loadFojaMock({
    session: {},
    local: {},
    clipboard: 'x'.repeat(40)
  });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.source, 'clipboard_token_only');
}

// Caso Bescos vía clipboard (fallback sin content script)
{
  const env = 'AFG1|BESCOS|DANIEL ALFREDO|12812343|2026-08-07|' + 'T'.repeat(40);
  const r = loadFojaMock({ session: {}, local: {}, clipboard: env });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.source, 'clipboard');
  assert.strictEqual(r.foja.apellido, 'BESCOS');
  assert.strictEqual(r.foja.nombre, 'DANIEL ALFREDO');
}

// Session gana sobre Lucero viejo en local
{
  const r = loadFojaMock({
    session: {
      afg_current_foja: {
        apellido: 'BESCOS',
        nombre: 'DANIEL ALFREDO',
        token: 'T'.repeat(40)
      }
    },
    local: {
      afg_current_foja: {
        apellido: 'LUCERO',
        nombre: 'JOAQUIN',
        token: 'OLD'
      }
    },
    clipboard: ''
  });
  assert.strictEqual(r.source, 'session');
  assert.strictEqual(r.foja.apellido, 'BESCOS');
}

console.log('OK verify-popup-load: session/local/clipboard paths');
