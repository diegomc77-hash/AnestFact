/**
 * Pull foja quirúrgica firmada (QR cirujano) → S.intervs[].fojaQx.
 * Tabla: anesfact_foja_qx (RLS select own). No toca af-qr-* / valoración.
 */
var _afFojaQxSyncInFlight = null;

function afFojaQxFirmaSinPng(firma) {
  var f = firma && typeof firma === 'object' ? firma : {};
  return {
    nombre: f.nombre != null ? String(f.nombre) : '',
    mp: f.mp != null ? String(f.mp) : '',
    especialidad: f.especialidad != null ? String(f.especialidad) : '',
  };
}

/**
 * Para sync nube: no mandar firma.png (data URL grande).
 * Se llama desde afIntervPayloadForSync si existe.
 */
function afFojaQxForSyncPayload(qx) {
  if (!qx || typeof qx !== 'object') return qx;
  var out = {};
  for (var k in qx) {
    if (!Object.prototype.hasOwnProperty.call(qx, k)) continue;
    if (k === 'firma') out.firma = afFojaQxFirmaSinPng(qx.firma);
    else out[k] = qx[k];
  }
  return out;
}

function afApplyFojaQxRow(row) {
  if (!row || !row.inter_id) return false;
  var interId = String(row.inter_id);
  var list = S.intervs || [];
  var ix = -1;
  for (var n = 0; n < list.length; n++) {
    if (list[n] && String(list[n].id) === interId) {
      ix = n;
      break;
    }
  }
  if (ix < 0) return false;

  var inter = list[ix];
  if (typeof afFojaQxEnabled === 'function' && !afFojaQxEnabled(inter.san)) return false;
  if (typeof afEnsureFojaQx === 'function') afEnsureFojaQx(inter);

  var existing = inter.fojaQx || {};
  var rowAt = row.firmada_at || row.submitted_at || '';
  if (existing.firmada && String(existing.foja_qx_id || '') === String(row.id || '') &&
      String(existing.firmada_at || '') === String(rowAt)) {
    return false;
  }
  if (existing.firmada_at && rowAt) {
    try {
      if (new Date(rowAt).getTime() < new Date(existing.firmada_at).getTime()) return false;
    } catch (eT) {}
  }

  var p = row.payload && typeof row.payload === 'object' ? row.payload : {};
  var firmaIn = p.firma && typeof p.firma === 'object' ? p.firma : {};

  inter.fojaQx = {
    version: p.version != null ? p.version : 1,
    slots: p.slots && typeof p.slots === 'object' ? p.slots : {},
    texto: p.texto != null ? String(p.texto) : '',
    firmada: true,
    equipo: p.equipo && typeof p.equipo === 'object' ? p.equipo : {},
    dx: p.dx && typeof p.dx === 'object' ? p.dx : {},
    clinicos: p.clinicos && typeof p.clinicos === 'object' ? p.clinicos : {},
    grado_dificultad: p.grado_dificultad != null ? String(p.grado_dificultad) : '',
    firma: {
      nombre: firmaIn.nombre != null ? String(firmaIn.nombre) : '',
      mp: firmaIn.mp != null ? String(firmaIn.mp) : '',
      especialidad: firmaIn.especialidad != null ? String(firmaIn.especialidad) : '',
      png: firmaIn.png != null ? String(firmaIn.png) : '',
    },
    cabecera: p.cabecera && typeof p.cabecera === 'object' ? p.cabecera : {},
    foja_qx_id: row.id || null,
    firmada_at: rowAt || null,
    last_qr_token_id: existing.last_qr_token_id || null,
  };

  list[ix] = inter;
  if (S.cur && String(S.cur.id) === interId) S.cur = inter;
  return true;
}

function afSyncFojaQxPullShouldRun() {
  if (typeof afFojaQxEnabled !== 'function') return false;
  var list = S.intervs || [];
  for (var n = 0; n < list.length; n++) {
    var it = list[n];
    if (it && afFojaQxEnabled(it.san)) return true;
  }
  return false;
}

function afSyncFojaQxPull() {
  if (typeof AF_AUTH === 'undefined' || !AF_AUTH.isLoggedIn || !AF_AUTH.isLoggedIn()) {
    return Promise.resolve({ ok: false, reason: 'auth' });
  }
  if (!afSyncFojaQxPullShouldRun()) {
    return Promise.resolve({ ok: true, skipped: 'no_foja_qx', applied: 0 });
  }
  if (_afFojaQxSyncInFlight) return _afFojaQxSyncInFlight;
  _afFojaQxSyncInFlight = afSyncFojaQxPullRun().then(function (r) {
    _afFojaQxSyncInFlight = null;
    return r;
  }, function (err) {
    _afFojaQxSyncInFlight = null;
    return { ok: false, error: err && err.message };
  });
  return _afFojaQxSyncInFlight;
}

function afSyncFojaQxPullRun() {
  var url = afSupabaseUrl() +
    '/rest/v1/anesfact_foja_qx?select=id,inter_id,sanatorio,payload,firmada,firmada_at,submitted_at&firmada=eq.true&order=submitted_at.desc&limit=80';
  return fetch(url, { headers: afSupabaseHeaders() })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (rows) {
      if (!Array.isArray(rows)) return { ok: true, applied: 0 };
      var applied = 0;
      rows.forEach(function (row) {
        if (afApplyFojaQxRow(row)) applied++;
      });
      if (applied) {
        try { saveIntervsToStorage(); } catch (eS) {}
        if (typeof syncAutoPushDebounced === 'function') syncAutoPushDebounced();
        if (S.cur && typeof _cargarFojaQxUIDom === 'function') {
          try { _cargarFojaQxUIDom(); } catch (eU) {}
        }
      }
      return { ok: true, applied: applied };
    })
    .catch(function (err) {
      try { console.warn('[AF] sync fojaQx pull', err); } catch (e2) {}
      return { ok: false, error: err && err.message };
    });
}
