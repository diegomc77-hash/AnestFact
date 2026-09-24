# Cirugía Cardiovascular — hallazgos / tracking

**Estado (2026-09-14):** **OK de semilla** del módulo Cardiovascular
(`ccv-cardiovascular-v1`). Motor P2 pendiente.

Mismo proceso que el resto del catálogo P2: bruto → correcciones →
esqueleto en tandas → OK de semilla.

Cáscara A4 fija (consentimiento / gasas / ATB) = entidad Foja Qx, **no**
va en este módulo.

---

## Validación clínica (no negociable hasta revisión especialista)

**No paridad con CyC ni Cirugía General.** Especialidad de máximo
riesgo (junto con Neurocirugía). Cierre con **criterio clínico AnesFact
(Diego)** — auditoría con rigor de especialista, pensado para uso por
cirujano/a cardiovascular real, **sin** reemplazar revisión futura.
Misma salvedad que Torácica / Urológica / Ginecológica / Traumatología /
Vascular / Plástica / Neurocirugía. La nota en cabecera de
[01-cardiovascular.md](01-cardiovascular.md) se **mantiene tal cual**.

---

## Módulo — Cardiovascular

**Doc:** [01-cardiovascular.md](01-cardiovascular.md) — **OK de semilla**
(2026-09-14).

| Tema | En esqueleto |
|---|---|
| 9 correcciones de auditoría | Aplicadas |
| Transversal | Carácter (electiva/urgente/emergencia); reexploración sangrado |
| §1 CEC | Destete; reesternotomía; paro hipotérmico |
| §2 CRM | Indicación multi; TTFM |
| §3 Valvular | Indicación por válvula; ETE; resultado revisión |
| §4 Aorta/cong | Troncos supraaórticos; gradiente septal post-miectomía |
| §5 Soporte/cierre | Indicación soporte; protamina; drenajes; osteosíntesis |

### Correcciones post-tandas (antes del OK)

- `caracter_cirugia` transversal.
- `resultado_revision_valvular` (si ETE = revisión).
- `gradiente_septal_post_mmhg` (miectomía septal).

### Consideraciones anestesia (no slots)

Mayor densidad de coordinación del catálogo. Gatillos en roadmap P2:
CEC/ACT; paro hipotérmico; off-pump; protamina; ETE; destete/inotrópicos.
Ver `docs/ROADMAP_ESCALAMIENTO.md`.

---

## Orden

1. Cardiovascular — **OK de semilla** (con salvedad de validación)  
2. Motor P2 — pendiente (gate §8)  
3. Revisión por cirujano/a cardiovascular — abierta

`foja.consideraciones` = fase aparte bajo P2; no bloquea.
