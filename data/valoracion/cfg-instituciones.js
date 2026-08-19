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
      historia_clinica: { enabled: true, required: false },
      obra_social: { enabled: true, required: false },
      afiliado: { enabled: true, required: true },
      peso: { enabled: true, required: true },
      talla: { enabled: true, required: true },
      especialidad: { enabled: true, required: true },
      cirujano: { enabled: true, required: true }
    },
    /** Campos filiatorios críticos (HC opcional Mayo) */
    criticos: ['nombre', 'dni', 'afiliado', 'edad', 'peso', 'talla'],
    antecedentesChips: null,
    extras: [],
    diagSinonimos: 'mayo'
  }
};

function afValoracionCfg(san) {
  san = (san || '').trim();
  if (AF_VALORACION_CFG[san]) return AF_VALORACION_CFG[san];
  return AF_VALORACION_CFG['Sanatorio Mayo'];
}
