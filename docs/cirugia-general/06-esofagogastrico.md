# Módulo 6 — Esofagogástrico / Bariátrica / Hernias internas

**id:** `cg-esofagogastrico-v1` · especialidad: Cirugía General ·  
**Estado:** esqueleto de slots — **OK de semilla** (2026-09-14). Motor P2
pendiente. Drenaje de esofaguectomía propio (`drenaje_esofaguectomia`);
excluida de `drenaje_modulo`.

Índice: [README.md](README.md) · Hallazgos: [HALLAZGOS_ESQUELETO.md](HALLAZGOS_ESQUELETO.md)

Consentimiento / gasas / ATB = cáscara A4 de Foja Qx (no van acá).

**Regla 3 / consideraciones (fase aparte P2 — no slots qx):**
- Esofaguectomía con tórax abierto (Ivor Lewis / McKeown / MIE torácico)
  → gatillo ventilación selectiva a `S.cur.foja.consideraciones`
  (no slot de ventilación en esta proforma).

Hallazgos aplicados: hermeticidad unificada (funduplicatura / bariátrica /
anastomosis esofágica); **Acalasia**; vagos ant/post Regla 1 en disección
de hiato (incl. Sleeve); paraesofágica II–IV completa + **Collis**;
OAGB sin forzar YY; Petersen / mesenterio con **No aplica**; Sleeve
definición completa acá (M2 solo xref); revisional con subtipos;
sitio concreto de hernia interna; márgenes onco esofaguectomía;
drenaje Sí / Sin drenaje; Regla 4 en hernia con necrosis; Convertido +
causa.

**Nota de motor:** si un slot declara más de un `required_if_*`, se
interpreta como **OR** (mostrar si cualquiera aplica).

---

## Proforma — Esofagogástrico / Bariátrica / Hernias internas

