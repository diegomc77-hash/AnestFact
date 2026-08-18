/** Medicación habitual — droga + nombres comerciales (formulario QR paciente) */
var MED_HABITUAL = [
  { n: 'Enalapril', comercial: ['Lotrial', 'Enalapren', 'Vaseneval'], cat: 'Presión alta', doses: ['5 mg', '10 mg', '20 mg'], horario: 'Mañana', via: 'VO' },
  { n: 'Losartán', comercial: ['Enertiv', 'Losacor', 'Corodin'], cat: 'Presión alta', doses: ['25 mg', '50 mg', '100 mg'], horario: 'Mañana', via: 'VO' },
  { n: 'Amlodipina', comercial: ['Norvasc', 'Amlovan'], cat: 'Presión alta', doses: ['5 mg', '10 mg'], horario: 'Mañana', via: 'VO' },
  { n: 'Hidroclorotiazida', comercial: ['HCT', 'Microzide'], cat: 'Presión alta', doses: ['12.5 mg', '25 mg'], horario: 'Mañana', via: 'VO' },
  { n: 'Carvedilol', comercial: ['Carvedil', 'Dilatrend'], cat: 'Corazón', doses: ['6.25 mg', '12.5 mg', '25 mg'], horario: '2 veces al día', via: 'VO' },
  { n: 'Metoprolol', comercial: ['Blockium', 'Seloken'], cat: 'Corazón', doses: ['50 mg', '100 mg'], horario: 'Mañana', via: 'VO' },
  { n: 'Atorvastatina', comercial: ['Lipitor', 'Atorval'], cat: 'Colesterol', doses: ['10 mg', '20 mg', '40 mg'], horario: 'Noche', via: 'VO' },
  { n: 'Rosuvastatina', comercial: ['Crestor', 'Rosuvast'], cat: 'Colesterol', doses: ['10 mg', '20 mg'], horario: 'Noche', via: 'VO' },
  { n: 'Metformina', comercial: ['Dabex', 'Glifortex', 'Glafornil'], cat: 'Diabetes', doses: ['500 mg', '850 mg', '1000 mg'], horario: 'Con comidas', via: 'VO' },
  { n: 'Glibenclamida', comercial: ['Daonil', 'Glimet'], cat: 'Diabetes', doses: ['2.5 mg', '5 mg'], horario: 'Antes del desayuno', via: 'VO' },
  { n: 'Sitagliptina', comercial: ['Januvia', 'Sotagliflo'], cat: 'Diabetes', doses: ['50 mg', '100 mg'], horario: 'Mañana', via: 'VO' },
  { n: 'Insulina NPH', comercial: ['Humulin N', 'Novolin N'], cat: 'Diabetes', doses: ['10 UI', '20 UI', '30 UI'], horario: 'Mañana y/o noche', via: 'Inyección' },
  { n: 'Insulina glargina', comercial: ['Lantus', 'Tresiba'], cat: 'Diabetes', doses: ['10 UI', '20 UI', '30 UI'], horario: 'Noche', via: 'Inyección' },
  { n: 'Levotiroxina', comercial: ['Eutirox', 'Levotirox'], cat: 'Tiroides', doses: ['50 mcg', '75 mcg', '100 mcg'], horario: 'En ayunas', via: 'VO' },
  { n: 'Ácido acetilsalicílico', comercial: ['Aspirineta', 'Aspirina', 'Bayaspirina', 'Cafiaspirina', 'AAS', 'Aspirina Prevent'], cat: 'Fluidifica sangre', doses: ['100 mg', '500 mg'], horario: 'Mañana', via: 'VO' },
  { n: 'Clopidogrel', comercial: ['Plavix', 'Clopidogrel'], cat: 'Fluidifica sangre', doses: ['75 mg'], horario: 'Mañana', via: 'VO' },
  { n: 'Rivaroxabán', comercial: ['Xarelto'], cat: 'Fluidifica sangre', doses: ['10 mg', '15 mg', '20 mg'], horario: 'Con comida', via: 'VO' },
  { n: 'Apixabán', comercial: ['Eliquis'], cat: 'Fluidifica sangre', doses: ['2.5 mg', '5 mg'], horario: '2 veces al día', via: 'VO' },
  { n: 'Warfarina', comercial: ['Coumadin'], cat: 'Fluidifica sangre', doses: ['Según INR'], horario: 'Tarde', via: 'VO' },
  { n: 'Acenocumarol', comercial: ['Sintrom'], cat: 'Fluidifica sangre', doses: ['Según INR'], horario: 'Tarde', via: 'VO' },
  { n: 'Dabigatrán', comercial: ['Pradaxa'], cat: 'Fluidifica sangre', doses: ['110 mg', '150 mg'], horario: '2 veces al día', via: 'VO' },
  { n: 'Enoxaparina', comercial: ['Clexane'], cat: 'Fluidifica sangre', doses: ['20 mg', '40 mg', '60 mg', '80 mg'], horario: 'Según indicación', via: 'Inyección' },
  { n: 'Omeprazol', comercial: ['Omepraz', 'Losec'], cat: 'Estómago', doses: ['20 mg', '40 mg'], horario: 'Antes del desayuno', via: 'VO' },
  { n: 'Pantoprazol', comercial: ['Pantus', 'Pantoloc'], cat: 'Estómago', doses: ['20 mg', '40 mg'], horario: 'Mañana', via: 'VO' },
  { n: 'Salbutamol inhalador', comercial: ['Ventolin', 'Salbutral'], cat: 'Asma / pulmones', doses: ['2 puff'], horario: 'Si falta aire', via: 'Inhalador' },
  { n: 'Budesonida inhalador', comercial: ['Neumocort', 'Pulmicort'], cat: 'Asma / pulmones', doses: ['2 puff'], horario: 'Mañana y noche', via: 'Inhalador' },
  { n: 'Tiotropio inhalador', comercial: ['Spiriva'], cat: 'EPOC / pulmones', doses: ['1 puff'], horario: 'Mañana', via: 'Inhalador' },
  { n: 'Prednisona', comercial: ['Prednisona', 'Meticorten'], cat: 'Corticoide', doses: ['5 mg', '10 mg', '20 mg'], horario: 'Mañana', via: 'VO' },
  { n: 'Furosemida', comercial: ['Lasix', 'Furosemida'], cat: 'Diurético', doses: ['20 mg', '40 mg', '80 mg'], horario: 'Mañana', via: 'VO' },
  { n: 'Espironolactona', comercial: ['Aldactone'], cat: 'Diurético', doses: ['25 mg', '50 mg'], horario: 'Mañana', via: 'VO' },
  { n: 'Paracetamol', comercial: ['Tafirol', 'Actron', 'Paracetamol'], cat: 'Dolor', doses: ['500 mg', '1 g'], horario: 'Cada 8 h', via: 'VO' },
  { n: 'Ibuprofeno', comercial: ['Actron', 'Ibupirac', 'Advil'], cat: 'Dolor', doses: ['400 mg', '600 mg'], horario: 'Cada 8 h', via: 'VO' },
  { n: 'Diclofenac', comercial: ['Voltaren', 'Dolpasse'], cat: 'Dolor', doses: ['50 mg', '75 mg'], horario: 'Cada 8 h', via: 'VO' },
  { n: 'Tramadol', comercial: ['Clorixol', 'Gavindo'], cat: 'Dolor fuerte', doses: ['50 mg', '100 mg'], horario: 'Cada 8 h', via: 'VO' },
  { n: 'Gabapentina', comercial: ['Neurontin', 'Gaban'], cat: 'Dolor / nervios', doses: ['300 mg', '600 mg'], horario: '3 veces al día', via: 'VO' },
  { n: 'Sertralina', comercial: ['Zoloft', 'Sertral'], cat: 'Ansiedad', doses: ['50 mg', '100 mg'], horario: 'Mañana', via: 'VO' },
  { n: 'Escitalopram', comercial: ['Lexapro', 'Escitalopram'], cat: 'Ansiedad', doses: ['10 mg', '20 mg'], horario: 'Mañana', via: 'VO' },
  { n: 'Quetiapina', comercial: ['Seroquel'], cat: 'Sueño / psiquiatría', doses: ['25 mg', '50 mg', '100 mg'], horario: 'Noche', via: 'VO' },
  { n: 'Alprazolam', comercial: ['Trankimazin', 'Alplax'], cat: 'Ansiedad', doses: ['0.25 mg', '0.5 mg'], horario: 'Si lo necesita', via: 'VO' },
  { n: 'Levetiracetam', comercial: ['Keppra'], cat: 'Epilepsia', doses: ['500 mg', '1000 mg'], horario: '2 veces al día', via: 'VO' },
  { n: 'Digoxina', comercial: ['Digoxina'], cat: 'Corazón', doses: ['0.25 mg'], horario: 'Mañana', via: 'VO' },
  { n: 'Amiodarona', comercial: ['Atlansil'], cat: 'Ritmo cardíaco', doses: ['200 mg'], horario: 'Mañana', via: 'VO' },
  { n: 'Tamsulosina', comercial: ['Tamsulosina', 'Secotex'], cat: 'Próstata', doses: ['0.4 mg'], horario: 'Noche', via: 'VO' },
  { n: 'Hierro', comercial: ['Ferrum', 'Hierro polimaltosa'], cat: 'Anemia', doses: ['100 mg'], horario: 'Con comida', via: 'VO' },
  { n: 'Enalapril + HCT', comercial: ['Lotrial D'], cat: 'Presión alta', doses: ['10/25 mg'], horario: 'Mañana', via: 'VO' },
  { n: 'Amlodipina + Losartán', comercial: ['Lopresor'], cat: 'Presión alta', doses: ['5/50 mg'], horario: 'Mañana', via: 'VO' },
];

