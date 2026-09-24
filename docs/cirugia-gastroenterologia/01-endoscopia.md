# Módulo — Gastroenterología y Endoscopia Digestiva (M20)

**id:** `cge-endoscopia-v1` · especialidad: Gastroenterología ·  
**Estado:** **OK de semilla** (2026-09-15). Tracking:
[HALLAZGOS_ESQUELETO.md](HALLAZGOS_ESQUELETO.md).

Índice: [README.md](README.md)

Consentimiento / gasas / ATB = cáscara A4 de Foja Qx (no van acá).

## Validación clínica (leer antes de auditar)

**Este módulo no tiene el mismo nivel de validación directa que Cabeza y
Cuello ni Cirugía General.** CyC y CG fueron validados por la Dra. Huerta
en su disciplina. Ella **no** es gastroenteróloga / endoscopista: el
bosquejo y las correcciones aplicadas aquí son **criterio clínico del
equipo AnesFact (Diego)** — auditoría con rigor de especialista de la
disciplina, pensado para uso por gastroenterólogo/a real, **sin**
reemplazar la revisión futura de un/a especialista. Misma salvedad que
Torácica / Urológica / Ginecológica / Traumatología / Vascular /
Plástica / Neurocirugía / Cardiovascular / Mano / ORL / Oftalmología /
Hemodinamia.

## Solape (regla de organización del catálogo)

**Sin superposición real** con Cirugía General (abierta / laparoscópica).
Este módulo = endoscopia digestiva diagnóstica / terapéutica. No se
fusionan. CG OK no se toca.

## Correcciones aplicadas al bosquejo (4 + post-tandas)

1. Typo: «Celiquía» → **Celiaquía**.
2. `profilaxis_pancreatitis_cpre` si papilotomía / esfinterotomía.
3. `caracter_hemorragia_variceal` si manejo variceal.
4. `indicacion_peg` si PEG.

**Post-Tanda 2:** biopsias **transversales** (no foco en índice);
`clasificacion_paris_polipo` + ubicación/tamaño libres; Mayo CU
single 0–3.

Tipografía: **Lateralidad** (no «Laterallidad»).

---

## Proforma — Gastroenterología y endoscopia digestiva

