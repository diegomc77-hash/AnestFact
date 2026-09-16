/**
 * Unit test aislado de isFojaQxToken / tokenModo (sin Docker / Supabase).
 * Lógica copiada 1:1 de supabase/functions/_shared/qr-modo.ts
 */
function tokenModo(contexto) {
  if (!contexto || typeof contexto !== 'object') return '';
  return String(contexto.modo || '').trim();
}

function isFojaQxToken(contexto) {
  return tokenModo(contexto) === 'foja_qx';
}

function isValoracionToken(contexto) {
  return !isFojaQxToken(contexto);
}

const cases = [
  ['null', null, false],
  ['undefined', undefined, false],
  ['{} sin modo (legacy)', {}, false],
  ['modo ausente con otros campos', { sanatorio: 'Hospital Córdoba', inter_id: '1' }, false],
  ['modo consultorio', { modo: 'consultorio' }, false],
  ['modo preoperatorio', { modo: 'preoperatorio' }, false],
  ['modo vacío', { modo: '' }, false],
  ['modo solo espacios', { modo: '   ' }, false],
  ['modo Foja_Qx distinto case', { modo: 'Foja_Qx' }, false],
  ['modo foja_qx', { modo: 'foja_qx' }, true],
  ['modo foja_qx con trim', { modo: '  foja_qx  ' }, true],
  ['modo no-string number', { modo: 0 }, false],
];

let failed = 0;
for (const [label, input, expectFoja] of cases) {
  let threw = false;
  let got;
  try {
    got = isFojaQxToken(input);
  } catch (e) {
    threw = true;
    console.error('FAIL throw:', label, e);
    failed++;
    continue;
  }
  const pass = got === expectFoja && isValoracionToken(input) === !expectFoja;
  if (!pass) {
    console.error('FAIL', label, { got, expectFoja });
    failed++;
  } else {
    console.log('OK  ', label, '→ isFojaQx=', got);
  }
  if (threw) failed++;
}

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nAll', cases.length, 'cases OK (no throws)');
