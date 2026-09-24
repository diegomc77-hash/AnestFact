# Módulo — Hemodinamia y Cardiología Intervencionista (M19)

**id:** `chem-hemodinamia-v1` · especialidad: Hemodinamia / Cardiología
Intervencionista ·  
**Estado:** **OK de semilla** (2026-09-15) — **§1–4 + §6**. §5
**diferida** (solape M12). Tracking:
[HALLAZGOS_ESQUELETO.md](HALLAZGOS_ESQUELETO.md).

Índice: [README.md](README.md)

Consentimiento / gasas / ATB = cáscara A4 de Foja Qx (no van acá).

## Validación clínica (leer antes de auditar)

**Este módulo no tiene el mismo nivel de validación directa que Cabeza y
Cuello ni Cirugía General.** CyC y CG fueron validados por la Dra. Huerta
en su disciplina. Ella **no** es hemodinamista / cardióloga
intervencionista: el bosquejo y las correcciones aplicadas aquí son
**criterio clínico del equipo AnesFact (Diego)** — auditoría con rigor
de especialista de la disciplina, pensado para uso por hemodinamista
real, **sin** reemplazar la revisión futura de un/a especialista. Misma
salvedad que Torácica / Urológica / Ginecológica / Traumatología /
Vascular / Plástica / Neurocirugía / Cardiovascular / Mano / ORL /
Oftalmología.

## Solape — §5 diferida (regla de organización del catálogo)

**§5 Intervencionismo periférico / neurovascular** = mismo territorio
anatómico que **M12 Cirugía Vascular** (`cvasc-vascular-v1`). No se baja
a esqueleto hasta decisión explícita. M12 OK **no se toca** sin OK de
Diego. Opciones abiertas: xref / foja por especialidad (como CEBC) /
ampliar M12 / omitir §5 en M19.

**§6 Contrastes / hemodinámica / complicaciones:** transversal. En esta
pasada: volumen/tipo contraste, DAP, fluoro, Ao/VI, gradiente pre/post
(estructural). `complicacion_intraprocedimiento` + Ellis ya en §1–2
(vacío = ninguna).

## Correcciones aplicadas al bosquejo (8) — §1–4

**§1–2 Accesos/Coronario:** (1) carácter ACTP · (2) Ellis si perforación.

**§3 Estructural:** (3) marcapasos post-TAVI · (4) IPV residual TAVI ·
(5) leak LAAO · (6) resultado cierre septal.

**§4 Electrofisiología:** (7) aislamiento venas pulmonares · (8) umbrales
marcapasos/CDI.

Tipografía: **Lateralidad** (no «Laterallidad»).

---

## Proforma — Hemodinamia y cardiología intervencionista

