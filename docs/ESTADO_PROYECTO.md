# Estado del proyecto AnesFact

**Punto de entrada único.** Este archivo no sustituye los docs de decisión: los **señala**. Un chat nuevo que solo lea el diario de versiones no va a enterarse de Home-por-institución ni de evweb×mutual. Si el tema toca un ítem de la lista, leé **ese archivo entero** (no de memoria).

---

## Retomar — 2026-09-08 (corte hasta el viernes)

Próxima prueba en vivo: **viernes 11 sep 2026** (no hay pacientes reales hasta entonces). Un chat nuevo arranca **acá**, no reconstruyas el hilo.

Versiones: `node tools/check-version-sync.mjs`. Snapshot:

| Qué | Versión | Dónde está |
|---|---|---|
| PWA | **12.62** | **origin/main** `25b8408` (Pages). Título de Home = `AnesFact v12.62`. |
| Extensión GECLISA | **0.5.15** | **origin/main** `5c874f8` (backup). Chrome **no** la baja de Pages: recargar carpeta local. |

### Extensión 0.5.15 — ¿hace falta Pages antes del viernes?

**No.** Chrome carga `chrome-extension-geclisa-batch/` sin empaquetar. Recargar en `chrome://extensions` en esta PC. GitHub es backup (ya en `5c874f8`); Pages no sirve la extensión.

No mezclar: confirmar PWA ≠ confirmar extensión.

### Hecho 2026-09-08

**Publicado (PWA 12.62, `25b8408`):**

1. **Nivel de bloqueo regional (GECLISA ID 8072).** No se tocó `fill.js`. El payload (`js/20-geclisa-send.js`) deriva `nivelRegional` desde Técnica guardada (`tec_espacio` / `tec`+`tec_lateral`) aunque la foja **no** esté abierta. Antes solo leía el DOM si `S.cur` era esa foja → la cola desde Home mandaba vacío.
2. **Alias visual del PDF combinado.** GET P1b sigue guardando **un** blob en `docs.anest`. Si pdf.js ve protocolo quirúrgico **y** anestésico, `docs.qx` = `{ aliasOf: 'anest' }` (sin duplicar). Facturación tilda las dos ranuras. Qx colgada a mano no se pisa. Incompleto → solo anestésica. Roadmap § 1c actualizado.

**En origin/main, backup (ext 0.5.15, `5c874f8` — no es Pages):**

3. **Paso 8b — bolsa de tokens del nombre.** Match de encabezado Evolución vs `pac` (o apellido+nombre): todos los tokens esperados tienen que estar en el encabezado (sin acentos, sin orden, sin prefijos tipo `dan`→`daniele`). Capa 1 del grid no cambió. Cubre apellido compuesto (`pac` sin coma vs GECLISA `APELLIDO COMPUESTO, NOMBRE`). Sin nombres ni N° en este diario.
4. **Cola atascada en `paused_error`.** Iniciar/Reanudar solo toman `queued`. **Siguiente** en pausa: botón habilitado, **no** marca `done`, deja `paused_error`, arranca el siguiente `queued`. **Reintentar** sigue siendo **este**. PWA «Iniciar cola» = START (con el skip alcanza).

No se tocó: `fill.js`, IDs GECLISA, `S.cur` de foja clínica. `docs.qx` alias es puntero, no segundo PDF.

### Pendiente de probar en vivo — viernes

PWA (tras recargar Pages, título **v12.62**):

- [ ] Cola con foja de anestesia **regional**, **sin abrirla** → campo 8072 (nivel regional) completo en GECLISA.
- [ ] Documentación de una foja con combinado **completo** → Foja Anestésica **y** Foja Quirúrgica tildadas, mismo PDF (leyenda tipo «mismo archivo (qx + anest)»). **Ver** abre el mismo archivo.

Extensión (tras recargar **0.5.15** en `chrome://extensions`; no hace falta Pages):

- [ ] Nombre: apellido compuesto (o reintentar un `evolucion_nombre_mismatch` por raya apellido/nombre).
- [ ] **Siguiente paciente** con una foja en pausa: la deja en `paused_error` y sigue con la próxima `queued`. Reanudar/Iniciar no vuelven a esa pausa. Reintentar sí.

Prueba con nombre **prueba** y DNI ficticio cuando se pueda; en Mayo real, no copiar nombres ni N° a este diario.

### Archivos del lote 0.5.15 (`5c874f8`)

`chrome-extension-geclisa-batch/`: `content/geclisa.js`, `background.js`, `popup.js`, `popup.html`, `manifest.json`, `content/anesfact-bridge.js`, `SELECTORS_PASOS_1_11.md`. No incluir `foja-prueba-*.pdf`.

---

## Índice de docs (`docs/`) — actualizar en el mismo paso al crear uno nuevo

### Decisiones vivas (leer enteras si el tema pega)

