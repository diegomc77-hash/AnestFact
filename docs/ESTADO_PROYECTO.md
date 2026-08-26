# Estado del proyecto AnesFact

Versiones: salir de `node tools/check-version-sync.mjs`, no de este archivo. Snapshot al 2026-08-26:

- PWA `CACHE_V`: **12.36**
- Extensión GECLISA: **0.5.10**

## En curso

- 2026-08-26 — Foja-bar fija + contraste valoración paciente (PWA **12.36**). No tocar `S.cur` / `fill.js`.

## Qué se hizo (más reciente primero)

- 2026-08-26 — Foja-bar fija + contraste valoración paciente (PWA **12.36**). Barra de acciones `position:fixed` abajo en nueva/foja (dock oculto). Textos de `valoracion.html` subidos de `--text3`/`11px`. Esperando Pages `cache:'no-store'`.
- 2026-08-26 — Tarjeta QR (PWA **12.35**): lockup AnesFact + nombre del médico + # diario (localStorage, se reinicia a las 00:00 AR) + fecha corta + QR + pie. Imprimir y Guardar imagen. Logo alrededor, no en los módulos. **Cerrado en Pages**.
- 2026-08-26 — Lote D visual (PWA **12.34**): «Pedir plan» y modal Función no disponible en baldosas; facturación/evweb/resumen CTAs. **Cerrado en Pages**.
- 2026-08-26 — Dock lote C (PWA **12.33**): toolbar de foja; QR Preop baldosa; 3 tamaños de dock. **Cerrado en Pages**.
- 2026-08-26 — Dock lote B (PWA **12.32**). **Cerrado en Pages**.
- 2026-08-26 — Dock lote A bugs (PWA **12.31**).
- 2026-08-26 — Dock visual B+C (PWA **12.30**).
- 2026-08-26 — Home tarjetas `.inter` (v12.29). Etapa A visual (v12.28).
- 2026-08 — Alertas de seguridad: banner + badge Home. Confirmación visual del badge pendiente.
- HC opcional; edad/peso/talla/afiliado obligatorios en QR.

## Pendiente / conocido

- Badge del módulo QR (ahora en Preop): implementado, sin confirmar visualmente en dispositivo.
- Ruta alternativa por DNI en GECLISA (pacientes de alta): `chrome-extension-geclisa-batch/NOTES_RUTA_HC_POR_DNI.md` — no implementada.
- Correlativo QR entre equipos (servidor): diferido.
- Foja-bar fija + contraste valoración (12.36): esperando verificación de Diego en Pages. PWA: reabrir del todo (SW cache-first `ignoreSearch`).

## Decisiones tomadas (no repreguntar)

- No vademécum completo (licencia paga) — diccionario curado propio.
- HC obligatoria: NO. Edad/peso/talla/afiliado: SÍ.
- Alertas al paciente: solo aviso + derivación, nunca "suspenda esto".
- Nunca clickear "Guardar" en GECLISA automáticamente.
- Frontend y Edge Functions se publican por separado; confirmar uno no confirma el otro.
- Título de Home / `document.title` leen `AF_CACHE_V`. Los `version:` de export/sync, tickets y planes no.
- Paleta: 5 familias que no se pisan. GECLISA enviado y marca comparten `#22c55e` a propósito. Preoperatorio = gris + etiqueta, no un 6º matiz. Cola `#eab308` vs advertencia `#f59e0b` (reloj vs triángulo).
- Dock: 3 tamaños en Ajustes (chico / mediano / grande). Default mediano. Clave `localStorage.af_dock_size`.
- CTAs de navegación/pedido → baldosas. Pills que se quedan: login, guardar formularios, GECLISA operativo (abrir/cola/copiar), Imprimir, + Nueva compacto, Ayuda/Escanear IA (submit de flujo).
- Tarjeta QR: lockup alrededor (no en los módulos). # = orden de generación del día en ese dispositivo (`af_qr_orden_YYYY-MM-DD_<uid>`). Día = calendario Argentina. No es el n° de turno de la clínica.
