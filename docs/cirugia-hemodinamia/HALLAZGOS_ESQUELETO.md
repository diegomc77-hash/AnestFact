# Hemodinamia y Cardiología Intervencionista — hallazgos / tracking

**Estado (2026-09-15):** **OK de semilla** del módulo Hemodinamia
(`chem-hemodinamia-v1`, **M19**) — alcance **§1–4 + §6**.

**§5 Intervencionismo periférico / neurovascular:** **NO** forma parte
del OK de semilla. Diferida por solape real con M12 Cirugía Vascular
(`cvasc-vascular-v1`). Camino preferido: xref / foja por especialidad
(patrón CEBC). **M12 no se toca** hasta decisión explícita de Diego.

Motor P2 pendiente.

Cáscara A4 fija (consentimiento / gasas / ATB) = entidad Foja Qx, **no**
va en este módulo.

---

## Validación clínica (no negociable hasta revisión especialista)

**No paridad con CyC ni Cirugía General.** Cierre con **criterio clínico
AnesFact (Diego)** — auditoría con rigor de especialista, pensado para
uso por hemodinamista real, **sin** reemplazar revisión futura. Misma
salvedad que el resto del catálogo M8+. La nota en cabecera de
[01-hemodinamia.md](01-hemodinamia.md) se **mantiene tal cual**.

---

## Módulo — Hemodinamia (M19)

**Doc:** [01-hemodinamia.md](01-hemodinamia.md) — **OK de semilla**
§1–4 + §6 (2026-09-15).

| Sección | Estado |
|---|---|
| §1 Accesos | **OK de semilla** |
| §2 Coronario | **OK de semilla** |
| §3 Estructural | **OK de semilla** |
| §4 Electrofisiología | **OK de semilla** |
| §5 Periférico / neurovascular | **Diferida** — no en OK; solape M12 |
| §6 Contraste / DAP / presiones | **OK de semilla** |

### Auditoría

- Tandas §1–4: hallazgos stents multivaso (labels); leak paravalvular.
- §6: aprobada; gradiente solo estructural.
- §5: diferida (xref preferido; M12 intacto).

### Post-tandas (antes del OK)

- Labels `numero_stents` / `marca_medidas_stent` por vaso.
- `valvula_leak_paravalvular` + `resultado_leak_paravalvular`.

---

## Orden

1. Hemodinamia §1–4 + §6 — **OK de semilla** (salvedad validación)  
2. §5 — abierta (decisión vs M12)  
3. Motor P2 — pendiente (gate §8)  
4. Revisión por hemodinamista — abierta

`foja.consideraciones` = fase aparte bajo P2; no bloquea.
