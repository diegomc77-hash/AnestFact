/** Modo de canal en anesfact_qr_tokens.contexto.modo */
export function tokenModo(contexto: Record<string, unknown> | null | undefined): string {
  if (!contexto || typeof contexto !== 'object') return '';
  return String(contexto.modo || '').trim();
}

export function isFojaQxToken(contexto: Record<string, unknown> | null | undefined): boolean {
  return tokenModo(contexto) === 'foja_qx';
}

/** Tokens de valoración preanestésica (no foja quirúrgica). */
export function isValoracionToken(contexto: Record<string, unknown> | null | undefined): boolean {
  return !isFojaQxToken(contexto);
}
