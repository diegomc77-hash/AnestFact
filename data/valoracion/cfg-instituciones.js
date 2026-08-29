/**
 * Config valoración preanestésica por institución.
 * Desconocido / vacío: NO caer a Mayo (badge y cfg_id del token).
 */
var AF_VALORACION_CAMPOS = {
  edad: { enabled: true, required: true },
  sexo: { enabled: true, required: false },
  historia_clinica: { enabled: true, required: false },
  obra_social: { enabled: true, required: false },
  afiliado: { enabled: true, required: true },
  peso: { enabled: true, required: true },
  talla: { enabled: true, required: true },
  especialidad: { enabled: true, required: true },
  cirujano: { enabled: true, required: true }
};

var AF_VALORACION_CRITICOS = ['nombre', 'dni', 'afiliado', 'edad', 'peso', 'talla'];

/** Misma lista que #f-serv (views/nueva.html). Públicos: sin nómina de cirujanos. */
var AF_VALORACION_ESPECIALIDADES = [
  'Cirugía General', 'Cirugía Laparoscópica',
  'Cirugía Hepática', 'Obesología / Bariátrica',
  'Cirugía de Cabeza y Cuello', 'Cirugía Torácica',
  'Cirugía de Tórax y Cardiovascular',
  'Cirugía Vascular', 'Cirugía Plástica y Reparadora',
  'Ginecología y Obstetricia', 'Traumatología y Ortopedia',
  'Neurocirugía', 'Urología', 'ORL (Otorrinolaringología)',
  'Oftalmología', 'Instituto del Quemado', 'Proctología', 'Mastología',
  'Cirugía Pediátrica', 'Cardiocirugía', 'Cirugía Cardiovascular',
  'Endoscopía Digestiva', 'Gastroenterología', 'Hemodinamia',
  'Radiología Intervencionista', 'Odontología'
];

var AF_VALORACION_CFG_IDS = {
  'Sanatorio Mayo': 'mayo',
  'Hospital Aeronáutico': 'aeronautico',
  'Hospital Córdoba': 'h_cordoba',
  'Hospital Misericordia': 'h_misericordia',
  'Hospital San Roque': 'h_san_roque'
};

var AF_VALORACION_CFG = {
  'Sanatorio Mayo': {
    id: 'mayo',
    label: 'Sanatorio Mayo',
    cirujanosSource: 'Sanatorio Mayo',
    fields: AF_VALORACION_CAMPOS,
    criticos: AF_VALORACION_CRITICOS,
    antecedentesChips: null,
    extras: [],
    diagSinonimos: 'compartido'
  }
};

function afValoracionCfgId(san) {
  san = (san || '').trim();
  if (!san) return '';
  if (AF_VALORACION_CFG_IDS[san]) return AF_VALORACION_CFG_IDS[san];
  if (typeof afFojaInst === 'function') {
    var inst = afFojaInst(san);
    if (inst && inst.id) return String(inst.id);
  }
  return '';
}

function afValoracionCfg(san) {
  san = (san || '').trim();
  if (AF_VALORACION_CFG[san]) return AF_VALORACION_CFG[san];
  return {
    id: afValoracionCfgId(san),
    label: san,
    cirujanosSource: '',
    fields: AF_VALORACION_CAMPOS,
    criticos: AF_VALORACION_CRITICOS,
    antecedentesChips: null,
    extras: [],
    diagSinonimos: 'compartido'
  };
}

/** Vacío si no hay lugar (peek fallido). Nunca "Institución: Sanatorio Mayo" por omisión. */
function afValoracionBadgeTexto(san) {
  san = (san || '').trim();
  if (!san) return '';
  var cfg = afValoracionCfg(san);
  var label = (cfg && cfg.label) ? String(cfg.label).trim() : san;
  if (!label) return '';
  return 'Institución: ' + label;
}

function afValoracionEspecialidadesParaLugar(san) {
  var map = typeof getCirujanosMapForLugar === 'function' ? getCirujanosMapForLugar(san) : {};
  var keys = Object.keys(map || {}).filter(function (k) {
    return (map[k] || []).length > 0;
  }).sort();
  if (keys.length) return keys;
  return AF_VALORACION_ESPECIALIDADES.slice();
}
