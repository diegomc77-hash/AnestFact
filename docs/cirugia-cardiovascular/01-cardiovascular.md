# Módulo — Cirugía Cardiovascular

**id:** `ccv-cardiovascular-v1` · especialidad: Cirugía Cardiovascular ·  
**Estado:** **OK de semilla** (2026-09-14). Sin motor P2.

Índice: [README.md](README.md)

Consentimiento / gasas / ATB = cáscara A4 de Foja Qx (no van acá).

## Validación clínica (leer antes de auditar)

**Este módulo no tiene el mismo nivel de validación directa que Cabeza y
Cuello ni Cirugía General.** CyC y CG fueron validados por la Dra. Huerta
en su disciplina. Ella **no** es cirujana cardiovascular: el bosquejo y
las correcciones aplicadas aquí son **criterio clínico del equipo
AnesFact (Diego)** — auditoría con rigor de especialista de la disciplina
(especialidad de máximo riesgo, junto con Neurocirugía), pensado para uso
por cirujano/a cardiovascular real, **sin** reemplazar la revisión futura
de un/a especialista. Misma salvedad que Torácica / Urológica /
Ginecológica / Traumatología / Vascular / Plástica / Neurocirugía.

## Correcciones aplicadas al bosquejo (9)

**§1 Abordaje/CEC:** (1) destete de CEC · (2) riesgo reesternotomía.

**§2 CRM:** (3) indicación multi · (4) flujometría / TTFM.

**§3 Valvular:** (5) indicación por válvula · (6) ETE post-implante.

**§4 Aorta/congénitas:** (7) troncos supraaórticos reimplantados ·
gradiente septal post-miectomía.

**§5 Soporte/cierre:** (8) indicación soporte · (9) reexploración por
sangrado (transversal).

Gatillos hacia `foja.consideraciones` (CEC/ACT, paro hipotérmico,
off-pump, protamina, ETE, destete/inotrópicos) → roadmap P2; **no** son
slots de esta proforma.

Tipografía: **Lateralidad** (no «Laterallidad»).

---

## Proforma — Cirugía cardiovascular

