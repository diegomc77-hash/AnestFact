# Estado del proyecto AnesFact

**Punto de entrada único.** Este archivo no sustituye los docs de decisión: los **señala**. Un chat nuevo que solo lea el diario de versiones no va a enterarse de Home-por-institución ni de evweb×mutual. Si el tema toca un ítem de la lista, leé **ese archivo entero** (no de memoria).

## Índice de docs (`docs/`) — actualizar en el mismo paso al crear uno nuevo

### Decisiones vivas (leer enteras si el tema pega)

| Archivo | Qué trata (una frase) |
|---|---|
| `docs/DISENO_PC_HOME.md` | **Home por institución, no por foja** (PC primero, misma lógica en móvil; PC hoy = columna 520px). Leer el archivo completo antes de tocar Home/dock/layout. |
| `docs/ROADMAP_ESCALAMIENTO.md` | Fases P/U + empaquetado + P1b GET GECLISA + **P6 buzón auth** (idea, sin diseño). |
| `docs/CIERRE_ARQUITECTURA_FACTURACION.md` | Flujo Preop → foja → GECLISA/Traditum/evweb/SISalud × mutual. Diseño; no codear Traditum/foja qx desde ahí. |
| `docs/ARQUITECTURA_INSTITUCIONES.md` | Tres patrones de HC (GECLISA / sistema propio / sin sistema) y `tipo_sistema` vs `destino_final`. No mezclar con el cierre de facturación. |
| `docs/VALORACION_QR.md` | Contrato QR → prefoja → foja (importar solo vacíos; no `resetFojaUIDom`). |
| `docs/MAPA_SECCIONES.md` | Quién es dueño de qué archivos; contrato compartido; secciones futuras. |

### Legal (borrador; abogado)

| Archivo | Qué trata |
|---|---|
| `docs/AnesFact_Terminos_y_Condiciones.md` | Términos + deslinde médico. Pendiente de abogado. |
| `docs/AnesFact_Aviso_Privacidad_Paciente_QR.md` | Aviso corto en `valoracion.html` (paciente). |

### Cómo hacer (operación, no producto nuevo)

| Archivo | Qué trata |
|---|---|
| `docs/DEPLOY_V8.md` | Publicar PWA (Pages) + orden de migraciones v8. |
| `docs/DESPLEGAR_QR.md` | Deploy Edge Functions de valoración QR. |
| `docs/EJECUTAR_VALORACION_QR.md` | Paso a paso de la migración QR en Supabase. |
| `docs/SUPABASE_ADMIN.md` | Panel admin / planes sin pisar fojas de Huerta. |
| `docs/RECUPERAR_CUENTA.md` | Auth bloqueada / rate limit de email. |
| `docs/FIX_ADMIN_PLAN.md` | Por qué el plan Pro volvía a Demo (UPSERT vs RLS). |

### Históricos (revisión SQL 007/008; no reabrir sin motivo)

| Archivo | Qué trata |
|---|---|
| `docs/SEGURIDAD_007.md` | Modelo de seguridad paso 007. |
| `docs/APP_008_REVIEW.md` | Revisión app antes de SQL 008. |
| `docs/REVISION_007b_008.md` | Orden de ejecución 007b + 008. |

Este archivo (`ESTADO_PROYECTO.md`) es el diario de versiones / en curso / pendiente. No listar acá una decisión **en lugar** de un doc: listar el doc en el índice y una línea en «Decisiones tomadas».

---

Versiones: salir de `node tools/check-version-sync.mjs`, no de este archivo. Snapshot al 2026-09-02:

- PWA `CACHE_V`: **12.61** (reintento P1b: escalera 8h/36h/7d + candados)
- Extensión GECLISA: **0.5.14**

## En curso

- 2026-09-02 — P1b reintento qx en **origin/main** (12.61 / 0.5.14). Pendiente: recargar PWA + extensión y Pages.

## Qué se hizo (más reciente primero)

- 2026-09-02 — PWA **12.61** + ext **0.5.14**: si el qx no entra en 8 h, el GET se ensancha a 36 h y luego 7 d. En ancha: apellido en `cirujanos:` gana; fecha = la de `hora inicio de cirugia`. No pisa el adjunto si no verifica. Sin nombres ni N° en este diario.

