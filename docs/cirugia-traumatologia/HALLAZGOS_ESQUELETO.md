# Traumatología y Ortopedia — hallazgos / tracking

**Estado (2026-09-14):** **OK de semilla** del módulo Traumatología /
ortopedia (`cto-traumatologia-v1`). Motor P2 pendiente.

Mismo proceso que CyC / CG / Torácica / Urológica / Ginecológica: bruto →
correcciones → esqueleto en tandas → OK de semilla.

Cáscara A4 fija (consentimiento / gasas / ATB) = entidad Foja Qx, **no**
va en este módulo.

---

## Validación clínica (no negociable hasta revisión especialista)

**No paridad con CyC ni Cirugía General.** Esas especialidades tuvieron
validación directa de la Dra. Huerta. Ella **no** es traumatóloga: este
módulo se cerró con **criterio clínico del equipo AnesFact (Diego)** —
auditoría con rigor de especialista de la disciplina, pensado para uso
por traumatólogo real, **sin** reemplazar revisión futura por
especialista. Misma salvedad que Torácica / Urológica / Ginecológica. La
nota en cabecera de [01-traumatologia.md](01-traumatologia.md) se
**mantiene tal cual**.

---

## Módulo — Traumatología / ortopedia

**Doc:** [01-traumatologia.md](01-traumatologia.md) — **OK de semilla**
(2026-09-14).

| Tema | En esqueleto |
|---|---|
| 21 correcciones de auditoría | Aplicadas |
| §1 Hombro/brazo/codo | Indicación; reducción; nervio radial (diáfisis); abierta + Gustilo |
| §2 Antebrazo/muñeca/mano | Indicación; radio distal; túnel / Dupuytren / gatillo separados |
| §3 Pelvis/cadera | Garden / AO; reducción (4 técnicas); indicación artroplastia; longitud (sin RAFI pelvis) |
| §4 Muslo/rodilla | Indicación; poplítea + peroneo; fijación LCA; menisco |
| §5 Tobillo/pie | Indicación; Weber o Lauge-Hansen; sindesmosis Cotton/hook |
| §6 Columna | Niveles multi; neuromonitoreo; duramadre; plexo lumbar XLIF/OLIF |
| Degenerativa por región | §1 manguito/artrosis · §2/§5 artrosis/tendinopatía · §4 artrosis/condropatía |

### Correcciones post-tandas (antes del OK)

- Descriptor «Lesión degenerativa» adaptado por región (no literal manguito).
- `resultado_reduccion_cadera` (mismo patrón que hombro; 4 técnicas).
- `plexo_lumbar_xlif` (required si XLIF/OLIF).

---

## Orden

1. Traumatología — **OK de semilla** (con salvedad de validación)  
2. Motor P2 — pendiente (gate §8)  
3. Revisión por traumatólogo/a — abierta (actualizar esta nota si ocurre)

`foja.consideraciones` = fase aparte bajo P2; no bloquea.
