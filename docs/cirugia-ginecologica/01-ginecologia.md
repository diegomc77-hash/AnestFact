# Módulo — Cirugía Ginecológica y Pelviana

**id:** `cgine-pelviana-v1` · especialidad: Cirugía Ginecológica ·  
**Estado:** esqueleto de slots — **OK de semilla** (2026-09-14). Motor P2
pendiente. Validación: criterio AnesFact (Diego), no ginecóloga ni Dra.
Huerta (ver § Validación clínica). Corrección final: cistoscopía de
control en TVT.

Índice: [README.md](README.md) · Hallazgos: [HALLAZGOS_ESQUELETO.md](HALLAZGOS_ESQUELETO.md)

Consentimiento / gasas / ATB = cáscara A4 de Foja Qx (no van acá).

## Validación clínica (leer antes de auditar)

**Este módulo no tiene el mismo nivel de validación directa que Cabeza y
Cuello ni Cirugía General.** CyC y CG fueron validados por la Dra. Huerta
en su disciplina. Ella **no** es ginecóloga: el bosquejo y las correcciones
aplicadas aquí son **criterio clínico del equipo AnesFact (Diego)** — con
el mismo rigor de auditoría que el resto del catálogo, pero **sin**
reemplazar la revisión futura de una ginecóloga/o real. Si un día lo
revisa un/a especialista, debe partir de ese supuesto (misma salvedad
que Cirugía Torácica y Urológica).

## Correcciones aplicadas al bosquejo (12)

1. Uréteres Regla 1 (ambos siempre) en toda histerectomía.
2. Vejiga Regla 1 en toda histerectomía.
3. Indicación uterina (multi).
4. Márgenes histerectomía radical: parametrio + vaginal (+ distancia).
4b. `preservacion_nerviosa_radical` (Wertheim-Meigs).
5. Rotura intraoperatoria del quiste ovárico (Sí/No) en quistectomía.
6. `plantilla_linfadenectomia_pelviana` multi (ilíaca ext./int./común/obturatriz).
7. Resultado de ganglio centinela (si se hizo detección).
7b. `rotura_capsular_oncologica` (cáncer de ovario) + `invasion_miometrial`
    (cáncer de endometrio).
8. Indicación piso pélvico (multi) + grado POP-Q I–IV.
9. TVT (retropúbica) ≠ TOT (transobturadora) como técnicas distintas.
10. Complicación de histeroscopía (Sin / Perforación uterina / Otra).
11. Margen en conización (Leep / cono frío) + distancia.
12. Drenaje pelviano: tipo single + cantidad (no texto mezclado).

Tipografía: **Lateralidad** (no «Laterallidad»).

---

## Proforma — Cirugía ginecológica y pelviana

