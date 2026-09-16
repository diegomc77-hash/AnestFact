/**
 * Lookup de foja A4 / SISalud por nombre (espejo de anesfact_instituciones).
 * Select #f-san = nombres con desarrollado=true ∩ sanatorios_permitidos
 * (admin: todos los desarrollado). Allende no está acá.
 *
 * foja_qx: Foja Quirúrgica nativa (suite AnesFact). Flag por institución —
 * no hardcodear por nombre en callers; usar afFojaQxEnabled(san).
 * Más públicos se habilitan de a uno con el mismo flag.
 */
var AF_FOJA_INST = {
  'Hospital Aeronáutico': {
    id: 'aeronautico',
    destino_final: 'evweb',
    desarrollado: true,
    foja_qx: true,
    header: { mode: 'none' }
  },
  'Sanatorio Mayo': {
    id: 'mayo',
    destino_final: 'geclisa',
    desarrollado: true,
    foja_qx: false,
    header: { mode: 'none' }
  },
  'Hospital Córdoba': {
    id: 'h_cordoba',
    destino_final: 'sisalud',
    desarrollado: true,
    foja_qx: true,
    header: {
      mode: 'compose',
      oficial: false,
      lineas: ['HOSPITAL', 'CÓRDOBA']
    },
    quirofanos: [
      'Quirófano 1',
      'Quirófano 2',
      'Quirófano 3',
      'Quirófano 4',
      'Quirófano 5',
      'Quirófano 6',
      'Quirófano Quemados 1',
      'Quirófano Quemados 2',
      'Quirófano Oftalmología'
    ]
  },
  'Hospital Misericordia': {
    id: 'h_misericordia',
    destino_final: 'sisalud',
    desarrollado: true,
    foja_qx: true,
    header: {
      mode: 'png',
      asset: 'assets/foja-headers/hospital-misericordia-header.png',
      oficial: true
    },
    quirofanos: [
      'Quirófano 1',
      'Quirófano 2',
      'Quirófano 3',
      'Quirófano 4'
    ]
  },
  'Hospital San Roque': {
    id: 'h_san_roque',
    destino_final: 'sisalud',
    desarrollado: true,
    foja_qx: true,
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

/** Foja Quirúrgica nativa habilitada para este sanatorio (catálogo). */
function afFojaQxEnabled(san) {
  var inst = afFojaInst(san);
  return !!(inst && inst.foja_qx === true);
}

/** Stub tipado mínimo de S.cur.fojaQx (Paso 1). */
function afFojaQxStub() {
  return { version: 1, slots: {}, texto: '', firmada: false };
}

/**
 * Si la institución tiene foja_qx on y falta el objeto, lo crea.
 * No borra fojaQx si el sanatorio está off (inerte local; sync lo omite).
 */
function afEnsureFojaQx(inter) {
  if (!inter) return null;
  if (!afFojaQxEnabled(inter.san)) return inter.fojaQx || null;
  if (!inter.fojaQx || typeof inter.fojaQx !== 'object') {
    inter.fojaQx = afFojaQxStub();
  }
  return inter.fojaQx;
}

function afFojaQuirofanos(san) {
  var inst = afFojaInst(san);
  if (!inst || !inst.quirofanos || !inst.quirofanos.length) return [];
  return inst.quirofanos.slice();
}

function afFojaNombresDesarrollados() {
  return Object.keys(AF_FOJA_INST).filter(function (n) {
    return !!(AF_FOJA_INST[n] && AF_FOJA_INST[n].desarrollado);
  });
}