```text
id:            cge-endoscopia-v1
especialidad:  "Gastroenterología"
operaciones: [
  "Endoscopia digestiva alta (VEDA)",
  "Colonoscopia / rectosigmoidoscopia",
  "Endoscopia de urgencia / hemorragia digestiva",
  "Endoscopia terapéutica avanzada / CPRE",
  "Complicaciones e incidencias post-endoscopia"
]
titulo: "Gastroenterología y endoscopia digestiva"

slots:

  # ========== Índice ==========
  - id: procedimiento_grupo
    type: single
    required: true
    label: Procedimiento / foco
    options:
      - Endoscopia digestiva alta (VEDA)
      - Endoscopia digestiva baja (colonoscopia / rectosigmoidoscopia)
      - Endoscopia de emergencia / hemorragia
      - Endoscopia terapéutica / avanzada / CPRE
      - Complicaciones / incidencias post-procedimiento
    # Biopsias = campos transversales (no foco independiente).

  - id: sedacion_endoscopia
    type: single
    required: false
    required_if_procedimiento_grupo:
      - Endoscopia digestiva alta (VEDA)
      - Endoscopia digestiva baja (colonoscopia / rectosigmoidoscopia)
      - Endoscopia de emergencia / hemorragia
      - Endoscopia terapéutica / avanzada / CPRE
    label: Sedación / anestesia
    options:
      - Tópica (lidocaína spray)
      - Sedación consciente (midazolam / fentanilo)
      - Sedación profunda / asistida por anestesiología (propofol)
    empty_text: ""

  - id: abordaje
    type: single
    required: false
    label: Abordaje (si aplica)
    options:
      - Endoscópico
      - Convertido a quirúrgico / abierto
    empty_text: ""

  - id: conversion_causa
    type: free
    required: false
    required_if_abordaje: [Convertido a quirúrgico / abierto]
    label: Causa de conversión
    empty_text: ""

  # ========== 1. Endoscopia digestiva alta (VEDA) ==========
  - id: indicacion_veda
    type: multi
    required: false
    required_if_procedimiento_grupo: [Endoscopia digestiva alta (VEDA)]
    label: Indicación
    options:
      - Dispepsia / dolor epigástrico
      - Tamizaje / vigilancia
      - Disfagia / odinofagia
      - Síndrome anémico
      - Sospecha de hemorragia digestiva
    join: "; "
    empty_text: ""

  - id: hallazgo_esofago
    type: multi
    required: false
    required_if_procedimiento_grupo: [Endoscopia digestiva alta (VEDA)]
    label: Hallazgos — esófago
    options:
      - Normal
      - Esofagitis
      - Esófago de Barrett
      - Várices esofágicas
    join: "; "
    empty_text: ""

  - id: grado_los_angeles
    type: single
    required: false
    required_if_hallazgo_esofago: [Esofagitis]
    label: Esofagitis — Los Ángeles
    options:
      - Grado A
      - Grado B
      - Grado C
      - Grado D
    empty_text: ""

  - id: barrett_praga_c
    type: free
    required: false
    required_if_hallazgo_esofago: [Esófago de Barrett]
    label: Barrett — Praga C (cm)
    empty_text: ""

  - id: barrett_praga_m
    type: free
    required: false
    required_if_hallazgo_esofago: [Esófago de Barrett]
    label: Barrett — Praga M (cm)
    empty_text: ""

  - id: grado_varices_esofagicas
    type: single
    required: false
    required_if_hallazgo_esofago: [Várices esofágicas]
    label: Grado de várices esofágicas
    options:
      - Grado I
      - Grado II
      - Grado III
      - Grado IV
    empty_text: ""

  - id: signos_rojos_varices
    type: single
    required: false
    required_if_hallazgo_esofago: [Várices esofágicas]
    label: Signos rojos (várices)
    options:
      - Con signos rojos
      - Sin signos rojos
    empty_text: ""

  - id: hallazgo_estomago
    type: multi
    required: false
    required_if_procedimiento_grupo: [Endoscopia digestiva alta (VEDA)]
    label: Hallazgos — estómago
    options:
      - Normal
      - Gastritis
      - Úlcera gástrica
      - Lesión elevada / polipoidea
    join: "; "
    empty_text: ""

  - id: tipo_gastritis
    type: multi
    required: false
    required_if_hallazgo_estomago: [Gastritis]
    label: Tipo de gastritis
    options:
      - Eritematosa
      - Erosiva
      - Atrófica
    join: "; "
    empty_text: ""

  - id: forrest_ulcera_gastrica
    type: single
    required: false
    required_if_hallazgo_estomago: [Úlcera gástrica]
    label: Forrest (úlcera gástrica)
    options:
      - Ia
      - Ib
      - IIa
      - IIb
      - IIc
      - III
    empty_text: ""

  - id: hallazgo_duodeno
    type: multi
    required: false
    required_if_procedimiento_grupo: [Endoscopia digestiva alta (VEDA)]
    label: Hallazgos — duodeno
    options:
      - Normal
      - Duodenitis
      - Úlcera duodenal
      - Patrón atrófico (atrofia vellositaria / sospecha de celiaquía)
    join: "; "
    empty_text: ""

  # ========== 2. Endoscopia digestiva baja ==========
  - id: bbps_colon_derecho
    type: single
    required: false
    required_if_procedimiento_grupo: [Endoscopia digestiva baja (colonoscopia / rectosigmoidoscopia)]
    label: BBPS — colon derecho
    options: ["0", "1", "2", "3"]
    empty_text: ""

  - id: bbps_colon_transverso
    type: single
    required: false
    required_if_procedimiento_grupo: [Endoscopia digestiva baja (colonoscopia / rectosigmoidoscopia)]
    label: BBPS — colon transverso
    options: ["0", "1", "2", "3"]
    empty_text: ""

  - id: bbps_colon_izquierdo
    type: single
    required: false
    required_if_procedimiento_grupo: [Endoscopia digestiva baja (colonoscopia / rectosigmoidoscopia)]
    label: BBPS — colon izquierdo
    options: ["0", "1", "2", "3"]
    empty_text: ""

  - id: calidad_preparacion_bbps
    type: single
    required: false
    required_if_procedimiento_grupo: [Endoscopia digestiva baja (colonoscopia / rectosigmoidoscopia)]
    label: Calidad global de la preparación (BBPS)
    options:
      - Inadecuada (0–5)
      - Adecuada (6–9)
    empty_text: ""

  - id: extension_colonoscopia
    type: multi
    required: false
    required_if_procedimiento_grupo: [Endoscopia digestiva baja (colonoscopia / rectosigmoidoscopia)]
    label: Extensión del estudio
    options:
      - Recto
      - Sigmoides
      - Colon izquierdo
      - Colon transverso
      - Ciego
      - Íleon terminal (ileocolonoscopia)
    join: "; "
    empty_text: ""

  - id: hallazgo_colon
    type: multi
    required: false
    required_if_procedimiento_grupo: [Endoscopia digestiva baja (colonoscopia / rectosigmoidoscopia)]
    label: Hallazgos anatómicos
    options:
      - Normal
      - Enfermedad diverticular
      - Pólipos
      - Proctitis / colitis
      - Estenosis / lesión ocupante de espacio
    join: "; "
    empty_text: ""

  - id: ubicacion_diverticulos
    type: multi
    required: false
    required_if_hallazgo_colon: [Enfermedad diverticular]
    label: Divertículos — ubicación
    options:
      - Sigmoides
      - Pancolónica
    join: "; "
    empty_text: ""

  - id: polipos_ubicacion_tamano
    type: free
    required: false
    required_if_hallazgo_colon: [Pólipos]
    label: Pólipos — ubicación y tamaño (cm)
    empty_text: ""

  - id: clasificacion_paris_polipo
    type: single
    required: false
    required_if_hallazgo_colon: [Pólipos]
    label: Clasificación de París (pólipo)
    options:
      - Is
      - Isp
      - Ip
      - IIa
      - IIb
      - IIc
    empty_text: ""

  - id: tipo_colitis
    type: multi
    required: false
    required_if_hallazgo_colon: [Proctitis / colitis]
    label: Tipo de proctitis / colitis
    options:
      - Infecciosa
      - Ulcerosa
      - Crohn
      - Isquémica
    join: "; "
    empty_text: ""

  - id: mayo_grade_cu
    type: single
    required: false
    required_if_tipo_colitis: [Ulcerosa]
    label: Mayo endoscopic subscore (colitis ulcerosa)
    options:
      - "0"
      - "1"
      - "2"
      - "3"
    empty_text: ""

  # ========== 3. Biopsias / muestreo tisular (transversal) ==========
  - id: sitio_biopsia
    type: multi
    required: false
    required_if_procedimiento_grupo:
      - Endoscopia digestiva alta (VEDA)
      - Endoscopia digestiva baja (colonoscopia / rectosigmoidoscopia)
      - Endoscopia de emergencia / hemorragia
      - Endoscopia terapéutica / avanzada / CPRE
    label: Sitio de toma de biopsia
    options:
      - Esófago
      - Estómago (cuerpo / antro — protocolo de Sydney)
      - Duodeno (2.ª porción)
      - Íleon
      - Colon derecho
      - Colon transverso
      - Colon izquierdo
      - Sigmoides
      - Recto
    join: "; "
    empty_text: ""
    # Vacío = no se tomaron biopsias.

  - id: tecnica_biopsia
    type: multi
    required: false
    required_if_sitio_biopsia:
      - Esófago
      - Estómago (cuerpo / antro — protocolo de Sydney)
      - Duodeno (2.ª porción)
      - Íleon
      - Colon derecho
      - Colon transverso
      - Colon izquierdo
      - Sigmoides
      - Recto
    label: Técnica / dispositivo de biopsia
    options:
      - Pinza de biopsia estándar
      - Pinza jumbo
      - Cepillado citológico
    join: "; "
    empty_text: ""

  - id: objetivo_biopsia
    type: multi
    required: false
    required_if_sitio_biopsia:
      - Esófago
      - Estómago (cuerpo / antro — protocolo de Sydney)
      - Duodeno (2.ª porción)
      - Íleon
      - Colon derecho
      - Colon transverso
      - Colon izquierdo
      - Sigmoides
      - Recto
    label: Objetivo diagnóstico de la biopsia
    options:
      - Detección de Helicobacter pylori
      - Evaluación de atrofia / metaplasia intestinal (OLGA / OLGIM)
      - Confirmación de enfermedad celíaca
      - Descarte de displasia / malignidad
      - Mapeo de enfermedad inflamatoria intestinal (EII)
    join: "; "
    empty_text: ""

  - id: metodo_h_pylori
    type: multi
    required: false
    required_if_objetivo_biopsia: [Detección de Helicobacter pylori]
    label: Helicobacter pylori — método
    options:
      - Test rápido de ureasa
      - Histología
    join: "; "
    empty_text: ""

  - id: marsh_celiaquia
    type: free
    required: false
    required_if_objetivo_biopsia: [Confirmación de enfermedad celíaca]
    label: Clasificación de Marsh
    empty_text: ""

  # ========== 4. Endoscopia de emergencia / hemorragia ==========
  - id: indicacion_urgencia_endoscopia
    type: multi
    required: false
    required_if_procedimiento_grupo: [Endoscopia de emergencia / hemorragia]
    label: Indicación de urgencia
    options:
      - Hemorragia digestiva alta (HDA)
      - Hemorragia digestiva baja (HDB)
      - Cuerpo extraño / impactación alimentaria
      - Ingesta de cáusticos
    join: "; "
    empty_text: ""

  - id: manejo_hemorragia_no_variceal
    type: multi
    required: false
    required_if_procedimiento_grupo: [Endoscopia de emergencia / hemorragia]
    label: Manejo de hemorragia no variceal
    options:
      - Inyectoterapia (adrenalina 1:10.000)
      - Hemostasia mecánica (clips / hemoclips)
      - Térmica / coagulación (argón plasma / Gold Probe)
      - Polvos hemostáticos (Hemospray / EndoClot)
    join: "; "
    empty_text: ""

  - id: cantidad_hemoclips
    type: free
    required: false
    required_if_manejo_hemorragia_no_variceal: [Hemostasia mecánica (clips / hemoclips)]
    label: Cantidad de hemoclips
    empty_text: ""

  - id: manejo_hemorragia_variceal
    type: multi
    required: false
    required_if_procedimiento_grupo: [Endoscopia de emergencia / hemorragia]
    label: Manejo de hemorragia variceal / HDA portal
    options:
      - Ligadura elástica de várices esofágicas (LEVE)
      - Inyección de cianoacrilato (várices gástricas / fúndicas)
      - Sonda de Sengstaken-Blakemore / Linton
    join: "; "
    empty_text: ""

  - id: caracter_hemorragia_variceal
    type: single
    required: false
    required_if_manejo_hemorragia_variceal:
      - Ligadura elástica de várices esofágicas (LEVE)
      - Inyección de cianoacrilato (várices gástricas / fúndicas)
      - Sonda de Sengstaken-Blakemore / Linton
    label: Carácter de la hemorragia variceal
    options:
      - Profilaxis primaria (sin sangrado activo)
      - Profilaxis secundaria (resangrado)
      - Control de sangrado activo
    empty_text: ""

  - id: numero_bandas_leve
    type: free
    required: false
    required_if_manejo_hemorragia_variceal: [Ligadura elástica de várices esofágicas (LEVE)]
    label: Número de bandas (LEVE)
    empty_text: ""

  - id: extraccion_cuerpo_extrano
    type: multi
    required: false
    required_if_indicacion_urgencia_endoscopia: [Cuerpo extraño / impactación alimentaria]
    label: Extracción de cuerpo extraño / impactación
    options:
      - Asa de polipectomía
      - Cesta de Dormia
      - Pinza de cocodrilo
      - Capuchón protector
    join: "; "
    empty_text: ""

  # ========== 5. Endoscopia terapéutica / avanzada / CPRE ==========
  - id: proc_terapeutica
    type: multi
    required: false
    required_if_procedimiento_grupo: [Endoscopia terapéutica / avanzada / CPRE]
    label: Procedimiento terapéutico
    options:
      - Polipectomía simple
      - Resección mucosal endoscópica (RME / mucosectomía)
      - Disección submucosa endoscópica (DSE)
      - Dilatación neumática / hidrostática / mecánica con bujías
      - Colocación de prótesis / stent
      - Gastrostomía endoscópica percutánea (PEG)
      - CPRE — papilotomía / esfinterotomía
      - CPRE — extracción de coledocolitiasis
      - CPRE — colocación de stent biliar
    join: "; "
    empty_text: ""

  - id: tecnica_polipectomia
    type: single
    required: false
    required_if_proc_terapeutica: [Polipectomía simple]
    label: Técnica de polipectomía
    options:
      - Asa en frío
      - Asa con diatermia
    empty_text: ""

  - id: ubicacion_stent_digestivo
    type: multi
    required: false
    required_if_proc_terapeutica: [Colocación de prótesis / stent]
    label: Ubicación del stent digestivo
    options:
      - Esofágico
      - Duodenal
      - Colónico
    join: "; "
    empty_text: ""

  - id: tipo_stent_digestivo
    type: single
    required: false
    required_if_proc_terapeutica: [Colocación de prótesis / stent]
    label: Tipo de stent digestivo
    options:
      - Autoexpandible metálico
      - Plástico
    empty_text: ""

  - id: indicacion_peg
    type: single
    required: false
    required_if_proc_terapeutica: [Gastrostomía endoscópica percutánea (PEG)]
    label: Indicación de PEG
    options:
      - Disfagia neurológica (ACV, ELA, etc.)
      - Cáncer de cabeza y cuello
      - Otro
    empty_text: ""

  - id: indicacion_peg_otro
    type: free
    required: false
    required_if_indicacion_peg: [Otro]
    label: Indicación PEG (otro)
    empty_text: ""

  - id: calibre_peg_fr
    type: free
    required: false
    required_if_proc_terapeutica: [Gastrostomía endoscópica percutánea (PEG)]
    label: Calibre PEG (Fr)
    empty_text: ""

  - id: tecnica_peg
    type: single
    required: false
    required_if_proc_terapeutica: [Gastrostomía endoscópica percutánea (PEG)]
    label: Técnica PEG
    options:
      - Pull
      - Push
    empty_text: ""

  - id: profilaxis_pancreatitis_cpre
    type: single
    required: false
    required_if_proc_terapeutica: [CPRE — papilotomía / esfinterotomía]
    label: Profilaxis de pancreatitis post-CPRE
    options:
      - AINE rectal administrado (indometacina / diclofenac)
      - No administrado
    empty_text: ""

  - id: tecnica_extraccion_coledocolitiasis
    type: multi
    required: false
    required_if_proc_terapeutica: [CPRE — extracción de coledocolitiasis]
    label: Extracción de coledocolitiasis
    options:
      - Cesta de Dormia
      - Balón extractor
      - Litotricia
    join: "; "
    empty_text: ""

  - id: tipo_stent_biliar
    type: single
    required: false
    required_if_proc_terapeutica: [CPRE — colocación de stent biliar]
    label: Tipo de stent biliar
    options:
      - Plástico
      - Metálico SEEMS
    empty_text: ""

  # ========== 6. Complicaciones / incidencias ==========
  - id: complicacion_endoscopia
    type: multi
    required: false
    required_if_procedimiento_grupo:
      - Endoscopia digestiva alta (VEDA)
      - Endoscopia digestiva baja (colonoscopia / rectosigmoidoscopia)
      - Endoscopia de emergencia / hemorragia
      - Endoscopia terapéutica / avanzada / CPRE
      - Complicaciones / incidencias post-procedimiento
    label: Complicaciones intraprocedimiento
    options:
      - Sangrado controlado
      - Perforación
      - Hipoxemia transitoria / laringoespasmo
      - Aspiración
    join: "; "
    empty_text: ""
    # Vacío = ninguna (no opción «Ninguna» combinable).

  - id: medidas_correccion_complicacion
    type: free
    required: false
    required_if_complicacion_endoscopia:
      - Sangrado controlado
      - Perforación
      - Hipoxemia transitoria / laringoespasmo
      - Aspiración
    label: Medidas de corrección aplicadas
    empty_text: ""

  - id: estado_retiro_servicio
    type: multi
    required: false
    required_if_procedimiento_grupo:
      - Endoscopia digestiva alta (VEDA)
      - Endoscopia digestiva baja (colonoscopia / rectosigmoidoscopia)
      - Endoscopia de emergencia / hemorragia
      - Endoscopia terapéutica / avanzada / CPRE
      - Complicaciones / incidencias post-procedimiento
    label: Estado al retiro del servicio
    options:
      - Recuperación anestésica satisfactoria
      - Alta ambulatoria
      - Hospitalización / observación
    join: "; "
    empty_text: ""

  - id: aldrete_score
    type: free
    required: false
    required_if_estado_retiro_servicio: [Recuperación anestésica satisfactoria]
    label: Aldrete (/10)
    empty_text: ""

plantilla_texto: |
  Endoscopia — {{procedimiento_grupo}}. Sedación {{sedacion_endoscopia}}. Abordaje {{abordaje}}{{conversion_causa}}.
  VEDA: {{indicacion_veda}}; esófago {{hallazgo_esofago}} LA {{grado_los_angeles}} Barrett C{{barrett_praga_c}} M{{barrett_praga_m}} várices {{grado_varices_esofagicas}} {{signos_rojos_varices}}; estómago {{hallazgo_estomago}} {{tipo_gastritis}} Forrest {{forrest_ulcera_gastrica}}; duodeno {{hallazgo_duodeno}}.
  Colon: BBPS D{{bbps_colon_derecho}} T{{bbps_colon_transverso}} I{{bbps_colon_izquierdo}} {{calidad_preparacion_bbps}}; extensión {{extension_colonoscopia}}; {{hallazgo_colon}} divert. {{ubicacion_diverticulos}}; pólipos {{polipos_ubicacion_tamano}} París {{clasificacion_paris_polipo}}; colitis {{tipo_colitis}} Mayo {{mayo_grade_cu}}.
  Biopsia: {{sitio_biopsia}}; {{tecnica_biopsia}}; {{objetivo_biopsia}} Hp {{metodo_h_pylori}} Marsh {{marsh_celiaquia}}.
  Urgencia: {{indicacion_urgencia_endoscopia}}; no variceal {{manejo_hemorragia_no_variceal}} clips {{cantidad_hemoclips}}; variceal {{manejo_hemorragia_variceal}} carácter {{caracter_hemorragia_variceal}} bandas {{numero_bandas_leve}}; CE {{extraccion_cuerpo_extrano}}.
  Terapéutica: {{proc_terapeutica}} polipect. {{tecnica_polipectomia}}; stent {{ubicacion_stent_digestivo}} {{tipo_stent_digestivo}}; PEG {{indicacion_peg}}{{indicacion_peg_otro}} {{calibre_peg_fr}} Fr {{tecnica_peg}}; CPRE profilaxis {{profilaxis_pancreatitis_cpre}} extracción {{tecnica_extraccion_coledocolitiasis}} stent biliar {{tipo_stent_biliar}}.
  Complicaciones: {{complicacion_endoscopia}} {{medidas_correccion_complicacion}}; retiro {{estado_retiro_servicio}} Aldrete {{aldrete_score}}/10.
```

---

## Notas (OK de semilla)

1. `procedimiento_grupo` **single** (sin foco «Biopsias»). Tipografía
   **Lateralidad**.
2. Validación: criterio AnesFact (Diego), **no** gastroenterólogo ni
   Dra. Huerta (ver cabecera) — salvedad se mantiene.
3. Typo corregido: **Celiaquía** (no «Celiquía»).
4. Biopsias: transversales a VEDA / colonoscopia / urgencia /
   terapéutica (vacío = no tomadas).
5. Pólipos: París single + ubicación/tamaño free. Mayo CU single 0–3.
6. CPRE: profilaxis pancreatitis si papilotomía/esfinterotomía.
7. Variceal: carácter (primaria / secundaria / activo).
8. PEG: indicación específica.
9. Complicaciones: vacío = ninguna (sin «Ninguna» combinable).
10. Sin solape real con Cirugía General.
11. Numéricos sin `empty_text` inventado. Convertido + causa.
12. Bruto (6 secciones) + 4 correcciones + post-Tanda 2.
