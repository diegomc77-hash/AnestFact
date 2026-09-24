# Cirugía General — hallazgos y handoffs

**Estado (2026-09-14):** **OK de semilla del set CG** — M1–M6
cerrados (incl. soft handoffs). Motor P2 pendiente. `foja.consideraciones`
= fase aparte bajo P2.

Cáscara A4 fija (consentimiento / gasas / ATB) = entidad Foja Qx, **no**
va en estos módulos.

---

## Reglas transversales CG (aplicar en todos)

| # | Regla | Modelo al esqueleto |
|---|---|---|
| 1 | Integridad estructura crítica | `Identificada y preservada` / `Lesión identificada intraoperatoriamente` (+ free) / `No disecado` cuando aplique. Checklist técnico (p. ej. CVS) **aparte**, nunca fusionado. Incluye **vagos** en toda cirugía que diseccione hiato (M6 + Sleeve). |
| 2 | Riesgo funcional previo | Solo si se divide a propósito una estructura funcional (continencia pre fistulotomía/ELI/setón cortante). No generalizar. |
| 3 | Coordinación anestesia | **No** `tipo_anestesia` en proforma qx. Datos del anestesista → `S.cur.foja.consideraciones` (fase aparte P2; GECLISA ignora; print → Métodos). Gatillos qx solo sugieren. |
| 4 | Campo L/LC/C | Si urgencia / contaminación plausible; amarrar decisión técnica (p. ej. anastomosis vs Hartmann). Opciones: `Limpio` / `Limpio-contaminado` / `Contaminado`. |

### Transversales de producto (todos los módulos)

- **Hermeticidad:** `Fuga demostrada` / `Sin fuga demostrada` / `No realizada` (nunca Positiva/Negativa).
- **Lateralidad** (tipografía unificada; no «Laterallidad»).
- **Abordaje:** Abierto / Laparoscópico / Robótico / Convertido + **causa** (free).
- **Drenajes:** Sí / **Sin drenaje**; si Sí → tipo/cantidad/ubicación sin inventar números.
- **Numéricos:** sin `empty_text` que invente valores.
- **Handoffs (formato único del set):**
  - Inter-módulo: `Sí — completar en Mn Nombre (id)`  
    ej. `Sí — completar en M2 Gastrointestinal (cg-gastrointestinal-v1)`
  - Xref: `… — ver Mn Nombre (id)` + nota `Definición completa en Mn Nombre (id) — no completar slots acá`
  - Intra-módulo: `Sí — completar en foco «opción exacta del índice» (misma foja)`

---

## Decisiones cerradas (ex-preguntas Huerta) — 2026-09-14

| # | Tema | Decisión |
|---|---|---|
| 1 | Apendicectomía | Sección propia **dentro de M2 GI**. |
| 2 | Sleeve | Definición completa en **M6**; M2 solo xref. |
| 3 | Diástasis M1 | Abordaje abierto / REPA / SCOPA / eTEP + plicatura + malla. |
| 4 | Hermeticidad M3 | Toda anastomosis digestiva del módulo; etiqueta unificada. |
| 5 | Hermeticidad M6 | Funduplicatura + esofaguectomía; mismo criterio. |
| 6 | Collis | En paraesofágica / esófago corto. |
| 7 | Vagos | Regla 1 ant/post en disección de hiato (incl. Sleeve). |
| 8 | Revisional bariátrica | Subtipos: banda→bypass, sleeve→bypass, revisión de asa. |

---

## Módulos — OK de semilla

| # | Módulo | Doc | Estado |
|---|---|---|---|
| 1 | Pared | [01-pared-abdominal.md](01-pared-abdominal.md) | **OK de semilla** |
| 2 | GI | [02-gastrointestinal.md](02-gastrointestinal.md) | **OK de semilla** |
| 3 | Pancreato-biliar | [03-pancreato-biliar.md](03-pancreato-biliar.md) | **OK de semilla** |
| 4 | Procto | [04-proctologia.md](04-proctologia.md) | **OK de semilla** |
| 5 | Retroperitoneo | [05-retroperitoneo.md](05-retroperitoneo.md) | **OK de semilla** |
| 6 | Esofagogástrico | [06-esofagogastrico.md](06-esofagogastrico.md) | **OK de semilla** |

---

## Pasada cruzada — soft aplicados (2026-09-14)

| Soft | Cambio |
|---|---|
| 1 | M5 `resecciones_multiviscerales`: `Hemicolectomía derecha` / `Hemicolectomía izquierda` / `Sigmoidectomía` / `Pancreatectomía corporocaudal (distal)` / `Esplenectomía (asociada)` (sin combinar distal+bazo). |
| 2 | M5: `handoff_gi` + `handoff_pancreato` (mismo mecanismo que M1). M6 hernia: `handoff_gi` explícito. |
| 3 | Wording unificado Mn + id en M1–M6 (ver formato arriba). |
| 4 | M3 `handoff_reconstruccion_vbp` → foco «Vía biliar / derivaciones / reconstrucción». |
| 5 | M1 campo: `Contaminado` (quitó «/ infectado»). |

### Matriz handoffs (post-soft)

| Origen | Destino | Slot |
|---|---|---|
| M1 urgencia | M2 `cg-gastrointestinal-v1` | `handoff_gi` |
| M2 Sleeve | M6 `cg-esofagogastrico-v1` | `sleeve_xref_nota` |
| M5 colon | M2 | `handoff_gi` |
| M5 páncreas/bazo | M3 `cg-pancreato-biliar-v1` | `handoff_pancreato` |
| M6 hernia necrosis | M2 | `handoff_gi` |
| M3 lesión VBP | M3 foco vía biliar | `handoff_reconstruccion_vbp` |
| M4 Miles | M2 | nota (sin opción competidora) |

---

## Orden

1. M1–M6 — **OK de semilla** cada uno  
2. Pasada cruzada + soft — **aplicados**  
3. **OK de semilla del set CG** — **dado** (2026-09-14)

`foja.consideraciones` = fase aparte bajo P2; no bloquea.
