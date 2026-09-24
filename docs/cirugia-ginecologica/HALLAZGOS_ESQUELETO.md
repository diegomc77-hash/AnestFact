# Cirugía Ginecológica — hallazgos / tracking

**Estado (2026-09-14):** **OK de semilla** del módulo Ginecología /
pelviana (`cgine-pelviana-v1`). Motor P2 pendiente.

Mismo proceso que CyC / CG / Torácica / Urológica: bruto → correcciones
→ esqueleto en tandas → OK de semilla.

Cáscara A4 fija (consentimiento / gasas / ATB) = entidad Foja Qx, **no**
va en este módulo.

---

## Validación clínica (no negociable hasta revisión especialista)

**No paridad con CyC ni Cirugía General.** Esas especialidades tuvieron
validación directa de la Dra. Huerta. Ella **no** es ginecóloga: este
módulo se cerró con **criterio clínico del equipo AnesFact (Diego)** —
auditoría con el mismo rigor del catálogo, **sin** reemplazar revisión
futura por ginecóloga/o. Misma salvedad que Torácica y Urológica. La
nota en cabecera de [01-ginecologia.md](01-ginecologia.md) se
**mantiene tal cual**.

---

## Módulo — Ginecología / pelviana

**Doc:** [01-ginecologia.md](01-ginecologia.md) — **OK de semilla**
(2026-09-14).

| Tema | En esqueleto |
|---|---|
| 12 correcciones de auditoría | Aplicadas |
| Uréteres + vejiga | Regla 1 en toda histerectomía |
| Radical | Márgenes parametrio/vaginal + preservación nerviosa |
| Anexial | Rotura quiste; ATO → campo |
| Onco | Plantilla linfadenectomía; centinela; rotura capsular ovario; invasión miometrial |
| Piso | TVT ≠ TOT; POP-Q; **cistoscopía control TVT** |
| Histeroscopía | Complicación; margen conización |
| Drenaje | Tipo + cantidad separados |

### Correcciones post-tandas (antes del OK)

- `preservacion_nerviosa_radical` (Wertheim-Meigs).
- `rotura_capsular_oncologica` + `invasion_miometrial`.
- `cistoscopia_control_tvt` (solo TVT).

---

## Orden

1. Ginecología — **OK de semilla** (con salvedad de validación)  
2. Motor P2 — pendiente (gate §8)  
3. Revisión por ginecóloga/o — abierta (actualizar esta nota si ocurre)

`foja.consideraciones` = fase aparte bajo P2; no bloquea.
