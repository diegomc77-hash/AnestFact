export function normalizeDni(dni: string): string {
  const d = (dni || '').replace(/\D/g, '');
  return d || '';
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function dniHash(dni: string, saltB64: string): Promise<string> {
  const n = normalizeDni(dni);
  if (!n) throw new Error('DNI inválido');
  return sha256Hex(saltB64 + n);
}

export async function tokenHash(token: string): Promise<string> {
  return sha256Hex(token);
}

export async function encryptField(plaintext: string, keyB64: string, version = 1): Promise<string> {
  const keyBytes = b64ToBytes(keyB64);
  if (keyBytes.length !== 32) throw new Error('AF_ENCRYPTION_KEY debe ser 32 bytes en base64');
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return JSON.stringify({
    v: version,
    iv: bytesToB64(iv),
    ct: bytesToB64(new Uint8Array(ct)),
  });
}