| Archivo | Qué trata (una frase) |
|---|---|
| `docs/DISENO_PC_HOME.md` | **Home por institución, no por foja** (PC primero, misma lógica en móvil; PC hoy = columna 520px). Leer el archivo completo antes de tocar Home/dock/layout. |
| `docs/ROADMAP_ESCALAMIENTO.md` | Fases P/U + empaquetado + P1b GET GECLISA + **P4 Traditum** (reconocimiento 2026-09-10, sin código) + **P6 buzón auth** (idea) + **P2 regla organización catálogo** (sin duplicar especialidades). |
| `docs/P2_QR_CIRUJANO.md` | P2 QR cirujano / `fojaQx`: OK Huerta + alcance Aero/públicos/Mayo (flag); gate §8 Paso 1 en auditoría. |
| `docs/P2_PROFORMAS_CYC.md` | Puntero → `docs/proformas-cyc/` (CyC). No editar clínica acá. |
| `docs/proformas-cyc/README.md` | P2 CyC: **13 proformas OK de semilla**; motor de código pendiente. |
| `docs/proformas-cyc/HALLAZGOS_ESQUELETO.md` | Tracking ampliaciones CyC post-OK (CEBC P7 ↔ Neuro M14). |
| `docs/proformas-cyc/07-nariz-senos.md` | CyC P7 Nariz/Senos: OK + ampliación CEBC cierre (xref Neuro). |
| `docs/cirugia-general/README.md` | P2 Cirugía General: **OK de semilla set** (M1–M6) + nota `foja.consideraciones`. |
| `docs/cirugia-general/HALLAZGOS_ESQUELETO.md` | Hallazgos CG + handoffs unificados; **OK set** (2026-09-14). |
| `docs/cirugia-general/01-pared-abdominal.md` | M1 Pared: **OK de semilla**. |
| `docs/cirugia-general/02-gastrointestinal.md` | M2 GI: **OK de semilla**. |
| `docs/cirugia-general/03-pancreato-biliar.md` | M3 Pancreato-biliar: **OK de semilla**. |
| `docs/cirugia-general/04-proctologia.md` | M4 Proctología: **OK de semilla**. |
| `docs/cirugia-general/05-retroperitoneo.md` | M5 Retroperitoneo: **OK de semilla**. |
| `docs/cirugia-general/06-esofagogastrico.md` | M6 Esofagogástrico/Bariátrica/Hernias: **OK de semilla**. |
| `docs/cirugia-toracica/README.md` | P2 Cirugía Torácica: **OK de semilla** + nota validación ≠ CyC/CG. |
| `docs/cirugia-toracica/HALLAZGOS_ESQUELETO.md` | Tracking Tórax; salvedad validación (Diego, no torácico). |
| `docs/cirugia-toracica/01-torax.md` | Tórax: **OK de semilla** (criterio Diego; no Huerta/torácico). |
| `docs/cirugia-urologica/README.md` | P2 Cirugía Urológica: **OK de semilla** + nota validación ≠ CyC/CG. |
| `docs/cirugia-urologica/HALLAZGOS_ESQUELETO.md` | Tracking Urología; salvedad validación (Diego, no urólogo). |
| `docs/cirugia-urologica/01-urologia.md` | Urología: **OK de semilla** (criterio Diego; no Huerta/urólogo). |
| `docs/cirugia-ginecologica/README.md` | P2 Cirugía Ginecológica: **OK de semilla** + nota validación ≠ CyC/CG. |
| `docs/cirugia-ginecologica/HALLAZGOS_ESQUELETO.md` | Tracking Ginecología; salvedad validación (Diego, no ginecóloga). |
| `docs/cirugia-ginecologica/01-ginecologia.md` | Ginecología: **OK de semilla** (criterio Diego; no Huerta/ginecóloga). |
| `docs/cirugia-traumatologia/README.md` | P2 Traumatología: **OK de semilla** + nota validación ≠ CyC/CG. |
| `docs/cirugia-traumatologia/HALLAZGOS_ESQUELETO.md` | Tracking Traumatología; salvedad validación (Diego, no traumatólogo). |
| `docs/cirugia-traumatologia/01-traumatologia.md` | Traumatología: **OK de semilla** (criterio Diego; no Huerta/traumatólogo). |
| `docs/cirugia-vascular/README.md` | P2 Vascular: **OK de semilla** + nota validación ≠ CyC/CG. |
| `docs/cirugia-vascular/HALLAZGOS_ESQUELETO.md` | Tracking Vascular; salvedad validación (Diego, no cirujano vascular). |
| `docs/cirugia-vascular/01-vascular.md` | Vascular: **OK de semilla** (criterio Diego; no Huerta/vascular). |
| `docs/cirugia-plastica/README.md` | P2 Plástica: **OK de semilla** + nota validación ≠ CyC/CG. |
| `docs/cirugia-plastica/HALLAZGOS_ESQUELETO.md` | Tracking Plástica; salvedad validación (Diego, no cirujano plástico); Surcolateral abierto. |
| `docs/cirugia-plastica/01-plastica.md` | Plástica: **OK de semilla** (criterio Diego; no Huerta/plástico). |
| `docs/cirugia-neurocirugia/README.md` | P2 Neurocirugía: **OK de semilla** + nota validación ≠ CyC/CG. |
| `docs/cirugia-neurocirugia/HALLAZGOS_ESQUELETO.md` | Tracking Neuro; salvedad validación; CEBC/EET + xref CyC P7; neuromonitoreo intramedular; Osteoflácida abierto. |
| `docs/cirugia-neurocirugia/01-neurocirugia.md` | Neurocirugía: **OK de semilla** + ampliación CEBC §1 (criterio Diego; no Huerta/neuro). |
| `docs/cirugia-cardiovascular/README.md` | P2 Cardiovascular: **OK de semilla** + nota validación ≠ CyC/CG. |
| `docs/cirugia-cardiovascular/HALLAZGOS_ESQUELETO.md` | Tracking CV; salvedad validación; gatillos consideraciones (mayor densidad). |
| `docs/cirugia-cardiovascular/01-cardiovascular.md` | Cardiovascular: **OK de semilla** (criterio Diego; no Huerta/CV). |
| `docs/cirugia-mano/README.md` | P2 Mano: **OK de semilla** + nota validación ≠ CyC/CG. |
| `docs/cirugia-mano/HALLAZGOS_ESQUELETO.md` | Tracking Mano; salvedad validación (Diego, no cirujano de mano); tandas 1–3. |
| `docs/cirugia-mano/01-mano.md` | Mano: **OK de semilla** (criterio Diego; no Huerta/mano). |
| `docs/cirugia-orl/README.md` | P2 ORL general (M17): **OK de semilla** + nota validación ≠ CyC/CG; sin solape CyC. |
| `docs/cirugia-orl/HALLAZGOS_ESQUELETO.md` | Tracking ORL; salvedad validación; coclear≠BAHA; indicación frenectomía. |
| `docs/cirugia-orl/01-orl-general.md` | ORL general: **OK de semilla** (criterio Diego; no Huerta/ORL). |
| `docs/cirugia-oftalmologia/README.md` | P2 Oftalmología (M18): **OK de semilla** + nota validación ≠ CyC/CG. |
| `docs/cirugia-oftalmologia/HALLAZGOS_ESQUELETO.md` | Tracking Oftalmología; salvedad validación; EECC≠FLACS; antimetabolitos. |
| `docs/cirugia-oftalmologia/01-oftalmologia.md` | Oftalmología: **OK de semilla** (criterio Diego; no Huerta/oftalmo). |
| `docs/cirugia-hemodinamia/README.md` | P2 Hemodinamia (M19): **OK de semilla** §1–4+§6; **§5 diferida** (solape M12). |
| `docs/cirugia-hemodinamia/HALLAZGOS_ESQUELETO.md` | Tracking Hemodinamia; salvedad validación; §5 pendiente vs M12. |
| `docs/cirugia-hemodinamia/01-hemodinamia.md` | Hemodinamia: **OK de semilla** §1–4+§6 (criterio Diego; §5 no incluida). |
| `docs/cirugia-gastroenterologia/README.md` | P2 Gastroenterología / endoscopia (M20): **OK de semilla** + nota validación ≠ CyC/CG. |
| `docs/cirugia-gastroenterologia/HALLAZGOS_ESQUELETO.md` | Tracking Endoscopia; salvedad validación; biopsias transversales; París/Mayo. |
| `docs/cirugia-gastroenterologia/01-endoscopia.md` | Endoscopia: **OK de semilla** (criterio Diego; no Huerta/gastro). |
| `docs/evweb_catalogo_completo.md` | Catálogo ADAARC/evweb: 307 obras sociales + 397 sanatorios (`value` interno ≠ código visible). Referencia P4; no codear fill desde acá. |
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

