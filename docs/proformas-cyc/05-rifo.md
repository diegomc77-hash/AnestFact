# Proforma 5 — Traumatología maxilofacial (RIFO)

**id:** cyc-rifo-v1 · especialidad: Cirugía de Cabeza y Cuello · **OK de semilla** (definición aprobada; motor P2 pendiente)

Índice: [README.md](README.md)

---

## Proforma 5 — Traumatología maxilofacial (RIFO)

```text
id:            cyc-rifo-v1
especialidad:  "Cirugía de Cabeza y Cuello"
operaciones: [
  "Reducción e inmovilización de fracturas óseas (RIFO)",
  "Osteosíntesis maxilofacial",
  "Tratamiento quirúrgico de fractura mandibular",
  "Tratamiento quirúrgico de fractura orbitomalar / CNEO",
  "Tratamiento quirúrgico de fractura maxilar"
]
titulo: "Traumatología maxilofacial (RIFO)"

slots:
  - id: fractura_grupo
    type: multi
    required: true
    label: Grupo(s) de fractura
    options: [Mandibular, CNEO / Orbitomalar, Maxilar]
    join: "; "

  - id: mandib_sitio
    type: multi
    required: false
    label: Sitio mandibular
    options: [Sínfisis, Cuerpo, Ángulo, Rama, Cóndilo]
    join: ", "
    empty_text: ""

  - id: mandib_lado
    type: single
    required: false
    label: Lado mandibular
    options: [Derecho, Izquierdo, Bilateral]
    empty_text: ""

  - id: cneo_sitio
    type: multi
    required: false
    label: Sitio CNEO / orbitomalar
    options: [Reborde, Pared orbitaria, Arbotante]
    join: ", "
    empty_text: ""

  - id: cneo_lado
    type: single
    required: false
    label: Lado CNEO / orbitomalar
    options: [Derecho, Izquierdo, Bilateral]
    empty_text: ""

  - id: maxilar_tipo
    type: single
    required: false
    label: Fractura maxilar
    options: [LeFort I, LeFort II, LeFort III, Palatina]
    empty_text: ""

  - id: intubacion
    type: single
    required: true
    label: Intubación
    options: [Nasotraqueal, Orotraqueal, Submentoniana, Traqueostomía]

  - id: fim
    type: single
    required: false
    label: Fijación intermaxilar transitoria
    options: [Tornillos IMF, Arcos de Erich, Splint oclusal, No utilizada]
    empty_text: ""

  - id: abordajes
    type: multi
    required: false
    label: Abordajes
    options:
      - Intraoral vestibular
      - Transparotídeo
      - Preauricular
      - Submandibular
      - Subciliar
      - Transconjuntival
    join: ", "
    empty_text: "Abordajes según focos fracturarios"

  - id: osteosintesis
    type: free
    required: false
    label: Osteosíntesis (sistema, orificios, tornillos por foco)
    empty_text: "Detalle de osteosíntesis no documentado"

  - id: oclusion
    type: free
    required: true
    label: Comprobación de oclusión final
    # Sin empty_text que afirme oclusión comprobada: no inventar el
    # chequeo si el cirujano no lo consignó (mismo criterio que Proforma 9).

plantilla_texto: |
  Fractura(s): {{fractura_grupo}}.
  {{#if_filled mandib_sitio}}Mandíbula: {{mandib_sitio}}{{#if_filled mandib_lado}} ({{mandib_lado}}){{/if_filled}}.{{/if_filled}}
  {{#if_filled cneo_sitio}}CNEO/orbitomalar: {{cneo_sitio}}{{#if_filled cneo_lado}} ({{cneo_lado}}){{/if_filled}}.{{/if_filled}}
  {{#if_filled maxilar_tipo}}Maxilar: {{maxilar_tipo}}.{{/if_filled}}

  Intubación: {{intubacion}}.
  {{#if_filled fim}}Fijación intermaxilar transitoria: {{fim}}.{{/if_filled}}
  {{#if_filled abordajes}}Abordajes: {{abordajes}}.{{/if_filled}}
  {{#if_filled osteosintesis}}Reducción y osteosíntesis con placas de titanio: {{osteosintesis}}.{{/if_filled}}
  Comprobación de oclusión final: {{oclusion}}.

  Cierre por planos.
```
