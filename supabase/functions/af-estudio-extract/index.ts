import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { verifyQrToken } from '../_shared/qr-token.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Método no permitido' }, 405);

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'JSON inválido' }, 400);
  }

  const token = (body.token || '').trim();
  if (token) {
    const valid = await verifyQrToken(token);
    if (!valid.ok) return jsonResponse({ error: valid.error }, 403);
  }

  // Cero llamadas a APIs de IA de pago en este flujo.
  return jsonResponse({
    ok: false,
    error: 'Lectura por IA deshabilitada. Use PDF con parser local en la app o carga manual.',
    code: 'AI_EXTRACT_DISABLED',
  }, 410);
});
