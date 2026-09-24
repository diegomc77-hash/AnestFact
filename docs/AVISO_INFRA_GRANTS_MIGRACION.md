# Aviso infra — Supabase grants + migración Storage/hosting

_Auditado por Claude (no Cursor) el 2026-09-23. No tocar código de la app desde este doc — esto es checklist/roadmap, lo implementa Cursor._

## 1. Fecha límite: 30 de octubre de 2026 — Supabase Data API grants

Desde esa fecha, Supabase deja de otorgar automáticamente el acceso de la Data API a tablas nuevas en `public`. **Es gratis igual, no es un cambio de plan** — solo hay que agregar 3 líneas de SQL a mano en toda migración que cree una tabla:

```sql
grant select on public.tu_tabla to anon;
grant select, insert, update, delete on public.tu_tabla to authenticated;
grant select, insert, update, delete on public.tu_tabla to service_role;
```

**Checklist obligatorio para TODA migración nueva (024 en adelante) que haga `CREATE TABLE`:** incluir estos GRANT en el mismo archivo, si no la tabla queda inalcanzable por la API con error "permission denied" (no pierde datos, solo no se puede leer/escribir hasta agregar el grant).

**Ya identificado con deuda:** migración `005_pacientes_valoracion.sql` (crea `anesfact_pacientes`, `anesfact_qr_tokens`, `anesfact_valoraciones`, `anesfact_foja_vinculos`) no tiene GRANT explícito — funciona hoy porque ya se aplicó en producción antes del cambio (grandfathered), pero si el proyecto se recrea alguna vez (`supabase db reset`, preview branch, proyecto nuevo) esas 4 tablas se rompen. Agregar los GRANT a ese archivo como parche preventivo.

**Relevante para P2 — foja quirúrgica:** el roadmap la define como "entidad propia" → va a necesitar tabla nueva → no olvidar el GRANT desde el primer commit de esa migración.

## 2. Ticket — mover adjuntos (PDF/fotos) de la tabla a Supabase Storage

**Por qué:** hoy los PDFs se guardan como texto base64 adentro de `anesfact_datos`, compiten por el límite de 500MB de la base (el chico). Storage es un cajón aparte de 1GB gratis, más barato de escalar en el plan pago.

**Toca:**
- `js/17-sync-export.js` — subir a bucket de Storage en vez de meter el archivo entero en el JSON; guardar solo la referencia.
- `afResolveDoc` / `afeDocSnap` (`js/40-evweb-queue.js`) y el equivalente en `js/39-geclisa-queue.js` — leer desde Storage en vez del JSON.
- Migración SQL nueva: crear bucket + políticas RLS (mismo criterio de aislamiento por usuario que ya usan las tablas).
- No toca `fill.js`, IDs GECLISA, ni el formulario de foja.

**Riesgo:** medio (hay que migrar los adjuntos ya existentes). Probar con foja de prueba antes de producción.

## 3. Ticket — mover hosting de GitHub Pages a Cloudflare Pages

**Por qué:** los términos de GitHub Pages prohíben explícitamente usarlo para SaaS/negocio online ("not intended for... providing commercial software as a service"). Cloudflare Pages no tiene esa cláusula, es gratis, bandwidth de assets estáticos ilimitado.

**Toca:**
- Conectar el mismo repo a un proyecto nuevo de Cloudflare Pages (deploy automático, no duplica nada a mano).
- `seguridad.js` — sumar el dominio nuevo de Cloudflare a los dominios autorizados (hoy dice GitHub Pages + localhost).
- Revisar si el link de producción está hardcodeado en algún lado (ej. la extensión Chrome).
- No toca lógica de negocio ni Supabase.

**Riesgo:** bajo, reversible (GitHub Pages sigue andando hasta que se apague a propósito).

**Nota de diligencia (no bloquea nada, ya existe hoy igual):** Cloudflare, como Supabase, pide consentimiento escrito / BAA para guardar o transmitir PHI (info de salud, definición HIPAA). En esta arquitectura los datos de pacientes nunca pasan por el hosting estático (van directo navegador↔Supabase), así que el hosting no es donde vive el riesgo. El riesgo real (si existe) ya está en Supabase desde el día 1, sin cambiar con esta migración. HIPAA es ley de EE.UU., no aplica en Argentina (acá rige la Ley 25.326). Riesgo contractual bajo, no legal.

