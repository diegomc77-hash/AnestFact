import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { dniHash, encryptField, normalizeDni, tokenHash } from '../_shared/crypto.ts';
import { evaluarReglas } from '../_shared/rules.ts';

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
}

function requireSecrets() {
  const encKey = Deno.env.get('AF_ENCRYPTION_KEY');
  const salt = Deno.env.get('APP_PII_SALT');
  if (!encKey || !salt) {
    throw new Error('Faltan secrets AF_ENCRYPTION_KEY o APP_PII_SALT en Supabase');
  }
  return { encKey, salt };
}

type SubmitBody = {
  token?: string;
  nombre?: string;
  dni?: string;
  diagnostico_cirugia?: string;
  motivo_valoracion?: string;
  fecha_cirugia_programada?: string | null;
  datos_basicos?: Record<string, unknown>;
  antecedentes?: Record<string, unknown>;
  medicacion?: unknown[];
  antec_anestesicos?: Record<string, unknown>;
  estudios_extraidos?: Record<string, unknown>;
  extras?: Record<string, unknown>;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Método no permitido' }, 405);

  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'JSON inválido' }, 400);
  }

  const token = (body.token || '').trim();
  const nombre = (body.nombre || '').trim();
  const dni = normalizeDni(body.dni || '');
  if (!token || !nombre || !dni) {
    return jsonResponse({ error: 'Completá token, nombre y DNI' }, 400);
  }

  let secrets;
  try {
    secrets = requireSecrets();
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 503);
  }

  const hash = await tokenHash(token);
  const admin = adminClient();

  const { data: qr, error: qrErr } = await admin
    .from('anesfact_qr_tokens')
    .select('id, owner_id, expires_at, max_uses, uses_count, activo, contexto')
    .eq('token_hash', hash)
    .maybeSingle();

  if (qrErr) return jsonResponse({ error: qrErr.message }, 500);
  if (!qr || !qr.activo) return jsonResponse({ error: 'Enlace inválido o desactivado' }, 403);
  if (new Date(qr.expires_at) < new Date()) return jsonResponse({ error: 'Enlace expirado' }, 403);
  if (qr.uses_count >= qr.max_uses) return jsonResponse({ error: 'Enlace agotado (ya fue usado)' }, 403);

  const ownerId = qr.owner_id;
  const dbIn = (body.datos_basicos || {}) as Record<string, unknown>;
  const edad = dbIn.edad;
  const peso = dbIn.peso_kg;
  const talla = dbIn.talla_cm;
  const afil = String(dbIn.afiliado || '').trim();
  if (edad == null || edad === '' || Number(edad) < 0 || Number(edad) > 120) {
    return jsonResponse({ error: 'Edad obligatoria (0–120)' }, 400);
  }
  if (peso == null || peso === '' || Number(peso) <= 0 || Number(peso) > 400) {
    return jsonResponse({ error: 'Peso obligatorio (kg)' }, 400);
  }
  if (talla == null || talla === '' || Number(talla) < 40 || Number(talla) > 250) {
    return jsonResponse({ error: 'Talla obligatoria (cm)' }, 400);
  }
  if (!afil) return jsonResponse({ error: 'N° de afiliado obligatorio' }, 400);
  let dniH: string;
  try {
    dniH = await dniHash(dni, secrets.salt);
  } catch {
    return jsonResponse({ error: 'DNI inválido' }, 400);
  }

  const nombreEnc = await encryptField(nombre, secrets.encKey);
  const dniEnc = await encryptField(dni, secrets.encKey);

  const { data: existing } = await admin
    .from('anesfact_pacientes')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('dni_hash', dniH)
    .maybeSingle();

  let pacienteId: string;
  if (existing?.id) {
    pacienteId = existing.id;
    await admin
      .from('anesfact_pacientes')
      .update({
        nombre_enc: nombreEnc,
        dni_enc: dniEnc,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pacienteId);
  } else {
    const { data: created, error: pErr } = await admin
      .from('anesfact_pacientes')
      .insert({
        owner_id: ownerId,
        dni_hash: dniH,
        nombre_enc: nombreEnc,
        dni_enc: dniEnc,
      })
      .select('id')
      .single();
    if (pErr || !created) return jsonResponse({ error: pErr?.message || 'Error paciente' }, 500);
    pacienteId = created.id;
  }

  const extrasIn = (body.extras || {}) as Record<string, unknown>;
  const ctx = (qr.contexto || {}) as Record<string, unknown>;
  const sanatorio = String(extrasIn.sanatorio || ctx.sanatorio || 'Sanatorio Mayo');
  const dniMasked = dni.length >= 4 ? ('***' + dni.slice(-4)) : '****';
  const etiqueta = String(
    extrasIn.etiqueta_lista ||
      (nombre + ' · DNI ' + dni + ' · ' + ((body.diagnostico_cirugia || '').trim() || 'Sin diagnóstico')),
  );

  const datosBasicos = {
    ...(body.datos_basicos || {}),
    dni: dni,
  };

  const payload = {
    datos_basicos: datosBasicos,
    antecedentes: body.antecedentes || {},
    medicacion: body.medicacion || [],
    antec_anestesicos: body.antec_anestesicos || {},
    extras: {
      ...extrasIn,
      sanatorio,
      etiqueta_lista: etiqueta,
      etiqueta_nombre: nombre,
      dni_enmascarado: dniMasked,
    },
  };
  const reglas = evaluarReglas(payload);

  const motivo = body.motivo_valoracion || 'primera';
  const validMotivos = ['primera', 'reprogramacion', 'no_presentacion', 'nueva_cirugia', 'control', 'correccion_datos'];
  const motivoFinal = validMotivos.includes(motivo) ? motivo : 'primera';

  const urgencia = !!(payload.extras as { es_urgencia?: boolean })?.es_urgencia;
  const ayunoPayload = urgencia
    ? ((payload.extras as { ayuno?: Record<string, unknown> })?.ayuno || {})
    : {};

  const { data: val, error: vErr } = await admin
    .from('anesfact_valoraciones')
    .insert({
      owner_id: ownerId,
      paciente_id: pacienteId,
      qr_token_id: qr.id,
      diagnostico_cirugia: (body.diagnostico_cirugia || '').trim() || '',
      motivo_valoracion: motivoFinal,
      fecha_cirugia_programada: body.fecha_cirugia_programada || null,
      resultado_episodio: 'pendiente',
      datos_basicos: payload.datos_basicos,
      antecedentes: payload.antecedentes,
      medicacion: payload.medicacion,
      antec_anestesicos: payload.antec_anestesicos,
      ayuno: ayunoPayload,
      extras: payload.extras,
      estudios_extraidos: body.estudios_extraidos || {},
      es_urgencia: urgencia,
      asa_sugerido: reglas.asa_sugerido,
      alertas_reglas: reglas.alertas,
      source: 'qr_paciente',
      estado: 'enviada',
    })
    .select('id, submitted_at, asa_sugerido')
    .single();

  if (vErr || !val) return jsonResponse({ error: vErr?.message || 'Error valoración' }, 500);

  const newUses = qr.uses_count + 1;
  const deactivate = newUses >= qr.max_uses;
  await admin
    .from('anesfact_qr_tokens')
    .update({
      uses_count: newUses,
      activo: deactivate ? false : true,
    })
    .eq('id', qr.id);

  return jsonResponse({
    ok: true,
    valoracion_id: val.id,
    paciente_id: pacienteId,
    asa_sugerido: val.asa_sugerido,
    created_at: val.submitted_at,
    sanatorio,
  });
});
