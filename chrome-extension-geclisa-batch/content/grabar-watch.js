/**
 * Tras fillOk: detecta click en GRABAR/Guardar en la foja GECLISA
 * y avisa al background para auto-avanzar la cola (sin clickear Guardar nosotros).
 */
(function () {
  if (window.__AFG_GRABAR_WATCH__) return;
  window.__AFG_GRABAR_WATCH__ = true;

  function norm(s) {
    return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function isGrabarEl(el) {
    if (!el || el.disabled) return false;
    var tag = (el.tagName || '').toUpperCase();
    if (tag !== 'BUTTON' && tag !== 'INPUT' && tag !== 'A' && tag !== 'SPAN' && tag !== 'DIV') {
      return false;
    }
    var t = norm(
      (el.value || '') + ' ' +
      (el.innerText || el.textContent || '') + ' ' +
      (el.title || '') + ' ' +
      (el.getAttribute('aria-label') || '') + ' ' +
      (el.id || '') + ' ' +
      (el.name || '')
    );
    if (!t) return false;
    if (/cancel|cerrar|salir|volver|eliminar|borrar|imprimir/.test(t)) return false;
    return /\bgrabar\b/.test(t) || /\bguardar\b/.test(t);
  }

  function pageLooksSaved() {
    var body = norm(document.body && (document.body.innerText || document.body.textContent) || '');
    if (/error\s+al\s+grabar|no\s+se\s+pudo\s+guardar|fall[oó]\s+al\s+grabar/.test(body)) {
      return { ok: false, reason: 'save_error_text' };
    }
    if (/grabad[oa]\s+con\s+Éxito|grabado\s+correct|guardado\s+correct|se\s+grab[oó]\s+correct|operaci[oó]n\s+exitosa|datos\s+grabados/.test(body)) {
      return { ok: true, reason: 'success_text' };
    }
    return null;
  }

  var pending = false;

  function notifySaved(meta) {
    try {
      chrome.runtime.sendMessage({
        type: 'AFG_USER_SAVED_FOJA',
        via: meta.via || 'grabar_click',
        tag: meta.tag || '',
        id: meta.id || '',
        text: meta.text || '',
        confirmed: !!meta.confirmed,
        reason: meta.reason || ''
      });
    } catch (e) {}
  }

  function afterGrabarClick(el) {
    if (pending) return;
    pending = true;
    var meta = {
      via: 'grabar_click',
      tag: el.tagName || '',
      id: el.id || '',
      text: norm(el.value || el.innerText || '').slice(0, 48)
    };
    // Aviso inmediato (background espera confirmación / delay)
    notifySaved(Object.assign({}, meta, { confirmed: false, reason: 'clicked' }));

    var started = Date.now();
    var iv = setInterval(function () {
      var look = pageLooksSaved();
      if (look && look.ok) {
        clearInterval(iv);
        pending = false;
        notifySaved(Object.assign({}, meta, { confirmed: true, reason: look.reason }));
        return;
      }
      if (look && look.ok === false) {
        clearInterval(iv);
        pending = false;
        notifySaved(Object.assign({}, meta, { confirmed: false, reason: look.reason, saveFailed: true }));
        return;
      }
      // Si no hay toast claro, a los 2.8s igual confirmar (GECLISA a veces no muestra texto estable)
      if (Date.now() - started > 2800) {
        clearInterval(iv);
        pending = false;
        notifySaved(Object.assign({}, meta, { confirmed: true, reason: 'timeout_assume_ok' }));
      }
    }, 200);
  }

  document.addEventListener('click', function (ev) {
    var el = ev.target;
    for (var i = 0; i < 6 && el; i++) {
      if (isGrabarEl(el)) {
        afterGrabarClick(el);
        return;
      }
      el = el.parentElement;
    }
  }, true);

  try {
    console.log('[AFG grabar-watch] armado', location.href.slice(0, 80));
  } catch (e) {}
})();
