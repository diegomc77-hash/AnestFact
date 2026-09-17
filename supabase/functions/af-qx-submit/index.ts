import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { tokenHash } from '../_shared/crypto.ts';
import { isFojaQxToken } from '../_shared/qr-modo.ts';

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
}

function str(v: unknown, max = 2000): string {
  return String(v == null ? '' : v).trim().slice(0, max);
}

function yn(v: unknown): boolean | null {
  if (v === true || v === 'si' || v === 'sí' || v === 'SI' || v === 'Sí' || v === 'true' || v === 1 || v === '1') {
    return true;
  }
  if (v === false || v === 'no' || v === 'NO' || v === 'No' || v === 'false' || v === 0 || v === '0') {
    return false;
  }
  return null;
}

/** Rechaza string vacío, no-imagen, o PNG/JPEG demasiado chico (canvas en blanco). */
function validarFirmaPng(dataUrl: string): string | null {
  const s = str(dataUrl, 800000);
  if (!s) return 'Firma (trazo) obligatoria';
  const okMime = s.indexOf('data:image/png;base64,') === 0 ||
    s.indexOf('data:image/jpeg;base64,') === 0 ||
    s.indexOf('data:image/jpg;base64,') === 0;
  if (!okMime) return 'Firma (trazo) obligatoria';
  const b64 = s.slice(s.indexOf(',') + 1).replace(/\s/g, '');
  if (!b64 || b64.length < 800) return 'Firma vacía o inválida';
  let raw: Uint8Array;
  try {
    const bin = atob(b64);
    raw = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) raw[i] = bin.charCodeAt(i);
  } catch {
    return 'Firma inválida';
  }
  // Canvas blanco 480×140 suele quedar < ~1.2 KB; un trazo real suele superar eso.
  if (raw.length < 1500) return 'Firma vacía (sin trazo)';
  if (s.indexOf('data:image/png') === 0) {
    if (raw.length < 8 || raw[0] !== 0x89 || raw[1] !== 0x50 || raw[2] !== 0x4e || raw[3] !== 0x47) {
      return 'Firma PNG inválida';
    }
  }
  return null;
}

type SubmitBody = {
  token?: string;
  equipo?: Record<string, unknown>;
  dx?: Record<string, unknown>;
  clinicos?: Record<string, unknown>;
  texto?: string;
  grado_dificultad?: string;
  firma?: Record<string, unknown>;
  proforma_id?: unknown;
  modo_armado?: unknown;
  slots?: Record<string, unknown>;
};