- 2026-09-02 — Extensión **0.5.13**: Consultar del panel deja de tipearle la fecha al datepicker. Usa `datepicker('setDate')` o abre el calendario, cambia de mes con las flechas y toca el día. Sin nombres ni N° en este diario.

- 2026-09-02 — PWA **12.60** + extensión **0.5.12**: GET `ReporteListadoInternado` ~5 s tras GRABAR; PDF a `docs.anest` (tope 1.5 MB, sin rasterizar); reintento si falta qx. Roadmap P1b + nota P6. Sin nombres ni N° en este diario.
- 2026-09-02 — PWA **12.59** en **origin/main** (`8d6ca37`): tope **49 cols / 4 h** en una hoja; etiquetas tipo reloj; flechas de inicio/fin `HH:mm`; grilla de borde uniforme; cada hoja de continuación es foja completa + folio `Página X de N` (omitido si N=1). 7 símbolos VG confirmados. P1b no entra en este commit.

- 2026-09-02 — PWA **12.58** en **origin/main** (`1e58e08`): 37 cols / 3 h en una hoja; Hoja 2 sin estirar. PDF prueba 3 h OK. Pendiente: Pages (el push ya salió).

- 2026-09-02 — Diagnóstico (sin código) Hoja 2 Aeronáutico: se disparaba a **más de 28 columnas**. ~3 h → 37 cols. El lote SISalud 12.39 no cambió ese umbral (v8.4). P1b pausado.

- 2026-09-01 — Roadmap **P6**: buzón de mail AnesFact para autorizaciones (idea). No es P1b. Preguntas abiertas en `docs/ROADMAP_ESCALAMIENTO.md`. Sin diseño ni código.

- 2026-09-01 — P1b GET en vivo, internación con ambos protocolos: 200, PDF ~445 KB (tope 1.5 MB OK). Sin nombres ni N° en este diario.

- 2026-09-01 — PWA **12.57** + extensión **0.5.12** P1b B+C: GET `ReporteListadoInternado` ~5 s tras GRABAR; PDF a `docs.anest` sin rasterizar; tope **1.5 MB** (no guardar si pasa); reintento silencioso si falta qx. Sin commit/push aún.

- 2026-09-01 — SQL **021** en producción: `DROP FUNCTION public.af_assert_plan(text)` (oid 26261, wrapper). Queda **39319** `af_assert_plan(text, text)` de 017. El mint GECLISA llamaba 1 arg y Postgres no distinguía.

- 2026-09-01 — PWA **12.56** + extensión **0.5.11** P1b Lote A: el N° de Atención del 8b (solo si el nombre coincidió) queda en `mayo_nro_atencion` (intervención + cola). Refresh no lo borra. Vacío no pisa. Sin GET todavía.

- 2026-09-01 — P1b recortado en `docs/ROADMAP_ESCALAMIENTO.md`: `pMeId` único por internación (4 internaciones → 4 N°). Ventana = fecha+hora de esta foja, no «ahora». Sin botón «Bajar fojas». GET en la tab GECLISA del 1–12. Qx ausente = reintento silencioso. Sin código.

- 2026-09-01 — `docs/ROADMAP_ESCALAMIENTO.md` P1b: URL real (`pMeId`, `pEventos` con pipe, `pConFirma=true`, fechas `dd/MM/yyyy`). Guardar N° Atención del 8b. Fetch en tab GECLISA → ranura anestésica.

- 2026-08-31 — `docs/ROADMAP_ESCALAMIENTO.md` P1b: `#btnImprimirReportesPopup`; modal sin nombre/DNI; verificar fila (criterio 8b) antes; tildar Incluir firma + 2 protocolos, destildar el resto. Inyección a P1 bloqueada hasta ver cómo sale el PDF.

- 2026-08-31 — `docs/ROADMAP_ESCALAMIENTO.md` P1b: no destildar una lista fija. Recorrer todos los tildados (Eventos + Adjuntos variables) y destildar; tildar solo `ProtocoloQuirurgico` + `ProtocoloAnestesico`. Auth no sale del modal. Sin código.

