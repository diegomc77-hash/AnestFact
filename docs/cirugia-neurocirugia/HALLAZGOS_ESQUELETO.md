# Neurocirugía — hallazgos / tracking

**Estado (2026-09-14):** **OK de semilla** del módulo Neurocirugía
(`cneuro-neurocirugia-v1`). Motor P2 pendiente.

Mismo proceso que el resto del catálogo P2: bruto → correcciones →
esqueleto en tandas → OK de semilla.

Cáscara A4 fija (consentimiento / gasas / ATB) = entidad Foja Qx, **no**
va en este módulo.

---

## Validación clínica (no negociable hasta revisión especialista)

**No paridad con CyC ni Cirugía General.** Especialidad de alto riesgo.
Cierre con **criterio clínico AnesFact (Diego)** — auditoría con rigor
de especialista, pensado para uso por neurocirujano/a real, **sin**
reemplazar revisión futura. Misma salvedad que Torácica / Urológica /
Ginecológica / Traumatología / Vascular / Plástica. La nota en cabecera
de [01-neurocirugia.md](01-neurocirugia.md) se **mantiene tal cual**.

---

## Módulo — Neurocirugía

**Doc:** [01-neurocirugia.md](01-neurocirugia.md) — **OK de semilla**
(2026-09-14).

| Tema | En esqueleto |
|---|---|
| 18 correcciones de auditoría | Aplicadas |
| §1 Tumoral/infecciosa | Indicación; pares V/VII/VIII; ACI/quiasma; duramadre; **CEBC/EET** |
| §2 Vascular | Hunt-Hess/Fisher; circulación; volumen hematoma; clipado |
| §3 Neurotrauma | GCS; volumen; midline shift |
| §4 Hidro/funcional | Indicación hidrocefalia; testing DBS; posición (Jannetta) |
| §5 Raquimedular | Niveles multi; neuromonitoreo required si intramedular; raíz |
| §6 Drenajes/cierre | DVE calibración; drenaje tipo+cantidad; colgajo |
| Transversal | Posición (fosa / circulación posterior / grupo funcional) |
| Abierto | «Osteoflácida» sin confirmar |

### Correcciones post-tandas (antes del OK)

- `posicion_quirurgica`: fosa + circulación posterior + grupo funcional.
- `ubicacion_circulacion` (ant/post).
- `volumen_hematoma_vascular_cc`.
- `neuromonitoreo_raquimedular`: required condicional solo si tumor
  intramedular (`required_if_proc_raquimedular`); advertencia motor.
- `raiz_nerviosa_schwannoma` + `nivel_raiz_afectada`.

### Ampliación post-OK — CEBC / EET (2026-09-14)

Expansión de la casilla EET existente (sin módulo híbrido). Diff
aprobado por Diego; merge tras OK explícito (regla catálogo / OK ajenos).

| Campo | Rol |
|---|---|
| `lesion_cebc` | Adenoma / craneofaringioma / cordoma / meningioma / fístula LCR |
| `corredor_cebc` | Transesfenoidal (sellar/presellar/parasellar/clival) / transcribiforme / transpterigoideo |
| `cebc_cierre_xref_nota` | Xref → CyC P7 (`cyc-nariz-senos-v1`); cierre nasal **no** acá |

**Equipo neuro+ORL:** foja cada uno (Huerta 2026-09-14). Xref alcanza;
sin foja compartida. Traumatología M11 **no** se tocó.

### Consideraciones anestesia (no slots)

Gatillos en roadmap P2: awake; DBS testing; sentado/VAE; clipado;
HTE refractaria. Ver `docs/ROADMAP_ESCALAMIENTO.md`.

---

## Orden

1. Neurocirugía — **OK de semilla** (con salvedad de validación)  
2. Ampliación CEBC §1 — **mergeada** (2026-09-14)  
3. Motor P2 — pendiente (gate §8); respetar required condicional
   neuromonitoreo intramedular  
4. Revisión por neurocirujano/a — abierta (p. ej. «Osteoflácida»)

`foja.consideraciones` = fase aparte bajo P2; no bloquea.
