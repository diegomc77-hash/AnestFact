/**
 * Lookup de foja A4 / SISalud por nombre (espejo de anesfact_instituciones).
 * No arma el select; lote 2 cablea catálogo ∩ permitidos.
 */
var AF_FOJA_INST = {
  'Hospital Misericordia': {
    id: 'h_misericordia',
    destino_final: 'sisalud',
    header: {
      mode: 'png',
      asset: 'assets/foja-headers/hospital-misericordia-header.png',
      oficial: true
    }
  },
  'Hospital Córdoba': {
    id: 'h_cordoba',
    destino_final: 'sisalud',
    header: {
      mode: 'compose',
      oficial: false,
      lineas: ['HOSPITAL', 'CÓRDOBA']
    }
  },
  'Hospital San Roque': {
    id: 'h_san_roque',
    destino_final: 'sisalud',
    header: {
      mode: 'compose',
      oficial: false,
      lineas: ['HOSPITAL', 'SAN ROQUE']
    }
  },
  'Hospital Aeronáutico': {
    id: 'aeronautico',
    destino_final: 'evweb',
    header: { mode: 'none' }
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
