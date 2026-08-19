/**
 * Sincroniza valoraciones QR → intervenciones locales "preoperatorio" (Etapa 1 Mayo).
 */
function afSyncValoracionesPreop() {
  if (typeof AF_AUTH === 'undefined' || !AF_AUTH.isLoggedIn || !AF_AUTH.isLoggedIn()) {
    return Promise.resolve({ ok: false, reason: 'auth' });
  }
  var url = afSupabaseUrl() +
    '/rest/v1/anesfact_valoraciones?select=id,paciente_id,diagnostico_cirugia,datos_basicos,antecedentes,medicacion,antec_anestesicos,extras,submitted_at,estado,resultado_episodio&order=submitted_at.desc&limit=40';
  return fetch(url, { headers: afSupabaseHeaders() })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (rows) {
      if (!Array.isArray(rows)) return { ok: true, added: 0 };
      var added = 0;
      var existing = {};
      (S.intervs || []).forEach(function (i) {
        if (i && i.valoracion_id) existing[String(i.valoracion_id)] = true;
      });
      rows.forEach(function (v) {
        if (!v || !v.id || existing[String(v.id)]) return;
        if (v.resultado_episodio && v.resultado_episodio !== 'pendiente') return;
        var db = v.datos_basicos || {};
        var ex = v.extras || {};
        var ant = v.antecedentes || {};
        var pac = ex.etiqueta_nombre || (ex.etiqueta_lista ? String(ex.etiqueta_lista).split(' · ')[0] : '') || 'Paciente (QR)';
        // Profesional autenticado: DNI completo (datos_basicos). Máscara solo fallback legado.
        var dniFull = String(db.dni || '').replace(/\D/g, '');
        var dniShow = dniFull || String(ex.dni_enmascarado || '');
        var diagPrincipal = v.diagnostico_cirugia || '';
        var chips = Array.isArray(ant.chips) ? ant.chips.slice() : [];
        var interv = {
          id: 'preop_' + v.id,
          estado: 'preoperatorio',
          fecha: (v.submitted_at || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
          hora: '',
          pac: pac,
          edad: db.edad != null ? String(db.edad) : '',
          sexo: db.sexo || '',
          dni: dniShow,
          peso: db.peso_kg != null ? String(db.peso_kg) : '',
          talla: db.talla_cm != null ? String(db.talla_cm) : '',
          ciru: db.cirujano || '',
          serv: db.especialidad || '',
          diag: diagPrincipal,
          san: ex.sanatorio || 'Sanatorio Mayo',
          sala: '',
          cama: '',
          obra: db.obra_social || '',
          afil: db.afiliado || '',
          historia_clinica: db.historia_clinica || '',
          docs: {},
          ob: false,
          env: true,
          pracs: [],
          origen: 'qr_valoracion',
          valoracion_id: v.id,
          paciente_id: v.paciente_id || null,
          diagnostico_paciente: ex.diagnostico_paciente || null,
          diagnostico_sin_confirmar: !!ex.diagnostico_sin_confirmar,
          foja: {
            antecedentes: chips,
            valoracion: {
              datos_basicos: db,
              antecedentes: ant,
              medicacion: v.medicacion || [],
              antec_anestesicos: v.antec_anestesicos || {},
              extras: ex
            }
          }
        };
        S.intervs.push(interv);
        added++;
      });
      if (added) {
        try { saveIntervsToStorage(); } catch (e) {}
        if (typeof syncAutoPushDebounced === 'function') syncAutoPushDebounced();
        if (typeof renderHome === 'function') renderHome();
      }
      return { ok: true, added: added };
    })
    .catch(function (err) {
      try { console.warn('[AFG] sync valoraciones preop', err); } catch (e2) {}
      return { ok: false, error: err && err.message };
    });
}

function afPreopBadgeLabel(estado) {
  if (estado === 'preoperatorio') return 'Preoperatorio pendiente';
  return '';
}
