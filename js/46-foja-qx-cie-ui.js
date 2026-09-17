/**
 * CIE quirúrgico UI (app) — PARQUEADO, no cableado en SCRIPTS/STATIC_CORE.
 * Pieza final: enganchar desde fojaQx + foja-qx.html + data/cie-quirurgico.js.
 * Print A4: js/45-imprimir-foja-qx.js (también parqueado hasta esa pieza).
 */
(function (g) {
  'use strict';

  /**
   * Monta buscador CIE + código + «otro a mano» en hostId.
   * opts: { fieldKey, manualKey, getDx, setDx, readonly, persist }
   */
  function afMountCieQxField(hostId, opts) {
    var host = typeof hostId === 'string' ? document.getElementById(hostId) : hostId;
    if (!host) return;
    opts = opts || {};
    var dx = typeof opts.getDx === 'function' ? opts.getDx() || {} : {};
    var fieldKey = opts.fieldKey || 'cie_pre';
    var manualKey = opts.manualKey || 'cie_pre_manual';
    var readonly = !!opts.readonly;
    var code = dx[fieldKey] || '';
    var manual = !!dx[manualKey];

    host.innerHTML =
      '<div class="g2">' +
      '<div class="field"><label>Buscar CIE</label>' +
      '<input class="fi" data-cie-q placeholder="código o texto"' +
      (readonly ? ' disabled' : '') +
      '></div>' +
      '<div class="field"><label>Código</label>' +
      '<input class="fi" data-cie-code value="' +
      String(code).replace(/"/g, '&quot;') +
      '"' +
      (readonly || !manual ? ' readonly' : '') +
      '></div></div>' +
      '<label style="display:flex;gap:6px;align-items:center;font-size:12px;margin:6px 0">' +
      '<input type="checkbox" data-cie-manual' +
      (manual ? ' checked' : '') +
      (readonly ? ' disabled' : '') +
      '> Otro código a mano</label>' +
      '<div data-cie-hits style="font-size:12px;max-height:120px;overflow:auto"></div>' +
      '<p data-cie-label style="font-size:12px;color:var(--text2);margin:4px 0 0"></p>';

    function paintLabel() {
      var lab = host.querySelector('[data-cie-label]');
      var c = host.querySelector('[data-cie-code]');
      if (lab && typeof g.afCieQxLabel === 'function') lab.textContent = g.afCieQxLabel(c && c.value);
    }
    function save() {
      if (readonly) return;
      var c = host.querySelector('[data-cie-code]');
      var m = host.querySelector('[data-cie-manual]');
      if (typeof opts.setDx === 'function') {
        opts.setDx(fieldKey, c ? String(c.value || '').trim() : '', !!(m && m.checked));
      }
      if (typeof opts.persist === 'function') opts.persist();
      paintLabel();
    }
    paintLabel();
    if (readonly) return;

    var q = host.querySelector('[data-cie-q]');
    var hits = host.querySelector('[data-cie-hits]');
    var codeEl = host.querySelector('[data-cie-code]');
    var man = host.querySelector('[data-cie-manual]');
    function search() {
      if (!hits || typeof g.afCieQxSearch !== 'function') return;
      var rows = g.afCieQxSearch(q.value, 12);
      hits.innerHTML = rows
        .map(function (r) {
          return (
            '<button type="button" class="btn btn-s" data-cie-pick="' +
            r.c +
            '" style="display:block;width:100%;text-align:left;margin:2px 0;font-size:12px">' +
            r.c +
            ' — ' +
            r.d +
            '</button>'
          );
        })
        .join('');
    }
    if (q) q.addEventListener('input', search);
    if (hits) {
      hits.addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-cie-pick]');
        if (!b) return;
        if (man) man.checked = false;
        if (codeEl) {
          codeEl.value = b.getAttribute('data-cie-pick');
          codeEl.readOnly = true;
        }
        save();
      });
    }
    if (man) {
      man.addEventListener('change', function () {
        if (codeEl) codeEl.readOnly = !man.checked;
        save();
      });
    }
    if (codeEl) codeEl.addEventListener('change', save);
  }

  g.afMountCieQxField = afMountCieQxField;
})(typeof window !== 'undefined' ? window : globalThis);
