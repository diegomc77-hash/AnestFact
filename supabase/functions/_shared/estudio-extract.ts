const BASE = `Sos asistente médico. Leé la imagen del informe. Respondé SOLO JSON válido sin markdown.
No inventes datos. Si no se lee bien: resultado_general="no_legible".
Para el paciente usá palabras simples en resumen_paciente.`;

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

export async function extractFromImage(
  tipo: string,
  mime: string,
  dataB64: string,
): Promise<Record<string, unknown>> {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new Error('GEMINI_API_KEY no configurada en Supabase');

  const prompt = promptForTipo(tipo);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`,
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
    let msg = `Gemini HTTP ${res.status}`;
    try { msg = JSON.parse(raw).error?.message || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }

  const api = JSON.parse(raw);
  const txt = api?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!txt) throw new Error('No se pudo leer el estudio');
  const clean = txt.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(clean) as Record<string, unknown>;
}
