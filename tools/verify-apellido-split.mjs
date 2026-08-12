/**
 * Prueba puntual: split apellido (sin E2E GECLISA).
 * node tools/verify-apellido-split.mjs
 */
import assert from 'assert';

function afSplitPacienteNombre(pac) {
  var raw = String(pac || '').trim();
  if (!raw) return { apellido: '', nombre: '' };
  if (raw.indexOf(',') >= 0) {
    var parts = raw.split(',');
    return {
      apellido: (parts[0] || '').trim().toUpperCase(),
      nombre: parts.slice(1).join(',').replace(/\s+/g, ' ').trim().toUpperCase()
    };
  }
  var words = raw.split(/\s+/).filter(Boolean);
  return {
    apellido: (words[0] || '').toUpperCase(),
    nombre: words.slice(1).join(' ').toUpperCase()
  };
}

assert.deepStrictEqual(afSplitPacienteNombre('BESCOS, DANIEL ALFREDO'), {
  apellido: 'BESCOS',
  nombre: 'DANIEL ALFREDO'
});
assert.deepStrictEqual(afSplitPacienteNombre('BESCOS DANIEL ALFREDO'), {
  apellido: 'BESCOS',
  nombre: 'DANIEL ALFREDO'
});
assert.deepStrictEqual(afSplitPacienteNombre('BESCOS DANIEL'), {
  apellido: 'BESCOS',
  nombre: 'DANIEL'
});
assert.notStrictEqual(afSplitPacienteNombre('BESCOS DANIEL').apellido, 'BESCOS DANIEL');

console.log('OK verify-apellido-split');
