// Cirujanos por lugar + especialidad (predictivo en Datos de la intervención).
// Hospital Aeronáutico: pendiente de cargar (lo aporta el usuario).
// Otras clínicas: sin catálogo fijo → solo aprendidos de intervenciones previas del mismo lugar.

var CIRUJANOS_POR_LUGAR = {
  'Sanatorio Mayo': {
    'Cirugía Cardiovascular': ['BOCHINFUSO MATIAS', 'GUEVARA JORGE ALEJANDRO'],
    'Cardiocirugía': ['BOCHINFUSO MATIAS', 'GUEVARA JORGE ALEJANDRO'],
    'Cirugía de Cabeza y Cuello': ['CORBALL ALBERTO GUSTAVO', 'FLORES GABRIEL ALEJANDRO', 'MENSO NICOLAS'],
    'Cirugía Torácica': ['REPETTI JOSE LUIS'],
    'Cirugía General': ['COOKE JOSE ALBERTO', 'COPPARI BRIAN', 'MATUS GUSTAVO NICOLAS', 'ZURITA GONZALO'],
    'Cirugía Laparoscópica': ['COOKE JOSE ALBERTO', 'COPPARI BRIAN', 'MATUS GUSTAVO NICOLAS', 'ZURITA GONZALO'],
    'Cirugía Hepática': ['ALVAREZ FERNANDO ANDRES'],
    'Cirugía Plástica y Reparadora': ['PAOLETTI JAVIER ALBERTO', 'ROMERO ARENA FEDERICO'],
    'Cirugía Vascular': ['FONTAINE CRISTIAN', 'PELAEZ RODRIGO'],
    'Endoscopía Digestiva': ['BONAPARTE FERNANDO AGUSTIN', 'IRIARTE HORACIO FERNANDO', 'STRUMIA SILVINA DEL VALLE'],
    'Gastroenterología': ['BONAPARTE FERNANDO AGUSTIN', 'IRIARTE HORACIO FERNANDO', 'STRUMIA SILVINA DEL VALLE'],
    'Ginecología y Obstetricia': ['GIL ANA MARIA IRENE', 'ARRECHEA MARIANA', 'CANAVESIO CAROLA ALEJANDRA', 'CAPOVILLA CLAUDIA PATRICIA', 'PIOVANO MARIA PATRICIA'],
    'Hemodinamia': ['LEONARDI CARLOS RAUL', 'CHIARINI FERNANDO', 'FONTAINE CRISTIAN', 'MIARA JONATHAN', 'PESSAH GUSTAVO'],
    'Neurocirugía': ['BERRA MATIAS SEBASTIAN', 'SANCHEZ JAVIER ANTONIO'],
    'Oftalmología': ['GONZALEZ CASTELLANOS JERONIMO', 'ALVAREZ MARIA ALEJANDRA', 'GONZALEZ CASTELLANOS MARIA S', 'LAURIA LUIS FRANCISCO'],
    'ORL (Otorrinolaringología)': ['FREIRE BUTELER IGNACIO'],
    'Traumatología y Ortopedia': ['BENINGAZZA GABRIEL', 'AROCENA MARIANO', 'CEREZO RIZZI EMANUEL', 'FERREYRA PABLO', 'GORGAS ALBERTO', 'GUZMAN NICOLAS', 'JAIS JAIS JOSE FARID', 'VILLAFAÑE GONZALO DARIO'],
    'Obesología / Bariátrica': ['CLARIA JORGE', 'PIVA EUGENIO', 'ZURITA GONZALO'],
    'Urología': ['PINTO GABRIEL FERNANDO', 'SONZINI CRISTIAN', 'MEINCKE SOFIA MARIA', 'PASTRANA RODRIGO EMANUEL'],
    // Especialidades del select aún sin nómina completa en Mayo:
    'Proctología': [],
    'Mastología': [],
    'Cirugía Pediátrica': [],
    'Radiología Intervencionista': [],
    'Odontología': []
  },
  'Hospital Aeronáutico': {
    // Pendiente: cargar especialistas del Aeronáutico
  }
};

// Compat: mapa Mayo (scripts viejos que lean CIRUJANOS_ESP)
var CIRUJANOS_ESP = CIRUJANOS_POR_LUGAR['Sanatorio Mayo'];

function getCirujanosMapForLugar(san) {
  san = (san || '').trim();
  if (typeof CIRUJANOS_POR_LUGAR !== 'undefined' && CIRUJANOS_POR_LUGAR[san]) {
    return CIRUJANOS_POR_LUGAR[san];
  }
  return {};
}
