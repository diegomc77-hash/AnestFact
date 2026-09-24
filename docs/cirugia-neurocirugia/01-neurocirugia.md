# Módulo — Neurocirugía

**id:** `cneuro-neurocirugia-v1` · especialidad: Neurocirugía ·  
**Estado:** **OK de semilla** (2026-09-14). Sin motor P2.

Índice: [README.md](README.md)

Consentimiento / gasas / ATB = cáscara A4 de Foja Qx (no van acá).

## Validación clínica (leer antes de auditar)

**Este módulo no tiene el mismo nivel de validación directa que Cabeza y
Cuello ni Cirugía General.** CyC y CG fueron validados por la Dra. Huerta
en su disciplina. Ella **no** es neurocirujana: el bosquejo y las
correcciones aplicadas aquí son **criterio clínico del equipo AnesFact
(Diego)** — auditoría con rigor de especialista de la disciplina
(especialidad de alto riesgo), pensado para uso por neurocirujano/a real,
**sin** reemplazar la revisión futura de un/a especialista. Misma
salvedad que Torácica / Urológica / Ginecológica / Traumatología /
Vascular / Plástica.

## Correcciones aplicadas al bosquejo (18)

**§1 Tumoral/infecciosa:** (1) indicación · (2) pares / carótida-quiasma
por ubicación · (3) duramadre en craneotomía.

**§2 Vascular:** (4) Hunt-Hess · (5) Fisher · (6) vasos clipado ·
(7) ruptura IO · (8) resultado angiográfico.

**§3 Neurotrauma:** (9) Glasgow · (10) volumen hematoma · (11) midline
shift.

**§4 Hidrocefalia/funcional:** (12) indicación hidrocefalia · (13) testing
DBS.

**§5 Raquimedular:** (14) indicación · (15) neuromonitoreo (required si
intramedular) · (16) niveles multi · raíz nerviosa (intradural/
extramedular).

**§6 Drenajes/cierre:** (17) drenaje tipo + cantidad separados.

**Transversal:** (18) posición quirúrgica (required en fosa posterior).

Gatillos hacia `foja.consideraciones` (awake, DBS, sentado/VAE, clipado,
HTE) → roadmap P2; **no** son slots de esta proforma.

Tipografía: **Lateralidad** (no «Laterallidad»).

**Nota:** «Osteoflácida» (craneotomía) = término del bosquejo original;
sin confirmar vs «osteoclástica». No reinterpretar hasta especialista.

---

## Proforma — Neurocirugía