```text
id:            cgine-pelviana-v1
especialidad:  "Cirugía Ginecológica"
operaciones: [
  "Histerectomía / miomectomía",
  "Cirugía anexial / endometriosis",
  "Estadificación / citorreducción oncológica",
  "Piso pélvico / uroginecología",
  "Histeroscopía / conización / LUI"
]
titulo: "Cirugía ginecológica y pelviana"

slots:

  # ========== Índice ==========
  - id: procedimiento_grupo
    type: single
    required: true
    label: Procedimiento / foco
    options:
      - Patología uterina (histerectomía / miomectomía)
      - Patología anexial / conservadora
      - Cirugía oncológica / estadificación pelviana
      - Piso pélvico / uroginecología / vaginal
      - Histeroscopía / procedimientos intrauterinos / menores

  - id: abordaje
    type: single
    required: true
    label: Abordaje
    options:
      - Abierto / laparotómico (Pfannenstiel / mediana)
      - Laparoscópico (TLH)
      - Robótico
      - Vaginal (VH / VAVH)
      - vNOTES
      - Histeroscópico
      - Convertido a abierto

  - id: conversion_causa
    type: free
    required: false
    required_if_abordaje: [Convertido a abierto]
    label: Causa de conversión
    empty_text: ""

  # ========== 1. Uterina ==========
  - id: proc_uterino
    type: single
    required: false
    required_if_procedimiento_grupo: [Patología uterina (histerectomía / miomectomía)]
    label: Procedimiento uterino
    options:
      - Histerectomía total
      - Histerectomía subtotal / supracervical
      - Histerectomía radical (parametrectomía / Wertheim-Meigs)
      - Miomectomía
    empty_text: ""

  - id: indicacion_uterina
    type: multi
    required: false
    required_if_procedimiento_grupo: [Patología uterina (histerectomía / miomectomía)]
    label: Indicación
    options:
      - Miomatosis sintomática
      - Adenomiosis
      - Sangrado uterino anormal
      - Prolapso uterino
      - Neoplasia de endometrio
      - Neoplasia de cérvix
      - Otro
    join: "; "
    empty_text: ""

  - id: indicacion_uterina_otro
    type: free
    required: false
    required_if_indicacion_uterina: [Otro]
    label: Indicación (otro)
    empty_text: ""

  - id: miomectomia_tipo
    type: single
    required: false
    required_if_proc_uterino: [Miomectomía]
    label: Miomectomía — número
    options: [Única, Múltiple]
    empty_text: ""

  - id: mioma_ubicacion
    type: multi
    required: false
    required_if_proc_uterino: [Miomectomía]
    label: Ubicación del/los mioma(s)
    options: [Subserosa, Intramural, Submucosa]
    join: ", "
    empty_text: ""

  - id: anexectomia_asociada
    type: single
    required: false
    required_if_proc_uterino:
      - Histerectomía total
      - Histerectomía subtotal / supracervical
      - Histerectomía radical (parametrectomía / Wertheim-Meigs)
    label: Anexectomía asociada
    options:
      - Salpingooforectomía bilateral (SOB)
      - Salpingooforectomía unilateral
      - Conservación de anexos / salpingectomía profiláctica
    empty_text: ""

  - id: anexectomia_unilateral_lado
    type: single
    required: false
    required_if_anexectomia_asociada: [Salpingooforectomía unilateral]
    label: Lateralidad (anexectomía unilateral)
    options: [Derecha, Izquierda]
    empty_text: ""

  - id: control_vasos_uterinos
    type: single
    required: false
    required_if_proc_uterino:
      - Histerectomía total
      - Histerectomía subtotal / supracervical
      - Histerectomía radical (parametrectomía / Wertheim-Meigs)
      - Miomectomía
    label: Sellado / ligadura de vasos uterino-ováricos y arterias uterinas
    options:
      - Sutura manual
      - Sellado energético / clips
    empty_text: ""

  - id: ureter_derecho_histerectomia
    type: single
    required: false
    required_if_proc_uterino:
      - Histerectomía total
      - Histerectomía subtotal / supracervical
      - Histerectomía radical (parametrectomía / Wertheim-Meigs)
    label: Uréter derecho
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
    empty_text: ""
    # Ambos siempre (cardinales; disección no lateral).

  - id: ureter_izquierdo_histerectomia
    type: single
    required: false
    required_if_proc_uterino:
      - Histerectomía total
      - Histerectomía subtotal / supracervical
      - Histerectomía radical (parametrectomía / Wertheim-Meigs)
    label: Uréter izquierdo
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
    empty_text: ""

  - id: vejiga_histerectomia
    type: single
    required: false
    required_if_proc_uterino:
      - Histerectomía total
      - Histerectomía subtotal / supracervical
      - Histerectomía radical (parametrectomía / Wertheim-Meigs)
    label: Vejiga (espacio vesicouterino)
    options:
      - Identificada y preservada
      - Lesión identificada intraoperatoriamente
      - No disecada
    empty_text: ""

  - id: margen_parametrio
    type: single
    required: false
    required_if_proc_uterino: [Histerectomía radical (parametrectomía / Wertheim-Meigs)]
    label: Margen de parametrio
    options: [Libre, Comprometido, No aplica]
    empty_text: ""

  - id: margen_parametrio_distancia
    type: free
    required: false
    required_if_margen_parametrio: [Libre, Comprometido]
    label: Margen parametrio — distancia
    empty_text: ""

  - id: margen_vaginal_radical
    type: single
    required: false
    required_if_proc_uterino: [Histerectomía radical (parametrectomía / Wertheim-Meigs)]
    label: Margen vaginal
    options: [Libre, Comprometido, No aplica]
    empty_text: ""

  - id: margen_vaginal_radical_distancia
    type: free
    required: false
    required_if_margen_vaginal_radical: [Libre, Comprometido]
    label: Margen vaginal — distancia
    empty_text: ""

  - id: preservacion_nerviosa_radical
    type: single
    required: false
    required_if_proc_uterino: [Histerectomía radical (parametrectomía / Wertheim-Meigs)]
    label: Preservación nerviosa (nervios autonómicos pélvicos)
    options:
      - Preservación nerviosa lograda
      - Preservación nerviosa parcial
      - No intentada — técnica convencional
    empty_text: ""
    # Referencia moderna: reduce disfunción vesical / intestinal / sexual.

  # ========== 2. Anexial ==========
  - id: proc_anexial
    type: single
    required: false
    required_if_procedimiento_grupo: [Patología anexial / conservadora]
    label: Procedimiento anexial
    options:
      - Salpingectomía (ectópico / hidrosálpinx / profilaxis)
      - Quistectomía ovárica / cistectomía
      - Ooforectomía parcial / monolateral
      - Liberación de adherencias pelvianas / adhesiólisis
      - Resección / ablación de endometriosis pelviana
    empty_text: ""

  - id: lateralidad_anexial
    type: single
    required: false
    required_if_procedimiento_grupo: [Patología anexial / conservadora]
    label: Lateralidad
    options: [Derecha, Izquierda, Bilateral]
    empty_text: ""

  - id: contenido_lesion_anexial
    type: single
    required: false
    required_if_proc_anexial:
      - Quistectomía ovárica / cistectomía
      - Ooforectomía parcial / monolateral
    label: Contenido de la lesión
    options:
      - Seroso
      - Hemático / endometrioma
      - Sebáceo / dermoide
      - Purulento / absceso tubo-ovárico (ATO)
    empty_text: ""

  - id: rotura_quiste_intraoperatoria
    type: single
    required: false
    required_if_proc_anexial: [Quistectomía ovárica / cistectomía]
    label: Rotura intraoperatoria del quiste
    options: [Sí, No]
    empty_text: ""
    # Si Sí + sospecha de malignidad → cambia estadificación (nota plantilla).

  - id: grado_endometriosis
    type: single
    required: false
    required_if_proc_anexial: [Resección / ablación de endometriosis pelviana]
    label: Grado de endometriosis
    options: [I, II, III, IV]
    empty_text: ""

  - id: campo_anexial
    type: single
    required: false
    required_if_contenido_lesion_anexial: [Purulento / absceso tubo-ovárico (ATO)]
    label: Clasificación del campo
    options: [Limpio, Limpio-contaminado, Contaminado]
    empty_text: ""

  # ========== 3. Oncológica / estadificación ==========
  - id: indicacion_onco_gine
    type: multi
    required: false
    required_if_procedimiento_grupo: [Cirugía oncológica / estadificación pelviana]
    label: Indicación oncológica
    options:
      - Cáncer de endometrio
      - Cáncer de ovario
      - Cáncer de cérvix
    join: ", "
    empty_text: ""

  - id: gesto_estadificacion
    type: multi
    required: false
    required_if_procedimiento_grupo: [Cirugía oncológica / estadificación pelviana]
    label: Gestos de estadificación / debulking
    options:
      - Linfadenectomía pelviana
      - Linfadenectomía paraaórtica
      - Detección y biopsia de ganglio centinela
      - Omentectomía
      - Biopsias peritoneales múltiples / lavado peritoneal citológico
      - Citorreducción completa (R0)
      - Citorreducción incompleta
    join: "; "
    empty_text: ""

  - id: plantilla_linfadenectomia_pelviana
    type: multi
    required: false
    required_if_gesto_estadificacion: [Linfadenectomía pelviana]
    label: Extensión / plantilla — linfadenectomía pelviana
    options:
      - Ilíaca externa
      - Ilíaca interna
      - Ilíaca común
      - Obturatriz
    join: ", "
    empty_text: ""

  - id: omentectomia_tipo
    type: single
    required: false
    required_if_gesto_estadificacion: [Omentectomía]
    label: Omentectomía
    options: [Infracólica, Total]
    empty_text: ""

  - id: ganglio_centinela_trazador
    type: multi
    required: false
    required_if_gesto_estadificacion: [Detección y biopsia de ganglio centinela]
    label: Trazador / técnica de ganglio centinela
    options:
      - Verde de indocianina (ICG)
      - Trazador radioisotópico / colorante
    join: ", "
    empty_text: ""

  - id: resultado_ganglio_centinela
    type: single
    required: false
    required_if_gesto_estadificacion: [Detección y biopsia de ganglio centinela]
    label: Resultado de ganglio centinela
    options:
      - Negativo
      - Positivo (macrometástasis)
      - Positivo (micrometástasis)
      - Células tumorales aisladas
      - No evaluable
    empty_text: ""

  - id: rotura_capsular_oncologica
    type: single
    required: false
    required_if_indicacion_onco_gine: [Cáncer de ovario]
    label: Rotura capsular ovárica (oncológica)
    options:
      - Sin rotura
      - Rotura intraoperatoria
      - Rotura preoperatoria
    empty_text: ""
    # FIGO IA vs IC1/IC2 en cáncer de ovario temprano. Distinto de
    # rotura_quiste_intraoperatoria (foco anexial benigno).

  - id: invasion_miometrial
    type: single
    required: false
    required_if_indicacion_onco_gine: [Cáncer de endometrio]
    label: Invasión miometrial
    options:
      - <50% del miometrio
      - ≥50% del miometrio
      - No evaluada intraoperatoriamente
    empty_text: ""
    # FIGO endometrio; a menudo congelación → decide linfadenectomía.

  # ========== 4. Piso pélvico / uroginecología ==========
  - id: proc_piso_pelvico
    type: multi
    required: false
    required_if_procedimiento_grupo: [Piso pélvico / uroginecología / vaginal]
    label: Procedimiento
    options:
      - Colpoplastia anterior (cistocele)
      - Colpoplastia posterior (rectocele / enterocele)
      - Sacrocolpopexia / sacrohisteropexia (malla sintética)
      - Fijación al ligamento sacroespinoso (Richter)
      - Cinta suburetral — TVT (vía retropúbica)
      - Cinta suburetral — TOT (vía transobturadora)
      - Colpocleisis (Le Fort)
    join: "; "
    empty_text: ""
    # TVT ≠ TOT (perfiles de complicación distintos; TVT ↑ riesgo perforación vesical).

  - id: indicacion_piso_pelvico
    type: multi
    required: false
    required_if_procedimiento_grupo: [Piso pélvico / uroginecología / vaginal]
    label: Indicación
    options:
      - Cistocele
      - Rectocele
      - Enterocele
      - Prolapso apical (uterino o de cúpula)
      - Incontinencia urinaria de esfuerzo
    join: "; "
    empty_text: ""

  - id: grado_popq
    type: single
    required: false
    required_if_indicacion_piso_pelvico:
      - Cistocele
      - Rectocele
      - Enterocele
      - Prolapso apical (uterino o de cúpula)
    label: Grado POP-Q
    options: [I, II, III, IV]
    empty_text: ""

  - id: cistoscopia_control_tvt
    type: single
    required: false
    required_if_proc_piso_pelvico: [Cinta suburetral — TVT (vía retropúbica)]
    label: Cistoscopía de control (TVT)
    options:
      - Realizada — sin lesión
      - Realizada — lesión identificada
      - No realizada
    empty_text: ""
    # Estándar en TVT (↑ riesgo perforación vesical vs TOT).

  # ========== 5. Histeroscopía / menores ==========
  - id: tipo_histeroscopia
    type: single
    required: false
    required_if_procedimiento_grupo: [Histeroscopía / procedimientos intrauterinos / menores]
    label: Tipo
    options:
      - Histeroscopía diagnóstica
      - Histeroscopía quirúrgica / resectoscopía
      - Legrado uterino instrumental (LUI) / AMEU
      - Biopsia de cérvix / conización (Leep / cono frío)
    empty_text: ""

  - id: gesto_histeroscopico
    type: multi
    required: false
    required_if_tipo_histeroscopia: [Histeroscopía quirúrgica / resectoscopía]
    label: Gesto histeroscópico
    options:
      - Polipectomía endometrial / cervical
      - Miomectomía histeroscópica
      - Ablación / resección endometrial
      - Metroplastia / sección de septo uterino
    join: "; "
    empty_text: ""

  - id: complicacion_histeroscopia
    type: single
    required: false
    required_if_tipo_histeroscopia: [Histeroscopía quirúrgica / resectoscopía]
    label: Complicación de histeroscopía
    options:
      - Sin complicaciones
      - Perforación uterina
      - Otra
    empty_text: ""

  - id: complicacion_histeroscopia_otra
    type: free
    required: false
    required_if_complicacion_histeroscopia: [Otra]
    label: Complicación histeroscopía (otra)
    empty_text: ""

  - id: margen_conizacion
    type: single
    required: false
    required_if_tipo_histeroscopia: [Biopsia de cérvix / conización (Leep / cono frío)]
    label: Margen quirúrgico (conización)
    options: [Libre, Comprometido, No evaluable]
    empty_text: ""

  - id: margen_conizacion_distancia
    type: free
    required: false
    required_if_margen_conizacion: [Libre, Comprometido]
    label: Margen conización — distancia
    empty_text: ""

  # ========== 6. Cierre / drenaje ==========
  - id: cierre_cupula_vaginal
    type: single
    required: false
    required_if_proc_uterino:
      - Histerectomía total
      - Histerectomía radical (parametrectomía / Wertheim-Meigs)
    label: Cierre de cúpula vaginal
    options:
      - Vía vaginal
      - Vía laparoscópica / abierta
    empty_text: ""

  - id: sutura_cupula
    type: single
    required: false
    required_if_cierre_cupula_vaginal: [Vía vaginal, Vía laparoscópica / abierta]
    label: Sutura de cúpula
    options:
      - Continua absorbible
      - Puntos separados
    empty_text: ""

  - id: anclaje_uterosacros
    type: single
    required: false
    required_if_cierre_cupula_vaginal: [Vía vaginal, Vía laparoscópica / abierta]
    label: Anclaje de ligamentos uterosacros
    options: [Sí, No]
    empty_text: ""

  - id: drenaje_pelviano
    type: single
    required: false
    label: Drenaje en fondo de saco de Douglas / pelvis
    options: [Sí, Sin drenaje]
    empty_text: ""

  - id: drenaje_pelviano_tipo
    type: single
    required: false
    required_if_drenaje_pelviano: [Sí]
    label: Tipo de drenaje pelviano
    options:
      - Aspirativo
      - Jackson-Pratt
      - Otro
    empty_text: ""

  - id: drenaje_pelviano_tipo_otro
    type: free
    required: false
    required_if_drenaje_pelviano_tipo: [Otro]
    label: Tipo de drenaje (otro)
    empty_text: ""

  - id: drenaje_pelviano_cantidad
    type: free
    required: false
    required_if_drenaje_pelviano: [Sí]
    label: Cantidad de drenajes
    empty_text: ""

plantilla_texto: |
  Ginecológica — {{procedimiento_grupo}}. Abordaje: {{abordaje}}{{conversion_causa}}.
  Uterina: {{proc_uterino}}; indicación {{indicacion_uterina}}{{indicacion_uterina_otro}}; mioma {{miomectomia_tipo}} {{mioma_ubicacion}}; anexos {{anexectomia_asociada}}{{anexectomia_unilateral_lado}}; vasos {{control_vasos_uterinos}}; uréter der. {{ureter_derecho_histerectomia}} izq. {{ureter_izquierdo_histerectomia}}; vejiga {{vejiga_histerectomia}}; margen parametrio {{margen_parametrio}}{{margen_parametrio_distancia}} / vaginal {{margen_vaginal_radical}}{{margen_vaginal_radical_distancia}}; preservación nerviosa {{preservacion_nerviosa_radical}}.
  Anexial: {{proc_anexial}}; Lateralidad {{lateralidad_anexial}}; contenido {{contenido_lesion_anexial}}; rotura quiste {{rotura_quiste_intraoperatoria}} (si Sí + sospecha malignidad → cambia estadificación); endometriosis grado {{grado_endometriosis}}; campo {{campo_anexial}}.
  Onco: {{indicacion_onco_gine}}; gestos {{gesto_estadificacion}}; plantilla pelviana {{plantilla_linfadenectomia_pelviana}}; omentectomía {{omentectomia_tipo}}; centinela {{ganglio_centinela_trazador}} resultado {{resultado_ganglio_centinela}}; rotura capsular ovárica {{rotura_capsular_oncologica}}; invasión miometrial {{invasion_miometrial}}.
  Piso: {{proc_piso_pelvico}}; indicación {{indicacion_piso_pelvico}}; POP-Q {{grado_popq}}; cistoscopía TVT {{cistoscopia_control_tvt}}.
  Histeroscopía/menores: {{tipo_histeroscopia}} {{gesto_histeroscopico}}; complicación {{complicacion_histeroscopia}}{{complicacion_histeroscopia_otra}}; margen cono {{margen_conizacion}}{{margen_conizacion_distancia}}.
  Cúpula {{cierre_cupula_vaginal}} {{sutura_cupula}} uterosacros {{anclaje_uterosacros}}; drenaje {{drenaje_pelviano}} {{drenaje_pelviano_tipo}}{{drenaje_pelviano_tipo_otro}} n={{drenaje_pelviano_cantidad}}.
```

---

## Notas (OK de semilla)

1. `procedimiento_grupo` **single**. Tipografía **Lateralidad**.
2. Validación: criterio AnesFact (Diego), **no** ginecóloga ni Dra. Huerta
   (ver cabecera) — misma salvedad que Tórax / Urología; mantener hasta
   revisión por especialista.
3. Toda histerectomía: uréteres bilaterales + vejiga (Regla 1).
4. Radical: márgenes parametrio/vaginal + `preservacion_nerviosa_radical`.
5. Quistectomía: rotura Sí/No; onco ovario: `rotura_capsular_oncologica`;
   endometrio: `invasion_miometrial`.
6. Linfadenectomía pelviana con plantilla detallada; ganglio centinela
   con resultado.
7. TVT ≠ TOT; `cistoscopia_control_tvt` solo en TVT.
8. POP-Q solo si prolapso (no IUE). Cúpula solo total/radical (no subtotal).
9. Histeroscopía quirúrgica: complicación. Conización: margen.
10. Drenaje: Sí / **Sin drenaje**; tipo + cantidad. Convertido + causa.
