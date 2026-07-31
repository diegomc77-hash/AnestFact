import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { tokenHash } from '../_shared/crypto.ts';

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
}

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

  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const hash = await tokenHash(token);
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  const admin = adminClient();
  const { data, error } = await admin
    .from('anesfact_qr_tokens')
    .insert({
      owner_id: user.id,
      token_hash: hash,
      contexto: body.contexto || {},
      expires_at: expires.toISOString(),
      max_uses: 500,
      activo: true,
    })
    .select('id, expires_at')
    .single();

  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse({
    ok: true,
    token,
    token_id: data.id,
    expires_at: data.expires_at,
  });
});
