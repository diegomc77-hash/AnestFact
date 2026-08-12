# AnesFact GECLISA Batch (v0.4.3 — pasos 1–12)

Navega GECLISA Mayo hasta la plantilla FOJA y corre **fill.js** con token (sin Guardar).

## Cómo llega el paciente al popup

El popup **no** lee `localStorage` de AnesFact ni de GECLISA (orígenes distintos; el popup no es esa pestaña).

1. AnesFact escribe `localStorage['afg_pending_batch']` en su origen (github.io / localhost).
2. Content script bridge (en esa pestaña) copia a `chrome.storage.local/session`.
3. **Actualizar / abrir popup** → `AFG_PULL_ANESFACT_FOJA` → background busca pestaña AnesFact → `executeScript` lee ese `localStorage` → rellena campos.

GECLISA no interviene en este paso.

## Probar

1. `chrome://extensions` → ↻ recargar extensión (**0.4.3**).
2. Dejá AnesFact abierto con foja ya enviada (o Enviar de nuevo).
3. Abrí el popup → debe mostrar el paciente; o **Actualizar**.
4. **Diagnóstico storage** muestra `pull.ok` + foja.

## Docs

- `SELECTORS_PASOS_1_11.md`
- `NOTES_RUTA_HC_POR_DNI.md`
