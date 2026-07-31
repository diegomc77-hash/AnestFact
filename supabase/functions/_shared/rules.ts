/** ASA / alertas determinísticas (sin LLM) */
export function evaluarReglas(payload: {
  datos_basicos?: Record<string, unknown>;
  antecedentes?: Record<string, unknown>;
  medicacion?: unknown[];
  extras?: Record<string, unknown>;
}): { asa_sugerido: string; alertas: string[] } {
  const alertas: string[] = [];
  const chips = ((payload.antecedentes as { chips?: string[] })?.chips) || [];
  const edad = Number((payload.datos_basicos as { edad?: number })?.edad || 0);
  const imc = Number((payload.datos_basicos as { imc?: number })?.imc || 0);

  if (chips.includes('IRC')) alertas.push('IRC — revisar fármacos nefrotóxicos y dosis');
  if (chips.includes('IC') || chips.includes('Cardiopatía')) alertas.push('Cardiopatía/IC — precaución hemodinámica');
  const anticoag = (payload.antecedentes as { anticoag?: { farmaco?: string } })?.anticoag;
  if (anticoag?.farmaco) alertas.push('Anticoagulante/antiagregante — plan suspensión/reversión');

  let asa = 'II';
  const severe = ['IRC', 'IC', 'Cardiopatía', 'EPOC', 'SAOS', 'DBT2'];
  let n = 0;
  chips.forEach((c) => { if (severe.indexOf(c) >= 0) n++; });
  if (imc >= 35 || chips.includes('Obesidad')) n++;
  if (edad >= 70) n++;
  if (n >= 2) asa = 'III';
  else if (n === 1) asa = 'II';
  if (chips.includes('IC') && edad >= 70) asa = 'IV';

  return { asa_sugerido: asa, alertas };
}
