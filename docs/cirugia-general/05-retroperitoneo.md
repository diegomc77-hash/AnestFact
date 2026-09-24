# Módulo 5 — Retroperitoneo

**id:** `cg-retroperitoneo-v1` · especialidad: Cirugía General ·  
**Estado:** esqueleto de slots — **OK de semilla** (2026-09-14). Motor P2
pendiente. Corrección: `ureter_gesto` solo en gestos vasculares/urológicos
(Regla 1 de masa cubre uréteres en disección).

Índice: [README.md](README.md) · Hallazgos: [HALLAZGOS_ESQUELETO.md](HALLAZGOS_ESQUELETO.md)

Consentimiento / gasas / ATB = cáscara A4 de Foja Qx (no van acá).

**Regla 3 / consideraciones (fase aparte P2 — no slots qx):**

- Feocromocitoma → gatillo hemodinamia a `S.cur.foja.consideraciones`
(no `evento_hemodinamico_*` en esta proforma).
- Abordaje toracoabdominal / tórax abierto → gatillo ventilación selectiva
a consideraciones (no slot qx).

Hallazgos aplicados: `dx_presuntivo_masa`; integridad uréter/vasos/plexo
en disección pura; vascular electivo vs `evento_vascular_no_planificado`;
**Lateralidad**; drenaje Sí / Sin drenaje; `trombo_vci` + detalle;
vena suprarrenal ligada (técnico qx); tipografía Lateralidad.

---



## Proforma — Retroperitoneo