```text
id:            cg-esofagogastrico-v1
especialidad:  "Cirugía General"
operaciones: [
  "Funduplicatura / hiatoplastia / hernia hiatal",
  "Cirugía bariátrica (RYGB / OAGB / Sleeve / revisional)",
  "Esofaguectomía / resección esofágica",
  "Hernia interna / defecto mesentérico"
]
titulo: "Esofagogástrico, bariátrica y hernias internas"

slots:

  # ========== Índice ==========
  - id: procedimiento_grupo
    type: single
    required: true
    label: Procedimiento / foco
    options:
      - Funduplicatura / hiato / reflujo
      - Cirugía bariátrica (RYGB / OAGB / Sleeve / revisional)
      - Esofaguectomía / resección esofágica
      - Hernia interna / defecto mesentérico

  - id: abordaje
    type: single
    required: true
    label: Abordaje
    options:
      - Laparoscópico
      - Robótico
      - Abierto / laparotómico
      - Convertido a abierto
    # Esofaguectomía: el tipo (Orringer / Ivor Lewis / McKeown / MIE)
    # detalla vías; este campo es el abordaje general del acto.

  - id: conversion_causa
    type: free
    required: false
    required_if_abordaje: [Convertido a abierto]
    label: Causa de conversión
    empty_text: ""

  # ========== 1. Funduplicatura / hiato ==========
  - id: indicacion_hiato
    type: single
    required: false
    required_if_procedimiento_grupo: [Funduplicatura / hiato / reflujo]
    label: Indicación
    options:
      - Enfermedad por reflujo gastroesofágico (ERGE)
      - Hernia hiatal por deslizamiento (Tipo I)
      - Hernia paraesofágica / mixta (Tipo II, III, IV)
      - Acalasia / cardioplastia
    empty_text: ""

  - id: tipo_paraesofagica
    type: single
    required: false
    required_if_indicacion_hiato: [Hernia paraesofágica / mixta (Tipo II, III, IV)]
    label: Tipo de hernia paraesofágica
    options: [Tipo II, Tipo III, Tipo IV]
    empty_text: ""

  - id: contenido_hernia_hiatal
    type: multi
    required: false
    required_if_indicacion_hiato: [Hernia paraesofágica / mixta (Tipo II, III, IV)]
    label: Contenido herniado
    options:
      - Estómago
      - Colon
      - Omento
      - Otro
    join: ", "
    empty_text: ""

  - id: contenido_hernia_hiatal_otro
    type: free
    required: false
    required_if_contenido_hernia_hiatal: [Otro]
    label: Contenido herniado (otro)
    empty_text: ""

  - id: reduccion_contenido_hiatal
    type: single
    required: false
    required_if_indicacion_hiato: [Hernia paraesofágica / mixta (Tipo II, III, IV)]
    label: Reducción del contenido
    options:
      - Reducción completa
      - Reducción parcial
      - Irreductible
    empty_text: ""

  - id: reseccion_saco_hiatal
    type: single
    required: false
    required_if_indicacion_hiato: [Hernia paraesofágica / mixta (Tipo II, III, IV)]
    label: Manejo del saco herniario
    options:
      - Resección / excisión de saco
      - Reducción de saco sin resección
      - No abordado
    empty_text: ""

  - id: gastropexia
    type: single
    required: false
    required_if_indicacion_hiato: [Hernia paraesofágica / mixta (Tipo II, III, IV)]
    label: Gastropexia
    options: [Sí, No]
    empty_text: ""

  - id: liberacion_pilares_saco
    type: single
    required: false
    required_if_procedimiento_grupo: [Funduplicatura / hiato / reflujo]
    label: Liberación de pilares hiatales y disección de saco
    options: [Sí, No]
    empty_text: ""

  - id: esofago_intraabdominal_cm
    type: free
    required: false
    required_if_procedimiento_grupo: [Funduplicatura / hiato / reflujo]
    label: Longitud de esófago intraabdominal logrado (cm)
    empty_text: ""

  - id: collis
    type: single
    required: false
    required_if_indicacion_hiato: [Hernia paraesofágica / mixta (Tipo II, III, IV)]
    label: Gastroplastia de Collis (esófago corto)
    options: [Sí, No, No aplica]
    empty_text: ""

  - id: vasos_cortos
    type: single
    required: false
    required_if_procedimiento_grupo: [Funduplicatura / hiato / reflujo]
    label: Sección de vasos cortos
    options: [Sí, No]
    empty_text: ""

  - id: hiatoplastia
    type: single
    required: false
    required_if_procedimiento_grupo: [Funduplicatura / hiato / reflujo]
    label: Cierre de pilares (hiatoplastia)
    options:
      - Puntos separados monofilamento / irreabsorbible
      - Con refuerzo protésico / malla
      - No realizada
    empty_text: ""

  - id: hiatoplastia_malla_tipo
    type: free
    required: false
    required_if_hiatoplastia: [Con refuerzo protésico / malla]
    label: Tipo de malla / prótesis (hiatoplastia)
    empty_text: ""

  - id: tipo_funduplicatura
    type: single
    required: false
    required_if_procedimiento_grupo: [Funduplicatura / hiato / reflujo]
    label: Confección de la funduplicatura
    options:
      - Nissen (total 360°)
      - Toupet (parcial posterior 270°)
      - Dor (parcial anterior 180°)
      - No realizada (solo hiatoplastia / gastropexia / Collis)
    empty_text: ""

  - id: calibracion_valvula
    type: single
    required: false
    required_if_tipo_funduplicatura: [Nissen (total 360°), Toupet (parcial posterior 270°), Dor (parcial anterior 180°)]
    label: Calibración de la válvula con sonda (Bougie / Faucher)
    options: [Sí, No]
    empty_text: ""

  - id: calibracion_valvula_fr
    type: free
    required: false
    required_if_calibracion_valvula: [Sí]
    label: Calibración — calibre (Fr)
    empty_text: ""

  - id: vago_anterior
    type: single
    required: false
    required_if_procedimiento_grupo: [Funduplicatura / hiato / reflujo, Esofaguectomía / resección esofágica]
    required_if_tipo_bariatrica: [Sleeve gástrico]
    label: Nervio vago anterior
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
    empty_text: ""
    # OR entre required_if_* (hiato / esofaguectomía / Sleeve).

  - id: vago_posterior
    type: single
    required: false
    required_if_procedimiento_grupo: [Funduplicatura / hiato / reflujo, Esofaguectomía / resección esofágica]
    required_if_tipo_bariatrica: [Sleeve gástrico]
    label: Nervio vago posterior
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
    empty_text: ""

  - id: hermeticidad_funduplicatura
    type: single
    required: false
    required_if_tipo_funduplicatura: [Nissen (total 360°), Toupet (parcial posterior 270°), Dor (parcial anterior 180°)]
    label: Prueba de hermeticidad (funduplicatura)
    options:
      - Fuga demostrada
      - Sin fuga demostrada
      - No realizada
    empty_text: ""

  # ========== 2. Bariátrica ==========
  - id: tipo_bariatrica
    type: single
    required: false
    required_if_procedimiento_grupo: [Cirugía bariátrica (RYGB / OAGB / Sleeve / revisional)]
    label: Procedimiento bariátrico
    options:
      - Bypass gástrico en Y de Roux (RYGB)
      - Bypass de anastomosis única (OAGB / BAGUA / mini-bypass)
      - Sleeve gástrico
      - Cirugía revisional bariátrica
    empty_text: ""
    # Dueño del Sleeve = este módulo (M2 solo xref).

  - id: revisional_subtipo
    type: single
    required: false
    required_if_tipo_bariatrica: [Cirugía revisional bariátrica]
    label: Tipo de revisión bariátrica
    options:
      - Banda → bypass
      - Sleeve → bypass
      - Revisión de asa (longitud / anastomosis)
      - Otro
    empty_text: ""

  - id: revisional_subtipo_otro
    type: free
    required: false
    required_if_revisional_subtipo: [Otro]
    label: Revisión bariátrica (otro)
    empty_text: ""

  - id: pouch_volumen_cc
    type: free
    required: false
    required_if_tipo_bariatrica:
      - Bypass gástrico en Y de Roux (RYGB)
      - Bypass de anastomosis única (OAGB / BAGUA / mini-bypass)
      - Cirugía revisional bariátrica
    label: Reservorio / pouch — volumen estimado (cc)
    empty_text: ""

  - id: calibracion_pouch
    type: single
    required: false
    required_if_tipo_bariatrica:
      - Bypass gástrico en Y de Roux (RYGB)
      - Bypass de anastomosis única (OAGB / BAGUA / mini-bypass)
      - Sleeve gástrico
      - Cirugía revisional bariátrica
    label: Calibración con sonda
    options: [Sí, No]
    empty_text: ""

  - id: calibracion_pouch_fr
    type: free
    required: false
    required_if_calibracion_pouch: [Sí]
    label: Calibración — calibre (Fr)
    empty_text: ""

  - id: refuerzo_linea_grapado
    type: single
    required: false
    required_if_tipo_bariatrica:
      - Bypass gástrico en Y de Roux (RYGB)
      - Bypass de anastomosis única (OAGB / BAGUA / mini-bypass)
      - Sleeve gástrico
      - Cirugía revisional bariátrica
    label: Refuerzo de línea de engrapado / sutura continua
    options: [Sí, No]
    empty_text: ""

  - id: asa_biliopancreatica_cm
    type: free
    required: false
    required_if_tipo_bariatrica:
      - Bypass gástrico en Y de Roux (RYGB)
      - Bypass de anastomosis única (OAGB / BAGUA / mini-bypass)
      - Cirugía revisional bariátrica
    label: Asa biliopancreática — longitud (cm)
    empty_text: ""

  - id: asa_alimentaria_cm
    type: free
    required: false
    required_if_tipo_bariatrica:
      - Bypass gástrico en Y de Roux (RYGB)
      - Cirugía revisional bariátrica
    label: Asa alimentaria — longitud (cm)
    empty_text: ""
    # OAGB: anastomosis única — no fuerza asa alimentaria Roux.

  - id: anastomosis_gy
    type: single
    required: false
    required_if_tipo_bariatrica:
      - Bypass gástrico en Y de Roux (RYGB)
      - Bypass de anastomosis única (OAGB / BAGUA / mini-bypass)
      - Cirugía revisional bariátrica
    label: Anastomosis gastroyeyunal
    options:
      - Mecánica circular
      - Mecánica lineal
      - Manual
    empty_text: ""

  - id: anastomosis_gy_circular_mm
    type: free
    required: false
    required_if_anastomosis_gy: [Mecánica circular]
    label: Anastomosis GY circular — diámetro (mm)
    empty_text: ""

  - id: anastomosis_yy
    type: single
    required: false
    required_if_tipo_bariatrica:
      - Bypass gástrico en Y de Roux (RYGB)
      - Cirugía revisional bariátrica
    label: Anastomosis yeyunoyeyunal (Y de Roux)
    options:
      - Mecánica lineal
      - Manual
      - No realizada / no aplica
    empty_text: ""
    # OAGB: no mostrar (anastomosis única). Revisional: «No realizada / no aplica» si no toca YY.

  - id: brecha_petersen
    type: single
    required: false
    required_if_tipo_bariatrica:
      - Bypass gástrico en Y de Roux (RYGB)
      - Bypass de anastomosis única (OAGB / BAGUA / mini-bypass)
      - Cirugía revisional bariátrica
    label: Brecha intermesentérica (Petersen)
    options: [Cerrada, No cerrada, No aplica]
    empty_text: ""

  - id: brecha_mesenterio_yeyunal
    type: single
    required: false
    required_if_tipo_bariatrica:
      - Bypass gástrico en Y de Roux (RYGB)
      - Cirugía revisional bariátrica
    label: Brecha del mesenterio yeyunal
    options: [Cerrada, No cerrada, No aplica]
    empty_text: ""
    # OAGB: no fuerza mesenterio yeyunal de Roux.

  - id: hermeticidad_bariatrica
    type: single
    required: false
    required_if_tipo_bariatrica:
      - Bypass gástrico en Y de Roux (RYGB)
      - Bypass de anastomosis única (OAGB / BAGUA / mini-bypass)
      - Sleeve gástrico
      - Cirugía revisional bariátrica
    label: Prueba de hermeticidad (azul de metileno / neumática)
    options:
      - Fuga demostrada
      - Sin fuga demostrada
      - No realizada
    empty_text: ""

  # ========== 3. Esofaguectomía ==========
  - id: tipo_esofaguectomia
    type: single
    required: false
    required_if_procedimiento_grupo: [Esofaguectomía / resección esofágica]
    label: Técnica / campos
    options:
      - Transhiatal (Orringer — laparotomía + cervicotomía)
      - Transtorácica subtotal (Ivor Lewis — laparotomía + toracotomía derecha)
      - Tres campos (McKeown — cervicotomía + toracotomía + laparotomía)
      - Mínimamente invasivo / híbrido (MIE — laparoscopía / toracoscopía)
    empty_text: ""
    # Ivor Lewis / McKeown / MIE con tórax → gatillo consideraciones
    # (ventilación selectiva); no slot qx.

  - id: organo_sustitucion
    type: single
    required: false
    required_if_procedimiento_grupo: [Esofaguectomía / resección esofágica]
    label: Órgano de sustitución (ascenso / tubulización)
    options:
      - Estómago (túbulo / plastia gástrica)
      - Colon (plastia colónica)
      - Yeyuno (asa libre / yeyunoplastia)
    empty_text: ""

  - id: plastia_colon_sentido
    type: single
    required: false
    required_if_organo_sustitucion: [Colon (plastia colónica)]
    label: Plastia colónica — sentido
    options: [Isoperistáltica, Anteroperistáltica]
    empty_text: ""

  - id: via_ascenso
    type: single
    required: false
    required_if_procedimiento_grupo: [Esofaguectomía / resección esofágica]
    label: Vía de ascenso del plastrón
    options:
      - Mediastino posterior (lecho esofágico)
      - Retroesternal
      - Subcutáneo
    empty_text: ""

  - id: linfadenectomia_esofago
    type: single
    required: false
    required_if_procedimiento_grupo: [Esofaguectomía / resección esofágica]
    label: Linfadenectomía
    options:
      - 2 campos (abdominal + torácico)
      - 3 campos (abdominal + torácico + cervical)
      - No realizada / no oncológica
    empty_text: ""

  - id: anastomosis_esofagica_ubicacion
    type: single
    required: false
    required_if_procedimiento_grupo: [Esofaguectomía / resección esofágica]
    label: Anastomosis esofágica — ubicación
    options: [Cervical, Torácica alta]
    empty_text: ""

  - id: anastomosis_esofagica_tecnica
    type: single
    required: false
    required_if_procedimiento_grupo: [Esofaguectomía / resección esofágica]
    label: Anastomosis esofágica — técnica
    options:
      - Mecánica circular
      - Mecánica lineal
      - Manual (1 plano)
      - Manual (2 planos)
    empty_text: ""

  - id: margen_proximal_esofago
    type: single
    required: false
    required_if_procedimiento_grupo: [Esofaguectomía / resección esofágica]
    label: Margen proximal
    options: [Libre, Comprometido, No aplica]
    empty_text: ""

  - id: margen_proximal_esofago_distancia
    type: free
    required: false
    required_if_margen_proximal_esofago: [Libre, Comprometido]
    label: Margen proximal — distancia (cm)
    empty_text: ""

  - id: margen_distal_tubo
    type: single
    required: false
    required_if_procedimiento_grupo: [Esofaguectomía / resección esofágica]
    label: Margen distal del tubo / plastia
    options: [Libre, Comprometido, No aplica]
    empty_text: ""

  - id: margen_distal_tubo_distancia
    type: free
    required: false
    required_if_margen_distal_tubo: [Libre, Comprometido]
    label: Margen distal — distancia (cm)
    empty_text: ""

  - id: nervio_recurrente
    type: single
    required: false
    required_if_anastomosis_esofagica_ubicacion: [Cervical]
    label: Nervio laríngeo recurrente
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
    empty_text: ""

  - id: yeyunostomia_alimentacion
    type: single
    required: false
    required_if_procedimiento_grupo: [Esofaguectomía / resección esofágica]
    label: Yeyunostomía de alimentación complementaria
    options: [Realizada, No realizada]
    empty_text: ""

  - id: hermeticidad_esofagica
    type: single
    required: false
    required_if_procedimiento_grupo: [Esofaguectomía / resección esofágica]
    label: Prueba de hermeticidad (anastomosis esofágica)
    options:
      - Fuga demostrada
      - Sin fuga demostrada
      - No realizada
    empty_text: ""

  - id: drenaje_esofaguectomia
    type: single
    required: false
    required_if_procedimiento_grupo: [Esofaguectomía / resección esofágica]
    label: Drenaje(s)
    options: [Sí, Sin drenaje]
    empty_text: ""

  - id: drenaje_esofaguectomia_detalle
    type: free
    required: false
    required_if_drenaje_esofaguectomia: [Sí]
    label: Drenaje — tipo / ubicación
    empty_text: ""

  # ========== 4. Hernias internas ==========
  - id: etiologia_hernia_interna
    type: single
    required: false
    required_if_procedimiento_grupo: [Hernia interna / defecto mesentérico]
    label: Origen / etiología
    options:
      - Post-quirúrgica (posbypass / defecto mesentérico creado)
      - Congénita / primaria
    empty_text: ""

  - id: sitio_hernia_interna
    type: single
    required: false
    required_if_procedimiento_grupo: [Hernia interna / defecto mesentérico]
    label: Sitio del defecto
    options:
      - Brecha de Petersen
      - Brecha yeyunoyeyunal / mesenterio yeyunal
      - Hernia paraduodenal (Treitz)
      - Foramen de Winslow
      - Transmesentérica
      - Transomesentérica
      - Intersigmoidea
      - Otro
    empty_text: ""
    # Sitio concreto obligatorio en el foco (no solo etiología).

  - id: sitio_hernia_interna_otro
    type: free
    required: false
    required_if_sitio_hernia_interna: [Otro]
    label: Sitio del defecto (otro)
    empty_text: ""

  - id: manejo_contenido_hernia_interna
    type: single
    required: false
    required_if_procedimiento_grupo: [Hernia interna / defecto mesentérico]
    label: Manejo del contenido herniado
    options:
      - Reducción manual — víscera indemne
      - Isquemia / necrosis — resección intestinal — completar en M2 Gastrointestinal (cg-gastrointestinal-v1)
    empty_text: ""

  - id: handoff_gi
    type: single
    required: false
    required_if_manejo_contenido_hernia_interna:
      - Isquemia / necrosis — resección intestinal — completar en M2 Gastrointestinal (cg-gastrointestinal-v1)
    label: Handoff
    options:
      - Sí — completar en M2 Gastrointestinal (cg-gastrointestinal-v1)
    empty_text: ""

  - id: campo_hernia_interna
    type: single
    required: false
    required_if_manejo_contenido_hernia_interna:
      - Isquemia / necrosis — resección intestinal — completar en M2 Gastrointestinal (cg-gastrointestinal-v1)
    label: Clasificación del campo
    options: [Limpio, Limpio-contaminado, Contaminado]
    empty_text: ""

  - id: tratamiento_defecto_hernia_interna
    type: single
    required: false
    required_if_procedimiento_grupo: [Hernia interna / defecto mesentérico]
    label: Tratamiento del defecto
    options:
      - Cierre de brecha / espacio anatómico (sutura monofilamento irreabsorbible)
      - Sección / apertura del anillo constrictor
    empty_text: ""

  # ========== 5. Cierre compartido (opc.) ==========
  - id: drenaje_modulo
    type: single
    required: false
    required_if_procedimiento_grupo:
      - Funduplicatura / hiato / reflujo
      - Cirugía bariátrica (RYGB / OAGB / Sleeve / revisional)
      - Hernia interna / defecto mesentérico
    label: Drenaje
    options: [Sí, Sin drenaje]
    empty_text: ""
    # Esofaguectomía usa drenaje_esofaguectomia (propio).

  - id: drenaje_modulo_detalle
    type: free
    required: false
    required_if_drenaje_modulo: [Sí]
    label: Drenaje — tipo / ubicación
    empty_text: ""

plantilla_texto: |
  Esofagogástrico — {{procedimiento_grupo}}. Abordaje: {{abordaje}}{{conversion_causa}}.
  Hiato: {{indicacion_hiato}} {{tipo_paraesofagica}}; contenido {{contenido_hernia_hiatal}}{{contenido_hernia_hiatal_otro}}; reducción {{reduccion_contenido_hiatal}}; saco {{reseccion_saco_hiatal}}; gastropexia {{gastropexia}}; pilares/saco {{liberacion_pilares_saco}}; esófago IA {{esofago_intraabdominal_cm}} cm; Collis {{collis}}; vasos cortos {{vasos_cortos}}; hiatoplastia {{hiatoplastia}}{{hiatoplastia_malla_tipo}}; válvula {{tipo_funduplicatura}} cal.{{calibracion_valvula}}{{calibracion_valvula_fr}}; vagos ant. {{vago_anterior}} post. {{vago_posterior}}; hermeticidad {{hermeticidad_funduplicatura}}.
  Bariátrica: {{tipo_bariatrica}} {{revisional_subtipo}}{{revisional_subtipo_otro}}; pouch {{pouch_volumen_cc}} cc; cal.{{calibracion_pouch}}{{calibracion_pouch_fr}}; refuerzo {{refuerzo_linea_grapado}}; BP {{asa_biliopancreatica_cm}} cm / alim. {{asa_alimentaria_cm}} cm; GY {{anastomosis_gy}}{{anastomosis_gy_circular_mm}}; YY {{anastomosis_yy}}; Petersen {{brecha_petersen}}; mes. yeyunal {{brecha_mesenterio_yeyunal}}; hermeticidad {{hermeticidad_bariatrica}}.
  Esofaguectomía: {{tipo_esofaguectomia}}; sustitución {{organo_sustitucion}}{{plastia_colon_sentido}}; vía {{via_ascenso}}; linfadenectomía {{linfadenectomia_esofago}}; anastomosis {{anastomosis_esofagica_ubicacion}} {{anastomosis_esofagica_tecnica}}; márgenes prox. {{margen_proximal_esofago}}{{margen_proximal_esofago_distancia}} / dist. {{margen_distal_tubo}}{{margen_distal_tubo_distancia}}; recurrente {{nervio_recurrente}}; yeyunostomía {{yeyunostomia_alimentacion}}; hermeticidad {{hermeticidad_esofagica}}; drenaje {{drenaje_esofaguectomia}}{{drenaje_esofaguectomia_detalle}}.
  Hernia interna: {{etiologia_hernia_interna}}; sitio {{sitio_hernia_interna}}{{sitio_hernia_interna_otro}}; contenido {{manejo_contenido_hernia_interna}}; handoff {{handoff_gi}}; campo {{campo_hernia_interna}}; defecto {{tratamiento_defecto_hernia_interna}}.
  Drenaje (otros focos): {{drenaje_modulo}}{{drenaje_modulo_detalle}}.
```

