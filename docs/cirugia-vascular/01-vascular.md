# Módulo — Cirugía Vascular y Endovascular

**id:** `cvasc-vascular-v1` · especialidad: Cirugía Vascular y Endovascular ·  
**Estado:** **OK de semilla** (2026-09-14). Sin motor P2.

Índice: [README.md](README.md)

Consentimiento / gasas / ATB = cáscara A4 de Foja Qx (no van acá).

## Validación clínica (leer antes de auditar)

**Este módulo no tiene el mismo nivel de validación directa que Cabeza y
Cuello ni Cirugía General.** CyC y CG fueron validados por la Dra. Huerta
en su disciplina. Ella **no** es cirujana vascular: el bosquejo y las
correcciones aplicadas aquí son **criterio clínico del equipo AnesFact
(Diego)** — auditoría con rigor de especialista de la disciplina,
pensado para uso por cirujano/a vascular real, **sin** reemplazar la
revisión futura de un/a especialista. Misma salvedad que Torácica /
Urológica / Ginecológica / Traumatología.

## Correcciones aplicadas al bosquejo (12)

**§1 Aórtico/abdominal:** (1) diámetro AAA · (2) endoleak · (3) Stanford ·
(4) uréter Regla 1 · (5) manejo AMI · tiempo clampeo (min).

**§2 Carotídeo:** (6) % estenosis NASCET · (7) nervios X / XII / VII
marginal (3 campos Regla 1) · protección CAS · monitoreo sin
«No utilizado» en multi.

**§3 Periférico:** (8) Rutherford 0–6 · (9) runoff distal ·
(10) fasciotomía si isquemia aguda.

**§5 Venosa:** (11) CEAP C0–C6 (clínico).

**§6 Amputaciones:** (12) justificación del nivel.

Tipografía: **Lateralidad** (no «Laterallidad»).

---

## Proforma — Cirugía vascular y endovascular

