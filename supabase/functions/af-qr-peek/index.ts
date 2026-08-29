import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { tokenHash } from '../_shared/crypto.ts';

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
}

/**
 * Público: el paciente ve el lugar del QR sin PII.
 * Nunca completa sanatorio con Mayo — vacío si el token no trae lugar.
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
    .select('expires_at, activo, contexto')
    .eq('token_hash', hash)
    .maybeSingle();

  if (error) return jsonResponse({ error: error.message }, 500);
  if (!qr || !qr.activo) return jsonResponse({ error: 'Enlace inválido o desactivado' }, 403);
  if (new Date(qr.expires_at) < new Date()) return jsonResponse({ error: 'Enlace expirado' }, 403);

  const ctx = (qr.contexto || {}) as Record<string, unknown>;
  const sanatorio = String(ctx.sanatorio || '').trim();
  return jsonResponse({
    ok: true,
    sanatorio,
    expires_at: qr.expires_at,
  });
});