```text
id:            cneuro-neurocirugia-v1
especialidad:  "Neurocirugía"
operaciones: [
  "Patología tumoral e infecciosa craneal",
  "Neurocirugía vascular craneal",
  "Neurotraumatología / neurointensivismo",
  "Hidrocefalia y neurocirugía funcional",
  "Cirugía raquimedular",
  "Drenajes, materiales y cierre neuroquirúrgico"
]
titulo: "Neurocirugía"

slots:

  # ========== Índice ==========
  - id: procedimiento_grupo
    type: single
    required: true
    label: Procedimiento / foco
    options:
      - Tumoral / infecciosa craneal
      - Vascular craneal
      - Neurotraumatología / neurointensivismo
      - Hidrocefalia / funcional / pediátrica
      - Raquimedular
      - Drenajes / materiales / cierre

  - id: posicion_quirurgica
    type: single
    required: false
    required_if_ubicacion_craneal: [Infratentorial / fosa posterior]
    required_if_ubicacion_circulacion: [Circulación posterior]
    required_if_procedimiento_grupo: [Hidrocefalia / funcional / pediátrica]
    label: Posición quirúrgica
    options:
      - Decúbito supino
      - Decúbito prono
      - Sentado
      - Decúbito lateral (park bench)
    empty_text: ""

  - id: abordaje
    type: single
    required: false
    label: Abordaje (si aplica)
    options:
      - Abierto
      - Endoscópico / endonasal
      - Endovascular
      - Estereotáxico / neuronavegación
      - Convertido a abierto
    empty_text: ""

  - id: conversion_causa
    type: free
    required: false
    required_if_abordaje: [Convertido a abierto]
    label: Causa de conversión
    empty_text: ""

  # ========== 1. Tumoral / infecciosa craneal ==========
  - id: indicacion_craneal_tumoral
    type: multi
    required: false
    required_if_procedimiento_grupo: [Tumoral / infecciosa craneal]
    label: Indicación / diagnóstico
    options:
      - Tumoral primario
      - Metastásico
      - Infeccioso (absceso / empiema)
      - Otro
    join: "; "
    empty_text: ""

  - id: indicacion_craneal_tumoral_otro
    type: free
    required: false
    required_if_indicacion_craneal_tumoral: [Otro]
    label: Indicación (otro)
    empty_text: ""

  - id: ubicacion_craneal
    type: multi
    required: false
    required_if_procedimiento_grupo: [Tumoral / infecciosa craneal]
    label: Ubicación de la lesión
    options:
      - Supratentorial
      - Infratentorial / fosa posterior
      - Base de cráneo / silla turca
    join: ", "
    empty_text: ""

  - id: ubicacion_supratentorial
    type: multi
    required: false
    required_if_ubicacion_craneal: [Supratentorial]
    label: Ubicación — supratentorial
    options:
      - Frontal
      - Parietal
      - Temporal
      - Occipital
      - Intraventricular
    join: ", "
    empty_text: ""

  - id: ubicacion_fosa_posterior
    type: multi
    required: false
    required_if_ubicacion_craneal: [Infratentorial / fosa posterior]
    label: Ubicación — fosa posterior
    options:
      - Cerebelo
      - Ángulo pontocerebeloso
      - Tronco encefálico
    join: ", "
    empty_text: ""

  - id: abordaje_craneal
    type: multi
    required: false
    required_if_procedimiento_grupo: [Tumoral / infecciosa craneal]
    label: Abordaje quirúrgico
    options:
      - Craneotomía / cranectomía
      - Abordaje endoscópico endonasal transesfenoidal (EET)
      - Biopsia estereotáxica / guiada por neuronavegación
    join: "; "
    empty_text: ""

  - id: tipo_craneotomia
    type: single
    required: false
    required_if_abordaje_craneal: [Craneotomía / cranectomía]
    label: Tipo de craneotomía / cranectomía
    options:
      - Osteoplásica
      - Osteoflácida
    empty_text: ""

  - id: lesion_cebc
    type: single
    required: false
    required_if_abordaje_craneal: [Abordaje endoscópico endonasal transesfenoidal (EET)]
    label: Lesión / indicación (CEBC / EET)
    options:
      - Adenoma hipofisario
      - Craneofaringioma
      - Cordoma
      - Meningioma
      - Fístula de LCR aislada
    empty_text: ""

  - id: corredor_cebc
    type: single
    required: false
    required_if_abordaje_craneal: [Abordaje endoscópico endonasal transesfenoidal (EET)]
    label: Corredor de abordaje (CEBC / EET)
    options:
      - Transesfenoidal — sellar
      - Transesfenoidal — presellar
      - Transesfenoidal — parasellar
      - Transesfenoidal — clival
      - Transcribiforme
      - Transpterigoideo
    empty_text: ""

  - id: cebc_cierre_xref_nota
    type: single
    required: false
    required_if_abordaje_craneal: [Abordaje endoscópico endonasal transesfenoidal (EET)]
    label: Cierre / reconstrucción de base de cráneo (referencia)
    options:
      - Definición en CyC Proforma 7 Nariz/Senos (cyc-nariz-senos-v1) — foja ORL aparte si equipo; no completar cierre nasal acá
    empty_text: ""

  - id: reseccion_tumoral
    type: single
    required: false
    required_if_procedimiento_grupo: [Tumoral / infecciosa craneal]
    label: Resección
    options:
      - Total (GTR)
      - Subtotal (STR)
      - Biopsia
    empty_text: ""

  - id: neuromonitoreo_craneal
    type: multi
    required: false
    required_if_procedimiento_grupo: [Tumoral / infecciosa craneal]
    label: Monitoreo neurofisiológico intraoperatorio
    options:
      - Potenciales evocados
      - Mapeo cortical motor / despierto (awake craniotomy)
    join: ", "
    empty_text: ""

  - id: fluorescencia
    type: multi
    required: false
    required_if_procedimiento_grupo: [Tumoral / infecciosa craneal]
    label: Marcadores / fluorescencia
    options:
      - 5-ALA
      - Fluoresceína sódica
    join: ", "
    empty_text: ""

  - id: duramadre_craneotomia
    type: single
    required: false
    required_if_abordaje_craneal: [Craneotomía / cranectomía]
    label: Integridad / apertura dural
    options:
      - Íntegra
      - Durotomía incidental — reparada
      - Durotomía incidental — fuga persistente
    empty_text: ""

  - id: nervio_trigemino_v
    type: single
    required: false
    required_if_ubicacion_craneal: [Infratentorial / fosa posterior]
    label: Nervio trigémino (V)
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
    empty_text: ""

  - id: nervio_facial_vii
    type: single
    required: false
    required_if_ubicacion_craneal: [Infratentorial / fosa posterior]
    label: Nervio facial (VII)
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
    empty_text: ""

  - id: nervio_vestibulococlear_viii
    type: single
    required: false
    required_if_ubicacion_craneal: [Infratentorial / fosa posterior]
    label: Nervio vestibulococlear (VIII)
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
    empty_text: ""

  - id: carotida_interna
    type: single
    required: false
    required_if_ubicacion_craneal: [Base de cráneo / silla turca]
    label: Carótida interna
    options:
      - Identificada y preservada
      - Lesión identificada intraoperatoriamente
      - No disecada
    empty_text: ""

  - id: quiasma_optico
    type: single
    required: false
    required_if_ubicacion_craneal: [Base de cráneo / silla turca]
    label: Quiasma óptico
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
    empty_text: ""

  # ========== 2. Vascular craneal ==========
  - id: patologia_vascular_craneal
    type: multi
    required: false
    required_if_procedimiento_grupo: [Vascular craneal]
    label: Patología
    options:
      - Aneurisma cerebral
      - Malformación arteriovenosa (MAV)
      - Cavernoma
      - Hematoma intraparenquimatoso
    join: "; "
    empty_text: ""

  - id: ubicacion_circulacion
    type: single
    required: false
    required_if_patologia_vascular_craneal:
      - Aneurisma cerebral
      - Malformación arteriovenosa (MAV)
    label: Ubicación — circulación
    options:
      - Circulación anterior
      - Circulación posterior
    empty_text: ""

  - id: volumen_hematoma_vascular_cc
    type: free
    required: false
    required_if_patologia_vascular_craneal: [Hematoma intraparenquimatoso]
    label: Volumen del hematoma intraparenquimatoso (cc)
    empty_text: ""

  - id: hsa
    type: single
    required: false
    required_if_patologia_vascular_craneal: [Aneurisma cerebral]
    label: Hemorragia subaracnoidea (HSA)
    options: [Sí, No]
    empty_text: ""

  - id: hunt_hess
    type: single
    required: false
    required_if_hsa: [Sí]
    label: Escala de Hunt-Hess
    options: [I, II, III, IV, V]
    empty_text: ""

  - id: fisher
    type: single
    required: false
    required_if_hsa: [Sí]
    label: Escala de Fisher
    options: [I, II, III, IV]
    empty_text: ""

  - id: tecnica_vascular_craneal
    type: multi
    required: false
    required_if_procedimiento_grupo: [Vascular craneal]
    label: Abordaje / técnica
    options:
      - Clipado de aneurisma
      - Exéresis / resección de MAV o cavernoma
      - Evacuación quirúrgica de hematoma
      - Embolización endovascular (coils / stent diversor / Onyx)
    join: "; "
    empty_text: ""

  - id: vasos_clipado
    type: multi
    required: false
    required_if_tecnica_vascular_craneal: [Clipado de aneurisma]
    label: Vasos involucrados (clipado)
    options:
      - ACA
      - ACM
      - ACI
      - Comunicante posterior
      - Basilar
      - Otro
    join: ", "
    empty_text: ""

  - id: vasos_clipado_otro
    type: free
    required: false
    required_if_vasos_clipado: [Otro]
    label: Vasos involucrados (otro)
    empty_text: ""

  - id: ruptura_aneurisma_io
    type: single
    required: false
    required_if_tecnica_vascular_craneal: [Clipado de aneurisma]
    label: Ruptura intraoperatoria del aneurisma
    options:
      - Sin ruptura
      - Ruptura controlada
      - Ruptura con conversión de estrategia
    empty_text: ""

  - id: resultado_angiografico_clipado
    type: single
    required: false
    required_if_tecnica_vascular_craneal: [Clipado de aneurisma]
    label: Resultado angiográfico final del clipado
    options:
      - Oclusión completa
      - Remanente residual
      - No evaluado
    empty_text: ""

  - id: estudio_vascular_io
    type: multi
    required: false
    required_if_procedimiento_grupo: [Vascular craneal]
    label: Estudio vascular intraoperatorio
    options:
      - Videoangiografía con indocianina (ICG)
      - Doppler microvascular
    join: ", "
    empty_text: ""

  # ========== 3. Neurotraumatología ==========
  - id: indicacion_neurotrauma
    type: multi
    required: false
    required_if_procedimiento_grupo: [Neurotraumatología / neurointensivismo]
    label: Indicación
    options:
      - Hematoma epidural (HED)
      - Hematoma subdural agudo (HSDA)
      - Hematoma subdural crónico (HSDC)
      - Fractura de cráneo con hundimiento
      - Hipertensión endocraneana refractaria
    join: "; "
    empty_text: ""

  - id: glasgow_preop
    type: free
    required: false
    required_if_procedimiento_grupo: [Neurotraumatología / neurointensivismo]
    label: Escala de Glasgow preoperatorio (3–15)
    empty_text: ""

  - id: volumen_hematoma_cc
    type: free
    required: false
    required_if_indicacion_neurotrauma:
      - Hematoma epidural (HED)
      - Hematoma subdural agudo (HSDA)
      - Hematoma subdural crónico (HSDC)
    label: Volumen del hematoma evacuado (cc)
    empty_text: ""

  - id: midline_shift_mm
    type: free
    required: false
    required_if_procedimiento_grupo: [Neurotraumatología / neurointensivismo]
    label: Desplazamiento de línea media / midline shift (mm)
    empty_text: ""

  - id: proc_neurotrauma
    type: multi
    required: false
    required_if_procedimiento_grupo: [Neurotraumatología / neurointensivismo]
    label: Procedimiento específico
    options:
      - Cranectomía descompresiva
      - Evacuación de hematoma + hemostasia de duramadre / lecho
      - Drenaje de HSDC (trepanación + lavado + drenaje subdural)
      - Craneoplastia / reconstrucción ósea
      - Colocación de monitoreo de PIC
    join: "; "
    empty_text: ""

  - id: tipo_descompresiva
    type: single
    required: false
    required_if_proc_neurotrauma: [Cranectomía descompresiva]
    label: Tipo de cranectomía descompresiva
    options:
      - Unilateral / frontoparietotemporal
      - Bifrontal
    empty_text: ""

  - id: material_craneoplastia
    type: multi
    required: false
    required_if_proc_neurotrauma: [Craneoplastia / reconstrucción ósea]
    label: Material de craneoplastia
    options:
      - Hueso autólogo
      - PEEK
      - Malla de titanio
      - Metilmetacrilato
    join: ", "
    empty_text: ""

  - id: tipo_monitoreo_pic
    type: multi
    required: false
    required_if_proc_neurotrauma: [Colocación de monitoreo de PIC]
    label: Monitoreo de PIC
    options:
      - Sensor intraparenquimatoso
      - Drenaje ventricular externo (DVE)
    join: ", "
    empty_text: ""

  # ========== 4. Hidrocefalia / funcional ==========
  - id: proc_hidrocefalia
    type: multi
    required: false
    required_if_procedimiento_grupo: [Hidrocefalia / funcional / pediátrica]
    label: Manejo de LCR / hidrocefalia
    options:
      - Derivación ventriculoperitoneal (DVP)
      - Derivación ventriculoatrial (DVA) / lumboperitoneal
      - Tercerventriculostomía endoscópica (TVE)
    join: "; "
    empty_text: ""

  - id: indicacion_hidrocefalia
    type: single
    required: false
    required_if_proc_hidrocefalia:
      - Derivación ventriculoperitoneal (DVP)
      - Derivación ventriculoatrial (DVA) / lumboperitoneal
      - Tercerventriculostomía endoscópica (TVE)
    label: Indicación de hidrocefalia
    options:
      - Comunicante
      - No comunicante (obstructiva)
    empty_text: ""

  - id: valvula_dvp
    type: single
    required: false
    required_if_proc_hidrocefalia: [Derivación ventriculoperitoneal (DVP)]
    label: Válvula (DVP)
    options:
      - Presión fija
      - Programable
    empty_text: ""

  - id: proc_funcional
    type: multi
    required: false
    required_if_procedimiento_grupo: [Hidrocefalia / funcional / pediátrica]
    label: Neurocirugía funcional / dolor / epilepsia
    options:
      - Estimulación cerebral profunda (DBS)
      - Estimulador del nervio vago (VNS)
      - Descompresión microvascular (DVM) de nervio trigémino / facial (Jannetta)
      - Resección de foco epileptógeno / lobectomía temporal / callosotomía
    join: "; "
    empty_text: ""

  - id: blanco_dbs
    type: multi
    required: false
    required_if_proc_funcional: [Estimulación cerebral profunda (DBS)]
    label: Blanco DBS
    options: [STN, GPi, VIM]
    join: ", "
    empty_text: ""

  - id: testing_dbs
    type: single
    required: false
    required_if_proc_funcional: [Estimulación cerebral profunda (DBS)]
    label: Testing intraoperatorio del electrodo (DBS)
    options:
      - Realizado — respuesta adecuada
      - Realizado — requirió reposicionamiento
      - No realizado
    empty_text: ""

  # ========== 5. Raquimedular ==========
  - id: indicacion_raquimedular
    type: multi
    required: false
    required_if_procedimiento_grupo: [Raquimedular]
    label: Indicación / diagnóstico
    options:
      - Hernia discal
      - Estenosis de canal
      - Tumor
      - Malformación vascular
      - Trauma
      - Otro
    join: "; "
    empty_text: ""

  - id: indicacion_raquimedular_otro
    type: free
    required: false
    required_if_indicacion_raquimedular: [Otro]
    label: Indicación (otro)
    empty_text: ""

  - id: region_raquimedular
    type: multi
    required: false
    required_if_procedimiento_grupo: [Raquimedular]
    label: Región anatómica
    options: [Cervical, Torácica / dorsal, Lumbar, Sacro]
    join: ", "
    empty_text: ""

  - id: niveles_cervicales
    type: multi
    required: false
    required_if_region_raquimedular: [Cervical]
    label: Niveles cervicales
    options:
      - C1-C2
      - C2-C3
      - C3-C4
      - C4-C5
      - C5-C6
      - C6-C7
      - C7-T1
    join: ", "
    empty_text: ""

  - id: niveles_toracicos
    type: multi
    required: false
    required_if_region_raquimedular: [Torácica / dorsal]
    label: Niveles torácicos / dorsales
    options:
      - T1-T2
      - T2-T3
      - T3-T4
      - T4-T5
      - T5-T6
      - T6-T7
      - T7-T8
      - T8-T9
      - T9-T10
      - T10-T11
      - T11-T12
      - T12-L1
    join: ", "
    empty_text: ""

  - id: niveles_lumbares
    type: multi
    required: false
    required_if_region_raquimedular: [Lumbar]
    label: Niveles lumbares
    options:
      - L1-L2
      - L2-L3
      - L3-L4
      - L4-L5
      - L5-S1
    join: ", "
    empty_text: ""

  - id: niveles_atipicos_libre
    type: free
    required: false
    required_if_procedimiento_grupo: [Raquimedular]
    label: Niveles múltiples / atípicos (detalle libre)
    empty_text: ""

  - id: proc_raquimedular
    type: multi
    required: false
    required_if_procedimiento_grupo: [Raquimedular]
    label: Abordaje y procedimiento
    options:
      - Discectomía / microdiscectomía
      - Laminectomía / hemilaminectomía descompresiva
      - Resección de tumor intradural / extramedular
      - Resección de tumor intramedular
      - Resección de malformación vascular espinal
    join: "; "
    empty_text: ""

  - id: via_discectomia
    type: single
    required: false
    required_if_proc_raquimedular: [Discectomía / microdiscectomía]
    label: Vía de discectomía
    options:
      - Anterior (Cloward / ACDF — cervical)
      - Posterior (lumbar / torácica)
    empty_text: ""

  - id: neuromonitoreo_raquimedular
    type: single
    required: false
    required_if_proc_raquimedular: [Resección de tumor intramedular]
    label: Neuromonitoreo intraoperatorio
    options:
      - Potenciales evocados motores y sensitivos — sin cambios
      - Con alerta intraoperatoria
      - No utilizado
    empty_text: ""
    # Obligatorio si tumor intramedular (required_if arriba). Disponible
    # opcional en el resto de §5 vía UI (procedimiento_grupo = Raquimedular).
    # ADVERTENCIA MOTOR: respetar required condicional por
    # required_if_proc_raquimedular — no degradar a siempre-opcional.

  - id: raiz_nerviosa_schwannoma
    type: single
    required: false
    required_if_proc_raquimedular: [Resección de tumor intradural / extramedular]
    label: Integridad de raíz nerviosa
    options:
      - Preservada
      - Sacrificada — sección necesaria
    empty_text: ""

  - id: nivel_raiz_afectada
    type: free
    required: false
    required_if_proc_raquimedular: [Resección de tumor intradural / extramedular]
    label: Nivel de raíz afectada
    empty_text: ""

  - id: duroplastia
    type: single
    required: false
    required_if_procedimiento_grupo: [Raquimedular]
    label: Duroplastia / cierre dural
    options:
      - Cierre dural hermético primario
      - Plastia dural con injerto + sellante de fibrina
      - No realizada
    empty_text: ""

  - id: injerto_dural
    type: multi
    required: false
    required_if_duroplastia: [Plastia dural con injerto + sellante de fibrina]
    label: Material de plastia dural
    options:
      - Sustituto dural sintético
      - Pericardio
      - Fascia lata
      - Sellante de fibrina (TachoSil / DuraSeal)
    join: ", "
    empty_text: ""

  # ========== 6. Drenajes / materiales / cierre ==========
  - id: hemostasia_lecho
    type: multi
    required: false
    required_if_procedimiento_grupo: [Drenajes / materiales / cierre]
    label: Hemostasia de lecho quirúrgico
    options:
      - Cera para hueso (bone wax)
      - Esponja de gelatina (Gelfoam)
      - Celulosa oxidada (Surgicel)
      - Algodonitos contados
    join: ", "
    empty_text: ""

  - id: dve
    type: single
    required: false
    required_if_procedimiento_grupo: [Drenajes / materiales / cierre]
    label: Drenaje ventricular externo (DVE)
    options: [Colocado, No colocado]
    empty_text: ""

  - id: dve_calibracion_cmh2o
    type: free
    required: false
    required_if_dve: [Colocado]
    label: Calibración DVE (cmH₂O)
    empty_text: ""

  - id: drenaje_craneal
    type: single
    required: false
    required_if_procedimiento_grupo: [Drenajes / materiales / cierre]
    label: Drenaje craneal (no DVE)
    options: [Sí, Sin drenaje]
    empty_text: ""

  - id: drenaje_craneal_tipo
    type: single
    required: false
    required_if_drenaje_craneal: [Sí]
    label: Tipo de drenaje craneal
    options:
      - Subdural
      - Subgaleal
      - Epidural
      - Aspirativo / al vacío
    empty_text: ""

  - id: drenaje_craneal_cantidad
    type: free
    required: false
    required_if_drenaje_craneal: [Sí]
    label: Cantidad de drenajes
    empty_text: ""

  - id: reposicion_colgajo_oseo
    type: single
    required: false
    required_if_procedimiento_grupo: [Drenajes / materiales / cierre]
    label: Reposición del colgajo óseo
    options:
      - Sí — fijado con plaquitas / tornillos (titanio / PEEK)
      - No — guardado en banco / abdomen
      - No — descartado
    empty_text: ""

plantilla_texto: |
  Neurocirugía — {{procedimiento_grupo}}. Posición {{posicion_quirurgica}}. Abordaje {{abordaje}}{{conversion_causa}}.
  Craneal tumoral: {{indicacion_craneal_tumoral}}{{indicacion_craneal_tumoral_otro}}; ubic. {{ubicacion_craneal}} {{ubicacion_supratentorial}} {{ubicacion_fosa_posterior}}; {{abordaje_craneal}} {{tipo_craneotomia}}; CEBC {{lesion_cebc}} corredor {{corredor_cebc}}{{cebc_cierre_xref_nota}}; resección {{reseccion_tumoral}}; neuromonitoreo {{neuromonitoreo_craneal}}; fluorescencia {{fluorescencia}}; duramadre {{duramadre_craneotomia}}; V {{nervio_trigemino_v}} VII {{nervio_facial_vii}} VIII {{nervio_vestibulococlear_viii}}; ACI {{carotida_interna}}; quiasma {{quiasma_optico}}.
  Vascular: {{patologia_vascular_craneal}}; circulación {{ubicacion_circulacion}}; vol. hematoma {{volumen_hematoma_vascular_cc}} cc; HSA {{hsa}} Hunt-Hess {{hunt_hess}} Fisher {{fisher}}; {{tecnica_vascular_craneal}}; vasos {{vasos_clipado}}{{vasos_clipado_otro}}; ruptura {{ruptura_aneurisma_io}}; angio {{resultado_angiografico_clipado}}; estudio {{estudio_vascular_io}}.
  Trauma: {{indicacion_neurotrauma}}; GCS {{glasgow_preop}}; vol. {{volumen_hematoma_cc}} cc; midline {{midline_shift_mm}} mm; {{proc_neurotrauma}} {{tipo_descompresiva}}; craneoplastia {{material_craneoplastia}}; PIC {{tipo_monitoreo_pic}}.
  Hidro/funcional: {{proc_hidrocefalia}} tipo {{indicacion_hidrocefalia}} válvula {{valvula_dvp}}; {{proc_funcional}} DBS {{blanco_dbs}} testing {{testing_dbs}}.
  Raquimedular: {{indicacion_raquimedular}}{{indicacion_raquimedular_otro}}; región {{region_raquimedular}}; niveles C {{niveles_cervicales}} T {{niveles_toracicos}} L {{niveles_lumbares}} {{niveles_atipicos_libre}}; {{proc_raquimedular}} vía {{via_discectomia}}; neuromonitoreo {{neuromonitoreo_raquimedular}}; raíz {{raiz_nerviosa_schwannoma}} nivel {{nivel_raiz_afectada}}; duroplastia {{duroplastia}} {{injerto_dural}}.
  Drenajes/cierre: hemostasia {{hemostasia_lecho}}; DVE {{dve}} {{dve_calibracion_cmh2o}} cmH2O; drenaje {{drenaje_craneal}} {{drenaje_craneal_tipo}} n={{drenaje_craneal_cantidad}}; colgajo {{reposicion_colgajo_oseo}}.
```

