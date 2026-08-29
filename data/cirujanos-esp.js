// Cirujanos por lugar + especialidad (predictivo en Datos de la intervención).
// Claves de especialidad = valores exactos de #f-serv (views/nueva.html).
// Otras clínicas: sin catálogo fijo → solo aprendidos de intervenciones del mismo lugar.

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
    'Oftalmología': [
      'Dra. Sonzini Emma Eugenia',
      'Dr. Peña José',
      'Dra. Namur Sandra',
      'Dra. Botta Castelli Viviana',
      'Tealdi Daniela'
    ],
    'ORL (Otorrinolaringología)': [
      'Dr. Sapag Julio',
      'Latini María Cecilia',
      'Conci Rodolfo'
    ],
    'Endoscopía Digestiva': [
      'Dr. Bernardi Gustavo',
      'Dra. Silvestri Patricia',
      'Flores Cintia'
    ],
    'Traumatología y Ortopedia': [
      'Puertas Jorge',
      'Olmedo Damián',
      'Simes José',
      'Oyola Diego',
      'Lauret José',
      'Lezama Luis'
    ],
    'Cirugía General': [
      'Dr. Natalia Denis',
      'Dr. Mariategui Emilio',
      'Dr. Passadore Guido',
      'Dr. Rusculleda Pablo',
      'Jalil Norman'
    ],
    'Cirugía Vascular': [
      'Dr. Navarro Juan Manuel',
      'Dr. Figueroa Adolfo'
    ],
    'Urología': [
      'Dr. Durany Francisco',
      'Dr. Garay Novillo Juan Ignacio',
      'Dr. Páez Héctor Marcelo',
      'Revol Martín',
      'Del Franco Monserrat'
    ],
    'Cirugía Torácica': [
      'Dr. Losano Brotons Matías'
    ],
    'Cirugía Pediátrica': [
      'Dr. Sferco Ariel'
    ],
    'Neurocirugía': [
      'Dr. Cabanillas Juan'
    ],
    'Ginecología y Obstetricia': [
      'Dr. Cueto Ecca Néstor',
      'Dra. Gabutti Jésica',
      'Dr. Goldsmorthi Gustavo',
      'Dra. Folla Mónica Andrea',
      'Dra. Barbero Soledad',
      'Dr. Goicoechea Javier',
      'Larrazabal Fernando',
      'Luna Campos Sandra',
      'Moreno María José'
    ]
  },
  'Hospital Córdoba': {
    'Cirugía General': [
      'Prof. Dr. José A. Cooke',
      'Prof. Dr. Germán Llancaman',
      'Dr. Máximo Sánchez Mocchi',
      'Dr. Aberastain Oro',
      'Dr. Leandro Correa',
      'Dr. Maximiliano Sosa Gallardo',
      'Dr. Nicolás Sosa Gallardo (Bariátrica)',
      'Dra. Mariana Oliva (Bariátrica)',
      'Dra. Mercedes Burgos (Unidad Bariátrica)',
      'Dr. Ignacio José Becchetti (Digestivo Superior / Hernias)',
      'Prof. Dr. Ángel Lo Celso',
      'Dr. Guillermo Sosa (Cuidados Críticos)'
    ],
    'Urología': [
      'Dr. Alberto Marcelo Bertrán',
      'Dr. Gustavo Héctor Bechis',
      'Dr. Héctor Marcelo Páez',
      'Dr. Félix Francisco Terroba',
      'Dr. Luis Abreu',
      'Dr. Raúl Roldán',
      'Dr. Marcelo De La Colina (Oncólogo)'
    ],
    'Neurocirugía': [
      'Dr. Matías S. Berra',
      'Dr. Javier A. Sánchez',
      'Dr. Santiago Passero Gavier',
      'Dra. Paula Estario'
    ],
    'Cirugía Vascular': [
      'Dr. Pablo Monayar',
      'Dr. Daniel Kuznietz',
      'Dr. Ariel Vicens',
      'Dr. Juan Navarro',
      'Dr. José D\'Angelo'
    ],
    'Cirugía de Tórax y Cardiovascular': [
      'Dr. Néstor Medeot',
      'Prof. Dr. Adolfo Uribe (Trasplante intratorácico)',
      'Dr. Néstor Bustamante',
      'Dr. Sergio Rottino',
      'Dr. Matías Bochinfuso',
      'Dr. Daniel Maldonado',
      'Dr. Jorge Guevara',
      'Dr. Ricardo Luengo',
      'Dra. Clara Huerta (Trasplante Cardíaco)'
    ],
    'Cirugía Torácica': [
      'Dr. Néstor Medeot',
      'Prof. Dr. Adolfo Uribe (Trasplante intratorácico)',
      'Dr. Néstor Bustamante',
      'Dr. Sergio Rottino',
      'Dr. Matías Bochinfuso',
      'Dr. Daniel Maldonado',
      'Dr. Jorge Guevara',
      'Dr. Ricardo Luengo',
      'Dra. Clara Huerta (Trasplante Cardíaco)'
    ],
    'Cirugía Cardiovascular': [
      'Dr. Néstor Medeot',
      'Prof. Dr. Adolfo Uribe (Trasplante intratorácico)',
      'Dr. Néstor Bustamante',
      'Dr. Sergio Rottino',
      'Dr. Matías Bochinfuso',
      'Dr. Daniel Maldonado',
      'Dr. Jorge Guevara',
      'Dr. Ricardo Luengo',
      'Dra. Clara Huerta (Trasplante Cardíaco)'
    ],
    'Cardiocirugía': [
      'Dr. Néstor Medeot',
      'Prof. Dr. Adolfo Uribe (Trasplante intratorácico)',
      'Dr. Néstor Bustamante',
      'Dr. Sergio Rottino',
      'Dr. Matías Bochinfuso',
      'Dr. Daniel Maldonado',
      'Dr. Jorge Guevara',
      'Dr. Ricardo Luengo',
      'Dra. Clara Huerta (Trasplante Cardíaco)'
    ],
    'Instituto del Quemado': [
      'Dr. Damián Andrade',
      'Dr. Walter Contreras',
      'Dr. Guillermo Pedraza',
      'Dr. José Almada',
      'Dra. Analía Riutort',
      'Dra. Romina Setti',
      'Dr. Sergio Ledesma',
      'Dr. Martín Rapetti',
      'Dr. Carlos Manukian',
      'Dr. Diego Oviedo',
      'Dr. Mariano Fagandini',
      'Dra. Wilda Olmos',
      'Dra. Paula Shiraishi'
    ],
    'Oftalmología': [
      'Dr. Marcos Iribarren',
      'Dr. Osvaldo Cuello',
      'Dr. Federico Pegoraro',
      'Dr. Pablo Fornero',
      'Dra. Ximena Castelao Lima',
      'Dra. Paula Romero'
    ]
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
