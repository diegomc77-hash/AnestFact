/**
 * Smoke local del canal Iniciar cola → extensión (sin Chrome).
 * Uso: node tools/test-geclisa-queue-start-channel.mjs
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const code = fs.readFileSync(path.join(ROOT, 'js/39-geclisa-queue.js'), 'utf8');

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL', msg);
    failed++;
  } else {
    console.log('OK', msg);
  }
}

const posts = [];
const toasts = [];
const sends = [];
const store = { afg_ext_id: 'abcdefghijklmnopqrstuvwxyz123456' };

const sandbox = {
  console,
  window: {},
  localStorage: {
    getItem: (k) => (store[k] != null ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
    removeItem: (k) => {
      delete store[k];
    },
  },
  toast: (m) => toasts.push(String(m)),
  chrome: {
    runtime: {
      sendMessage: (extId, msg, cb) => {
        sends.push({ extId, msg });
        setTimeout(() => cb({ ok: true, state: { status: 'running' } }), 0);
      },
    },
  },
  setTimeout,
  clearTimeout,
  document: { getElementById: () => null, dispatchEvent: () => {} },
  CustomEvent: function () {},
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.window.postMessage = (data) => posts.push(data);
sandbox.window.addEventListener = () => {};
sandbox.window.removeEventListener = () => {};

vm.runInNewContext(code, sandbox);

assert(typeof sandbox.afGeclisaExtId === 'function', 'afGeclisaExtId exportada');
assert(sandbox.afGeclisaExtId() === store.afg_ext_id, 'lee afg_ext_id');

sandbox.afGeclisaQueueRequestExtAction('QUEUE_START');
assert(sends.length === 1, 'sendMessage externo una vez');
assert(sends[0].msg.type === 'AFG_PAGE_QUEUE_ACTION', 'tipo AFG_PAGE_QUEUE_ACTION');
assert(sends[0].msg.action === 'QUEUE_START', 'action QUEUE_START');
assert(posts.filter((p) => p && p.type === 'QUEUE_START').length === 0, 'no postMessage si canal externo OK');
assert(toasts.some((t) => /Iniciando cola/.test(t)), 'toast iniciar');

// Sin ext id → postMessage fallback
store.afg_ext_id = undefined;
delete store.afg_ext_id;
sandbox.window.__AFG_EXT_ID = '';
sends.length = 0;
posts.length = 0;
sandbox.afGeclisaQueueRequestExtAction('QUEUE_START');
assert(sends.length === 0, 'sin id no sendMessage');
assert(posts.some((p) => p && p.source === 'AFG_ANESFACT' && p.type === 'QUEUE_START'), 'fallback postMessage');

// Manifest / bridge version align
const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'chrome-extension-geclisa-batch/manifest.json'), 'utf8'));
assert(man.version === '0.5.16', 'manifest 0.5.16');
assert(!!man.externally_connectable, 'externally_connectable presente');
const bridge = fs.readFileSync(
  path.join(ROOT, 'chrome-extension-geclisa-batch/content/anesfact-bridge.js'),
  'utf8'
);
assert(bridge.includes("BRIDGE_VERSION = '0.5.16'"), 'bridge version 0.5.16');
assert(bridge.includes('extensionId: chrome.runtime.id'), 'BRIDGE_ALIVE publica extensionId');
const bg = fs.readFileSync(path.join(ROOT, 'chrome-extension-geclisa-batch/background.js'), 'utf8');
assert(bg.includes('onMessageExternal'), 'background onMessageExternal');
assert(bg.includes('ensureBridgesOnAllAnesFactTabs'), 'ensureBridgesOnAllAnesFactTabs');
assert(bg.includes('handlePageQueueAction'), 'handlePageQueueAction');

await new Promise((r) => setTimeout(r, 30));

if (failed) {
  console.error(failed + ' fallos');
  process.exit(1);
}
console.log('ALL OK');
