# Módulo — Oftalmología y Cirugía Ocular (M18)

**id:** `coft-oftalmologia-v1` · especialidad: Oftalmología ·  
**Estado:** **OK de semilla** (2026-09-15). Tracking:
[HALLAZGOS_ESQUELETO.md](HALLAZGOS_ESQUELETO.md).

Índice: [README.md](README.md)

Consentimiento / gasas / ATB = cáscara A4 de Foja Qx (no van acá).

## Validación clínica (leer antes de auditar)

**Este módulo no tiene el mismo nivel de validación directa que Cabeza y
Cuello ni Cirugía General.** CyC y CG fueron validados por la Dra. Huerta
en su disciplina. Ella **no** es oftalmóloga: el bosquejo y las
correcciones aplicadas aquí son **criterio clínico del equipo AnesFact
(Diego)** — auditoría con rigor de especialista de la disciplina,
pensado para uso por oftalmólogo/a real, **sin** reemplazar la revisión
futura de un/a especialista. Misma salvedad que Torácica / Urológica /
Ginecológica / Traumatología / Vascular / Plástica / Neurocirugía /
Cardiovascular / Mano / ORL.

## Solape (regla de organización del catálogo)

**Sin superposición real** con módulos existentes. Contenido ocular
completo vive acá. Blefaroplastia **funcional** / ptosis de este módulo
**no** se fusiona con Cirugía Plástica (estética/reconstructiva facial);
conviven por especialidad distinta — Plástica OK no se toca.

## Correcciones aplicadas al bosquejo (13)

**§1 Segmento anterior:** (1) indicación trasplante corneal ·
(2) complicación faco/EECC/FLACS.

**§2 Vitreorretiniana:** (3) estado final retina · (4) extensión DR +
mácula ON/OFF · (5) hallazgos IO adicionales.

**§3 Glaucoma:** (6) PIO preop · (7) indicación específica.

**§4 Oculoplastia:** (8) dx tumor palpebral + margen · (9) implante
orbitario · (10) permeabilidad DCR.

**§5 Estrabismo/trauma:** (11) ángulo desviación · (12) zona trauma
abierto · (13) AV preop trauma.

Ojo afectado: **OD / OI / Bilateral** (no «Laterallidad»).

**Nota de diseño:** EECC y FLACS van como opciones **separadas** en
`proc_segmento_anterior` — no es preferencia de UI: corrige el bruto
(EECC = manual sin láser; FLACS = faco asistida por láser). La
complicación capsular (corrección 2) aplica a las tres técnicas de
catarata.

---

## Proforma — Oftalmología y cirugía ocular

