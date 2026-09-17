# Proforma 8 — Patología benigna y congénita del cuello

**id:** cyc-benigna-cuello-v1 · especialidad: Cirugía de Cabeza y Cuello · **OK de semilla** (definición aprobada; motor P2 pendiente)

Índice: [README.md](README.md)

---

## Proforma 8 — Patología benigna y congénita del cuello (resuelve P9 + P10)

Incluye tumores glómicos, schwannomas, quistes branquiales y tiroglosos
(además del Sistrunk que ya puede matchear en Proforma 1).

```text
id:            cyc-benigna-cuello-v1
especialidad:  "Cirugía de Cabeza y Cuello"
operaciones: [
  "Resección de quiste tirogloso (Sistrunk)",
  "Resección de quiste branquial",
  "Resección de schwannoma cervical",
  "Resección de tumor glómico",
  "Cirugía de patología benigna / congénita de cuello"
]
titulo: "Patología benigna y congénita del cuello (quistes, schwannomas, glomus)"

slots:
  - id: entidad
    type: single
    required: true
    label: Entidad
    options:
      - Quiste tirogloso
      - Quiste branquial
      - Schwannoma
      - Tumor glómico (glomus)
      - Otra patología benigna / congénita (detallar)

  - id: procedimiento
    type: free
    required: false
    label: Procedimiento concreto (ej. Sistrunk)
    empty_text: "Exéresis de la entidad consignada"

  - id: lateralidad
    type: single
    required: false
    label: Lateralidad
    options: [Derecha, Izquierda, Medial / línea media, Bilateral]
    empty_text: ""

  - id: glomus_ubicacion
    type: single
    required: false
    required_if_entidad: [Tumor glómico (glomus)]
    label: Ubicación (glomus)
    options: [Carotídeo, Yugular, Vagal]
    empty_text: ""

  - id: glomus_embolizacion
    type: single
    required: false
    required_if_entidad: [Tumor glómico (glomus)]
    label: Embolización previa (glomus)
    options: [Sí, No]
    empty_text: ""

  - id: schwannoma_nervio
    type: single
    required: false
    required_if_entidad: [Schwannoma]
    label: Nervio de origen (schwannoma)
    options: [Vago, Simpático, Hipogloso, Espinal]
    empty_text: ""

  - id: schwannoma_preservacion
    type: single
    required: false
    required_if_entidad: [Schwannoma]
    label: Preservación nerviosa (schwannoma)
    options: [Sí, No]
    empty_text: ""

  - id: branquial_arco
    type: single
    required: false
    required_if_entidad: [Quiste branquial]
    label: Arco branquial
    options: ["1°", "2°", "3°", "4°"]
    empty_text: ""

  - id: hallazgos_semiologia
    type: free
    required: false
    label: Hallazgos (tamaño visto, relación con vecinos, aspecto — no conteo AP)
    empty_text: "Hallazgos semiológicos no documentados"

  - id: estructuras_riesgo
    type: free
    required: false
    label: Estructuras de riesgo identificadas / preservadas
    empty_text: ""

  - id: drenaje
    type: single
    required: false
    label: Drenaje
    options: [Sí, No]
    empty_text: ""

plantilla_texto: |
  Entidad: {{entidad}}.
  {{#if_filled procedimiento}}Procedimiento: {{procedimiento}}.{{/if_filled}}
  {{#if_filled lateralidad}}Lateralidad: {{lateralidad}}.{{/if_filled}}
  {{#if_eq entidad "Tumor glómico (glomus)"}}
  Glomus — ubicación: {{glomus_ubicacion}}; embolización previa: {{glomus_embolizacion}}.
  {{/if_eq}}
  {{#if_eq entidad "Schwannoma"}}
  Schwannoma — nervio de origen: {{schwannoma_nervio}}; preservación nerviosa: {{schwannoma_preservacion}}.
  {{/if_eq}}
  {{#if_eq entidad "Quiste branquial"}}
  Quiste branquial — arco: {{branquial_arco}}.
  {{/if_eq}}
  Hallazgos: {{hallazgos_semiologia}}.
  {{#if_filled estructuras_riesgo}}Estructuras de riesgo: {{estructuras_riesgo}}.{{/if_filled}}
  {{#if_filled drenaje}}Cierre: drenaje {{drenaje}}.{{/if_filled}}
  Cierre por planos.
```

**Validación condicional:** si `entidad` = Tumor glómico (glomus) →
`glomus_ubicacion` y `glomus_embolizacion` required; si Schwannoma →
`schwannoma_nervio` y `schwannoma_preservacion`; si Quiste branquial →
`branquial_arco`. Plantilla con `{{#if_eq entidad "…"}}` — solo la
rama elegida entra al texto firmado.
