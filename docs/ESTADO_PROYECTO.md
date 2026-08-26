# Estado del proyecto AnesFact

Versiones: salir de `node tools/check-version-sync.mjs`, no de este archivo. Snapshot al 2026-08-26:

- PWA `CACHE_V`: **12.34**
- Extensión GECLISA: **0.5.10**

## En curso

- Libre. (Un chat a la vez por sección; si tomás una, escribí acá sección + fecha y no pises contrato compartido sin avisar.)

## Qué se hizo (más reciente primero)

- 2026-08-26 — Lote D visual (PWA **12.34**): «Pedir plan» y modal Función no disponible en baldosas; facturación/evweb/resumen CTAs de navegación al mismo lenguaje. SW cache-first `ignoreSearch`: cerrar y reabrir a veces no alcanza; bumpear `CACHE_NAME` y reabrir del todo. Esperando Pages `cache:'no-store'`.
- 2026-08-26 — Dock lote C (PWA **12.33**): toolbar de foja en 5 baldosas; QR Preop en baldosa; 3 tamaños de dock. **Cerrado en Pages** (Diego, getBoundingClientRect). Un reporte de “sigue viejo” era caché de la PWA en el celular.
- 2026-08-26 — Dock lote B (PWA **12.32**): íconos SVG del mockup; header solo Salir + estrella admin; Herramientas en baldosas cuadradas. **Cerrado en Pages**.
- 2026-08-26 — Dock lote A bugs (PWA **12.31**): toast se oculta de verdad. Dock se oculta en foja/nueva/facturación/nom/resumen según la vista activa.
- 2026-08-26 — Dock visual B+C (PWA **12.30**): 7 secciones. Fojas/Preop comparten `renderHome` + `S.listMode`. Cola GECLISA vive en la sección Geclisa.
- 2026-08-26 — Home: tarjetas `.inter` **cerrado en Pages** (v12.29).
- 2026-08-26 — Etapa A visual **aprobada en Pages** (v12.28).
- 2026-08-26 — Título de Home lee `AF_CACHE_V`. Bump PWA **12.27**.
- 2026-08-26 — Checker `tools/check-version-sync.mjs`. Commit `6094812`. Huerta: cerrar y reabrir PWA.
- 2026-08 — Alertas de seguridad (anticoag/alergias): banner + badge Home. Confirmación visual del badge pendiente.
- HC opcional; edad/peso/talla/afiliado obligatorios en QR.

## Pendiente / conocido

- Badge del módulo QR (ahora en Preop): implementado, sin confirmar visualmente en dispositivo.
- Ruta alternativa por DNI en GECLISA (pacientes de alta): `chrome-extension-geclisa-batch/NOTES_RUTA_HC_POR_DNI.md` — no implementada.
- Lote D (12.34): esperando verificación de Diego en Pages (`cache:'no-store'`). PWA: reabrir del todo (SW cache-first).

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
