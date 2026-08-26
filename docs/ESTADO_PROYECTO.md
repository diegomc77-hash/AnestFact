# Estado del proyecto AnesFact

Versiones: salir de `node tools/check-version-sync.mjs`, no de este archivo. Snapshot al 2026-08-26:

- PWA `CACHE_V`: **12.29**
- Extensión GECLISA: **0.5.10**

## En curso

- Libre. (Un chat a la vez por sección; si tomás una, escribí acá sección + fecha y no pises contrato compartido sin avisar.)

## Qué se hizo (más reciente primero)

- 2026-08-26 — Home: tarjetas `.inter` en columna (nombre sin ellipsis, badges wrap). Misma idea en filas de cola GECLISA. Bump **12.29**.
- 2026-08-26 — Etapa A visual **aprobada en Pages** (cache no-store, v12.28). Paleta de 5 familias + lockup. Estados: Borrador gris / Listo azul. Sanatorios: Mayo cielo, Aeronáutico violeta. Etapa B/C (dock) **en pausa**, sin apuro.
- 2026-08-26 — Título de Home lee `AF_CACHE_V`. Bump PWA **12.27**. Export/sync/tickets/planes sin cambios. Commit + push en este ciclo; verificar Pages y que Huerta reabra la PWA.
- 2026-08-26 — Checker `tools/check-version-sync.mjs` + reglas por sección. 18 desfasajes alineados a PWA 12.26 / extensión 0.5.10. Commit `6094812`, push a `origin/main`. Pages verificado en vivo: `valoracion.html` e `index.html` con `?v=12.26`, `sw.js` `anesfact-v12.26`. Huerta: cerrar y reabrir PWA (SW cache-first).
- 2026-08 — Alertas de seguridad (anticoag/alergias): banner en formulario paciente + badge en Home (`js/07-intervenciones.js`). Código listo; confirmación visual del badge pendiente.
- HC opcional; edad/peso/talla/afiliado obligatorios en QR.

## Pendiente / conocido

- Badge Home del módulo QR: implementado, sin confirmar visualmente en dispositivo.
- Ruta alternativa por DNI en GECLISA (pacientes de alta): `chrome-extension-geclisa-batch/NOTES_RUTA_HC_POR_DNI.md` — no implementada.
- Etapa B/C visual: dock 7 secciones + ocultar dock en foja. Aprobada A; se arma detalle cuando Diego lo pida.

## Decisiones tomadas (no repreguntar)

- No vademécum completo (licencia paga) — diccionario curado propio.
- HC obligatoria: NO. Edad/peso/talla/afiliado: SÍ.
- Alertas al paciente: solo aviso + derivación, nunca "suspenda esto".
- Nunca clickear "Guardar" en GECLISA automáticamente.
- Frontend y Edge Functions se publican por separado; confirmar uno no confirma el otro.
- Título de Home / `document.title` leen `AF_CACHE_V`. Los `version:` de export/sync, tickets y planes no.
- Paleta: 5 familias que no se pisan. GECLISA enviado y marca comparten `#22c55e` a propósito. Preoperatorio = gris + etiqueta, no un 6º matiz. Cola `#eab308` vs advertencia `#f59e0b` (reloj vs triángulo).
