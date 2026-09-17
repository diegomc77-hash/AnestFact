# Proforma 9 — Cirugía ortognática

**id:** cyc-ortognatica-v1 · especialidad: Cirugía de Cabeza y Cuello · **OK de semilla** (definición aprobada; motor P2 pendiente)

Índice: [README.md](README.md)

---

## Proforma 9 — Cirugía ortognática (resuelve P7)

Campo **oclusión final** = mismo chequeo de seguridad que Proforma 5 (RIFO).

```text
id:            cyc-ortognatica-v1
especialidad:  "Cirugía de Cabeza y Cuello"
operaciones: [
  "Cirugía ortognática",
  "Osteotomía Le Fort I",
  "Osteotomía sagital de rama mandibular (OSRM)",
  "Mentoplastia"
]
titulo: "Cirugía ortognática (Le Fort I, OSRM, mentoplastia)"

slots:
  - id: procedimiento
    type: multi
    required: true
    label: Procedimiento(s)
    options:
      - Le Fort I
      - OSRM (osteotomía sagital de rama mandibular)
      - Mentoplastia
      - Otro (detallar en texto)
    join: "; "

  - id: lateralidad_osrm
    type: single
    required: false
    label: Lateralidad OSRM
    options: [Derecha, Izquierda, Bilateral]
    empty_text: ""

  - id: fijacion
    type: free
    required: false
    label: Fijación / osteosíntesis (detalle)
    empty_text: "Detalle de fijación / osteosíntesis no documentado"

  - id: oclusion
    type: free
    required: true
    label: Comprobación de oclusión final
    empty_text: "Oclusión comprobada al cierre"

plantilla_texto: |
  Se realiza cirugía ortognática: {{procedimiento}}{{#if_filled lateralidad_osrm}} ({{lateralidad_osrm}}){{/if_filled}}.
  Osteotomías y fijación: {{fijacion}}.
  Comprobación de oclusión final: {{oclusion}}.
  Cierre por planos.
```
