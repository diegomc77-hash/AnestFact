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
 * QR cirujano / fojaQx — canal paralelo a af-qr-create.
 * Un solo uso · 48 h · invalida tokens foja_qx previos del mismo inter_id.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Método no permitido' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonResponse({ error: 'Sin autorización' }, 401);

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return jsonResponse({ error: 'Sesión inválida' }, 401);

  let body: { contexto?: Record<string, unknown> } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const raw = (body.contexto || {}) as Record<string, unknown>;
  const sanatorio = String(raw.sanatorio || '').trim();
  const interId = String(raw.inter_id || '').trim();
  if (!sanatorio) return jsonResponse({ error: 'Falta sanatorio en contexto' }, 400);
  if (!interId) return jsonResponse({ error: 'Falta inter_id en contexto' }, 400);

  const contexto: Record<string, unknown> = {
    ...raw,
    sanatorio,
    inter_id: interId,
    modo: 'foja_qx',
    max_uses: 1,
  };

  const admin = adminClient();

  // Invalidar QR foja_qx previos de esta intervención (un solo uso activo).
  const { error: invErr } = await admin
    .from('anesfact_qr_tokens')
    .update({ activo: false })
    .eq('owner_id', user.id)
    .eq('activo', true)
    .filter('contexto->>modo', 'eq', 'foja_qx')
    .filter('contexto->>inter_id', 'eq', interId);
  if (invErr) return jsonResponse({ error: invErr.message }, 500);

  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const hash = await tokenHash(token);
  const expires = new Date();
  expires.setHours(expires.getHours() + 48);

  const { data, error } = await admin
    .from('anesfact_qr_tokens')
    .insert({
      owner_id: user.id,
      token_hash: hash,
      contexto,
      expires_at: expires.toISOString(),
      max_uses: 1,
      activo: true,
    })
    .select('id, expires_at, max_uses')
    .single();

  if (error) return jsonResponse({ error: error.message }, 500);
  if (!isFojaQxToken(contexto)) {
    return jsonResponse({ error: 'Contexto foja_qx inválido' }, 500);
  }

  return jsonResponse({
    ok: true,
    token,
    token_id: data.id,
    expires_at: data.expires_at,
    max_uses: data.max_uses,
    single_use: true,
  });
});
