# Módulo — Otorrinolaringología General (M17)

**id:** `corl-orl-general-v1` · especialidad: Otorrinolaringología ·  
**Estado:** **OK de semilla** (2026-09-14). Tracking:
[HALLAZGOS_ESQUELETO.md](HALLAZGOS_ESQUELETO.md).

Índice: [README.md](README.md)

Consentimiento / gasas / ATB = cáscara A4 de Foja Qx (no van acá).

## Validación clínica (leer antes de auditar)

**Este módulo no tiene el mismo nivel de validación directa que Cabeza y
Cuello ni Cirugía General.** CyC y CG fueron validados por la Dra. Huerta
en su disciplina. Ella **no** es otorrinolaringóloga general de este
alcance (oído / faringoamigdalina / SAHOS): el bosquejo y las
correcciones aplicadas aquí son **criterio clínico del equipo AnesFact
(Diego)** — auditoría con rigor de especialista de la disciplina,
pensado para uso por ORL real, **sin** reemplazar la revisión futura
de un/a especialista. Misma salvedad que Torácica / Urológica /
Ginecológica / Traumatología / Vascular / Plástica / Neurocirugía /
Cardiovascular / Mano.

## Solape con CyC (regla de organización del catálogo)

**Sin superposición real** con las 13 proformas CyC (`docs/proformas-cyc/`):
CyC cubre tiroides/cuello/laringe/nariz-senos/piel; este módulo cubre
**oído, amígdalas/adenoides/frenillo, SAHOS**. No se fusionan. CEBC
cierre nasal sigue en CyC P7; resección CEBC en Neuro M14.

## Correcciones aplicadas al bosquejo (11)

**§1 Otología:** (1) colesteatoma · (2) indicación · (3) nervio facial VII ·
(4) cadena osicular + osiculoplastia · (5) gusher/platina · (6) verificación
implante coclear.

**§2 Faringoamigdalina:** (7) indicación · (8) técnica amigdalectomía ·
(9) absceso vía + hallazgo.

**§3 SAHOS:** (10) gravedad IAH · (11) nivel obstrucción DISE.

Tipografía: **Lateralidad** (no «Laterallidad»).

**Nota de diseño:** «Implante coclear» y «BAHA / conducción ósea» van
como opciones **separadas** en `proc_otologia` — la telemetría
(corrección 6) solo aplica a implante coclear. Si preferís unificarlos
en una sola opción del bruto, decime antes del OK de semilla.

---

## Proforma — Otorrinolaringología general

