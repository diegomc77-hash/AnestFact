/**
 * Lookup de foja A4 / SISalud por nombre (espejo de anesfact_instituciones).
 * Select #f-san = nombres con desarrollado=true ∩ sanatorios_permitidos
 * (admin: todos los desarrollado). Allende no está acá.
 */
var AF_FOJA_INST = {
  'Hospital Aeronáutico': {
    id: 'aeronautico',
    destino_final: 'evweb',
    desarrollado: true,
    header: { mode: 'none' }
  },
  'Sanatorio Mayo': {
    id: 'mayo',
    destino_final: 'geclisa',
    desarrollado: true,
    header: { mode: 'none' }
  },
  'Hospital Córdoba': {
    id: 'h_cordoba',
    destino_final: 'sisalud',
    desarrollado: true,
    header: {
      mode: 'compose',
      oficial: false,
      lineas: ['HOSPITAL', 'CÓRDOBA']
    }
  },
  'Hospital Misericordia': {
    id: 'h_misericordia',
    destino_final: 'sisalud',
    desarrollado: true,
    header: {
      mode: 'png',
      asset: 'assets/foja-headers/hospital-misericordia-header.png',
      oficial: true
    }
  },
  'Hospital San Roque': {
    id: 'h_san_roque',
    destino_final: 'sisalud',
    desarrollado: true,
    header: {
      mode: 'compose',
      oficial: false,
      lineas: ['HOSPITAL', 'SAN ROQUE']
    }
  }
};

function afFojaInst(san) {
  san = String(san || '').trim();
  if (AF_FOJA_INST[san]) return AF_FOJA_INST[san];
  return null;
}

function afFojaEsSisalud(san) {
  var inst = afFojaInst(san);
  return !!(inst && inst.destino_final === 'sisalud');
}

function afFojaNombresDesarrollados() {
  return Object.keys(AF_FOJA_INST).filter(function (n) {
    return !!(AF_FOJA_INST[n] && AF_FOJA_INST[n].desarrollado);
  });
}
