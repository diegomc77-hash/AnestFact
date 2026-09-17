# Proforma 1 — Tiroides / paratiroides / MIS

**id:** cyc-tiroides-paratiroides-v1 · especialidad: Cirugía de Cabeza y Cuello · **OK de semilla** (definición aprobada; motor P2 pendiente)

Índice: [README.md](README.md)

---

## Proforma 1 — Tiroides / paratiroides / mínimamente invasiva

Jerarquía confirmada Dra. Huerta: **vía → extensión** para cirugía de
tiroides. **Sistrunk** y **Paratiroidectomía** son procedimientos
**separados** (no anidados en vía/extensión).

**Por qué Sistrunk va aparte:** el quiste tirogloso es patología
congénita de origen embriológico, distinta de la enfermedad nodular del
adulto que motiva tiroidectomía / paratiroidectomía.

```text
id:            cyc-tiroides-paratiroides-v1
especialidad:  "Cirugía de Cabeza y Cuello"
operaciones: [
  "Tiroidectomía total",
  "Hemitiroidectomía",
  "Istmectomía",
  "Nodulectomía por ablación",
  "TOETVA",
  "Ablación térmica percutánea",
  "Resección de quiste tirogloso (Sistrunk)",
  "Paratiroidectomía"
]
titulo: "Cirugía de patología tiroidea, paratiroidea y mínimamente invasiva"

slots:
  - id: procedimiento_grupo
    type: single
    required: true
    label: Procedimiento
    options:
      - Cirugía de tiroides (vía + extensión)
      - Resección de quiste tirogloso (Sistrunk)
      - Paratiroidectomía

  # --- Nivel 1: vía/abordaje (solo cirugía de tiroides) ---
  - id: via
    type: single
    required: false
    required_if_procedimiento_grupo: [Cirugía de tiroides (vía + extensión)]
    label: Vía / abordaje
    options:
      - Convencional (abierta)
      - TOETVA
      - Ablativa (percutánea)

  # --- Nivel 2: extensión (según vía) ---
  - id: extension
    type: single
    required: false
    required_if_via: [Convencional (abierta), TOETVA]
    label: Extensión
    options:
      - Tiroidectomía total
      - Hemitiroidectomía
      - Istmectomía
    empty_text: ""

  - id: extension_ablativa
    type: single
    required: false
    required_if_via: [Ablativa (percutánea)]
    label: Extensión (ablativa)
    options:
      - Nodulectomía por ablación
    empty_text: ""

  - id: lado
    type: single
    required: false
    required_if_extension: [Hemitiroidectomía]
    label: Lateralidad (si hemitiroidectomía)
    options: [Derecho, Izquierdo]
    empty_text: ""

  # --- Paratiroidectomía: enfoque quirúrgico + detalle por patología ---
  - id: para_tecnica
    type: single
    required: false
    required_if_procedimiento_grupo: [Paratiroidectomía]
    label: Enfoque quirúrgico (paratiroidectomía)
    options: [Targeted, Selectiva, Exploración de 4 glándulas]
    empty_text: ""

  - id: para_patologia
    type: single
    required: false
    required_if_procedimiento_grupo: [Paratiroidectomía]
    label: Patología de base (paratiroidectomía)
    options:
      - Adenoma
      - Hiperplasia (insuficiencia renal)
    empty_text: ""

  - id: para_lado
    type: single
    required: false
    required_if_para_patologia: [Adenoma]
    label: Lado (adenoma)
    options: [Derecho, Izquierdo]
    empty_text: ""

  - id: para_cantidad
    type: single
    required: false
    required_if_para_patologia: [Adenoma]
    label: Cantidad (adenoma)
    options: [Única, Múltiple]
    empty_text: ""

  - id: para_ubicacion
    type: multi
    required: false
    required_if_para_patologia: [Adenoma]
    label: Ubicación (adenoma; multi si múltiple)
    options: [Superior, Inferior, Ectópica]
    join: ", "
    empty_text: ""

  - id: para_subtotal_lado
    type: single
    required: false
    required_if_para_patologia: [Hiperplasia (insuficiencia renal)]
    label: Lado del remanente (paratiroidectomía subtotal)
    options: [Derecho, Izquierdo]
    empty_text: ""

  - id: para_subtotal_ubicacion
    type: single
    required: false
    required_if_para_patologia: [Hiperplasia (insuficiencia renal)]
    label: Glándula remanente (subtotal)
    options: [Superior, Inferior]
    empty_text: ""

  - id: intubacion
    type: single
    required: true
    label: Intubación
    options:
      - Orotraqueal estándar
      - Orotraqueal con tubo electrodado (neuromonitoreo)
      - Nasotraqueal
      - Vía aérea difícil

  - id: aparatologia
    type: multi
    required: false
    label: Neuromonitoreo / aparatología
    options:
      - NIM intraoperatorio
      - Bisturí ultrasónico
      - Ecógrafo intraoperatorio
      - Insuflador CO2
    join: ", "
    empty_text: "no consignada"

  - id: co2_param
    type: free
    required: false
    label: CO2 — presión / flujo (si insuflador)
    empty_text: ""

  - id: nim_senales
    type: free
    required: false
    label: Señales NIM (V1 / R1 / R2 / V2 y mA)
    empty_text: ""

  - id: nlr
    type: single
    required: false
    required_if_procedimiento_grupo: ["Cirugía de tiroides (vía + extensión)", "Paratiroidectomía"]
    label: Nervio laríngeo recurrente
    options:
      - Identificado y preservado
      - Lesionado/sacrificado

  - id: vaciamiento_asoc
    type: multi
    required: false
    required_if_procedimiento_grupo: ["Cirugía de tiroides (vía + extensión)"]
    label: Vaciamiento ganglionar asociado
    options:
      - Ninguno
      - Central
      - Laterocervical unilateral
      - Laterocervical bilateral
    join: "; "
    empty_text: "no consignado"

  - id: hallazgo_tamano
    type: free
    required: false
    label: Tamaño de la lesión (cm)
    suffix: " cm"
    empty_text: "tamaño no documentado"

  - id: hallazgo_caract
    type: single
    required: false
    label: Características
    options: [Sólido, Quístico, Mixto]
    empty_text: "características no documentadas"

  - id: pth_basal
    type: free
    required: false
    required_if_procedimiento_grupo: [Paratiroidectomía]
    label: PTH basal
    empty_text: "no documentada"

  - id: pth_post
    type: free
    required: false
    required_if_procedimiento_grupo: [Paratiroidectomía]
    label: PTH post-exéresis
    empty_text: "no documentada"

  - id: pth_pct
    type: free
    required: false
    required_if_procedimiento_grupo: [Paratiroidectomía]
    label: Variación PTH (%)
    suffix: " %"
    empty_text: "no documentada"

  - id: biopsia_cong
    type: free
    required: false
    label: Biopsia por congelación (resultado)
    # Neutral si vacío: no afirmar «No se realizó» (mismo criterio que
    # oclusión RIFO — el cirujano pudo hacerla sin tipiar el resultado).
    empty_text: "no consignada"

  - id: drenaje
    type: single
    required: false
    label: Drenaje
    options: [Sí, No]
    empty_text: "no consignado"

  - id: drenaje_detalle
    type: free
    required: false
    label: Detalle de drenaje (si Sí)
    empty_text: ""

plantilla_texto: |
  Procedimiento: {{procedimiento_grupo}}.

  {{#if_eq procedimiento_grupo "Cirugía de tiroides (vía + extensión)"}}
  Vía / abordaje: {{via}}. Extensión: {{extension}}{{extension_ablativa}}{{lado_frase}}.

  Intubación: {{intubacion}}. Aparatología: {{aparatologia}}{{co2_frase}}.

  {{via_tecnica_frase}}
  {{exeresis_frase}}
  Nervio laríngeo recurrente: {{nlr}}.
  {{neuromonitoreo_frase}}

  Vaciamiento ganglionar asociado: {{vaciamiento_asoc}}.

  Hallazgos: lesión de {{hallazgo_tamano}}, características {{hallazgo_caract}}.
  Biopsia por congelación: {{biopsia_cong}}.

  Cierre: drenaje {{drenaje}}{{drenaje_detalle_frase}}. Hemostasia y cierre por planos.
  {{/if_eq}}

  {{#if_eq procedimiento_grupo "Resección de quiste tirogloso (Sistrunk)"}}
  Se realiza resección de quiste tirogloso según técnica de Sistrunk.

  Intubación: {{intubacion}}. Aparatología: {{aparatologia}}{{co2_frase}}.

  Hallazgos: lesión de {{hallazgo_tamano}}, características {{hallazgo_caract}}.
  Biopsia por congelación: {{biopsia_cong}}.

  Cierre: drenaje {{drenaje}}{{drenaje_detalle_frase}}. Hemostasia y cierre por planos.
  {{/if_eq}}

  {{#if_eq procedimiento_grupo "Paratiroidectomía"}}
  Enfoque quirúrgico: {{para_tecnica}}; patología: {{para_patologia}}.
  {{#if_eq para_patologia "Adenoma"}}
  Adenoma — lado {{para_lado}}, cantidad {{para_cantidad}}, ubicación {{para_ubicacion}}.
  {{/if_eq}}
  {{#if_eq para_patologia "Hiperplasia (insuficiencia renal)"}}
  Hiperplasia (paratiroidectomía subtotal, remanente mitad de una glándula) —
  lado del remanente {{para_subtotal_lado}}, glándula {{para_subtotal_ubicacion}}.
  {{/if_eq}}

  Intubación: {{intubacion}}. Aparatología: {{aparatologia}}{{co2_frase}}.
  Nervio laríngeo recurrente: {{nlr}}.
  {{neuromonitoreo_frase}}

  Hallazgos: lesión de {{hallazgo_tamano}}, características {{hallazgo_caract}}.
  PTH basal {{pth_basal}}; PTH post-exéresis {{pth_post}} (variación {{pth_pct}}).
  Biopsia por congelación: {{biopsia_cong}}.

  Cierre: drenaje {{drenaje}}{{drenaje_detalle_frase}}. Hemostasia y cierre por planos.
  {{/if_eq}}
```

**Validación condicional:**
- `Cirugía de tiroides` → `via` required.
- `via` = Convencional o TOETVA → `extension` required.
- `via` = Ablativa → `extension_ablativa` required (= Nodulectomía por ablación).
- `extension` = Hemitiroidectomía → `lado` required.
- `Paratiroidectomía` → `para_tecnica` + `para_patologia` + PTH (visibles solo en esa rama).
- `Adenoma` → `para_lado`, `para_cantidad`, `para_ubicacion` required.
- `Hiperplasia` → `para_subtotal_lado` + `para_subtotal_ubicacion` required.
- Sistrunk: sin vía/extensión ni bloque paratiroides/PTH.
- Redacción: afirmaciones definitivas; `via_tecnica_frase` / `exeresis_frase` /
  `neuromonitoreo_frase` según valores (sin listar opciones no elegidas).

Notas: `lado_frase` / `co2_frase` / `drenaje_detalle_frase` = sufijos opcionales;
el cirujano siempre puede editar el párrafo final (modo Editar y usar).
