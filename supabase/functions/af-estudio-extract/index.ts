import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { extractFromImage } from '../_shared/estudio-extract.ts';
import { verifyQrToken } from '../_shared/qr-token.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Método no permitido' }, 405);

  let body: { token?: string; tipo?: string; mime?: string; data_b64?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'JSON inválido' }, 400);
  }

  const token = (body.token || '').trim();
  const tipo = (body.tipo || 'otro').trim();
  const dataB64 = (body.data_b64 || '').trim();
  const mime = (body.mime || 'image/jpeg').trim();

  if (!token || !dataB64) return jsonResponse({ error: 'Faltan token o imagen' }, 400);
  if (dataB64.length > 900_000) return jsonResponse({ error: 'Imagen muy grande' }, 400);

  const valid = await verifyQrToken(token);
  if (!valid.ok) return jsonResponse({ error: valid.error }, 403);

  try {
    const extracted = await extractFromImage(tipo, mime, dataB64);
    return jsonResponse({ ok: true, extracted, imagen_guardada: false });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 502);
  }
});
