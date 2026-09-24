# Gastroenterología y Endoscopia Digestiva — hallazgos / tracking

**Estado (2026-09-15):** **OK de semilla** del módulo Gastroenterología /
endoscopia (`cge-endoscopia-v1`, **M20**). Motor P2 pendiente.

Mismo proceso que el resto del catálogo P2: bruto → correcciones →
esqueleto en tandas → OK de semilla.

Cáscara A4 fija (consentimiento / gasas / ATB) = entidad Foja Qx, **no**
va en este módulo.

---

## Validación clínica (no negociable hasta revisión especialista)

**No paridad con CyC ni Cirugía General.** Cierre con **criterio clínico
AnesFact (Diego)** — auditoría con rigor de especialista, pensado para
uso por gastroenterólogo/a real, **sin** reemplazar revisión futura.
Misma salvedad que el resto del catálogo M8+. La nota en cabecera de
[01-endoscopia.md](01-endoscopia.md) se **mantiene tal cual**.

---

## Solape

**Sin superposición real** con Cirugía General (abierta / laparoscópica).
Endoscopia diagnóstica / terapéutica vive acá. CG OK no se tocó.
Regla de organización del catálogo (roadmap P2).

---

## Módulo — Endoscopia digestiva (M20)

**Doc:** [01-endoscopia.md](01-endoscopia.md) — **OK de semilla**
(2026-09-15).

| Tema | En esqueleto |
|---|---|
| 4 correcciones de auditoría | Aplicadas |
| §1 VEDA | Los Ángeles; Barrett Praga C/M; Forrest; Celiaquía |
| §2 Colonoscopia | BBPS; París single; Mayo CU 0–3 |
| Biopsias | Transversales (no foco en índice) |
| §4 Urgencia | Carácter variceal; hemoclips; CE |
| §5 Terapéutica/CPRE | Profilaxis pancreatitis; PEG; stents |
| §6 Complicaciones | Vacío = ninguna; Aldrete |

### Auditoría por tandas

- **Tanda 1** (§1): aprobada.
- **Tanda 2** (§2–4): biopsias → transversales; París + Mayo
  estructurados.
- **Tanda 3** (§5–6 + plantilla): incluida en OK completo.

### Post-tandas (antes del OK)

- Biopsias fuera de `procedimiento_grupo` (patrón Accesos Hemodinamia).
- `clasificacion_paris_polipo` + `polipos_ubicacion_tamano`.
- `mayo_grade_cu` single 0–3.

---

## Orden

1. Gastroenterología / endoscopia — **OK de semilla** (salvedad
   validación)  
2. Motor P2 — pendiente (gate §8)  
3. Revisión por gastroenterólogo/a — abierta

`foja.consideraciones` = fase aparte bajo P2; no bloquea.
