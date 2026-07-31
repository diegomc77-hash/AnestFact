import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { tokenHash } from './crypto.ts';

export async function verifyQrToken(token: string) {
  const hash = await tokenHash(token);
  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  const { data: qr, error } = await admin
    .from('anesfact_qr_tokens')
    .select('id, owner_id, expires_at, max_uses, uses_count, activo')
    .eq('token_hash', hash)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!qr || !qr.activo) return { ok: false as const, error: 'Enlace inválido' };
  if (new Date(qr.expires_at) < new Date()) return { ok: false as const, error: 'Enlace expirado' };
  if (qr.uses_count >= qr.max_uses) return { ok: false as const, error: 'Enlace agotado' };
  return { ok: true as const, qr };
}
