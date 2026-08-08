(function () {
  var TOKEN = '';
  var organState = {};
  var estudiosExtraidos = {};
  var MAX_ESTUDIOS = 5;

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
      onPick(items[parseInt(t.getAttribute('data-i'), 10)]);
      closeAllAc();
    };
    el.style.display = 'block';
  }

  function initProvincias() {
    var sel = $('v-prov-obra');
    if (!sel || typeof OBRAS_PROVINCIAS === 'undefined') return;
    sel.innerHTML = OBRAS_PROVINCIAS.map(function (p) {
      return '<option value="' + p.id + '">' + esc(p.label) + '</option>';
    }).join('');
    sel.value = 'nacional';
  }

  function wireObraAc() {
    var inp = $('v-obra');
    var prov = $('v-prov-obra');
    if (!inp || typeof obrasListaProvincia !== 'function') return;
    function buscar() {
      var q = inp.value.toLowerCase();
      if (q.length < 1) { closeAllAc(); return; }
      var lista = obrasListaProvincia(prov ? prov.value : 'nacional');
      var hits = lista.filter(function (x) { return x.toLowerCase().indexOf(q) >= 0; }).slice(0, 12);
      renderAc('ac-v-obra', hits, function (x) { return x; }, null, function (x) { inp.value = x; });
    }
    inp.addEventListener('input', buscar);
    if (prov) prov.addEventListener('change', function () { inp.value = ''; closeAllAc(); });
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

  function renderOrganos() {
    var box = $('v-organos');
    if (!box || typeof ORGANOS_ENF === 'undefined') return;
    box.innerHTML = '';
    ORGANOS_ENF.forEach(function (org) {
      organState[org.id] = { answer: null, selected: {} };
      var opts = org.items.map(function (it, idx) {
        return '<option value="' + idx + '">' + esc(it.label) + '</option>';
      }).join('');
      var block = document.createElement('div');
      block.className = 'org-block';
      block.innerHTML =
        '<div class="org-q">' + esc(org.pregunta) + '</div>' +
        '<div class="org-yesno">' +
        '<button type="button" class="chip" data-org="' + org.id + '" data-ans="no">No</button>' +
        '<button type="button" class="chip" data-org="' + org.id + '" data-ans="si">Sí</button>' +
        '</div>' +
        '<div class="org-items" id="org-items-' + org.id + '">' +
        '<p class="val-hint">Elija del desplegable y tocá Agregar (puede agregar varias).</p>' +
        '<div class="org-pick">' +
        '<select class="fi org-sel" id="org-sel-' + org.id + '"><option value="">— Elija enfermedad —</option>' + opts + '</select>' +
        '<button type="button" class="btn btn-s btn-add">+ Agregar</button></div>' +
        '<div class="org-sel-list" id="org-list-' + org.id + '"></div></div>';

      function renderOrgList() {
        var list = $('org-list-' + org.id);
        if (!list) return;
        var st = organState[org.id];
        var keys = Object.keys(st.selected);
        if (!keys.length) { list.innerHTML = ''; return; }
        list.innerHTML = keys.map(function (k) {
          return '<div class="org-sel-item"><span>' + esc(st.selected[k].label) + '</span>' +
            '<button type="button" class="btn btn-s" style="width:auto;padding:3px 8px;font-size:11px" data-k="' + esc(k) + '">Quitar</button></div>';
        }).join('');
        list.querySelectorAll('button[data-k]').forEach(function (btn) {
          btn.onclick = function () {
            delete organState[org.id].selected[btn.getAttribute('data-k')];
            renderOrgList();
          };
        });
      }

      block.querySelector('.btn-add').onclick = function () {
        var sel = $('org-sel-' + org.id);
        var idx = sel ? parseInt(sel.value, 10) : NaN;
        if (isNaN(idx) || !org.items[idx]) return;
        var it = org.items[idx];
        var key = org.id + '-' + idx;
        organState[org.id].selected[key] = it;
        renderOrgList();
      };

      block.querySelectorAll('.org-yesno .chip').forEach(function (btn) {
        btn.onclick = function () {
          var oid = btn.getAttribute('data-org');
          var ans = btn.getAttribute('data-ans');
          organState[oid].answer = ans;
          block.querySelectorAll('.org-yesno .chip').forEach(function (b) {
            b.classList.remove('sel-no', 'sel-yes');
          });
          btn.classList.add(ans === 'si' ? 'sel-yes' : 'sel-no');
          var itemsEl = $('org-items-' + oid);
          if (itemsEl) {
            if (ans === 'si') itemsEl.classList.add('open');
            else {
              itemsEl.classList.remove('open');
              organState[oid].selected = {};
              renderOrgList();
            }
          }
        };
      });
      box.appendChild(block);
    });
  }

  function collectOrganos() {
    var organos = {};
    var chips = [];
    var detalle = [];
    ORGANOS_ENF.forEach(function (org) {
      var st = organState[org.id] || { answer: null, selected: {} };
      var itemsP = [];
      var itemsM = [];
      Object.keys(st.selected).forEach(function (k) {
        var it = st.selected[k];
        itemsP.push(it.label);
        if (it.chip && chips.indexOf(it.chip) < 0) chips.push(it.chip);
        itemsM.push(it.chip);
        detalle.push({ organo: org.id, organo_label: org.label, paciente: it.label, medico: it.chip });
      });
      organos[org.id] = {
        pregunta: org.pregunta,
        tiene_problema: st.answer === 'si',
        respondio: st.answer === 'si' || st.answer === 'no',
        items_paciente: itemsP,
        items_medico: itemsM,
      };
    });
    var otra = ($('v-enf-otra') && $('v-enf-otra').value.trim()) || '';
    if (otra) {
      detalle.push({ organo: 'otra', paciente: otra, medico: 'Otra' });
    }
    return { organos: organos, chips: chips, chips_detalle: detalle, otra_texto: otra || null };
  }

  function calcImc() {
    var p = parseFloat($('v-peso').value);
    var t = parseFloat($('v-talla').value);
    var out = $('v-imc');
    if (!out) return;
    if (p > 0 && t > 0) out.value = (p / Math.pow(t / 100, 2)).toFixed(1);
    else out.value = '';
  }

  function medRow(data) {
    var wrap = document.createElement('div');
    wrap.className = 'med-row';
    var uid = 'med-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    wrap.innerHTML =
      '<div class="ac-wrap" style="grid-column:1/-1"><input class="fi med-n" placeholder="Nombre comercial o droga" value="' + esc(data && data.nombre) + '" autocomplete="off">' +
      '<div class="ac-list" id="ac-' + uid + '"></div></div>' +
      '<input class="fi med-d" placeholder="Dosis (ej. 10 mg)" value="' + esc(data && data.dosis) + '">' +
      '<input class="fi med-h" placeholder="Horario" value="' + esc(data && data.horario) + '">' +
      '<input class="fi med-v" placeholder="Pastilla / inyección" value="' + esc(data && data.via) + '" style="grid-column:1/-1">';
    if (data && data.nombre_comercial) {
      wrap.dataset.comercial = data.nombre_comercial;
    }
    var nInp = wrap.querySelector('.med-n');
    var acId = 'ac-' + uid;
    nInp.addEventListener('input', function () {
      if (typeof medHabitualMatch !== 'function') return;
      var q = nInp.value;
      if (q.length < 2) { var el = $(acId); if (el) el.style.display = 'none'; return; }
      var hits = MED_HABITUAL.filter(function (d) { return medHabitualMatch(d, q); }).slice(0, 10);
      renderAc(acId, hits, function (d) { return medHabitualLabel(d); }, function (d) { return d.cat; }, function (d) {
        nInp.value = d.n;
        wrap.dataset.comercial = (d.comercial && d.comercial[0]) || '';
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
        nombre_comercial: r.dataset.comercial || null,
        dosis: r.querySelector('.med-d').value.trim(),
        horario: r.querySelector('.med-h').value.trim(),
        via: r.querySelector('.med-v').value.trim(),
      });
    });
    return out;
  }

  function prepareFileForExtract(file) {
    return new Promise(function (resolve, reject) {
      // Lectura automática: solo PDF de texto (PDF.js + parsers locales). Sin IA de pago.
      if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
        if (file.size > 8 * 1024 * 1024) {
          reject(new Error('PDF muy grande. Use carga manual abajo.'));
          return;
        }
        resolve({ mime: 'application/pdf', file: file, name: file.name });
        return;
      }
      if (file.type.startsWith('image/')) {
        reject(new Error('La foto no se lee sola (sin IA). Escriba el resultado a mano o suba el PDF de texto.'));
        return;
      }
      reject(new Error('Use un PDF de texto del informe, o cargue a mano.'));
    });
  }

  function saveManualEstudio() {
    var tipo = ($('est-man-tipo') && $('est-man-tipo').value) || 'otro';
    var res = ($('est-man-res') && $('est-man-res').value) || 'desconocido';
    var txt = ($('est-man-txt') && $('est-man-txt').value.trim()) || '';
    var labels = { laboratorio: 'Laboratorio', ecg: 'Electrocardiograma', ecocardiograma: 'Ecocardiograma', espirometria: 'Espirometría', otro: 'Otro estudio' };
    var general = res === 'normal' ? 'normal' : (res === 'alterado' ? 'alterado' : 'no_legible');
    var resumen = res === 'normal'
      ? (labels[tipo] || tipo) + ': informado como normal por el paciente'
      : (txt || (labels[tipo] || tipo) + ': sin detalle — revisar en consulta');
    var extracted = {
      tipo: tipo,
      resultado_general: general,
      resumen_paciente: resumen,
      fuente: 'manual_paciente',
      confianza: 'baja',
      valoracion_cardiovascular: '',
      etiquetas: { valoracion_cardiovascular: 'completar manualmente' },
      campos_pendientes: [
        { campo: 'valoracion_cardiovascular', nombre: 'Valoración cardiovascular', etiqueta: 'completar manualmente' }
      ]
    };
    if (res === 'alterado' && txt) {
      extracted.valores_alterados = [{ nombre: 'Detalle paciente', valor: txt, unidad: '', referencia: '', flag: 'alterado' }];
      extracted.hallazgos = [txt];
    }
    estudiosExtraidos[tipo] = { extracted: extracted, leido_at: new Date().toISOString(), fuente: 'manual' };
    renderEstList();
    showEstSaved(tipo, 'escrito por usted');
    if ($('est-man-txt')) $('est-man-txt').value = '';
  }

  function wireManualEstudios() {
    var btn = $('est-man-save');
    if (btn) btn.onclick = saveManualEstudio;
  }

  function estResClass(ex) {
    var g = ex && ex.resultado_general;
    if (g === 'normal') return 'ok';
    if (g === 'no_legible') return 'err';
    return 'warn';
  }

  function estResText(ex) {
    if (!ex) return 'No se pudo leer';
    if (ex.resumen_paciente) return ex.resumen_paciente;
    if (ex.resultado_general === 'normal') return 'Resultado normal';
    if (ex.valores_alterados && ex.valores_alterados.length) {
      return ex.valores_alterados.map(function (v) {
        return v.nombre + ': ' + v.valor + (v.unidad ? ' ' + v.unidad : '');
      }).join(' · ');
    }
    if (ex.hallazgos && ex.hallazgos.length) return ex.hallazgos.join(' · ');
    return 'Ver detalle con el médico';
  }

  function estPendientesHtml(ex) {
    var pend = (ex && ex.campos_pendientes) || [];
    if (!pend.length && !(ex && ex.etiquetas && ex.etiquetas.valoracion_cardiovascular)) return '';
    var bits = [];
    // Siempre mostrar valoración CV como manual
    bits.push('<span class="est-manual-tag">Valoración cardiovascular: completar manualmente</span>');
    var otros = pend.filter(function (p) {
      return p.campo !== 'valoracion_cardiovascular';
    }).slice(0, 6);
    if (otros.length) {
      bits.push('<span style="font-size:11px;color:var(--text3);display:block;margin-top:4px">Sin leer del PDF: '
        + esc(otros.map(function (p) { return p.nombre; }).join(', '))
        + ' — <em>completar manualmente</em></span>');
    }
    return '<div style="margin-top:6px">' + bits.join('') + '</div>';
  }

  function renderEstList() {
    var box = $('v-est-list');
    if (!box) return;
    var keys = Object.keys(estudiosExtraidos);
    if (!keys.length) { box.innerHTML = ''; return; }
    var labels = EST_LABELS;
    box.innerHTML = keys.map(function (tipo) {
      var item = estudiosExtraidos[tipo];
      var ex = item.extracted || {};
      var via = item.fuente === 'manual' ? ' · usted escribió'
        : (item.fuente === 'pdf_parser' ? ' · PDF (parser local)'
          : (item.fuente === 'manual_requerido' ? ' · requiere carga manual' : ''));
      return '<div class="est-res ' + estResClass(ex) + '"><strong>✓ ' + esc(labels[tipo] || tipo) + ' guardado</strong>' +
        '<span style="font-size:11px;color:var(--text3)">' + esc(via) + '</span><br>' +
        esc(estResText(ex)) +
        estPendientesHtml(ex) +
        ' <button type="button" class="btn btn-s" style="width:auto;padding:3px 8px;font-size:11px;margin-top:6px" data-t="' + tipo + '">Quitar</button></div>';
    }).join('');
    box.querySelectorAll('button[data-t]').forEach(function (btn) {
      btn.onclick = function () {
        delete estudiosExtraidos[btn.getAttribute('data-t')];
        document.querySelectorAll('.est-btn').forEach(function (b) { b.classList.remove('has-file'); });
        renderEstList();
        updateEstCount();
      };
    });
    updateEstCount();
  }

  function extractEstudio(tipo, prep, btnEl) {
    var slot = $('est-slot-' + tipo);
    if (slot) slot.innerHTML = '<div class="est-spin">Leyendo PDF (sin IA)…</div>';
    if (typeof AfEstudioExtractLocal === 'undefined' || !AfEstudioExtractLocal.extract) {
      return Promise.reject(new Error('Parsers locales no cargados. Recargue la página.'));
    }
    return AfEstudioExtractLocal.extract({
      tipo: tipo,
      file: prep.file,
      mime: prep.mime,
      name: prep.name,
      b64: prep.b64
    }).then(function (extracted) {
      var fuente = (extracted && extracted.fuente) || 'pdf_parser';
      estudiosExtraidos[tipo] = {
        extracted: extracted,
        leido_at: new Date().toISOString(),
        fuente: fuente
      };
      if (btnEl) btnEl.classList.add('has-file');
      if (slot) slot.innerHTML = '';
      renderEstList();
      var via = fuente === 'pdf_parser' ? 'leído del PDF' : 'pendiente manual';
      showEstSaved(tipo, via);
      if (fuente === 'manual_requerido' || (extracted && extracted.resultado_general === 'no_legible' && !(extracted.valores && extracted.valores.length))) {
        openManualEstudios(tipo);
      }
    }).catch(function (err) {
      if (slot) slot.innerHTML = '';
      openManualEstudios(tipo);
      showErr(friendlyEstudioErr(err.message));
    });
  }

  function wireEstudios() {
    document.querySelectorAll('.est-btn').forEach(function (lbl) {
      var inp = lbl.querySelector('input[type=file]');
      if (!inp) return;
      var tipo = inp.getAttribute('data-tipo') || 'otro';
      var slot = document.createElement('div');
      slot.id = 'est-slot-' + tipo;
      lbl.parentNode.insertBefore(slot, lbl.nextSibling);
      inp.addEventListener('change', function () {
        var file = inp.files && inp.files[0];
        inp.value = '';
        if (!file) return;
        if (Object.keys(estudiosExtraidos).length >= MAX_ESTUDIOS) {
          showErr('Máximo ' + MAX_ESTUDIOS + ' estudios.');
          return;
        }
        // Eco / otro: directo a manual (sin IA)
        if (tipo === 'ecocardiograma' || tipo === 'otro') {
          openManualEstudios(tipo);
          showErr(tipo === 'ecocardiograma'
            ? 'Ecocardiograma: complete a mano (sin lectura por IA). Valoración cardiovascular: completar manualmente.'
            : 'Este estudio se carga a mano.');
          return;
        }
        if (slot) slot.innerHTML = '<div class="est-spin">Preparando PDF…</div>';
        prepareFileForExtract(file)
          .then(function (prep) {
            return extractEstudio(tipo, prep, lbl);
          })
          .catch(function (err) {
            if (slot) slot.innerHTML = '';
            openManualEstudios(tipo);
            showErr(friendlyEstudioErr(err.message));
          });
      });
    });
  }

  function buildPayload() {
    var urg = $('v-urgencia').checked;
    var org = collectOrganos();
    var provEl = $('v-prov-obra');
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
        obra_social_provincia: provEl ? provEl.value : null,
        afiliado: $('v-afil').value.trim() || null,
      },
      antecedentes: {
        organos: org.organos,
        chips: org.chips,
        chips_detalle: org.chips_detalle,
        otra_enfermedad: org.otra_texto,
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
      estudios_extraidos: {
        estudios: estudiosExtraidos,
        cantidad: Object.keys(estudiosExtraidos).length,
        imagen_guardada: false,
      },
      extras: {
        es_urgencia: urg,
        ayuno: urg ? { solido: $('v-ayuno-solido').value || null, liquido_claro: $('v-ayuno-liq').value || null } : null,
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

  var EST_LABELS = { laboratorio: 'Laboratorio', ecg: 'Electrocardiograma', ecocardiograma: 'Ecocardiograma', espirometria: 'Espirometría', otro: 'Otro estudio' };

  function updateEstCount() {
    var n = Object.keys(estudiosExtraidos).length;
    var el = $('est-resumen-count');
    if (!el) return;
    if (n > 0) {
      el.style.display = 'block';
      el.textContent = '✓ ' + n + ' estudio(s) guardado(s) — puede enviar el formulario.';
    } else {
      el.style.display = 'none';
    }
  }

  function showEstSaved(tipo, via) {
    var labels = EST_LABELS;
    var hint = $('est-man-hint');
    if (hint) {
      hint.style.display = 'block';
      hint.textContent = '✓ ' + (labels[tipo] || tipo) + ' guardado (' + via + ').';
    }
    updateEstCount();
    hideErr();
    var list = $('v-est-list');
    if (list) list.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function openManualEstudios(tipo) {
    var details = document.querySelector('#val-form details');
    if (details) details.open = true;
    if (tipo && $('est-man-tipo')) $('est-man-tipo').value = tipo;
    if (details) details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function friendlyEstudioErr(msg) {
    var m = (msg || '').toLowerCase();
    if (m.indexOf('foto') >= 0 || m.indexOf('imagen') >= 0 || m.indexOf('pdf') >= 0) return msg;
    if (m.indexOf('ia') >= 0 || m.indexOf('gemini') >= 0 || m.indexOf('claude') >= 0) {
      return 'Lectura por IA deshabilitada. Use PDF de texto o el paso 1 (escribir resultado).';
    }
    if (m.indexOf('parser') >= 0 || m.indexOf('pdf.js') >= 0) return msg;
    return msg || 'No se pudo leer el PDF. Use el paso 1 de arriba (escribir resultado).';
  }

  function showErr(msg) { $('val-err-msg').textContent = msg; $('val-err').classList.add('on'); }
  function hideErr() { $('val-err').classList.remove('on'); }

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
        if (res.j.asa_sugerido) $('val-asa').textContent = 'Clasificación sugerida (orientativa): ASA ' + res.j.asa_sugerido;
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
    initProvincias();
    renderOrganos();
    wireObraAc();
    wireAnticoagAc();
    wireEstudios();
    wireManualEstudios();
    $('v-meds').appendChild(medRow(null));
    $('v-med-add').onclick = function () { $('v-meds').appendChild(medRow(null)); };
    $('v-peso').addEventListener('input', calcImc);
    $('v-talla').addEventListener('input', calcImc);
    $('v-urgencia').addEventListener('change', function () { $('v-ayuno-card').style.display = this.checked ? 'block' : 'none'; });
    $('val-form').addEventListener('submit', submitForm);
    document.addEventListener('click', function (e) { if (!e.target.closest('.ac-wrap')) closeAllAc(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
