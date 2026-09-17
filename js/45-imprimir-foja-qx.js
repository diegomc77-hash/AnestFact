/**
 * Impresión A4 Foja Quirúrgica (módulo nuevo — no toca 12-imprimir-aero).
 * Solo si firmada. Firma PNG: usa memoria o fetch puntual a anesfact_foja_qx.
 */
function afFojaQxEsc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function afFojaQxFetchFirmaPng(inter) {
  return new Promise(function (resolve) {
    var qx = inter && inter.fojaQx;
    if (qx && qx.firma && qx.firma.png) {
      resolve({ png: String(qx.firma.png), fetched: false });
      return;
    }
    if (!inter || !inter.id) {
      resolve({ png: '', fetched: true, error: 'Sin intervención para buscar la firma' });
      return;
    }
    if (typeof AF_AUTH === 'undefined' || !AF_AUTH.isLoggedIn || !AF_AUTH.isLoggedIn()) {
      resolve({ png: '', fetched: true, error: 'Iniciá sesión para cargar la firma' });
      return;
    }
    var url =
      afSupabaseUrl() +
      '/rest/v1/anesfact_foja_qx?select=payload&inter_id=eq.' +
      encodeURIComponent(String(inter.id)) +
      '&firmada=eq.true&limit=1';
    fetch(url, { headers: afSupabaseHeaders({ Accept: 'application/json' }) })
      .then(function (r) {
        if (!r.ok) {
          resolve({
            png: '',
            fetched: true,
            error: 'No se pudo cargar la firma (error ' + r.status + '). Reintentá imprimir.',
          });
          return null;
        }
        return r.json();
      })
      .then(function (rows) {
        if (rows == null) return;
        var row = rows && rows[0];
        var png = row && row.payload && row.payload.firma && row.payload.firma.png;
        if (png && inter.fojaQx && inter.fojaQx.firma) inter.fojaQx.firma.png = String(png);
        if (png) {
          resolve({ png: String(png), fetched: true });
        } else {
          resolve({
            png: '',
            fetched: true,
            error: 'No se encontró el trazo de firma en la nube. No se imprime sin firma.',
          });
        }
      })
      .catch(function () {
        resolve({
          png: '',
          fetched: true,
          error: 'No se pudo cargar la firma (red). Reintentá imprimir.',
        });
      });
  });
}

