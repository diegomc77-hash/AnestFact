# Proforma 13 — Biopsias de adenopatías cervicales

**id:** cyc-biopsia-adenopatias-v1 · especialidad: Cirugía de Cabeza y Cuello · **OK de semilla** (definición aprobada; motor P2 pendiente)

Índice: [README.md](README.md)

---

## Proforma 13 — Biopsias de adenopatías cervicales

Semiología del acto en hallazgos; **destino de la muestra** obligatorio.
**Sin** conteo ganglionar de anatomía patológica.

```text
id:            cyc-biopsia-adenopatias-v1
especialidad:  "Cirugía de Cabeza y Cuello"
operaciones: [
  "Biopsia de adenopatía cervical",
  "Exéresis de adenopatía cervical"
]
titulo: "Biopsias de adenopatías cervicales"

slots:
  - id: lateralidad
    type: single
    required: true
    label: Lateralidad
    options: [Derecha, Izquierda, Bilateral]

  - id: nivel
    type: multi
    required: false
    label: Nivel(es) (si se consigna)
    options: [IA, IB, IIA, IIB, III, IV, VA, VB, VI, VII]
    join: ", "
    empty_text: ""

  - id: tipo_acto
    type: single
    required: true
    label: Tipo de acto
    options:
      - Biopsia escisional
      - Biopsia incisional
      - BAAF/BAG guiada

  - id: semiologia
    type: free
    required: false
    label: Semiología (tamaño visto/palpado, fijación, aspecto — no conteo AP)
    empty_text: "Semiología no documentada"

  - id: destino_muestra
    type: multi
    required: true
    label: Destino de la muestra
    options:
      - Anatomía patológica (rutina)
      - Citología
      - Cultivo
      - Citometría en fresco
    join: "; "

plantilla_texto: |
  Se realiza {{tipo_acto}} de adenopatía cervical, lado {{lateralidad}}{{#if_filled nivel}}, nivel(es) {{nivel}}{{/if_filled}}.
  {{#if_filled semiologia}}Hallazgos semiológicos: {{semiologia}}.{{/if_filled}}
  (Sin conteo ganglionar de anatomía patológica.)
  Destino de la muestra: {{destino_muestra}}.
```