Versiones: salir de `node tools/check-version-sync.mjs`, no de este archivo. Snapshot al 2026-09-08:

- PWA `CACHE_V`: **12.70** local (Paso 2.3 proformas+CIE+print; ~470 KB `proformas-bundle.js` en STATIC_CORE)
- Extensión GECLISA: **0.5.15** (origin/main `5c874f8`; recargar local el viernes)

## En curso

- **Paso 2.3** en deploy: Pages 12.70 + Edge peek/submit. Pendiente smoke Diego (CyC Aero «prueba» + print con firma).

- **P2 Cirugía General:** **OK de semilla del set** (M1–M6). Soft handoffs aplicados. Motor pendiente. `foja.consideraciones` = fase aparte (0 código).
- **P2 Cirugía Torácica:** **OK de semilla** (`01-torax.md`). Validación criterio Diego/AnesFact (no torácico ni Huerta) — nota de cabecera se mantiene. Motor pendiente. 0 código.
- **P2 Cirugía Urológica:** **OK de semilla** (`01-urologia.md`). Validación criterio Diego/AnesFact (no urólogo ni Huerta) — nota de cabecera se mantiene. Motor pendiente. 0 código.
- **P2 Cirugía Ginecológica:** **OK de semilla** (`01-ginecologia.md`). Validación criterio Diego/AnesFact (no ginecóloga ni Huerta) — nota de cabecera se mantiene. Motor pendiente. 0 código.
- **P2 Traumatología:** **OK de semilla** (`01-traumatologia.md`). Validación criterio Diego/AnesFact (no traumatólogo ni Huerta) — nota de cabecera se mantiene. Motor pendiente. 0 código.
- **P2 Cirugía Vascular:** **OK de semilla** (`01-vascular.md`). Validación criterio Diego/AnesFact (no cirujano vascular ni Huerta) — nota de cabecera se mantiene. Motor pendiente. 0 código.
- **P2 Cirugía Plástica:** **OK de semilla** (`01-plastica.md`). Validación criterio Diego/AnesFact (no cirujano plástico ni Huerta) — nota de cabecera se mantiene. «Surcolateral» abierto. Motor pendiente. 0 código.
- **P2 Neurocirugía:** **OK de semilla** (`01-neurocirugia.md`) + ampliación CEBC/EET §1 (xref CyC P7). Validación criterio Diego/AnesFact (no neurocirujano ni Huerta) — nota de cabecera se mantiene. Gatillos consideraciones en roadmap. Motor pendiente. 0 código.
- **P2 Cirugía Cardiovascular:** **OK de semilla** (`01-cardiovascular.md`). Validación criterio Diego/AnesFact (no cirujano CV ni Huerta) — nota de cabecera se mantiene. Gatillos consideraciones (mayor densidad) en roadmap. Motor pendiente. 0 código.
- **P2 Cirugía de Mano:** **OK de semilla** (`01-mano.md`). Validación criterio Diego/AnesFact (no cirujano de mano ni Huerta) — nota de cabecera se mantiene. Motor pendiente. 0 código.
- **P2 ORL general (M17):** **OK de semilla** (`01-orl-general.md`). Validación criterio Diego/AnesFact (no ORL ni Huerta) — nota de cabecera se mantiene. Sin solape real con CyC. Motor pendiente. 0 código.
- **P2 Oftalmología (M18):** **OK de semilla** (`01-oftalmologia.md`). Validación criterio Diego/AnesFact (no oftalmólogo ni Huerta) — nota de cabecera se mantiene. Motor pendiente. 0 código.
- **P2 Hemodinamia (M19):** **OK de semilla** §1–4 + §6 (`01-hemodinamia.md`). **§5 diferida** (solape M12; xref preferido; M12 no tocado). Validación criterio Diego/AnesFact — nota de cabecera se mantiene. Motor pendiente. 0 código.
- **P2 Gastroenterología / endoscopia (M20):** **OK de semilla** (`01-endoscopia.md`). Validación criterio Diego/AnesFact (no gastroenterólogo ni Huerta) — nota de cabecera se mantiene. Sin solape real con CG. Motor pendiente. 0 código.
- **P2 QR cirujano / fojaQx:** Paso 1–2.2 CERRADOS. **Paso 2.3 en deploy** (12.70 + Edge peek/submit). Pendiente smoke CyC Aero «prueba» + print.

