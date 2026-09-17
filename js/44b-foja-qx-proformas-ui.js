/**
 * UI de proformas fojaQx (DOM) — depende del motor puro js/44-foja-qx-proformas.js.
 */
(function (g) {
  'use strict';

  function asArray(v) {
    if (v == null || v === '') return [];
    if (Array.isArray(v)) return v;
    return [v];
  }

  /** Lee valores de slots desde un contenedor con [data-qx-slot]. */
  function afProformaReadSlots(root) {
    var out = {};
    if (!root) return out;
    var nodes = root.querySelectorAll('[data-qx-slot]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var id = el.getAttribute('data-qx-slot');
      if (!id) continue;
      var typ = el.getAttribute('data-qx-type') || 'free';
      if (typ === 'multi') {
        var checked = el.querySelectorAll('input[type="checkbox"]:checked');
        var arr = [];
        for (var j = 0; j < checked.length; j++) arr.push(checked[j].value);
        out[id] = arr;
      } else if (typ === 'single') {
        out[id] = el.value || '';
      } else {
        out[id] = el.value || '';
      }
    }
    return out;
  }

  /**
   * Monta selector + slots + preview en `host`.
   * opts: { especialidad, operacion, values, proformaId, modo, readonly, onChange, texto }
   */
  function afProformaMountUI(host, opts) {
    if (!host) return null;
    if (typeof g.afProformaById !== 'function') {
      try { console.error('[AF] afProformaMountUI: falta motor 44'); } catch (e) {}
      return null;
    }
    opts = opts || {};
    var ro = !!opts.readonly;
    var esp = opts.especialidad || '';
    var list = g.afProformasMatchOperacion(esp, opts.operacion || '');
    var curId = opts.proformaId || (list[0] && list[0].id) || '';
    var modo = opts.modo || 'usar';
    var values = Object.assign({}, opts.values || {});
    /** Snapshot de slots al primer retoque manual del texto (modo editar). */
    var slotsAtTextTouch = null;
    var staleSlotLabels = [];

    function cloneSlots(v) {
      var out = {};
      var src = v || {};
      Object.keys(src).forEach(function (k) {
        out[k] = Array.isArray(src[k]) ? src[k].slice() : src[k];
      });
      return out;
    }

    function slotNorm(v) {
      if (Array.isArray(v)) return JSON.stringify(v.slice().map(String).sort());
      return String(v == null ? '' : v);
    }

    function labelsForChangedSlots(before, after, proforma) {
      var labels = [];
      var seen = {};
      var keys = {};
      Object.keys(before || {}).forEach(function (k) { keys[k] = 1; });
      Object.keys(after || {}).forEach(function (k) { keys[k] = 1; });
      var slotById = {};
      (proforma && proforma.slots ? proforma.slots : []).forEach(function (s) {
        if (s && s.id) slotById[s.id] = s;
      });
      Object.keys(keys).forEach(function (k) {
        if (slotNorm(before[k]) === slotNorm(after[k])) return;
        var lab = (slotById[k] && slotById[k].label) || k;
        if (!seen[lab]) {
          seen[lab] = 1;
          labels.push(lab);
        }
      });
      return labels;
    }

    function paintStaleWarn() {
      var el = host.querySelector('[data-qx-stale-warn]');
      if (!el) return;
      if (!staleSlotLabels.length) {
        el.style.display = 'none';
        el.textContent = '';
        return;
      }
      var names = staleSlotLabels.join('», «');
      el.style.display = 'block';
      el.textContent =
        'Cambiaste «' +
        names +
        '», pero el texto no se actualizó automáticamente. Revisalo antes de firmar.';
    }

    function clearStaleWarn() {
      slotsAtTextTouch = null;
      staleSlotLabels = [];
      paintStaleWarn();
    }

    function emit() {
      if (typeof opts.onChange === 'function') {
        var p = g.afProformaById(curId);
        var valsRaw = afProformaReadSlots(host.querySelector('[data-qx-slots]'));
        var vals =
          p && typeof g.afProformaPruneValues === 'function'
            ? g.afProformaPruneValues(p, valsRaw)
            : valsRaw;
        values = vals;
        var textoEl = host.querySelector('[data-qx-preview]');
        var texto =
          modo === 'cero'
            ? (textoEl ? textoEl.value : '')
            : textoEl && !textoEl.readOnly
              ? textoEl.value
              : g.afProformaRender(p, vals);
        opts.onChange({
          proforma_id: modo === 'cero' ? null : curId || null,
          modo_armado: modo,
          slots: modo === 'cero' ? {} : vals,
          texto: texto,
          missing: p && modo !== 'cero' ? g.afProformaMissingRequired(p, vals) : [],
          texto_desactualizado: staleSlotLabels.length > 0,
        });
      }
    }

    function renderSlots() {
      var wrap = host.querySelector('[data-qx-slots]');
      var prev = host.querySelector('[data-qx-preview]');
      if (!wrap) return;
      wrap.innerHTML = '';
      if (modo === 'cero') {
        wrap.innerHTML = '<p style="font-size:12px;color:var(--text3);margin:0">Texto libre (sin plantilla).</p>';
        if (prev) {
          prev.readOnly = ro;
          if (!prev.value && opts.texto) prev.value = opts.texto;
        }
        emit();
        return;
      }
      var p = g.afProformaById(curId);
      if (!p) {
        wrap.innerHTML = '<p style="font-size:12px;color:var(--text3);margin:0">Sin proformas para esta especialidad.</p>';
        if (prev) prev.value = opts.texto || '';
        emit();
        return;
      }
      var html = '';
      for (var i = 0; i < (p.slots || []).length; i++) {
        var sl = p.slots[i];
        if (!g.afProformaSlotIsVisible(sl, values)) continue;
        var req = g.afProformaSlotIsRequired(sl, values);
        var lab = (sl.label || sl.id) + (req ? ' *' : '');
        var cur = values[sl.id];
        if (sl.type === 'multi') {
          var optsHtml = '';
          var sel = asArray(cur);
          for (var o = 0; o < (sl.options || []).length; o++) {
            var op = sl.options[o];
            var ck = sel.indexOf(op) >= 0 ? ' checked' : '';
            optsHtml +=
              '<label style="display:flex;gap:6px;align-items:center;font-size:13px;margin:4px 0">' +
              '<input type="checkbox" value="' +
              _esc(op) +
              '"' +
              ck +
              (ro ? ' disabled' : '') +
              '> ' +
              _esc(op) +
              '</label>';
          }
          html +=
            '<div class="field" data-qx-slot="' +
            _esc(sl.id) +
            '" data-qx-type="multi"><label>' +
            _esc(lab) +
            '</label>' +
            optsHtml +
            '</div>';
        } else if (sl.type === 'single') {
          var opts2 = '<option value="">—</option>';
          for (var o2 = 0; o2 < (sl.options || []).length; o2++) {
            var op2 = sl.options[o2];
            var sel2 = String(cur || '') === String(op2) ? ' selected' : '';
            opts2 += '<option value="' + _esc(op2) + '"' + sel2 + '>' + _esc(op2) + '</option>';
          }
          html +=
            '<div class="field"><label>' +
            _esc(lab) +
            '</label><select class="fi" data-qx-slot="' +
            _esc(sl.id) +
            '" data-qx-type="single"' +
            (ro ? ' disabled' : '') +
            '>' +
            opts2 +
            '</select></div>';
        } else {
          html +=
            '<div class="field"><label>' +
            _esc(lab) +
            '</label><input class="fi" data-qx-slot="' +
            _esc(sl.id) +
            '" data-qx-type="free" value="' +
            _esc(cur == null ? '' : cur) +
            '"' +
            (ro ? ' readonly' : '') +
            '></div>';
        }
      }
      wrap.innerHTML = html;
      if (prev) {
        var rendered = g.afProformaRender(p, values);
        if (modo === 'editar' || modo === 'usar') {
          if (!ro && modo === 'editar') {
            prev.readOnly = false;
            if (!prev.dataset.touched) prev.value = rendered;
          } else {
            prev.readOnly = true;
            prev.value = rendered;
          }
        }
      }
      wrap.onchange = wrap.oninput = function () {
        var raw = afProformaReadSlots(wrap);
        var pNow = g.afProformaById(curId);
        values =
          pNow && typeof g.afProformaPruneValues === 'function'
            ? g.afProformaPruneValues(pNow, raw)
            : raw;
        var vis = [];
        if (pNow) {
          for (var vi = 0; vi < (pNow.slots || []).length; vi++) {
            if (g.afProformaSlotIsVisible(pNow.slots[vi], values)) vis.push(pNow.slots[vi].id);
          }
        }
        var visKey = vis.join('|');
        if (prev && prev.dataset.touched && slotsAtTextTouch && modo === 'editar') {
          staleSlotLabels = labelsForChangedSlots(slotsAtTextTouch, values, pNow);
          paintStaleWarn();
        }
        if (wrap.getAttribute('data-vis') !== visKey) {
          wrap.setAttribute('data-vis', visKey);
          renderSlots();
          return;
        }
        if (prev && (modo === 'usar' || (modo === 'editar' && !prev.dataset.touched))) {
          prev.value = g.afProformaRender(pNow, values);
        }
        emit();
      };
      if (prev && prev.dataset.touched && slotsAtTextTouch && modo === 'editar') {
        staleSlotLabels = labelsForChangedSlots(slotsAtTextTouch, values, p);
        paintStaleWarn();
      }
      emit();
    }

    function _esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;');
    }

    var selOpts = '<option value="">— elegir —</option>';
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      selOpts +=
        '<option value="' +
        _esc(it.id) +
        '"' +
        (it.id === curId ? ' selected' : '') +
        '>' +
        _esc(it.titulo || it.id) +
        '</option>';
    }

    host.innerHTML =
      '<div class="field"><label>Proforma</label>' +
      '<select class="fi" data-qx-proforma-sel' +
      (ro ? ' disabled' : '') +
      '>' +
      selOpts +
      '</select></div>' +
      '<div class="brow" style="margin:8px 0;gap:6px;flex-wrap:wrap" data-qx-modos>' +
      '<button type="button" class="btn btn-s" data-qx-modo="usar">Usar</button>' +
      '<button type="button" class="btn btn-s" data-qx-modo="editar">Editar y usar</button>' +
      '<button type="button" class="btn btn-s" data-qx-modo="cero">Desde cero</button>' +
      '</div>' +
      '<div data-qx-slots></div>' +
      '<div class="field" style="margin-top:10px"><label>Texto del procedimiento</label>' +
      '<textarea class="fi" data-qx-preview rows="8"' +
      (ro ? ' readonly' : '') +
      '></textarea></div>' +
      '<p data-qx-stale-warn style="display:none;font-size:12px;color:var(--red);margin:6px 0 0;line-height:1.35"></p>' +
      '<p data-qx-missing style="font-size:12px;color:var(--red);margin:4px 0 0;min-height:1em"></p>';

    if (opts.texto && modo === 'cero') {
      var pv0 = host.querySelector('[data-qx-preview]');
      if (pv0) pv0.value = opts.texto;
    }

    var sel = host.querySelector('[data-qx-proforma-sel]');
    if (sel) {
      sel.onchange = function () {
        curId = sel.value;
        values = {};
        var pv = host.querySelector('[data-qx-preview]');
        if (pv) delete pv.dataset.touched;
        clearStaleWarn();
        renderSlots();
      };
    }
    var modos = host.querySelector('[data-qx-modos]');
    if (modos) {
      if (ro) modos.style.display = 'none';
      modos.onclick = function (ev) {
        var b = ev.target.closest('[data-qx-modo]');
        if (!b) return;
        modo = b.getAttribute('data-qx-modo');
        var pv = host.querySelector('[data-qx-preview]');
        if (pv) delete pv.dataset.touched;
        clearStaleWarn();
        renderSlots();
      };
    }
    var prevEl = host.querySelector('[data-qx-preview]');
    if (prevEl && !ro) {
      prevEl.addEventListener('input', function () {
        prevEl.dataset.touched = '1';
        if (!slotsAtTextTouch) slotsAtTextTouch = cloneSlots(values);
        emit();
      });
    }

    var origOnChange = opts.onChange;
    opts.onChange = function (st) {
      var miss = host.querySelector('[data-qx-missing]');
      if (miss) {
        miss.textContent = st.missing && st.missing.length ? 'Faltan: ' + st.missing.join(', ') : '';
      }
      if (typeof origOnChange === 'function') origOnChange(st);
    };

    renderSlots();
    return {
      refresh: renderSlots,
      getState: function () {
        var p = g.afProformaById(curId);
        var valsRaw = afProformaReadSlots(host.querySelector('[data-qx-slots]'));
        var vals =
          p && typeof g.afProformaPruneValues === 'function'
            ? g.afProformaPruneValues(p, valsRaw)
            : valsRaw;
        var textoEl = host.querySelector('[data-qx-preview]');
        return {
          proforma_id: modo === 'cero' ? null : curId || null,
          modo_armado: modo,
          slots: modo === 'cero' ? {} : vals,
          texto: textoEl ? textoEl.value : '',
          missing: p && modo !== 'cero' ? g.afProformaMissingRequired(p, vals) : [],
        };
      },
    };
  }

  g.afProformaReadSlots = afProformaReadSlots;
  g.afProformaMountUI = afProformaMountUI;
})(typeof window !== 'undefined' ? window : globalThis);