**Bug 1 encontrado 2026-09-23 (Diego creó el proyecto en Cloudflare, falló el build):** el deploy falla con `Asset too large` — `tools/apk-ref/app.zip` (63 MB, un APK de referencia para desarrollo, no parte de la app) supera el límite de 25 MB por archivo de Cloudflare Workers/Pages. **Resuelto por Cursor:** `.assetsignore` en la raíz excluyendo `tools/` y `backup/`, commit `1850f8d`, build pasó a Success.

**Bug 2 encontrado 2026-09-23 (auditado por Claude, viendo la pantalla real de Cloudflare):** el proyecto no quedó como Cloudflare Pages clásico — el log de build muestra `npx wrangler deploy`, que es el comando de **Cloudflare Workers** (con assets estáticos), no de Pages. La URL real de producción es **`anestfact.diegomc77.workers.dev`** — NO `anestfact.pages.dev` como se asumió y se dejó configurado en el código. Las previews de rama quedan como `<rama>-anestfact.diegomc77.workers.dev`.

**Fix para Cursor — reemplazar `anestfact.pages.dev` por `anestfact.diegomc77.workers.dev` en:**
- `seguridad.js` (`DOMINIOS_EXACTOS` y el chequeo de sufijo de previews — ahora sería sufijo `-anestfact.diegomc77.workers.dev`, no `.anestfact.pages.dev`)
- `chrome-extension-geclisa-batch/manifest.json` (`host_permissions`, `externally_connectable`, `content_scripts` matches)
- `docs/DEPLOY_CLOUDFLARE_PAGES.md` (corregir la URL documentada)
- Avisar a Diego que también tiene que corregir la redirect URL en Supabase Auth (`https://anestfact.diegomc77.workers.dev` en vez de `.pages.dev`) y recargar la extensión con la versión nueva.

No probar login hasta que esto esté corregido — con la config actual, `seguridad.js` va a bloquear el acceso a esa URL real con "ACCESO NO AUTORIZADO". **Resuelto por Cursor:** PWA 12.99 / ext 0.6.27, `seguridad.js`/extensión/doc corregidos. Diego agregó las Redirect URLs en Supabase Auth. Login en el navegador anda bien.

**Bug 3 encontrado 2026-09-23 (Diego probó instalar la PWA en la PC → 404):** `manifest.json` (raíz del repo) tiene `"start_url": "/AnestFact/"` y `"scope": "/AnestFact/"` — rutas absolutas pensadas para la subcarpeta de GitHub Pages (`diegomc77-hash.github.io/AnestFact/`). En Cloudflare la app vive en la raíz del dominio (`anestfact.diegomc77.workers.dev/`, sin subcarpeta), así que al instalar la PWA intenta abrir una ruta que no existe → 404. **Fix para Cursor:** cambiar ambas líneas a rutas relativas: `"start_url": "./"` y `"scope": "./"`. **Resuelto por Cursor, confirmado por Claude (verificado en vivo con fetch al manifest.json de producción, no solo en local):** commit `b4c2e97`, build Cloudflare success, PWA 13.00. Instalación mobile OK. Instalación PC: el primer intento no tomaba el cambio (Chrome tenía cacheado el intento fallido anterior); se resolvió borrando todos los datos del sitio en `chrome://settings/content/all` y reinstalando. Diego confirmó "ya está todo ok".

**TICKET 3 — CERRADO (2026-09-23).** Login y PWA funcionando en `https://anestfact.diegomc77.workers.dev` tanto en mobile como en PC. GitHub Pages sigue activo en paralelo, sin apuro para apagarlo.

## 4. Ticket — dashboard de "lleno" de Supabase en el panel admin (tiempo real, con barritas)

**Por qué:** el admin (Diego) quiere ver de un vistazo, dentro de la app, qué tan cerca está cada límite gratis de Supabase — sin tener que entrar al dashboard de Supabase a revisar a mano.

**Qué mostrar (barritas de progreso, valor actual / límite del plan free):**
- Tamaño de base de datos (hoy 500MB free) — vía `pg_database_size(current_database())`.
- Tamaño de Storage (1GB free) — solo tiene sentido una vez ejecutado el Ticket 2; hasta entonces mostrar "—" o la barra oculta.
- Usuarios activos mensuales / MAU (50k free) — ya accesible por `auth.users` (count).
- Filas en `anesfact_datos` y en las 4 tablas de valoración QR (`anesfact_pacientes`, `anesfact_qr_tokens`, `anesfact_valoraciones`, `anesfact_foja_vinculos`) — conteo simple, referencia de crecimiento, no tiene límite propio pero ayuda a ver la tendencia.