- **P4 Traditum / evweb:** ciclo + mapa Nueva Solicitud + catálogo ADAARC (`docs/evweb_catalogo_completo.md`). **Sin código.** Hueco a diseñar: estado «Pendiente de autorizar en Traditum».
- **Retomar:** bloque **Retomar — 2026-09-08** arriba (viernes: prueba en vivo 12.62 / 0.5.15). PWA **12.64** ya en origin (`7b3cc99`); recargar Pages aparte.
- Ext **0.5.15** en origin/main (`5c874f8`) como backup. El viernes: recargar local en `chrome://extensions`.

## Qué se hizo (más reciente primero)

- 2026-09-16 — P2 fojaQx **Paso 2.3 deploy** (12.70): proformas×32 + motor/UI + CIE + print; Edge peek/submit. Pendiente smoke Diego. Sin nombres/DNI reales.
- 2026-09-16 — P2 fojaQx **Paso 2.3 listo local** (12.70): schema+32 JSON, motor+tests, UI app+QR, CIE, print, peek snapshot, submit slots/CIE. Bundle ~470 KB en STATIC_CORE. Sin commit/deploy. Sin nombres/DNI reales.
- 2026-09-16 — P2 fojaQx **Paso 2.2 CERRADO en prod** (12.69): form+firma+submit+pull; TTL 7d; smokes Diego OK (punto 5 Mayo skip = code review). Sin nombres/DNI reales en este diario.


- 2026-09-16 — P2 fojaQx **Paso 2.1 CERRADO en prod**: Edge 5/5 + smokes Diego (valoración «prueba»; QR cirujano Aero→stub; cruce 403×2). Sin nombres/DNI reales en este diario.

- 2026-09-16 — P2 fojaQx **Paso 2.1 listo local** (sin commit): `af-qx-create`/`af-qx-peek`; filtros `modo` en `af-qr-peek`/`submit`/`create`; stub `foja-qx.html`; botón+modal QR; invalida token previo; CACHE_V **12.68**. Checker OK. Edge deploy aparte tras OK.

- 2026-09-16 — P2 fojaQx Paso 1 **OK prod** (Huerta/Diego): cáscara Aero, Mayo sin botón, dock «Foja qx» visible×8 ítems (v12.67). Falso positivo `#af-dock` null = timing pre-montaje topbar. Paso 2 QR no arranca sin pedido explícito.

- 2026-09-16 — P2: nota ROADMAP escalabilidad futura — cirujano iniciando fojaQx sin intervención de anestesia (suite completa); no implementar ahora. Dock Foja qx en prueba local 12.67.

- 2026-09-16 — P2 fojaQx: ítem dock «Foja qx» (siempre visible; disabled+toast sin foja / Mayo); fuera de `AF_DOCK_HIDE`; `onSanChange` actualiza `S.cur.san` + sync dock. CACHE_V **12.67**. Sin QR. Aviso: bump SW al publicar.

- 2026-09-16 — P2 fojaQx Paso 1 **cerrado** (entregas 1–4 OK Diego). Pausa hasta prueba en vivo Huerta (Aero/Córdoba: botón, cáscara, Mayo sin botón, sync). Paso 2 QR no arranca sin esa confirmación.

- 2026-09-16 — P2 fojaQx Paso 1 entrega 4: botón «Foja quirúrgica» (gated `afFojaQxEnabled`); omit `fojaQx` en `buildSyncPayload`/`exportarDatos` si flag off. Stub enabled ≈ **62 bytes/interv** en JSON `datos` (misma fila upsert). Mayo +0. CACHE_V **12.66**.

