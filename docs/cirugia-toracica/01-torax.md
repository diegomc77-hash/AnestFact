# Módulo — Cirugía Torácica (Tórax)

**id:** `ct-torax-v1` · especialidad: Cirugía Torácica ·  
**Estado:** esqueleto de slots — **OK de semilla** (2026-09-14). Motor P2
pendiente. Validación: criterio AnesFact (Diego), no cirujano torácico ni
Dra. Huerta (ver § Validación clínica).

Índice: [README.md](README.md) · Hallazgos: [HALLAZGOS_ESQUELETO.md](HALLAZGOS_ESQUELETO.md)

Consentimiento / gasas / ATB = cáscara A4 de Foja Qx (no van acá).

## Validación clínica (leer antes de auditar)

**Este módulo no tiene el mismo nivel de validación directa que Cabeza y
Cuello ni Cirugía General.** CyC y CG fueron validados por la Dra. Huerta
en su disciplina. Ella **no** es cirujana torácica: el primer bosquejo
y las correcciones aplicadas aquí son **criterio clínico del equipo
AnesFact (Diego)**, no de un/a especialista en cirugía torácica. Si un
día lo revisa un/a cirujano/a torácico/a real, debe partir de ese
supuesto y no asumir paridad de validación con CyC/CG.

## Regla 3 / consideraciones (fase aparte P2 — no slots qx)

- Cirugía con aislamiento pulmonar / tórax abierto → gatillo ventilación
  selectiva a `S.cur.foja.consideraciones` (no slot qx de ventilación).

## Correcciones aplicadas al bosquejo (primera pasada)

1. Hermeticidad muñón / línea de sutura pulmonar (etiqueta unificada).
2. Regla 1: nervio frénico + recurrente laríngeo izquierdo (+ No aplica).
3. Indicación/diagnóstico resección pulmonar (multi).
4. Drenaje pleural: `calibre_fr` + `ubicacion` separados.
5. Indicación decorticación/pleurodesis (Empiema / Hemotórax / Otro).
6. Dx presuntivo mediastino condicionado por compartimento.
7. Extensión de timectomía (simple / extendida).
8. Hermeticidad post-refuerzo en fístula broncopleural.
9. Reexpansión: Sí / No / **No evaluada**.

---

## Proforma — Cirugía torácica