- 2026-08-31 — `docs/ROADMAP_ESCALAMIENTO.md` P1b: Panel Internados → `#btnImprimirPanelInternado` → modal HC internación → Imprimir. Auth no está en esa lista. Sin código.

- 2026-08-31 — `docs/ROADMAP_ESCALAMIENTO.md` § 1c: Mayo = GECLISA un PDF (qx+anest) + auth aparte; Aero = fojas desde AnesFact + foto auth (2 fotos si aún no hay qx nativa); otras = relevar. P1 no cambia (ranuras opcionales).

- 2026-08-31 — PWA **12.55** P1: 3 ranuras en Facturación (anest / qx / auth). Imagen o PDF ≤500 KB tal cual; más pesado → JPEG ~450 KB (PDF vía pdf.js lazy en `vendor/pdfjs/`, no precache). Si falla, se guarda el original.

- 2026-08-31 — `docs/ROADMAP_ESCALAMIENTO.md`: auditoría Mayo/Aero/públicos (código vs diseño) + rieles P/U. evweb no está automatizado; Traditum 0 líneas; adjuntos JS sin UI.

- 2026-08-31 — Memoria: índice de `docs/` arriba de ESTADO; regla always-on obliga a actualizarlo al crear un `.md`. Fallo anterior: leer ESTADO sin el índice no alcanzaba para ver Home-por-institución.

- 2026-08-31 — `docs/DISENO_PC_HOME.md`: visión aspiracional (especialidades, institución primero PC+móvil por etapas) + matriz Mayo/Aero/públicos. No contradice cupo de lugares ni bandejas. Sin implementar.

- 2026-08-31 — Cierre de arquitectura de facturación sacado de Downloads + charla 24-ago; referencia en `MAPA_SECCIONES.md` como sección futura. Sin implementar Traditum / foja qx / QR cirujano / consentimiento.

- 2026-08-30 — PWA **12.54**: hex de `--san-*` en `styles.css` (rueda ~30°). Sin cambio de lógica.

- 2026-08-30 — PWA **12.53**: Misericordia, todos los cirujanos con Dr./Dra. (grilla pareja).
- 2026-08-30 — PWA **12.52**: `CIRUJANOS_POR_LUGAR['Hospital Misericordia']`. Plástica → Plástica y Reparadora; Tórax → Cirugía Torácica; Pediátrica vacía. San Roque / Córdoba / Mayo / Aero intactos.

- 2026-08-30 — Regla: navegación nueva solo por `go(vista)` (`.cursor/rules/00-anesfact-general.mdc`).

- 2026-08-29 — PWA **12.51**: Misericordia `Quirófano 1–4` (select). San Roque sigue texto. Sin nómina de cirujanos. Córdoba 9 / Mayo / Aero intactos.

- 2026-08-29 — PWA **12.50**: `CIRUJANOS_POR_LUGAR['Hospital Córdoba']` (sin Jefe; Clara Huerta queda). 9 quirófanos en `AF_FOJA_INST` → select `#f-sala-inst`. Misericordia/San Roque sin catálogo. Mayo/Aero intactos.

- 2026-08-29 — PWA **12.49**: dock/vista «Instituciones»; tarjetas Córdoba / Misericordia / San Roque; colores `--san-cordoba` `#2563eb`, `--san-misericordia` `#7c3aed`, `--san-san-roque` `#a78bfa`; `home-san` con las mismas claves. Lote A **cerrado en Pages**.

- 2026-08-28 — PWA **12.48**: contador QR por institución; badge paciente vía `af-qr-peek` (si falla, vacío, nunca Mayo); públicos con especialidad genérica y cirujano a mano; `cfg_id` alineado. Mayo igual. **Cerrado en Pages.**

- 2026-08-28 — PWA **12.47**: selector «Este QR es para:» en Preop (si hay >1 lugar), persistencia `af_qr_lugar_<uid>`, tarjeta/toast con el nombre real. `af-qr-submit` usa `contexto.sanatorio` del token. Mayo igual. Badge paciente queda para sub-lote.

- 2026-08-28 — PWA **12.46**: `afSyncValoracionesPreop` un solo fetch; dedup `valoracion_id` + `preop_+id`; sync solo desde `initApp`; colapso de clones al cargar. Sin `?t=` en la foja.