**Lo que NO se puede mostrar así:** egress/bandwidth mensual (5GB free) — eso no es una consulta SQL, solo lo expone la Management API de Supabase con un token de proyecto que hoy no está en la app (y no debería estar embebido en el cliente). Dejar ese dato afuera del dashboard v1 y aclarar en la UI "egress: revisar en supabase.com/dashboard" en vez de inventar un número.

**Cómo implementarlo (siguiendo el patrón ya usado en el panel admin):**
- Una función SQL nueva `af_admin_infra_usage()`, `SECURITY DEFINER`, que:
  - Valida adentro que `auth.uid()` corresponde a un usuario con `rol = 'admin'` en `anesfact_usuarios` (igual chequeo que ya hacen las demás RPC de admin, p.ej. `af_admin_set_plan`) — si no es admin, devuelve error, no datos.
  - Devuelve un JSON con `db_size_bytes`, `storage_size_bytes` (null hasta Ticket 2), `mau_count`, `datos_rows`, `pacientes_rows`, `qr_tokens_rows`, `valoraciones_rows`, `vinculos_rows`, y un timestamp.
  - `grant execute on function public.af_admin_infra_usage() to authenticated;` (con el chequeo de rol adentro, no hace falta más).
- En `views/admin.html`: una card nueva "Uso de infraestructura" (mismo estilo que las cards existentes — ver `admin-table-wrap`/`admin-badge`), con 3-4 barras (`<div class="admin-bar"><div class="admin-bar-fill" style="width:XX%"></div></div>` o similar, reusando clases CSS existentes si ya hay algo parecido a una barra en `styles.css`; si no existe, agregar `.admin-bar`/`.admin-bar-fill` nuevas, minimalista).
- En `js/30-admin.js`: función `loadAdminInfraUsage()` que llama `adminRpc('af_admin_infra_usage', {})` (mismo helper que ya usan las otras llamadas del panel) y pinta las barras; llamarla desde `loadAdminPanel()` junto a lo que ya carga.
- Umbrales de color sugeridos: verde <60%, amarillo 60–85%, rojo >85% del límite free — para que las "barritas" avisen antes de llegar al tope, no cuando ya se rompió algo.

**No toca:** `fill.js`, IDs GECLISA, lógica clínica, tablas existentes (solo lee, no escribe). Riesgo: bajo — es una vista de solo lectura nueva.

## 5. Ticket — limpiar adjuntos ya confirmados en GECLISA/EVWEB (reduce lo acumulado)

**Origen:** pregunta de Diego — si un PDF/foto ya se mandó y **la mutua lo aceptó**, ¿para qué sigue ocupando espacio en la nube?

**Auditado:** hoy no existe ninguna limpieza — ni automática ni manual. Los adjuntos quedan para siempre en `anesfact_datos`/Storage, se confirme el envío o no. Sí existe un gancho útil: la cola de `js/40-evweb-queue.js` ya tiene un estado `awaiting_confirm` ("Revisá en ADAARC/Facturación") — es decir, el sistema ya distingue "mandado" de "confirmado que la mutua lo aceptó". Ese es el punto exacto donde debería dispararse cualquier limpieza — **nunca antes**, y nunca solo por haberse enviado a la cola.

**Antes de implementar borrado, hay una pregunta que no es técnica y hay que responderla primero:** en Argentina la Ley 26.529 (historia clínica) exige guardar la historia clínica un mínimo de 10 años. Hay que confirmar si estos adjuntos (fotos de DNI, consentimientos, resultados de laboratorio, etc.) son:
- (a) una copia de trabajo redundante — ya vive en GECLISA/EVWEB y en la propia foja/historia clínica del sanatorio, y acá solo se usó para autocompletar el envío → borrar después de confirmado es razonable, o
- (b) la única copia que queda de ese documento → borrarla sería perder un registro que legalmente hay que conservar.

Esto depende de cómo funciona cada mutua/sanatorio (si te devuelven o no una copia aceptada) y lo tiene que confirmar Diego, no asumirlo el código.

**CONFIRMADO por Diego (2026-09-23): es (a).** El archivo original existe en otro lado; una vez que EVWEB lo autoriza a facturar, el adjunto ya cumplió su función en AnesFact y se puede descartar. **Aclaración importante que no cambia:** esto es solo para los adjuntos (fotos/PDF de autorización, foja quirúrgica escaneada, etc.) — la foja en sí (texto: datos del paciente, dosis, horarios, técnica) **nunca se borra**, es el historial clínico real, pesa poco (8–25 KB) y no está en discusión acá.

