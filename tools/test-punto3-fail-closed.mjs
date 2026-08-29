/**
 * Punto 3A — fail-closed cuando af_assert_plan / af_consume_foja no responden.
 * Simula red caída (fetch reject) y el flag AF_TEST_RPC_FAIL.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'js', '29-plans.js'), 'utf8');

function fail(msg) {
  process.stderr.write('FAIL  ' + msg + '\n');
  process.exit(1);
}

function makeContext(opts) {
  const toasts = [];
  const storage = Object.create(null);
  const context = {
    console,
    Date,
    JSON,
    String,
    Array,
    Object,
    Promise,
    Error,
    encodeURIComponent,
    fetch: opts.fetch || (async function () { throw new Error('network down'); }),
    document: { getElementById: function () { return null; } },
    window: { AF_TEST_RPC_FAIL: !!opts.forceFlag },
    AF_AUTH: {
      isLoggedIn: function () { return true; },
      getUserId: function () { return 'uid-test'; },
      getUserEmail: function () { return 'x@y.z'; }
    },
    afSupabaseUrl: function () { return 'https://example.invalid'; },
    afSupabaseHeaders: function () { return { 'Content-Type': 'application/json' }; },
    S: {
      cur: { id: '1', pac: 'prueba', dni: '30111222' },
      intervs: [{ id: 'old', pac: 'previo' }]
    },
    toast: function (m) { toasts.push(String(m)); },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null; },
      setItem: function (k, v) { storage[k] = String(v); }
    },
    _toasts: toasts,
    _storage: storage
  };
  vm.createContext(context);
  vm.runInContext(src, context);
  context.USER_PLAN = 'demo';
  context.USER_IS_ADMIN = false;
  context.USER_PROFILE = { fojas_semana: 0, plan: 'demo' };
  return context;
}

const r1 = makeContext({});
const assertRes = await r1.assertPlanServer('foja');
if (!assertRes || assertRes.ok !== false || assertRes.error !== 'rpc_fail') {
  fail('assertPlanServer red caída: ' + JSON.stringify(assertRes));
}
if (assertRes.local) fail('assertPlanServer no debe devolver local:true (fail-open)');
if (r1.handleAssertFail(assertRes, 'foja') !== false) {
  fail('handleAssertFail(rpc_fail) debía ser false');
}
if (!r1._toasts.some(function (t) { return /no se pudo verificar/i.test(t); })) {
  fail('toast fail-closed ausente: ' + JSON.stringify(r1._toasts));
}
if (r1.afGuardarMayPersist(assertRes, null) !== false) {
  fail('afGuardarMayPersist debía bloquear persist con rpc_fail');
}

const bumpRes = await r1.bumpFojaSemana();
if (!bumpRes || bumpRes.ok !== false || bumpRes.error !== 'rpc_fail') {
  fail('bumpFojaSemana red caída: ' + JSON.stringify(bumpRes));
}

const consumeRes = await r1.maybeBumpDemoFojaOnSave();
if (!consumeRes || consumeRes.ok !== false || consumeRes.error !== 'rpc_fail') {
  fail('maybeBumpDemoFojaOnSave red caída: ' + JSON.stringify(consumeRes));
}
if (r1.S.cur._demoCounted) fail('_demoCounted debía revertirse si consume falla de red');
if (r1.afGuardarMayPersist({ ok: true }, consumeRes) !== false) {
  fail('no persistir si consume falla de red');
}

const r2 = makeContext({
  forceFlag: true,
  fetch: async function () { fail('fetch no debería llamarse con AF_TEST_RPC_FAIL'); }
});
const flagRes = await r2.assertPlanServer('foja');
if (flagRes.error !== 'rpc_fail') fail('AF_TEST_RPC_FAIL: ' + JSON.stringify(flagRes));

if (r1.afGuardarMayPersist({ ok: true }, { ok: true, consumed: true }) !== true) fail('persist ok+ok');
if (r1.afGuardarMayPersist({ ok: true }, { ok: true, consumed: false }) !== true) fail('persist Pro skip consume');
if (r1.afGuardarMayPersist({ ok: false, error: 'rpc_fail' }, null) !== false) fail('block rpc_fail');
if (r1.afGuardarMayPersist({ ok: true }, { ok: false, error: 'limite_semanal' }) !== false) fail('block limite');

if (Object.keys(r1._storage).length) {
  fail('fail-closed no debe escribir localStorage: ' + JSON.stringify(r1._storage));
}

process.stdout.write('OK    fail-closed RPC (fetch reject + AF_TEST_RPC_FAIL + persist gate)\n');
process.stdout.write('      toast: ' + r1._toasts[0] + '\n');