```text
id:            ct-torax-v1
especialidad:  "Cirugía Torácica"
operaciones: [
  "Neumonectomía / lobectomía / segmentectomía / wedge",
  "Decorticación / pleurodesis",
  "Cirugía de mediastino / timectomía",
  "Fístula broncopleural / reintervención"
]
titulo: "Cirugía torácica"

slots:

  # ========== Índice ==========
  - id: procedimiento_grupo
    type: single
    required: true
    label: Procedimiento / foco
    options:
      - Resección pulmonar
      - Cirugía de la pleura (decorticación / pleurodesis)
      - Mediastino / timectomía
      - Fístula broncopleural / reintervención

  - id: abordaje
    type: single
    required: true
    label: Abordaje
    options:
      - VATS / toracoscopía
      - Robótico
      - Toracotomía posterolateral
      - Toracotomía anterior / axilar
      - Esternotomía mediana
      - Convertido a abierto
    # Aislamiento pulmonar / tórax → gatillo consideraciones; no slot qx.

  - id: conversion_causa
    type: free
    required: false
    required_if_abordaje: [Convertido a abierto]
    label: Causa de conversión
    empty_text: ""

  - id: lateralidad
    type: single
    required: true
    label: Lateralidad
    options:
      - Derecha
      - Izquierda
      - Bilateral
      - No aplica (abordaje central / mediastínico)
    empty_text: ""
    # Esternotomía mediana / acceso mediastínico central → «No aplica…».

  # ========== 1. Resección pulmonar ==========
  - id: tipo_reseccion_pulmonar
    type: single
    required: false
    required_if_procedimiento_grupo: [Resección pulmonar]
    label: Tipo de resección
    options:
      - Neumonectomía
      - Lobectomía
      - Segmentectomía
      - Resección en manguito (sleeve bronquial / broncoplástica)
      - Wedge / resección atípica
    empty_text: ""

  - id: lobulo_reseccion
    type: multi
    required: false
    required_if_tipo_reseccion_pulmonar: [Lobectomía, Segmentectomía]
    label: Lóbulo(s) / segmento(s) abordado(s)
    options:
      - Superior derecho
      - Medio derecho
      - Inferior derecho
      - Superior izquierdo
      - Inferior izquierdo
      - Segmento(s) — detalle en texto
    join: ", "
    empty_text: ""

  - id: lobulo_reseccion_detalle
    type: free
    required: false
    required_if_lobulo_reseccion: [Segmento(s) — detalle en texto]
    label: Segmento(s) — detalle
    empty_text: ""

  - id: indicacion_reseccion_pulmonar
    type: multi
    required: false
    required_if_procedimiento_grupo: [Resección pulmonar]
    label: Indicación / diagnóstico
    options:
      - Neoplasia primaria de pulmón
      - Metástasis pulmonar
      - Bronquiectasias / infección localizada
      - Tuberculosis / secuelas
      - Malformación congénita
      - Trauma
      - Otro
    join: "; "
    empty_text: ""

  - id: indicacion_reseccion_pulmonar_otro
    type: free
    required: false
    required_if_indicacion_reseccion_pulmonar: [Otro]
    label: Indicación / diagnóstico (otro)
    empty_text: ""

  - id: linfadenectomia_toracica
    type: single
    required: false
    required_if_tipo_reseccion_pulmonar: [Neumonectomía, Lobectomía, Segmentectomía, Resección en manguito (sleeve bronquial / broncoplástica)]
    label: Linfadenectomía mediastínica / hiliar
    options:
      - Sistemática
      - Sampling
      - No realizada
      - No aplica
    empty_text: ""

  - id: hermeticidad_munon_bronquial
    type: single
    required: false
    required_if_tipo_reseccion_pulmonar:
      - Neumonectomía
      - Lobectomía
      - Segmentectomía
      - Resección en manguito (sleeve bronquial / broncoplástica)
    label: Prueba de hermeticidad (muñón bronquial / línea de sutura pulmonar)
    options:
      - Fuga demostrada
      - Sin fuga demostrada
      - No realizada
    empty_text: ""
    # No requerida en Wedge (menor riesgo).

  - id: nervio_frenico
    type: single
    required: false
    required_if_tipo_reseccion_pulmonar: [Neumonectomía, Lobectomía]
    label: Nervio frénico
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
      - No aplica
    empty_text: ""

  - id: nervio_recurrente_izquierdo
    type: single
    required: false
    required_if_tipo_reseccion_pulmonar: [Neumonectomía, Lobectomía]
    label: Nervio laríngeo recurrente izquierdo
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
      - No aplica
    empty_text: ""
    # «No aplica» p. ej. resección derecha sin disección de aorto-pulmonar.

  - id: estructura_critica_detalle
    type: free
    required: false
    label: Detalle de lesión de estructura crítica (si aplica)
    empty_text: ""

  # ========== 2. Pleura ==========
  - id: gesto_pleural
    type: multi
    required: false
    required_if_procedimiento_grupo: [Cirugía de la pleura (decorticación / pleurodesis)]
    label: Gesto pleural
    options:
      - Decorticación
      - Pleurodesis (talcaje / química / mecánica)
      - Evacuación de hemotórax / empiema
    join: "; "
    empty_text: ""

  - id: indicacion_pleura
    type: single
    required: false
    required_if_procedimiento_grupo: [Cirugía de la pleura (decorticación / pleurodesis)]
    label: Indicación
    options:
      - Empiema
      - Hemotórax retenido
      - Otro
    empty_text: ""

  - id: indicacion_pleura_otro
    type: free
    required: false
    required_if_indicacion_pleura: [Otro]
    label: Indicación (otro)
    empty_text: ""

  - id: reexpansion_pulmonar
    type: single
    required: false
    required_if_procedimiento_grupo: [Cirugía de la pleura (decorticación / pleurodesis)]
    label: Reexpansión pulmonar comprobada
    options: [Sí, No, No evaluada]
    empty_text: ""

  - id: campo_pleura
    type: single
    required: false
    required_if_procedimiento_grupo: [Cirugía de la pleura (decorticación / pleurodesis)]
    label: Clasificación del campo
    options: [Limpio, Limpio-contaminado, Contaminado]
    empty_text: ""

  # ========== 3. Mediastino / timectomía ==========
  - id: compartimento_mediastino
    type: single
    required: false
    required_if_procedimiento_grupo: [Mediastino / timectomía]
    label: Compartimento mediastínico
    options: [Anterior, Medio, Posterior]
    empty_text: ""

  - id: dx_presuntivo_mediastino_anterior
    type: single
    required: false
    required_if_compartimento_mediastino: [Anterior]
    label: Diagnóstico presuntivo (mediastino anterior)
    options:
      - Timoma
      - Linfoma
      - Tumor de células germinales (teratoma)
      - Bocio endotorácico
      - Otro
    empty_text: ""

  - id: dx_presuntivo_mediastino_medio
    type: single
    required: false
    required_if_compartimento_mediastino: [Medio]
    label: Diagnóstico presuntivo (mediastino medio)
    options:
      - Quiste broncogénico
      - Linfadenopatía
      - Otro
    empty_text: ""

  - id: dx_presuntivo_mediastino_posterior
    type: single
    required: false
    required_if_compartimento_mediastino: [Posterior]
    label: Diagnóstico presuntivo (mediastino posterior)
    options:
      - Tumor neurogénico (Schwannoma / Neurofibroma)
      - Otro
    empty_text: ""

  - id: dx_presuntivo_mediastino_otro
    type: free
    required: false
    required_if_dx_presuntivo_mediastino_anterior: [Otro]
    required_if_dx_presuntivo_mediastino_medio: [Otro]
    required_if_dx_presuntivo_mediastino_posterior: [Otro]
    label: Diagnóstico presuntivo (otro)
    empty_text: ""
    # OR entre required_if_* (cualquiera «Otro»).

  - id: gesto_mediastino
    type: multi
    required: false
    required_if_procedimiento_grupo: [Mediastino / timectomía]
    label: Gesto
    options:
      - Resección de masa / tumor mediastínico
      - Timectomía
      - Biopsia / muestreo ganglionar
    join: "; "
    empty_text: ""

  - id: extension_timectomia
    type: single
    required: false
    required_if_gesto_mediastino: [Timectomía]
    label: Extensión de la timectomía
    options:
      - Timectomía simple
      - Timectomía extendida (con grasa perithímica)
    empty_text: ""

  - id: nervio_frenico_mediastino
    type: single
    required: false
    required_if_procedimiento_grupo: [Mediastino / timectomía]
    label: Nervio frénico (mediastino)
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
      - No aplica
    empty_text: ""

  - id: nervio_recurrente_izquierdo_mediastino
    type: single
    required: false
    required_if_procedimiento_grupo: [Mediastino / timectomía]
    label: Nervio laríngeo recurrente izquierdo (mediastino)
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
      - No aplica
    empty_text: ""

  # ========== 4. Fístula broncopleural ==========
  - id: fistula_gesto
    type: multi
    required: false
    required_if_procedimiento_grupo: [Fístula broncopleural / reintervención]
    label: Gesto sobre fístula / muñón
    options:
      - Identificación de fístula broncopleural
      - Refuerzo del muñón bronquial
      - Resutura / reamputación de muñón
      - Cobertura con colgajo / tejido pediculado
    join: "; "
    empty_text: ""

  - id: hermeticidad_post_refuerzo_fistula
    type: single
    required: false
    required_if_fistula_gesto: [Refuerzo del muñón bronquial, Resutura / reamputación de muñón, Cobertura con colgajo / tejido pediculado]
    label: Prueba de hermeticidad tras refuerzo / reparación del muñón
    options:
      - Fuga demostrada
      - Sin fuga demostrada
      - No realizada
    empty_text: ""

  - id: campo_fistula
    type: single
    required: false
    required_if_procedimiento_grupo: [Fístula broncopleural / reintervención]
    label: Clasificación del campo
    options: [Limpio, Limpio-contaminado, Contaminado]
    empty_text: ""

  # ========== 5. Drenaje pleural (compartido) ==========
  - id: drenaje_pleural
    type: single
    required: false
    label: Drenaje / tubo(s) de tórax
    options: [Sí, Sin drenaje]
    empty_text: ""

  - id: drenaje_pleural_calibre_fr
    type: free
    required: false
    required_if_drenaje_pleural: [Sí]
    label: Drenaje pleural — calibre (Fr)
    empty_text: ""

  - id: drenaje_pleural_ubicacion
    type: single
    required: false
    required_if_drenaje_pleural: [Sí]
    label: Drenaje pleural — ubicación
    options:
      - 5to espacio intercostal
      - Apical
      - Basal
      - Otro
    empty_text: ""

  - id: drenaje_pleural_ubicacion_otro
    type: free
    required: false
    required_if_drenaje_pleural_ubicacion: [Otro]
    label: Drenaje pleural — ubicación (otro)
    empty_text: ""

  - id: drenaje_pleural_cantidad
    type: free
    required: false
    required_if_drenaje_pleural: [Sí]
    label: Cantidad de tubos
    empty_text: ""

plantilla_texto: |
  Torácica — {{procedimiento_grupo}}. Abordaje: {{abordaje}}{{conversion_causa}}. Lateralidad {{lateralidad}}.
  Resección: {{tipo_reseccion_pulmonar}} {{lobulo_reseccion}}{{lobulo_reseccion_detalle}}; indicación {{indicacion_reseccion_pulmonar}}{{indicacion_reseccion_pulmonar_otro}}; linfadenectomía {{linfadenectomia_toracica}}; hermeticidad muñón {{hermeticidad_munon_bronquial}}; frénico {{nervio_frenico}}; recurrente izq. {{nervio_recurrente_izquierdo}}{{estructura_critica_detalle}}.
  Pleura: {{gesto_pleural}}; indicación {{indicacion_pleura}}{{indicacion_pleura_otro}}; reexpansión {{reexpansion_pulmonar}}; campo {{campo_pleura}}.
  Mediastino: {{compartimento_mediastino}}; dx ant. {{dx_presuntivo_mediastino_anterior}} / medio {{dx_presuntivo_mediastino_medio}} / post. {{dx_presuntivo_mediastino_posterior}}{{dx_presuntivo_mediastino_otro}}; gesto {{gesto_mediastino}}; timectomía {{extension_timectomia}}; frénico {{nervio_frenico_mediastino}}; recurrente izq. {{nervio_recurrente_izquierdo_mediastino}}.
  Fístula: {{fistula_gesto}}; hermeticidad post-refuerzo {{hermeticidad_post_refuerzo_fistula}}; campo {{campo_fistula}}.
  Drenaje: {{drenaje_pleural}} Fr {{drenaje_pleural_calibre_fr}} {{drenaje_pleural_ubicacion}}{{drenaje_pleural_ubicacion_otro}} n={{drenaje_pleural_cantidad}}.
```

---

## Notas (OK de semilla)

1. `procedimiento_grupo` **single**. Tipografía **Lateralidad** (+ opción
   **No aplica (abordaje central / mediastínico)** p. ej. esternotomía).
2. Validación: criterio AnesFact (Diego), **no** cirujano torácico ni
   Dra. Huerta (ver cabecera) — mantener hasta revisión por especialista.
3. Ventilación selectiva → solo `foja.consideraciones` (no slot qx).
4. Hermeticidad unificada en muñón pulmonar y post-refuerzo fístula;
   no forzada en Wedge.
5. Regla 1: frénico + recurrente izquierdo (+ **No aplica**) en
   Neumonectomía/Lobectomía y en mediastino (IDs distintos; grupos
   mutuamente excluyentes — no duplicación tipo M5).
6. Dx mediastino condicionado por compartimento; timectomía simple/
   extendida si gesto Timectomía.
7. Drenaje: Sí / **Sin drenaje**; calibre Fr y ubicación separados;
   numéricos sin `empty_text` inventado.
8. Reexpansión: Sí / No / **No evaluada**.
9. Convertido + causa. Campo L/LC/C en pleura/fístula.
