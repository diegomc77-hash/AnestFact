const BASE = `Sos asistente médico. Leé la imagen del informe. Respondé SOLO JSON válido sin markdown.
No inventes datos. Si no se lee bien: resultado_general="no_legible".
Para el paciente usá palabras simples en resumen_paciente.`;

const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash-lite',
];

export function promptForTipo(tipo: string): string {
  switch (tipo) {
    case 'laboratorio':
      return `${BASE}
Tipo: laboratorio / análisis de sangre.
JSON:
{"tipo":"laboratorio","resultado_general":"normal|alterado|no_legible","fecha":null,"valores_alterados":[{"nombre":"","valor":"","unidad":"","referencia":"","flag":"alto|bajo"}],"resumen_paciente":"","confianza":"alta|media|baja"}
Si todo está dentro de lo normal: resultado_general="normal", valores_alterados=[], resumen_paciente="Laboratorio normal".
Si hay alteraciones: solo listá en valores_alterados los que estén fuera de rango.`;

    case 'ecg':
      return `${BASE}
Tipo: electrocardiograma (ECG).
JSON:
{"tipo":"ecg","resultado_general":"normal|alterado|no_legible","ritmo":"","hallazgos":[],"resumen_paciente":"","confianza":"alta|media|baja"}
Si es normal: resultado_general="normal", resumen_paciente="Electrocardiograma normal".`;

    case 'ecocardiograma':
      return `${BASE}
Tipo: ecocardiograma (eco del corazón).
JSON:
{"tipo":"ecocardiograma","resultado_general":"normal|alterado|no_legible","fraccion_eyeccion":null,"hallazgos":[],"resumen_paciente":"","confianza":"alta|media|baja"}`;

    case 'espirometria':
      return `${BASE}
Tipo: espirometría (prueba de pulmones).
JSON:
{"tipo":"espirometria","resultado_general":"normal|alterado|no_legible","hallazgos":[],"resumen_paciente":"","confianza":"alta|media|baja"}`;

    default:
      return `${BASE}
Tipo: estudio médico.
JSON:
{"tipo":"otro","resultado_general":"normal|alterado|no_legible","hallazgos":[],"resumen_paciente":"","confianza":"alta|media|baja"}`;
  }
}

function friendlyGeminiError(msg: string, status: number): string {
  const m = (msg || '').toLowerCase();
  if (status === 429 || m.includes('quota') || m.includes('rate limit') || m.includes('resource_exhausted')) {
    return 'Límite de lectura automática alcanzado. Use "cargar a mano" más abajo.';
  }
  if (m.includes('api key') || m.includes('permission')) {
    return 'Lectura automática no disponible. Use carga manual más abajo.';
  }
  return 'No se pudo leer el informe. Use carga manual más abajo.';
}

async function callGemini(
  key: string,
  model: string,
  prompt: string,
  mime: string,
  dataB64: string,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; status: number; msg: string }> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mime || 'image/jpeg', data: dataB64 } },
          ],
        }],
      }),
    },
  );

  const raw = await res.text();
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = JSON.parse(raw).error?.message || msg; } catch { /* ignore */ }
    return { ok: false, status: res.status, msg };
  }

  const api = JSON.parse(raw);
  const txt = api?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!txt) return { ok: false, status: 502, msg: 'Respuesta vacía' };
  const clean = txt.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  return { ok: true, data: JSON.parse(clean) as Record<string, unknown> };
}

export async function extractFromImage(
  tipo: string,
  mime: string,
  dataB64: string,
): Promise<Record<string, unknown>> {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new Error('Lectura automática no configurada. Use carga manual.');

  const prompt = promptForTipo(tipo);
  let lastStatus = 502;
  let lastMsg = 'No se pudo leer';

  for (const model of GEMINI_MODELS) {
    const result = await callGemini(key, model, prompt, mime, dataB64);
    if (result.ok) return result.data;
    lastStatus = result.status;
    lastMsg = result.msg;
    const retryable = result.status === 429 || result.msg.toLowerCase().includes('quota');
    if (!retryable) break;
  }

  throw new Error(friendlyGeminiError(lastMsg, lastStatus));
}