**Luz verde para Cursor — implementación:**
- Cuando un ítem de la cola EVWEB/GECLISA pase a estado confirmado (no `awaiting_confirm`, el confirmado real, visible en Facturación) → recién ahí, marcar el/los adjunto(s) de esa intervención como candidatos a limpieza.
- No borrar automático en el momento: dejarlo en un estado "limpiable" y borrar en un paso aparte (manual desde Facturación, o un job que solo actúa sobre ítems confirmados hace más de N días) — así hay margen si la mutua rechaza algo después.
- Guardar igual el dato mínimo de auditoría (que existió, cuándo se envió, cuándo se confirmó) aunque se borre el archivo pesado — separar "metadata" de "blob".
- No toca `fill.js`, IDs GECLISA, ni reglas clínicas. Riesgo: medio — es borrado real, no solo lectura; probar primero marcando "limpiable" sin borrar, y borrar recién en una segunda etapa una vez validado con casos reales.

**Estado (actualizado 2026-09-23):** POSPUESTO por Diego. No arrancar todavía. Motivo: Diego estuvo subiendo fojas de prueba a EVWEB varias veces sin completarlas (práctica) y su señora subió fojas que tampoco se cargaron aún — el circuito real de EVWEB (y de Traditum, que tiene su propio circuito de autorización con la misma lógica) todavía no está validado de punta a punta en producción.

**Definición de "circuito completo" (para saber cuándo retomar):** el mismo punto de referencia que ya existe en GECLISA — cuando en la pantalla de esa mutua/plataforma se aprieta "guardar" y el sistema confirma que quedó guardado, ahí se considera terminado el circuito. Recién cuando eso esté comprobado y funcionando al 100% tanto en EVWEB como en Traditum, se retoma este ticket.

**Recordatorio para Cursor y para Claude:** no tocar el ticket 5 hasta que Diego confirme explícitamente "el circuito de EVWEB/Traditum ya cierra al 100%, retomen el ticket 5".

**Auditoría de la cola EVWEB (2026-09-23), para preparar esa prueba:** `js/40-evweb-queue.js` ya soporta varios ítems en cola (igual que GECLISA) y usa el mismo vocabulario de 5 estados: `queued → running → awaiting_confirm → done` (o `paused_error`). Lo que no se pudo confirmar solo leyendo código es si el content-script/background de la extensión ya dispara el pase a `done` para EVWEB igual que lo hace para GECLISA (esa lógica vive en `chrome-extension-geclisa-batch/background.js`, no se pudo auditar completo por tamaño). **Prueba pendiente de Diego:** cargar 2-3 fojas reales a la cola EVWEB y verificar que el panel las mueva solas de "en cola" → "revisá en ADAARC" → "listo". Si se traban en algún estado intermedio, ahí está lo que falta resolver antes de dar el circuito por cerrado. Después de EVWEB, repetir la misma prueba con APROSS una vez que el camino de Traditum esté terminado.

## 6. Ticket — AnesFact no valida que el adjunto sea el correcto ni que pertenezca al paciente

**Origen:** hallazgo de Diego al pensar en el ticket 5 — si se va a confiar en estos adjuntos como respaldo, hay que saber qué tan confiables son.

**Auditado:** confirmado, es un riesgo real. Hoy, cuando subís un archivo a una casilla (foja quirúrgica, foja anestésica, autorización), AnesFact **guarda lo que le diste, tal cual, sin revisar nada**: no chequea que el contenido del PDF/foto corresponda a ese tipo de documento, ni que sea del paciente de esa intervención. Si por error subís el archivo equivocado (o el de otro paciente) en la casilla correcta, la app no lo detecta — queda guardado como si estuviera bien.

**Por qué no conviene "solucionarlo" tratando de leer el contenido del archivo:** intentar que el sistema adivine automáticamente si una foto es "la autorización correcta de este paciente" (vía OCR o similar) es poco confiable y puede dar falsa seguridad — peor que no validar nada, porque el anestesista bajaría la guardia pensando que ya está chequeado.

