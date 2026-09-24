# Cirugía Torácica — hallazgos / tracking

**Estado (2026-09-14):** **OK de semilla** del módulo Tórax
(`ct-torax-v1`). Motor P2 pendiente.

Mismo proceso que CyC / Cirugía General: bruto → correcciones → esqueleto
en tandas → OK de semilla.

Cáscara A4 fija (consentimiento / gasas / ATB) = entidad Foja Qx, **no**
va en este módulo.

---

## Validación clínica (no negociable hasta revisión especialista)

**No paridad con CyC ni Cirugía General.** Esas especialidades tuvieron
validación directa de la Dra. Huerta. Ella **no** es cirujana torácica:
este módulo se cerró con **criterio clínico del equipo AnesFact (Diego)**.
La nota en la cabecera de [01-torax.md](01-torax.md) se **mantiene tal
cual** hasta que un/a cirujano/a torácico/a real lo revise.

---

## Módulo — Tórax

**Doc:** [01-torax.md](01-torax.md) — **OK de semilla** (2026-09-14).

| Tema | En esqueleto |
|---|---|
| Hermeticidad muñón / línea sutura | Fuga / Sin fuga / No realizada; no Wedge |
| Regla 1 frénico + recurrente izq. | + No aplica; Neumonectomía/Lobectomía y mediastino (IDs por foco) |
| Indicación resección pulmonar | Multi (neoplasia, metástasis, …) |
| Drenaje pleural | `calibre_fr` + `ubicacion` (+ Otro) |
| Indicación pleura | Empiema / Hemotórax retenido / Otro |
| Dx mediastino | Condicionado por compartimento |
| Timectomía | Simple / extendida (grasa perithímica) |
| Fístula | Hermeticidad post-refuerzo (etiqueta unificada) |
| Reexpansión | Sí / No / No evaluada |
| Lateralidad | + **No aplica (abordaje central / mediastínico)** |
| Regla 3 | Ventilación selectiva → `foja.consideraciones` |

### Correcciones de auditoría (aplicadas antes del OK)

1. Hermeticidad muñón (no Wedge).  
2. Frénico + recurrente izquierdo (+ No aplica).  
3. Indicación resección multi.  
4. Drenaje Fr / ubicación separados.  
5. Indicación pleura Empiema/Hemotórax/Otro.  
6. Dx mediastino por compartimento.  
7. Extensión timectomía.  
8. Hermeticidad post-refuerzo fístula.  
9. Reexpansión + No evaluada.  
10. Lateralidad + No aplica (central/mediastínico).

---

## Orden

1. Tórax — **OK de semilla** (con salvedad de validación)  
2. Motor P2 — pendiente (gate §8)  
3. Revisión por cirujano/a torácico/a — abierta (actualizar esta nota si ocurre)

`foja.consideraciones` = fase aparte bajo P2; no bloquea.