---

## Notas (OK de semilla)

1. `procedimiento_grupo` **single**. Posición transversal; required en
   fosa posterior (§1), circulación posterior (§2) y grupo
   hidrocefalia/funcional (Jannetta §4).
2. Validación: criterio AnesFact (Diego), **no** neurocirujano ni Dra.
   Huerta (ver cabecera) — salvedad se mantiene.
3. §1: indicación; pares V/VII/VIII (fosa); ACI + quiasma (silla);
   duramadre; CEBC/EET → `lesion_cebc` + `corredor_cebc` (dueño acá).
4. §2: HSA → Hunt-Hess + Fisher; circulación ant/post; volumen hematoma
   vascular; vasos clipado; ruptura; angio final.
5. §3: Glasgow; volumen hematoma; midline shift.
6. §4: hidrocefalia comunicante/obstructiva; testing DBS.
7. §5: indicación; niveles multi; raíz en tumor intradural/extramedular;
   neuromonitoreo **obligatorio** si tumor intramedular
   (`required_if_proc_raquimedular`); UI puede mostrarlo opcional en el
   resto de §5. **Advertencia motor:** no degradar ese required
   condicional a siempre-opcional.
8. §6: drenaje tipo + cantidad; DVE calibración aparte.
9. Numéricos sin `empty_text` inventado. Convertido + causa.
10. «Osteoflácida» — término del bosquejo, sin confirmar.
11. Gatillos consideraciones (awake, DBS, sentado/VAE, clipado, HTE) →
    roadmap P2; no slots.
12. Tumor intradural/extramedular vs intramedular separados.
13. CEBC / EET: `lesion_cebc` + `corredor_cebc` dueños acá; cierre/reconstrucción
    nasal → xref `cebc_cierre_xref_nota` a CyC P7 (`cyc-nariz-senos-v1`).
    Equipo neuro+ORL = foja cada uno (Huerta 2026-09-14); sin foja compartida.