- 2026-08-28 — SQL **020** + PWA **12.45**: Punto 3 A+B. **Cerrado en Pages.** Guardar Pro igual que siempre; `AF_TEST_RPC_FAIL` → toast fail-closed y no persiste; al bajar el flag vuelve «Guardado ✓». Trigger sync Demo vencida / `fojas_semana >= 5`. `nuevaInter()` no consume.
- 2026-08-28 — SQL **019** + PWA **12.44**: INSERT Demo no inflable + M.P. única. **Cerrado en Pages.**
- 2026-08-28 — SQL **018** + PWA **12.43**: plan **max** (2 lugares). **Cerrado en Pages.**
- 2026-08-28 — SQL **017** + PWA **12.42** (lote 3 planes): validación 1 público / N no-públicos (Aero cuenta). Rechaza, no recorta. `af_admin_set_sanatorios` + override `privados_max_override` auditado. `af_assert_plan(..., p_sanatorio)`. DEFAULTS.pro vacío. Guardar plan ya no une el paquete de 4.
- 2026-08-28 — SQL **016** (lote 2 planes): Huerta Aero + Mayo + Hospital Córdoba. **Cerrado en Pages.**
- 2026-08-28 — SQL **015** + PWA **12.41** (lote 1 planes): Demo 1 mes y 5 fojas/semana. **Cerrado en Pages.** Contador ya no se PATCHA desde el cliente; `af_consume_foja` + tope en `af_assert_plan`. Límite real Demo no se probó (no hay login de prueba).
- 2026-08-27 — SQL **014**: `af_admin_set_plan` une default del plan + extras que el usuario ya tenía. Guardar Pro sobre Huerta deja los 3 hospitales. Sin extras (admin/demo) el array queda igual al default. Ya no es riesgo activo.
- 2026-08-27 — Lote 2 (PWA **12.40**). Select armado desde catálogo `desarrollado`. Admin: los 5. Huerta: Aero + Mayo + Misericordia + Córdoba + San Roque. SQL **013** solo su fila (array quedó en 7; Allende/Privada Córdoba siguen en el array, no en el select). Allende fuera.
- 2026-08-27 — Sub-lote 1 SISalud (PWA **12.39**). SQL **012** + header A4 + pie ADAARC condicional + sala/cama texto SISalud. No se pudo verificar en Pages sin el select (guardar() revertía `S.cur.san`). Se verifica junto con 12.40.
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

- Impresión Aeronáutico: **12.58** en origin (3 h / 37 cols). **12.59** local (4 h / 49 cols, etiquetas 15 min) — esperar OK. P1b Lote B sigue en pausa.
- Lote 2 SISalud select + print (12.40): esperando Pages. Probar como Huerta y/o admin: las 3 opciones nuevas, header/pie, sala texto, `getBoundingClientRect` del A4.
- Dock 2 filas + tamaños (12.38): **cerrado en Pages**.
- Wizard valoración 6 pasos (12.37): esperando e2e de Diego en Pages (viaja en el SW). Token de prueba propio.
- Foja-bar fija + contraste valoración (12.36): **cerrado en Pages**.
- Ruta alternativa por DNI en GECLISA (pacientes de alta): `chrome-extension-geclisa-batch/NOTES_RUTA_HC_POR_DNI.md` — no implementada.
- Correlativo QR entre equipos (servidor): diferido.
- Instituciones: catálogo **010**–**018** (016 recorte Huerta; **017** tope de lugares; **018** plan Max). Habilitar resto = `sanatorios_permitidos` + `desarrollado`, no re-sembrar.
- Planes (confirmado 2026-08-28): Demo 1 lugar (Aero) + tope de fojas. **Básico 1** / **Max 2** / **Pro 3** no-públicos (Aero cuenta). 1 público máx. Admin ve todos sin cupo. Firma atada a la cuenta. DEFAULTS.pro y DEFAULTS.max vacíos; lugares con `af_admin_set_sanatorios`. Pro >3 solo con `privados_max_override`.
- SISalud: cómo se sube la foja/PDF — **no investigar todavía**.
- PNG oficiales de header Córdoba / San Roque: cuando existan, reemplazan compose (`oficial: false`).
- P1 adjuntos **12.55**: probar en foja «prueba» — PDF chico tal cual, foto ~2 MB → JPEG, ver/borrar, sobrevivir a Guardar.
- Facturación (diseño, no código): Traditum APROSS; foja qx nativa + QR cirujano (Aero/públicos); consentimiento informado (bloqueado legal — papel + foto). Doc `docs/CIERRE_ARQUITECTURA_FACTURACION.md`.

