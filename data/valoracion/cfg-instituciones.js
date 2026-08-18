/**
 * Config valoración preanestésica por institución.
 * Etapa 1: solo Sanatorio Mayo activo. Aero se suma después sin reescribir el form base.
 */
var AF_VALORACION_CFG = {
  'Sanatorio Mayo': {
    id: 'mayo',
    label: 'Sanatorio Mayo',
    cirujanosSource: 'Sanatorio Mayo',
    fields: {
      edad: { enabled: true, required: true },
      sexo: { enabled: true, required: false },
      historia_clinica: { enabled: true, required: true },
      obra_social: { enabled: true, required: false },
      afiliado: { enabled: true, required: true },
      peso: { enabled: true, required: false },
      talla: { enabled: true, required: false },
      especialidad: { enabled: true, required: true },
      cirujano: { enabled: true, required: true }
    },
    /** Campos filiatorios críticos: bloquear envío si vacíos/invalidos + confirmación explícita */
    criticos: ['nombre', 'dni', 'historia_clinica', 'afiliado', 'edad'],
    antecedentesChips: null, // null = usa organos-enfermedades existentes
    extras: [],
    diagSinonimos: 'mayo'
  }
};

function afValoracionCfg(san) {
  san = (san || '').trim();
  if (AF_VALORACION_CFG[san]) return AF_VALORACION_CFG[san];
  return AF_VALORACION_CFG['Sanatorio Mayo'];
}
