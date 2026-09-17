# Proforma 3 — Glándulas salivales (parótida / submaxilar)

**id:** cyc-salivales-v1 · especialidad: Cirugía de Cabeza y Cuello · **OK de semilla** (definición aprobada; motor P2 pendiente)

Índice: [README.md](README.md)

---

## Proforma 3 — Glándulas salivales (parótida / submaxilar)

```text
id:            cyc-salivales-v1
especialidad:  "Cirugía de Cabeza y Cuello"
operaciones: [
  "Parotidectomía superficial",
  "Parotidectomía total",
  "Parotidectomía parcial / lobectomía",
  "Enucleación extracapsular de parótida",
  "Submaxilectomía"
]
titulo: "Glándulas salivales (parótida y submaxilar)"

slots:
  - id: procedimiento
    type: single
    required: true
    label: Procedimiento
    options:
      - Parotidectomía superficial
      - Parotidectomía total
      - Parotidectomía parcial / lobectomía
      - Enucleación extracapsular
      - Submaxilectomía

  - id: lateralidad
    type: single
    required: true
    label: Lateralidad
    options: [Derecha, Izquierda]

  - id: mon_facial
    type: multi
    required: false
    label: Canales de neuromonitoreo del nervio facial
    options: [Frontal, Orbicular, Bucal, Marginal]
    join: ", "
    empty_text: "no consignado"

  - id: hallazgo_lesion
    type: free
    required: false
    label: Lesión — tamaño / consistencia / localización
    empty_text: "Lesión: hallazgos no documentados"

  - id: facial_estado
    type: single
    required: true
    label: Integridad del nervio facial
    options:
      - Íntegro y funcional
      - Rama sacrificada (detallar)

  - id: facial_detalle
    type: free
    required: false
    label: Detalle de rama sacrificada / observación
    empty_text: ""

  - id: lingual_estado
    type: single
    required: false
    required_if_procedimiento: [Submaxilectomía]
    label: Nervio lingual (vía submaxilar)
    options:
      - Identificado y preservado
      - Lesionado/sacrificado
    empty_text: ""

  - id: hipogloso_estado
    type: single
    required: false
    required_if_procedimiento: [Submaxilectomía]
    label: Nervio hipogloso (vía submaxilar)
    options:
      - Identificado y preservado
      - Lesionado/sacrificado
    empty_text: ""

  - id: drenaje
    type: single
    required: false
    label: Drenaje
    options: [Sí, No]
    empty_text: ""

plantilla_texto: |
  Se realiza {{procedimiento}}, lado {{lateralidad}}.
  {{mon_facial_frase}}

  {{#if_eq procedimiento "Submaxilectomía"}}
  Abordaje submandibular: identificación de nervio lingual, hipogloso y
  conducto de Wharton.
  Nervio lingual: {{lingual_estado}}. Nervio hipogloso: {{hipogloso_estado}}.
  {{/if_eq}}
  {{#if_eq procedimiento "Parotidectomía superficial"}}
  Identificación del tronco del facial con referentes anatómicos
  (tragus, vientre posterior del digástrico, sutura timpanomastoidea,
  apófisis estiloides); disección anterógrada por ramas.
  {{/if_eq}}
  {{#if_eq procedimiento "Parotidectomía total"}}
  Identificación del tronco del facial con referentes anatómicos
  (tragus, vientre posterior del digástrico, sutura timpanomastoidea,
  apófisis estiloides); disección anterógrada por ramas.
  {{/if_eq}}
  {{#if_eq procedimiento "Parotidectomía parcial / lobectomía"}}
  Identificación del tronco del facial con referentes anatómicos
  (tragus, vientre posterior del digástrico, sutura timpanomastoidea,
  apófisis estiloides); disección anterógrada por ramas.
  {{/if_eq}}
  {{#if_eq procedimiento "Enucleación extracapsular"}}
  Enucleación extracapsular de la lesión, con disección en el plano
  extracapsular preservando el parénquima glandular adyacente y las
  estructuras nerviosas en continuidad.
  {{/if_eq}}

  Hallazgos: {{hallazgo_lesion}}.
  Nervio facial: {{facial_estado}}.{{#if_filled facial_detalle}} {{facial_detalle}}.{{/if_filled}}

  {{#if_filled drenaje}}Cierre con drenaje: {{drenaje}}.{{/if_filled}}
  Cierre por planos.
```

`required_if_procedimiento`: si `procedimiento` = Submaxilectomía, los
slots `lingual_estado` e `hipogloso_estado` son obligatorios (mismo
espíritu que el estado del facial; no se dejan huecos en el texto legal).

