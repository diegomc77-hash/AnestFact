# Proforma 7 — Nariz y senos paranasales

**id:** cyc-nariz-senos-v1 · especialidad: Cirugía de Cabeza y Cuello · **OK de semilla** (definición aprobada; motor P2 pendiente)

Índice: [README.md](README.md) · Tracking: [HALLAZGOS_ESQUELETO.md](HALLAZGOS_ESQUELETO.md)

---

## Proforma 7 — Nariz y senos paranasales (resuelve P8)

```text
id:            cyc-nariz-senos-v1
especialidad:  "Cirugía de Cabeza y Cuello"
operaciones: [
  "Cirugía endoscópica nasal (CEN / FESS)",
  "Polipectomía nasal",
  "Septoplastia",
  "Cirugía de senos paranasales",
  "Cierre / reconstrucción de base de cráneo (vía nasal)"
]
titulo: "Nariz y senos paranasales"

slots:
  - id: procedimiento
    type: multi
    required: true
    label: Procedimiento(s)
    options:
      - CEN / FESS
      - Polipectomía
      - Septoplastia
      - Cierre / reconstrucción de base de cráneo (vía nasal)
      - Otro (detallar en texto)
    join: "; "

  - id: lateralidad
    type: single
    required: false
    label: Lateralidad
    options: [Derecha, Izquierda, Bilateral]
    empty_text: ""

  - id: senos
    type: multi
    required: false
    label: Senos abordados (si FESS / CEN)
    options: [Maxilar, Etmoidal, Frontal, Esfenoidal]
    join: ", "
    empty_text: ""

  - id: angulo_endoscopio
    type: single
    required: false
    label: Ángulo de visualización endoscópica
    options: ["0°", "30°", "45°", "70°"]
    empty_text: ""

  - id: navegacion
    type: single
    required: false
    label: Navegación intraoperatoria
    options: [Sí, No]
    empty_text: ""

  - id: cebc_reseccion_xref_nota
    type: single
    required: false
    required_if_procedimiento: [Cierre / reconstrucción de base de cráneo (vía nasal)]
    label: Resección / corredor CEBC (referencia)
    options:
      - Definición en Neurocirugía M14 §1 (cneuro-neurocirugia-v1) — foja neuro aparte si equipo; no completar lesión/corredor acá
    empty_text: ""

  - id: proc_cierre_base_craneo
    type: multi
    required: false
    required_if_procedimiento: [Cierre / reconstrucción de base de cráneo (vía nasal)]
    label: Técnica de cierre / reconstrucción
    options:
      - Colgajo nasoseptal pediculado (Hadad-Bassagasteguy)
      - Injerto libre
      - Sellante de fibrina / sustituto dural
      - Taponamiento nasal
      - Catéter lumbar de drenaje
    join: "; "
    empty_text: ""

  - id: lateralidad_colgajo_nasoseptal
    type: single
    required: false
    required_if_proc_cierre_base_craneo: [Colgajo nasoseptal pediculado (Hadad-Bassagasteguy)]
    label: Lateralidad del colgajo nasoseptal
    options: [Derecha, Izquierda]
    empty_text: ""

  - id: tipo_injerto_libre_base_craneo
    type: multi
    required: false
    required_if_proc_cierre_base_craneo: [Injerto libre]
    label: Injerto libre — material
    options:
      - Grasa
      - Fascia lata
      - Mucosa
    join: ", "
    empty_text: ""

  - id: tipo_sellante_base_craneo
    type: multi
    required: false
    required_if_proc_cierre_base_craneo: [Sellante de fibrina / sustituto dural]
    label: Sellante / sustituto dural
    options:
      - Sellante de fibrina
      - Sustituto dural
    join: ", "
    empty_text: ""

  - id: empaquetamiento
    type: single
    required: false
    label: Manejo de empaquetamiento
    options: [Merocel, Nasopore, Sin taponamiento]
    empty_text: ""

  - id: hallazgos
    type: free
    required: false
    label: Hallazgos intraoperatorios
    empty_text: "Hallazgos intraoperatorios no documentados"

  - id: hemostasia_cierre
    type: free
    required: false
    label: Hemostasia / cierre (detalle adicional)
    empty_text: ""

plantilla_texto: |
  Se realiza {{procedimiento}}{{#if_filled lateralidad}} ({{lateralidad}}){{/if_filled}}.
  {{#if_filled senos}}Senos abordados: {{senos}}.{{/if_filled}}
  {{#if_filled angulo_endoscopio}}Endoscopio: {{angulo_endoscopio}}.{{/if_filled}}
  {{#if_filled navegacion}}Navegación intraoperatoria: {{navegacion}}.{{/if_filled}}
  {{#if_filled cebc_reseccion_xref_nota}}Base de cráneo — resección/corredor (xref Neuro): {{cebc_reseccion_xref_nota}}.{{/if_filled}}
  {{#if_filled proc_cierre_base_craneo}}Cierre / reconstrucción de base de cráneo: {{proc_cierre_base_craneo}}.{{/if_filled}}
  {{#if_filled lateralidad_colgajo_nasoseptal}}Colgajo nasoseptal (Hadad): {{lateralidad_colgajo_nasoseptal}}.{{/if_filled}}
  {{#if_filled tipo_injerto_libre_base_craneo}}Injerto libre: {{tipo_injerto_libre_base_craneo}}.{{/if_filled}}
  {{#if_filled tipo_sellante_base_craneo}}Sellante / sustituto dural: {{tipo_sellante_base_craneo}}.{{/if_filled}}
  Hallazgos: {{hallazgos}}.
  {{#if_filled empaquetamiento}}Empaquetamiento: {{empaquetamiento}}.{{/if_filled}}
  {{#if_filled hemostasia_cierre}}{{hemostasia_cierre}}.{{/if_filled}}
```

---

## Notas (ampliación CEBC — 2026-09-14)

1. Cierre / reconstrucción de base de cráneo (vía nasal): dueño acá.
   Resección lesional + corredor → xref `cebc_reseccion_xref_nota` a
   Neurocirugía M14 §1 (`cneuro-neurocirugia-v1`).
2. Equipo neuro+ORL = foja cada uno (Huerta 2026-09-14); sin foja
   compartida. Xref alcanza.
3. `empaquetamiento` (Merocel/Nasopore/…) sigue siendo el de FESS/CEN;
   taponamiento nasal / CLD del cierre CEBC van en `proc_cierre_base_craneo`.
