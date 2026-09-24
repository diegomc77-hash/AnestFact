/**
 * Pegar UNA vez en F12 de AnesFact (después de la prueba).
 * Trae solo las últimas 15 entradas (texto corto, no se trunca en el chat).
 */
(function () {
  var done = false;
  function on(ev) {
    if (ev.source !== window) return;
    var d = ev.data;
    if (!d || d.source !== 'AFG_EXT' || d.type !== 'DIAG_DUMP_RESULT') return;
    done = true;
    window.removeEventListener('message', on);
    var header =
      '[AFG diag] bridge=' + (d.bridge || '?') +
      ' total=' + (d.totalEntries != null ? d.totalEntries : '?') +
      ' last=' + (d.returned != null ? d.returned : '?') +
      '/' + (d.limit != null ? d.limit : 15) +
      (d.ok ? '' : (' ERROR=' + (d.error || '?')));
    var body = d.text || (d.entries
      ? d.entries.map(function (e) {
          return (e.t || '') + ' | ' + (e.src || '') + ' | ' + (e.tag || '');
        }).join('\n')
      : '(vacío)');
    var out = header + '\n' + body;
    console.log(out);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(out).then(function () {
          console.log('[AFG] últimas entradas copiadas — pegá eso en el chat');
        });
      }
    } catch (eC) {}
  }
  window.addEventListener('message', on);
  window.postMessage({ source: 'AFG_ANESFACT', type: 'DIAG_DUMP', limit: 15 }, '*');
  setTimeout(function () {
    if (!done) {
      console.error(
        '[AFG] Sin respuesta del bridge. Cerrá AnesFact, recargá ext 0.6.9+, abrí AnesFact de nuevo.'
      );
    }
  }, 2500);
})();
