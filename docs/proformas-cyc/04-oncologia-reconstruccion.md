# Proforma 4 — Oncología cervicofacial compleja

**id:** cyc-oncologia-reconstruccion-v1 · especialidad: Cirugía de Cabeza y Cuello · **OK de semilla** (definición aprobada; motor P2 pendiente)

Índice: [README.md](README.md)

---

## Proforma 4 — Oncología cervicofacial compleja

**Alcance:** resección oncológica **con** reconstrucción compleja (incluye
laringectomía oncológica asociada a reconstrucción compleja). Laringe
aislada / MLS / laringectomía simple → **Proforma 11** (`cyc-laringe-mls-v1`).

```text
id:            cyc-oncologia-reconstruccion-v1
especialidad:  "Cirugía de Cabeza y Cuello"
operaciones: [
  "Glosectomía",
  "Mandibulectomía",
  "Maxilectomía",
  "Laringectomía",
  "Resección oncológica cervicofacial con reconstrucción"
]
titulo: "Oncología cervicofacial compleja (resección + reconstrucción)"

slots:
  - id: reseccion
    type: multi
    required: true
    label: Resección(es) realizada(s)
    options: [Glosectomía, Mandibulectomía, Maxilectomía, Laringectomía]
    join: "; "

  - id: glosectomia_ext
    type: single
    required: false
    required_if_reseccion_includes: [Glosectomía]
    label: Extensión — glosectomía
    options: [Parcial, Hemi, Subtotal, Total]
    empty_text: ""

  - id: mandibulectomia_ext
    type: single
    required: false
    required_if_reseccion_includes: [Mandibulectomía]
    label: Extensión — mandibulectomía
    options: [Marginal, Segmentaria, Hemi, Total]
    empty_text: ""

  - id: mandib_desart
    type: single
    required: false
    label: Desarticulación (mandíbula)
    options: [Sin desarticulación, Con desarticulación]
    empty_text: ""

  - id: maxilectomia_ext
    type: single
    required: false
    required_if_reseccion_includes: [Maxilectomía]
    label: Extensión — maxilectomía
    options: [Medial, Inferior, Subtotal, Total]
    empty_text: ""

  - id: maxil_exent
    type: single
    required: false
    label: Exenteración orbitaria
    options: [Sin exenteración, Con exenteración]
    empty_text: ""

  - id: laringectomia_ext
    type: single
    required: false
    required_if_reseccion_includes: [Laringectomía]
    label: Extensión — laringectomía
    options: [Total, Supraglótica, Supracricoidea, Parcial]
    empty_text: ""

  - id: recon_modo
    type: single
    required: true
    label: Modo de reconstrucción
    options:
      - Cierre primario
      - Colgajo local
      - Colgajo regional
      - Colgajo libre microvascularizado
      - Material protésico

  - id: colgajo_local
    type: single
    required: false
    label: Colgajo local
    options: [Nasogeniano, Lengua, FAMM]
    empty_text: ""

  - id: colgajo_regional
    type: single
    required: false
    label: Colgajo regional
    options: [Pectoral, Trapecio, Dorsal ancho, Temporal]
    empty_text: ""

  - id: colgajo_libre
    type: single
    required: false
    label: Colgajo libre
    options: [Peroné, Radial, ALT, Cresta ilíaca]
    empty_text: ""

  - id: protesis
    type: multi
    required: false
    label: Material protésico
    options: [Placas de titanio, Prótesis condilar, Malla orbitaria]
    join: ", "
    empty_text: ""

  - id: anastomosis
    type: free
    required: false
    label: Anastomosis arterial / venosa (detalle)
    empty_text: ""

  - id: isquemia_min
    type: free
    required: false
    label: Tiempo de isquemia (min)
    suffix: " min"
    empty_text: ""

  - id: doppler
    type: single
    required: false
    label: Patencia por Doppler (colgajo libre)
    options: [Permeable, No permeable, No aplica]
    empty_text: "Doppler no documentado"

  - id: pieza_macro
    type: free
    required: false
    label: Descripción macroscópica de la pieza
    empty_text: "Descripción macroscópica no documentada"

  - id: margen_cong
    type: single
    required: false
    label: Biopsia de márgenes por congelación
    options: [Libre, Comprometido]
    empty_text: ""

  - id: margen_mm
    type: free
    required: false
    label: Margen (mm)
    suffix: " mm"
    empty_text: ""

  - id: sng
    type: single
    required: false
    label: Sonda nasogástrica
    options: [Sí, No]
    empty_text: ""

  - id: drenajes
    type: free
    required: false
    label: Drenajes (detalle)
    empty_text: ""

plantilla_texto: |
  Tiempo oncológico: se realiza {{reseccion}}.
  {{#if_filled glosectomia_ext}}Glosectomía: {{glosectomia_ext}}.{{/if_filled}}
  {{#if_filled mandibulectomia_ext}}Mandibulectomía: {{mandibulectomia_ext}}{{#if_filled mandib_desart}} {{mandib_desart}}{{/if_filled}}.{{/if_filled}}
  {{#if_filled maxilectomia_ext}}Maxilectomía: {{maxilectomia_ext}}{{#if_filled maxil_exent}} {{maxil_exent}}{{/if_filled}}.{{/if_filled}}
  {{#if_filled laringectomia_ext}}Laringectomía: {{laringectomia_ext}}.{{/if_filled}}

  Hallazgos: {{pieza_macro}}.
  {{#if_filled margen_cong}}Márgenes por congelación: {{margen_cong}}{{#if_filled margen_mm}} ({{margen_mm}}){{/if_filled}}.{{/if_filled}}

  Tiempo reconstructivo: {{recon_modo}}.
  {{#if_filled colgajo_local}}Local: {{colgajo_local}}.{{/if_filled}}
  {{#if_filled colgajo_regional}}Regional: {{colgajo_regional}}.{{/if_filled}}
  {{#if_filled colgajo_libre}}Libre: {{colgajo_libre}}.{{/if_filled}}
  {{#if_filled protesis}}Protésico: {{protesis}}.{{/if_filled}}
  {{#if_filled anastomosis}}Anastomosis: {{anastomosis}}.{{/if_filled}}
  {{#if_filled isquemia_min}}Isquemia: {{isquemia_min}}.{{/if_filled}}
  {{#if_filled doppler}}Doppler: {{doppler}}.{{/if_filled}}

  {{#if_filled sng}}Sonda nasogástrica: {{sng}}.{{/if_filled}}
  {{#if_filled drenajes}}Drenajes: {{drenajes}}.{{/if_filled}}
  Cierre por planos.
```

**Validación condicional (obligatoria en UI / antes de armar texto):**
si `reseccion` incluye *Glosectomía* → `glosectomia_ext` required;
*Mandibulectomía* → `mandibulectomia_ext`; *Maxilectomía* →
`maxilectomia_ext`; *Laringectomía* → `laringectomia_ext`. Plantilla:
extensiones solo con `if_filled` (sin listar ramas vacías).
