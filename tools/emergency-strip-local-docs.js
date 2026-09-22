/**
 * EMERGENCIA AnesFact — pegar UNA vez en F12 Console (misma pestaña AnesFact).
 * Quita data URLs de adjuntos en fojas viejas SOLO en localStorage.
 * NO llama sync, NO tombstones, NO borra filas de Supabase.
 *
 * IMPORTANTE: también bloquea push/pull en ESTA sesión para que un auto-sync
 * no suba fojas sin docs ni vuelva a bajar los blobs y llene la cuota otra vez.
 * No uses «Subir ahora» hasta el fix IndexedDB. Si recargás, volvé a pegar el script
 * si la UI se congela otra vez (el pull puede rellenar desde la nube).
 */
(function () {
  var KEEP = 8; // últimas N fojas (por fecha/_ts) conservan docs completos
  var SAFE_ESTADOS = {
    enviado: 1,
    enviado_geclisa: 1,
    enviado_evweb: 1,
    preoperatorio: 1,
    listo: 1
  };

  function uidSuffix() {
    try {
      var s = JSON.parse(localStorage.getItem('af_auth_session') || 'null');
      return (s && s.user && s.user.id) ? ('_' + s.user.id) : '';
    } catch (e) {
      return '';
    }
  }

  var key = 'af_i' + uidSuffix();
  var raw = localStorage.getItem(key);
  if (!raw) {
    console.error('[AF emergencia] No encontré', key);
    return { ok: false, error: 'no_key', key: key };
  }

  var before = raw.length;
  var list;
  try {
    list = JSON.parse(raw);
  } catch (e) {
    console.error('[AF emergencia] JSON inválido', e);
    return { ok: false, error: 'bad_json' };
  }
  if (!Array.isArray(list)) {
    console.error('[AF emergencia] af_i no es array');
    return { ok: false, error: 'not_array' };
  }

  // Orden: más recientes primero
  var ranked = list.slice().sort(function (a, b) {
    var ta = (a && (a._ts || 0)) || 0;
    var tb = (b && (b._ts || 0)) || 0;
    if (tb !== ta) return tb - ta;
    var fa = String((a && a.fecha) || '');
    var fb = String((b && b.fecha) || '');
    return fb.localeCompare(fa);
  });
  var keepIds = {};
  ranked.slice(0, KEEP).forEach(function (it) {
    if (it && it.id) keepIds[String(it.id)] = 1;
  });

  var stripped = 0;
  var kept = 0;
  var charsFreed = 0;

  list.forEach(function (it) {
    if (!it || !it.id) return;
    var id = String(it.id);
    if (keepIds[id]) {
      kept++;
      return;
    }
    var est = String(it.estado || '');
    // Solo tocamos fojas “ya cerradas / preop”; las borrador recientes quedan en KEEP
    if (!SAFE_ESTADOS[est] && ranked.indexOf(it) < KEEP) return;
    if (!it.docs) return;

    ['anest', 'qx', 'auth'].forEach(function (t) {
      var d = it.docs[t];
      if (!d || !d.data) return;
      charsFreed += String(d.data).length;
      it.docs[t] = {
        nombre: d.nombre || ('doc-' + t),
        tipo: d.tipo || '',
        fecha: d.fecha || '',
        fuente: d.fuente || '',
        aliasOf: d.aliasOf || undefined,
        strippedLocal: true,
        sizeWas: d.size || String(d.data).length
      };
      if (!it.docs[t].aliasOf) delete it.docs[t].aliasOf;
      if (!it.docs[t].fuente) delete it.docs[t].fuente;
      stripped++;
    });
    // Evita que un pull LWW pise con remoto más viejo en esta sesión
    it._ts = Date.now();
  });

  // 1) Cancelar push diferido
  try {
    if (typeof syncCancelPushDebounced === 'function') syncCancelPushDebounced();
  } catch (eC) {}

  // 2) Bloquear sync en esta pestaña (push Y pull)
  try {
    sessionStorage.setItem('AF_EMERGENCY_NO_SYNC', '1');
  } catch (eS) {}
  function block(name, fn) {
    try {
      if (typeof window[name] === 'function') {
        window[name] = function () {
          console.warn('[AF emergencia] ' + name + ' bloqueado (no toca nube)');
          return Promise.resolve({ ok: true, skipped: 'emergency_no_sync' });
        };
      } else if (typeof fn === 'function') {
        /* noop */
      }
    } catch (eB) {}
  }
  block('syncAutoPush');
  block('syncAutoPull');
  block('syncPushAfterDelete');
  try {
    if (typeof syncAutoPushDebounced === 'function') {
      syncAutoPushDebounced = function () {
        console.warn('[AF emergencia] syncAutoPushDebounced bloqueado');
      };
    }
  } catch (eD) {}
  try {
    if (typeof syncGuardarSupabase === 'function') {
      syncGuardarSupabase = function () {
        console.warn('[AF emergencia] syncGuardarSupabase bloqueado');
        return Promise.resolve();
      };
    }
  } catch (eG) {}

  // 3) Persistir SOLO localStorage (no saveIntervsToStorage → evita side-effects)
  var out = JSON.stringify(list);
  try {
    localStorage.setItem(key, out);
  } catch (eSet) {
    console.error('[AF emergencia] setItem falló', eSet);
    return { ok: false, error: 'setItem_failed', detail: String(eSet && eSet.message || eSet) };
  }

  // 4) Alinear memoria de la página
  try {
    if (typeof S !== 'undefined') S.intervs = list;
  } catch (eMem) {}

  // 5) Colas locales con blobs (evweb no va a Supabase; igual liberan cuota)
  ['afg_evweb_queue', 'afg_geclisa_queue'].forEach(function (qk) {
    try {
      var qr = localStorage.getItem(qk);
      if (!qr) return;
      var q = JSON.parse(qr);
      if (!q || !q.items) return;
      var changed = false;
      q.items.forEach(function (it) {
        if (it && it.docs) {
          Object.keys(it.docs).forEach(function (t) {
            if (it.docs[t] && it.docs[t].data) {
              delete it.docs[t].data;
              it.docs[t].strippedLocal = true;
              changed = true;
            }
          });
        }
      });
      if (changed) localStorage.setItem(qk, JSON.stringify(q));
    } catch (eQ) {}
  });

  var report = {
    ok: true,
    key: key,
    beforeKB: Math.round(before * 2 / 1024),
    afterKB: Math.round(out.length * 2 / 1024),
    freedKB: Math.round(charsFreed * 2 / 1024),
    docsSlotsStripped: stripped,
    fojasKeptFull: kept,
    keepN: KEEP,
    syncBlockedThisTab: true,
    nube: 'NO tocada (sin push, sin tombstones)'
  };
  console.log('[AF emergencia] listo', report);
  try {
    if (typeof toast === 'function') {
      toast('Emergencia OK: liberados ~' + report.freedKB + ' KB locales. Sync pausado en esta pestaña.');
    }
  } catch (eT) {}
  try {
    if (typeof renderHome === 'function') renderHome();
  } catch (eR) {}
  return report;
})();
