# Proforma 11 — Laringe y microcirugía laríngea (MLS)

**id:** cyc-laringe-mls-v1 · especialidad: Cirugía de Cabeza y Cuello · **OK de semilla** (definición aprobada; motor P2 pendiente)

Índice: [README.md](README.md)

---

## Proforma 11 — Laringe y microcirugía laríngea (MLS) — separada de la 4

**No fusionar con Proforma 4.** Casos aislados sin reconstrucción compleja.
Incluye **manejo de vía aérea** (coordinación con anestesia / sync entre fojas).

```text
id:            cyc-laringe-mls-v1
especialidad:  "Cirugía de Cabeza y Cuello"
operaciones: [
  "Microcirugía laríngea (MLS)",
  "Biopsia laríngea",
  "Exéresis de lesión laríngea benigna",
  "Laringectomía parcial simple",
  "Cordectomía",
  "Laringectomía total simple (sin reconstrucción compleja)"
]
titulo: "Laringe y microcirugía laríngea (MLS)"

slots:
  - id: procedimiento
    type: single
    required: true
    label: Procedimiento
    options:
      - Microcirugía laríngea (MLS)
      - Biopsia laríngea
      - Exéresis de lesión benigna
      - Laringectomía parcial simple
      - Laringectomía total simple (sin reconstrucción compleja)

  - id: lesion_benigna_tipo
    type: single
    required: false
    required_if_procedimiento: [Exéresis de lesión benigna]
    label: Tipo de lesión benigna
    options:
      - Pólipo
      - Nódulo
      - Quiste epidermoide
      - Edema de Reinke
      - Papilomatosis
    empty_text: ""

  - id: parcial_simple_tipo
    type: single
    required: false
    required_if_procedimiento: [Laringectomía parcial simple]
    label: Tipo de laringectomía parcial simple
    options:
      - Cordectomía
      - Otra parcial (detallar en texto)
    empty_text: ""

  - id: instrumentacion
    type: single
    required: true
    label: Instrumentación
    options:
      - Instrumental frío de microcirugía
      - Láser CO2
      - Radiofrecuencia

  - id: cuerda_vocal_eval
    type: single
    required: false
    label: Cuerda vocal / región evaluada o tratada
    options: [Derecha, Izquierda, Comisura anterior]
    empty_text: ""

  - id: laringoscopio
    type: free
    required: true
    label: Laringoscopio de suspensión (tipo / modelo)
    # Sin empty_text que invente un modelo

  - id: ventilacion
    type: single
    required: true
    label: Manejo de vía aérea / ventilación
    options:
      - Tubo estándar
      - Ventilación jet
      - Otro (detallar en texto)

  - id: ventilacion_detalle
    type: free
    required: false
    label: Detalle de vía aérea (si Otro u observación)
    empty_text: ""

  - id: hallazgos
    type: free
    required: false
    label: Hallazgos / lesión
    empty_text: "Hallazgos no documentados"

  - id: hemostasia_cierre
    type: free
    required: false
    label: Hemostasia / cierre
    # Sin empty_text que afirme hemostasia por defecto

plantilla_texto: |
  Se realiza {{procedimiento}}.
  {{#if_filled lesion_benigna_tipo}}Lesión benigna: {{lesion_benigna_tipo}}.{{/if_filled}}
  {{#if_filled parcial_simple_tipo}}Parcial simple: {{parcial_simple_tipo}}.{{/if_filled}}
  Instrumentación: {{instrumentacion}}.
  {{#if_filled cuerda_vocal_eval}}Cuerda vocal / región: {{cuerda_vocal_eval}}.{{/if_filled}}
  Manejo de vía aérea (coordinado con anestesia): laringoscopio de
  suspensión {{laringoscopio}}; ventilación {{ventilacion}}.
  {{#if_filled ventilacion_detalle}}{{ventilacion_detalle}}.{{/if_filled}}

  {{#if_filled hallazgos}}Hallazgos: {{hallazgos}}.{{/if_filled}}
  {{#if_filled hemostasia_cierre}}{{hemostasia_cierre}}.{{/if_filled}}
```

**Validación condicional:** `Exéresis de lesión benigna` →
`lesion_benigna_tipo` required; `Laringectomía parcial simple` →
`parcial_simple_tipo` required (incluye **Cordectomía**). Plantilla:
detalle de tipo solo si `if_filled`.