---

## Notas (OK de semilla)

1. `procedimiento_grupo` **single**. Tipografía **Acalasia**.
2. Tórax abierto (Ivor Lewis / McKeown / MIE): **solo** gatillo a
   `foja.consideraciones` (ventilación selectiva) — no slot qx.
3. Vagos ant/post Regla 1 en hiato, esofaguectomía y **Sleeve** (OR de
   `required_if_*`). Recurrente si anastomosis cervical.
4. Hermeticidad unificada en funduplicatura, bariátrica y anastomosis
   esofágica.
5. Paraesofágica II–IV: contenido / reducción / saco / gastropexia +
   **Collis**.
6. OAGB: GY + BP; **sin** forzar YY ni asa alimentaria Roux ni brecha
   mesenterio yeyunal de Roux. Petersen sí (con No aplica).
7. Sleeve: definición completa acá; M2 solo xref.
8. Revisional: subtipos banda→bypass / sleeve→bypass / revisión de asa /
   otro.
9. Hernia interna: sitio single; necrosis → `handoff_gi` + campo L/LC/C
   (formato unificado Mn + id).
10. Drenajes Sí / **Sin drenaje**; esofaguectomía ≠ `drenaje_modulo`.
11. Convertido + causa; numéricos sin `empty_text` inventado.
