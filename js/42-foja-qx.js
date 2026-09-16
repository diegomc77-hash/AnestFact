/**
 * Foja Quirúrgica (suite) — cáscara UI.
 * Entidad: S.cur.fojaQx (hermana de foja). Gating: afFojaQxEnabled(san).
 */
function cargarFojaQxUI() {
  if (!S.cur) return;
  if (typeof afEnsureFojaQx === 'function') afEnsureFojaQx(S.cur);
  var i = S.cur;
  var f = i.foja || {};
  var qx = i.fojaQx || {};

  function setTxt(id, v) {
    var el = document.getElementById(id);
    if (!el) return;
    var s = v == null ? '' : String(v).trim();
    el.textContent = s || '—';
  }

  setTxt('qx-inst-line', i.san);
  setTxt('qx-pac', i.pac);
  setTxt('qx-dni', i.dni);
  setTxt('qx-san', i.san);
  setTxt('qx-fecha', i.fecha);
  setTxt('qx-hora-ini', i.hora || f.inicio || '');
  setTxt('qx-hora-fin', f.fin || '');
  setTxt('qx-serv', i.serv);
  setTxt('qx-ciru', i.ciru);
  setTxt('qx-diag', i.diag);

  var textoEl = document.getElementById('qx-texto');
  if (textoEl) {
    var t = qx.texto != null ? String(qx.texto).trim() : '';
    textoEl.textContent = t || '(vacío — proformas en un paso posterior)';
    textoEl.style.color = t ? 'var(--text)' : 'var(--text3)';
  }

  var firmada = !!qx.firmada;
  var est = document.getElementById('qx-estado');
  if (est) est.textContent = firmada ? 'Firmada / sellada' : 'Borrador (cáscara)';
  var ft = document.getElementById('qx-firmada-txt');
  if (ft) ft.textContent = firmada ? 'firmada' : 'no firmada';
}

/**
 * Copia superficial sin fojaQx si el sanatorio tiene flag off.
 * No muta la intervención local (localStorage puede seguir teniendo stub inerte).
 */
function afIntervPayloadForSync(inter) {
  if (!inter) return inter;
  if (typeof afFojaQxEnabled === 'function' && afFojaQxEnabled(inter.san)) return inter;
  if (!Object.prototype.hasOwnProperty.call(inter, 'fojaQx')) return inter;
  var out = {};
  for (var k in inter) {
    if (Object.prototype.hasOwnProperty.call(inter, k) && k !== 'fojaQx') out[k] = inter[k];
  }
  return out;
}

function afIntervsPayloadForSync(list) {
  return (list || []).map(afIntervPayloadForSync);
}

/**
 * Dock «Foja qx»: siempre visible; disabled + toast vía go() si no hay
 * S.cur usable o institución con foja_qx off (Mayo).
 */
function afSyncDockFojaQx() {
  var btn = document.querySelector('#af-dock .dock-item[data-dock="fojaQx"]');
  if (!btn) return;
  var ok = !!(S.cur && typeof afFojaQxEnabled === 'function' && afFojaQxEnabled(S.cur.san));
  btn.classList.toggle('is-disabled', !ok);
  btn.setAttribute('aria-disabled', ok ? 'false' : 'true');
  if (!S.cur) btn.title = 'Abrí una intervención primero';
  else if (!ok) btn.title = 'Foja quirúrgica no habilitada en esta institución';
  else btn.title = 'Foja quirúrgica';
}
