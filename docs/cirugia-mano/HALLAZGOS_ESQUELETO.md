# Cirugía de Mano y Miembro Superior — hallazgos / tracking

**Estado (2026-09-14):** **OK de semilla** del módulo Cirugía de Mano
y Miembro Superior (`cmano-mano-v1`). Motor P2 pendiente.

Mismo proceso que el resto del catálogo P2: bruto → correcciones →
esqueleto en tandas → OK de semilla.

Cáscara A4 fija (consentimiento / gasas / ATB) = entidad Foja Qx, **no**
va en este módulo.

---

## Validación clínica (no negociable hasta revisión especialista)

**No paridad con CyC ni Cirugía General.** CyC y CG: validación directa
Dra. Huerta. Ella **no** es cirujana de mano: cierre con **criterio
clínico AnesFact (Diego)** — auditoría con rigor de especialista,
pensado para uso por cirujano/a de mano real, **sin** reemplazar
revisión futura. Misma salvedad que Torácica / Urológica / Ginecológica /
Traumatología / Vascular / Plástica / Neurocirugía / Cardiovascular.
La nota en cabecera de [01-mano.md](01-mano.md) se **mantiene tal cual**.

---

## Módulo — Cirugía de Mano y Miembro Superior

**Doc:** [01-mano.md](01-mano.md) — **OK de semilla** (2026-09-14).

| Tema | En esqueleto |
|---|---|
| 11 correcciones de auditoría | Aplicadas |
| §1 Osteoarticular | Reducción solo osteosíntesis; escafoides; Gustilo; `tipo_lesion_osea` = indicación |
| §2 Tendones | Zonas flexores/extensores; Dupuytren dedos + grado |
| §3 Nervio/micro | Seddon; reparación también en reimplante; nivel + viabilidad |
| §4 Artroscopia | Palmer CFCT |
| §5 Infecciones/cobertura | Hallazgo IO; second-look solo tenosinovitis infecciosa flexores |
| §6 Torniquete/cierre | Exanguinación; drenaje con «Sin drenaje» |
| Solape M11 | No fusionado con Traumatología §2 (especialidad dedicada) |

### Auditoría por tandas

- **Tanda 1** (cabecera + índice + §1): aprobada. Retirada la duda de
  campo «indicación» extra — `tipo_lesion_osea` alcanza.
- **Tanda 2** (§3 + §4): hallazgo → `proc_reparacion_nerviosa` también
  si `Amputación / reimplante`. Resto aprobado.
- **Tanda 3** (§2 + §5 + §6 + plantilla + notas): aprobada sin hallazgos
  nuevos (`second_look` limitado a Kanavel; nota 11 vs Traumatología M11).

### Correcciones post-tandas (antes del OK)

- (11) `required_if_patologia_nerviosa` de `proc_reparacion_nerviosa`:
  `[Sección nerviosa accidental, Amputación / reimplante]`.

---

## Orden

1. Cirugía de Mano — **OK de semilla** (con salvedad de validación)  
2. Motor P2 — pendiente (gate §8)  
3. Revisión por cirujano/a de mano — abierta

`foja.consideraciones` = fase aparte bajo P2; no bloquea.
