# Cirugía General — material Foja Quirúrgica (P2)

**Estado:** 6/6 · **OK de semilla del set CG** (M1–M6) · soft handoffs
aplicados · sin motor.

Especialidad: `Cirugía General` (clave `#f-serv` a alinear cuando se arme
el set). Mismo criterio de diseño que CyC (`docs/proformas-cyc/`).

**Tracking:** [HALLAZGOS_ESQUELETO.md](HALLAZGOS_ESQUELETO.md)

| # | Módulo | Archivo | Estado |
|---|---|---|---|
| 1 | Pared Abdominal | [01-pared-abdominal.md](01-pared-abdominal.md) | **OK de semilla** |
| 2 | Gastrointestinal | [02-gastrointestinal.md](02-gastrointestinal.md) | **OK de semilla** |
| 3 | Pancreato-Biliar | [03-pancreato-biliar.md](03-pancreato-biliar.md) | **OK de semilla** |
| 4 | Proctología | [04-proctologia.md](04-proctologia.md) | **OK de semilla** |
| 5 | Retroperitoneo | [05-retroperitoneo.md](05-retroperitoneo.md) | **OK de semilla** |
| 6 | Esofagogástrico / Bariátrica / Hernias internas | [06-esofagogastrico.md](06-esofagogastrico.md) | **OK de semilla** |

### Correcciones ya aplicadas en Módulo 2 (esqueleto)

- Ostomías: `trayecto_muscular` + `fijacion_estoma` (no «transrectal»).
- Hermeticidad: `Fuga demostrada` / `Sin fuga demostrada` / `No realizada`.
- Apendicectomía: sección propia (vía / hallazgo / muñón).
- Sleeve: xref a M6.

---

## Nota de diseño — Coordinación anestesia ↔ qx (fase aparte bajo P2)

**Confirmado 2026-09-14.** No bloquea el esqueleto ni la semilla de
Cirugía General. **0 código** hasta retomar P2 con gate §8.

Datos del **anestesista**, motivados por la cirugía (Regla 3 y afines):
p. ej. no curarización prolongada (NIM), ventilación selectiva
(esofaguectomía / toracoabdominal), vía aérea MLS, eventos hemodinámicos
(feocromo). No es “tipo de anestesia” genérico (ese sigue en foja
anestesia habitual / no se duplica en cada proforma qx).

| Decisión | Diseño |
|---|---|
| Dónde | `S.cur.foja.consideraciones` (objeto aditivo). Ausente = caso normal. |
| GECLISA / Mayo | **Ignorar** en payload / `fill.js` / cola. No nuevos IDs. |
| UI | Bloque colapsable; chips. Sugerencia desde foja qx si hay gatillo → el anestesista **confirma o descarta** (nunca auto-obligatorio). |
| Print A4 Aero/públicos | **Sin fila nueva.** Frase plegada a la línea ya existente de **Métodos** (u obs con tope), mismo espíritu que PROT; no bajar el gráfico. |
| Alcance | **Fase aparte** bajo P2, transversal (CyC + CG + futuras). Catálogo de gatillos qx → sugerencia anestesia. |
| Contrato | Extender `S.cur` solo con OK explícito (MAPA). |

Detalle vivo también en roadmap P2 («Coordinación / consideraciones»).
