/**
 * PEGAR EN CONSOLA F12 de adaarc.evweb.com.ar (sesión Sole ya logueada).
 *
 * PASO A — en la página "Deudas de obras sociales" (o home con menú Deudas):
 *   copia el resultado de window.__AF_DEUDAS y pegalo al chat.
 *
 * PASO B — escaneo throttled (después de definir OBRAS):
 *   window.__AF_SCAN_OBRAS = [{id:'228', nombre:'FEDERACION PATRONAL ART'}, ...];
 *   luego pegá de nuevo con mode:'scan' (ver abajo) O corré __afScanPracticas().
 *
 * Ritmo: ~450–700 ms entre requests. No abrir varias pestañas corriendo esto.
 */
(function () {
  var MODE = 'deudas'; // 'deudas' | 'scan'

  function abs(u) {
    try {
      return new URL(u, location.origin).href;
    } catch (e) {
      return u;
    }
  }

  /** Extrae mutuales con actividad desde tablas/listas de Deudas. */
  function extractDeudas() {
    var out = [];
    var seen = {};
    function add(name, id) {
      name = String(name || '')
        .replace(/\s+/g, ' ')
        .trim();
      id = id != null && String(id).trim() !== '' ? String(id).trim() : null;
      if (!name || name.length < 3) return;
      var key = (id || '') + '|' + name.toLowerCase();
      if (seen[key]) return;
      seen[key] = 1;
      out.push({ nombre: name, id: id });
    }

    // selects
    document.querySelectorAll('select option').forEach(function (o) {
      var t = (o.textContent || '').trim();
      if (!t || /seleccion|elegir|todos/i.test(t)) return;
      if (o.value && /^\d+$/.test(o.value)) add(t, o.value);
    });

    // filas de grillas típicas
    document.querySelectorAll('table tr').forEach(function (tr) {
      var cells = Array.prototype.map.call(tr.querySelectorAll('td,th'), function (td) {
        return (td.textContent || '').replace(/\s+/g, ' ').trim();
      });
      if (cells.length < 1) return;
      var line = cells.join(' | ');
      if (!/obra|mutual|pami|apross|art|iosfa|apos|osde|swiss|jerarquico|federacion|andina|experta/i.test(line) &&
          cells.length < 2) {
        return;
      }
      // primera celda con texto largo = nombre
      var name = cells.find(function (c) {
        return c.length > 4 && !/^\d+([.,]\d+)?$/.test(c) && !/^\$/.test(c);
      });
      var idCell = cells.find(function (c) {
        return /^\d{2,4}$/.test(c);
      });
      if (name) add(name, idCell || null);
    });

    // links / spans con data-id
    document.querySelectorAll('[data-idobrasocial],[data-obra],[data-id]').forEach(function (el) {
      var id = el.getAttribute('data-idobrasocial') || el.getAttribute('data-obra') || el.getAttribute('data-id');
      add(el.textContent, id);
    });

    window.__AF_DEUDAS = {
      url: location.href,
      title: document.title,
      count: out.length,
      items: out
    };
    console.log('[AF] Deudas extraídas', window.__AF_DEUDAS);
    console.log(JSON.stringify(window.__AF_DEUDAS, null, 2));
    return window.__AF_DEUDAS;
  }

  /**
   * Scan GetAvaliableTags3 — OBRAS = [{id,nombre}], TERMS = string[]
   * delayMs default 550.
   */
  async function scanPracticas(obras, terms, opt) {
    opt = opt || {};
    var delayMs = opt.delayMs != null ? opt.delayMs : 550;
    var endpoint = abs('/Pages/Asociaciones/WSautocomplete.asmx/GetAvaliableTags3');
    var rows = [];
    var seen = {};
    var errors = 0;

    function sleep(ms) {
      return new Promise(function (r) {
        setTimeout(r, ms);
      });
    }

    function parseHit(s) {
      // "codigo - descripcion&param1&param2"
      var head = String(s || '').split('&');
      var left = (head[0] || '').trim();
      var m = left.match(/^(\d+)\s*[-–—]\s*(.+)$/);
      if (!m) return null;
      return {
        codigoEvweb: m[1],
        descripcion: m[2].trim(),
        param1: (head[1] || '').trim(),
        param2: (head[2] || '').trim()
      };
    }

    for (var oi = 0; oi < obras.length; oi++) {
      var obra = obras[oi];
      console.log('[AF] scan obra', obra.id, obra.nombre, 'terms', terms.length);
      for (var ti = 0; ti < terms.length; ti++) {
        var term = terms[ti];
        try {
          var res = await fetch(endpoint, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
              DescripcionConCodigo: term,
              idObraSocial: String(obra.id)
            })
          });
          if (!res.ok) {
            errors++;
            if (errors > 15) {
              console.error('[AF] demasiados errores HTTP — abort');
              throw new Error('too_many_http_errors');
            }
            await sleep(delayMs * 2);
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
          console.warn('[AF] term fail', term, e);
          if (errors > 20) throw e;
        }
        if (ti % 50 === 0) {
          console.log('[AF] progress', obra.id, ti + '/' + terms.length, 'rows', rows.length);
        }
        await sleep(delayMs + Math.floor(Math.random() * 150));
      }
    }

    window.__AF_SCAN_ROWS = rows;
    // CSV download
    var header = 'obra,obraId,codigoEvweb,descripcion,param1,param2';
    function esc(v) {
      v = String(v == null ? '' : v);
      if (/[",\n\r]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
      return v;
    }
    var csv =
      header +
      '\n' +
      rows
        .map(function (r) {
          return [r.obra, r.obraId, r.codigoEvweb, r.descripcion, r.param1, r.param2]
            .map(esc)
            .join(',');
        })
        .join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'evweb_practicas_scan_' + Date.now() + '.csv';
    a.click();
    console.log('[AF] scan done rows=', rows.length, 'errors=', errors, 'download started');
    return { rows: rows.length, errors: errors };
  }

  window.__afExtractDeudas = extractDeudas;
  window.__afScanPracticas = scanPracticas;

  if (MODE === 'deudas') {
    extractDeudas();
    console.log(
      '%cPegá el JSON de window.__AF_DEUDAS al chat de Cursor. Luego definí window.__AF_SCAN_OBRAS y corré el scan.',
      'color:#22c55e;font-weight:bold'
    );
  }
})();
