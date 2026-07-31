(function () {
  var TOKEN = '';
  var ANT_CHIPS = [
    { k: 'HTA', label: 'Presión alta' },
    { k: 'DBT2', label: 'Diabetes' },
    { k: 'Cardiopatía', label: 'Problemas del corazón' },
    { k: 'MCP', label: 'Marcapasos o desfibrilador' },
    { k: 'IRC', label: 'Riñones (insuficiencia renal)' },
    { k: 'EPOC', label: 'Pulmones / EPOC (falta de aire crónica)' },
    { k: 'Asma', label: 'Asma' },
    { k: 'SAOS', label: 'Ronca mucho / apnea del sueño' },
    { k: 'Obesidad', label: 'Sobrepeso u obesidad' },
    { k: 'Embarazo', label: 'Embarazo' },
  ];
  var antSel = {};
  var estudiosFiles = [];
  var MAX_ESTUDIOS = 3;
  var MAX_KB = 600;

  function $(id) { return document.getElementById(id); }

  function parseToken() {
    return (new URLSearchParams(location.search).get('t') || '').trim();
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function closeAllAc() {
    document.querySelectorAll('.ac-list').forEach(function (el) { el.style.display = 'none'; });
  }

  function renderAc(listId, items, labelFn, subFn, onPick) {
    var el = $(listId);
    if (!el) return;
    if (!items.length) { el.style.display = 'none'; return; }
    el.innerHTML = items.map(function (item, i) {
      return '<div class="ac-item" data-i="' + i + '">' + labelFn(item) +
        (subFn ? '<small>' + subFn(item) + '</small>' : '') + '</div>';
    }).join('');
    el.onclick = function (e) {
      var t = e.target;
      while (t && t !== el) {
        if (t.classList && t.classList.contains('ac-item')) break;
        t = t.parentNode;
      }
      if (!t || !t.classList.contains('ac-item')) return;
      var idx = parseInt(t.getAttribute('data-i'), 10);
      if (!isNaN(idx)) onPick(items[idx]);
      closeAllAc();
    };
    el.style.display = 'block';
  }

  function wireObraAc() {
    var inp = $('v-obra');
    if (!inp || typeof OBRAS_SOCIALES === 'undefined') return;
    inp.addEventListener('input', function () {
      var q = inp.value.toLowerCase();
      if (q.length < 1) { closeAllAc(); return; }
      var hits = OBRAS_SOCIALES.filter(function (x) { return x.toLowerCase().indexOf(q) >= 0; }).slice(0, 10);
      renderAc('ac-v-obra', hits, function (x) { return x; }, null, function (x) { inp.value = x; });
    });
    inp.addEventListener('blur', function () { setTimeout(closeAllAc, 150); });
  }

  function wireAnticoagAc() {
    var inp = $('v-anticoag-farm');
    if (!inp || typeof ANTICOAG_COMUN === 'undefined') return;
    inp.addEventListener('input', function () {
      var q = inp.value.toLowerCase();
      if (q.length < 1) { closeAllAc(); return; }
      var hits = ANTICOAG_COMUN.filter(function (x) { return x.toLowerCase().indexOf(q) >= 0; }).slice(0, 8);
      renderAc('ac-v-anticoag', hits, function (x) { return x; }, null, function (x) { inp.value = x; });
    });
    inp.addEventListener('blur', function () { setTimeout(closeAllAc, 150); });
  }

  function calcImc() {
    var p = parseFloat($('v-peso').value);
    var t = parseFloat($('v-talla').value);
    var out = $('v-imc');
    if (!out) return;
    if (p > 0 && t > 0) out.value = (p / Math.pow(t / 100, 2)).toFixed(1);
    else out.value = '';
  }

  function renderAntChips() {
    var box = $('v-ant-chips');
    if (!box) return;
    box.innerHTML = '';
    ANT_CHIPS.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (antSel[c.k] ? ' sel' : '');
      b.textContent = c.label;
      b.onclick = function () {
        antSel[c.k] = !antSel[c.k];
        b.classList.toggle('sel', !!antSel[c.k]);
      };
      box.appendChild(b);
    });
  }

  function medRow(data) {
    var wrap = document.createElement('div');
    wrap.className = 'med-row';
    var uid = 'med-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    wrap.innerHTML =
      '<div class="ac-wrap" style="grid-column:1/-1"><input class="fi med-n" placeholder="Nombre del medicamento" value="' + esc(data && data.nombre) + '" autocomplete="off">' +
      '<div class="ac-list" id="ac-' + uid + '"></div></div>' +
      '<input class="fi med-d" placeholder="Dosis (ej. 10 mg)" value="' + esc(data && data.dosis) + '">' +
      '<input class="fi med-h" placeholder="Horario (ej. mañana)" value="' + esc(data && data.horario) + '">' +
      '<input class="fi med-v" placeholder="Cómo lo toma (pastilla, inyección)" value="' + esc(data && data.via) + '" style="grid-column:1/-1">';
    var nInp = wrap.querySelector('.med-n');
    var acId = 'ac-' + uid;
    nInp.addEventListener('input', function () {
      if (typeof MED_HABITUAL === 'undefined') return;
      var q = nInp.value.toLowerCase();
      if (q.length < 2) { $(acId).style.display = 'none'; return; }
      var hits = MED_HABITUAL.filter(function (d) {
        return d.n.toLowerCase().indexOf(q) >= 0 || d.cat.toLowerCase().indexOf(q) >= 0;
      }).slice(0, 8);
      renderAc(acId, hits, function (d) { return d.n; }, function (d) { return d.cat; }, function (d) {
        nInp.value = d.n;
        wrap.querySelector('.med-d').value = d.doses[0] || '';
        wrap.querySelector('.med-h').value = d.horario || '';
        wrap.querySelector('.med-v').value = d.via || 'VO';
      });
    });
    nInp.addEventListener('blur', function () { setTimeout(function () { var el = $(acId); if (el) el.style.display = 'none'; }, 150); });
    return wrap;
  }

  function collectMeds() {
    var rows = document.querySelectorAll('#v-meds .med-row');
    var out = [];
    rows.forEach(function (r) {
      var n = r.querySelector('.med-n').value.trim();
      if (!n) return;
      out.push({
        nombre: n,
        dosis: r.querySelector('.med-d').value.trim(),
        horario: r.querySelector('.med-h').value.trim(),
        via: r.querySelector('.med-v').value.trim(),
      });
    });
    return out;
  }

  function chipList() {
    return ANT_CHIPS.filter(function (c) { return antSel[c.k]; }).map(function (c) { return c.k; });
  }

  function renderEstList() {
    var box = $('v-est-list');
    if (!box) return;
    if (!estudiosFiles.length) { box.innerHTML = ''; return; }
    box.innerHTML = estudiosFiles.map(function (f, i) {
      return '<div class="est-item"><span>' + esc(f.label) + ' — ' + esc(f.nombre) + '</span>' +
        '<button type="button" class="btn btn-s" style="width:auto;padding:4px 10px;font-size:11px" data-i="' + i + '">Quitar</button></div>';
    }).join('');
    box.querySelectorAll('button[data-i]').forEach(function (btn) {
      btn.onclick = function () {
        var idx = parseInt(btn.getAttribute('data-i'), 10);
        estudiosFiles.splice(idx, 1);
        renderEstList();
        document.querySelectorAll('.est-btn').forEach(function (b) { b.classList.remove('has-file'); });
      };
    });
  }

  function wireEstudios() {
    document.querySelectorAll('.est-btn input[type=file]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var file = inp.files && inp.files[0];
        if (!file) return;
        if (estudiosFiles.length >= MAX_ESTUDIOS) {
          showErr('Máximo ' + MAX_ESTUDIOS + ' fotos de estudios.');
          inp.value = '';
          return;
        }
        if (file.size > MAX_KB * 1024) {
          showErr('La foto es muy pesada. Acercate más o saque otra más chica (máx. ' + MAX_KB + ' KB).');
          inp.value = '';
          return;
        }
        var tipo = inp.getAttribute('data-tipo') || 'otro';
        var labels = { laboratorio: 'Laboratorio', ecg: 'Electrocardiograma', ecocardiograma: 'Ecocardiograma', espirometria: 'Espirometría', otro: 'Otro estudio' };
        var reader = new FileReader();
        reader.onload = function () {
          estudiosFiles.push({
            tipo: tipo,
            label: labels[tipo] || tipo,
            nombre: file.name,
            mime: file.type || 'image/jpeg',
            kb: Math.round(file.size / 1024),
            data_b64: String(reader.result).split(',')[1] || '',
          });
          inp.closest('.est-btn').classList.add('has-file');
          renderEstList();
          hideErr();
        };
        reader.readAsDataURL(file);
        inp.value = '';
      });
    });
  }

  function readEstudiosPayload() {
    return {
      archivos: estudiosFiles.map(function (f) {
        return { tipo: f.tipo, nombre: f.nombre, mime: f.mime, kb: f.kb, data_b64: f.data_b64 };
      }),
      cantidad: estudiosFiles.length,
    };
  }

  function buildPayload() {
    var urg = $('v-urgencia').checked;
    return {
      token: TOKEN,
      nombre: $('v-nombre').value.trim(),
      dni: $('v-dni').value.trim(),
      diagnostico_cirugia: $('v-dx').value.trim(),
      motivo_valoracion: $('v-motivo').value,
      fecha_cirugia_programada: $('v-fecha-cx').value || null,
      datos_basicos: {
        edad: numOrNull($('v-edad').value),
        sexo: $('v-sexo').value || null,
        peso_kg: numOrNull($('v-peso').value),
        talla_cm: numOrNull($('v-talla').value),
        imc: numOrNull($('v-imc').value),
        obra_social: $('v-obra').value.trim() || null,
        afiliado: $('v-afil').value.trim() || null,
      },
      antecedentes: {
        chips: chipList(),
        anticoag: {
          farmaco: $('v-anticoag-farm').value.trim() || null,
          ultima_dosis: $('v-anticoag-dosis').value.trim() || null,
        },
        alergias: $('v-alergias').value.trim() || null,
      },
      medicacion: collectMeds(),
      antec_anestesicos: {
        cirugias_previas: $('v-cx-prev').value.trim() || null,
        anestesias_previas: $('v-an-prev').value.trim() || null,
        problemas: $('v-prob-an').value.trim() || null,
      },
      estudios_extraidos: readEstudiosPayload(),
      extras: {
        es_urgencia: urg,
        ayuno: urg ? {
          solido: $('v-ayuno-solido').value || null,
          liquido_claro: $('v-ayuno-liq').value || null,
        } : null,
        funcional_escaleras: $('v-func-escalera').checked,
        tabaco: $('v-tabaco').value.trim() || null,
        alcohol: $('v-alcohol').value.trim() || null,
        protesis_cuello: $('v-protesis').value.trim() || null,
        mcp_dai: $('v-mcp').value.trim() || null,
        fiebre_infeccion: $('v-fiebre').value.trim() || null,
        tvp_viaje: $('v-tvp').value.trim() || null,
      },
    };
  }

  function numOrNull(v) {
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }

  function showErr(msg) {
    $('val-err-msg').textContent = msg;
    $('val-err').classList.add('on');
  }

  function hideErr() {
    $('val-err').classList.remove('on');
  }

  function submitForm(e) {
    e.preventDefault();
    hideErr();
    var payload = buildPayload();
    if (!payload.nombre || !payload.dni || !payload.diagnostico_cirugia) {
      showErr('Completá nombre, DNI y qué operación le van a hacer.');
      return;
    }
    var btn = $('val-submit');
    btn.disabled = true;
    btn.textContent = 'Enviando…';

    fetch(afSupabaseUrl() + '/functions/v1/af-qr-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: AF_SUPABASE_KEY },
      body: JSON.stringify(payload),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || !res.j.ok) throw new Error((res.j && res.j.error) || 'No se pudo enviar');
        $('val-form-wrap').style.display = 'none';
        $('val-ok').style.display = 'block';
        if (res.j.asa_sugerido) {
          $('val-asa').textContent = 'Clasificación sugerida (orientativa): ASA ' + res.j.asa_sugerido;
        }
        window.scrollTo(0, 0);
      })
      .catch(function (err) {
        showErr(err.message || 'Error de conexión');
        btn.disabled = false;
        btn.textContent = 'Enviar valoración';
      });
  }

  function init() {
    TOKEN = parseToken();
    if (!TOKEN) return;
    $('val-invalid').classList.remove('on');
    $('val-form-wrap').style.display = 'block';
    renderAntChips();
    wireObraAc();
    wireAnticoagAc();
    wireEstudios();
    $('v-meds').appendChild(medRow(null));
    $('v-med-add').onclick = function () { $('v-meds').appendChild(medRow(null)); };
    $('v-peso').addEventListener('input', calcImc);
    $('v-talla').addEventListener('input', calcImc);
    $('v-urgencia').addEventListener('change', function () {
      $('v-ayuno-card').style.display = this.checked ? 'block' : 'none';
    });
    $('val-form').addEventListener('submit', submitForm);
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.ac-wrap')) closeAllAc();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
