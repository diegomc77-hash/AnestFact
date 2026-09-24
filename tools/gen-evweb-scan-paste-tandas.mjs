/**
 * Genera 3 scripts paste-ready para consola EVWEB (tandas de 4 obras).
 * node tools/gen-evweb-scan-paste-tandas.mjs
 *
 * Salida:
 *   tools/evweb-scan-tanda-1-paste.js
 *   tools/evweb-scan-tanda-2-paste.js
 *   tools/evweb-scan-tanda-3-paste.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const termsPath = path.join(root, 'tools', '_evweb-scan-terms.json');
const terms = JSON.parse(fs.readFileSync(termsPath, 'utf8')).terms;
if (!Array.isArray(terms) || terms.length !== 784) {
  throw new Error('Se esperaban 784 términos en _evweb-scan-terms.json, hay ' + (terms && terms.length));
}

const TANDAS = [
  {
    n: 1,
    obras: [
      { id: '228', nombre: 'FEDERACION PATRONAL ART' },
      { id: '119', nombre: 'OMINT ART- Serena ART' },
      { id: '258', nombre: 'EXPERTA ART' },
      { id: '433', nombre: 'ANDINA ART S.A.' }
    ]
  },
  {
    n: 2,
    obras: [
      { id: '76', nombre: 'COOPERATIVA DE VIVIENDA CONSUMO Y CREDITO HORIZONTE LIMITADA' },
      { id: '227', nombre: 'BERKLEY' },
      { id: '37', nombre: 'OSPECOR (OBRA SOCIAL DE PETROLEROS DE CORDOBA)' },
      { id: '5', nombre: 'LA HOLANDO ART' }
    ]
  },
  {
    n: 3,
    obras: [
      { id: '263', nombre: 'PREVENCION (FONDO DE RESERVA)' },
      { id: '437', nombre: 'APOS SANATORIO MAYO PRIVADO SOCIEDAD ANONIMA' },
      { id: '420', nombre: 'PROVINCIA ART DESDE 01.05.22' },
      { id: '70', nombre: 'PRODUCTORES DE FRUTAS ARGENTINAS COOP.DE SEG.LDTA' }
    ]
  }
];

function buildPaste(tanda) {
  const ids = tanda.obras.map((o) => o.id).join('-');
  const label = tanda.obras.map((o) => o.id + '=' + o.nombre.slice(0, 28)).join(' | ');
  return `/**
 * AnesFact — EVWEB scan Tanda ${tanda.n}/3
 * Obras: ${label}
 * Pegar TAL CUAL en F12 de adaarc.evweb.com.ar (sesión Sole, misma pestaña).
 * Auto-run: ~4 obras × 784 términos ≈ 30–35 min. No abrir otra tanda en paralelo.
 * Al terminar descarga CSV automáticamente.
 */
(async function () {
  'use strict';
  var TANDA = ${tanda.n};
  var OBRAS = ${JSON.stringify(tanda.obras)};
  var TERMS = ${JSON.stringify(terms)};
  var DELAY_MS = 550;
  var ENDPOINT = new URL('/Pages/Asociaciones/WSautocomplete.asmx/GetAvaliableTags3', location.origin).href;

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function esc(v) {
    v = String(v == null ? '' : v);
    if (/[",\\n\\r]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
    return v;
  }
  function parseHit(s) {
    var head = String(s || '').split('&');
    var left = (head[0] || '').trim();
    var m = left.match(/^(\\d+)\\s*[-–—]\\s*(.+)$/);
    if (!m) return null;
    return {
      codigoEvweb: m[1],
      descripcion: m[2].trim(),
      param1: (head[1] || '').trim(),
      param2: (head[2] || '').trim()
    };
  }

  if (!/adaarc\\.evweb\\.com\\.ar/i.test(location.hostname)) {
    console.error('[AF] Esto hay que pegarlo en adaarc.evweb.com.ar, no en AnesFact.');
    return;
  }
  console.log('%c[AF] Tanda ' + TANDA + '/3 — ' + OBRAS.length + ' obras × ' + TERMS.length + ' términos. Arranca…', 'color:#22c55e;font-weight:bold');
  console.log('[AF] Obras:', OBRAS.map(function (o) { return o.id + ' ' + o.nombre; }));

  var rows = [];
  var seen = {};
  var errors = 0;
  var started = Date.now();

  for (var oi = 0; oi < OBRAS.length; oi++) {
    var obra = OBRAS[oi];
    console.log('[AF] >>> obra ' + (oi + 1) + '/' + OBRAS.length + ' id=' + obra.id + ' ' + obra.nombre);
    for (var ti = 0; ti < TERMS.length; ti++) {
      var term = TERMS[ti];
      try {
        var res = await fetch(ENDPOINT, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ DescripcionConCodigo: term, idObraSocial: String(obra.id) })
        });
        if (!res.ok) {
          errors++;
          if (errors > 25) throw new Error('too_many_http_errors status=' + res.status);
          await sleep(DELAY_MS * 2);
          continue;
        }
        var json = await res.json();
        var list = (json && json.d) || [];
        for (var hi = 0; hi < list.length; hi++) {
          var p = parseHit(list[hi]);
          if (!p) continue;
          var key = obra.id + '|' + p.codigoEvweb;
          if (seen[key]) continue;
          seen[key] = 1;
          rows.push({
            obra: obra.nombre,
            obraId: String(obra.id),
            codigoEvweb: p.codigoEvweb,
            descripcion: p.descripcion,
            param1: p.param1,
            param2: p.param2
          });
        }
      } catch (e) {
        errors++;
        console.warn('[AF] fail', obra.id, term, e && e.message || e);
        if (errors > 30) throw e;
      }
      if (ti % 80 === 0) {
        var mins = ((Date.now() - started) / 60000).toFixed(1);
        console.log('[AF] progress obra=' + obra.id + ' term=' + ti + '/' + TERMS.length + ' rows=' + rows.length + ' err=' + errors + ' t=' + mins + 'm');
      }
      await sleep(DELAY_MS + Math.floor(Math.random() * 150));
    }
  }

  var header = 'obra,obraId,codigoEvweb,descripcion,param1,param2';
  var csv = header + '\\n' + rows.map(function (r) {
    return [r.obra, r.obraId, r.codigoEvweb, r.descripcion, r.param1, r.param2].map(esc).join(',');
  }).join('\\n');
  var fname = 'evweb_practicas_tanda' + TANDA + '_${ids}_' + Date.now() + '.csv';
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fname;
  a.click();

  window.__AF_SCAN_TANDA = TANDA;
  window.__AF_SCAN_ROWS = rows;
  window.__AF_SCAN_FILE = fname;
  console.log('%c[AF] Tanda ' + TANDA + ' LISTA — rows=' + rows.length + ' errors=' + errors + ' file=' + fname, 'color:#22c55e;font-weight:bold');
  console.log('[AF] Guardá el CSV descargado y avisá a Cursor para merge + regenerar match.js');
  return { tanda: TANDA, rows: rows.length, errors: errors, file: fname };
})().catch(function (e) {
  console.error('[AF] Tanda abortada', e);
});
`;
}

for (const t of TANDAS) {
  const out = path.join(root, 'tools', 'evweb-scan-tanda-' + t.n + '-paste.js');
  fs.writeFileSync(out, buildPaste(t));
  console.log('OK', out, 'bytes=', fs.statSync(out).size);
}