```text
id:            cvasc-vascular-v1
especialidad:  "Cirugía Vascular y Endovascular"
operaciones: [
  "Cirugía aórtica / abdominal (abierta o endovascular)",
  "Cirugía carotídea / troncos supraaórticos",
  "Revascularización arterial periférica",
  "Accesos vasculares para hemodiálisis",
  "Cirugía venosa",
  "Amputaciones / salvataje de miembro"
]
titulo: "Cirugía vascular y endovascular"

slots:

  # ========== Índice ==========
  - id: procedimiento_grupo
    type: single
    required: true
    label: Procedimiento / foco
    options:
      - Aórtico / abdominal
      - Troncos supraaórticos / carotídeo
      - Arterial periférico
      - Accesos vasculares para hemodiálisis
      - Venosa / linfática
      - Salvataje / amputaciones

  - id: lateralidad
    type: single
    required: false
    required_if_procedimiento_grupo:
      - Arterial periférico
      - Accesos vasculares para hemodiálisis
      - Venosa / linfática
      - Salvataje / amputaciones
    label: Lateralidad
    options: [Derecha, Izquierda]
    empty_text: ""

  - id: abordaje
    type: single
    required: false
    label: Abordaje (si aplica)
    options:
      - Abierto
      - Endovascular / percutáneo
      - Híbrido
      - Convertido a abierto
    empty_text: ""

  - id: conversion_causa
    type: free
    required: false
    required_if_abordaje: [Convertido a abierto]
    label: Causa de conversión
    empty_text: ""

  - id: heparinizacion_sistemica
    type: single
    required: false
    required_if_procedimiento_grupo:
      - Aórtico / abdominal
      - Troncos supraaórticos / carotídeo
      - Arterial periférico
    label: Heparinización sistémica
    options:
      - Administrada — ACT confirmado
      - Administrada — sin ACT
      - No administrada
    empty_text: ""

  # ========== 1. Aórtico / abdominal ==========
  - id: indicacion_aortica
    type: multi
    required: false
    required_if_procedimiento_grupo: [Aórtico / abdominal]
    label: Patología / indicación
    options:
      - Aneurisma de aorta abdominal (AAA)
      - Síndrome aórtico agudo / disección
      - Oclusión aorto-ilíaca (síndrome de Leriche)
    join: "; "
    empty_text: ""

  - id: diametro_aaa_cm
    type: free
    required: false
    required_if_indicacion_aortica: [Aneurisma de aorta abdominal (AAA)]
    label: Diámetro del aneurisma (cm)
    empty_text: ""

  - id: clasificacion_stanford
    type: single
    required: false
    required_if_indicacion_aortica: [Síndrome aórtico agudo / disección]
    label: Clasificación de Stanford
    options: [Tipo A, Tipo B]
    empty_text: ""

  - id: via_aortica
    type: single
    required: false
    required_if_procedimiento_grupo: [Aórtico / abdominal]
    label: Vía / modalidad
    options:
      - Endovascular
      - Abierto
      - Convertido a abierto
    empty_text: ""

  - id: conversion_aortica_causa
    type: free
    required: false
    required_if_via_aortica: [Convertido a abierto]
    label: Causa de conversión (aórtica)
    empty_text: ""

  - id: proc_endovascular_aortico
    type: multi
    required: false
    required_if_via_aortica: [Endovascular, Convertido a abierto]
    label: Procedimiento endovascular
    options:
      - EVAR (reparación endovascular de AAA)
      - F/BEVAR (EVAR fenestrado / con ramas viscerales)
    join: "; "
    empty_text: ""

  - id: endoleak_control
    type: single
    required: false
    required_if_proc_endovascular_aortico:
      - EVAR (reparación endovascular de AAA)
      - F/BEVAR (EVAR fenestrado / con ramas viscerales)
    label: Endoleak en angiografía de control
    options:
      - Sin endoleak
      - Tipo I
      - Tipo II
      - Tipo III
      - Tipo IV
      - Tipo V (endotensión)
      - No evaluado
    empty_text: ""

  - id: clampeo_aortico
    type: single
    required: false
    required_if_via_aortica: [Abierto, Convertido a abierto]
    label: Nivel de clampeo aórtico
    options:
      - Infrarrenal
      - Suprarrenal
      - Supra-celíaco
    empty_text: ""

  - id: tiempo_clampeo_aortico_min
    type: free
    required: false
    required_if_via_aortica: [Abierto, Convertido a abierto]
    label: Tiempo de clampeo aórtico (min)
    empty_text: ""

  - id: protesis_aortica
    type: single
    required: false
    required_if_via_aortica: [Abierto, Convertido a abierto]
    label: Reemplazo con prótesis
    options:
      - Recta
      - Bifurcada (Dacrón / PTFE)
    empty_text: ""

  - id: vasos_reimplantados
    type: multi
    required: false
    required_if_via_aortica: [Abierto, Convertido a abierto]
    label: Vasos reconstruidos / reimplantes
    options:
      - Arterias renales
      - Mesentérica superior
      - Arterias ilíacas
    join: ", "
    empty_text: ""

  - id: manejo_ami
    type: single
    required: false
    required_if_via_aortica: [Abierto, Convertido a abierto]
    label: Manejo de arteria mesentérica inferior
    options:
      - Reimplantada
      - Ligada
      - No abordada
    empty_text: ""

  - id: ureter_aortico
    type: single
    required: false
    required_if_via_aortica: [Abierto, Convertido a abierto]
    label: Uréter
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
    empty_text: ""

  # ========== 2. Troncos supraaórticos / carotídeo ==========
  - id: indicacion_carotidea
    type: multi
    required: false
    required_if_procedimiento_grupo: [Troncos supraaórticos / carotídeo]
    label: Patología / indicación
    options:
      - Estenosis carotídea sintomática
      - Estenosis carotídea asintomática
      - Aneurisma carotídeo
      - Patología del subclavio
    join: "; "
    empty_text: ""

  - id: lateralidad_carotidea
    type: single
    required: false
    required_if_procedimiento_grupo: [Troncos supraaórticos / carotídeo]
    label: Lateralidad
    options: [Derecha, Izquierda, Bilateral]
    empty_text: ""

  - id: estenosis_nascet
    type: single
    required: false
    required_if_indicacion_carotidea:
      - Estenosis carotídea sintomática
      - Estenosis carotídea asintomática
    label: Porcentaje de estenosis (NASCET)
    options:
      - <50%
      - 50-69%
      - 70-99%
      - Oclusión
      - No evaluado
    empty_text: ""

  - id: tecnica_carotidea
    type: multi
    required: false
    required_if_procedimiento_grupo: [Troncos supraaórticos / carotídeo]
    label: Técnica quirúrgica
    options:
      - Endarterectomía carotídea (EAC) convencional
      - Endarterectomía carotídea por eversión
      - Angioplastia carotídea + stent con protección embólica (CAS)
      - Bypass subclavio-carotídeo / carotídeo-carotídeo
    join: "; "
    empty_text: ""

  - id: parche_eac
    type: single
    required: false
    required_if_tecnica_carotidea: [Endarterectomía carotídea (EAC) convencional]
    label: Parche (EAC convencional)
    options:
      - Dacrón
      - PTFE
      - Vena autóloga
      - Sin parche
    empty_text: ""

  - id: monitoreo_neuro_carotideo
    type: multi
    required: false
    required_if_procedimiento_grupo: [Troncos supraaórticos / carotídeo]
    label: Monitoreo neurológico intraoperatorio
    options:
      - EEG
      - Somatosensorial (SSEP)
      - Oximetría cerebral / NIRS
    join: ", "
    empty_text: ""

  - id: shunt_carotideo
    type: single
    required: false
    required_if_tecnica_carotidea:
      - Endarterectomía carotídea (EAC) convencional
      - Endarterectomía carotídea por eversión
    label: Shunt / derivación carotídea (T-Javid / Pruitt-Inahara)
    options: [Utilizado, No utilizado]
    empty_text: ""

  - id: proteccion_cerebral_cas
    type: single
    required: false
    required_if_tecnica_carotidea: [Angioplastia carotídea + stent con protección embólica (CAS)]
    label: Dispositivo de protección cerebral (CAS)
    options:
      - Filtro distal
      - Flujo reverso proximal
    empty_text: ""

  - id: nervio_vago_x
    type: single
    required: false
    required_if_tecnica_carotidea:
      - Endarterectomía carotídea (EAC) convencional
      - Endarterectomía carotídea por eversión
      - Bypass subclavio-carotídeo / carotídeo-carotídeo
    label: Nervio vago (X)
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
    empty_text: ""

  - id: nervio_hipogloso_xii
    type: single
    required: false
    required_if_tecnica_carotidea:
      - Endarterectomía carotídea (EAC) convencional
      - Endarterectomía carotídea por eversión
      - Bypass subclavio-carotídeo / carotídeo-carotídeo
    label: Nervio hipogloso (XII)
    options:
      - Identificado y preservado
      - Lesión identificada intraoperatoriamente
      - No disecado
    empty_text: ""

  - id: rama_marginal_mandibular_vii
    type: single
    required: false
    required_if_tecnica_carotidea:
      - Endarterectomía carotídea (EAC) convencional
      - Endarterectomía carotídea por eversión
      - Bypass subclavio-carotídeo / carotídeo-carotídeo
    label: Rama marginal mandibular del facial (VII)
    options:
      - Identificada y preservada
      - Lesión identificada intraoperatoriamente
      - No disecada
    empty_text: ""

  # ========== 3. Arterial periférico ==========
  - id: indicacion_periferica
    type: multi
    required: false
    required_if_procedimiento_grupo: [Arterial periférico]
    label: Indicación
    options:
      - Isquemia crítica de miembro
      - Isquemia aguda por embolia / trombosis
      - Aneurisma poplíteo / periférico
    join: "; "
    empty_text: ""

  - id: rutherford
    type: single
    required: false
    required_if_indicacion_periferica: [Isquemia crítica de miembro]
    label: Clasificación de Rutherford
    options: ["0", "1", "2", "3", "4", "5", "6"]
    empty_text: ""

  - id: proc_revasc_abierta
    type: multi
    required: false
    required_if_procedimiento_grupo: [Arterial periférico]
    label: Revascularización abierta / quirúrgica
    options:
      - Bypass aorto-bifemoral / aorto-monofemoral
      - Bypass femoro-poplíteo
      - Bypass femoro-distal / tibial
      - Embolectomía / trombectomía arterial (Fogarty)
      - Endarterectomía femoral (profiloplastia)
    join: "; "
    empty_text: ""

  - id: nivel_femoro_popliteo
    type: single
    required: false
    required_if_proc_revasc_abierta: [Bypass femoro-poplíteo]
    label: Nivel femoro-poplíteo
    options: [Supra-patelar, Infra-patelar]
    empty_text: ""

  - id: vaso_tibial_target
    type: multi
    required: false
    required_if_proc_revasc_abierta: [Bypass femoro-distal / tibial]
    label: Target tibial (bypass distal)
    options:
      - Tibial anterior
      - Tibial posterior
      - Peronea
    join: ", "
    empty_text: ""

  - id: material_injerto
    type: single
    required: false
    required_if_proc_revasc_abierta:
      - Bypass aorto-bifemoral / aorto-monofemoral
      - Bypass femoro-poplíteo
      - Bypass femoro-distal / tibial
    label: Material del injerto
    options:
      - Vena safena magna autóloga — in situ
      - Vena safena magna autóloga — invertida
      - Prótesis (PTFE / Dacrón)
    empty_text: ""

  - id: fogarty_fr
    type: free
    required: false
    required_if_proc_revasc_abierta: [Embolectomía / trombectomía arterial (Fogarty)]
    label: Catéter de Fogarty (Fr)
    empty_text: ""

  - id: proc_endovascular_periferico
    type: multi
    required: false
    required_if_procedimiento_grupo: [Arterial periférico]
    label: Endovascular / intervencionismo
    options:
      - Angioplastia transluminal percutánea (ATP) con balón
      - Colocación de stent
      - Aterectomía (direccional / rotacional / láser)
      - Trombólisis dirigida por catéter (TDC) / trombectomía farmacomecánica
    join: "; "
    empty_text: ""

  - id: tipo_balon_atp
    type: single
    required: false
    required_if_proc_endovascular_periferico: [Angioplastia transluminal percutánea (ATP) con balón]
    label: Tipo de balón (ATP)
    options:
      - Convencional
      - Liberador de fármaco (DEB)
    empty_text: ""

  - id: tipo_stent_periferico
    type: single
    required: false
    required_if_proc_endovascular_periferico: [Colocación de stent]
    label: Tipo de stent
    options:
      - Autoexpandible
      - Expandible por balón
      - Cubierto
    empty_text: ""

  - id: runoff_distal
    type: multi
    required: false
    required_if_procedimiento_grupo: [Arterial periférico]
    label: Runoff distal — vasos tibiales permeables
    options:
      - Tibial anterior
      - Tibial posterior
      - Peronea
      - Ninguno permeable
    join: ", "
    empty_text: ""

  - id: fasciotomia
    type: single
    required: false
    required_if_indicacion_periferica: [Isquemia aguda por embolia / trombosis]
    label: Consideración de fasciotomía
    options:
      - No requerida
      - Realizada profiláctica
      - Realizada terapéutica (síndrome compartimental establecido)
    empty_text: ""

  # ========== 4. Accesos vasculares para hemodiálisis ==========
  - id: ubicacion_acceso_hd
    type: single
    required: false
    required_if_procedimiento_grupo: [Accesos vasculares para hemodiálisis]
    label: Ubicación del acceso
    options: [Antebrazo, Brazo]
    empty_text: ""

  - id: tipo_acceso_hd
    type: single
    required: false
    required_if_procedimiento_grupo: [Accesos vasculares para hemodiálisis]
    label: Tipo de acceso
    options:
      - Fístula arteriovenosa autóloga (FAV)
      - Acceso protésico (graft / PTFE)
      - Catéter de hemodiálisis
    empty_text: ""

  - id: fav_tipo
    type: single
    required: false
    required_if_tipo_acceso_hd: [Fístula arteriovenosa autóloga (FAV)]
    label: Tipo de FAV
    options:
      - Radio-cefálica (Brescia-Cimino)
      - Braquio-cefálica
      - Braquio-basílica (trasposición de vena basílica)
    empty_text: ""

  - id: trasposicion_basilica_tiempos
    type: single
    required: false
    required_if_fav_tipo: [Braquio-basílica (trasposición de vena basílica)]
    label: Trasposición basílica — tiempos
    options: [1 tiempo, 2 tiempos]
    empty_text: ""

  - id: graft_hd_config
    type: single
    required: false
    required_if_tipo_acceso_hd: [Acceso protésico (graft / PTFE)]
    label: Configuración del graft
    options:
      - En asa (loop)
      - Recto (anastomosis arterio-venosa)
    empty_text: ""

  - id: permcath_vena
    type: single
    required: false
    required_if_tipo_acceso_hd: [Catéter de hemodiálisis]
    label: Catéter tunelizado (Permcath) — vena
    options:
      - Yugular interna
      - Subclavia
      - Femoral
    empty_text: ""

  - id: fremito_soplo_io
    type: single
    required: false
    required_if_tipo_acceso_hd:
      - Fístula arteriovenosa autóloga (FAV)
      - Acceso protésico (graft / PTFE)
    label: Evaluación del frémito / soplo intraoperatorio
    options:
      - Presente y adecuado
      - Ausente / débil
    empty_text: ""

  # ========== 5. Venosa / linfática ==========
  - id: ceap_clinico
    type: single
    required: false
    required_if_procedimiento_grupo: [Venosa / linfática]
    label: Clasificación CEAP (componente clínico)
    options: [C0, C1, C2, C3, C4, C5, C6]
    empty_text: ""

  - id: proc_venosa_superficial
    type: multi
    required: false
    required_if_procedimiento_grupo: [Venosa / linfática]
    label: Patología venosa superficial / várices
    options:
      - Safenectomía / stripping
      - Ligadura de perforantes (abierta)
      - Ligadura de perforantes (SEPS endoscópica)
      - Fleboextracción / microflebectomías tipo Muller
      - Ablación térmica endovenosa — láser (EVLT)
      - Ablación térmica endovenosa — radiofrecuencia (RFA)
      - Escleroterapia con espuma
    join: "; "
    empty_text: ""

  - id: safena_abordada
    type: multi
    required: false
    required_if_proc_venosa_superficial: [Safenectomía / stripping]
    label: Safena abordada
    options:
      - Safena magna
      - Safena parva
    join: ", "
    empty_text: ""

  - id: proc_venosa_profunda
    type: multi
    required: false
    required_if_procedimiento_grupo: [Venosa / linfática]
    label: Patología venosa profunda / filtro de cava
    options:
      - Trombectomía venosa iliofemoral
      - Colocación de filtro de vena cava inferior (FVCI)
      - Angioplastia + stent venoso ilíaco (síndrome de May-Thurner)
    join: "; "
    empty_text: ""

  - id: fvci_tipo
    type: single
    required: false
    required_if_proc_venosa_profunda: [Colocación de filtro de vena cava inferior (FVCI)]
    label: Tipo de filtro FVCI
    options:
      - Temporal / removible
      - Permanente
    empty_text: ""

  # ========== 6. Salvataje / amputaciones ==========
  - id: indicacion_amputacion
    type: multi
    required: false
    required_if_procedimiento_grupo: [Salvataje / amputaciones]
    label: Indicación
    options:
      - Isquemia irreversible
      - Necrosis tisular
      - Infección severa / pie diabético no revascularizable
    join: "; "
    empty_text: ""

  - id: nivel_amputacion
    type: single
    required: false
    required_if_procedimiento_grupo: [Salvataje / amputaciones]
    label: Nivel de amputación
    options:
      - Amputación menor — digital
      - Amputación menor — transmetatarsiana
      - Amputación menor — Lisfranc / Chopart
      - Amputación infracondílea (BKA)
      - Amputación supracondílea (AKA)
      - Desarticulación de cadera
      - Desarticulación de rodilla
      - Desarticulación de tobillo / Syme
    empty_text: ""

  - id: justificacion_nivel_amputacion
    type: free
    required: false
    required_if_procedimiento_grupo: [Salvataje / amputaciones]
    label: Justificación del nivel (pulsos / Doppler proximal / clínico)
    empty_text: ""

  - id: manejo_munon
    type: multi
    required: false
    required_if_procedimiento_grupo: [Salvataje / amputaciones]
    label: Manejo del muñón
    options:
      - Cierre primario sin tensión
      - Miotendinoplastia
      - Drenaje dejado
    join: "; "
    empty_text: ""

plantilla_texto: |
  Vascular — {{procedimiento_grupo}}. Lateralidad {{lateralidad}}{{lateralidad_carotidea}}. Abordaje {{abordaje}}{{conversion_causa}}. Heparinización {{heparinizacion_sistemica}}.
  Aórtico: {{indicacion_aortica}}; Ø AAA {{diametro_aaa_cm}} cm; Stanford {{clasificacion_stanford}}; vía {{via_aortica}}{{conversion_aortica_causa}}; endovascular {{proc_endovascular_aortico}} endoleak {{endoleak_control}}; clampeo {{clampeo_aortico}} {{tiempo_clampeo_aortico_min}} min; prótesis {{protesis_aortica}}; reimplantes {{vasos_reimplantados}}; AMI {{manejo_ami}}; uréter {{ureter_aortico}}.
  Carotídeo: {{indicacion_carotidea}}; NASCET {{estenosis_nascet}}; {{tecnica_carotidea}} parche {{parche_eac}}; monitoreo {{monitoreo_neuro_carotideo}}; shunt {{shunt_carotideo}}; protección CAS {{proteccion_cerebral_cas}}; X {{nervio_vago_x}}; XII {{nervio_hipogloso_xii}}; VII marg. {{rama_marginal_mandibular_vii}}.
  Periférico: {{indicacion_periferica}}; Rutherford {{rutherford}}; abierta {{proc_revasc_abierta}} nivel FP {{nivel_femoro_popliteo}} target {{vaso_tibial_target}} injerto {{material_injerto}} Fogarty {{fogarty_fr}} Fr; endovascular {{proc_endovascular_periferico}} balón {{tipo_balon_atp}} stent {{tipo_stent_periferico}}; runoff {{runoff_distal}}; fasciotomía {{fasciotomia}}.
  Acceso HD: lat. {{lateralidad}}; {{ubicacion_acceso_hd}}; {{tipo_acceso_hd}} FAV {{fav_tipo}} tiempos {{trasposicion_basilica_tiempos}}; graft {{graft_hd_config}}; Permcath {{permcath_vena}}; frémito {{fremito_soplo_io}}.
  Venosa: CEAP {{ceap_clinico}}; superficial {{proc_venosa_superficial}} safena {{safena_abordada}}; profunda {{proc_venosa_profunda}} FVCI {{fvci_tipo}}.
  Amputación: {{indicacion_amputacion}}; nivel {{nivel_amputacion}}; justificación {{justificacion_nivel_amputacion}}; muñón {{manejo_munon}}.
```

