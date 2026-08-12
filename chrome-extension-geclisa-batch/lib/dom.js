(function (g) {
  function norm(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  /** GECLISA busca sin tildes: "Joaquín" → "Joaquin". */
  function quitarAcentos(texto) {
    return String(texto == null ? '' : texto)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /** Normaliza a DD/MM/AAAA (acepta ISO YYYY-MM-DD o ya DD/MM/AAAA). */
  function formatFechaGeclisa(fecha) {
    var s = norm(fecha);
    if (!s) return '';
    var iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return iso[3] + '/' + iso[2] + '/' + iso[1];
    var dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (dmy) {
      var dd = dmy[1].length === 1 ? '0' + dmy[1] : dmy[1];
      var mm = dmy[2].length === 1 ? '0' + dmy[2] : dmy[2];
      return dd + '/' + mm + '/' + dmy[3];
    }
    return s;
  }

  function todayDDMMYYYY() {
    var d = new Date();
    var dd = String(d.getDate());
    var mm = String(d.getMonth() + 1);
    if (dd.length === 1) dd = '0' + dd;
    if (mm.length === 1) mm = '0' + mm;
    return dd + '/' + mm + '/' + d.getFullYear();
  }

  /** Normaliza a HH:mm (acepta HH:mm:ss). */
  function formatHoraGeclisa(hora) {
    var s = norm(hora);
    if (!s) return '';
    var m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?/);
    if (m) {
      var hh = m[1].length === 1 ? '0' + m[1] : m[1];
      return hh + ':' + m[2];
    }
    var compact = s.match(/^(\d{2})(\d{2})$/);
    if (compact) return compact[1] + ':' + compact[2];
    return s;
  }

  /** Suma días a DD/MM/AAAA (o ISO) → DD/MM/AAAA. */
  function addDaysGeclisa(fecha, deltaDays) {
    var s = formatFechaGeclisa(fecha);
    var m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return '';
    var d = new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
    d.setDate(d.getDate() + (deltaDays || 0));
    var dd = String(d.getDate());
    var mm = String(d.getMonth() + 1);
    if (dd.length === 1) dd = '0' + dd;
    if (mm.length === 1) mm = '0' + mm;
    return dd + '/' + mm + '/' + d.getFullYear();
  }

  /** Resta/suma horas a HH:mm → HH:mm (cruza medianoche). */
  function addHoursGeclisa(hora, deltaHours) {
    var s = formatHoraGeclisa(hora);
    var m = s.match(/^(\d{2}):(\d{2})$/);
    if (!m) return '';
    var total = parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + Math.round((deltaHours || 0) * 60);
    total = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
    var hh = String(Math.floor(total / 60));
    var mm = String(total % 60);
    if (hh.length === 1) hh = '0' + hh;
    if (mm.length === 1) mm = '0' + mm;
    return hh + ':' + mm;
  }

  function waitFor(fn, opts) {
    opts = opts || {};
    var timeout = opts.timeout != null ? opts.timeout : 20000;
    var interval = opts.interval != null ? opts.interval : 200;
    var t0 = Date.now();
    return new Promise(function (resolve, reject) {
      (function tick() {
        var v;
        try { v = fn(); } catch (e) { v = null; }
        if (v) return resolve(v);
        if (Date.now() - t0 > timeout) {
          return reject(new Error(opts.label || 'waitFor timeout'));
        }
        setTimeout(tick, interval);
      })();
    });
  }

  function centerPoint(el) {
    var r = el.getBoundingClientRect();
    return {
      x: Math.round(r.left + r.width / 2),
      y: Math.round(r.top + r.height / 2),
      w: r.width,
      h: r.height
    };
  }

  function mouseOpts(el, extra) {
    var c = centerPoint(el);
    var o = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: c.x,
      clientY: c.y,
      screenX: c.x,
      screenY: c.y,
      button: 0,
      buttons: 1,
      detail: 1
    };
    if (extra) {
      Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
    }
    return o;
  }

  /**
   * Click síncrono con coordenadas del centro (getBoundingClientRect).
   * Preferí clickElAsync cuando haya framework (Angular).
   */
  function clickEl(el) {
    if (!el) throw new Error('clickEl: null');
    try { el.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (e) {}
    var optsDown = mouseOpts(el);
    var optsUp = mouseOpts(el, { buttons: 0 });
    try {
      el.dispatchEvent(new PointerEvent('pointerover', optsDown));
      el.dispatchEvent(new PointerEvent('pointerenter', optsDown));
    } catch (e0) {}
    el.dispatchEvent(new MouseEvent('mouseover', optsDown));
    el.dispatchEvent(new MouseEvent('mouseenter', optsDown));
    try { el.dispatchEvent(new PointerEvent('pointerdown', optsDown)); } catch (e1) {}
    el.dispatchEvent(new MouseEvent('mousedown', optsDown));
    try { el.dispatchEvent(new PointerEvent('pointerup', optsUp)); } catch (e2) {}
    el.dispatchEvent(new MouseEvent('mouseup', optsUp));
    el.dispatchEvent(new MouseEvent('click', mouseOpts(el, { buttons: 0 })));
  }

  /** Igual que clickEl pero async con delays entre fases (mejor para Angular). */
  function clickElAsync(el) {
    if (!el) return Promise.reject(new Error('clickElAsync: null'));
    try { el.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (e) {}
    var optsDown = mouseOpts(el);
    var optsUp = mouseOpts(el, { buttons: 0 });
    return Promise.resolve()
      .then(function () {
        try {
          el.dispatchEvent(new PointerEvent('pointerover', optsDown));
          el.dispatchEvent(new PointerEvent('pointerenter', optsDown));
        } catch (e0) {}
        el.dispatchEvent(new MouseEvent('mouseover', optsDown));
        el.dispatchEvent(new MouseEvent('mouseenter', optsDown));
        return g.AFG.sleep ? g.AFG.sleep(30) : Promise.resolve();
      })
      .then(function () {
        try { el.dispatchEvent(new PointerEvent('pointerdown', optsDown)); } catch (e1) {}
        el.dispatchEvent(new MouseEvent('mousedown', optsDown));
        return g.AFG.sleep ? g.AFG.sleep(40 + Math.floor(Math.random() * 40)) : Promise.resolve();
      })
      .then(function () {
        try { el.dispatchEvent(new PointerEvent('pointerup', optsUp)); } catch (e2) {}
        el.dispatchEvent(new MouseEvent('mouseup', optsUp));
        return g.AFG.sleep ? g.AFG.sleep(20) : Promise.resolve();
      })
      .then(function () {
        el.dispatchEvent(new MouseEvent('click', mouseOpts(el, { buttons: 0 })));
      });
  }

  /** Preferir <li> dentro de ul.sub-items (listener del framework suele estar ahí). */
  function findSubItemByText(root, text) {
    var want = norm(text).toLowerCase();
    var lis = root.querySelectorAll('ul.sub-items li, ul.sub-items.mt-3 li, li');
    for (var i = 0; i < lis.length; i++) {
      var li = lis[i];
      var t = norm(li.innerText || li.textContent || '').toLowerCase();
      if (t === want || t.indexOf(want) >= 0) {
        // Si el match es un li dentro de sub-items, devolver ese li
        if (li.closest && li.closest('ul.sub-items')) return li;
        if (li.parentElement && /sub-items/i.test(li.parentElement.className || '')) return li;
      }
    }
    return null;
  }

  function setSelectValue(sel, value) {
    sel.value = String(value);
    sel.dispatchEvent(new Event('input', { bubbles: true }));
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /** Setea <select> por value o por texto exacto de <option> (p.ej. #ddlSector). */
  function setSelectByValueOrText(sel, want) {
    if (!sel) return false;
    var target = norm(want);
    if (!target) return false;
    var opts = sel.options || [];
    for (var i = 0; i < opts.length; i++) {
      var t = norm(opts[i].textContent || opts[i].innerText || opts[i].label || '');
      var v = norm(opts[i].value);
      if (v === target || t === target) {
        sel.selectedIndex = i;
        sel.value = opts[i].value;
        sel.dispatchEvent(new Event('input', { bubbles: true }));
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  }

  function nativeValueSetter(el) {
    var proto = el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    return Object.getOwnPropertyDescriptor(proto, 'value');
  }

  function setNativeValue(el, value) {
    var desc = nativeValueSetter(el);
    if (desc && desc.set) desc.set.call(el, String(value));
    else el.value = String(value);
  }

  function dispatchInput(el, data, inputType) {
    try {
      el.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        data: data == null ? null : String(data),
        inputType: inputType || 'insertText'
      }));
    } catch (e) {
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  /** Asigna value + input/change (rápido). Preferir typeIntoInputAsync en Angular/jqGrid. */
  function setInputValue(el, value) {
    setNativeValue(el, value);
    dispatchInput(el, value, 'insertFromPaste');
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * Focus + borrado + tipeo char-a-char (keydown/keypress/input/keyup) + change + blur.
   * Para que GECLISA/Angular tome el valor interno, no solo el visual.
   */
  function typeIntoInputAsync(el, value) {
    if (!el) return Promise.reject(new Error('typeIntoInputAsync: null'));
    var text = String(value == null ? '' : value);
    var sleep = g.AFG.sleep || function (ms) {
      return new Promise(function (r) { setTimeout(r, ms); });
    };

    function keyOpts(ch, extra) {
      var o = {
        key: ch,
        code: ch.length === 1 ? 'Key' + ch.toUpperCase() : ch,
        bubbles: true,
        cancelable: true,
        view: window,
        composed: true
      };
      if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
      return o;
    }

    return Promise.resolve()
      .then(function () {
        try { el.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (e0) {}
        el.focus();
        el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        el.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
        return sleep(40);
      })
      .then(function () {
        // Limpiar contenido previo con eventos (no solo value='')
        setNativeValue(el, '');
        dispatchInput(el, null, 'deleteContentBackward');
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return sleep(40);
      })
      .then(function () {
        var i = 0;
        function nextChar() {
          if (i >= text.length) return Promise.resolve();
          var ch = text.charAt(i);
          i++;
          el.dispatchEvent(new KeyboardEvent('keydown', keyOpts(ch)));
          try { el.dispatchEvent(new KeyboardEvent('keypress', keyOpts(ch))); } catch (e1) {}
          setNativeValue(el, text.slice(0, i));
          dispatchInput(el, ch, 'insertText');
          el.dispatchEvent(new KeyboardEvent('keyup', keyOpts(ch)));
          return sleep(35 + Math.floor(Math.random() * 45)).then(nextChar);
        }
        return nextChar();
      })
      .then(function () {
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return sleep(50);
      })
      .then(function () {
        // Commit del modelo (Angular a menudo escucha blur)
        el.blur();
        el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
        el.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
      });
  }

  /** Texto visible exacto (normalizado) */
  function findByExactText(root, text, tags) {
    tags = tags || ['a', 'button', 'span', 'div', 'li', 'td', 'label'];
    var want = norm(text).toLowerCase();
    var nodes = root.querySelectorAll(tags.join(','));
    for (var i = 0; i < nodes.length; i++) {
      var t = norm(nodes[i].innerText || nodes[i].textContent || '');
      if (t.toLowerCase() === want) return nodes[i];
    }
    return null;
  }

  function findByContainsText(root, text, tags) {
    tags = tags || ['a', 'button', 'span', 'div', 'li', 'td', 'img'];
    var want = norm(text).toLowerCase();
    var nodes = root.querySelectorAll(tags.join(','));
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var t = norm(
        (el.innerText || el.textContent || '') + ' ' +
        (el.title || '') + ' ' +
        (el.getAttribute('aria-label') || '')
      ).toLowerCase();
      if (t.indexOf(want) >= 0 && t.length < 120) return el;
    }
    return null;
  }

  function findInputNearLabel(root, labelText) {
    var want = norm(labelText).toLowerCase();
    var labels = root.querySelectorAll('label');
    for (var i = 0; i < labels.length; i++) {
      var lt = norm(labels[i].innerText || labels[i].textContent || '').toLowerCase();
      if (lt.indexOf(want) < 0) continue;
      var forId = labels[i].getAttribute('for');
      if (forId) {
        var byFor = root.getElementById(forId);
        if (byFor) return byFor;
      }
      var inp = labels[i].querySelector('input,textarea');
      if (inp) return inp;
    }
    // placeholder / name
    var inputs = root.querySelectorAll('input[type="text"],input:not([type]),textarea');
    for (var j = 0; j < inputs.length; j++) {
      var p = norm(inputs[j].placeholder || inputs[j].name || inputs[j].id || '').toLowerCase();
      if (p.indexOf(want) >= 0) return inputs[j];
    }
    return null;
  }

  g.AFG = g.AFG || {};
  g.AFG.waitFor = waitFor;
  g.AFG.clickEl = clickEl;
  g.AFG.clickElAsync = clickElAsync;
  g.AFG.centerPoint = centerPoint;
  g.AFG.findSubItemByText = findSubItemByText;
  g.AFG.setSelectValue = setSelectValue;
  g.AFG.setSelectByValueOrText = setSelectByValueOrText;
  g.AFG.setInputValue = setInputValue;
  g.AFG.typeIntoInputAsync = typeIntoInputAsync;
  g.AFG.findByExactText = findByExactText;
  g.AFG.findByContainsText = findByContainsText;
  g.AFG.findInputNearLabel = findInputNearLabel;
  g.AFG.norm = norm;
  g.AFG.quitarAcentos = quitarAcentos;
  g.AFG.formatFechaGeclisa = formatFechaGeclisa;
  g.AFG.formatHoraGeclisa = formatHoraGeclisa;
  g.AFG.addDaysGeclisa = addDaysGeclisa;
  g.AFG.addHoursGeclisa = addHoursGeclisa;
  g.AFG.todayDDMMYYYY = todayDDMMYYYY;
})(typeof globalThis !== 'undefined' ? globalThis : window);
