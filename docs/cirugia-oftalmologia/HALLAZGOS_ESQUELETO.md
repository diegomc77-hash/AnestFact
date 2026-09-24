# Oftalmología y Cirugía Ocular — hallazgos / tracking

**Estado (2026-09-15):** **OK de semilla** del módulo Oftalmología
(`coft-oftalmologia-v1`, **M18**). Motor P2 pendiente.

Mismo proceso que el resto del catálogo P2: bruto → correcciones →
esqueleto en tandas → OK de semilla.

Cáscara A4 fija (consentimiento / gasas / ATB) = entidad Foja Qx, **no**
va en este módulo.

---

## Validación clínica (no negociable hasta revisión especialista)

**No paridad con CyC ni Cirugía General.** Cierre con **criterio clínico
AnesFact (Diego)** — auditoría con rigor de especialista, pensado para
uso por oftalmólogo/a real, **sin** reemplazar revisión futura. Misma
salvedad que el resto del catálogo M8+. La nota en cabecera de
[01-oftalmologia.md](01-oftalmologia.md) se **mantiene tal cual**.

---

## Solape

**Sin superposición real** con otros módulos. Blefaroplastia **funcional**
acá **convive** con Plástica (estética/reconstructiva); no se fusionan;
Plástica OK no se tocó. Regla de organización del catálogo (roadmap P2).

---

## Módulo — Oftalmología (M18)

**Doc:** [01-oftalmologia.md](01-oftalmologia.md) — **OK de semilla**
(2026-09-15).

| Tema | En esqueleto |
|---|---|
| 13 correcciones de auditoría | Aplicadas |
| §1 Segmento anterior | Trasplante; complicación faco; EECC ≠ FLACS |
| §2 Vitreorretiniana | Retina final; DR/mácula; SF6/C3F8; silicona |
| §3 Glaucoma | PIO; indicación; antimetabolitos sin «Sin…» |
| §4 Oculoplastia | Tumor/margen; DCR; implante orbitario |
| §5 Estrabismo/trauma | Ángulo; zona+AV solo trauma; mm recess/resect |

### Auditoría por tandas

- **Tanda 1** (cabecera + índice + §1): aprobada. EECC ≠ FLACS confirmado
  (corrección clínica del bruto).
- **Tanda 2** (§2 + §3): hallazgo → quitar «Sin antimetabolitos» de multi.
  Resto aprobado.
- **Tanda 3** (§4 + §5 + plantilla + notas): aprobada sin hallazgos
  nuevos.

### Post-tandas (antes del OK)

- `antimetabolito_trabeculectomia`: solo Mitomicina C / 5-FU; vacío =
  ausencia (patrón ya usado en vascular / biliopancreático / neuro).

---

## Orden

1. Oftalmología — **OK de semilla** (con salvedad de validación)  
2. Motor P2 — pendiente (gate §8)  
3. Revisión por oftalmólogo/a — abierta

`foja.consideraciones` = fase aparte bajo P2; no bloquea.