```text
id:            coft-oftalmologia-v1
especialidad:  "Oftalmología"
operaciones: [
  "Cirugía de segmento anterior / cristalino / córnea",
  "Cirugía vitreorretiniana",
  "Cirugía de glaucoma",
  "Oculoplastia / vía lagrimal / órbita",
  "Estrabismo y traumatología ocular"
]
titulo: "Oftalmología y cirugía ocular"

slots:

  # ========== Índice ==========
  - id: procedimiento_grupo
    type: single
    required: true
    label: Procedimiento / foco
    options:
      - Segmento anterior / cristalino / córnea
      - Segmento posterior / vitreorretiniana
      - Glaucoma / drenaje
      - Oculoplastia / vía lagrimal / órbita
      - Estrabismo / traumatología ocular

  - id: ojo_afectado
    type: single
    required: false
    required_if_procedimiento_grupo:
      - Segmento anterior / cristalino / córnea
      - Segmento posterior / vitreorretiniana
      - Glaucoma / drenaje
      - Oculoplastia / vía lagrimal / órbita
      - Estrabismo / traumatología ocular
    label: Ojo / anexo afectado
    options:
      - Derecho (OD)
      - Izquierdo (OI)
      - Bilateral
    empty_text: ""

  - id: abordaje
    type: single
    required: false
    label: Abordaje (si aplica)
    options:
      - Abierto
      - Microincisional / mínimamente invasivo
      - Endoscópico
      - Convertido a abierto
    empty_text: ""

  - id: conversion_causa
    type: free
    required: false
    required_if_abordaje: [Convertido a abierto]
    label: Causa de conversión
    empty_text: ""

  # ========== 1. Segmento anterior / cristalino / córnea ==========
  - id: proc_segmento_anterior
    type: multi
    required: false
    required_if_procedimiento_grupo: [Segmento anterior / cristalino / córnea]
    label: Procedimiento
    options:
      - Facoemulsificación + implante de LIO
      - Extracción extracapsular de catarata (EECC)
      - Femto-catarata (FLACS)
      - Queratoplastia penetrante (PKP)
      - Queratoplastia lamelar anterior (DALK)
      - Queratoplastia endotelial (DSAEK / DMEK)
      - Resección de pterigión + autoinjerto de conjuntiva
      - Crosslinking corneal
      - Anillos intraestromales
    join: "; "
    empty_text: ""

  - id: modelo_lio
    type: free
    required: false
    required_if_proc_segmento_anterior:
      - Facoemulsificación + implante de LIO
      - Extracción extracapsular de catarata (EECC)
      - Femto-catarata (FLACS)
    label: LIO — modelo / dioptrías
    empty_text: ""

  - id: ubicacion_lio
    type: single
    required: false
    required_if_proc_segmento_anterior:
      - Facoemulsificación + implante de LIO
      - Extracción extracapsular de catarata (EECC)
      - Femto-catarata (FLACS)
    label: Ubicación del LIO
    options:
      - Saco capsular
      - Sulcus
      - Cámara anterior / fijación escleral
    empty_text: ""

  - id: complicacion_faco
    type: single
    required: false
    required_if_proc_segmento_anterior:
      - Facoemulsificación + implante de LIO
      - Extracción extracapsular de catarata (EECC)
      - Femto-catarata (FLACS)
    label: Complicación intraoperatoria (catarata)
    options:
      - Sin complicaciones
      - Ruptura de cápsula posterior — sin pérdida vítrea
      - Ruptura de cápsula posterior — con pérdida vítrea (requirió vitrectomía anterior)
    empty_text: ""

  - id: indicacion_trasplante_corneal
    type: single
    required: false
    required_if_proc_segmento_anterior:
      - Queratoplastia penetrante (PKP)
      - Queratoplastia lamelar anterior (DALK)
      - Queratoplastia endotelial (DSAEK / DMEK)
    label: Indicación de trasplante corneal
    options:
      - Queratocono
      - Distrofia de Fuchs
      - Edema corneal
      - Cicatriz corneal
      - Rechazo de injerto previo
      - Otro
    empty_text: ""

  - id: indicacion_trasplante_corneal_otro
    type: free
    required: false
    required_if_indicacion_trasplante_corneal: [Otro]
    label: Indicación trasplante (otro)
    empty_text: ""

  - id: mitomicina_pterigion
    type: single
    required: false
    required_if_proc_segmento_anterior: [Resección de pterigión + autoinjerto de conjuntiva]
    label: Mitomicina C (pterigión)
    options:
      - Con Mitomicina C
      - Sin Mitomicina C
    empty_text: ""

  # ========== 2. Segmento posterior / vitreorretiniana ==========
  - id: indicacion_vitreorretiniana
    type: multi
    required: false
    required_if_procedimiento_grupo: [Segmento posterior / vitreorretiniana]
    label: Indicación
    options:
      - Desprendimiento de retina
      - Hemorragia vítrea
      - Retinopatía diabética proliferativa
      - Agujero macular / membrana epirretiniana
    join: "; "
    empty_text: ""

  - id: cuadrantes_desprendimiento
    type: multi
    required: false
    required_if_indicacion_vitreorretiniana: [Desprendimiento de retina]
    label: Cuadrantes afectados (desprendimiento)
    options:
      - Superior nasal
      - Superior temporal
      - Inferior nasal
      - Inferior temporal
    join: ", "
    empty_text: ""

  - id: estado_macula
    type: single
    required: false
    required_if_indicacion_vitreorretiniana: [Desprendimiento de retina]
    label: Estado macular
    options:
      - Mácula ON (aplicada)
      - Mácula OFF (desprendida)
    empty_text: ""

  - id: proc_vitreorretiniana
    type: multi
    required: false
    required_if_procedimiento_grupo: [Segmento posterior / vitreorretiniana]
    label: Procedimiento
    options:
      - Vitrectomía vía pars plana (VVPP)
      - Pelado de membrana limitante interna (MLI) / membrana epirretiniana
      - Retinopexia / endo-láser / crioaplicación
      - Indentación escleral / cerclaje escleral (scleral buckle)
    join: "; "
    empty_text: ""

  - id: calibre_vvpp
    type: single
    required: false
    required_if_proc_vitreorretiniana: [Vitrectomía vía pars plana (VVPP)]
    label: Calibre VVPP
    options:
      - 23G
      - 25G
      - 27G
    empty_text: ""

  - id: taponamiento_intraocular
    type: multi
    required: false
    required_if_procedimiento_grupo: [Segmento posterior / vitreorretiniana]
    label: Taponamiento intraocular
    options:
      - Aire
      - Gas expandible — SF6
      - Gas expandible — C3F8
      - Aceite de silicona
    join: "; "
    empty_text: ""

  - id: viscosidad_silicona_cst
    type: free
    required: false
    required_if_taponamiento_intraocular: [Aceite de silicona]
    label: Viscosidad del aceite de silicona (cSt)
    empty_text: ""

  - id: hallazgos_io_vitreorretiniana
    type: single
    required: false
    required_if_procedimiento_grupo: [Segmento posterior / vitreorretiniana]
    label: Hallazgos intraoperatorios adicionales
    options:
      - Sin hallazgos adicionales
      - Desgarro(s) adicional(es) identificado(s) y tratado(s)
    empty_text: ""

  - id: estado_final_retina
    type: single
    required: false
    required_if_procedimiento_grupo: [Segmento posterior / vitreorretiniana]
    label: Estado final de la retina
    options:
      - Aplicada
      - No aplicada (requiere reintervención)
    empty_text: ""

  # ========== 3. Glaucoma / drenaje ==========
  - id: pio_preop_mmhg
    type: free
    required: false
    required_if_procedimiento_grupo: [Glaucoma / drenaje]
    label: PIO preoperatoria (mmHg)
    empty_text: ""

  - id: indicacion_glaucoma
    type: single
    required: false
    required_if_procedimiento_grupo: [Glaucoma / drenaje]
    label: Indicación específica
    options:
      - Ángulo abierto
      - Ángulo cerrado
      - Glaucoma refractario
      - Glaucoma congénito
      - Otro
    empty_text: ""

  - id: indicacion_glaucoma_otro
    type: free
    required: false
    required_if_indicacion_glaucoma: [Otro]
    label: Indicación glaucoma (otro)
    empty_text: ""

  - id: proc_glaucoma
    type: multi
    required: false
    required_if_procedimiento_grupo: [Glaucoma / drenaje]
    label: Procedimiento
    options:
      - Trabeculectomía
      - Dispositivo de drenaje / válvula de glaucoma
      - Cirugía de glaucoma mínimamente invasiva (MIGS — iStent / Kahook)
      - Ciclofotocoagulación con láser diodo
    join: "; "
    empty_text: ""

  - id: antimetabolito_trabeculectomia
    type: multi
    required: false
    required_if_proc_glaucoma: [Trabeculectomía]
    label: Antimetabolitos (trabeculectomía)
    options:
      - Mitomicina C
      - 5-FU
    join: "; "
    empty_text: ""
    # Sin antimetabolitos = no marcar nada (no opción combinable).

  - id: tipo_valvula_glaucoma
    type: single
    required: false
    required_if_proc_glaucoma: [Dispositivo de drenaje / válvula de glaucoma]
    label: Tipo de válvula / dispositivo
    options:
      - Ahmed
      - Baerveldt
    empty_text: ""

  # ========== 4. Oculoplastia / vía lagrimal / órbita ==========
  - id: proc_oculoplastia
    type: multi
    required: false
    required_if_procedimiento_grupo: [Oculoplastia / vía lagrimal / órbita]
    label: Procedimiento
    options:
      - Blefaroplastia funcional / corrección de ptosis palpebral
      - Corrección de entropión / ectropión
      - Resección de tumor palpebral + reconstrucción
      - Dacriocistorrinostomía (DCR)
      - Sondaje / intubación de vía lagrimal con tubo de silicona
      - Enucleación / evisceración ocular + implante orbitario
      - Descompresión orbitaria (oftalmopatía tiroidea)
    join: "; "
    empty_text: ""

  - id: dx_tumor_palpebral
    type: single
    required: false
    required_if_proc_oculoplastia: [Resección de tumor palpebral + reconstrucción]
    label: Diagnóstico presuntivo (tumor palpebral)
    options:
      - Basocelular
      - Espinocelular
      - Melanoma
      - Otro
    empty_text: ""

  - id: dx_tumor_palpebral_otro
    type: free
    required: false
    required_if_dx_tumor_palpebral: [Otro]
    label: Diagnóstico tumor (otro)
    empty_text: ""

  - id: margen_tumor_palpebral
    type: single
    required: false
    required_if_proc_oculoplastia: [Resección de tumor palpebral + reconstrucción]
    label: Margen quirúrgico
    options:
      - Libre
      - Comprometido
    empty_text: ""

  - id: distancia_margen_tumor_mm
    type: free
    required: false
    required_if_margen_tumor_palpebral: [Libre, Comprometido]
    label: Distancia de margen (mm)
    empty_text: ""

  - id: via_dcr
    type: single
    required: false
    required_if_proc_oculoplastia: [Dacriocistorrinostomía (DCR)]
    label: Vía de DCR
    options:
      - Vía externa
      - Vía endonasal endoscópica
    empty_text: ""

  - id: permeabilidad_via_lagrimal
    type: single
    required: false
    required_if_proc_oculoplastia: [Dacriocistorrinostomía (DCR)]
    label: Permeabilidad final de vía lagrimal
    options:
      - Confirmada por irrigación
      - No confirmada
    empty_text: ""

  - id: material_implante_orbitario
    type: single
    required: false
    required_if_proc_oculoplastia: [Enucleación / evisceración ocular + implante orbitario]
    label: Material del implante orbitario
    options:
      - Hidroxiapatita
      - PMMA
      - Otro
    empty_text: ""

  - id: material_implante_orbitario_otro
    type: free
    required: false
    required_if_material_implante_orbitario: [Otro]
    label: Implante orbitario (otro)
    empty_text: ""

  # ========== 5. Estrabismo / traumatología ocular ==========
  - id: proc_estrabismo_trauma
    type: multi
    required: false
    required_if_procedimiento_grupo: [Estrabismo / traumatología ocular]
    label: Procedimiento
    options:
      - Cirugía de estrabismo (músculos extraoculares)
      - Cierre / sutura de herida corneo-escleral
      - Extracción de cuerpo extraño intraocular (CEIO)
      - Reconstrucción de cámara anterior / iridoplastia
    join: "; "
    empty_text: ""

  - id: musculos_extraoculares
    type: multi
    required: false
    required_if_proc_estrabismo_trauma: [Cirugía de estrabismo (músculos extraoculares)]
    label: Músculos extraoculares intervenidos
    options:
      - Recto medio
      - Recto lateral
      - Recto superior
      - Recto inferior
      - Oblicuos
    join: ", "
    empty_text: ""

  - id: accion_estrabismo
    type: multi
    required: false
    required_if_proc_estrabismo_trauma: [Cirugía de estrabismo (músculos extraoculares)]
    label: Acción sobre el músculo
    options:
      - Retroceso (recess)
      - Resección (resect)
      - Suturas ajustables
    join: "; "
    empty_text: ""

  - id: mm_retroceso
    type: free
    required: false
    required_if_accion_estrabismo: [Retroceso (recess)]
    label: Retroceso (mm)
    empty_text: ""

  - id: mm_reseccion_estrabismo
    type: free
    required: false
    required_if_accion_estrabismo: [Resección (resect)]
    label: Resección (mm)
    empty_text: ""

  - id: angulo_desviacion_preop_dp
    type: free
    required: false
    required_if_proc_estrabismo_trauma: [Cirugía de estrabismo (músculos extraoculares)]
    label: Ángulo de desviación preoperatorio (dioptrías prismáticas)
    empty_text: ""

  - id: clasificacion_zona_trauma
    type: single
    required: false
    required_if_proc_estrabismo_trauma:
      - Cierre / sutura de herida corneo-escleral
      - Extracción de cuerpo extraño intraocular (CEIO)
      - Reconstrucción de cámara anterior / iridoplastia
    label: Clasificación de zona (trauma ocular abierto)
    options:
      - Zona I
      - Zona II
      - Zona III
    empty_text: ""

  - id: agudeza_visual_preop_trauma
    type: free
    required: false
    required_if_proc_estrabismo_trauma:
      - Cierre / sutura de herida corneo-escleral
      - Extracción de cuerpo extraño intraocular (CEIO)
      - Reconstrucción de cámara anterior / iridoplastia
    label: Agudeza visual preoperatoria (trauma)
    empty_text: ""

  - id: sutura_corneoescleral
    type: single
    required: false
    required_if_proc_estrabismo_trauma: [Cierre / sutura de herida corneo-escleral]
    label: Sutura corneo-escleral
    options:
      - Nylon 10-0
      - Nylon 9-0
    empty_text: ""

plantilla_texto: |
  Oftalmología — {{procedimiento_grupo}}. Ojo {{ojo_afectado}}. Abordaje {{abordaje}}{{conversion_causa}}.
  Segmento ant.: {{proc_segmento_anterior}}; LIO {{modelo_lio}} ubic. {{ubicacion_lio}}; complicación {{complicacion_faco}}; trasplante {{indicacion_trasplante_corneal}}{{indicacion_trasplante_corneal_otro}}; MMC pterigión {{mitomicina_pterigion}}.
  Vitreo: {{indicacion_vitreorretiniana}}; cuadrantes {{cuadrantes_desprendimiento}} mácula {{estado_macula}}; {{proc_vitreorretiniana}} calibre {{calibre_vvpp}}; taponamiento {{taponamiento_intraocular}} {{viscosidad_silicona_cst}} cSt; hallazgos {{hallazgos_io_vitreorretiniana}}; retina final {{estado_final_retina}}.
  Glaucoma: PIO {{pio_preop_mmhg}} mmHg; {{indicacion_glaucoma}}{{indicacion_glaucoma_otro}}; {{proc_glaucoma}} antimet. {{antimetabolito_trabeculectomia}} válvula {{tipo_valvula_glaucoma}}.
  Oculoplastia: {{proc_oculoplastia}}; tumor {{dx_tumor_palpebral}}{{dx_tumor_palpebral_otro}} margen {{margen_tumor_palpebral}} {{distancia_margen_tumor_mm}} mm; DCR {{via_dcr}} permeabilidad {{permeabilidad_via_lagrimal}}; implante {{material_implante_orbitario}}{{material_implante_orbitario_otro}}.
  Estrabismo/trauma: {{proc_estrabismo_trauma}}; músculos {{musculos_extraoculares}} acción {{accion_estrabismo}} recess {{mm_retroceso}} mm resect {{mm_reseccion_estrabismo}} mm; ángulo {{angulo_desviacion_preop_dp}} DP; zona {{clasificacion_zona_trauma}}; AV {{agudeza_visual_preop_trauma}}; sutura {{sutura_corneoescleral}}.
```

