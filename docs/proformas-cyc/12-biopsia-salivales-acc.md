# Proforma 12 — Biopsia de glándulas salivales accesorias

**id:** cyc-biopsia-salivales-acc-v1 · especialidad: Cirugía de Cabeza y Cuello · **OK de semilla** (definición aprobada; motor P2 pendiente)

Índice: [README.md](README.md)

---

## Proforma 12 — Biopsia de glándulas salivales accesorias

```text
id:            cyc-biopsia-salivales-acc-v1
especialidad:  "Cirugía de Cabeza y Cuello"
operaciones: [
  "Biopsia de glándulas salivales accesorias"
]
titulo: "Biopsia de glándulas salivales accesorias"

slots:
  - id: sitio
    type: single
    required: true
    label: Sitio de toma
    options:
      - Mucosa labial inferior
      - Paladar

  - id: cantidad_lobulillos_estado
    type: single
    required: true
    label: Cantidad de lobulillos — estado
    options:
      - Cuantificado
      - No cuantificable en el acto

  - id: cantidad_lobulillos
    type: free
    required: false
    required_if_cantidad_lobulillos_estado: [Cuantificado]
    label: Cantidad de lobulillos (número)
    # Numérico; sin empty_text que invente un número.
    # Solo obligatorio si estado = Cuantificado.

  - id: objetivo_diagnostico
    type: single
    required: true
    label: Objetivo diagnóstico
    options:
      - Descarte de Síndrome de Sjögren / Amiloidosis / enfermedad autoinmune
      - Lesión tumoral

  - id: hallazgos
    type: free
    required: false
    label: Hallazgos
    empty_text: ""

  - id: hemostasia
    type: free
    required: false
    label: Hemostasia / cierre
    # Sin empty_text que afirme cierre por defecto

plantilla_texto: |
  Se realiza biopsia de glándulas salivales accesorias en {{sitio}}.
  Lobulillos: {{cantidad_lobulillos_estado}}{{cantidad_frase}}.
  Objetivo diagnóstico: {{objetivo_diagnostico}}.
  {{#if_filled hallazgos}}Hallazgos: {{hallazgos}}.{{/if_filled}}
  {{#if_filled hemostasia}}{{hemostasia}}.{{/if_filled}}
```

**Validación condicional:** si `cantidad_lobulillos_estado` = Cuantificado →
`cantidad_lobulillos` required. Si = No cuantificable en el acto → no se
exige número (no inventar conteo).

`cantidad_frase` = si cuantificado → `", n = {{cantidad_lobulillos}}"`; si no → `""`.