- 2026-09-16 — P2 fojaQx Paso 1 entrega 3: vista `fojaQx` + `views/fojaQx.html` + `js/42-foja-qx.js`; anillo VIEWS/SCRIPTS/SW; `go('fojaQx')` con guard enabled; dock hide. **CACHE_V 12.65**. Sin botón. Checker OK. Aviso: bump SW → re-descarga STATIC_CORE en clientes al publicar; sin Supabase.

- 2026-09-16 — P2 fojaQx Paso 1 entrega 2: `afFojaQxStub` / `afEnsureFojaQx` + `TITLES.fojaQx`; ensure en `abrirInter`/`nuevaInter`. Sin UI / sin sync. Costo nube: nulo (solo localStorage al guardar foja enabled).

- 2026-09-16 — P2 fojaQx Paso 1 entrega 1: `foja_qx` + `afFojaQxEnabled` en `data/instituciones-foja.js` (Aero+Córdoba+Misericordia+San Roque on; Mayo off). Sin UI. Sin impacto Supabase/GitHub. Gate §8 OK Diego.

- 2026-09-16 — P2 QR cirujano: alcance Huerta — Aero+públicos activos Paso 1; Mayo off; gating por flag en catálogo instituciones; sync solo si enabled; fojaQx = herramienta de suite (no sub-foja anestésica). Gate §8 Paso 1 re-presentado. **0 código.**

- 2026-09-16 — P2 QR cirujano: **gate §8 Paso 1** (modelo `fojaQx` + vista cáscara, sin QR) listado archivo-por-archivo en chat; esperando OK Diego. **0 código.**

- 2026-09-15 — P2 QR cirujano: 6 decisiones OK Huerta en `docs/P2_QR_CIRUJANO.md` (especialidad visible; `fojaQx`; un solo uso; solo foja abierta; firma en celular; institución heredada). Gate §8 + código: próxima sesión. **0 código.**

- 2026-09-15 — P2 QR cirujano: borrador de plan en `docs/P2_QR_CIRUJANO.md` (canal paralelo; 6 preguntas abiertas). **0 código.**

- 2026-09-15 — P2 Gastroenterología / endoscopia (M20): **OK de semilla** (`cge-endoscopia-v1`). Biopsias transversales; París/Mayo estructurados; Celiaquía; profilaxis CPRE; carácter variceal; PEG. Tracking HALLAZGOS + README + roadmap. Salvedad validación se mantiene. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-15 — P2 Gastroenterología / endoscopia (M20): esqueleto `docs/cirugia-gastroenterologia/01-endoscopia.md` (4 correcciones: Celiaquía; profilaxis pancreatitis CPRE; carácter variceal; indicación PEG). Numeración M20 (no «13»). Sin solape CG. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-15 — P2 Hemodinamia (M19): **OK de semilla** §1–4 + §6 (`chem-hemodinamia-v1`). §5 diferida (solape M12; xref preferido). Hallazgos: stents multivaso; leak paravalvular; gradiente solo estructural. Tracking HALLAZGOS + README + roadmap. Salvedad validación se mantiene. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-15 — P2 Hemodinamia (M19): esqueleto `docs/cirugia-hemodinamia/01-hemodinamia.md` §1–4 (8 correcciones: carácter ACTP; Ellis; MP/IPV TAVI; leak LAAO; cierre septal; aislamiento PV; umbrales). §5 diferida (solape M12). §6 pendiente. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-15 — P2 Oftalmología (M18): **OK de semilla** (`coft-oftalmologia-v1`). Tandas 1–3 OK; post-Tanda 2: antimetabolitos sin «Sin…». EECC ≠ FLACS. Tracking HALLAZGOS + README + roadmap. Salvedad validación se mantiene. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-15 — P2 Oftalmología (M18): esqueleto `docs/cirugia-oftalmologia/01-oftalmologia.md` (13 correcciones: trasplante; complicación faco; retina final; DR/mácula; PIO; glaucoma; tumor/margen; implante; DCR; estrabismo/trauma zona). Numeración M18 (no «20»). Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 ORL general (M17): **OK de semilla** (`corl-orl-general-v1`). Tandas 1–2 OK; post-Tanda 2: `indicacion_frenectomia`. Coclear ≠ BAHA. Tracking HALLAZGOS + README + roadmap. Salvedad validación se mantiene. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 ORL general (M17): esqueleto `docs/cirugia-orl/01-orl-general.md` (11 correcciones: colesteatoma; VII; cadena/PORP-TORP; gusher; telemetría coclear; amigdalectomía; absceso; IAH; DISE). Sin solape CyC. Numeración M17 (no «19»). Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 CEBC: merge Neuro M14 §1 (`lesion_cebc`, `corredor_cebc`, xref cierre→CyC P7) + CyC P7 cierre base de cráneo (Hadad/injerto/sellante/taponamiento/CLD, xref→Neuro). Foja cada uno si equipo (Huerta). Sin módulo híbrido; M11 no tocado. HALLAZGOS + README + ESTADO. Solo doc.

- 2026-09-14 — P2: **regla de organización del catálogo** en `docs/ROADMAP_ESCALAMIENTO.md` (dueño = especialidad auditada; documentar solape; no tocar OK ajenos sin OK explícito; ej. Mano M16 ↔ Trauma M11). También en §5 Qué no hacer. Solo doc.