---

## Notas (OK de semilla)

1. `procedimiento_grupo` **single**. Tipografía **Lateralidad**
   (carotídeo admite Bilateral).
2. Validación: criterio AnesFact (Diego), **no** cirujano vascular ni
   Dra. Huerta (ver cabecera) — salvedad se mantiene.
3. §1: diámetro AAA; endoleak; Stanford; uréter Regla 1; AMI;
   tiempo clampeo (min).
4. §2: NASCET; nervios X / XII / VII marginal separados;
   `lateralidad_carotidea` (incluye Bilateral; no usa el global);
   monitoreo multi **sin** «No utilizado»; protección CAS
   (filtro distal / flujo reverso).
5. §3: Rutherford 0–6; runoff; fasciotomía si isquemia aguda.
6. §4: bruto estructurado (FAV / graft / Permcath); frémito **solo**
   FAV/graft (no Permcath).
7. §5: CEAP C0–C6 clínico; **sin** slots linfáticos inventados.
8. §6: justificación del nivel en **free** (pulsos/Doppler/clínico).
9. `heparinizacion_sistemica` en Aórtico / Carotídeo / Periférico
   (dato quirúrgico; no tipo de anestesia).
10. Numéricos sin `empty_text` inventado. Convertido + causa.
11. Bruto completo (6 secciones) + 12 correcciones + hallazgos
    post-tandas versionados acá.
