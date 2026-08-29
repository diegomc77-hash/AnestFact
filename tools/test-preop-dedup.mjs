/**
 * Carrera initSession vs initApp: un solo fetch, un solo push.
 * Colapso de duplicados por valoracion_id.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'js', '40-valoracion-preop-sync.js'), 'utf8');

function fail(msg) {
  process.stderr.write('FAIL  ' + msg + '\n');
  process.exit(1);
}

function makeContext(opts) {
  const vid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  let fetches = 0;
  const delay = opts.delayMs || 40;
  const rows = opts.rows || [{
    id: vid,
    paciente_id: null,
    diagnostico_cirugia: 'prueba',
    datos_basicos: { edad: 40, dni: '30111222' },
    antecedentes: { chips: [] },
    medicacion: [],
    antec_anestesicos: {},
    extras: { etiqueta_nombre: 'prueba' },
    submitted_at: '2026-08-28T12:00:00Z',
    estado: 'enviada',
    resultado_episodio: 'pendiente'
  }];
  const storage = {};
  const context = {
    console,
    Date,
    JSON,
    String,
    Array,
    Object,
    Number,
    Promise,
    Error,
    fetch: function () {
      fetches++;
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve({
            ok: true,
            json: function () { return Promise.resolve(rows); }
          });
        }, delay);
      });
    },
    document: { getElementById: function () { return null; } },
    AF_AUTH: {
      isLoggedIn: function () { return true; },
      getUserId: function () { return 'uid-test'; }
    },
    afSupabaseUrl: function () { return 'https://example.invalid'; },
    afSupabaseHeaders: function () { return {}; },
    S: { intervs: opts.intervs ? opts.intervs.slice() : [] },
    saveIntervsToStorage: function () {
      storage.n = (context.S.intervs || []).length;
    },
    syncAutoPushDebounced: function () { storage.pushed = (storage.pushed || 0) + 1; },
    renderHome: function () {},
    _storage: storage,
    _fetches: function () { return fetches; }
  };
  vm.createContext(context);
  vm.runInContext(src, context);
  return context;
}

const race = makeContext({ delayMs: 50 });
const p1 = race.afSyncValoracionesPreop();
const p2 = race.afSyncValoracionesPreop();
if (p1 !== p2) fail('segunda llamada debía devolver la misma Promise');
const r1 = await p1;
const r2 = await p2;
if (race._fetches() !== 1) fail('carrera: fetches=' + race._fetches() + ' (esperado 1)');
if ((race.S.intervs || []).length !== 1) fail('carrera: intervs=' + race.S.intervs.length + ' (esperado 1)');
if (!r1.ok || r1.added !== 1) fail('carrera result: ' + JSON.stringify(r1));
if (r2.added !== 1) fail('segunda Promise debía ser el mismo result');

const already = makeContext({
  delayMs: 5,
  intervs: [{
    id: 'preop_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    valoracion_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    estado: 'preoperatorio',
    pac: 'prueba'
  }]
});
const skip = await already.afSyncValoracionesPreop();
if (skip.added !== 0) fail('ya importada: added=' + skip.added);
if (already.S.intervs.length !== 1) fail('ya importada no debe pushear de nuevo');

const vid = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';
const dupes = makeContext({ delayMs: 5, rows: [] });
dupes.S.intervs = [
  { id: 'preop_' + vid, valoracion_id: vid, estado: 'preoperatorio', _ts: 1, pac: 'a' },
  { id: 'preop_' + vid, valoracion_id: vid, estado: 'preoperatorio', _ts: 2, pac: 'a' },
  { id: 'otro', estado: 'borrador', _ts: 9 }
];
const col = dupes.afCollapseValoracionDupes();
if (col.collapsed !== 1) fail('colapso: collapsed=' + col.collapsed);
if (dupes.S.intervs.length !== 2) fail('colapso length=' + dupes.S.intervs.length);
if (dupes.S.intervs[0]._ts !== 2) fail('colapso debía quedar el _ts más alto');

const mixed = makeContext({ delayMs: 5, rows: [] });
mixed.S.intervs = [
  { id: 'preop_' + vid, valoracion_id: vid, estado: 'preoperatorio', _ts: 99 },
  { id: 'preop_' + vid, valoracion_id: vid, estado: 'borrador', _ts: 1 }
];
mixed.afCollapseValoracionDupes();
if (mixed.S.intervs.length !== 1) fail('mixed length');
if (mixed.S.intervs[0].estado !== 'borrador') fail('debía quedar la que salió de preoperatorio');

process.stdout.write('OK    un vuelo en carrera + dedup + colapso\n');
process.stdout.write('      fetches=' + race._fetches() + ' added=' + r1.added + '\n');