```text
id:            chem-hemodinamia-v1
especialidad:  "Hemodinamia / Cardiología Intervencionista"
operaciones: [
  "Accesos vasculares para hemodinamia",
  "Intervencionismo coronario (diagnóstico / terapéutico)",
  "Cardiopatía estructural / valvuloplastias percutáneas",
  "Electrofisiología / dispositivos cardíacos"
]
titulo: "Hemodinamia y cardiología intervencionista"

slots:

  # ========== Índice ==========
  - id: procedimiento_grupo
    type: single
    required: true
    label: Procedimiento / foco
    options:
      - Accesos vasculares / hemostasia
      - Intervencionismo coronario
      - Cardiopatía estructural
      - Electrofisiología / dispositivos
    # §5 periférico/neurovascular — diferido (solape M12).
    # §6 contraste/DAP/presiones — ver sección 6 (transversal).

  - id: abordaje
    type: single
    required: false
    label: Abordaje (si aplica)
    options:
      - Percutáneo
      - Convertido a quirúrgico / abierto
    empty_text: ""

  - id: conversion_causa
    type: free
    required: false
    required_if_abordaje: [Convertido a quirúrgico / abierto]
    label: Causa de conversión
    empty_text: ""

  # ========== 1. Accesos vasculares / hemostasia ==========
  # También aplicable cuando el foco es coronario / estructural / EF.
  - id: via_acceso
    type: multi
    required: false
    required_if_procedimiento_grupo:
      - Accesos vasculares / hemostasia
      - Intervencionismo coronario
      - Cardiopatía estructural
      - Electrofisiología / dispositivos
    label: Vía de acceso
    options:
      - Radial derecho
      - Radial izquierdo
      - Radial distal / tabaquera anatómica
      - Femoral derecho
      - Femoral izquierdo
      - Humeral / braquial
    join: "; "
    empty_text: ""

  - id: calibre_introductor
    type: single
    required: false
    required_if_procedimiento_grupo:
      - Accesos vasculares / hemostasia
      - Intervencionismo coronario
      - Cardiopatía estructural
      - Electrofisiología / dispositivos
    label: Calibre del introductor
    options:
      - 4 Fr
      - 5 Fr
      - 6 Fr
      - 7 Fr
      - 8 Fr
      - Gran calibre (12–16 Fr — TAVI / EVAR)
    empty_text: ""

  - id: cierre_vascular
    type: multi
    required: false
    required_if_procedimiento_grupo:
      - Accesos vasculares / hemostasia
      - Intervencionismo coronario
      - Cardiopatía estructural
      - Electrofisiología / dispositivos
    label: Dispositivo / técnica de cierre vascular
    options:
      - Compresión neumática / banda radial (TR Band)
      - Cierre percutáneo con sutura / ancla (Angio-Seal / Perclose ProGlide / MANTA)
      - Compresión manual / quirúrgica
    join: "; "
    empty_text: ""

  # ========== 2. Intervencionismo coronario ==========
  - id: proc_coronario
    type: multi
    required: false
    required_if_procedimiento_grupo: [Intervencionismo coronario]
    label: Procedimiento
    options:
      - Cinecoronariografía diagnóstica (CCG)
      - Angioplastia coronaria transluminal percutánea (ACTP)
    join: "; "
    empty_text: ""

  - id: caracter_actp
    type: single
    required: false
    required_if_proc_coronario: [Angioplastia coronaria transluminal percutánea (ACTP)]
    label: Carácter del procedimiento (ACTP)
    options:
      - Electivo
      - Urgente (SCA sin elevación ST)
      - Emergencia (IAM con elevación ST — angioplastia primaria)
    empty_text: ""

  - id: dominancia_coronaria
    type: single
    required: false
    required_if_procedimiento_grupo: [Intervencionismo coronario]
    label: Dominancia
    options:
      - Derecha
      - Izquierda
      - Codominancia
    empty_text: ""

  - id: arteria_intervenida
    type: multi
    required: false
    required_if_proc_coronario: [Angioplastia coronaria transluminal percutánea (ACTP)]
    label: Arteria intervenida
    options:
      - TCI (tronco)
      - DA (descendente anterior)
      - Cx (circunfleja)
      - CD (coronaria derecha)
      - Injerto venoso / mamario
    join: "; "
    empty_text: ""

  - id: diagnostico_intracoronario
    type: multi
    required: false
    required_if_procedimiento_grupo: [Intervencionismo coronario]
    label: Diagnóstico intracoronario / fisiología
    options:
      - IVUS
      - OCT
      - FFR / iFR
    join: "; "
    empty_text: ""

  - id: modificacion_placa
    type: multi
    required: false
    required_if_proc_coronario: [Angioplastia coronaria transluminal percutánea (ACTP)]
    label: Modificación de placa / preparación
    options:
      - Balón de alta presión / cutters
      - Aterectomía rotacional (Rotablator)
      - Litotricia intracoronaria (IVL / Shockwave)
    join: "; "
    empty_text: ""

  - id: implante_stent_balon
    type: multi
    required: false
    required_if_proc_coronario: [Angioplastia coronaria transluminal percutánea (ACTP)]
    label: Implante de stent / balón
    options:
      - Stent liberador de fármaco (DES)
      - Stent convencional (BMS)
      - Balón liberador de fármaco (DEB)
    join: "; "
    empty_text: ""

  - id: numero_stents
    type: free
    required: false
    required_if_implante_stent_balon:
      - Stent liberador de fármaco (DES)
      - Stent convencional (BMS)
    label: Número de stents (si multivaso, especificar por vaso — ej. DA: 2; Cx: 1)
    empty_text: ""

  - id: marca_medidas_stent
    type: free
    required: false
    required_if_implante_stent_balon:
      - Stent liberador de fármaco (DES)
      - Stent convencional (BMS)
      - Balón liberador de fármaco (DEB)
    label: Marca / medidas (si multivaso, por vaso — ej. DA: 2 stents 3.0×18 mm; Cx: 1 stent 2.5×15 mm)
    empty_text: ""

  - id: flujo_timi_post
    type: single
    required: false
    required_if_proc_coronario: [Angioplastia coronaria transluminal percutánea (ACTP)]
    label: Flujo TIMI post-procedimiento
    options:
      - TIMI 0
      - TIMI 1
      - TIMI 2
      - TIMI 3
    empty_text: ""

  # Complicaciones mínimas (Ellis). Lista completa + contraste/DAP → §6.
  - id: complicacion_intraprocedimiento
    type: multi
    required: false
    required_if_procedimiento_grupo:
      - Accesos vasculares / hemostasia
      - Intervencionismo coronario
      - Cardiopatía estructural
      - Electrofisiología / dispositivos
    label: Complicaciones intraprocedimiento
    options:
      - Espasmo arterial
      - Disección
      - Perforación
      - Taponamiento
      - Arritmia severa
    join: "; "
    empty_text: ""
    # Vacío = ninguna (no opción «Ninguna» combinable).

  - id: clasificacion_ellis
    type: single
    required: false
    required_if_complicacion_intraprocedimiento: [Perforación]
    label: Clasificación de Ellis (perforación)
    options:
      - Tipo I
      - Tipo II
      - Tipo III
    empty_text: ""

  # ========== 3. Cardiopatía estructural ==========
  - id: proc_estructural
    type: multi
    required: false
    required_if_procedimiento_grupo: [Cardiopatía estructural]
    label: Procedimiento
    options:
      - TAVI / TAVR
      - Reparación valvular mitral borde a borde (MitraClip / TriClip)
      - Valvuloplastia percutánea con balón
      - Cierre de orejuela de aurícula izquierda (LAAO)
      - Cierre de defecto septal
      - Cierre de leaks / fugas paravalvulares
    join: "; "
    empty_text: ""

  - id: tipo_valvula_tavi
    type: single
    required: false
    required_if_proc_estructural: [TAVI / TAVR]
    label: Tipo de válvula TAVI
    options:
      - Autoexpandible
      - Expandible por balón
    empty_text: ""

  - id: medida_valvula_tavi_mm
    type: free
    required: false
    required_if_proc_estructural: [TAVI / TAVR]
    label: Medida de la válvula TAVI (mm)
    empty_text: ""

  - id: marcapasos_post_tavi
    type: single
    required: false
    required_if_proc_estructural: [TAVI / TAVR]
    label: Necesidad de marcapasos post-TAVI
    options:
      - No requerido
      - Requerido — implantado en el mismo acto
      - Requerido — diferido
    empty_text: ""

  - id: ipv_residual_tavi
    type: single
    required: false
    required_if_proc_estructural: [TAVI / TAVR]
    label: Insuficiencia paravalvular residual post-TAVI
    options:
      - Ausente
      - Trivial
      - Leve
      - Moderada
      - Severa
    empty_text: ""

  - id: tipo_valvuloplastia
    type: single
    required: false
    required_if_proc_estructural: [Valvuloplastia percutánea con balón]
    label: Valvuloplastia — válvula
    options:
      - Aórtica
      - Mitral
    empty_text: ""

  - id: dispositivo_laao
    type: single
    required: false
    required_if_proc_estructural: [Cierre de orejuela de aurícula izquierda (LAAO)]
    label: Dispositivo LAAO
    options:
      - Watchman
      - Amulet
    empty_text: ""

  - id: leak_residual_laao
    type: single
    required: false
    required_if_proc_estructural: [Cierre de orejuela de aurícula izquierda (LAAO)]
    label: Leak residual post-LAAO
    options:
      - Sin leak
      - Leak <5 mm
      - Leak ≥5 mm
      - No evaluado
    empty_text: ""

  - id: tipo_defecto_septal
    type: multi
    required: false
    required_if_proc_estructural: [Cierre de defecto septal]
    label: Defecto septal
    options:
      - FOP
      - CIA
      - CIV
    join: "; "
    empty_text: ""

  - id: dispositivo_cierre_septal
    type: free
    required: false
    required_if_proc_estructural: [Cierre de defecto septal]
    label: Dispositivo de cierre septal
    empty_text: ""

  - id: resultado_cierre_septal
    type: single
    required: false
    required_if_proc_estructural: [Cierre de defecto septal]
    label: Resultado de cierre de defecto septal
    options:
      - Cierre completo
      - Shunt residual
    empty_text: ""

  - id: valvula_leak_paravalvular
    type: single
    required: false
    required_if_proc_estructural: [Cierre de leaks / fugas paravalvulares]
    label: Válvula del leak / fuga paravalvular
    options:
      - Aórtica
      - Mitral
      - Otra
    empty_text: ""

  - id: valvula_leak_paravalvular_otra
    type: free
    required: false
    required_if_valvula_leak_paravalvular: [Otra]
    label: Válvula leak (otra)
    empty_text: ""

  - id: resultado_leak_paravalvular
    type: single
    required: false
    required_if_proc_estructural: [Cierre de leaks / fugas paravalvulares]
    label: Resultado del cierre de leak paravalvular
    options:
      - Leak resuelto
      - Leak residual persistente
    empty_text: ""

  # ========== 4. Electrofisiología / dispositivos ==========
  - id: proc_electrofisiologia
    type: multi
    required: false
    required_if_procedimiento_grupo: [Electrofisiología / dispositivos]
    label: Procedimiento
    options:
      - Mapeo electroanatómico 3D (CARTO / EnSite)
      - Ablación de arritmia
      - Implante de marcapasos definitivo
      - Implante de cardiodesfibrilador (CDI)
      - Terapia de resincronización cardíaca (TRC-P / TRC-D)
      - Estimulación del sistema de conducción (His / rama izquierda)
    join: "; "
    empty_text: ""

  - id: energia_ablacion
    type: multi
    required: false
    required_if_proc_electrofisiologia: [Ablación de arritmia]
    label: Energía de ablación
    options:
      - Radiofrecuencia
      - Crioablación
      - Campo pulsado / PFA
    join: "; "
    empty_text: ""

  - id: sustrato_ablacion
    type: multi
    required: false
    required_if_proc_electrofisiologia: [Ablación de arritmia]
    label: Sustrato
    options:
      - Fibrilación auricular (aislamiento de venas pulmonares)
      - Flutter auricular
      - Reentrada nodal / taquicardia ventricular
    join: "; "
    empty_text: ""

  - id: aislamiento_venas_pulmonares
    type: single
    required: false
    required_if_sustrato_ablacion: [Fibrilación auricular (aislamiento de venas pulmonares)]
    label: Confirmación de aislamiento de venas pulmonares
    options:
      - Bloqueo de entrada y salida confirmado
      - Aislamiento parcial
      - No confirmado
    empty_text: ""

  - id: tipo_marcapasos
    type: single
    required: false
    required_if_proc_electrofisiologia: [Implante de marcapasos definitivo]
    label: Tipo de marcapasos
    options:
      - Monocameral
      - Bicameral
      - Sin cables / Micra
    empty_text: ""

  - id: tipo_cdi
    type: single
    required: false
    required_if_proc_electrofisiologia: [Implante de cardiodesfibrilador (CDI)]
    label: Tipo de CDI
    options:
      - Transvenoso
      - Subcutáneo / S-ICD
    empty_text: ""

  - id: umbrales_estimulacion_sensado
    type: free
    required: false
    required_if_proc_electrofisiologia:
      - Implante de marcapasos definitivo
      - Implante de cardiodesfibrilador (CDI)
    label: Umbrales de estimulación y sensado
    empty_text: ""

  # ========== 6. Contrastes / hemodinámica / complicaciones ==========
  # Transversal a §1–4. Complicaciones + Ellis ya definidos arriba
  # (vacío = ninguna; sin opción «Ninguna» combinable).
  - id: volumen_contraste_cc
    type: free
    required: false
    required_if_procedimiento_grupo:
      - Accesos vasculares / hemostasia
      - Intervencionismo coronario
      - Cardiopatía estructural
      - Electrofisiología / dispositivos
    label: Volumen de contraste (cc)
    empty_text: ""

  - id: tipo_contraste
    type: free
    required: false
    required_if_procedimiento_grupo:
      - Accesos vasculares / hemostasia
      - Intervencionismo coronario
      - Cardiopatía estructural
      - Electrofisiología / dispositivos
    label: Tipo de contraste
    empty_text: ""

  - id: dap_mgy_cm2
    type: free
    required: false
    required_if_procedimiento_grupo:
      - Accesos vasculares / hemostasia
      - Intervencionismo coronario
      - Cardiopatía estructural
      - Electrofisiología / dispositivos
    label: Producto dosis-área — DAP (mGy·cm²)
    empty_text: ""

  - id: tiempo_fluoroscopia_min
    type: free
    required: false
    required_if_procedimiento_grupo:
      - Accesos vasculares / hemostasia
      - Intervencionismo coronario
      - Cardiopatía estructural
      - Electrofisiología / dispositivos
    label: Tiempo de fluoroscopia (min)
    empty_text: ""

  - id: presion_aortica_mmhg
    type: free
    required: false
    required_if_procedimiento_grupo:
      - Accesos vasculares / hemostasia
      - Intervencionismo coronario
      - Cardiopatía estructural
      - Electrofisiología / dispositivos
    label: Presión aórtica (mmHg)
    empty_text: ""

  - id: presion_vi_mmhg
    type: free
    required: false
    required_if_procedimiento_grupo:
      - Accesos vasculares / hemostasia
      - Intervencionismo coronario
      - Cardiopatía estructural
      - Electrofisiología / dispositivos
    label: Presión ventricular izquierda (mmHg)
    empty_text: ""

  - id: gradiente_transvalvular_pre_mmhg
    type: free
    required: false
    required_if_procedimiento_grupo: [Cardiopatía estructural]
    label: Gradiente transvalvular pre (mmHg)
    empty_text: ""

  - id: gradiente_transvalvular_post_mmhg
    type: free
    required: false
    required_if_procedimiento_grupo: [Cardiopatía estructural]
    label: Gradiente transvalvular post (mmHg)
    empty_text: ""

plantilla_texto: |
  Hemodinamia — {{procedimiento_grupo}}. Abordaje {{abordaje}}{{conversion_causa}}.
  Acceso: {{via_acceso}}; introductor {{calibre_introductor}}; cierre {{cierre_vascular}}.
  Coronario: {{proc_coronario}} carácter {{caracter_actp}}; dominancia {{dominancia_coronaria}}; arteria {{arteria_intervenida}}; {{diagnostico_intracoronario}}; placa {{modificacion_placa}}; stent/balón {{implante_stent_balon}} n={{numero_stents}} {{marca_medidas_stent}}; TIMI {{flujo_timi_post}}.
  Estructural: {{proc_estructural}}; TAVI {{tipo_valvula_tavi}} {{medida_valvula_tavi_mm}} mm; MP {{marcapasos_post_tavi}}; IPV {{ipv_residual_tavi}}; valvuloplastia {{tipo_valvuloplastia}}; LAAO {{dispositivo_laao}} leak {{leak_residual_laao}}; septal {{tipo_defecto_septal}} {{dispositivo_cierre_septal}} resultado {{resultado_cierre_septal}}; leak PV {{valvula_leak_paravalvular}}{{valvula_leak_paravalvular_otra}} resultado {{resultado_leak_paravalvular}}.
  EF: {{proc_electrofisiologia}}; energía {{energia_ablacion}}; sustrato {{sustrato_ablacion}}; PV {{aislamiento_venas_pulmonares}}; MP {{tipo_marcapasos}}; CDI {{tipo_cdi}}; umbrales {{umbrales_estimulacion_sensado}}.
  Contraste/DAP: {{volumen_contraste_cc}} cc {{tipo_contraste}}; DAP {{dap_mgy_cm2}} mGy·cm²; fluoro {{tiempo_fluoroscopia_min}} min; Ao {{presion_aortica_mmhg}} mmHg; VI {{presion_vi_mmhg}} mmHg; gradiente pre {{gradiente_transvalvular_pre_mmhg}} / post {{gradiente_transvalvular_post_mmhg}} mmHg.
  Complicaciones: {{complicacion_intraprocedimiento}}; Ellis {{clasificacion_ellis}}.
```

---

## Notas (OK de semilla — §1–4 + §6)

1. `procedimiento_grupo` **single** (§1–4). **§5 diferida** (solape M12;
   xref preferido; M12 OK **no se toca** hasta decisión explícita).
2. Validación: criterio AnesFact (Diego), **no** hemodinamista ni Dra.
   Huerta (ver cabecera) — salvedad se mantiene.
3. Accesos: campos transversales a los 4 focos.
4. §2: carácter ACTP; TIMI; Ellis si Perforación; vacío en complicaciones
   = ninguna; stents multivaso guiados por label.
5. §3: marcapasos/IPV TAVI; leak LAAO; cierre septal; leak paravalvular.
6. §4: aislamiento PV si FA; umbrales si MP/CDI.
7. §6: contraste + tipo; DAP + fluoro; Ao/VI; gradiente pre/post **solo**
   foco estructural.
8. Numéricos sin `empty_text` inventado. Convertido + causa.
9. OK de semilla = §1–4 + §6. **§5 no forma parte** de este OK.
