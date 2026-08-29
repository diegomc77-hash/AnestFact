/**
 * Catálogo Hospital Córdoba: cirujanos + quirófanos.
 * Mayo/Aero intactos; Misericordia y San Roque sin catálogo.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  process.stderr.write('FAIL  ' + msg + '\n');
  process.exit(1);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const context = { console, String, Array, Object, Number, Error };
vm.createContext(context);
vm.runInContext(read('data/cirujanos-esp.js'), context);
vm.runInContext(read('data/instituciones-foja.js'), context);
vm.runInContext(read('data/valoracion/cfg-instituciones.js'), context);

const cba = context.getCirujanosMapForLugar('Hospital Córdoba');
const gen = cba['Cirugía General'] || [];
if (gen.indexOf('Prof. Dr. José A. Cooke') < 0) fail('falta Cooke Córdoba');
if (gen.join(' ').indexOf('Jefe') >= 0) fail('no debe decir Jefe');
if ((cba['Cirugía Vascular'] || []).indexOf('Dr. Pablo Monayar') < 0) fail('Vascular Periférica → Cirugía Vascular');
const torax = 'Dra. Clara Huerta (Trasplante Cardíaco)';
['Cirugía de Tórax y Cardiovascular', 'Cirugía Torácica', 'Cirugía Cardiovascular', 'Cardiocirugía'].forEach(function (k) {
  if ((cba[k] || []).indexOf(torax) < 0) fail('Tórax no copiado a ' + k);
});
if ((cba['Instituto del Quemado'] || []).indexOf('Dr. Damián Andrade') < 0) fail('Quemado');
if ((cba['Oftalmología'] || []).indexOf('Dr. Marcos Iribarren') < 0) fail('Oftalmología');

const mayo = context.getCirujanosMapForLugar('Sanatorio Mayo');
if ((mayo['Cirugía General'] || []).indexOf('COOKE JOSE ALBERTO') < 0) fail('Mayo Cooke intacto');
if (mayo['Instituto del Quemado']) fail('Mayo no debe tener Instituto del Quemado');

if (Object.keys(context.getCirujanosMapForLugar('Hospital Misericordia') || {}).length) {
  fail('Misericordia debe seguir sin catálogo');
}
if (Object.keys(context.getCirujanosMapForLugar('Hospital San Roque') || {}).length) {
  fail('San Roque debe seguir sin catálogo');
}

const specCba = context.afValoracionEspecialidadesParaLugar('Hospital Córdoba');
if (specCba.indexOf('Cirugía General') < 0) fail('QR Córdoba debe listar Cirugía General del catálogo');
if (specCba.indexOf('Instituto del Quemado') < 0) fail('QR Córdoba debe listar Instituto del Quemado');
if (specCba.indexOf('Proctología') >= 0) fail('QR Córdoba no debe usar lista genérica (Proctología)');

const specMis = context.afValoracionEspecialidadesParaLugar('Hospital Misericordia');
if (specMis.indexOf('Proctología') < 0) fail('Misericordia QR sigue genérica');
if ((context.getCirujanosMapForLugar('Hospital Misericordia')['Cirugía General'] || []).length) {
  fail('Misericordia no debe autocompletar cirujanos');
}

const q = context.afFojaQuirofanos('Hospital Córdoba');
if (q.length !== 9) fail('Córdoba debe tener 9 quirófanos, tiene ' + q.length);
if (q.indexOf('Quirófano 6') < 0 || q.indexOf('Quirófano Quemados 2') < 0 || q.indexOf('Quirófano Oftalmología') < 0) {
  fail('etiquetas de quirófano: ' + q.join(', '));
}
if (context.afFojaQuirofanos('Hospital Misericordia').length) fail('Misericordia sin select de quirófano');
if (context.afFojaQuirofanos('Hospital San Roque').length) fail('San Roque sin select de quirófano');

const nueva = read('views/nueva.html');
if (nueva.indexOf('Instituto del Quemado') < 0) fail('#f-serv sin Instituto del Quemado');
if (nueva.indexOf('Cirugía de Tórax y Cardiovascular') < 0) fail('#f-serv sin Tórax y Cardiovascular');
if (nueva.indexOf('id="f-sala-inst"') < 0) fail('falta select f-sala-inst');

process.stdout.write('OK    Córdoba catálogo + 9 quirófanos; Mayo intacto; Misericordia/Roque sin nómina\n');