**Lo que sí es viable — confirmación humana en el momento de subir:**
- Antes de guardar el adjunto, mostrar una vista previa clara: el archivo elegido, a qué casilla va (foja Qx / foja anestésica / autorización) y para qué paciente/intervención — un solo cartel de "confirmás que este archivo es X, del paciente Y" antes de aceptar.
- Si se reemplaza un adjunto que ya existía en esa casilla, avisar explícitamente ("ya había un archivo cargado ahí, ¿reemplazar?") — para casos como el de hoy, donde se sube el mismo archivo varias veces por error o para practicar.
- No bloquea el guardado, solo agrega un paso de confirmación visual — bajo riesgo, no toca lógica clínica ni `fill.js`.

**Estado:** confirmado por Diego (2026-09-23) — arrancar ahora, en paralelo con el ticket 3.

**Auditoría 2026-09-23 (2ª vuelta) — NO IMPLEMENTADO, devuelto a Cursor.** Cursor reportó esto como hecho pero al revisar el código real no estaba. Devuelto con el punto de enganche exacto.

**Auditoría 2026-09-23 (3ª vuelta) — CONFIRMADO EN `origin/main`, TICKET CERRADO.** Commit `9f518ab`, PWA 13.01. Verificado en el código real (no solo en el reporte de Cursor): `adjuntarDoc()` → `afConfirmAdjunto(doc,tipo)` (modal con vista previa img/PDF, casilla, paciente/DNI/fecha, aviso de reemplazo si ya había un archivo, botones Cancelar/Confirmar, cierra con Escape o clic afuera) → recién si el usuario confirma, `afCommitAdjunto()`. CSS `.af-adj-*` presente en `styles.css`. Versión de caché 13.01 consistente en `index.html`.

## 7. Escalabilidad real a 10 anestesistas, sin pagar

Con adjuntos movidos a Storage: ~200MB/año de texto puro entre 10 anestesistas activos al ritmo de Huerta → **~2.5 años** de runway en el límite gratis de 500MB de la base. Storage (fotos/PDFs): más ajustado, capaz ~1 año según cuánto se suba. Revisar 1 vez por mes el tamaño real en el panel de Supabase (Project Settings → Database → Usage) en vez de estimar a ciegas — o, una vez armado el Ticket 4, directamente en el panel admin de la app.

## Orden de ejecución (actualizado 2026-09-23)

1. ~~**GRANT patch** (Ticket 1)~~ — ✅ hecho, corrido en Supabase.
2. ~~**Storage** (Ticket 2)~~ — ✅ hecho, probado con foja de prueba.
3. ~~**Dashboard admin** (Ticket 4)~~ — ✅ hecho, migración corrida, barritas andando.
4. ~~**Cloudflare Pages** (Ticket 3)~~ — ✅ CERRADO. Login y PWA (mobile + PC) funcionando en `anestfact.diegomc77.workers.dev`.
5. ~~**Validar adjunto correcto/paciente correcto** (Ticket 6)~~ — ✅ CERRADO. Confirmado en `origin/main` (commit `9f518ab`, PWA 13.01) en la 3ª auditoría, después de que el primer reporte de Cursor no coincidiera con el código real.
6. **Limpieza de adjuntos confirmados** (Ticket 5) — ⏸️ POSPUESTO. Diego confirmó que en principio es copia redundante, pero pide esperar a que el circuito de EVWEB (y Traditum) esté validado al 100% en producción — hoy todavía hay fojas de prueba subidas sin completar. Prueba pendiente antes de retomar: cargar fojas reales a la cola EVWEB y confirmar que pasan solas a estado "listo" (ver detalle en Ticket 5). No arrancar hasta que Diego lo confirme explícitamente.

## 8. Ticket — prolijizar visualmente la cola de EVWEB (hoy es inconsistente con la de GECLISA)

**Origen:** Diego notó que la cola de EVWEB se ve fea. Auditado y confirmado — es una inconsistencia real de diseño dentro de la misma app.

**GECLISA (`js/39-geclisa-queue.js`, función que arma el HTML de la cola ~línea 795):** cada ítem numerado, nombre del paciente en negrita, fecha/hora/sector en línea secundaria, estado como etiqueta chica **de color** (rojo error, verde listo, azul en curso, vía `stColor`), acciones como íconos chicos (↑ ↓ ✕), usa clases CSS dedicadas `.afg-q-item`, `.afg-q-item-body`, `.afg-q-item-actions`, `.afg-q-name`.

**EVWEB (`js/40-evweb-queue.js`, función `afEvwebQueueListHtml`, ~línea 317):** todo en una sola línea gris de 11px sin color de estado, con etiquetas técnicas crudas ("obra", "san", "docs" en vez de nombres claros), sin numerar, botón "Quitar" como botón de texto grande en vez de ícono.