function medHabitualLabel(d) {
  var c = (d.comercial && d.comercial.length) ? d.comercial.slice(0, 3).join(', ') : '';
  if (c) return c + ' → ' + d.n;
  return d.n;
}

function medHabitualMatch(d, q) {
  q = (q || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!q || q.length < 2) return false;
  var n = d.n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (n.indexOf(q) >= 0) return true;
  if (d.cat.toLowerCase().indexOf(q) >= 0) return true;
  if (d.comercial) {
    for (var i = 0; i < d.comercial.length; i++) {
      var c = d.comercial[i].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (c.indexOf(q) >= 0) return true;
    }
  }
  return false;
}

var ANTICOAG_COMUN = [
  'Aspirineta / Aspirina / AAS → Ácido acetilsalicílico',
  'Plavix → Clopidogrel',
  'Sintrom → Acenocumarol',
  'Coumadin → Warfarina',
  'Xarelto → Rivaroxabán',
  'Eliquis → Apixabán',
  'Pradaxa → Dabigatrán',
  'Clexane → Enoxaparina',
  'No tomo ninguno',
];

var ANTICOAG_DOSES = {
  'acido acetilsalicilico': ['100 mg', '500 mg'],
  'aspirineta': ['100 mg', '500 mg'],
  'aspirina': ['100 mg', '500 mg'],
  'aas': ['100 mg', '500 mg'],
  'clopidogrel': ['75 mg'],
  'plavix': ['75 mg'],
  'acenocumarol': ['Según INR'],
  'sintrom': ['Según INR'],
  'warfarina': ['Según INR'],
  'coumadin': ['Según INR'],
  'rivaroxaban': ['10 mg', '15 mg', '20 mg'],
  'xarelto': ['10 mg', '15 mg', '20 mg'],
  'apixaban': ['2.5 mg', '5 mg'],
  'eliquis': ['2.5 mg', '5 mg'],
  'dabigatran': ['110 mg', '150 mg'],
  'pradaxa': ['110 mg', '150 mg'],
  'enoxaparina': ['20 mg', '40 mg', '60 mg', '80 mg'],
  'clexane': ['20 mg', '40 mg', '60 mg', '80 mg']
};

function anticoagDosesFor(text) {
  var q = String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  var keys = Object.keys(ANTICOAG_DOSES);
  for (var i = 0; i < keys.length; i++) {
    if (q.indexOf(keys[i]) >= 0) return ANTICOAG_DOSES[keys[i]].slice();
  }
  return [];
}
