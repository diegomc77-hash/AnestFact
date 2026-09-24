# Cirugía Urológica — hallazgos / tracking

**Estado (2026-09-14):** **OK de semilla** del módulo Urología
(`cu-urologia-v1`). Motor P2 pendiente.

Mismo proceso que CyC / CG / Torácica: bruto → correcciones → esqueleto
en tandas → OK de semilla.

Cáscara A4 fija (consentimiento / gasas / ATB) = entidad Foja Qx, **no**
va en este módulo.

---

## Validación clínica (no negociable hasta revisión especialista)

**No paridad con CyC ni Cirugía General.** Esas especialidades tuvieron
validación directa de la Dra. Huerta. Ella **no** es uróloga: este
módulo se cerró con **criterio clínico del equipo AnesFact (Diego)** —
auditoría con el mismo rigor del catálogo, **sin** reemplazar revisión
futura por urólogo/a. Misma salvedad que Torácica. La nota en cabecera
de [01-urologia.md](01-urologia.md) se **mantiene tal cual**.

---

## Módulo — Urología

**Doc:** [01-urologia.md](01-urologia.md) — **OK de semilla** (2026-09-14).

| Tema | En esqueleto |
|---|---|
| 14 correcciones de auditoría | Aplicadas |
| Trombectomía VCI + Neves-Zincke | + gatillo III/IV → `foja.consideraciones` |
| RTU-V | En vesical/prostática (no litiasis) + profundidad |
| NLPC | `nefrostomia_post_nlpc` ≠ stent ureteral |
| Complicación endourología | Perforación ureteral / pielocalicial / Otra |
| Márgenes | Nefrectomía parcial, cistectomía radical, prostatectomía radical |
| Regla 1 | Ilíacos + obturador (Boari); uréteres bilaterales (cistectomía) |
| Lateralidad genital | Incluye orquiectomía **simple/subcapsular** (bilateral/ADT) |
| Foley / drenaje | Campos separados (Fr, balón, días; tipo + cantidad) |

### Correcciones post-tandas (antes del OK)

- `trombo_vci_nivel` III/IV → consideraciones (no slot qx).
- `nefrostomia_post_nlpc` + `complicacion_endourologia`.
- `lateralidad_genital` + orquiectomía simple/subcapsular.

---

## Orden

1. Urología — **OK de semilla** (con salvedad de validación)  
2. Motor P2 — pendiente (gate §8)  
3. Revisión por urólogo/a — abierta (actualizar esta nota si ocurre)

`foja.consideraciones` = fase aparte bajo P2; no bloquea.
