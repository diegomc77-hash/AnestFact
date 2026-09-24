# Módulo 3 — Pancreático y Biliar

**id:** `cg-pancreato-biliar-v1` · especialidad: Cirugía General ·  
**Estado:** esqueleto de slots — **OK de semilla** (2026-09-14). Motor P2
pendiente.

Índice: [README.md](README.md) · Hallazgos: [HALLAZGOS_ESQUELETO.md](HALLAZGOS_ESQUELETO.md)

Consentimiento / gasas / ATB = cáscara A4 de Foja Qx (no van acá).

Hallazgos aplicados: VBP≠CVS; textura+Wirsung; vascular electivo vs
`evento_vascular_no_planificado`; `piloro_final`; Kehr; conversión+causa;
amilasa Programado/No/No aplica; L/LC/C en urgencia/contaminación;
hermeticidad unificada en anastomosis digestivas (hepaticoyeyuno,
gastroentero) — confirmado Huerta; esplenectomía/Warshaw si corporocaudal;
CIO unificado; handoff lesión VBP → reconstrucción.

---

## Proforma — Pancreático y biliar

```text
id:            cg-pancreato-biliar-v1
especialidad:  "Cirugía General"
operaciones: [
  "Duodenopancreatectomía / Whipple",
  "Pancreatectomía distal / central / total / enucleación",
  "Exploración / derivación de vía biliar",
  "Reconstrucción de lesión de vía biliar",
  "Colecistectomía"
]
titulo: "Cirugía pancreática y biliar"

slots:

  # ========== Índice ==========
  - id: procedimiento_grupo
    type: single
    required: true
    label: Procedimiento / foco
    options:
      - Pancreatectomía / resección pancreática
      - Vía biliar / derivaciones / reconstrucción
      - Colecistectomía / procedimientos vesiculares

  - id: abordaje
    type: single
    required: true
    label: Abordaje
    options:
      - Abierto / laparotómico
      - Laparoscópico
      - Robótico
      - Convertido a abierto

  - id: conversion_causa
    type: free
    required: false
    required_if_abordaje: [Convertido a abierto]
    label: Causa de conversión
    empty_text: ""

  # ========== 1. Pancreatectomías ==========
  - id: tipo_reseccion_pancreas
    type: single
    required: false
    required_if_procedimiento_grupo: [Pancreatectomía / resección pancreática]
    label: Tipo de resección
    options:
      - Duodenopancreatectomía cefálica (DPC / Whipple)
      - DPC con preservación pilórica (Traverso-Longmire)
      - Pancreatectomía corporocaudal (distal)
      - Pancreatectomía central / resección segmentaria
      - Pancreatectomía total
      - Enucleación de neoplasia / tumor neuroendocrino
    empty_text: ""

  - id: piloro_final
    type: single
    required: false
    required_if_tipo_reseccion_pancreas: [DPC con preservación pilórica (Traverso-Longmire)]
    label: Estado final del píloro
    options:
      - Píloro preservado
      - Conversión a antrectomía durante el acto
    empty_text: ""

  - id: esplenectomia_asociada
    type: single
    required: false
    required_if_tipo_reseccion_pancreas: [Pancreatectomía corporocaudal (distal)]
    label: Esplenectomía asociada
    options:
      - Sí (distal con esplenectomía)
      - No — técnica de Warshaw
      - No — preservación de vasos esplénicos
    empty_text: ""

  - id: linfadenectomia_pancreas
    type: single
    required: false
    required_if_procedimiento_grupo: [Pancreatectomía / resección pancreática]
    label: Linfadenectomía
    options: [Estándar, Extendida, No aplica]
    empty_text: ""

  - id: reseccion_vascular_electiva
    type: multi
    required: false
    required_if_procedimiento_grupo: [Pancreatectomía / resección pancreática]
    label: Compromiso / resección vascular (electiva oncológica)
    options:
      - Venosa (VMS / porta)
      - Arterial (hepática / tronco celíaco)
    join: ", "
    empty_text: ""
    # Vacío = sin resección vascular electiva. Multi permite Venosa + Arterial.

  - id: reconstruccion_vascular
    type: single
    required: false
    required_if_reseccion_vascular_electiva:
      - Venosa (VMS / porta)
      - Arterial (hepática / tronco celíaco)
    label: Reconstrucción vascular
    options:
      - Anastomosis primaria
      - Injerto autólogo / sintético
    empty_text: ""

  - id: evento_vascular_no_planificado
    type: single
    required: false
    required_if_procedimiento_grupo: [Pancreatectomía / resección pancreática]
    label: Evento vascular no planificado
    options:
      - Sin eventos
      - Lesión vascular no planificada — controlada
      - Lesión vascular no planificada — requirió reconstrucción de urgencia
    empty_text: ""

  - id: pancreas_textura
    type: single
    required: false
    required_if_tipo_reseccion_pancreas:
      - Duodenopancreatectomía cefálica (DPC / Whipple)
      - DPC con preservación pilórica (Traverso-Longmire)
      - Pancreatectomía corporocaudal (distal)
      - Pancreatectomía central / resección segmentaria
    label: Textura del páncreas remanente
    options: [Blando, Fibroso-duro]
    empty_text: ""

  - id: wirsung_mm
    type: free
    required: false
    required_if_tipo_reseccion_pancreas:
      - Duodenopancreatectomía cefálica (DPC / Whipple)
      - DPC con preservación pilórica (Traverso-Longmire)
      - Pancreatectomía corporocaudal (distal)
      - Pancreatectomía central / resección segmentaria
    label: Diámetro Wirsung (mm)
    empty_text: ""

  - id: anastomosis_pancreatica_tipo
    type: single
    required: false
    required_if_tipo_reseccion_pancreas:
      - Duodenopancreatectomía cefálica (DPC / Whipple)
      - DPC con preservación pilórica (Traverso-Longmire)
    label: Anastomosis pancreática — tipo
    options:
      - Pancreatoyeyunoanastomosis
      - Pancreatogastroanastomosis
    empty_text: ""

  - id: anastomosis_pancreatica_tecnica
    type: multi
    required: false
    required_if_anastomosis_pancreatica_tipo:
      - Pancreatoyeyunoanastomosis
      - Pancreatogastroanastomosis
    label: Anastomosis pancreática — técnica
    options:
      - Invaginante
      - Ducto-mucosa (duct-to-mucosa)
      - Sutura con tutor intraductal / stent
    join: ", "
    empty_text: ""

  - id: anastomosis_biliar_dpc
    type: single
    required: false
    required_if_tipo_reseccion_pancreas:
      - Duodenopancreatectomía cefálica (DPC / Whipple)
      - DPC con preservación pilórica (Traverso-Longmire)
    label: Anastomosis biliar (DPC)
    options:
      - Hepaticoyeyunoanastomosis (término-lateral en Y de Roux)
      - Coledocoyeyunoanastomosis
    empty_text: ""

  - id: hermeticidad_biliar_dpc
    type: single
    required: false
    required_if_anastomosis_biliar_dpc:
      - Hepaticoyeyunoanastomosis (término-lateral en Y de Roux)
      - Coledocoyeyunoanastomosis
    label: Prueba de hermeticidad (anastomosis biliar)
    options:
      - Fuga demostrada
      - Sin fuga demostrada
      - No realizada
    empty_text: ""

  - id: anastomosis_digestiva_dpc
    type: single
    required: false
    required_if_tipo_reseccion_pancreas:
      - Duodenopancreatectomía cefálica (DPC / Whipple)
      - DPC con preservación pilórica (Traverso-Longmire)
    label: Anastomosis digestiva (DPC)
    options:
      - Gastroyeyunoanastomosis
      - Duodenoyeyunoanastomosis
    empty_text: ""

  - id: anastomosis_digestiva_ruta
    type: single
    required: false
    required_if_anastomosis_digestiva_dpc:
      - Gastroyeyunoanastomosis
      - Duodenoyeyunoanastomosis
    label: Ruta de la anastomosis digestiva
    options: [Antecólica, Retrócolica]
    empty_text: ""

  - id: hermeticidad_digestiva_dpc
    type: single
    required: false
    required_if_anastomosis_digestiva_dpc:
      - Gastroyeyunoanastomosis
      - Duodenoyeyunoanastomosis
    label: Prueba de hermeticidad (anastomosis digestiva)
    options:
      - Fuga demostrada
      - Sin fuga demostrada
      - No realizada
    empty_text: ""

  # ========== 2. Vía biliar ==========
  - id: proc_via_biliar
    type: single
    required: false
    required_if_procedimiento_grupo: [Vía biliar / derivaciones / reconstrucción]
    label: Procedimiento de vía biliar
    options:
      - Exploración / coledocotomía + extracción de litiasis
      - Exploración transcística de vía biliar
      - Derivación biliodigestiva
      - Reconstrucción por lesión iatrogénica de vía biliar
    empty_text: ""

  - id: tipo_derivacion_biliodigestiva
    type: single
    required: false
    required_if_proc_via_biliar: [Derivación biliodigestiva]
    label: Tipo de derivación biliodigestiva
    options:
      - Coledocoduodenoanastomosis
      - Hepaticoyeyunoanastomosis en Y de Roux
    empty_text: ""

  - id: hermeticidad_derivacion
    type: single
    required: false
    required_if_proc_via_biliar: [Derivación biliodigestiva]
    label: Prueba de hermeticidad (derivación)
    options:
      - Fuga demostrada
      - Sin fuga demostrada
      - No realizada
    empty_text: ""

  - id: clasificacion_lesion_vbp
    type: single
    required: false
    required_if_proc_via_biliar: [Reconstrucción por lesión iatrogénica de vía biliar]
    label: Clasificación Strasberg (lesión)
    options:
      - Tipo A
      - Tipo B
      - Tipo C
      - Tipo D
      - Tipo E1
      - Tipo E2
      - Tipo E3
      - Tipo E4
      - Tipo E5
    empty_text: ""

  - id: vbp_integridad_via
    type: single
    required: false
    required_if_procedimiento_grupo: [Vía biliar / derivaciones / reconstrucción]
    label: Integridad de vía biliar principal
    options:
      - Identificada y preservada
      - Lesión identificada intraoperatoriamente
      - No disecada
    empty_text: ""

  - id: instrumentacion_biliar
    type: multi
    required: false
    required_if_procedimiento_grupo: [Vía biliar / derivaciones / reconstrucción]
    label: Instrumentación
    options:
      - Coledocoscopía directa / fibroendoscopía
      - Colangiografía intraoperatoria (CIO)
      - Extracción con cesta de Dormia / catéter Fogarty
    join: ", "
    empty_text: ""

  - id: cio_hallazgos
    type: multi
    required: false
    required_if_instrumentacion_biliar: [Colangiografía intraoperatoria (CIO)]
    label: Hallazgos CIO
    options:
      - Vía biliar expedita
      - Litiasis de VBP
      - Fuga / variaciones anatómicas
    join: ", "
    empty_text: ""

  - id: drenaje_biliar_colocado
    type: multi
    required: false
    required_if_procedimiento_grupo: [Vía biliar / derivaciones / reconstrucción]
    label: Drenaje biliar colocado
    options:
      - Tubo de Kehr (T-tube / tubo en T)
      - Stent / tutor biliar transanastomótico
      - Drenaje transcístico
    join: ", "
    empty_text: ""
    # Vacío = sin drenaje biliar.

  # ========== 3. Colecistectomía ==========
  - id: hallazgos_vesicula
    type: multi
    required: false
    required_if_procedimiento_grupo: [Colecistectomía / procedimientos vesiculares]
    label: Hallazgos intraoperatorios
    options:
      - Colecistitis aguda
      - Colecistitis aguda enfisematosa
      - Colecistitis aguda gangrenosa
      - Piocolecisto
      - Colecistitis crónica litiásica / escleroatrófica
      - Plastrón
      - Síndrome de Mirizzi
    join: ", "
    empty_text: ""

  - id: mirizzi_grado
    type: single
    required: false
    required_if_hallazgos_vesicula: [Síndrome de Mirizzi]
    label: Mirizzi — grado
    options: [I, II, III, IV]
    empty_text: ""

  - id: cvs_strasberg
    type: single
    required: false
    required_if_procedimiento_grupo: [Colecistectomía / procedimientos vesiculares]
    label: Visión de seguridad de Strasberg (CVS)
    options: [Lograda, No lograda]
    empty_text: ""

  - id: vbp_integridad_cole
    type: single
    required: false
    required_if_procedimiento_grupo: [Colecistectomía / procedimientos vesiculares]
    label: Integridad de vía biliar principal
    options:
      - Identificada y preservada
      - Lesión identificada intraoperatoriamente
      - No disecada
    empty_text: ""

  - id: vbp_lesion_detalle
    type: free
    required: false
    label: Detalle de lesión VBP / Strasberg-Bismuth (si aplica)
    empty_text: ""

  - id: handoff_reconstruccion_vbp
    type: single
    required: false
    required_if_vbp_integridad_cole: [Lesión identificada intraoperatoriamente]
    label: Handoff
    options:
      - Sí — completar en foco «Vía biliar / derivaciones / reconstrucción» (misma foja)
      - No — diferida / otro equipo
    empty_text: ""

  - id: tecnica_colecistectomia
    type: single
    required: false
    required_if_procedimiento_grupo: [Colecistectomía / procedimientos vesiculares]
    label: Técnica / resección
    options:
      - Colecistectomía total retrógrada
      - Colecistectomía total anterógrada
      - Colecistectomía subtotal / de rescate — fenestrada
      - Colecistectomía subtotal / de rescate — reconstitutiva
    empty_text: ""

  - id: cio_cole
    type: single
    required: false
    required_if_procedimiento_grupo: [Colecistectomía / procedimientos vesiculares]
    label: Colangiografía intraoperatoria (CIO)
    options:
      - No realizada
      - Realizada
    empty_text: ""

  - id: cio_cole_hallazgos
    type: multi
    required: false
    required_if_cio_cole: [Realizada]
    label: Hallazgos CIO (colecistectomía)
    options:
      - Vía biliar expedita
      - Litiasis de VBP
      - Fuga / variaciones anatómicas
    join: ", "
    empty_text: ""

  - id: clipado_cistico
    type: multi
    required: false
    required_if_procedimiento_grupo: [Colecistectomía / procedimientos vesiculares]
    label: Ligadura / clipado (cístico / arteria cística)
    options:
      - Clips titanio
      - Clips polímero (Hem-o-lok)
      - Sutura monofilamento / ligadura manual
    join: ", "
    empty_text: ""

  - id: campo_cole
    type: single
    required: false
    required_if_hallazgos_vesicula:
      - Colecistitis aguda
      - Colecistitis aguda enfisematosa
      - Colecistitis aguda gangrenosa
      - Piocolecisto
      - Plastrón
    label: Clasificación del campo
    options: [Limpio, Limpio-contaminado, Contaminado]
    empty_text: ""

  # ========== 4. Drenajes / amilasa ==========
  - id: drenaje_celda_hepatica
    type: single
    required: false
    label: Drenaje en celda hepática / lecho vesicular
    options: [Sí, Sin drenaje]
    empty_text: ""

  - id: drenaje_celda_detalle
    type: free
    required: false
    required_if_drenaje_celda_hepatica: [Sí]
    label: Celda hepática — cantidad / tipo
    empty_text: ""

  - id: drenaje_pancreatoyeyuno
    type: single
    required: false
    label: Drenaje en pancreatoyeyuno / hepaticoyeyuno
    options: [Sí, Sin drenaje]
    empty_text: ""

  - id: drenaje_pancreatoyeyuno_detalle
    type: free
    required: false
    required_if_drenaje_pancreatoyeyuno: [Sí]
    label: Pancreatoyeyuno / hepaticoyeyuno — cantidad / tipo
    empty_text: ""

  - id: drenaje_trascavidad
    type: single
    required: false
    label: Drenaje en trascavidad de los epiplones / trasfondo
    options: [Sí, Sin drenaje]
    empty_text: ""

  - id: drenaje_trascavidad_detalle
    type: free
    required: false
    required_if_drenaje_trascavidad: [Sí]
    label: Trascavidad — cantidad / tipo
    empty_text: ""

  - id: amilasa_drenaje
    type: single
    required: false
    label: Medición de amilasa en drenaje (POD)
    options: [Programado, No, No aplica]
    empty_text: ""

plantilla_texto: |
  Pancreato-biliar — {{procedimiento_grupo}}. Abordaje: {{abordaje}}{{conversion_causa}}.
  Páncreas: {{tipo_reseccion_pancreas}}; píloro {{piloro_final}}; bazo {{esplenectomia_asociada}}; linfadenectomía {{linfadenectomia_pancreas}}.
  Vascular electivo {{reseccion_vascular_electiva}} {{reconstruccion_vascular}}; no planificado {{evento_vascular_no_planificado}}.
  Remanente: textura {{pancreas_textura}}; Wirsung {{wirsung_mm}} mm.
  Anastomosis: pancreática {{anastomosis_pancreatica_tipo}} {{anastomosis_pancreatica_tecnica}}; biliar {{anastomosis_biliar_dpc}} herm. {{hermeticidad_biliar_dpc}}; digestiva {{anastomosis_digestiva_dpc}} {{anastomosis_digestiva_ruta}} herm. {{hermeticidad_digestiva_dpc}}.
  Vía biliar: {{proc_via_biliar}} {{tipo_derivacion_biliodigestiva}}; lesión {{clasificacion_lesion_vbp}}; integridad {{vbp_integridad_via}}; instr. {{instrumentacion_biliar}} CIO {{cio_hallazgos}}; drenaje biliar {{drenaje_biliar_colocado}}; herm. derivación {{hermeticidad_derivacion}}.
  Colecistectomía: hallazgos {{hallazgos_vesicula}} Mirizzi {{mirizzi_grado}}; CVS {{cvs_strasberg}}; VBP {{vbp_integridad_cole}}{{vbp_lesion_detalle}}; handoff {{handoff_reconstruccion_vbp}}; técnica {{tecnica_colecistectomia}}; CIO {{cio_cole}} {{cio_cole_hallazgos}}; clipado {{clipado_cistico}}; campo {{campo_cole}}.
  Drenajes: celda {{drenaje_celda_hepatica}} {{drenaje_celda_detalle}}; PY/HY {{drenaje_pancreatoyeyuno}} {{drenaje_pancreatoyeyuno_detalle}}; trascavidad {{drenaje_trascavidad}} {{drenaje_trascavidad_detalle}}; amilasa {{amilasa_drenaje}}.
```

---

## Notas de primera pasada (para auditar)

1. `procedimiento_grupo` **single**.
2. CVS ≠ `vbp_integridad` (hermanos; nunca fusionar).
3. Hermeticidad en anastomosis biliar y digestiva del DPC + derivaciones
   biliodigestivas (etiqueta unificada; confirmado Huerta).
4. Textura + Wirsung en DPC/distal/central con remanente.
5. `evento_vascular_no_planificado` aparte de resección electiva.
   `reseccion_vascular_electiva` multi sin «No» (vacío = sin resección).
6. Kehr (no «Kahr»). Amilasa: Programado / No / No aplica.
   `drenaje_biliar_colocado` multi sin «Sin drenaje» (vacío = ausencia).
7. `clasificacion_lesion_vbp`: Strasberg A–E5 (`single`); detalle narrativo
   en `vbp_lesion_detalle` (`free`).
8. Campo L/LC/C solo si hallazgos de urgencia/contaminación en cole.
9. Numéricos sin `empty_text` inventado.