- 2026-09-14 — P2 Mano: **OK de semilla** (`cmano-mano-v1`). Tandas 1–3 OK; post-Tanda 2: `proc_reparacion_nerviosa` también si Amputación/reimplante (11 correcciones). Tracking HALLAZGOS + README + roadmap. Salvedad validación se mantiene. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 Mano: esqueleto `docs/cirugia-mano/01-mano.md` (10→11 correcciones: reducción; escafoides; Dupuytren; Seddon; reimplante; Palmer; second-look; exanguinación; reparación nerviosa en reimplante; etc.). Validación ≠ CyC/CG. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 Cardiovascular: **OK de semilla** (`ccv-cardiovascular-v1`). Post-tandas: `caracter_cirugia`; `resultado_revision_valvular`; `gradiente_septal_post_mmhg`. Tracking HALLAZGOS + README + roadmap (consideraciones CEC/ACT, paro hipotérmico, off-pump, protamina, ETE, destete). Salvedad validación se mantiene. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 Cardiovascular: esqueleto `docs/cirugia-cardiovascular/01-cardiovascular.md` (9 correcciones: destete CEC; reesternotomía; indicación CRM; TTFM; indicación+ETE valvular; troncos supraaórticos; soporte; reexploración). Gatillos consideraciones (CEC/ACT, paro hipotérmico, off-pump, protamina, ETE, destete) en roadmap P2. Validación ≠ CyC/CG. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 Neurocirugía: **OK de semilla** (`cneuro-neurocirugia-v1`). Post-tandas: posición multi-disparo; circulación; volumen hematoma vascular; neuromonitoreo required si intramedular; raíz schwannoma. Tracking HALLAZGOS + README + roadmap (consideraciones awake/DBS/VAE/clipado/HTE). Salvedad validación se mantiene. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 Neurocirugía: esqueleto `docs/cirugia-neurocirugia/01-neurocirugia.md` (18 correcciones: pares/ACI-quiasma; Hunt-Hess/Fisher; clipado; GCS/midline; DBS; niveles raqui; posición; etc.). Gatillos consideraciones (awake/DBS/VAE/clipado/HTE) en roadmap P2. Validación ≠ CyC/CG. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 Plástica: **OK de semilla** (`cpl-plastica-v1`). Post-tandas: nota Surcolateral; `indicacion_mamaria`; `indicacion_facial`; `tiempo_desde_quemadura`. Tracking HALLAZGOS + README + roadmap. Salvedad validación (Diego ≠ Huerta/plástico) se mantiene. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 Plástica: esqueleto `docs/cirugia-plastica/01-plastica.md` (17 correcciones: indicación cobertura; isquemia/viabilidad colgajo; TRAM≠DIEP; mamaria; TEV contorno; n. facial; SCTQ; drenaje/TPN separados; etc.). Validación ≠ CyC/CG. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 Vascular: **OK de semilla** (`cvasc-vascular-v1`). Post-tandas: tiempo clampeo; monitoreo sin «No utilizado»; protección CAS; heparinización sistémica. Tracking HALLAZGOS + README + roadmap. Salvedad validación (Diego ≠ Huerta/vascular) se mantiene. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 Vascular: esqueleto `docs/cirugia-vascular/01-vascular.md` (12 correcciones: diámetro AAA; endoleak; Stanford; uréter; AMI; NASCET; nervios X/XII/VII; Rutherford; runoff; fasciotomía; CEAP; justificación amputación). Validación ≠ CyC/CG. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 Traumatología: **OK de semilla** (`cto-traumatologia-v1`). Post-tandas: degenerativa por región; `resultado_reduccion_cadera`; `plexo_lumbar_xlif`. Tracking HALLAZGOS + README + roadmap. Salvedad validación (Diego ≠ Huerta/traumatólogo) se mantiene. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 Traumatología: esqueleto `docs/cirugia-traumatologia/01-traumatologia.md` (21 correcciones: Gustilo; Garden/AO; LCA; menisco; Weber/LH; neuromonitoreo; niveles multi; etc.). Validación ≠ CyC/CG. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 Ginecológica: **OK de semilla** (`cgine-pelviana-v1`). `cistoscopia_control_tvt` (TVT). Tracking HALLAZGOS + README + roadmap. Salvedad validación (Diego ≠ Huerta/ginecóloga) se mantiene. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 Ginecológica: esqueleto `docs/cirugia-ginecologica/01-ginecologia.md` (12 correcciones: uréteres/vejiga histerectomía; márgenes radical; plantilla linfadenectomía; TVT≠TOT; POP-Q; etc.). Validación ≠ CyC/CG. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 Urológica: **OK de semilla** (`cu-urologia-v1`). `lateralidad_genital` + orquiectomía simple/subcapsular. Tracking HALLAZGOS + README + roadmap. Salvedad validación (Diego ≠ Huerta/urólogo) se mantiene. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 Urológica: esqueleto `docs/cirugia-urologica/01-urologia.md` (14 correcciones: márgenes; VCI Neves-Zincke; RTU-V a vesical; Foley/drenaje separados; Regla 1 Boari/cistectomía; etc.). Validación ≠ CyC/CG (salvedad como Tórax). Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 Torácica: **OK de semilla** (`ct-torax-v1`). Tracking `HALLAZGOS_ESQUELETO.md` + README + roadmap. Salvedad validación (Diego ≠ Huerta/torácico) se mantiene en cabecera. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 Torácica: esqueleto `docs/cirugia-toracica/01-torax.md` (hermeticidad muñón; frénico/recurrente; indicaciones; drenaje Fr+ubicación; mediastino por compartimento; timectomía; fístula; reexpansión No evaluada). Nota: validación ≠ CyC/CG. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — CG: **OK de semilla del set** (6/6 módulos). Soft handoffs ya aplicados. Motor P2 pendiente. `foja.consideraciones` fase aparte. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — CG: soft pasada cruzada **aplicados** (M5 multivisceral+handoffs; wording Mn+id; M3 foco VBP; M1 Contaminado; M6 handoff_gi). Pendiente OK set. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — CG: **M6 OK de semilla**. Pasada cruzada handoffs (matriz + soft #1–5 en `HALLAZGOS_ESQUELETO.md`). Set CG pendiente cierre. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — CG: **M5 OK de semilla** (`ureter_gesto` solo gestos, no duplicar Regla 1 masa). M6 Esofagogástrico → esqueleto primera pasada (hermeticidad; Acalasia; vagos; Collis; OAGB sin YY forzada; Sleeve; revisional; sitio hernia; ventilación → consideraciones). Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — CG: **M4 OK de semilla** (hemostasia ampliada). M5 Retroperitoneo → esqueleto primera pasada (feocromo/tórax → consideraciones; dx masa; Regla 1; trombo VCI). Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — CG: **M3 OK de semilla**. M4 Proctología → esqueleto primera pasada (continencia pre, sin anestesia genérica, neoplasia ampliada, pilonidal, mutex hemorroides). Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — CG: **M2 OK de semilla** (cierre colostomía en asa; drenaje_gi + Ostomía). M3 Pancreato-biliar → esqueleto primera pasada. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — CG: **M1 OK de semilla**. M2 GI → esqueleto slots primera pasada (uréteres, L/LC/C+Hartmann, márgenes, hermeticidad, ostomías, apendicectomía, sleeve→M6). Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — CG M1: 1ª pasada → correcciones (vasos testiculares/cordón; `tecnica_con_malla` solo Abierto/Convertido). Pasada final pendiente. SCOPA/eTEP diástasis abierto. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — Cirugía General: 8 preguntas cerradas (apendicectomía M2; sleeve M6; diástasis; hermeticidad M3/M6; Collis; vagos; revisional). M1 Pared → esqueleto slots primera pasada (`01-pared-abdominal.md`). Solo doc. Sin nombres ni N° en este diario.

- 2026-09-14 — Cirugía General: M6 confirmado (ventilación → consideraciones, no slot qx); consolidado `HALLAZGOS_ESQUELETO.md` + `06-esofagogastrico.md`; M5 realineado. Sin esqueleto ni semilla. 0 código. Sin nombres ni N° en este diario.

- 2026-09-14 — Cirugía General M6 Esofagogástrico/Bariátrica/Hernias: auditoría de bruto en chat (hermeticidad unificada, Acalasia tipografía, Regla 3 esofaguectomía, dueño sleeve vs M2, Petersen, etc.). Sin doc todavía. 0 código. Sin nombres ni N° en este diario.

- 2026-09-14 — P2 diseño: `S.cur.foja.consideraciones` (fase aparte; GECLISA ignora; sugerencia qx con confirmación; print sin fila nueva → Métodos). README `cirugia-general` + roadmap. 0 código. Sin nombres ni N° en este diario.

- 2026-09-14 — Cirugía General M5 Retroperitoneo: auditoría confirmada (feocromo Regla 3, dx masa, integridad disección, vascular planificado vs no, Lateralidad, Sin drenaje). 2 preguntas abiertas Huerta (toracoabdominal; trombo VCI). Doc `05-retroperitoneo.md`. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-13 — Cirugía General M3 pancreato-biliar: auditoría confirmada; `evento_vascular_no_planificado`, `piloro_final`, VBP≠CVS, textura+Wirsung, Kehr, etc. Doc `03-pancreato-biliar.md`. Sin esqueleto. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-13 — Cirugía General M2 GI: ostomías `trayecto_muscular` + `fijacion_estoma` (corrige «transrectal»); hermeticidad = Fuga/Sin fuga/No realizada. Docs `cirugia-general/`. Sin esqueleto ni semilla. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-13 — CyC: **OK de semilla** para las 13 proformas (`docs/proformas-cyc/`). Motor P2 pendiente. README + roadmap actualizados. Solo doc; 0 código. Sin nombres ni N° en este diario.

- 2026-09-13 — CyC P1: detalle paratiroidectomía (adenoma/hiperplasia subtotal) + nota Sistrunk embriológico; P12 `cantidad_lobulillos_estado`. 1–11 y 13 aprobadas; 12 pendiente confirmación. Sin OK de semilla. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-13 — CyC P1: jerarquía vía→extensión (Huerta); Sistrunk/paratiroides separados. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-13 — CyC tanda 3: P10 sub-sitios/tipo/abordaje/margen/cierre; P11 instrumentación/cuerda/lesión benigna/cordectomía; P12 sitio+lobulillos+objetivo Sjögren; P13 tipo_acto escisional/incisional/BAAF. Segunda pasada de las 13 pedida; sin OK de semilla. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-13 — Auditoría CyC tanda 2: P5 oclusion required (sin empty_text falso); P7 ángulo/navegación/empaquetamiento; P8 condicionales glomus/schwannoma/branquial; P6 aprobada. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-13 — Auditoría CyC tanda 1: P1 +slot NLR; P3 +lingual/hipogloso (submax); P4 `required_if_reseccion_includes` en extensiones. P2 y resto P3/P4 OK. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-13 — Proformas CyC: monolito partido a `docs/proformas-cyc/` (13 archivos + README). `P2_PROFORMAS_CYC.md` = puntero. Sin OK de semilla. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-13 — `docs/P2_PROFORMAS_CYC.md`: P7–P10 resueltos + extras (13 proformas). Piel amplía Mohs; Laringe/MLS separada de 4 (+ vía aérea); ortognática + oclusión. Sin OK de semilla. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-13 — `docs/P2_PROFORMAS_CYC.md`: 4 áreas CyC pendientes (ortognática, nariz/senos, glómicos, benigna schwannomas/quistes branquiales) — solo anotadas, sin inventar clínica. Las 6 en revisión de slots; sin OK de semilla. Solo doc. Sin nombres ni N° en este diario.

- 2026-09-13 — Doc `docs/P2_PROFORMAS_CYC.md`: 6 proformas CyC (Huerta) bajadas a slots + plantilla; ganglios = semiología, no conteo AP. Semilla pendiente de OK. Solo doc; 0 código. Sin nombres ni N° en este diario.

- 2026-09-13 — Roadmap **P2** auditoría §8: GECLISA/`fill.js`/P1b/evweb/Traditum/print anestésico Mayo·Aero·públicos = **intactos** si P2 es código nuevo + anillo nav/caché + `S.cur` con OK; Mayo qx sigue GECLISA; no pisar alias `docs.qx`. Solo doc; 0 código. Sin nombres ni N° en este diario.

- 2026-09-13 — Roadmap **P2**: 8 requisitos de fondo (un camino facturación; sync bidireccional qx↔anestesia con alerta suave; alergias UI; ítem dock; calidad; proformas configurables sin tocar motor; feedback; auditoría obligatoria pre-código) + cáscara A4 campo a campo antes de la descripción. Solo doc; 0 código. Sin nombres ni N° en este diario.

- 2026-09-12 — Doc P4: «Transacción N°» en evweb es **solo APROSS** (probado PAMI/ART/IOSFA/OSPA = no). Misma Documentación electrónica genérica en el resto. Etiqueta «AUTORIZACIÓN DE OBRA SOCIAL» no confirmada como campo del form. Pregunta abierta a ADAARC: auth sin secretaria. Solo doc.

- 2026-09-12 — Doc: `docs/evweb_catalogo_completo.md` (307 OS + 397 sanatorios ADAARC; `value` ≠ código visible; tabla Huerta al inicio). Referenciado desde roadmap P4. Solo doc; 0 automatización.

- 2026-09-10 — Roadmap **P4**: ciclo de vida Traditum (foto → Nueva Solicitud → consultar; Validada / rechazo de a un nivel / validación parcial / auditoría). Hueco: estado «Pendiente de autorizar en Traditum». Solo doc. Sin nombres de pacientes ni credenciales.

- 2026-09-10 — Roadmap **P4**: mapa Nueva Solicitud Traditum (IDs ASP.NET, fuentes afiliado/diagnóstico/práctica `1601`+comp, cross-origin `aprossgestores`). Solo doc; 0 automatización. Sin nombres de pacientes ni credenciales.

- 2026-09-10 — Impresiones de prueba (local): foja **prueba** Aero y Hospital Córdoba, VG 4 h / 49 cols, 12 chips + decúbito y ocular. 1 hoja cada una. PDFs no van a git. Sin nombres reales ni N° en este diario.

- 2026-09-10 — PWA **12.64** Lote 2 (local, sin publicar): tira Protecciones en Técnica (todas); PROT. DECUB. espejado con Mayo `#mon-decub` (radios 8115/8116 intactos); ocular Sí/No + ungüento/cierre palpebral. Frases en Métodos, reaplicadas después de `tecNivel4Check`. Sin nombres ni N° en este diario.

- 2026-09-10 — PWA **12.63** Lote 1 (local, sin publicar): 12 chips + «sin referidos» en Técnica (Aero/públicos) y el mismo chip en Mayo; `antec_otros` / `antec_negados`; fila Antecedentes en A4 (gráfico 124 px). Vacío ≠ negados. Sin nombres ni N° en este diario.

- 2026-09-08 — Ext **0.5.15** en origin/main (`5c874f8`): 8b bolsa de tokens; Siguiente/Reanudar saltan `paused_error`. Backup; Chrome recarga carpeta local. Sin nombres ni N° en este diario.

- 2026-09-08 — PWA **12.62**: cola GECLISA arma `nivelRegional` desde `tec_espacio` / bloqueo+lateral (no exige foja abierta). PDF P1b completo: tilde qx = alias al mismo `docs.anest`, sin duplicar. Sin nombres ni N° en este diario.

- 2026-09-07 — Ext **0.5.15** (mismo lote, publicado 2026-09-08 `5c874f8`): 8b bolsa de tokens; cola salta `paused_error`.

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
- **P2 catálogo de especialidades:** patología/procedimiento de una especialidad ya auditada vive ahí; no duplicar ni meter en módulo genérico. Antes de esqueleto nuevo: chequear solape y documentar si reemplaza / amplía / convive. No modificar OK de semilla ajenos sin OK explícito de Diego. Ejemplo: Mano (M16) detalle vs Trauma (M11) §2 básico. Fuente: `docs/ROADMAP_ESCALAMIENTO.md` § P2.
