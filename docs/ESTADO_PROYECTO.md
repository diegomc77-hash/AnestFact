# Estado del proyecto AnesFact

Versiones: salir de `node tools/check-version-sync.mjs`, no de este archivo. Snapshot al 2026-08-27:

- PWA `CACHE_V`: **12.38**
- Extensión GECLISA: **0.5.10**

## En curso

- 2026-08-27 — Semilla catálogo instituciones (SQL **010**). Sin UI. PWA 12.38 no lee esta tabla.

## Qué se hizo (más reciente primero)

- 2026-08-27 — Allende: 2 sedes (Cerro de las Rosas, Nueva Córdoba), `red_id=allende`. Nombre **Sanatorio Allende** (no Clínica Allende). SQL **011**. Catálogo 40 filas.
- 2026-08-27 — Brief instituciones (3 patrones). Doc `docs/ARQUITECTURA_INSTITUCIONES.md`.

- 2026-08-27 — Dock 2 filas (PWA **12.38**): 4 arriba (Fojas, Preop, Geclisa, evweb) + 3 abajo (Sanatorios, Legales, Herramientas). Tamaños Chico 52/20/10, Mediano 64/26/12, Grande 76/32/14. En Pages: dock 336×164, `scrollWidth === clientWidth`, 7 íconos visibles. **Cerrado en Pages**.
- 2026-08-26 — Wizard de 6 pasos en `valoracion.html` (PWA **12.37**). IDs y payload iguales; parsers ocultos; adjuntos solo `{nombre,mime,size}`. Esperando Pages.
- 2026-08-26 — Foja-bar fija + contraste valoración paciente (PWA **12.36**). Barra `position:fixed` (top 357.1875px en scroll 0/400/900). Disclaimer y labels `#E6EDF3`. **Cerrado en Pages**.
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

- Dock 2 filas + tamaños (12.38): **cerrado en Pages**.
- Wizard valoración 6 pasos (12.37): esperando e2e de Diego en Pages (viaja en el SW 12.38). Token de prueba propio.
- Foja-bar fija + contraste valoración (12.36): **cerrado en Pages**.
- Ruta alternativa por DNI en GECLISA (pacientes de alta): `chrome-extension-geclisa-batch/NOTES_RUTA_HC_POR_DNI.md` — no implementada.
- Correlativo QR entre equipos (servidor): diferido.
- Instituciones: catálogo permanente en git + Supabase (**010** + **011**). Habilitar después = `sanatorios_permitidos`, no re-sembrar. Plan Huerta aún dice `Clínica Allende` (string legado; no tocado).
- SISalud: cómo se sube la foja/PDF — **no investigar todavía**.
- Header A4 / pie ADAARC: siguiente frente; no tocado.

## Decisiones tomadas (no repreguntar)

- No vademécum completo (licencia paga) — diccionario curado propio.
- HC obligatoria: NO. Edad/peso/talla/afiliado: SÍ.
- Alertas al paciente: solo aviso + derivación, nunca "suspenda esto".
- Nunca clickear "Guardar" en GECLISA automáticamente.
- Frontend y Edge Functions se publican por separado; confirmar uno no confirma el otro.
- Título de Home / `document.title` leen `AF_CACHE_V`. Los `version:` de export/sync, tickets y planes no.
- Paleta: 5 familias que no se pisan. GECLISA enviado y marca comparten `#22c55e` a propósito. Preoperatorio = gris + etiqueta, no un 6º matiz. Cola `#eab308` vs advertencia `#f59e0b` (reloj vs triángulo).
- Dock: 3 tamaños en Ajustes (chico / mediano / grande). Default mediano. Clave `localStorage.af_dock_size`. Chico 52/20/10, mediano 64/26/12, grande 76/32/14 (ítem / SVG / etiqueta). Layout fijo 2 filas: 4 (Fojas, Preop, Geclisa, evweb) + 3 (Sanatorios, Legales, Herramientas). `--dock-clear` 148 / 162 / 190.
- CTAs de navegación/pedido → baldosas. Pills que se quedan: login, guardar formularios, GECLISA operativo (abrir/cola/copiar), Imprimir, + Nueva compacto, Ayuda/Escanear IA (submit de flujo).
- Tarjeta QR: lockup alrededor (no en los módulos). # = orden de generación del día en ese dispositivo (`af_qr_orden_YYYY-MM-DD_<uid>`). Día = calendario Argentina. No es el n° de turno de la clínica.
