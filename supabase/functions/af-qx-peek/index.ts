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

/**
 * Público: cabecera fojaQx para el cirujano (sin formulario aún — stub).
 * Rechaza tokens que no sean modo foja_qx.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Método no permitido' }, 405);

  let body: { token?: string } = {};
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'JSON inválido' }, 400);
  }

  const token = (body.token || '').trim();
  if (!token) return jsonResponse({ error: 'Sin token' }, 400);

  const hash = await tokenHash(token);
  const admin = adminClient();
  const { data: qr, error } = await admin
    .from('anesfact_qr_tokens')
    .select('expires_at, activo, max_uses, uses_count, contexto')
    .eq('token_hash', hash)
    .maybeSingle();

  if (error) return jsonResponse({ error: error.message }, 500);
  if (!qr || !qr.activo) return jsonResponse({ error: 'Enlace inválido o desactivado' }, 403);
  if (new Date(qr.expires_at) < new Date()) return jsonResponse({ error: 'Enlace expirado' }, 403);
  if (qr.uses_count >= qr.max_uses) return jsonResponse({ error: 'Enlace agotado (ya fue usado)' }, 403);

  const ctx = (qr.contexto || {}) as Record<string, unknown>;
  if (!isFojaQxToken(ctx)) {
    return jsonResponse({ error: 'Este enlace no es de Foja Quirúrgica' }, 403);
  }

  return jsonResponse({
    ok: true,
    modo: 'foja_qx',
    sanatorio: String(ctx.sanatorio || '').trim(),
    especialidad: String(ctx.especialidad || ctx.serv || '').trim(),
    cirujano: String(ctx.cirujano || '').trim(),
    paciente: String(ctx.paciente || ctx.pac || '').trim(),
    dni: String(ctx.dni || '').trim(),
    fecha: String(ctx.fecha || '').trim(),
    diag: String(ctx.diag || '').trim(),
    inter_id: String(ctx.inter_id || '').trim(),
    expires_at: qr.expires_at,
    stub: true,
  });
});
