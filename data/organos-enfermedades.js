/** Enfermedades por órgano — lenguaje paciente → chip médico (AnesFact) */
var ORGANOS_ENF = [
  {
    id: 'corazon',
    label: 'Corazón y presión',
    pregunta: '¿Tiene problemas del corazón o de la presión?',
    items: [
      { label: 'Presión alta', chip: 'HTA' },
      { label: 'Infarto, angina o “ataque al corazón”', chip: 'Cardiopatía' },
      { label: 'Corazón débil / insuficiencia cardíaca', chip: 'IC' },
      { label: 'Latidos irregulares (arritmia)', chip: 'Arritmia' },
      { label: 'Marcapasos o desfibrilador (DAI)', chip: 'MCP' },
      { label: 'Operación del corazón o stents', chip: 'Cardiopatía' },
    ],
  },
  {
    id: 'pulmones',
    label: 'Pulmones y respiración',
    pregunta: '¿Tiene problemas para respirar o de los pulmones?',
    items: [
      { label: 'Asma', chip: 'Asma' },
      { label: 'EPOC / enfisema / bronquitis crónica', chip: 'EPOC' },
      { label: 'Ronca mucho o apnea del sueño (CPAP)', chip: 'SAOS' },
      { label: 'Tuberculosis (actual o pasada)', chip: 'TB' },
    ],
  },
  {
    id: 'cerebro',
    label: 'Cerebro y nervios',
    pregunta: '¿Tiene problemas del cerebro, convulsiones o ACV?',
    items: [
      { label: 'Epilepsia o convulsiones', chip: 'Epilepsia' },
      { label: 'ACV / derrame (actual o pasado)', chip: 'ACV' },
      { label: 'Pérdida de memoria importante', chip: 'Demencia' },
      { label: 'Parkinson u otro movimiento', chip: 'Parkinson' },
    ],
  },
  {
    id: 'rinones',
    label: 'Riñones',
    pregunta: '¿Tiene problemas de riñón o hace diálisis?',
    items: [
      { label: 'Riñones malos / insuficiencia renal', chip: 'IRC' },
      { label: 'Diálisis', chip: 'Dialisis' },
      { label: 'Piedras en el riñón frecuentes', chip: 'Litiasis' },
    ],
  },
  {
    id: 'digestivo',
    label: 'Estómago, hígado e intestino',
    pregunta: '¿Tiene problemas del estómago, hígado o intestino?',
    items: [
      { label: 'Hígado graso o hepatitis', chip: 'Hepatopatía' },
      { label: 'Cirrosis', chip: 'Cirrosis' },
      { label: 'Reflujo / acidez frecuente', chip: 'Reflujo' },
      { label: 'Úlcera o gastritis importante', chip: 'Gastropatía' },
    ],
  },
  {
    id: 'metabolismo',
    label: 'Diabetes, tiroides y peso',
    pregunta: '¿Tiene diabetes, tiroides o mucho sobrepeso?',
    items: [
      { label: 'Diabetes', chip: 'DBT2' },
      { label: 'Tiroides (hipo o hiper)', chip: 'Tiroides' },
      { label: 'Sobrepeso u obesidad', chip: 'Obesidad' },
    ],
  },
  {
    id: 'sangre',
    label: 'Sangre y coagulación',
    pregunta: '¿Tiene problemas de la sangre?',
    items: [
      { label: 'Anemia', chip: 'Anemia' },
      { label: 'Le sangra fácil o moretones', chip: 'Coagulopatía' },
      { label: 'Trombosis / embolia (TVP)', chip: 'TVP' },
    ],
  },
  {
    id: 'otros',
    label: 'Otros (embarazo, cáncer, etc.)',
    pregunta: '¿Alguna de estas situaciones?',
    items: [
      { label: 'Embarazo', chip: 'Embarazo' },
      { label: 'Cáncer (actual o tratado)', chip: 'Neoplasia' },
      { label: 'VIH / inmunodeficiencia', chip: 'Inmunodef' },
      { label: 'Dolor crónico fuerte', chip: 'Dolor crónico' },
    ],
  },
];