**Fix para Cursor:** reescribir `afEvwebQueueListHtml()` para que reutilice las mismas clases CSS y el mismo patrón de color-por-estado que ya usa GECLISA, en vez de inventar un estilo nuevo — mismo criterio visual en las dos colas de la misma app. No toca lógica de negocio, solo el HTML/CSS de renderizado. Riesgo: bajo.

**Auditoría 2026-09-23 — CONFIRMADO EN `origin/main`, TICKET CERRADO.** Commit `31d26ea`, PWA 13.02. Verificado en el código real (no solo en el reporte de Cursor):
- `afEvwebQueueListHtml()` en `js/40-evweb-queue.js` ahora arma cada ítem numerado (`idx+1`), con `.afg-q-item` / `.afg-q-item-body` / `.afg-q-name` / `.afg-q-item-actions` — mismas clases que usa GECLISA.
- Color por estado (`stColor`) igual al patrón de GECLISA: `paused_error` → `var(--red)`, `awaiting_confirm` → `var(--estado-cola)`, `running` → `var(--blue)`, `done` → `var(--green)`.
- Botón "Quitar" pasó de texto grande a ícono ✕ chico (solo visible si no está `done`/`running`).
- Metadatos (obra/sanatorio/docs) ahora en texto legible en vez de claves técnicas crudas.
- Clases y variables CSS (`.afg-q-item`, `.afg-q-item-body`, `.afg-q-name`, `.afg-q-item-actions`, `--red`, `--blue`, `--green`, `--estado-cola`) confirmadas presentes en `styles.css`.
- `js/40-evweb-queue.js` está registrado en `SCRIPTS` (`js/load-scripts.js`) y `views/evweb.html` tiene el host `data-evweb-queue-list` sin cambios necesarios.
- Versión de caché **13.02** consistente en los 6 archivos de sync: `index.html`, `js/load-scripts.js`, `js/load-views.js`, `sw.js`, `js/24-sw-register.js`, `valoracion.html`.
- No toca `fill.js`, IDs GECLISA ni lógica de negocio — solo renderizado. Riesgo confirmado bajo.

## Orden de ejecución — actualización final

7. ~~**Prolijizar cola EVWEB** (Ticket 8)~~ — ✅ CERRADO. Confirmado en `origin/main` (commit `31d26ea`, PWA 13.02).

## 9. Ticket — la cola EVWEB deja encolar una foja sin código EVWEB/ADAARC resuelto

**Origen:** Diego cargó una foja a la cola EVWEB y la dejó pasar con todo completo menos el código EVWEB de la práctica — debería haber avisado que faltaba eso.

**Auditado y confirmado.** En Facturación (`js/07-intervenciones.js`, `renderPracs()`/`renderPracsAlert()`) ya existe un cartel visual: `⚠ N de M prácticas sin código EVWEB confirmado. Buscalas a mano en ADAARC antes de enviar/encolar` — pero es solo informativo en esa pantalla, no bloquea nada.

La función que sí decide si se puede encolar, `afEvwebQueueValidate(i)` en `js/40-evweb-queue.js`, chequea paciente, fecha, hora, DNI, edad, N° afiliado, obra social mapeada y sanatorio mapeado — **pero nunca mira si las prácticas (`i.pracs`) tienen `codigoEvweb` resuelto**. Por eso una foja con una práctica sin código EVWEB se encola igual, sin ningún error.

**Fix para Cursor:**
- En `afEvwebQueueValidate(i)`, agregar el mismo criterio de bloqueo que ya usa para obra/sanatorio: si `i.pracs` tiene al menos una práctica sin `codigoEvweb` (ni resuelto automático ni elegido a mano — `evwebManual`), agregar un error tipo `'Práctica "'+desc+'" sin código EVWEB — resolvela en Facturación antes de encolar'` por cada práctica sin resolver. Reusar la misma lógica que ya cuenta `sinResolver` en `renderPracs()`.
- Fojas sin ninguna práctica cargada (`pracs` vacío) quedan exentas de este chequeo — no es lo mismo "sin prácticas" que "con prácticas sin código".
- En `afEvwebQueueListHtml()` (`js/40-evweb-queue.js`), si el ítem ya en cola tiene alguna práctica sin código (por ejemplo si se agregó antes de este fix, o si se reabrió y se agregó una práctica nueva sin resolver), mostrar el mismo tipo de aviso rojo que ya se usa para `it.message`, para que no quede escondido dentro de la cola.
- No toca `fill.js`, IDs GECLISA, ni la lógica de resolución de códigos EVWEB (`afeResolvePracEvweb`) — solo agrega el bloqueo que falta en la validación de encolado. Riesgo: bajo.

