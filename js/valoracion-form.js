(function () {
  var TOKEN = '';
  var ANT_CHIPS = ['HTA', 'DBT2', 'Cardiopatía', 'MCP', 'IRC', 'EPOC', 'Asma', 'SAOS', 'Obesidad', 'Embarazo'];
  var antSel = {};

  function $(id) { return document.getElementById(id); }

  function parseToken() {
    var q = new URLSearchParams(location.search);
    return (q.get('t') || '').trim();
  }

  function calcImc() {
    var p = parseFloat($('v-peso').value);
    var t = parseFloat($('v-talla').value);
    var out = $('v-imc');
    if (!out) return;
    if (p > 0 && t > 0) {
      var imc = p / Math.pow(t / 100, 2);
      out.value = imc.toFixed(1);
    } else {
      out.value = '';
    }
  }

  function renderAntChips() {
    var box = $('v-ant-chips');
    if (!box) return;
    box.innerHTML = '';
    ANT_CHIPS.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (antSel[c] ? ' sel' : '');
      b.textContent = c;
      b.onclick = function () {
        antSel[c] = !antSel[c];
        b.classList.toggle('sel', !!antSel[c]);
      };
      box.appendChild(b);
    });
  }

  function medRow(data) {
    var wrap = document.createElement('div');
    wrap.className = 'med-row';
    wrap.innerHTML =
      '<input class="fi med-n" placeholder="Medicamento" value="' + esc(data && data.nombre) + '">' +
      '<input class="fi med-d" placeholder="Dosis" value="' + esc(data && data.dosis) + '">' +
      '<input class="fi med-h" placeholder="Horario" value="' + esc(data && data.horario) + '">' +
      '<input class="fi med-v" placeholder="Vía" value="' + esc(data && data.via) + '">';
    return wrap;
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
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
    return ANT_CHIPS.filter(function (c) { return antSel[c]; });
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
    var p = $('val-err');
    $('val-err-msg').textContent = msg;
    p.classList.add('on');
  }

  function hideErr() {
    $('val-err').classList.remove('on');
  }

  function submitForm(e) {
    e.preventDefault();
    hideErr();
    var payload = buildPayload();
    if (!payload.nombre || !payload.dni || !payload.diagnostico_cirugia) {
      showErr('Completá nombre, DNI y diagnóstico de cirugía.');
      return;
    }
    var btn = $('val-submit');
    btn.disabled = true;
    btn.textContent = 'Enviando…';

    fetch(afSupabaseUrl() + '/functions/v1/af-qr-submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: AF_SUPABASE_KEY,
      },
      body: JSON.stringify(payload),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || !res.j.ok) {
          throw new Error((res.j && res.j.error) || 'No se pudo enviar');
        }
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
    $('v-meds').appendChild(medRow(null));
    $('v-med-add').onclick = function () {
      $('v-meds').appendChild(medRow(null));
    };
    $('v-peso').addEventListener('input', calcImc);
    $('v-talla').addEventListener('input', calcImc);
    $('v-urgencia').addEventListener('change', function () {
      $('v-ayuno-card').style.display = this.checked ? 'block' : 'none';
    });
    $('val-form').addEventListener('submit', submitForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