## Decisiones tomadas (no repreguntar)

- No vademécum completo (licencia paga) — diccionario curado propio.
- HC obligatoria: NO. Edad/peso/talla/afiliado: SÍ.
- Alertas al paciente: solo aviso + derivación, nunca "suspenda esto".
- Nunca clickear "Guardar" en GECLISA automáticamente.
- Frontend y Edge Functions se publican por separado; confirmar uno no confirma el otro.
- Título de Home / `document.title` leen `AF_CACHE_V`. Los `version:` de export/sync, tickets y planes no.
- Paleta: 5 familias que no se pisan. GECLISA enviado y marca comparten `#22c55e` a propósito. Preoperatorio = gris + etiqueta, no un 6º matiz. Cola `#eab308` vs advertencia `#f59e0b` (reloj vs triángulo).
- Dock: 3 tamaños en Ajustes (chico / mediano / grande). Default mediano. Clave `localStorage.af_dock_size`. Chico 52/20/10, mediano 64/26/12, grande 76/32/14 (ítem / SVG / etiqueta). Layout fijo 2 filas: 4 (Fojas, Preop, Geclisa, evweb) + 3 (Instituciones, Legales, Herramientas). `--dock-clear` 148 / 162 / 190.
- CTAs de navegación/pedido → baldosas. Pills que se quedan: login, guardar formularios, GECLISA operativo (abrir/cola/copiar), Imprimir, + Nueva compacto, Ayuda/Escanear IA (submit de flujo).
- Tarjeta QR: lockup alrededor (no en los módulos). # = orden de generación del día en ese dispositivo (`af_qr_orden_YYYY-MM-DD_<uid>`). Día = calendario Argentina. No es el n° de turno de la clínica.
- Print SISalud: misma `imprimir-aero.js` (no clonar). Header 3 columnas (PNG oficial o compose). Pie ADAARC en papel SISalud se omite; app no. Sala/cama texto libre solo SISalud. Select = desarrollado ∩ permitidos (no el listado de 40). Huerta: un solo público (Hospital Córdoba). Admin prueba los 3 públicos.
- Facturación ADAARC (evweb) es de **privadas en general**, no de una institución. Lo que cambia es la HC: Mayo = GECLISA siempre (después, camino a evweb según mutual); Aero = foja nativa. Públicos = SISalud, no evweb. Firma digital de consentimiento: no hasta abogado.
- **Home se rediseña por institución, no por foja.** Fuente completa: `docs/DISENO_PC_HOME.md` (leer entero; no de memoria). PC hoy = misma columna 520px del celular, centrada. No implementado.
- Empaquetado de adjuntos **por institución** (no forzar 3 archivos): Mayo GECLISA = 1 PDF qx+anest + auth aparte; Aero = fojas AnesFact + foto auth (2 fotos si no hay qx nativa). Detalle: `docs/ROADMAP_ESCALAMIENTO.md` § 1c. P1 no lo implementa.
- P1b (Mayo, fojas): GET `/Reporte/ReporteListadoInternado`. `pMeId` = N° por internación (confirmado en vivo). Ventana = fecha+hora de **esta** foja ± 8 h, no «ahora» ni ingreso/egreso. Persistido en 8b si el nombre coincidió. Fetch en la tab GECLISA del 1–12; sin botón extra; reintento si falta qx. Combinado → `docs.anest`. No es upload a evweb. `docs/ROADMAP_ESCALAMIENTO.md` P1b.
- P6 buzón de mail AnesFact para **autorizaciones** (mutual): idea 2026-09-01, sin diseñar. No es P1b. Detalle y preguntas abiertas: `docs/ROADMAP_ESCALAMIENTO.md` P6.
