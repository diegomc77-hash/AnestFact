# Cirugía Vascular y Endovascular — hallazgos / tracking

**Estado (2026-09-14):** **OK de semilla** del módulo Vascular /
endovascular (`cvasc-vascular-v1`). Motor P2 pendiente.

Mismo proceso que CyC / CG / Torácica / Urológica / Ginecológica /
Traumatología: bruto → correcciones → esqueleto en tandas → OK de
semilla.

Cáscara A4 fija (consentimiento / gasas / ATB) = entidad Foja Qx, **no**
va en este módulo.

---

## Validación clínica (no negociable hasta revisión especialista)

**No paridad con CyC ni Cirugía General.** Esas especialidades tuvieron
validación directa de la Dra. Huerta. Ella **no** es cirujana vascular:
este módulo se cerró con **criterio clínico del equipo AnesFact
(Diego)** — auditoría con rigor de especialista de la disciplina,
pensado para uso por cirujano/a vascular real, **sin** reemplazar
revisión futura por especialista. Misma salvedad que Torácica /
Urológica / Ginecológica / Traumatología. La nota en cabecera de
[01-vascular.md](01-vascular.md) se **mantiene tal cual**.

---

## Módulo — Vascular / endovascular

**Doc:** [01-vascular.md](01-vascular.md) — **OK de semilla**
(2026-09-14).

| Tema | En esqueleto |
|---|---|
| 12 correcciones de auditoría | Aplicadas |
| §1 Aórtico | Diámetro AAA; endoleak; Stanford; uréter; AMI; tiempo clampeo |
| §2 Carotídeo | NASCET; lateralidad propia (+ Bilateral); nervios X/XII/VII; protección CAS |
| §3 Periférico | Rutherford 0–6; runoff; fasciotomía (solo isquemia aguda) |
| §4 Acceso HD | FAV / graft / Permcath; frémito solo FAV/graft |
| §5 Venosa | CEAP C0–C6; sin linfática inventada |
| §6 Amputaciones | Justificación del nivel (free) |
| Transversal | Heparinización sistémica (Aórtico / Carotídeo / Periférico) |

### Correcciones post-tandas (antes del OK)

- `tiempo_clampeo_aortico_min` (abierto / convertido).
- `monitoreo_neuro_carotideo`: sin «No utilizado» en multi.
- `proteccion_cerebral_cas` (filtro distal / flujo reverso).
- `heparinizacion_sistemica` (ACT / sin ACT / no administrada).

---

## Orden

1. Vascular — **OK de semilla** (con salvedad de validación)  
2. Motor P2 — pendiente (gate §8)  
3. Revisión por cirujano/a vascular — abierta (actualizar esta nota si ocurre)

`foja.consideraciones` = fase aparte bajo P2; no bloquea.
