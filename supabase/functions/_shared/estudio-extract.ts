/**
 * Lectura por IA de pago DESHABILITADA.
 * La valoración usa PDF.js + parsers locales en el cliente
 * (js/estudios/*). Esta función no debe llamar a Gemini/Claude/etc.
 */

export function promptForTipo(_tipo: string): string {
  return '';
}

export async function extractFromImage(
  _tipo: string,
  _mime: string,
  _dataB64: string,
): Promise<Record<string, unknown>> {
  throw new Error(
    'Lectura por IA deshabilitada. Use la app actualizada (PDF.js + parsers locales) o carga manual.',
  );
}
