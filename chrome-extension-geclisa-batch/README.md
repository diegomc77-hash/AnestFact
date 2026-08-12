# AnesFact GECLISA Batch (v0.4.2 — pasos 1–12)

Navega GECLISA Mayo hasta la plantilla FOJA y corre **fill.js** con token (sin Guardar).

## Cómo llega el paciente al popup (v0.4.2)

Orden al abrir / **Actualizar**:

1. `chrome.storage.session.afg_current_foja` (lo escribe el bridge)
2. `chrome.storage.local.afg_current_foja` (backup)
3. Portapapeles `AFG1|apellido|nombre|dni|fecha|token` (no necesita content script)

**Bug que había:** el bridge leía `window.__AFG_PENDING_BATCH`, pero el content script **no ve** variables de la página (isolated world). Ahora usa `localStorage` + `postMessage`.

**Pestaña GECLISA:** la extensión enfoca la pestaña existente (`AFG_OPEN_GECLISA`); solo crea una si no hay ninguna. Fallback: `window.open(..., 'geclisa_mayo')`.

## Probar

1. `chrome://extensions` → ↻ recargar extensión (v0.4.2).
2. AnesFact en `http://localhost:8080` → Ctrl+F5 (cache `v=11.8`).
3. Foja → **Enviar a GECLISA**.
4. Consola AnesFact: `[AFG] publish batch BESCOS …`
5. Consola AnesFact: `[AFG bridge] inyectado…` y `[AFG bridge] storage OK…` (si el bridge cargó).
6. Popup → debe mostrar Bescos (o **Actualizar** lee el portapapeles AFG1).
7. **Diagnóstico storage** en el popup muestra la foja.

Self-test sin login: `http://localhost:8080/chrome-extension-geclisa-batch/selftest-page.html`

## Docs

- `SELECTORS_PASOS_1_11.md`
- `NOTES_RUTA_HC_POR_DNI.md`