function afImprimirFojaQx() {
  if (!S.cur || !S.cur.fojaQx) {
    if (typeof toast === 'function') toast('Sin foja quirúrgica');
    return;
  }
  if (typeof afFojaQxEnabled === 'function' && !afFojaQxEnabled(S.cur.san)) {
    if (typeof toast === 'function') toast('Foja quirúrgica no habilitada');
    return;
  }
  var qx = S.cur.fojaQx;
  if (!qx.firmada) {
    if (typeof toast === 'function') toast('Solo se imprime foja firmada');
    return;
  }

  if (typeof toast === 'function') toast('Preparando impresión…');
  afFojaQxFetchFirmaPng(S.cur).then(function (res) {
    var png = res && res.png ? res.png : '';
    if (!png) {
      if (typeof toast === 'function') {
        toast((res && res.error) || 'No se puede imprimir sin el trazo de firma.');
      }
      return;
    }

    var i = S.cur;
    var f = i.foja || {};
    var cab = qx.cabecera || {};
    var dx = qx.dx || {};
    var eq = qx.equipo || {};
    var clin = qx.clinicos || {};
    var firma = qx.firma || {};

    var html =
      '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">' +
      '<title>Foja Quirúrgica</title>' +
      '<style>' +
      '@page{size:A4;margin:14mm}' +
      'body{font-family:Georgia,"Times New Roman",serif;font-size:11pt;color:#111;line-height:1.35}' +
      'h1{font-size:16pt;margin:0 0 6px;letter-spacing:.02em}' +
      '.meta{font-size:10pt;color:#333;margin-bottom:12px}' +
      '.grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;margin:8px 0}' +
      '.lab{font-size:8.5pt;text-transform:uppercase;letter-spacing:.04em;color:#555}' +
      '.val{border-bottom:1px solid #ccc;min-height:1.2em;padding:2px 0}' +
      '.block{margin:12px 0}' +
      '.ct{font-weight:700;font-size:11pt;border-bottom:1.5px solid #222;margin:0 0 6px;padding-bottom:2px}' +
      '.texto{white-space:pre-wrap;border:1px solid #ccc;padding:8px;min-height:120px}' +
      '.firma{margin-top:20px;display:flex;gap:24px;align-items:flex-end}' +
      '.firma img{max-width:220px;max-height:80px;border:1px solid #999}' +
      '@media print{button{display:none}}' +
      '</style></head><body>' +
      '<h1>FOJA QUIRÚRGICA</h1>' +
      '<div class="meta">' +
      afFojaQxEsc(cab.sanatorio || i.san) +
      (qx.firmada_at ? ' · Firmada ' + afFojaQxEsc(new Date(qx.firmada_at).toLocaleString('es-AR')) : '') +
      '</div>' +
      '<div class="grid">' +
      '<div><div class="lab">Paciente</div><div class="val">' +
      afFojaQxEsc(cab.paciente || i.pac) +
      '</div></div>' +
      '<div><div class="lab">DNI</div><div class="val">' +
      afFojaQxEsc(cab.dni || i.dni) +
      '</div></div>' +
      '<div><div class="lab">Fecha</div><div class="val">' +
      afFojaQxEsc(cab.fecha || i.fecha) +
      '</div></div>' +
      '<div><div class="lab">Hora</div><div class="val">' +
      afFojaQxEsc((cab.hora_ini || i.hora || f.inicio || '') + (cab.hora_fin || f.fin ? ' — ' + (cab.hora_fin || f.fin) : '')) +
      '</div></div>' +
      '<div><div class="lab">Especialidad</div><div class="val">' +
      afFojaQxEsc(cab.especialidad || i.serv) +
      '</div></div>' +
      '<div><div class="lab">Cirujano</div><div class="val">' +
      afFojaQxEsc(eq.cirujano || i.ciru) +
      '</div></div>' +
      '</div>' +
      '<div class="block"><div class="ct">Diagnósticos / operación</div>' +
      '<div class="grid">' +
      '<div><div class="lab">Preoperatorio</div><div class="val">' +
      afFojaQxEsc(dx.preop) +
      (dx.cie_pre ? ' [' + afFojaQxEsc(dx.cie_pre) + ']' : '') +
      '</div></div>' +
      '<div><div class="lab">Posoperatorio</div><div class="val">' +
      afFojaQxEsc(dx.postop) +
      (dx.cie_post ? ' [' + afFojaQxEsc(dx.cie_post) + ']' : '') +
      '</div></div>' +
      '<div><div class="lab">Op. indicada</div><div class="val">' +
      afFojaQxEsc(dx.op_indicada) +
      '</div></div>' +
      '<div><div class="lab">Op. practicada</div><div class="val">' +
      afFojaQxEsc(dx.op_practicada) +
      '</div></div>' +
      '<div><div class="lab">Riesgo</div><div class="val">' +
      afFojaQxEsc(dx.riesgo) +
      '</div></div>' +
      '<div><div class="lab">Grado dificultad</div><div class="val">' +
      afFojaQxEsc(qx.grado_dificultad) +
      '</div></div>' +
      '</div></div>' +
      '<div class="block"><div class="ct">Fijos clínicos</div>' +
      '<div>Consentimiento: ' +
      afFojaQxEsc(clin.consentimiento === true ? 'Sí' : clin.consentimiento === false ? 'No' : '—') +
      ' · Gasas: ' +
      afFojaQxEsc(clin.gasas) +
      ' · ATB: ' +
      afFojaQxEsc(clin.atb === true ? 'Sí' : clin.atb === false ? 'No' : '—') +
      (clin.atb_detalle ? ' (' + afFojaQxEsc(clin.atb_detalle) + ')' : '') +
      '</div></div>' +
      '<div class="block"><div class="ct">Descripción del procedimiento</div>' +
      '<div class="texto">' +
      afFojaQxEsc(qx.texto) +
      '</div></div>' +
      '<div class="firma"><div>' +
      '<img src="' + png + '" alt="Firma">' +
      '<div class="lab" style="margin-top:4px">Firma del cirujano</div>' +
      '<div>' +
      afFojaQxEsc(firma.nombre) +
      (firma.mp ? ' · MP ' + afFojaQxEsc(firma.mp) : '') +
      '</div>' +
      '<div style="font-size:10pt">' +
      afFojaQxEsc(firma.especialidad) +
      '</div></div></div>' +
      '<p style="margin-top:16px"><button onclick="window.print()">Imprimir</button></p>' +
      '</body></html>';

    var w = window.open('', '_blank');
    if (!w) {
      if (typeof toast === 'function') toast('Permití ventanas emergentes para imprimir');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(function () {
      try { w.focus(); w.print(); } catch (e) {}
    }, 250);
  });
}