### 9b. Mismo problema, pero con los documentos adjuntos (foja Qx / foja anestésica / autorización)

**Origen:** Diego notó, en la misma prueba, que tampoco avisa si falta un adjunto.

**Auditado y confirmado — es el mismo patrón que 9a, más silencioso todavía.** Hoy en toda la cadena EVWEB no hay ningún chequeo real por tipo de documento:
- `afEvwebQueueValidate(i)` (`js/40-evweb-queue.js`) no mira `docs` en absoluto — no forma parte de los requisitos para encolar.
- En `enqueueWithDocs()` (mismo archivo) hay un único `toast()` — *"En cola evweb sin adjuntos (foja/auth)..."* — y **solo se dispara si los 3 documentos (anest/qx/auth) están vacíos a la vez**. Si falta uno solo (por ejemplo, se adjuntó la foja Qx pero no la autorización), no aparece nada, ni toast ni error. Además un toast es un mensaje que se borra solo a los pocos segundos — no queda visible si se vuelve a mirar la cola después.
- Confirmé también en `chrome-extension-geclisa-batch/content/evweb.js` (línea ~1022, comentario propio del código): *"Orden: anest → qx → auth. Faltantes se saltan (no error)"* — la extensión, al momento de llenar ADAARC, directamente salta el documento que no está, sin marcarlo como problema en ningún lado.

**Ojo antes de bloquear como en 9a:** a diferencia del código EVWEB (que siempre hace falta), no tengo evidencia en el código de que los 3 documentos sean obligatorios en todos los casos — puede depender de la obra social o el tipo de intervención (no hay ningún campo que diga "este doc es requerido para esta foja"). Por eso el fix acá no es bloquear el encolado a ciegas, sino **hacer visible y persistente lo que hoy es invisible**, y que Diego decida caso por caso si falta algo real.

**Fix para Cursor:**
- En `afEvwebQueueListHtml()`, agregar por ítem una línea de aviso (mismo estilo rojo que ya usa `it.message`) listando qué documentos de los 3 (`anest`/`qx`/`auth`) NO tienen dato cargado — ej. *"Sin: foja quirúrgica, autorización"* — visible siempre que falte al menos uno, no solo cuando faltan los tres.
- Sacar (o dejar solo como fallback) el `toast` actual de "sin adjuntos", ya que un aviso que se borra solo no sirve para esto — la cola necesita el estado visible de forma persistente, igual que ya se decidió para el ticket 9a.
- No agregar bloqueo duro (a diferencia de 9a) salvo que Diego confirme que sí hay documentos siempre obligatorios — eso lo tiene que decir él, no se asume desde el código.
- No toca `fill.js`, IDs GECLISA, ni la lógica de la extensión (`evweb.js`) — solo hace visible en AnesFact lo que la extensión ya sabe que se está saltando. Riesgo: bajo.

**Auditoría 2026-09-23 — commit `205faea`, PWA reportada 13.03.** Lógica de 9a y 9b confirmada correcta en el código real:
- `afEvwebQueueValidate(i)` ahora recorre `i.pracs` y bloquea con `'Práctica "X" sin código EVWEB — resolvela en Facturación antes de encolar'` si falta `codigoEvweb`; fojas sin prácticas quedan exentas, tal como se pidió.
- `afEvwebQueueListHtml()` muestra `Sin código EVWEB: …` (9a) y `Sin: foja quirúrgica, autorización, …` (9b) por ítem, en rojo, de forma persistente.
- El toast de "sin adjuntos" fue removido; queda comentario explícito de que el aviso ahora es persistente en la lista, no un toast.

**Bug encontrado en 1ª vuelta de auditoría:** al leer `js/load-scripts.js` y `sw.js` desde la PC, `CACHE_V`/`CACHE_NAME` aparecían en 13.02 mientras el resto ya estaba en 13.03. Devuelto a Cursor.

**Respuesta de Cursor:** en `origin/main` (`205faea`) ya estaban en 13.03 — el 13.02 leído era el working tree local sin sincronizar (restore de WIP después del push), no lo que quedó commiteado.

