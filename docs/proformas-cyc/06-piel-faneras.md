# Proforma 6 — Piel y faneras (amplía Mohs)

**id:** cyc-piel-faneras-v1 · especialidad: Cirugía de Cabeza y Cuello · **OK de semilla** (definición aprobada; motor P2 pendiente)

Índice: [README.md](README.md)

---

## Proforma 6 — Patología quirúrgica de piel y faneras (amplía Mohs)

**Reemplaza** el esqueleto previo `cyc-mohs-cutaneo-v1` (no convive aparte).
Base = Proforma 6 original + diagnóstico presuntivo + localizaciones nuevas.

```text
id:            cyc-piel-faneras-v1
reemplaza:     cyc-mohs-cutaneo-v1
especialidad:  "Cirugía de Cabeza y Cuello"
operaciones: [
  "Cirugía micrográfica de Mohs",
  "Resección cutánea oncológica facial",
  "Resección cutánea de piel y faneras",
  "Reconstrucción facial post-Mohs",
  "Exéresis de lesión cutánea de cabeza y cuello"
]
titulo: "Patología quirúrgica de piel y faneras (Mohs / convencional + reconstrucción)"

slots:
  - id: diag_presuntivo
    type: single
    required: true
    label: Diagnóstico presuntivo
    options:
      - Carcinoma basocelular
      - Carcinoma espinocelular
      - Melanoma
      - Lesión benigna

  - id: localizacion
    type: single
    required: true
    label: Localización
    options:
      - Pirámide nasal
      - Geniana
      - Párpado / cantal
      - Periocular
      - Auricular
      - Labio
      - Cuero cabelludo
      - Frente
      - Manto parotídeo
      - Cervical

  - id: tecnica
    type: single
    required: true
    label: Técnica de resección
    options:
      - Cirugía micrográfica de Mohs (evaluación 100% márgenes)
      - Resección convencional

  - id: margen_mm
    type: free
    required: false
    label: Margen de resección convencional (mm)
    suffix: " mm"
    empty_text: ""

  - id: mohs_capas
    type: free
    required: false
    label: Resultado por capa / cuadrantes horarios (comprometido o libre)
    empty_text: "No se documentó resultado por capas Mohs"

  - id: defecto_tamano
    type: free
    required: false
    label: Defecto — tamaño
    empty_text: ""

  - id: defecto_prof
    type: free
    required: false
    label: Defecto — profundidad
    empty_text: ""

  - id: reconstruccion
    type: single
    required: true
    label: Reconstrucción
    options:
      - Cierre directo
      - Colgajo de avance
      - Colgajo de rotación
      - Colgajo de transposición (rómbico)
      - Colgajo de transposición (bilobulado)
      - Colgajo paramediano nasal
      - Injerto de piel total

plantilla_texto: |
  Diagnóstico presuntivo: {{diag_presuntivo}}. Lesión en {{localizacion}}.
  Técnica: {{tecnica}}{{margen_frase}}.

  {{#if_eq tecnica "Cirugía micrográfica de Mohs (evaluación 100% márgenes)"}}
  Marcación por cuadrantes horarios. Resultado de capas / márgenes:
  {{mohs_capas}}.
  {{/if_eq}}

  {{#if_filled defecto_tamano}}Tamaño del defecto: {{defecto_tamano}}.{{/if_filled}}
  {{#if_filled defecto_prof}}Profundidad del defecto: {{defecto_prof}}.{{/if_filled}}
  Reconstrucción: {{reconstruccion}}.

  Cierre con sutura por planos.
```

`margen_frase` = si hay `margen_mm` → `" con margen de {{margen_mm}}"`.
