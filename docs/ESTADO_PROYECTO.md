# Estado del proyecto AnesFact

Versiones: salir de `node tools/check-version-sync.mjs`, no de este archivo. Snapshot al 2026-08-26:

- PWA `CACHE_V`: **12.26**
- Extensión GECLISA: **0.5.10**

## En curso

- Libre. (Un chat a la vez por sección; si tomás una, escribí acá sección + fecha y no pises contrato compartido sin avisar.)

## Qué se hizo (más reciente primero)

- 2026-08-26 — Checker `tools/check-version-sync.mjs`: alinea `CACHE_V`, `CACHE_NAME`, `sw.js?v=`, bust de vistas, `?v=` locales de `index.html`/`valoracion.html`, `STATIC_CORE`↔`SCRIPTS`/`VIEWS`/`FOJA_PARTS`, y versión extensión (`manifest` / `BRIDGE_VERSION` / popup). Había 18 desfasajes activos (QR en 12.21/9.0/10.8; keepalive en 8.0; log del bridge en 0.5.5). Alineados a 12.26 / 0.5.10. **No publicado** — falta confirmación para commit/push.
- 2026-08 — Alertas de seguridad (anticoag/alergias): banner en formulario paciente + badge en Home (`js/07-intervenciones.js`). Código listo; confirmación visual del badge pendiente.
- HC opcional; edad/peso/talla/afiliado obligatorios en QR.

## Pendiente / conocido

- Badge Home del módulo QR: implementado, sin confirmar visualmente en dispositivo.
- Ruta alternativa por DNI en GECLISA (pacientes de alta): `chrome-extension-geclisa-batch/NOTES_RUTA_HC_POR_DNI.md` — no implementada.
- Títulos UI (`index.html` "v8.5", Home "AnesFact v8") no siguen `CACHE_V` — no mezclarlos en un bump.

## Decisiones tomadas (no repreguntar)

- No vademécum completo (licencia paga) — diccionario curado propio.
- HC obligatoria: NO. Edad/peso/talla/afiliado: SÍ.
- Alertas al paciente: solo aviso + derivación, nunca "suspenda esto".
- Nunca clickear "Guardar" en GECLISA automáticamente.
- Frontend y Edge Functions se publican por separado; confirmar uno no confirma el otro.