**Re-verificación 2026-09-23 — CONFIRMADO, TICKET 9 (9a + 9b) CERRADO.** Se volvió a pedir el archivo fresco desde la PC (no desde caché de una lectura anterior) y ahora `js/load-scripts.js` tiene `CACHE_V = '13.03'` y `sw.js` tiene `CACHE_NAME = 'anesfact-v13.03'` — versión sincronizada en los 6 archivos de control. Lógica de 9a (bloqueo por práctica sin código EVWEB) y 9b (aviso persistente de documentos faltantes, sin bloquear) verificada correcta en el código real en la vuelta anterior. Ticket cerrado.

## 10. Regresión de producción — cola EVWEB bloqueada por catálogo faltante (RESUELTA)

**Origen:** Diego preguntó por qué no habíamos subido nada de "la dinámica de evweb", el nomenclador EVWEB, ni las mutuales nuevas con estrellas de favoritos. Al auditar producción (no solo la PC) se encontró algo peor que "no subido": **una regresión activa**.

**Auditado en `anestfact.diegomc77.workers.dev` (producción real, con fetch en vivo, cache-busted):**
- El bloqueo del Ticket 9a **sí estaba en producción** (correcto, funcionando).
- Pero `data/evweb-practicas-match.js` (catálogo EVWEB, ~2,5 MB, códigos de las 15 mutuales) daba **404** — nunca se había pusheado, quedó `untracked` en el working tree de Cursor y no entró en los commits de Ticket 8/9.
- Consecuencia real: sin catálogo, ninguna práctica podía resolver `codigoEvweb` (ni automático ni las opciones para elegir a mano), y con el bloqueo del 9a ya en producción, **toda foja con al menos una práctica cargada quedaba imposibilitada de encolar a EVWEB**. Regresión real causada por el propio Ticket 9a al exponer un hueco que antes pasaba desapercibido.
- De paso se confirmó lo que Diego sospechaba: `data/obras-sociales.js` en producción era la lista genérica vieja (sin las 15 mutuales, sin semilla de favoritos) — no rompía nada (hay fallback seguro en el código), pero tampoco estaba.

**Hotfix de Cursor — commit `be5115a`, PWA 13.04.** Subió `data/evweb-practicas-match.js` + `data/obras-sociales.js` (15 mutuales) + las entradas correspondientes en `load-scripts.js`/`sw.js`.

**Re-verificación 2026-09-23 — CONFIRMADO EN VIVO, TICKET CERRADO.** Con fetch cache-busted (`?v=13.04`) a producción:
- `CACHE_V` = `13.04`.
- `data/evweb-practicas-match.js` → 200, `window.AF_EVWEB_PRACTICAS_CATALOG.byObraId` presente con datos reales.
- `data/obras-sociales.js` → 200, `AF_OBRAS_HUERTA` con las 15 mutuales, `OBRAS_SOCIALES` con 373 entradas (catálogo completo para autocompletado + estrellas de favoritos).

**Pendiente de Diego (prueba real, no auditable desde acá):** hacer hard-refresh a 13.04 y encolar de nuevo una foja con prácticas para confirmar que ahora sí resuelve el código y deja encolar.

**Lección para el proceso:** de acá en más, antes de cerrar un ticket que toque la cola EVWEB o cualquier archivo de datos pesado (`data/*.js`), verificar explícitamente contra producción (fetch en vivo, no solo el reporte de Cursor ni el estado de la PC) que el archivo relevante no haya quedado `untracked` fuera del commit — es la segunda vez en esta sesión (después del bug del `manifest.json` en Ticket 3) que un archivo queda correcto en la lógica pero ausente en el deploy real.

## Nota abierta — Ticket 2 (Storage) posiblemente no está en producción

Durante la auditoría del punto anterior se notó que `js/41c-docs-storage.js` (el archivo del Ticket 2, migración de adjuntos a Supabase Storage, marcado ✅ cerrado en una sesión anterior) **tampoco aparece en el `SCRIPTS` de producción** (`anestfact.diegomc77.workers.dev/js/load-scripts.js?v=13.04`). No es urgente — los adjuntos siguen guardándose como antes (base64 en `anesfact_datos`), no se rompe nada — pero indica que ese cierre pudo haberse dado solo con el reporte de Cursor, sin verificar producción como se hizo recién acá. **Pendiente:** re-auditar el Ticket 2 contra producción real antes de asumir que sigue cerrado.

Cada ticket lo implementa Cursor; Claude audita el resultado contra este documento antes de darlo por cerrado.