```text
id:            corl-orl-general-v1
especialidad:  "Otorrinolaringología"
operaciones: [
  "Otología y cirugía del oído",
  "Cirugía faringoamigdalina y cavidad oral general",
  "Cirugía del sueño / SAHOS"
]
titulo: "Otorrinolaringología general"

slots:

  # ========== Índice ==========
  - id: procedimiento_grupo
    type: single
    required: true
    label: Procedimiento / foco
    options:
      - Otología / cirugía del oído
      - Faringoamigdalina / cavidad oral general
      - Ronquido / cirugía del sueño (SAHOS)

  - id: lateralidad
    type: single
    required: false
    required_if_procedimiento_grupo: [Otología / cirugía del oído]
    label: Lateralidad
    options: [Derecha, Izquierda, Bilateral]
    empty_text: ""

  - id: abordaje
    type: single
    required: false
    label: Abordaje (si aplica)
    options:
      - Abierto
      - Endoscópico
      - Convertido a abierto
    empty_text: ""

  - id: conversion_causa
    type: free
    required: false
    required_if_abordaje: [Convertido a abierto]
    label: Causa de conversión
    empty_text: ""

  # ========== 1. Otología / cirugía del oído ==========
  - id: indicacion_otologia
    type: multi
    required: false
    required_if_procedimiento_grupo: [Otología / cirugía del oído]
    label: Indicación / diagnóstico
    options:
      - Otitis media crónica
      - Colesteatoma
      - Otosclerosis
      - Hipoacusia neurosensorial (implante)
      - Trauma
      - Otro
    join: "; "
    empty_text: ""

  - id: indicacion_otologia_otro
    type: free
    required: false
    required_if_indicacion_otologia: [Otro]
    label: Indicación (otro)
    empty_text: ""

  - id: abordaje_otologico
    type: single
    required: false
    required_if_procedimiento_grupo: [Otología / cirugía del oído]
    label: Abordaje otológico
    options:
      - Endaural
      - Retroauricular
      - Transcanal
    empty_text: ""

  - id: proc_otologia
    type: multi
    required: false
    required_if_procedimiento_grupo: [Otología / cirugía del oído]
    label: Procedimiento
    options:
      - Miringotomía + tubos de ventilación (diábolos)
      - Timpanoplastia
      - Mastoidectomía
      - Estapedectomía / estapedotomía
      - Implante coclear
      - Dispositivo de conducción ósea (BAHA)
    join: "; "
    empty_text: ""

  - id: tipo_timpanoplastia
    type: single
    required: false
    required_if_proc_otologia: [Timpanoplastia]
    label: Tipo de timpanoplastia
    options:
      - Tipo I / miringoplastia
      - Tipo II
      - Tipo III
    empty_text: ""

  - id: material_injerto_timpanoplastia
    type: single
    required: false
    required_if_proc_otologia: [Timpanoplastia]
    label: Material del injerto (timpanoplastia)
    options:
      - Fascia temporal
      - Cartílago / pericondrio tragal
    empty_text: ""

  - id: colesteatoma
    type: single
    required: false
    required_if_proc_otologia: [Timpanoplastia, Mastoidectomía]
    label: Colesteatoma
    options:
      - Ausente
      - Presente — resección completa
      - Presente — resección incompleta (planificar second-look)
    empty_text: ""

  - id: tipo_mastoidectomia
    type: single
    required: false
    required_if_proc_otologia: [Mastoidectomía]
    label: Tipo de mastoidectomía
    options:
      - Canal Wall Up / conservadora
      - Canal Wall Down / radical
    empty_text: ""

  - id: nervio_facial_vii_otologia
    type: single
    required: false
    required_if_proc_otologia: [Mastoidectomía]
    required_if_tipo_timpanoplastia: [Tipo II, Tipo III]
    label: Nervio facial (VII)
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
    empty_text: ""

  - id: estado_cadena_osicular
    type: single
    required: false
    required_if_proc_otologia: [Timpanoplastia]
    label: Estado de la cadena osicular
    options:
      - Íntegra
      - Erosionada — requiere reconstrucción
    empty_text: ""

  - id: material_osiculoplastia
    type: single
    required: false
    required_if_estado_cadena_osicular: [Erosionada — requiere reconstrucción]
    label: Material de osiculoplastia
    options:
      - Prótesis parcial (PORP)
      - Prótesis total (TORP)
      - Otro
    empty_text: ""

  - id: material_osiculoplastia_otro
    type: free
    required: false
    required_if_material_osiculoplastia: [Otro]
    label: Osiculoplastia (otro)
    empty_text: ""

  - id: gusher_platina
    type: single
    required: false
    required_if_proc_otologia: [Estapedectomía / estapedotomía]
    label: Platina / gusher perilinfático
    options:
      - Platina móvil — sin incidentes
      - Platina fija — requirió fenestración
      - Gusher perilinfático identificado
    empty_text: ""

  - id: verificacion_implante_coclear
    type: single
    required: false
    required_if_proc_otologia: [Implante coclear]
    label: Verificación de implante coclear
    options:
      - Inserción completa del electrodo — telemetría normal
      - Inserción parcial
      - Telemetría alterada
    empty_text: ""

  # ========== 2. Faringoamigdalina / cavidad oral general ==========
  - id: indicacion_faringoamigdalina
    type: multi
    required: false
    required_if_procedimiento_grupo: [Faringoamigdalina / cavidad oral general]
    label: Indicación
    options:
      - Amigdalitis recurrente
      - Hipertrofia obstructiva
      - Sospecha oncológica
      - Otro
    join: "; "
    empty_text: ""

  - id: indicacion_faringoamigdalina_otro
    type: free
    required: false
    required_if_indicacion_faringoamigdalina: [Otro]
    label: Indicación (otro)
    empty_text: ""

  - id: proc_faringoamigdalina
    type: multi
    required: false
    required_if_procedimiento_grupo: [Faringoamigdalina / cavidad oral general]
    label: Procedimiento
    options:
      - Amigdalectomía parcial / total
      - Adenoidectomía
      - Frenectomía / frenuloplastia
      - Drenaje de absceso periamigdalino / parafaríngeo
    join: "; "
    empty_text: ""

  - id: tecnica_amigdalectomia
    type: single
    required: false
    required_if_proc_faringoamigdalina: [Amigdalectomía parcial / total]
    label: Técnica de amigdalectomía
    options:
      - Disección fría
      - Electrocauterio
      - Coblation (radiofrecuencia)
      - Otro
    empty_text: ""

  - id: tecnica_amigdalectomia_otro
    type: free
    required: false
    required_if_tecnica_amigdalectomia: [Otro]
    label: Técnica amigdalectomía (otro)
    empty_text: ""

  - id: tecnica_adenoidectomia
    type: single
    required: false
    required_if_proc_faringoamigdalina: [Adenoidectomía]
    label: Técnica de adenoidectomía
    options:
      - Legrado
      - Microdebridador
      - Radiofrecuencia / Coblation
    empty_text: ""

  - id: tipo_frenectomia
    type: single
    required: false
    required_if_proc_faringoamigdalina: [Frenectomía / frenuloplastia]
    label: Tipo de frenectomía / frenuloplastia
    options:
      - Lingual
      - Labial
    empty_text: ""

  - id: indicacion_frenectomia
    type: multi
    required: false
    required_if_proc_faringoamigdalina: [Frenectomía / frenuloplastia]
    label: Indicación de frenectomía / frenuloplastia
    options:
      - Anquiloglosia
      - Diastema
      - Recesión gingival
      - Otro
    join: "; "
    empty_text: ""

  - id: indicacion_frenectomia_otro
    type: free
    required: false
    required_if_indicacion_frenectomia: [Otro]
    label: Indicación frenectomía (otro)
    empty_text: ""

  - id: via_absceso_faringeo
    type: single
    required: false
    required_if_proc_faringoamigdalina: [Drenaje de absceso periamigdalino / parafaríngeo]
    label: Vía de abordaje del absceso
    options:
      - Intraoral
      - Cervical externa (parafaríngeo)
    empty_text: ""

  - id: hallazgo_absceso_faringeo
    type: single
    required: false
    required_if_proc_faringoamigdalina: [Drenaje de absceso periamigdalino / parafaríngeo]
    label: Hallazgo
    options:
      - Purulento confirmado
      - Celulitis sin colección
    empty_text: ""

  - id: hemostasia_faringoamigdalina
    type: multi
    required: false
    required_if_procedimiento_grupo: [Faringoamigdalina / cavidad oral general]
    label: Hemostasia
    options:
      - Bipolar
      - Sutura / ligadura
      - Agentes hemostáticos
    join: "; "
    empty_text: ""

  # ========== 3. Ronquido / cirugía del sueño (SAHOS) ==========
  - id: indicacion_sahos
    type: multi
    required: false
    required_if_procedimiento_grupo: [Ronquido / cirugía del sueño (SAHOS)]
    label: Indicación
    options:
      - Síndrome de apnea-hipopnea obstructiva del sueño (SAHOS)
      - Roncopatía primaria
    join: "; "
    empty_text: ""

  - id: gravedad_iah
    type: single
    required: false
    required_if_procedimiento_grupo: [Ronquido / cirugía del sueño (SAHOS)]
    label: Gravedad preoperatoria (IAH)
    options:
      - IAH leve (5–15)
      - IAH moderado (15–30)
      - IAH severo (>30)
    empty_text: ""

  - id: nivel_obstruccion_dise
    type: multi
    required: false
    required_if_procedimiento_grupo: [Ronquido / cirugía del sueño (SAHOS)]
    label: Nivel de obstrucción por DISE
    options:
      - Palatal
      - Base de lengua
      - Multinivel
      - No realizada endoscopia de sueño
    join: "; "
    empty_text: ""

  - id: proc_sahos
    type: multi
    required: false
    required_if_procedimiento_grupo: [Ronquido / cirugía del sueño (SAHOS)]
    label: Procedimiento
    options:
      - Uvulopalatofaringoplastia (UPFP) / técnica de Fujita
      - Expansión de esfínter faríngeo / faringoplastia lateral
      - Ablación por radiofrecuencia del paladar blando / base de lengua
      - Avance geniogloso / miotomía hioidea
    join: "; "
    empty_text: ""

plantilla_texto: |
  ORL general — {{procedimiento_grupo}}. Lateralidad {{lateralidad}}. Abordaje {{abordaje}}{{conversion_causa}}.
  Otología: {{indicacion_otologia}}{{indicacion_otologia_otro}}; vía {{abordaje_otologico}}; {{proc_otologia}}; timpanoplastia {{tipo_timpanoplastia}} injerto {{material_injerto_timpanoplastia}}; colesteatoma {{colesteatoma}}; mastoidectomía {{tipo_mastoidectomia}}; VII {{nervio_facial_vii_otologia}}; cadena {{estado_cadena_osicular}} {{material_osiculoplastia}}{{material_osiculoplastia_otro}}; platina/gusher {{gusher_platina}}; implante {{verificacion_implante_coclear}}.
  Faringe: {{indicacion_faringoamigdalina}}{{indicacion_faringoamigdalina_otro}}; {{proc_faringoamigdalina}}; amigd. {{tecnica_amigdalectomia}}{{tecnica_amigdalectomia_otro}}; adenoid. {{tecnica_adenoidectomia}}; frenillo {{tipo_frenectomia}} {{indicacion_frenectomia}}{{indicacion_frenectomia_otro}}; absceso vía {{via_absceso_faringeo}} hallazgo {{hallazgo_absceso_faringeo}}; hemostasia {{hemostasia_faringoamigdalina}}.
  SAHOS: {{indicacion_sahos}}; IAH {{gravedad_iah}}; DISE {{nivel_obstruccion_dise}}; {{proc_sahos}}.
```

---

## Notas (OK de semilla)

1. `procedimiento_grupo` **single**. Tipografía **Lateralidad**.
2. Validación: criterio AnesFact (Diego), **no** ORL especialista ni
   Dra. Huerta (ver cabecera) — salvedad se mantiene.
3. §1: colesteatoma (hallazgo clave); VII en mastoidectomía y
   timpanoplastia II/III; cadena + PORP/TORP; gusher; telemetría coclear.
4. Implante coclear ≠ BAHA (opciones separadas; telemetría solo coclear).
5. §2: indicación faringoamigdalina; técnica amigdalectomía; absceso vía +
   hallazgo; adenoidectomía / frenillo; `indicacion_frenectomia` aparte
   (anquiloglosia / diastema / recesión gingival).
6. §3: IAH en bandas (single; no free numérico); DISE multi incl.
   «No realizada».
7. Sin solape real con CyC (oído / amígdalas / SAHOS). CEBC sigue en
   CyC P7 + Neuro M14.
8. Numéricos sin `empty_text` inventado. Convertido + causa.
9. Bruto (3 secciones) + 11 correcciones + indicación frenectomía
   post-Tanda 2.
