# Proformas Cabeza y Cuello (CyC) — índice

**Estado (2026-09-13):** **13 / 13 aprobadas · OK de semilla.**  
Especialidad: `Cirugía de Cabeza y Cuello` (`#f-serv` / `i.serv`).

**Tracking ampliaciones post-OK:**
[HALLAZGOS_ESQUELETO.md](HALLAZGOS_ESQUELETO.md) (CEBC / P7 ↔ Neuro M14).

Estas definiciones (un `.md` por proforma) son la **semilla oficial** de
la especialidad hasta que exista el motor de código (P2). **No hay
implementación del motor todavía** — solo datos/diseño aprobados.

Motor previsto: `single` | `multi` | `free` + `plantilla_texto` +
`required_if_*`. Consentimiento / gasas / ATB = bloque fijo de la Foja Qx
(no van acá). Ganglios = semiología del acto; nunca conteo AP.

## Reglas de alcance (Huerta)

- **Laringe / MLS** (`11`) separada de oncología + reconstrucción (`04`).
- **Piel y faneras** (`06`) amplía/reemplaza Mohs; no convive aparte.
- **Ortognática** (`09`): oclusión final (mismo chequeo que RIFO `05`).
- **Laringe / MLS** (`11`): manejo de vía aérea (sync cirujano↔anestesia).
- **Sistrunk** (en `01`): procedimiento separado de vía/extensión tiroidea
  (patología congénita embriológica ≠ enfermedad nodular del adulto).
- **CEBC / base de cráneo:** cierre nasal dueño en P7; resección/corredor
  en Neuro M14. Equipo = foja cada uno (Huerta). Ver
  [HALLAZGOS_ESQUELETO.md](HALLAZGOS_ESQUELETO.md).

## Las 13 (semilla)

| # | id | Archivo | Semilla |
|---|---|---|---|
| 1 | `cyc-tiroides-paratiroides-v1` | [01-tiroides-paratiroides.md](01-tiroides-paratiroides.md) | OK |
| 2 | `cyc-vaciamiento-cervical-v1` | [02-vaciamiento-cervical.md](02-vaciamiento-cervical.md) | OK |
| 3 | `cyc-salivales-v1` | [03-salivales.md](03-salivales.md) | OK |
| 4 | `cyc-oncologia-reconstruccion-v1` | [04-oncologia-reconstruccion.md](04-oncologia-reconstruccion.md) | OK |
| 5 | `cyc-rifo-v1` | [05-rifo.md](05-rifo.md) | OK |
| 6 | `cyc-piel-faneras-v1` | [06-piel-faneras.md](06-piel-faneras.md) | OK |
| 7 | `cyc-nariz-senos-v1` | [07-nariz-senos.md](07-nariz-senos.md) | OK (+ CEBC cierre 2026-09-14) |
| 8 | `cyc-benigna-cuello-v1` | [08-benigna-cuello.md](08-benigna-cuello.md) | OK |
| 9 | `cyc-ortognatica-v1` | [09-ortognatica.md](09-ortognatica.md) | OK |
| 10 | `cyc-biopsia-cavidad-v1` | [10-biopsia-cavidad.md](10-biopsia-cavidad.md) | OK |
| 11 | `cyc-laringe-mls-v1` | [11-laringe-mls.md](11-laringe-mls.md) | OK |
| 12 | `cyc-biopsia-salivales-acc-v1` | [12-biopsia-salivales-acc.md](12-biopsia-salivales-acc.md) | OK |
| 13 | `cyc-biopsia-adenopatias-v1` | [13-biopsia-adenopatias.md](13-biopsia-adenopatias.md) | OK |

### P7–P10 (pase anterior) — resueltos dentro de este set

| Pendiente | Quedó en |
|---|---|
| P7 Ortognática | `09` |
| P8 Nariz / senos | `07` |
| P9 Tumores glómicos | `08` |
| P10 Benigna (schwannomas, quistes branquiales) | `08` |

## Pendiente

- **Motor de código P2** (formulario dinámico, armado de texto, print A4,
  QR cirujano, sync qx↔anestesia): cuando se retome P2, con auditoría
  §8 del roadmap antes del primer commit.
- No mezclar con ADAARC `NOM` (facturación): catálogo clínico aparte.

El monolito `docs/P2_PROFORMAS_CYC.md` es solo **puntero** a esta carpeta.