```text
id:            cg-retroperitoneo-v1
especialidad:  "Cirugía General"
operaciones: [
  "Resección de masa / tumor retroperitoneal",
  "Linfadenectomía retroperitoneal",
  "Adrenalectomía",
  "Reconstrucción vascular / urológica asociada"
]
titulo: "Cirugía del retroperitoneo"

slots:

  # ========== Índice ==========
  - id: procedimiento_grupo
    type: single
    required: true
    label: Procedimiento / foco
    options:
      - Resección de masa / tumor retroperitoneal
      - Linfadenectomía retroperitoneal
      - Adrenalectomía / cirugía suprarrenal
      - Gestos vasculares / urológicos asociados

  - id: abordaje
    type: single
    required: true
    label: Abordaje
    options:
      - Laparotomía mediana
      - Laparotomía subcostal ampliada
      - Toracoabdominal
      - Laparoscópico
      - Robótico
      - Retroperitoneoscópico (RLA)
      - Convertido a abierto
    # Toracoabdominal → gatillo consideraciones (ventilación); no slot qx.

  - id: conversion_causa
    type: free
    required: false
    required_if_abordaje: [Convertido a abierto]
    label: Causa de conversión
    empty_text: ""

  # ========== 1. Masas / sarcomas ==========
  - id: dx_presuntivo_masa
    type: single
    required: false
    required_if_procedimiento_grupo: [Resección de masa / tumor retroperitoneal]
    label: Diagnóstico presuntivo de la masa
    options:
      - Liposarcoma
      - Leiomiosarcoma
      - GIST
      - Otro
    empty_text: ""

  - id: dx_presuntivo_masa_otro
    type: free
    required: false
    required_if_dx_presuntivo_masa: [Otro]
    label: Diagnóstico presuntivo (otro)
    empty_text: ""

  - id: localizacion_masa
    type: multi
    required: false
    required_if_procedimiento_grupo: [Resección de masa / tumor retroperitoneal]
    label: Localización
    options:
      - Retroperitoneo alto / ilio-lumbar
      - Fosa ilíaca
      - Pelviano / suprapúbico
    join: ", "
    empty_text: ""

  - id: compromiso_linea_media_vasos
    type: single
    required: false
    required_if_procedimiento_grupo: [Resección de masa / tumor retroperitoneal]
    label: Compromiso de línea media / grandes vasos
    options: [Sí, No]
    empty_text: ""

  - id: intencion_reseccion
    type: single
    required: false
    required_if_procedimiento_grupo: [Resección de masa / tumor retroperitoneal]
    label: Intención de la resección
    options:
      - R0 (resección microscópica completa)
      - R1 (margen microscópico positivo)
      - R2 (incompleta / debulking)
      - Biopsia de masa inoperable
    empty_text: ""

  - id: resecciones_multiviscerales
    type: multi
    required: false
    required_if_procedimiento_grupo: [Resección de masa / tumor retroperitoneal]
    label: Resecciones multiviscerales asociadas
    options:
      - Nefrectomía derecha
      - Nefrectomía izquierda
      - Hemicolectomía derecha
      - Hemicolectomía izquierda
      - Sigmoidectomía
      - Pancreatectomía corporocaudal (distal)
      - Esplenectomía (asociada)
      - Resección vascular (cava / aorta / ilíacos) — electiva
      - Resección muscular (psoas / pared posterior)
    join: "; "
    empty_text: ""
    # Vacío = sin multivisceral. Strings GI/pancreato = textos exactos M2/M3.

  - id: campo_multivisceral
    type: single
    required: false
    required_if_resecciones_multiviscerales:
      - Hemicolectomía derecha
      - Hemicolectomía izquierda
      - Sigmoidectomía
      - Pancreatectomía corporocaudal (distal)
    label: Clasificación del campo (víscera hueca / contaminación)
    options: [Limpio, Limpio-contaminado, Contaminado]
    empty_text: ""

  - id: handoff_gi
    type: single
    required: false
    required_if_resecciones_multiviscerales:
      - Hemicolectomía derecha
      - Hemicolectomía izquierda
      - Sigmoidectomía
    label: Handoff
    options:
      - Sí — completar en M2 Gastrointestinal (cg-gastrointestinal-v1)
    empty_text: ""

  - id: handoff_pancreato
    type: single
    required: false
    required_if_resecciones_multiviscerales:
      - Pancreatectomía corporocaudal (distal)
      - Esplenectomía (asociada)
    label: Handoff
    options:
      - Sí — completar en M3 Pancreato-biliar (cg-pancreato-biliar-v1)
    empty_text: ""

  # Regla 1 — integridad en disección (masa)
  - id: ureter_derecho_masa
    type: single
    required: false
    required_if_procedimiento_grupo: [Resección de masa / tumor retroperitoneal]
    label: Uréter derecho
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
    empty_text: ""

  - id: ureter_izquierdo_masa
    type: single
    required: false
    required_if_procedimiento_grupo: [Resección de masa / tumor retroperitoneal]
    label: Uréter izquierdo
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
    empty_text: ""

  - id: vci_integridad_diseccion
    type: single
    required: false
    required_if_procedimiento_grupo: [Resección de masa / tumor retroperitoneal]
    label: Vena cava inferior (disección)
    options:
      - Identificada y preservada
      - Lesión identificada intraoperatoriamente
      - No disecada
    empty_text: ""

  - id: aorta_integridad_diseccion
    type: single
    required: false
    required_if_procedimiento_grupo: [Resección de masa / tumor retroperitoneal]
    label: Aorta (disección)
    options:
      - Identificada y preservada
      - Lesión identificada intraoperatoriamente
      - No disecada
    empty_text: ""

  - id: iliaco_integridad_diseccion
    type: single
    required: false
    required_if_procedimiento_grupo: [Resección de masa / tumor retroperitoneal]
    label: Vasos ilíacos (disección)
    options:
      - Identificados y preservados
      - Lesión identificada intraoperatoriamente
      - No disecados
    empty_text: ""

  - id: trombo_vci
    type: single
    required: false
    required_if_procedimiento_grupo: [Resección de masa / tumor retroperitoneal, Adrenalectomía / cirugía suprarrenal]
    label: Trombo en VCI
    options: [No, Sí — trombectomía]
    empty_text: ""

  - id: trombo_vci_detalle
    type: free
    required: false
    required_if_trombo_vci: [Sí — trombectomía]
    label: Trombo VCI — detalle (tumoral / no tumoral / extensión)
    empty_text: ""

  - id: reseccion_vascular_electiva
    type: multi
    required: false
    required_if_procedimiento_grupo: [Resección de masa / tumor retroperitoneal]
    label: Resección vascular electiva oncológica
    options:
      - Vena cava
      - Aorta
      - Vasos ilíacos
    join: ", "
    empty_text: ""
    # Vacío = sin resección vascular electiva.

  - id: reconstruccion_vascular_electiva
    type: single
    required: false
    required_if_reseccion_vascular_electiva: [Vena cava, Aorta, Vasos ilíacos]
    label: Reconstrucción vascular (electiva)
    options:
      - Anastomosis / venorrafia
      - Injerto / prótesis
      - Ligadura
    empty_text: ""

  - id: evento_vascular_no_planificado
    type: single
    required: false
    required_if_procedimiento_grupo:
      - Resección de masa / tumor retroperitoneal
      - Adrenalectomía / cirugía suprarrenal
      - Gestos vasculares / urológicos asociados
    label: Evento vascular no planificado
    options:
      - Sin eventos
      - Lesión vascular no planificada — controlada
      - Lesión vascular no planificada — requirió reconstrucción de urgencia
    empty_text: ""

  # ========== 2. Linfadenectomía ==========
  - id: indicacion_linfadenectomia
    type: single
    required: false
    required_if_procedimiento_grupo: [Linfadenectomía retroperitoneal]
    label: Indicación
    options:
      - Tumor germinal de testículo
      - Tumor ginecológico / oncológico
      - Estadificación / debulking
    empty_text: ""

  - id: plantilla_linfadenectomia
    type: multi
    required: false
    required_if_procedimiento_grupo: [Linfadenectomía retroperitoneal]
    label: Extensión / plantilla
    options:
      - Paraaórtica
      - Interaortocava
      - Paracava
      - Ilíaca común
      - Ilíaca externa
      - Ilíaca interna
      - Obturatriz
    join: ", "
    empty_text: ""

  - id: plexo_simpatico
    type: single
    required: false
    required_if_procedimiento_grupo: [Linfadenectomía retroperitoneal]
    label: Plexo simpático lumbar
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
    empty_text: ""

  # ========== 3. Adrenal ==========
  - id: lateralidad_adrenal
    type: single
    required: false
    required_if_procedimiento_grupo: [Adrenalectomía / cirugía suprarrenal]
    label: Lateralidad
    options: [Derecha, Izquierda, Bilateral]
    empty_text: ""

  - id: abordaje_adrenal
    type: single
    required: false
    required_if_procedimiento_grupo: [Adrenalectomía / cirugía suprarrenal]
    label: Abordaje (adrenal)
    options:
      - Laparoscópico (transperitoneal)
      - Retroperitoneoscópico (posterior — RLA)
      - Abierto / laparotómico
    empty_text: ""

  - id: indicacion_adrenal
    type: single
    required: false
    required_if_procedimiento_grupo: [Adrenalectomía / cirugía suprarrenal]
    label: Indicación / patología
    options:
      - Feocromocitoma
      - Incidentaloma / adenoma
      - Síndrome de Cushing / Conn
      - Carcinoma suprarrenal (ACC)
      - Metástasis
    empty_text: ""
    # Feocromocitoma → gatillo consideraciones (hemodinamia); no slot qx.

  - id: vena_suprarrenal_ligada_antes
    type: single
    required: false
    required_if_procedimiento_grupo: [Adrenalectomía / cirugía suprarrenal]
    label: Vena suprarrenal principal aislada y ligada antes de manipular
    options: [Sí, No]
    empty_text: ""

  - id: manejo_lecho_adrenal
    type: single
    required: false
    required_if_procedimiento_grupo: [Adrenalectomía / cirugía suprarrenal]
    label: Manejo del lecho
    options: [Clipado, Sellado energético, Sutura manual]
    empty_text: ""

  # ========== 4. Vascular / urológico (gestos) ==========
  - id: gesto_vci
    type: single
    required: false
    required_if_procedimiento_grupo: [Gestos vasculares / urológicos asociados]
    label: Vena cava inferior — gesto
    options:
      - Control venoso lateral / venorrafia
      - Resección + injerto / prótesis
      - Ligadura
      - No abordada
    empty_text: ""

  - id: gesto_iliacos
    type: single
    required: false
    required_if_procedimiento_grupo: [Gestos vasculares / urológicos asociados]
    label: Vasos ilíacos — gesto
    options:
      - Resección y sustitución protésica
      - Anastomosis directa
      - No abordados
    empty_text: ""

  - id: gesto_renales
    type: single
    required: false
    required_if_procedimiento_grupo: [Gestos vasculares / urológicos asociados]
    label: Vasos renales
    options: [Preservados, Reconstruidos, No abordados]
    empty_text: ""

  - id: ureter_gesto
    type: single
    required: false
    required_if_procedimiento_grupo: [Gestos vasculares / urológicos asociados]
    label: Manejo del uréter
    options:
      - Aislado y preservado
      - Resección ureteral
      - No disecado
    empty_text: ""
    # Masa: uréteres solo vía Regla 1 (ureter_*_masa) — no duplicar acá.

  - id: ureter_reconstruccion
    type: multi
    required: false
    required_if_ureter_gesto: [Resección ureteral]
    label: Reconstrucción ureteral
    options:
      - Reimplante ureterovesical
      - Anastomosis término-terminal
      - Catéter Doble J intraoperatorio
    join: ", "
    empty_text: ""

  # ========== 5. Hemostasia / drenaje ==========
  - id: hemostasia_lecho
    type: multi
    required: false
    label: Hemostasia del lecho
    options:
      - Coagulación monopolar / bipolar / sellado energético
      - Agentes hemostáticos tópicos (gelatina / fibrina / celulosa)
    join: ", "
    empty_text: ""

  - id: drenaje_lecho
    type: single
    required: false
    label: Drenaje aspirativo en lecho retroperitoneal
    options: [Sí, Sin drenaje]
    empty_text: ""

  - id: drenaje_lecho_detalle
    type: free
    required: false
    required_if_drenaje_lecho: [Sí]
    label: Drenaje — cantidad / ubicación
    empty_text: ""

  - id: cierre_pared
    type: multi
    required: false
    label: Cierre
    options:
      - Cierre aponeurótico por planos
      - Malla de refuerzo en pared posterior
    join: "; "
    empty_text: ""

plantilla_texto: |
  Retroperitoneo — {{procedimiento_grupo}}. Abordaje: {{abordaje}}{{conversion_causa}}.
  Masa: {{dx_presuntivo_masa}}{{dx_presuntivo_masa_otro}}; {{localizacion_masa}}; línea media/vasos {{compromiso_linea_media_vasos}}; intención {{intencion_reseccion}}; multivisceral {{resecciones_multiviscerales}}; campo {{campo_multivisceral}}; handoff GI {{handoff_gi}} / pancreato {{handoff_pancreato}}.
  Integridad: uréter der. {{ureter_derecho_masa}} izq. {{ureter_izquierdo_masa}}; VCI {{vci_integridad_diseccion}}; aorta {{aorta_integridad_diseccion}}; ilíacos {{iliaco_integridad_diseccion}}.
  Trombo VCI {{trombo_vci}} {{trombo_vci_detalle}}; vascular electivo {{reseccion_vascular_electiva}} {{reconstruccion_vascular_electiva}}; no planificado {{evento_vascular_no_planificado}}.
  Linfadenectomía: {{indicacion_linfadenectomia}}; plantilla {{plantilla_linfadenectomia}}; plexo {{plexo_simpatico}}.
  Adrenal: Lateralidad {{lateralidad_adrenal}}; {{abordaje_adrenal}}; {{indicacion_adrenal}}; vena ligada antes {{vena_suprarrenal_ligada_antes}}; lecho {{manejo_lecho_adrenal}}.
  Gestos: VCI {{gesto_vci}}; ilíacos {{gesto_iliacos}}; renales {{gesto_renales}}; uréter {{ureter_gesto}} {{ureter_reconstruccion}}.
  Hemostasia {{hemostasia_lecho}}; drenaje {{drenaje_lecho}} {{drenaje_lecho_detalle}}; cierre {{cierre_pared}}.
```



---



## Notas (OK de semilla)

1. `procedimiento_grupo` **single**. Tipografía **Lateralidad**.
2. Feocromo / toracoabdominal: **solo** gatillo a `foja.consideraciones`
  (no slots de hemodinamia ni ventilación en qx).
3. Regla 1: uréteres + VCI/aorta/ilíacos en disección (aunque no haya
  resección); plexo simpático con el mismo trío. Uréteres en masa
   **sin** condicionar por lateralidad (región/altura; «No disecado»
   cubre el lado no abordado).
4. Vascular electivo (multi sin «No») ≠ `evento_vascular_no_planificado`.
5. `trombo_vci` + detalle tumoral/no tumoral/extensión.
6. Drenaje: Sí / **Sin drenaje** + detalle si Sí.
7. Multivisceral: strings exactos M2/M3 + `handoff_gi` /
  `handoff_pancreato` (mismo formato que M1).
8. `ureter_gesto` **exclusivo** de gestos vasculares/urológicos (no masa).
9. Numéricos sin `empty_text` inventado.

