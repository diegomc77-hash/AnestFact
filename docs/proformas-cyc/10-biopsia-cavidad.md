# Proforma 10 — Biopsias / exéresis cavidad oral, orofaringe, rinofaringe

**id:** cyc-biopsia-cavidad-v1 · especialidad: Cirugía de Cabeza y Cuello · **OK de semilla** (definición aprobada; motor P2 pendiente)

Índice: [README.md](README.md)

---

## Proforma 10 — Biopsias / exéresis en cavidad oral, orofaringe y rinofaringe

```text
id:            cyc-biopsia-cavidad-v1
especialidad:  "Cirugía de Cabeza y Cuello"
operaciones: [
  "Biopsia de cavidad oral",
  "Biopsia de orofaringe",
  "Biopsia de rinofaringe",
  "Exéresis de lesión de cavidad oral",
  "Exéresis de lesión de orofaringe",
  "Exéresis de lesión de rinofaringe"
]
titulo: "Biopsias / exéresis en cavidad oral, orofaringe y rinofaringe"

slots:
  - id: sitio
    type: single
    required: true
    label: Sitio
    options: [Cavidad oral, Orofaringe, Rinofaringe]

  - id: sitio_oral
    type: single
    required: false
    required_if_sitio: [Cavidad oral]
    label: Sub-localización — cavidad oral
    options: [Lengua, Piso de boca, Mucosa yugular, Encía, Paladar duro]
    empty_text: ""

  - id: sitio_oro
    type: single
    required: false
    required_if_sitio: [Orofaringe]
    label: Sub-localización — orofaringe
    options: [Amígdala, Base de lengua, Paladar blando, Pared posterior]
    empty_text: ""

  - id: tipo_acto
    type: single
    required: true
    label: Tipo de acto
    options:
      - Biopsia incisional
      - Biopsia escisional
      - Resección local amplia

  - id: abordaje
    type: single
    required: true
    label: Abordaje
    options:
      - Transoral directo
      - Transoral guiado por endoscopía/microscopio
      - TORS (robótico)

  - id: margen_marcado
    type: single
    required: true
    label: Margen marcado
    options:
      - Sí — suturas de orientación
      - No

  - id: cierre_defecto
    type: single
    required: true
    label: Cierre del defecto
    options:
      - Cierre primario
      - Hemostasia y cicatrización por 2da intención
      - Colgajo local

  - id: hallazgos
    type: free
    required: false
    label: Hallazgos
    empty_text: "[hallazgos a completar]"

plantilla_texto: |
  Se realiza {{tipo_acto}} en {{sitio}}.
  {{#if_filled sitio_oral}}Cavidad oral: {{sitio_oral}}.{{/if_filled}}
  {{#if_filled sitio_oro}}Orofaringe: {{sitio_oro}}.{{/if_filled}}
  Abordaje: {{abordaje}}.
  Margen marcado: {{margen_marcado}}. Cierre del defecto: {{cierre_defecto}}.
  Hallazgos: {{hallazgos}}.
```

**Validación condicional:** si `sitio` = Cavidad oral → `sitio_oral` required;
si Orofaringe → `sitio_oro` required. Rinofaringe: sin sub-lista en el
material actual (solo el sitio). Plantilla: sub-sitios solo si `if_filled`.
