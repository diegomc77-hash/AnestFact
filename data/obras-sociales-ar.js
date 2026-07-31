/** Obras sociales y prepagas — Argentina por provincia */
var OBRAS_PROVINCIAS = [
  { id: 'nacional', label: 'Nacional / prepagas (todo el país)' },
  { id: 'caba', label: 'Ciudad Autónoma de Buenos Aires' },
  { id: 'buenos_aires', label: 'Buenos Aires (provincia)' },
  { id: 'catamarca', label: 'Catamarca' },
  { id: 'chaco', label: 'Chaco' },
  { id: 'chubut', label: 'Chubut' },
  { id: 'cordoba', label: 'Córdoba' },
  { id: 'corrientes', label: 'Corrientes' },
  { id: 'entre_rios', label: 'Entre Ríos' },
  { id: 'formosa', label: 'Formosa' },
  { id: 'jujuy', label: 'Jujuy' },
  { id: 'la_pampa', label: 'La Pampa' },
  { id: 'la_rioja', label: 'La Rioja' },
  { id: 'mendoza', label: 'Mendoza' },
  { id: 'misiones', label: 'Misiones' },
  { id: 'neuquen', label: 'Neuquén' },
  { id: 'rio_negro', label: 'Río Negro' },
  { id: 'salta', label: 'Salta' },
  { id: 'san_juan', label: 'San Juan' },
  { id: 'san_luis', label: 'San Luis' },
  { id: 'santa_cruz', label: 'Santa Cruz' },
  { id: 'santa_fe', label: 'Santa Fe' },
  { id: 'santiago', label: 'Santiago del Estero' },
  { id: 'tierra_fuego', label: 'Tierra del Fuego' },
  { id: 'tucuman', label: 'Tucumán' },
];

var OBRAS_POR_PROVINCIA = {
  nacional: [
    'PAMI', 'IOSFA', 'OSDE', 'Swiss Medical', 'Galeno', 'Medifé', 'Sancor Salud',
    'Medicus', 'Omint', 'Accord Salud', 'Prevención Salud', 'Federada Salud',
    'OSDE 210', 'OSDE 310', 'OSDE 410', 'OSDE 510',
    'Particular / Privado', 'Prepaga particular', 'ART (Accidente de trabajo)',
  ],
  caba: [
    'IOMA', 'OSECAC', 'OSMATA', 'OSDEPYM', 'OSPE', 'OSUTHGRA', 'OSPJN', 'OSPOCE',
    'OSDOP', 'SADAIC', 'OSFE', 'OSPEPBA', 'OSPRERA', 'OSPSA',
  ],
  buenos_aires: [
    'IOMA', 'OSDE', 'OSDIPP', 'OSPIA', 'OSPE', 'OSPRERA', 'OSDOP', 'OSFA',
    'OSPA', 'OSPIV', 'OSAMMVC', 'OSPLAD', 'OSPSIP', 'OSSEG',
  ],
  catamarca: ['OSCE', 'OSPEC', 'OSPSIP', 'DASPU', 'OSPIV'],
  chaco: ['OSPE', 'OSPRERA', 'OSPIV', 'OSDOP', 'OSPEC'],
  chubut: ['OSPE', 'OSPRERA', 'OSPIV', 'OSDOP'],
  cordoba: ['APROSS', 'OSPE', 'OSPRERA', 'OSPIV', 'OSDOP', 'OSPEC', 'OSPEGAP'],
  corrientes: ['OSPE', 'OSPRERA', 'OSPIV', 'OSDOP', 'OSPEC'],
  entre_rios: ['OSPE', 'OSPRERA', 'OSPIV', 'OSDOP', 'OSPEC', 'OSPEGAP'],
  formosa: ['OSPE', 'OSPRERA', 'OSPIV', 'OSDOP'],
  jujuy: ['OSPE', 'OSPRERA', 'OSPIV', 'OSDOP', 'OSPEC'],
  la_pampa: ['OSPE', 'OSPRERA', 'OSPIV', 'OSDOP'],
  la_rioja: ['OSPE', 'OSPRERA', 'OSPIV', 'OSDOP'],
  mendoza: ['OSPE', 'OSPRERA', 'OSPIV', 'OSDOP', 'OSPEC', 'OSPEGAP'],
  misiones: ['OSPE', 'OSPRERA', 'OSPIV', 'OSDOP', 'OSPEC'],
  neuquen: ['OSPE', 'OSPRERA', 'OSPIV', 'OSDOP'],
  rio_negro: ['OSPE', 'OSPRERA', 'OSPIV', 'OSDOP'],
  salta: ['OSPE', 'OSPRERA', 'OSPIV', 'OSDOP', 'OSPEC'],
  san_juan: ['OSPE', 'OSPRERA', 'OSPIV', 'OSDOP', 'OSPEGAP'],
  san_luis: ['OSPE', 'OSPRERA', 'OSPIV', 'OSDOP'],
  santa_cruz: ['OSPE', 'OSPRERA', 'OSPIV', 'OSDOP'],
  santa_fe: ['OSPE', 'OSPRERA', 'OSPIV', 'OSDOP', 'OSPEC', 'OSPEGAP', 'APROSS Santa Fe'],
  santiago: ['OSPE', 'OSPRERA', 'OSPIV', 'OSDOP'],
  tierra_fuego: ['OSPE', 'OSPRERA', 'OSPIV', 'OSDOP'],
  tucuman: ['OSPE', 'OSPRERA', 'OSPIV', 'OSDOP', 'OSPEC', 'OSPEGAP'],
};

function obrasListaProvincia(provId) {
  var nac = OBRAS_POR_PROVINCIA.nacional || [];
  var loc = OBRAS_POR_PROVINCIA[provId] || [];
  var seen = {};
  var out = [];
  nac.concat(loc).forEach(function (x) {
    if (!seen[x]) { seen[x] = 1; out.push(x); }
  });
  return out;
}
