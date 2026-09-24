# Módulo 1 — Pared Abdominal

**id:** `cg-pared-abdominal-v1` · especialidad: Cirugía General ·  
**Estado:** esqueleto de slots — **OK de semilla** (2026-09-14). Motor P2
pendiente. SCOPA/eTEP en diástasis: ambas disponibles.

Índice: [README.md](README.md) · Hallazgos: [HALLAZGOS_ESQUELETO.md](HALLAZGOS_ESQUELETO.md)

Consentimiento / gasas / ATB = cáscara A4 de Foja Qx (no van acá).

Confirmado 1ª pasada: `procedimiento_grupo` single; diástasis asociada =
flag; drenaje también en ventral electiva.

---

## Proforma — Pared abdominal

```text
id:            cg-pared-abdominal-v1
especialidad:  "Cirugía General"
operaciones: [
  "Hernioplastia inguinal",
  "Hernioplastia femoral / crural",
  "Eventroplastia / hernioplastia ventral",
  "Reparación de diástasis de rectos",
  "Reconstrucción de pared abdominal / hernias complejas",
  "Eventración estrangulada / urgencia de pared"
]
titulo: "Cirugía de pared abdominal"

slots:

  # ========== Índice ==========
  - id: procedimiento_grupo
    type: single
    required: true
    label: Procedimiento / foco
    options:
      - Hernioplastia inguinal / femoral
      - Eventroplastia / hernia ventral
      - Diástasis de rectos / línea alba
      - Hernias complejas / reconstrucción
      - Urgencia de pared / eventración estrangulada

  - id: abordaje
    type: single
    required: true
    label: Abordaje
    options:
      - Abierto
      - Laparoscópico / endoscópico
      - Robótico
      - Convertido a abierto

  - id: conversion_causa
    type: free
    required: false
    required_if_abordaje: [Convertido a abierto]
    label: Causa de conversión
    empty_text: ""

  # ========== 1. Inguinal / femoral ==========
  - id: lateralidad
    type: single
    required: false
    required_if_procedimiento_grupo: [Hernioplastia inguinal / femoral]
    label: Lateralidad
    options: [Derecha, Izquierda, Bilateral]
    empty_text: ""

  - id: tipo_hernia_inguinal
    type: multi
    required: false
    required_if_procedimiento_grupo: [Hernioplastia inguinal / femoral]
    label: Tipo de hernia
    options:
      - Inguinal directa
      - Inguinal indirecta
      - Mixta (pantalón)
      - Femoral / crural
      - Encarcelada / estrangulada
    join: ", "
    empty_text: ""

  - id: tecnica_lap_inguinal
    type: single
    required: false
    required_if_procedimiento_grupo: [Hernioplastia inguinal / femoral]
    required_if_abordaje: [Laparoscópico / endoscópico, Robótico]
    label: Técnica laparoscópica / endoscópica
    options: [TAPP, TEP, eTEP]
    empty_text: ""

  - id: enfoque_reparacion
    type: single
    required: false
    required_if_procedimiento_grupo: [Hernioplastia inguinal / femoral]
    label: Enfoque de reparación
    options:
      - Con malla
      - Tisular (sin malla)
    empty_text: ""

  # Lichtenstein / Plug&Patch / Gilbert = solo vía abierta (o conversión)
  - id: tecnica_con_malla
    type: single
    required: false
    required_if_enfoque_reparacion: [Con malla]
    required_if_abordaje: [Abierto, Convertido a abierto]
    label: Técnica con malla (abierta)
    options:
      - Lichtenstein
      - Plug & Patch
      - Gilbert
      - Otra
    empty_text: ""

  - id: tecnica_con_malla_otra
    type: free
    required: false
    required_if_tecnica_con_malla: [Otra]
    label: Técnica con malla (otra)
    empty_text: ""

  - id: tecnica_tisular
    type: single
    required: false
    required_if_enfoque_reparacion: [Tisular (sin malla)]
    label: Técnica tisular
    options: [Bassini, Shouldice, McVay]
    empty_text: ""

  - id: tratamiento_saco
    type: single
    required: false
    required_if_procedimiento_grupo: [Hernioplastia inguinal / femoral]
    label: Tratamiento del saco
    options:
      - Reintroducción indemne
      - Resección y ligadura proximal
      - Apertura y exploración del contenido
    empty_text: ""

  - id: contenido_saco
    type: multi
    required: false
    required_if_procedimiento_grupo: [Hernioplastia inguinal / femoral]
    label: Contenido del saco
    options:
      - Asa delgada
      - Epíplon
      - Colon
      - Sin contenido vital comprometido
      - Sufrimiento vascular
    join: ", "
    empty_text: ""

  - id: sufrimiento_detalle
    type: free
    required: false
    required_if_contenido_saco: [Sufrimiento vascular]
    label: Sufrimiento vascular (detalle)
    empty_text: ""

  - id: malla_tipo_inguinal
    type: single
    required: false
    required_if_enfoque_reparacion: [Con malla]
    label: Tipo de malla
    options:
      - Polipropileno alta densidad
      - Polipropileno baja densidad / liviana
      - 3D / preformada
      - Biológica
    empty_text: ""

  - id: malla_medidas_inguinal
    type: free
    required: false
    required_if_enfoque_reparacion: [Con malla]
    label: Medidas de la malla (cm × cm)
    empty_text: ""

  - id: fijacion_metodo
    type: multi
    required: false
    required_if_enfoque_reparacion: [Con malla]
    label: Método de fijación
    options:
      - Sutura monofilamento
      - Tacas / tackers
      - Sellante de fibrina / pegamento
      - Sin fijación adicional
    join: ", "
    empty_text: ""

  - id: fijacion_sutura_material
    type: single
    required: false
    required_if_fijacion_metodo: [Sutura monofilamento]
    label: Sutura (material)
    options: [Absorbible, No absorbible]
    empty_text: ""

  - id: fijacion_tacas_material
    type: single
    required: false
    required_if_fijacion_metodo: [Tacas / tackers]
    label: Tacas / tackers (material)
    options: [Absorbibles, Metálicos]
    empty_text: ""

  # --- Regla 1: estructuras críticas (inguinal / femoral) ---
  - id: nervio_ilioinguinal
    type: single
    required: false
    required_if_procedimiento_grupo: [Hernioplastia inguinal / femoral]
    label: Nervio ilioinguinal
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
    empty_text: ""

  - id: nervio_iliohipogastrico
    type: single
    required: false
    required_if_procedimiento_grupo: [Hernioplastia inguinal / femoral]
    label: Nervio iliohipogástrico
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
    empty_text: ""

  - id: nervio_genitofemoral
    type: single
    required: false
    required_if_procedimiento_grupo: [Hernioplastia inguinal / femoral]
    label: Nervio genitofemoral
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
    empty_text: ""

  - id: deferente_o_ligamento
    type: single
    required: false
    required_if_procedimiento_grupo: [Hernioplastia inguinal / femoral]
    label: Conducto deferente / ligamento redondo
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
      - No aplica
    empty_text: ""

  - id: vasos_testiculares_cordon
    type: single
    required: false
    required_if_procedimiento_grupo: [Hernioplastia inguinal / femoral]
    label: Vasos testiculares / cordón espermático
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
      - No aplica
    empty_text: ""

  - id: estructura_lesion_detalle
    type: free
    required: false
    label: Detalle de lesión de estructura crítica (si aplica)
    empty_text: ""

  # ========== 2. Ventral / eventro ==========
  - id: topografia_ventral
    type: multi
    required: false
    required_if_procedimiento_grupo: [Eventroplastia / hernia ventral]
    label: Topografía
    options:
      - Umbilical
      - Epigástrica
      - Incisional / eventración — línea media
      - Incisional / eventración — subcostal
      - Incisional / eventración — laparotomía anterior
      - Lumbar / otras
    join: ", "
    empty_text: ""

  - id: defecto_ancho_cm
    type: free
    required: false
    required_if_procedimiento_grupo: [Eventroplastia / hernia ventral]
    label: Defecto — ancho (cm)
    empty_text: ""

  - id: defecto_largo_cm
    type: free
    required: false
    required_if_procedimiento_grupo: [Eventroplastia / hernia ventral]
    label: Defecto — largo (cm)
    empty_text: ""

  - id: tecnica_ventral_especifica
    type: single
    required: false
    required_if_procedimiento_grupo: [Eventroplastia / hernia ventral]
    required_if_abordaje: [Laparoscópico / endoscópico, Robótico]
    label: Técnica mínimamente invasiva (ventral)
    options: [IPOM, IPOM-Plus, eTEP, MILOS, Otra]
    empty_text: ""

  - id: separacion_componentes
    type: single
    required: false
    required_if_procedimiento_grupo: [Eventroplastia / hernia ventral, Hernias complejas / reconstrucción]
    label: Separación de componentes
    options:
      - No requerida
      - Anterior (Ramirez)
      - Posterior (TAR)
    empty_text: ""

  - id: plano_malla
    type: single
    required: false
    required_if_procedimiento_grupo: [Eventroplastia / hernia ventral]
    label: Plano de colocación de la malla
    options:
      - Onlay (supraaponeurótica)
      - Inlay (bridging)
      - Sublay / retromuscular (Rives-Stoppa)
      - Preperitoneal
      - Intraabdominal / IPOM
      - No se colocó malla
    empty_text: ""

  - id: malla_tipo_ventral
    type: single
    required: false
    required_if_plano_malla:
      - Onlay (supraaponeurótica)
      - Inlay (bridging)
      - Sublay / retromuscular (Rives-Stoppa)
      - Preperitoneal
      - Intraabdominal / IPOM
    label: Tipo de malla (ventral)
    options:
      - Polipropileno
      - Dual / barrera antiadherente
      - Biológica / sintética absorbible
    empty_text: ""

  - id: malla_medidas_ventral
    type: free
    required: false
    required_if_plano_malla:
      - Onlay (supraaponeurótica)
      - Inlay (bridging)
      - Sublay / retromuscular (Rives-Stoppa)
      - Preperitoneal
      - Intraabdominal / IPOM
    label: Medidas de la malla (cm × cm)
    empty_text: ""

  - id: malla_overlap_cm
    type: free
    required: false
    required_if_plano_malla:
      - Onlay (supraaponeurótica)
      - Inlay (bridging)
      - Sublay / retromuscular (Rives-Stoppa)
      - Preperitoneal
      - Intraabdominal / IPOM
    label: Overlap / traslape mínimo (cm)
    empty_text: ""

  - id: fijacion_ventral
    type: multi
    required: false
    required_if_plano_malla:
      - Onlay (supraaponeurótica)
      - Inlay (bridging)
      - Sublay / retromuscular (Rives-Stoppa)
      - Preperitoneal
      - Intraabdominal / IPOM
    label: Fijación (ventral)
    options:
      - Puntos transfasciales
      - Tacas absorbibles
      - Tacas helicoidales / metálicas
      - Sutura continua monofilamento
    join: ", "
    empty_text: ""

  - id: reduccion_adhesiolisis
    type: single
    required: false
    required_if_procedimiento_grupo: [Eventroplastia / hernia ventral]
    label: Reducción del contenido y adhesiólisis
    options: [Sí, No]
    empty_text: ""

  - id: reseccion_saco_dermolipectomia
    type: single
    required: false
    required_if_procedimiento_grupo: [Eventroplastia / hernia ventral]
    label: Resección de saco / dermolipectomía de complemento
    options: [Sí, No]
    empty_text: ""

  - id: diastasis_asociada
    type: single
    required: false
    required_if_procedimiento_grupo: [Eventroplastia / hernia ventral]
    label: Diástasis de rectos asociada
    options: [Sí, No]
    empty_text: ""

  # ========== 3. Diástasis (propia o asociada a ventral) ==========
  - id: diastasis_estado
    type: single
    required: false
    required_if_procedimiento_grupo: [Diástasis de rectos / línea alba]
    # También visible si diastasis_asociada = Sí (motor: required_if_any)
    label: Diástasis
    options: [Presente, Ausente]
    empty_text: ""

  - id: diastasis_cm
    type: free
    required: false
    required_if_diastasis_estado: [Presente]
    label: Distancia interrectos (cm)
    empty_text: ""

  - id: diastasis_abordaje
    type: single
    required: false
    required_if_diastasis_estado: [Presente]
    label: Abordaje de la diástasis
    options:
      - Abierto
      - REPA endoscópico
      - SCOPA
      - eTEP
    empty_text: ""

  - id: diastasis_plicatura
    type: single
    required: false
    required_if_diastasis_estado: [Presente]
    label: Técnica de plicatura
    options:
      - Plicatura de aponeurosis anterior
      - Plicatura de aponeurosis posterior
      - Plicatura anterior y posterior
    empty_text: ""

  - id: diastasis_malla_refuerzo
    type: single
    required: false
    required_if_diastasis_estado: [Presente]
    label: Malla de refuerzo asociada
    options: [Sí, No]
    empty_text: ""

  - id: diastasis_malla_plano
    type: single
    required: false
    required_if_diastasis_malla_refuerzo: [Sí]
    label: Plano de malla (refuerzo diástasis)
    options: [Onlay, Sublay / retromuscular]
    empty_text: ""

  # ========== 4. Complejas / reconstrucción ==========
  - id: campo_complejas
    type: single
    required: false
    required_if_procedimiento_grupo: [Hernias complejas / reconstrucción]
    label: Clasificación del campo
    options: [Limpio, Limpio-contaminado, Contaminado]
    empty_text: ""

  - id: tecnica_reconstruccion
    type: multi
    required: false
    required_if_procedimiento_grupo: [Hernias complejas / reconstrucción]
    label: Técnica de reconstrucción
    options:
      - Cierre progresivo / neoperitoneo neumático (Goni Moreno)
      - Toxina botulínica A preoperatoria
      - Colgajos musculoaponeuróticos
    join: "; "
    empty_text: ""

  - id: botox_preop
    type: single
    required: false
    required_if_tecnica_reconstruccion: [Toxina botulínica A preoperatoria]
    label: Toxina botulínica A preoperatoria
    options: [Sí, No]
    empty_text: ""

  - id: drenaje
    type: single
    required: false
    required_if_procedimiento_grupo:
      - Hernias complejas / reconstrucción
      - Eventroplastia / hernia ventral
      - Urgencia de pared / eventración estrangulada
    label: Drenaje
    options: [Sí, Sin drenaje]
    empty_text: ""

  - id: drenaje_tipo
    type: single
    required: false
    required_if_drenaje: [Sí]
    label: Tipo de drenaje
    options: [Aspirativo / Jackson-Pratt, Redon, Otro]
    empty_text: ""

  - id: drenaje_cantidad
    type: free
    required: false
    required_if_drenaje: [Sí]
    label: Cantidad de drenajes
    empty_text: ""

  - id: drenaje_ubicacion
    type: multi
    required: false
    required_if_drenaje: [Sí]
    label: Ubicación del drenaje
    options: [Subcutáneo, Retromuscular, Cavidad]
    join: ", "
    empty_text: ""

  # ========== 5. Urgencia ==========
  - id: campo_urgencia
    type: single
    required: false
    required_if_procedimiento_grupo: [Urgencia de pared / eventración estrangulada]
    label: Clasificación del campo (urgencia)
    options: [Limpio, Limpio-contaminado, Contaminado]
    empty_text: ""

  - id: contenido_urgencia
    type: single
    required: false
    required_if_procedimiento_grupo: [Urgencia de pared / eventración estrangulada]
    label: Hallazgo del contenido
    options:
      - Viable tras restitución / reducción
      - Necrosis intestinal / omental
    empty_text: ""

  - id: procedimiento_asociado_urgencia
    type: multi
    required: false
    required_if_procedimiento_grupo: [Urgencia de pared / eventración estrangulada]
    label: Procedimiento asociado
    options:
      - Resección intestinal (± anastomosis) — completar en M2 Gastrointestinal (cg-gastrointestinal-v1)
      - Omentectomía parcial
      - Ninguno adicional
    join: "; "
    empty_text: ""

  - id: handoff_gi
    type: single
    required: false
    required_if_procedimiento_asociado_urgencia:
      - Resección intestinal (± anastomosis) — completar en M2 Gastrointestinal (cg-gastrointestinal-v1)
    label: Handoff
    options:
      - Sí — completar en M2 Gastrointestinal (cg-gastrointestinal-v1)
    empty_text: ""

  - id: malla_contaminado
    type: single
    required: false
    required_if_procedimiento_grupo: [Urgencia de pared / eventración estrangulada]
    label: Malla en contexto contaminado
    options:
      - Biológica
      - Sintética absorbible
      - Sintética no absorbible
      - No se colocó malla (cierre tisular primario)
      - No se colocó malla (abdomen abierto)
    empty_text: ""

plantilla_texto: |
  Pared abdominal — {{procedimiento_grupo}}. Abordaje: {{abordaje}}{{conversion_causa}}.
  {{lateralidad}} {{tipo_hernia_inguinal}}. {{enfoque_reparacion}} {{tecnica_con_malla}}{{tecnica_tisular}} {{tecnica_lap_inguinal}}.
  Saco: {{tratamiento_saco}}; contenido: {{contenido_saco}}{{sufrimiento_detalle}}.
  Estructuras: ilioinguinal {{nervio_ilioinguinal}}; iliohipogástrico {{nervio_iliohipogastrico}}; genitofemoral {{nervio_genitofemoral}}; deferente/lig. redondo {{deferente_o_ligamento}}; vasos testiculares/cordón {{vasos_testiculares_cordon}}{{estructura_lesion_detalle}}.
  Malla inguinal: {{malla_tipo_inguinal}} {{malla_medidas_inguinal}}; fijación {{fijacion_metodo}} {{fijacion_sutura_material}} {{fijacion_tacas_material}}.
  Ventral: {{topografia_ventral}}; defecto {{defecto_ancho_cm}} × {{defecto_largo_cm}} cm; {{tecnica_ventral_especifica}}; componentes {{separacion_componentes}}; plano {{plano_malla}}; malla {{malla_tipo_ventral}} {{malla_medidas_ventral}} overlap {{malla_overlap_cm}}; fijación {{fijacion_ventral}}.
  Reducción/adhesiólisis {{reduccion_adhesiolisis}}; saco/dermolipectomía {{reseccion_saco_dermolipectomia}}.
  Diástasis: {{diastasis_estado}} {{diastasis_cm}} cm; abordaje {{diastasis_abordaje}}; plicatura {{diastasis_plicatura}}; refuerzo malla {{diastasis_malla_refuerzo}} {{diastasis_malla_plano}}.
  Complejas: campo {{campo_complejas}}; {{tecnica_reconstruccion}} {{botox_preop}}.
  Urgencia: campo {{campo_urgencia}}; contenido {{contenido_urgencia}}; {{procedimiento_asociado_urgencia}}; handoff {{handoff_gi}}; malla {{malla_contaminado}}.
  Drenaje: {{drenaje}} {{drenaje_tipo}} n={{drenaje_cantidad}} {{drenaje_ubicacion}}.
```

---

## Notas (pasada final)

1. `procedimiento_grupo` **single** — confirmado.
2. Diástasis asociada a ventral = flag `diastasis_asociada` — confirmado
   (`required_if_any` en motor cuando `diastasis_asociada=Sí`).
3. Regla 1 inguinal: nervios ×3 + `deferente_o_ligamento` +
   `vasos_testiculares_cordon` (perfiles de complicación distintos).
4. `tecnica_con_malla` solo si `enfoque=Con malla` **y**
   `abordaje` ∈ {Abierto, Convertido a abierto}. Lap/robótico usa
   `tecnica_lap_inguinal` (TAPP/TEP/eTEP), no Lichtenstein.
5. Drenaje también en ventral electiva — confirmado.
6. `diastasis_abordaje`: Abierto / REPA / SCOPA / eTEP — **mantener las
   cuatro**; el cirujano elige (no recortar sin práctica confirmada).
7. Numéricos sin `empty_text` inventado. Cáscara A4 fuera de esta proforma.
8. Campo L/LC/C: `Contaminado` (paridad con M2–M6).
9. Handoff: `Sí — completar en Mn Nombre (id)` (formato set CG).
