/**
 * Motor de proformas fojaQx (Paso 2.3) — puro, sin DOM/HTML.
 * Filtra por especialidad, match por operación, required_if_*, render plantilla.
 * UI: js/44b-foja-qx-proformas-ui.js
 */
(function (g) {
  'use strict';

  function afProformasAll() {
    return g.AF_PROFORMAS || {};
  }

  function afProformasIndex() {
    return g.AF_PROFORMAS_INDEX || [];
  }

  function afProformaById(id) {
    if (!id) return null;
    return afProformasAll()[id] || null;
  }

  function afProformasByEspecialidad(esp) {
    var e = String(esp || '').trim();
    if (!e) return [];
    var idx = afProformasIndex();
    var out = [];
    for (var i = 0; i < idx.length; i++) {
      if (String(idx[i].especialidad || '').trim() === e) {
        var full = afProformaById(idx[i].id);
        if (full) out.push(full);
      }
    }
    return out;
  }

  function normOp(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Match por operación del caso (substring o igualdad normalizada). */
  function afProformasMatchOperacion(esp, operacion) {
    var list = afProformasByEspecialidad(esp);
    var op = normOp(operacion);
    if (!op) return list.slice();
    var matched = [];
    var rest = [];
    for (var i = 0; i < list.length; i++) {
      var ops = list[i].operaciones || [];
      var hit = false;
      for (var j = 0; j < ops.length; j++) {
        var n = normOp(ops[j]);
        if (n === op || n.indexOf(op) >= 0 || op.indexOf(n) >= 0) {
          hit = true;
          break;
        }
      }
      if (hit) matched.push(list[i]);
      else rest.push(list[i]);
    }
    return matched.concat(rest);
  }

  function slotValue(slots, id) {
    if (!slots || typeof slots !== 'object') return undefined;
    return slots[id];
  }

  function asArray(v) {
    if (v == null || v === '') return [];
    if (Array.isArray(v)) return v;
    return [v];
  }

  /** Evalúa required / required_if_<slotId> contra valores actuales. */
  function afProformaSlotIsRequired(slot, values) {
    if (!slot) return false;
    if (slot.required === true) return true;
    var keys = Object.keys(slot);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (k.indexOf('required_if_') !== 0) continue;
      var depId = k.slice('required_if_'.length);
      var need = asArray(slot[k]);
      var cur = asArray(slotValue(values, depId));
      for (var a = 0; a < need.length; a++) {
        for (var b = 0; b < cur.length; b++) {
          if (String(need[a]) === String(cur[b])) return true;
        }
      }
    }
    return false;
  }

  function afProformaSlotIsVisible(slot, values) {
    if (!slot) return false;
    var hasIf = false;
    var keys = Object.keys(slot);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf('required_if_') === 0) {
        hasIf = true;
        break;
      }
    }
    if (!hasIf) return true;
    return afProformaSlotIsRequired(slot, values) || _anyIfMatches(slot, values);
  }

  function _anyIfMatches(slot, values) {
    var keys = Object.keys(slot);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (k.indexOf('required_if_') !== 0) continue;
      var depId = k.slice('required_if_'.length);
      var need = asArray(slot[k]);
      var cur = asArray(slotValue(values, depId));
      for (var a = 0; a < need.length; a++) {
        for (var b = 0; b < cur.length; b++) {
          if (String(need[a]) === String(cur[b])) return true;
        }
      }
    }
    return false;
  }

  function _slotEmpty(raw) {
    return (
      raw == null ||
      (typeof raw === 'string' && !String(raw).trim()) ||
      (Array.isArray(raw) && !raw.length)
    );
  }

  /**
   * Quita valores de slots no visibles (iterativo: al cambiar de rama
   * no quedan PTH/para_* “fantasma” ni hijos de un padre oculto).
   */
  function afProformaPruneValues(proforma, values) {
    var v = {};
    var src = values || {};
    Object.keys(src).forEach(function (k) {
      v[k] = Array.isArray(src[k]) ? src[k].slice() : src[k];
    });
    if (!proforma || !proforma.slots) return v;
    var guard = 0;
    var changed = true;
    while (changed && guard < 20) {
      guard++;
      changed = false;
      for (var i = 0; i < proforma.slots.length; i++) {
        var sl = proforma.slots[i];
        if (!sl || !sl.id) continue;
        if (afProformaSlotIsVisible(sl, v)) continue;
        if (!_slotEmpty(v[sl.id])) {
          delete v[sl.id];
          changed = true;
        }
      }
    }
    return v;
  }

  function formatSlotValue(slot, raw) {
    if (!slot) return '';
    var empty = slot.empty_text != null ? String(slot.empty_text) : '';
    if (slot.type === 'multi') {
      var arr = asArray(raw).filter(function (x) {
        return x != null && String(x).trim() !== '';
      });
      if (!arr.length) return empty;
      var join = slot.join != null ? String(slot.join) : ', ';
      var s = arr.join(join);
      if (slot.suffix) s += String(slot.suffix);
      return s;
    }
    var val = raw == null ? '' : String(raw).trim();
    if (!val) return empty;
    if (slot.suffix) val += String(slot.suffix);
    return val;
  }

  /** Frases derivadas usadas en plantillas CyC (lado_frase, co2_frase, …). */
  function derivedFrases(proforma, values) {
    var out = {};
    var lado = slotValue(values, 'lado');
    out.lado_frase = lado ? ' Lado: ' + lado + '.' : '';
    var aparat = asArray(slotValue(values, 'aparatologia'));
    var co2 = slotValue(values, 'co2_param');
    var hasInsu = aparat.some(function (x) {
      return String(x).toLowerCase().indexOf('insuflador') >= 0;
    });
    out.co2_frase = hasInsu && co2 ? ' (CO2: ' + co2 + ')' : '';
    var dren = slotValue(values, 'drenaje');
    var det = slotValue(values, 'drenaje_detalle');
    out.drenaje_detalle_frase =
      String(dren) === 'Sí' && det ? ' (' + det + ')' : '';
    return out;
  }

  /**
   * Bloques condicionales en plantilla:
   *   {{#if_eq slotId "valor exacto"}}...{{/if_eq}}
   *   {{#if_filled slotId}}...{{/if_filled}}
   * Se evalúan después de prune; anidables (bucle hasta estabilizar).
   */
  function applyTemplateConditionals(text, values) {
    var out = String(text || '');
    var guard = 0;
    // Cuerpo sin {{#if_ anidado → procesa de adentro hacia afuera
    var reEq =
      /\{\{#if_eq\s+([a-zA-Z0-9_]+)\s+"([^"]*)"\s*\}\}((?:(?!\{\{#if_)[\s\S])*?)\{\{\/if_eq\}\}/;
    var reFilled =
      /\{\{#if_filled\s+([a-zA-Z0-9_]+)\s*\}\}((?:(?!\{\{#if_)[\s\S])*?)\{\{\/if_filled\}\}/;
    while (guard < 40) {
      guard++;
      var mEq = out.match(reEq);
      if (mEq) {
        var cur = slotValue(values, mEq[1]);
        var ok = String(cur == null ? '' : cur) === String(mEq[2]);
        out = out.slice(0, mEq.index) + (ok ? mEq[3] : '') + out.slice(mEq.index + mEq[0].length);
        continue;
      }
      var mF = out.match(reFilled);
      if (mF) {
        var raw = slotValue(values, mF[1]);
        var show = !_slotEmpty(raw);
        out = out.slice(0, mF.index) + (show ? mF[2] : '') + out.slice(mF.index + mF[0].length);
        continue;
      }
      break;
    }
    out = out
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\n+/, '')
      .replace(/\n+$/, '');
    return out;
  }

  function afProformaRender(proforma, values) {
    if (!proforma || !proforma.plantilla_texto) return '';
    var vals = afProformaPruneValues(proforma, values || {});
    var map = {};
    var slots = proforma.slots || [];
    for (var i = 0; i < slots.length; i++) {
      var sl = slots[i];
      if (!afProformaSlotIsVisible(sl, vals)) {
        map[sl.id] = '';
        continue;
      }
      map[sl.id] = formatSlotValue(sl, slotValue(vals, sl.id));
    }
    var der = derivedFrases(proforma, vals);
    Object.keys(der).forEach(function (k) {
      map[k] = der[k];
    });
    var body = applyTemplateConditionals(String(proforma.plantilla_texto), vals);
    return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, function (_, key) {
      return map[key] != null ? map[key] : '';
    });
  }

  /** Validación de required; retorna lista de labels faltantes. */
  function afProformaMissingRequired(proforma, values) {
    var missing = [];
    if (!proforma) return missing;
    var vals = afProformaPruneValues(proforma, values || {});
    var slots = proforma.slots || [];
    for (var i = 0; i < slots.length; i++) {
      var sl = slots[i];
      if (!afProformaSlotIsRequired(sl, vals)) continue;
      if (!afProformaSlotIsVisible(sl, vals)) continue;
      var raw = slotValue(vals, sl.id);
      if (_slotEmpty(raw)) missing.push(sl.label || sl.id);
    }
    return missing;
  }

  /**
   * Modos de armado:
   *  - usar: render directo
   *  - editar: render + texto editable (la UI decide)
   *  - cero: texto libre sin plantilla
   */
  function afProformaArmar(proforma, values, modo) {
    var m = modo || 'usar';
    if (m === 'cero' || !proforma) {
      return { modo_armado: 'cero', proforma_id: null, texto: (values && values._texto) || '', slots: {} };
    }
    var pruned = afProformaPruneValues(proforma, values || {});
    var texto = afProformaRender(proforma, pruned);
    return {
      modo_armado: m === 'editar' ? 'editar' : 'usar',
      proforma_id: proforma.id,
      texto: texto,
      slots: pruned,
    };
  }

  g.afProformasAll = afProformasAll;
  g.afProformasIndex = afProformasIndex;
  g.afProformaById = afProformaById;
  g.afProformasByEspecialidad = afProformasByEspecialidad;
  g.afProformasMatchOperacion = afProformasMatchOperacion;
  g.afProformaSlotIsRequired = afProformaSlotIsRequired;
  g.afProformaSlotIsVisible = afProformaSlotIsVisible;
  g.afProformaPruneValues = afProformaPruneValues;
  g.afProformaRender = afProformaRender;
  g.afProformaMissingRequired = afProformaMissingRequired;
  g.afProformaArmar = afProformaArmar;
})(typeof window !== 'undefined' ? window : globalThis);