/**
 * Público (token): recibe foja qx firmada del cirujano.
 * inter_id / owner_id salen del token (no del body).
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Método no permitido' }, 405);

  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'JSON inválido' }, 400);
  }

  const token = str(body.token, 200);
  if (!token) return jsonResponse({ error: 'Sin token' }, 400);

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

  const ctx = (qr.contexto || {}) as Record<string, unknown>;
  if (!isFojaQxToken(ctx)) {
    return jsonResponse({ error: 'Este enlace no es de Foja Quirúrgica' }, 403);
  }

  const interId = str(ctx.inter_id, 120);
  if (!interId) return jsonResponse({ error: 'Token sin inter_id' }, 400);

  const equipoIn = (body.equipo || {}) as Record<string, unknown>;
  const dxIn = (body.dx || {}) as Record<string, unknown>;
  const clinIn = (body.clinicos || {}) as Record<string, unknown>;
  const firmaIn = (body.firma || {}) as Record<string, unknown>;

  const equipo = {
    cirujano: str(equipoIn.cirujano || ctx.cirujano, 200),
    ayudante1: str(equipoIn.ayudante1, 200),
    ayudante2: str(equipoIn.ayudante2, 200),
    ayudante3: str(equipoIn.ayudante3, 200),
    instrumentador: str(equipoIn.instrumentador, 200),
  };
  if (!equipo.cirujano) return jsonResponse({ error: 'Cirujano obligatorio' }, 400);

  const dx = {
    preop: str(dxIn.preop || ctx.diag, 2000),
    postop: str(dxIn.postop, 2000),
    op_indicada: str(dxIn.op_indicada, 2000),
    op_practicada: str(dxIn.op_practicada, 2000),
    riesgo: str(dxIn.riesgo, 500),
    cie_pre: str(dxIn.cie_pre, 40),
    cie_post: str(dxIn.cie_post, 40),
    cie_pre_manual: !!dxIn.cie_pre_manual,
    cie_post_manual: !!dxIn.cie_post_manual,
  };
  if (!dx.preop) return jsonResponse({ error: 'Diagnóstico preoperatorio obligatorio' }, 400);
  if (!dx.postop) return jsonResponse({ error: 'Diagnóstico posoperatorio obligatorio' }, 400);
  if (!dx.op_indicada) return jsonResponse({ error: 'Operación indicada obligatoria' }, 400);
  if (!dx.op_practicada) return jsonResponse({ error: 'Operación practicada obligatoria' }, 400);
  if (!dx.riesgo) return jsonResponse({ error: 'Riesgo quirúrgico obligatorio' }, 400);

  const consentimiento = yn(clinIn.consentimiento);
  const atb = yn(clinIn.atb);
  const gasas = str(clinIn.gasas, 500);
  const atbDetalle = str(clinIn.atb_detalle, 500);
  if (consentimiento === null) {
    return jsonResponse({ error: 'Consentimiento informado: Sí o No' }, 400);
  }
  if (!gasas) return jsonResponse({ error: 'Conteo de gasas y compresas obligatorio' }, 400);
  if (atb === null) return jsonResponse({ error: 'Antibiótico-profilaxis: Sí o No' }, 400);

  const texto = str(body.texto, 20000);
  if (!texto) return jsonResponse({ error: 'Descripción del procedimiento obligatoria' }, 400);

  const grado = str(body.grado_dificultad, 200);
  if (!grado) return jsonResponse({ error: 'Grado de dificultad operatoria obligatorio' }, 400);

  const firmaPng = str(firmaIn.png, 800000);
  const firmaNombre = str(firmaIn.nombre, 200);
  const firmaMp = str(firmaIn.mp, 80);
  const firmaEsp = str(firmaIn.especialidad || ctx.especialidad || ctx.serv, 200);
  const firmaErr = validarFirmaPng(firmaPng);
  if (firmaErr) return jsonResponse({ error: firmaErr }, 400);
  if (!firmaNombre) return jsonResponse({ error: 'Nombre del cirujano (firma) obligatorio' }, 400);
  if (!firmaMp) return jsonResponse({ error: 'M.P. obligatorio' }, 400);
  if (!firmaEsp) return jsonResponse({ error: 'Especialidad (firma) obligatoria' }, 400);

  const sanatorio = str(ctx.sanatorio, 200);
  const cabecera = {
    sanatorio,
    especialidad: str(ctx.especialidad || ctx.serv, 200),
    paciente: str(ctx.paciente || ctx.pac, 200),
    dni: str(ctx.dni, 40),
    fecha: str(ctx.fecha, 40),
    hora_ini: str(ctx.hora_ini || ctx.hora, 40),
    hora_fin: str(ctx.hora_fin, 40),
    diag: str(ctx.diag, 2000),
  };

  const slotsIn = (body.slots && typeof body.slots === 'object') ? body.slots : {};
  const payload = {
    version: 2,
    slots: slotsIn,
    texto,
    firmada: true,
    proforma_id: body.proforma_id != null && String(body.proforma_id).trim() !== ''
      ? str(body.proforma_id, 60)
      : null,
    modo_armado: body.modo_armado != null ? str(body.modo_armado, 40) : null,
    equipo,
    dx,
    clinicos: {
      consentimiento,
      gasas,
      atb,
      atb_detalle: atb ? atbDetalle : '',
    },
    grado_dificultad: grado,
    firma: {
      png: firmaPng,
      nombre: firmaNombre,
      mp: firmaMp,
      especialidad: firmaEsp,
    },
    cabecera,
  };

  const nowIso = new Date().toISOString();
  const { data: row, error: upErr } = await admin
    .from('anesfact_foja_qx')
    .upsert(
      {
        owner_id: qr.owner_id,
        qr_token_id: qr.id,
        inter_id: interId,
        sanatorio,
        payload,
        firmada: true,
        firmada_at: nowIso,
        submitted_at: nowIso,
        version: 1,
      },
      { onConflict: 'owner_id,inter_id' },
    )
    .select('id, submitted_at, firmada_at')
    .single();

  if (upErr || !row) {
    return jsonResponse({ error: upErr?.message || 'Error al guardar foja qx' }, 500);
  }

  const newUses = (qr.uses_count || 0) + 1;
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
    foja_qx_id: row.id,
    inter_id: interId,
    firmada: true,
    submitted_at: row.submitted_at,
    firmada_at: row.firmada_at,
  });
});