```text
id:            ccv-cardiovascular-v1
especialidad:  "Cirugía Cardiovascular"
operaciones: [
  "Abordaje, canulación y circulación extracorpórea",
  "Revascularización miocárdica (CRM)",
  "Cirugía valvular",
  "Aorta torácica y congénitas del adulto",
  "Soporte circulatorio, marcapasos y cierre"
]
titulo: "Cirugía cardiovascular"

slots:

  # ========== Índice ==========
  - id: procedimiento_grupo
    type: single
    required: true
    label: Procedimiento / foco
    options:
      - Abordaje / canulación / CEC
      - Revascularización miocárdica (CRM)
      - Cirugía valvular
      - Aorta torácica / congénitas del adulto
      - Soporte circulatorio / marcapasos / cierre

  - id: caracter_cirugia
    type: single
    required: false
    label: Carácter de la cirugía
    options:
      - Electiva / programada
      - Urgente
      - Emergencia
    empty_text: ""

  - id: reexploracion_sangrado
    type: single
    required: false
    label: Reexploración por sangrado postoperatorio
    options:
      - No requerida
      - Requerida — hemostasia quirúrgica
      - Requerida — coagulopatía
    empty_text: ""

  - id: abordaje
    type: single
    required: false
    label: Abordaje (si aplica)
    options:
      - Abierto
      - Mínimamente invasivo
      - Convertido a abierto
    empty_text: ""

  - id: conversion_causa
    type: free
    required: false
    required_if_abordaje: [Convertido a abierto]
    label: Causa de conversión
    empty_text: ""

  # ========== 1. Abordaje / canulación / CEC ==========
  - id: via_abordaje_cv
    type: single
    required: false
    required_if_procedimiento_grupo: [Abordaje / canulación / CEC]
    label: Abordaje quirúrgico
    options:
      - Esternotomía media
      - Miniesternotomía
      - Toracotomía lateral
    empty_text: ""

  - id: esternotomia_tipo
    type: single
    required: false
    required_if_via_abordaje_cv: [Esternotomía media]
    label: Esternotomía — tipo
    options:
      - Primaria
      - Reoperación
    empty_text: ""

  - id: riesgo_reesternotomia
    type: single
    required: false
    required_if_esternotomia_tipo: [Reoperación]
    label: Riesgo de reesternotomía
    options:
      - Sin incidentes
      - Lesión de estructura cardíaca — controlada
      - Lesión de injerto previo
    empty_text: ""

  - id: lateralidad_toracotomia
    type: single
    required: false
    required_if_via_abordaje_cv: [Toracotomía lateral]
    label: Lateralidad (toracotomía)
    options: [Derecha, Izquierda]
    empty_text: ""

  - id: canulacion_arterial
    type: multi
    required: false
    required_if_procedimiento_grupo: [Abordaje / canulación / CEC]
    label: Canulación arterial
    options:
      - Aorta ascendente
      - Femoral
      - Subclavia / axilar
    join: ", "
    empty_text: ""

  - id: canulacion_venosa
    type: multi
    required: false
    required_if_procedimiento_grupo: [Abordaje / canulación / CEC]
    label: Canulación venosa
    options:
      - Aurícula derecha (cánula única / bivalva)
      - Cavas separadas (bicava)
      - Femoral
    join: ", "
    empty_text: ""

  - id: cardioplejia_via
    type: multi
    required: false
    required_if_procedimiento_grupo: [Abordaje / canulación / CEC]
    label: Protección miocárdica / cardioplejía — vía
    options:
      - Anterógrada (seno de Valsalva / coronarias)
      - Retrógrada (seno coronario)
      - Combinada
    join: ", "
    empty_text: ""

  - id: cardioplejia_solucion
    type: single
    required: false
    required_if_procedimiento_grupo: [Abordaje / canulación / CEC]
    label: Cardioplejía — solución
    options:
      - Cristaloide (Custodiol / Del Nido)
      - Sanguínea — fría
      - Sanguínea — caliente
    empty_text: ""

  - id: tiempo_cec_min
    type: free
    required: false
    required_if_procedimiento_grupo: [Abordaje / canulación / CEC]
    label: Tiempo de CEC (min)
    empty_text: ""

  - id: tiempo_clampeo_aortico_cv_min
    type: free
    required: false
    required_if_procedimiento_grupo: [Abordaje / canulación / CEC]
    label: Tiempo de clampeo aórtico (min)
    empty_text: ""

  - id: paro_circulatorio_hipotermico
    type: single
    required: false
    required_if_procedimiento_grupo: [Abordaje / canulación / CEC]
    label: Paro circulatorio hipotérmico
    options: [Realizado, No realizado]
    empty_text: ""

  - id: temperatura_central_paro_c
    type: free
    required: false
    required_if_paro_circulatorio_hipotermico: [Realizado]
    label: Temperatura central (°C)
    empty_text: ""

  - id: tiempo_paro_circulatorio_min
    type: free
    required: false
    required_if_paro_circulatorio_hipotermico: [Realizado]
    label: Tiempo de paro circulatorio (min)
    empty_text: ""

  - id: destete_cec
    type: single
    required: false
    required_if_procedimiento_grupo: [Abordaje / canulación / CEC]
    label: Resultado del destete de CEC
    options:
      - Sin inconvenientes
      - Requirió inotrópicos
      - Requirió soporte circulatorio mecánico (ver Sección 5)
    empty_text: ""

  # ========== 2. Revascularización miocárdica ==========
  - id: indicacion_crm
    type: multi
    required: false
    required_if_procedimiento_grupo: [Revascularización miocárdica (CRM)]
    label: Indicación
    options:
      - Enfermedad coronaria multivaso
      - Lesión de tronco de coronaria izquierda (TCI)
      - Otro
    join: "; "
    empty_text: ""

  - id: indicacion_crm_otro
    type: free
    required: false
    required_if_indicacion_crm: [Otro]
    label: Indicación CRM (otro)
    empty_text: ""

  - id: tecnica_crm
    type: single
    required: false
    required_if_procedimiento_grupo: [Revascularización miocárdica (CRM)]
    label: Técnica
    options:
      - Con CEC (on-pump)
      - Sin CEC (off-pump / corazón batiente)
    empty_text: ""

  - id: estabilizador_offpump
    type: free
    required: false
    required_if_tecnica_crm: [Sin CEC (off-pump / corazón batiente)]
    label: Estabilizador (off-pump)
    empty_text: ""

  - id: injertos_arteriales
    type: multi
    required: false
    required_if_procedimiento_grupo: [Revascularización miocárdica (CRM)]
    label: Injertos arteriales
    options:
      - Arteria mamaria interna izquierda (AMII / LIMA)
      - Arteria mamaria interna derecha (AMID / RIMA)
      - Arteria radial
    join: "; "
    empty_text: ""

  - id: anastomosis_lima
    type: single
    required: false
    required_if_injertos_arteriales: [Arteria mamaria interna izquierda (AMII / LIMA)]
    label: LIMA — anastomosis a
    options: [DA, Otro]
    empty_text: ""

  - id: anastomosis_lima_otro
    type: free
    required: false
    required_if_anastomosis_lima: [Otro]
    label: LIMA — anastomosis (otro)
    empty_text: ""

  - id: anastomosis_rima
    type: free
    required: false
    required_if_injertos_arteriales: [Arteria mamaria interna derecha (AMID / RIMA)]
    label: RIMA — anastomosis a
    empty_text: ""

  - id: anastomosis_radial
    type: free
    required: false
    required_if_injertos_arteriales: [Arteria radial]
    label: Radial — anastomosis a
    empty_text: ""

  - id: injerto_safena
    type: single
    required: false
    required_if_procedimiento_grupo: [Revascularización miocárdica (CRM)]
    label: Injerto de vena safena magna
    options:
      - Puentes individuales
      - Puente secuencial
      - No utilizada
    empty_text: ""

  - id: vasos_receptores_safena
    type: multi
    required: false
    required_if_injerto_safena: [Puentes individuales, Puente secuencial]
    label: Vasos receptores (safena)
    options:
      - Cx
      - CD
      - Dx
      - Otro
    join: ", "
    empty_text: ""

  - id: vasos_receptores_safena_otro
    type: free
    required: false
    required_if_vasos_receptores_safena: [Otro]
    label: Vasos receptores (otro)
    empty_text: ""

  - id: numero_puentes_proximales
    type: free
    required: false
    required_if_procedimiento_grupo: [Revascularización miocárdica (CRM)]
    label: Número de anastomosis proximales a aorta
    empty_text: ""

  - id: clampeo_parcial_aorta
    type: single
    required: false
    required_if_procedimiento_grupo: [Revascularización miocárdica (CRM)]
    label: Clampeo parcial / Heartstring
    options:
      - Sí — clampeo parcial
      - No / Heartstring
    empty_text: ""

  - id: flujometria_ttfm
    type: single
    required: false
    required_if_procedimiento_grupo: [Revascularización miocárdica (CRM)]
    label: Verificación de flujo del injerto (flujometría / TTFM)
    options:
      - Realizada — flujo adecuado
      - Realizada — flujo subóptimo
      - No realizada
    empty_text: ""

  # ========== 3. Cirugía valvular ==========
  - id: valvula_abordada
    type: multi
    required: false
    required_if_procedimiento_grupo: [Cirugía valvular]
    label: Válvula(s) abordada(s)
    options:
      - Aórtica
      - Mitral
      - Tricúspide
    join: ", "
    empty_text: ""

  - id: indicacion_aortica_valvular
    type: multi
    required: false
    required_if_valvula_abordada: [Aórtica]
    label: Indicación — válvula aórtica
    options:
      - Estenosis
      - Insuficiencia
      - Endocarditis
      - Mixta
    join: ", "
    empty_text: ""

  - id: proc_aortica_valvular
    type: single
    required: false
    required_if_valvula_abordada: [Aórtica]
    label: Procedimiento — válvula aórtica
    options:
      - Reemplazo valvular aórtico (RVA)
      - Plástica / reparación valvular
    empty_text: ""

  - id: protesis_aortica_tipo
    type: single
    required: false
    required_if_proc_aortica_valvular: [Reemplazo valvular aórtico (RVA)]
    label: Prótesis aórtica — tipo
    options:
      - Mecánica
      - Biológica (bovina / porcina)
    empty_text: ""

  - id: protesis_aortica_marca
    type: free
    required: false
    required_if_proc_aortica_valvular: [Reemplazo valvular aórtico (RVA)]
    label: Prótesis aórtica — marca y N°
    empty_text: ""

  - id: ete_post_aortica
    type: single
    required: false
    required_if_valvula_abordada: [Aórtica]
    label: ETE post-implante — aórtica
    options:
      - Adecuada — sin fuga significativa
      - Fuga paravalvular — aceptada
      - Requirió revisión en el mismo acto
    empty_text: ""

  - id: indicacion_mitral
    type: multi
    required: false
    required_if_valvula_abordada: [Mitral]
    label: Indicación — válvula mitral
    options:
      - Estenosis
      - Insuficiencia
      - Endocarditis
      - Mixta
    join: ", "
    empty_text: ""

  - id: proc_mitral
    type: single
    required: false
    required_if_valvula_abordada: [Mitral]
    label: Procedimiento — válvula mitral
    options:
      - Reemplazo valvular mitral (RVM)
      - Plástica / reparación
    empty_text: ""

  - id: plastica_mitral_detalle
    type: multi
    required: false
    required_if_proc_mitral: [Plástica / reparación]
    label: Plástica mitral — detalle
    options:
      - Anuloplastia con anillo
      - Resección cuadrangular / triangular
      - Neocuerdas
    join: "; "
    empty_text: ""

  - id: protesis_mitral_marca
    type: free
    required: false
    required_if_proc_mitral: [Reemplazo valvular mitral (RVM), Plástica / reparación]
    label: Prótesis / anillo mitral — marca y N°
    empty_text: ""

  - id: ete_post_mitral
    type: single
    required: false
    required_if_valvula_abordada: [Mitral]
    label: ETE post-implante — mitral
    options:
      - Adecuada — sin fuga significativa
      - Fuga paravalvular — aceptada
      - Requirió revisión en el mismo acto
    empty_text: ""

  - id: indicacion_tricuspide
    type: multi
    required: false
    required_if_valvula_abordada: [Tricúspide]
    label: Indicación — válvula tricúspide
    options:
      - Estenosis
      - Insuficiencia
      - Endocarditis
      - Mixta
    join: ", "
    empty_text: ""

  - id: proc_tricuspide
    type: single
    required: false
    required_if_valvula_abordada: [Tricúspide]
    label: Procedimiento — válvula tricúspide
    options:
      - Anuloplastia tricuspídea (anillo / De Vega)
      - Reemplazo valvular
    empty_text: ""

  - id: ete_post_tricuspide
    type: single
    required: false
    required_if_valvula_abordada: [Tricúspide]
    label: ETE post-implante — tricúspide
    options:
      - Adecuada — sin fuga significativa
      - Fuga paravalvular — aceptada
      - Requirió revisión en el mismo acto
    empty_text: ""

  - id: resultado_revision_valvular
    type: single
    required: false
    required_if_ete_post_aortica: [Requirió revisión en el mismo acto]
    required_if_ete_post_mitral: [Requirió revisión en el mismo acto]
    required_if_ete_post_tricuspide: [Requirió revisión en el mismo acto]
    label: Resultado de la revisión valvular (mismo acto)
    options:
      - Nueva reparación exitosa
      - Conversión a reemplazo valvular
    empty_text: ""

  # ========== 4. Aorta torácica / congénitas ==========
  - id: patologia_aorta_toracica
    type: multi
    required: false
    required_if_procedimiento_grupo: [Aorta torácica / congénitas del adulto]
    label: Patología aórtica
    options:
      - Aneurisma de aorta ascendente
      - Disección aórtica tipo A
      - Aneurisma de arco aórtico / toracoabdominal
    join: "; "
    empty_text: ""

  - id: proc_aorta_toracica
    type: multi
    required: false
    required_if_procedimiento_grupo: [Aorta torácica / congénitas del adulto]
    label: Procedimiento específico — aorta
    options:
      - Reemplazo de aorta ascendente con tubo recto (Dacrón)
      - Procedimiento de Bentall-De Bono
      - Preservación valvular aórtica (David / Yacoub)
      - Cirugía de arco aórtico — trompa de elefante / elephant trunk
      - Cirugía de arco aórtico — reimplante de troncos supraaórticos
    join: "; "
    empty_text: ""

  - id: troncos_supraaorticos_reimplantados
    type: multi
    required: false
    required_if_proc_aorta_toracica: [Cirugía de arco aórtico — reimplante de troncos supraaórticos]
    label: Troncos supraaórticos reimplantados
    options:
      - Tronco braquiocefálico
      - Carótida común izquierda
      - Subclavia izquierda
    join: ", "
    empty_text: ""

  - id: proc_congenitas_adulto
    type: multi
    required: false
    required_if_procedimiento_grupo: [Aorta torácica / congénitas del adulto]
    label: Congénitas adulto / corrección
    options:
      - Cierre de CIA / CIV
      - Coartación aórtica
      - Miectomía septal (Morrow / Symmetry en MCH)
    join: "; "
    empty_text: ""

  - id: gradiente_septal_post_mmhg
    type: free
    required: false
    required_if_proc_congenitas_adulto: [Miectomía septal (Morrow / Symmetry en MCH)]
    label: Gradiente de salida del VI post-resección (mmHg)
    empty_text: ""

  # ========== 5. Soporte / marcapasos / cierre ==========
  - id: soporte_circulatorio
    type: multi
    required: false
    required_if_procedimiento_grupo: [Soporte circulatorio / marcapasos / cierre]
    label: Asistencia circulatoria / soporte
    options:
      - Balón de contrapulsación intraaórtico (BCIAo)
      - ECMO veno-arterial (VA)
      - Impella
    join: "; "
    empty_text: ""

  - id: via_bciao
    type: single
    required: false
    required_if_soporte_circulatorio: [Balón de contrapulsación intraaórtico (BCIAo)]
    label: Vía BCIAo
    options: [Femoral, Central]
    empty_text: ""

  - id: indicacion_soporte_circulatorio
    type: single
    required: false
    required_if_soporte_circulatorio:
      - Balón de contrapulsación intraaórtico (BCIAo)
      - ECMO veno-arterial (VA)
      - Impella
    label: Indicación del soporte circulatorio
    options:
      - Profiláctico (preoperatorio)
      - Rescate — falla de destete de CEC
      - Rescate — shock postoperatorio
    empty_text: ""

  - id: marcapasos_epicardico
    type: multi
    required: false
    required_if_procedimiento_grupo: [Soporte circulatorio / marcapasos / cierre]
    label: Cables de marcapasos epicárdico
    options:
      - Ventricular
      - Auricular
    join: ", "
    empty_text: ""

  - id: salida_marcapasos
    type: single
    required: false
    required_if_marcapasos_epicardico: [Ventricular, Auricular]
    label: Salida de cables de marcapasos
    options:
      - Pared abdominal
      - Pared torácica
    empty_text: ""

  - id: protamina
    type: single
    required: false
    required_if_procedimiento_grupo: [Soporte circulatorio / marcapasos / cierre]
    label: Neutralización de heparina con protamina
    options:
      - Completa
      - Parcial
    empty_text: ""

  - id: drenajes_toracicos_cv
    type: multi
    required: false
    required_if_procedimiento_grupo: [Soporte circulatorio / marcapasos / cierre]
    label: Drenajes torácicos
    options:
      - Pericárdico
      - Mediastínico anterior
      - Pleural derecho
      - Pleural izquierdo
    join: ", "
    empty_text: ""

  - id: osteosintesis_esternal
    type: single
    required: false
    required_if_procedimiento_grupo: [Soporte circulatorio / marcapasos / cierre]
    label: Osteosíntesis esternal
    options:
      - Alambres de acero quirúrgico
      - Placas rígidas de titanio
    empty_text: ""

  - id: alambres_esternales_numero
    type: free
    required: false
    required_if_osteosintesis_esternal: [Alambres de acero quirúrgico]
    label: Número de alambres esternales
    empty_text: ""

  - id: alambres_esternales_patron
    type: single
    required: false
    required_if_osteosintesis_esternal: [Alambres de acero quirúrgico]
    label: Patrón de alambres
    options: [Simple, En 8]
    empty_text: ""

plantilla_texto: |
  Cardiovascular — {{procedimiento_grupo}}. Carácter {{caracter_cirugia}}. Abordaje {{abordaje}}{{conversion_causa}}. Reexploración sangrado {{reexploracion_sangrado}}.
  CEC: vía {{via_abordaje_cv}} {{esternotomia_tipo}} reesternotomía {{riesgo_reesternotomia}}; toracotomía {{lateralidad_toracotomia}}; canulación art. {{canulacion_arterial}} ven. {{canulacion_venosa}}; cardioplejía {{cardioplejia_via}} {{cardioplejia_solucion}}; CEC {{tiempo_cec_min}} min; clampeo {{tiempo_clampeo_aortico_cv_min}} min; paro hipotérmico {{paro_circulatorio_hipotermico}} {{temperatura_central_paro_c}} °C {{tiempo_paro_circulatorio_min}} min; destete {{destete_cec}}.
  CRM: {{indicacion_crm}}{{indicacion_crm_otro}}; {{tecnica_crm}} estabilizador {{estabilizador_offpump}}; art. {{injertos_arteriales}} LIMA→{{anastomosis_lima}}{{anastomosis_lima_otro}} RIMA→{{anastomosis_rima}} Radial→{{anastomosis_radial}}; safena {{injerto_safena}} receptores {{vasos_receptores_safena}}{{vasos_receptores_safena_otro}}; proximales n={{numero_puentes_proximales}} clampeo parcial {{clampeo_parcial_aorta}}; TTFM {{flujometria_ttfm}}.
  Valvular: {{valvula_abordada}}; Ao {{indicacion_aortica_valvular}} {{proc_aortica_valvular}} {{protesis_aortica_tipo}} {{protesis_aortica_marca}} ETE {{ete_post_aortica}}; Mi {{indicacion_mitral}} {{proc_mitral}} {{plastica_mitral_detalle}} {{protesis_mitral_marca}} ETE {{ete_post_mitral}}; Tri {{indicacion_tricuspide}} {{proc_tricuspide}} ETE {{ete_post_tricuspide}}; revisión {{resultado_revision_valvular}}.
  Aorta/cong: {{patologia_aorta_toracica}}; {{proc_aorta_toracica}} troncos {{troncos_supraaorticos_reimplantados}}; {{proc_congenitas_adulto}} gradiente septal {{gradiente_septal_post_mmhg}} mmHg.
  Soporte/cierre: {{soporte_circulatorio}} vía BCIAo {{via_bciao}} indicación {{indicacion_soporte_circulatorio}}; MP {{marcapasos_epicardico}} salida {{salida_marcapasos}}; protamina {{protamina}}; drenajes {{drenajes_toracicos_cv}}; esternón {{osteosintesis_esternal}} n={{alambres_esternales_numero}} {{alambres_esternales_patron}}.
```

---

## Notas (OK de semilla)

1. `procedimiento_grupo` **single**. Transversales: `caracter_cirugia`,
   `reexploracion_sangrado` (todo el módulo).
2. Validación: criterio AnesFact (Diego), **no** cirujano cardiovascular
   ni Dra. Huerta (ver cabecera) — salvedad se mantiene.
3. §1: destete CEC; riesgo reesternotomía (si Reoperación).
4. §2: indicación multi; TTFM.
5. §3: indicación por válvula; ETE post-implante por válvula;
   `resultado_revision_valvular` si ETE = revisión.
6. §4: troncos supraaórticos si reimplante; gradiente septal post
   (miectomía Morrow).
7. §5: indicación soporte; protamina; drenajes; osteosíntesis.
8. Numéricos sin `empty_text` inventado. Convertido + causa.
9. Gatillos consideraciones (CEC/ACT, paro hipotérmico, off-pump,
   protamina, ETE, destete) → roadmap P2; no slots — mayor densidad
   de coordinación del catálogo.
10. Bruto (5 secciones) + 9 correcciones + hallazgos post-tandas
    versionados acá.
