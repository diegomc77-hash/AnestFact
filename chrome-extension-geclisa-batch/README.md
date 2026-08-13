# AnesFact GECLISA Batch (v0.5.0 — runner de cola)

Cola en AnesFact → extensión mintea token → `run111` (siempre `reloadToGeclisaHome`) → fill.js → **pausá, guardá vos** → Siguiente paciente.

## Flujo Huerta

1. AnesFact: **Agregar a cola GECLISA** (varias fojas Mayo).
2. GECLISA logueado en una pestaña.
3. Popup extensión **0.5.0** → **Iniciar cola** (no hace falta pegar token ni tocar Ejecutar).
4. Revisá la foja en GECLISA → Guardar a mano → **Siguiente paciente**.
5. Reintentar / Abortar si hace falta.

## Salvaguardas

- Fila panel + encabezado Evolución (nombre tolerante)
- Sin click en Guardar
- Pausa si ambigüedad / no encontrado / mismatch
- Cada foja reinicia en home GECLISA

## Docs

- `SELECTORS_PASOS_1_11.md`