---

## Notas (OK de semilla)

1. `procedimiento_grupo` **single**. Ojo: OD / OI / Bilateral.
2. Validación: criterio AnesFact (Diego), **no** oftalmólogo ni Dra.
   Huerta (ver cabecera) — salvedad se mantiene.
3. §1: indicación trasplante; complicación capsular faco/EECC/FLACS;
   EECC ≠ FLACS (técnicas distintas; corrección del bruto).
4. §2: estado final retina (sección); cuadrantes + mácula ON/OFF si DR;
   hallazgos IO; taponamiento SF6/C3F8 separados + viscosidad silicona.
5. §3: PIO preop; indicación ángulo/refractario/congénito;
   antimetabolitos multi **sin** «Sin antimetabolitos» (vacío = ausencia).
6. §4: tumor + margen/distancia; implante orbitario; permeabilidad DCR.
7. §5: ángulo desviación; zona I–III + AV solo trauma abierto (no
   estrabismo); mm recess/resect por acción.
8. Sin solape real con otros módulos; blefaroplastia funcional ≠ Plástica
   (no se fusionan; Plástica OK intacta).
9. Numéricos sin `empty_text` inventado. Convertido + causa.
10. Bruto (5 secciones) + 13 correcciones + hallazgo antimetabolitos.
