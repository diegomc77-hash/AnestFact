# Roadmap de escalamiento — AnesFact

**Diseño, no implementar desde este archivo.** Auditado contra código
(2026-08-31), no contra supuestos. Fuentes: este repo +
`docs/CIERRE_ARQUITECTURA_FACTURACION.md` + `docs/DISENO_PC_HOME.md`.

Dos rieles que **no se mezclan en la misma fase**:

| Riel | Qué es | Qué no es |
|---|---|---|
| **U — Interfaz** | Home por institución, PC/móvil (`DISENO_PC_HOME.md`) | Traditum, foja qx, SISalud upload |
| **P — Tuberías** | Completar destinos (adjuntos, foja qx, QR cirujano, Traditum) | Rediseño de dock/Home/520px |

Intactos en ambos rieles: `fill.js`, IDs GECLISA, forma de `S.cur`,
`abrirInter` / `cargarFojaUI`. Navegación nueva solo por `go(vista)`.

---

## 1. Auditoría — qué hay en código vs qué es solo doc

Leyenda: **sí** = construido y usable · **parcial** = hay piezas, no el
flujo cerrado · **no** = 0 código o solo diseño.

### Mayo

| Pieza | Estado | Evidencia |
|---|---|---|
| QR preop | **sí** | `af-qr-create` / `submit` / `peek`; selector de lugar; prefoja; catálogo Mayo |
| Foja anestésica | **sí** | Foja + UI Mayo (sector/cama/quirófano GECLISA) |
| Inyección GECLISA | **sí** | Cola `js/39-geclisa-queue.js` + extensión **0.5.10**; fill; **nunca** click en Guardar |
| Camino a evweb «directo» | **parcial / no automatizado** | Fojas: GET PDF en GECLISA (`fetch` + cookies; **P1b** recortado 2026-09-01). Auth: archivo aparte. PAMI = solo el combinado. Sin botón extra; no es upload a evweb |
| Traditum (APROSS) | **no** | 0 matches en `js/` / `views/`. Diseño en el cierre. Reconocimiento de pantalla **2026-09-10** en **P4** (IDs Nueva Solicitud; sin código) |
| QR recepción PDFs (secretaria) | **no** | Distinto del Escanear IA (Gemini) |
| Foja qx nativa / QR cirujano | **no (a propósito)** | En Mayo la qx vive en GECLISA |

### Aeronáutico

| Pieza | Estado | Evidencia |
|---|---|---|
| Foja anestésica nativa | **sí** | Misma foja + `imprimirFoja()`; `destino_final: evweb` |
| Foja quirúrgica (editor / QR) | **no** | No hay vista ni modelo de foja qx. `S.cur.docs.qx` es un **adjunto** en JS (`adjuntarDoc`), no un formulario |
| QR al cirujano | **no** | Solo existe QR de valoración paciente |
| Escaneo de autorizaciones | **parcial** | (1) Herramientas → Escanear: Gemini extrae campos y manda a Facturación; **no** es el QR de recepción ni parseo Traditum. (2) P1 **12.55**: 3 ranuras en Facturación; no exige las tres llenas |
| evweb | **parcial** | Dock evweb = lista Aero pendiente de **marca local**. Toggle «Enviar a ADAARC/evweb», copiar campos, abrir evweb a mano. No hay automatización |

### Públicos (Córdoba / Misericordia / San Roque)

| Pieza | Estado | Evidencia |
|---|---|---|
| QR preop | **sí** | Mismo tubo QR; `cfg_id` por lugar; especialidad genérica / cirujano a mano si no hay nómina |
| Foja anestésica | **sí** | Select lugar; quirófanos Córdoba 9 / Misericordia 4; San Roque texto; print A4 (header compose o PNG Misericordia); pie **sin** ADAARC si `afFojaEsSisalud` |
| Foja quirúrgica* | **no** | Requisito en matriz Home / cierre; 0 código |
| QR al cirujano* | **no** | Idem |
| SISalud | **parcial** | Print A4 **sí**. Subida a SISalud: **no investigar todavía** (ESTADO). No hay fill ni API |

### Transversal (no es de una institución)

| Pieza | Estado |
|---|---|
| Consentimiento informado (firma digital) | **bloqueado legal** — camino papel+foto = mismo hueco que adjuntos |
| Home por institución / bandejas | **no** — PC hoy = `max-width:520px` centrado (`DISENO_PC_HOME.md`) |
| Allende | Fuera de alcance (patrón `sistema_propio`) |

---

## 1b. Tuberías Mayo × mutual (detalle operativo)

Fuente de la matriz: `docs/CIERRE_ARQUITECTURA_FACTURACION.md` (secciones
«Matriz», «Mayo × mutual», «APROSS / Traditum»). Acá está **copiado el
cómo se arma cada paquete**, para no reconstruirlo de memoria. El cierre
sigue siendo la norma si hay conflicto.

Inyección AnesFact → GECLISA (foja anestésica) **ya está**. El sentido
**inverso** de las fojas es el GET de `ReporteListadoInternado`
(**P1b**, `pMeId` = N° de Atención de esa internación). La auth no
sale de ese GET. Eso no es P2 (P2 es foja qx **nativa Aero**, sin
GECLISA).

### PAMI (el más simple)

- **Qué va a evweb:** foja de cirugía + foja de anestesia. **Sin**
  autorización aparte.
- **Dónde viven:** ambas en GECLISA (Mayo). **Cómo se bajan:** un solo
  archivo (`Reporte.pdf`) con las dos juntas — ver § 1c.
- **Hoy:** la doctora las busca y baja a mano, sube a evweb a mano.
- **Fases:** recolección = **P1b**. P1 (adjuntos AnesFact) no sustituye
  esto. P4 Traditum **no aplica**.

### ART / obras genéricas (3 papeles)

- **Qué va a evweb:** foja anestesia + foja cirugía + autorización de
  mutual.
- **Dónde:** fojas en GECLISA (**un PDF combinado**, no dos archivos);
  auth en GECLISA (documentos) y/o llega por WhatsApp (QR recepción /
  adjunto P1) — **archivo aparte**.
- **Falta automatizar:** P1b = PDF combinado por GET (abajo). La auth
  **no** sale de ese GET (APROSS/ART); sigue archivo aparte (P1 /
  WhatsApp / otro lado de GECLISA). Idea aparte: buzón AnesFact
  (**P6**, no es P1b).
- **Fases:** P1 = colgar auth (o el combinado) en AnesFact si no está
  en GECLISA; **P1b** = búsqueda/recolección en GECLISA; P4 no aplica.

### APROSS (Traditum, no «3 papeles a evweb» primero)

Flujo cerrado en `CIERRE_ARQUITECTURA_FACTURACION.md`:

1. Buscar la **autorización** en GECLISA (no se usan las fojas para
   Traditum).
2. Entrar a **Traditum** (usuario **solo** de la doctora).
3. Buscar **esa misma** autorización ahí.
4. Resultado: **exactamente 3 estados** (no hay otro conjunto en el
   cierre ni en PR7):

   | Estado | Qué significa |
   |---|---|
   | `validado` | Pasa a listo_evweb (después se arma el paquete a ADAARC) |
   | `sujeto_a_auditoria` | Espera pasiva; no bloquea el resto; no es alerta agresiva |
   | `rechazado` | Alerta a la doctora → baja complejidad → reintenta |

   `enviado` en el cierre es «ya se mandó a Traditum», no un resultado
   de la búsqueda. Los 3 del usuario = validado / auditoría / rechazado.

5. Recién con `validado` (o el criterio de listo_evweb del cierre) se
   sube a evweb. Fojas clínicas vs `cirugia_autorizada`: no conciliar.

- **Fase:** **P4**. P1b no automatiza Traditum.

---

## 1c. Empaquetado de adjuntos por institución (configurar después)

Hallazgo de la prueba P1 en vivo (2026-08-31): **GECLISA no entrega
dos archivos**. Baja **un solo PDF** (`Reporte.pdf`) con foja de
cirugía + foja anestésica juntas. El blob vive en `docs.anest`. Si
pdf.js ve los dos protocolos, Facturación marca **también** Foja
Quirúrgica con un alias (`docs.qx.aliasOf = 'anest'`), sin duplicar
el archivo. Ranura qx vacía = combinado todavía incompleto, o qx
colgada a mano.

P1 **sigue igual**: 3 ranuras genéricas; cada una acepta cualquier
archivo; **no** se exige que estén las tres completas. No codear
configuración por institución todavía. Cuando se diseñe, el patrón
es el de cirujanos / quirófanos (`CIRUJANOS_POR_LUGAR` /
`AF_FOJA_INST`): una tabla por lugar, no ifs sueltos en la UI.

El cierre (`CIERRE_ARQUITECTURA_FACTURACION.md`) sigue hablando de
«2 fojas» como **qué pide evweb**. Eso no cambia. Cambia **cómo
llegan** esos papeles a AnesFact.

| Institución | Cómo llegan las fojas | Autorización | Notas |
|---|---|---|---|
| **Sanatorio Mayo** | GECLISA: **un archivo** = qx + anestésica juntas | **Archivo aparte** (GECLISA y/o WhatsApp / P1) | P1b no debe asumir 2 descargas de protocolo. PAMI = ese PDF combinado, sin auth. ART/obras = combinado + auth |
| **Hospital Aeronáutico** | Fojas **desde AnesFact** (no hay GECLISA) | Foto sacada en AnesFact | Mientras no exista foja qx nativa (P2): la parte del cirujano llega como **foto aparte** → 2 fotos (auth + qx papel) más la foja anestésica que ya imprime la app |
| **Otras** (públicos, Allende, etc.) | **Pendiente** de relevar impresión / autorización de cada sistema | Idem | Caso por caso al sumar el lugar. No inventar el paquete |

No mezclar con P1 (ranuras genéricas). Alimenta P1b (Mayo), P2 (Aero
qx) y una config futura tipo catálogo, no un rediseño de Facturación
ahora.

---

## 2. Fases — riel P (tuberías)

Orden: más valor por caso real de Huerta, menos riesgo de romper GECLISA/foja.
**No** meter fases U aquí.

### P1 — Adjuntos en Facturación · **hecho en 12.55**

**Cierre:** `docs/CIERRE_ARQUITECTURA_FACTURACION.md` — matriz Mayo ×
mutual (PAMI sin auth; ART/obras = fojas + autorización; APROSS no usa
fojas para Traditum). P1 no implementa esa matriz: solo deja colgar
archivos en AnesFact.

UI en `#docs-card-body` (3 ranuras + badges). Pipeline: ≤500 KB tal
cual; imagen/PDF pesado → JPEG ~450 KB (`js/41-adjuntos-compress.js`).
PDF via pdf.js lazy `vendor/pdfjs/` (no `STATIC_CORE`). Fallo → original.

Las 3 ranuras son **genéricas y opcionales**: cualquier archivo en
cualquiera; no se fuerza completar las tres. En Mayo el PDF combinado
de GECLISA va en `docs.anest`; si está completo, qx muestra el mismo
archivo vía alias (§ 1c). No rediseñar slots por institución.

**Valor:** Aero (foto auth / qx papel); Mayo ART/obras si la auth llegó
por mail/WhatsApp y **no** se va a buscar en GECLISA todavía.

**No es:** recolección en GECLISA (eso es **P1b**), buzón de mail para
auth (**P6**), Traditum (**P4**), editor de foja qx (**P2**), config por
institución (§ 1c).

**Riesgo:** `S.cur.docs` sigue data-URL. No tocar `fill.js`.

### P1b — Recolección Mayo en GECLISA → PDF combinado · **recortado**

**Cierre:** misma matriz + § 1c. Chat dueño GECLISA. **Nunca** click en
Guardar. No tocar `fill.js`. **No** es el paso 13 de la cola 1–12.
**No** es «enviar a evweb» (evweb sigue sin automatizar).

**PAMI:** solo el PDF combinado (sin auth). **ART/obras:** combinado +
auth **aparte**. **APROSS:** P1b no sustituye Traditum (**P4**).

**No es P2:** P2 es foja qx **nativa** Aero. Mayo no edita qx en
AnesFact.

#### Qué quedó confirmado (2026-09-01)

- GET `fetch(url, { credentials: 'include' })` **desde la página de
  GECLISA** → 200 + `application/pdf` + blob. Sin modal, sin visor
  Chrome.
- `pMeId` = N° de Atención **por internación**, no por paciente. Prueba
  en vivo: 4 internaciones del mismo paciente → 4 números distintos,
  ninguno repetido. Otra internación **no** se mezcla si el N° es el
  de esta foja. Ingreso/egreso **no** hacen falta para eso.
- El riesgo que queda: **dos cirugías en la misma internación** (mismo
  `pMeId`). Se acota con fecha+hora de **esta** foja, no con «ahora»
  ni con toda la internación.
- Internación con **ambos** protocolos ya cargados (2026-09-01): mismo
  GET → 200, `application/pdf`, **~445 KB** (bajo el tope 1.5 MB). El
  endpoint no es solo el caso de prueba chico. Sin nombres ni N° acá.

```
http://sanatoriomayo.myvnc.com:84/Reporte/ReporteListadoInternado
  ?pMeId={nroAtencion}
  &pEventos=ProtocoloQuirurgico|ProtocoloAnestesico|
  &pConFirma=true
  &pFechaDesde={dd/MM/yyyy}
  &pHoraDesde={HH:mm}
  &pFechaHasta={dd/MM/yyyy}
  &pHoraHasta={HH:mm}
  &pAsIds=
```

`pConFirma=true`. `pEventos` lleva **pipe** al final. El fetch **no**
va en la PWA. No navegar el Panel para bajar el PDF.

#### Diseño recortado — sin botón extra

La doctora sigue el 1–12 que ya existe (PC + extensión + GRABAR
humano). El PDF se baja **solo**, en esa misma sesión GECLISA. No hay
botón «Bajar fojas». No se vuelve a leer el encabezado de Evolución
para el GET. No se pide ingreso/egreso. Fojas que nunca pasaron por
8b quedan fuera de este lote (no hay ruta DNI).

**Ventana de fechas (esta foja, no «ahora»):**

- `desde` = `fecha` + `hora` de la foja, menos 15 min (reloj).
- `hasta` = esa misma marca + **8 horas** (constante
  `AFG_PDF_VENTANA_HORAS`; se afina con una prueba, no a ojo en
  producción).
- La cola Mayo ya exige hora para encolar. Si faltara, no hay GET.
- Reintentos: tries 1–3 misma ventana de 8 h. Try 4 = **+36 h**. Tries
  5–6 = **+7 días**. `desde` no se mueve. Nunca `hasta = ahora`.
  Ventana ancha: candado cirujano (`cirujanos:` fuzzy) primero; fecha
  = la pegada a `hora inicio de cirugia` (= `i.fecha`). Si no verifica,
  no pisa el PDF de 8 h.

**Qx todavía no cargado:** el GET inmediato post-GRABAR suele traer
solo anestesia. Primera pasada ~5 s después de GRABAR confirmado (no
bloquea el «siguiente» de la cola: el fetch usa cookies + `pMeId`, no
hace falta quedarse en esa pantalla). Si el PDF no tiene los dos
protocolos, se guarda igual (mejor que nada) con flag
`mayo_pdf_qx_pendiente` y se reintenta en silencio mientras haya tab
GECLISA abierta: cada ~10 min, tope 6 intentos. Cuando entre el qx,
se reemplaza el adjunto. Si se llega al tope, queda lo que haya. Un
solo toast cuando el combinado está completo; los reintentos no
molestan.

Detector de «completo»: texto del PDF (pdf.js ya está en la PWA) —
tiene que aparecer protocolo quirúrgico **y** anestésico. Títulos
exactos: confirmarlos en un PDF de foja **prueba**, no de paciente
real. Si no se puede parsear, no se declara completo.

Ranura: el combinado va a `docs.anest` (`fuente: 'geclisa_p1b'`). Si
está completo, `docs.qx` es alias al mismo PDF (sin data). Si ella ya
colgó un qx a mano, **no** pisar. Incompleto → qx sin alias.

Auth **no** sale de este GET.

Camino UI (modal + `#chkIncluirFirma` + `#btnImprimirReportesPopup`)
= **histórico**. Visor Chrome: **no** automatizar.

#### Lotes de código (cuando haya OK; no desde este archivo)

**Lote A — persistir N°** · **hecho 12.56 / ext 0.5.11**. Al 8b con
match de nombre: `mayo_nro_atencion` en la intervención (familia
`mayo_sector`) + ítem de cola. `afGeclisaQueueRefreshFromIntervs` no
lo borra. No persistir si el nombre no coincidió. Nunca overwrite con
vacío. Invisible, 0 clics.

**Lote B+C — GET + adjunto + reintento qx** · plan concreto 2026-09-01
(código cuando Diego OK). C va pegado a B: el reintento es el mismo
GET.

**Cómo se dispara (sin botón):**

1. Humana toca GRABAR. `grabar-watch.js` ya manda `AFG_USER_SAVED_FOJA`.
2. `handleUserSavedFoja` en `background.js`: si `saveFailed` → no GET.
   Si `confirmed` (o timeout_assume_ok) → **no bloquea** el auto-next.
   A los ~5 s dispara el GET en paralelo (la cola puede ir al siguiente:
   el fetch usa cookies + `pMeId`, no el DOM de esa foja).
3. Datos: `currentIntervId` del runner + ítem de cola (`mayo_nro_atencion`,
   `fecha`, `hora`). Sin N° o sin hora → skip, log, no GET.
4. URL: `desde` = `fecha+hora − 15 min`. `hasta` = +8 h (tries 1–3),
   +36 h (try 4), +7 d (tries 5–6). Nunca «ahora».
5. `geclisa.js` (tab GECLISA): `fetch(url, { credentials: 'include' })`
   → blob. El SW no hace este fetch.
6. Bridge `AFG_COMMIT_GECLISA_PDF` → PWA. `intervId` en el mensaje
   (S.cur puede ser otra foja).

**PWA:**

- `afCommitGeclisaPdf(intervId, file, { toast })` en `js/17-sync-export.js`.
  Busca la intervención **por id**, no exige que esté abierta.
- Si `docs.anest` existe y `fuente !== 'geclisa_p1b'` → no pisar.
- **No** pasar este PDF por `afPrepareAdjunto` / `afRasterizePdfPage1`
  (eso convierte página 1 a JPEG y rompe el combinado para evweb).
  Guardar `application/pdf` tal cual. Tope **1.5 MB** crudo (~2 MB
  data-URL): si pasa, no se guarda (el medido era 347 KB).
- `fuente: 'geclisa_p1b'`. Ranura `docs.anest`. Completo → alias en
  `docs.qx` (mismo archivo). Manual en qx no se pisa.
- Completo: pdf.js (ya en PWA) extrae texto → hay quirúrgico **y**
  anestésico. Títulos: confirmar en foja **prueba**. Si no se parsea,
  no se declara completo.
- Incompleto: se guarda igual + `mayo_pdf_qx_pendiente` (interv + cola).
  Un toast solo cuando pasa a completo. Reintentos sin toast.

**Reintento (ex-Lote C):** `chrome.alarms` cada ~10 min, tope 6, solo
si hay tab GECLISA. Escalera 8 h → 36 h → 7 d. En ventana ancha no
se pisa si falla cirujano/fecha. Al tope: queda lo que haya. Permiso
`alarms` en el manifest.

**Prueba de filtro de fechas (viva, foja prueba — no bloquea el código
del GET, sí decide si el reintento sirve al día siguiente):**

1. GET ~5 s post-GRABAR → debe traer protocolo anestésico.
2. Cirujano carga qx **más tarde** (horas; idealmente al día siguiente
   si se puede). Reintento **misma URL**.
3. Si el qx entra: GECLISA filtra por **fecha del evento** (o el
   grabado cae dentro de las 8 h) → el reintento sirve.
4. Si no entra hasta ensanchar `hasta` a «ahora»: filtra por **fecha
   de carga**. No ensanchamos. Queda como límite conocido: qx cargado
   fuera de la ventana no entra.

**Archivos (este lote):**

| Archivo | Función |
|---|---|
| `background.js` | trigger post-GRABAR; armar URL; alarmas |
| `content/geclisa.js` | `AFG_FETCH_INTERNADO_PDF` → fetch blob |
| `content/anesfact-bridge.js` | `AFG_COMMIT_GECLISA_PDF` |
| `manifest.json` | `alarms`; bump 0.5.12 |
| `js/20-geclisa-send.js` | recibe blob + intervId |
| `js/17-sync-export.js` | commit silencioso por id; no pisa manual |
| `js/41-adjuntos-compress.js` | reusar pdf.js para **texto**, no raster |
| `js/39-geclisa-queue.js` | `mayo_pdf_qx_pendiente` no se wipea |
| `CACHE_V` → 12.57 | PWA recibe el blob |

No: `fill.js`, Guardar auto, modal, `js/01-state.js`, script nuevo.

**Lote A** sigue hecho. Este lote no es upload a evweb.


#### Archivos que se tocan (OK explícito antes de codear)

No es contrato de `S` en `js/01-state.js` (el objeto S no cambia). Sí
es un campo nuevo en la **intervención**, igual que `mayo_sector`:

| Archivo | Por qué |
|---|---|
| `js/07-intervenciones.js` | default `mayo_nro_atencion` en `nuevaInter` |
| `js/13-scan-ia.js` | mismo default en el `base` de scan |
| `js/39-geclisa-queue.js` | snapshot + refresh conservan el N°; no wipe |
| `js/20-geclisa-send.js` | bridge: guardar N° + recibir blob (mismo canal que `MARK_ENVIADO_GECLISA`) |
| `js/17-sync-export.js` | commit silencioso del adjunto (sin toast en cada reintento) |
| `chrome-extension-geclisa-batch/**` | 8b → persistir; GET; no `fill.js` |
| `sw.js` / `load-scripts.js` | **solo** si aparece un `.js` nuevo; preferir no crear uno |

QR, Home, `fill.js`, IDs de campos GECLISA, `abrirInter` /
`cargarFojaUI`: no.

**Fuera de este P1b:** un botón «enviar a evweb»; buscar `pMeId` por
DNI; scrape de ingreso/egreso; fojas que nunca pasaron por 8b.

**Riesgo:** medio (extensión + cookies + blob). Chat dueño GECLISA.
Prueba solo con paciente «prueba».

### P2 — Foja quirúrgica nativa + QR cirujano · **Aero primero** · **grande**

**Cierre:** `docs/CIERRE_ARQUITECTURA_FACTURACION.md` — Aeronáutico:
foja anestesia nativa + foja cirugía (QR cirujano, pendiente) + foto
auth → evweb. Sin GECLISA, sin Traditum, solo IOSFA.

No incluye buscar nada en GECLISA (Mayo = **P1b**). No incluye Traditum
(**P4**). Mayo: la qx sigue bajándose de GECLISA; **no** hay editor
AnesFact de foja qx para Mayo salvo decisión explícita aparte.

Formulario + print A4 + QR distinto al de preop. Entidad propia (no un
campo dentro de la foja de anestesia).

**P2 — Regla de organización del catálogo (todas las especialidades;
obligatoria desde 2026-09-14):**

Cuando una patología o procedimiento pertenece claramente a una
especialidad ya existente y auditada, **todo contenido nuevo**
relacionado entra en esa especialidad específica — **no** se duplica ni
se mezcla con otro módulo general o «relacionado por practicidad».

1. **Antes** de bajar un bosquejo nuevo a esqueleto: revisar solapamiento
   real con módulos ya existentes y auditados (OK de semilla o en
   auditoría).
2. Si hay solape: **decidir y documentar explícitamente** (en el módulo
   nuevo y/o en `HALLAZGOS_ESQUELETO.md`) si el contenido nuevo
   **reemplaza**, **amplía** o **convive** con lo ya existente. Nunca
   dejarlo ambiguo ni duplicado sin nota.
3. **Nunca** romper ni modificar contenido ya cerrado con OK de semilla
   de otro módulo, salvo aprobación explícita de Diego (mismo criterio
   que las correcciones cruzadas Traumatología ↔ Vascular ↔
   Retroperitoneo).
4. Lo que se sume de aquí en adelante vive en la **especialidad
   correspondiente real**, no en un lugar genérico.

**Ejemplo ya resuelto:** Traumatología (M11) §2 tiene cobertura básica
de mano/muñeca; el detalle específico vive en Cirugía de Mano (M16).
No se fusionaron; la nota 11 de `docs/cirugia-mano/01-mano.md` y
`HALLAZGOS_ESQUELETO.md` lo documentan. Misma lógica para cualquier
módulo futuro.

**Ejemplo ya resuelto (equipo, 2026-09-14):** CEBC / EET — resección +
corredor en Neurocirugía M14 §1; cierre/reconstrucción nasal en CyC
Proforma 7. Xref cruzado (patrón Sleeve). Equipo neuro+ORL = **foja
cada uno** (Huerta); sin foja compartida. Sin módulo híbrido.

**Estado diseño (2026-09-14):** marco + cáscara A4 + requisitos §1–8.
**Proformas CyC:** **13 / 13 OK de semilla** (`docs/proformas-cyc/`).
**Cirugía General:** **6 / 6 OK de semilla del set**
(`docs/cirugia-general/`). **Cirugía Torácica:** **1 / 1 OK de semilla**
(`docs/cirugia-toracica/`; validación criterio AnesFact, no torácico /
Huerta — ver cabecera). **Cirugía Urológica:** **1 / 1 OK de semilla**
(`docs/cirugia-urologica/`; misma salvedad de validación). **Cirugía
Ginecológica:** **1 / 1 OK de semilla** (`docs/cirugia-ginecologica/`;
misma salvedad). **Traumatología:** **1 / 1 OK de semilla**
(`docs/cirugia-traumatologia/`; misma salvedad). **Cirugía Vascular:**
**1 / 1 OK de semilla** (`docs/cirugia-vascular/`; misma salvedad).
**Cirugía Plástica:** **1 / 1 OK de semilla** (`docs/cirugia-plastica/`;
misma salvedad). **Neurocirugía:** **1 / 1 OK de semilla**
(`docs/cirugia-neurocirugia/`; misma salvedad; gatillos consideraciones
anestesia documentados). **Cirugía Cardiovascular:** **1 / 1 OK de
semilla** (`docs/cirugia-cardiovascular/`; misma salvedad; gatillos
consideraciones anestesia — mayor densidad del catálogo). **Cirugía de
Mano:** **1 / 1 OK de semilla** (`docs/cirugia-mano/`; misma salvedad).
**ORL general (M17):** **1 / 1 OK de semilla** (`docs/cirugia-orl/`;
misma salvedad; sin solape real con CyC). **Oftalmología (M18):**
**1 / 1 OK de semilla** (`docs/cirugia-oftalmologia/`; misma salvedad).
**Hemodinamia (M19):** **OK de semilla §1–4 + §6**
(`docs/cirugia-hemodinamia/`; misma salvedad; **§5 diferida** — solape
M12 Vascular, xref preferido, M12 intacto).
**Gastroenterología / endoscopia (M20):** **1 / 1 OK de semilla**
(`docs/cirugia-gastroenterologia/`; misma salvedad; sin solape CG).
**Motor de código P2: pendiente** (gate §8 antes del primer commit).

**P2 — QR cirujano / `fojaQx` (diseño 2026-09-16, 0 código):**
`docs/P2_QR_CIRUJANO.md`. Canal paralelo (no tocar `af-qr-*` preop).
Herramienta de suite (hermana de `foja`, no sub-función anestésica).
**OK Huerta:** especialidad visible; nombre `fojaQx`; un solo uso;
generación solo foja abierta; firma en celular; institución heredada.
**Alcance:** Aero + públicos activos desde Paso 1 (públicos = solo
documentación); Mayo off por ahora; gating = **flag por institución**
(no `if` hardcodeado). Sync/export incluye `fojaQx` **solo** si el flag
está on. Gate §8 Paso 1: revalidar en chat antes del primer diff.

**P2 — Coordinación anestesia ↔ qx (fase aparte, transversal):** diseño
confirmado 2026-09-14. `S.cur.foja.consideraciones` aditivo; GECLISA lo
ignora; sugerencia desde qx con confirmación manual; print **sin fila
nueva** (frase en Métodos). No bloquea Cirugía General ni CyC. **0 código.**
Ver `docs/cirugia-general/README.md`. Versionado de proformas personales:
no urgente.

**P2 / consideraciones — gatillos Neurocirugía (M14; no son slots de la
proforma qx; corrección posterior de drogas y cuidados específicos):**

| Gatillo qx | Hacia consideraciones anestesia |
|---|---|
| Craneotomía despierta (awake) | Coordinación de sedación consciente y despertar intraoperatorio para mapeo |
| DBS con testing intraoperatorio | Nivel de sedación que permita evaluación neurológica en tiempo real |
| Posición sentada (fosa posterior) | Riesgo de embolismo aéreo venoso (VAE); monitoreo (Doppler precordial, capnografía, catéter central) |
| Clipado de aneurisma | Manejo hemodinámico estricto (hipotensión controlada) |
| Hipertensión endocraneana refractaria | Hiperventilación controlada y osmoterapia intraoperatoria |

**P2 / consideraciones — gatillos Cirugía Cardiovascular (M15; no son
slots de la proforma qx; mayor densidad de coordinación del catálogo;
corrección posterior de drogas y cuidados específicos):**

| Gatillo qx | Hacia consideraciones anestesia |
|---|---|
| Circulación extracorpórea (CEC) | Heparinización sistémica con control de ACT específico para bomba; manejo de temperatura; coordinación de despinzado / reperfusión |
| Paro circulatorio hipotérmico | Protección cerebral; monitoreo EEG/BIS; manejo de temperatura central estricto |
| Cirugía off-pump (corazón batiente) | Manejo hemodinámico durante manipulación / luxación del corazón para vasos posteriores, sin soporte de bomba |
| Reversión de heparina con protamina | Riesgo de reacción anafilactoide / anafiláctica; disponibilidad inmediata de manejo |
| ETE intraoperatoria | Frecuentemente colocada e interpretada por el anestesiólogo; coordinación de momento (pre y post-bypass) |
| Destete de CEC con inotrópicos / soporte mecánico | Coordinación de drogas vasoactivas en tiempo real con el cirujano |

**Riesgo:** alto. No mezclar con `valoracion.html`. Extender `S.cur` /
contrato compartido solo con OK explícito. **Gate:** auditoría de no
regresión (§8) antes de cualquier implementación.

---

#### P2 — Requisitos de fondo (marco; no inventar sobre la marcha)

1. **Un solo camino de facturación.** La Foja Quirúrgica no abre un flujo
   paralelo. Todo lo que produce termina en AnesFact para facturación
   (evweb / Traditum según corresponda), igual que el resto del sistema.
   Descargar / imprimir para que el cirujano se lo lleve es un **extra**,
   no un camino alternativo de facturación.

2. **Sincronización bidireccional con la foja de anestesia.** No alcanza
   con lectura unidireccional. Si el cirujano completa diagnóstico y tipo
   de cirugía en la qx, eso queda **disponible y utilizable** en la foja
   del anestesista. Si difiere de lo que el anestesista ya tenía →
   **alerta suave** (nunca bloqueo) para que alguno revise y corrija.
   No dejar dos versiones contradictorias sin que nadie se entere.

3. **Chequeo de alergias del paciente.** La Foja Qx (y el QR cirujano)
   deben poder mostrar alergias ya registradas (p. ej. desde el QR de
   valoración preanestésica). Es **alerta de seguridad**, no decoración.
   En diseño actual: **UI**, no línea impresa de la cáscara A4 (salvo
   decisión explícita posterior).

4. **Ítem propio en el menú / dock de AnesFact.** Al mismo nivel que
   «Preop.» o «evweb» — navegación vía `go(vista)` existente. No escondido
   dentro de otra pantalla.

5. **Calidad como diferencial.** QR del cirujano y Foja Quirúrgica se
   tratan con el mismo cuidado que el resto de AnesFact. Pieza que puede
   distinguir el producto; no resolver rápido y mal.

6. **Configurable sin reprogramar el motor (no es ML).** Agregar o ajustar
   proformas y campos (nuevas especialidades, nuevos slots, cambios de
   texto) = editar **definiciones / datos**, sin tocar el código central
   del motor cada vez. El diseño ya cerrado apunta a eso: slots tipados
   (`single` / `multi` / `free`) + `plantilla_texto` con `{{id}}` +
   filtro por especialidad (`i.serv`) + match por operación. **Requisito
   explícito de diseño**, no solo implementación conveniente.

7. **Canal de feedback de usuarios.** Lugar simple para que quien use la
   Foja Qx (cirujano) u otras piezas de AnesFact deje observación /
   sugerencia que llegue al administrador. No hace falta sofisticación;
   tiene que existir y quedar registrado en un lado accesible.

8. **Auditoría obligatoria antes de implementar.** Antes de una línea de
   código de Foja Qx: confirmar explícitamente que no se rompe lo que ya
   funciona — fojas Aeronáutico, Mayo + toda la integración GECLISA
   (extensión, cola, `fill.js`, P1b), evweb, Traditum, hospitales
   públicos. No es advertencia genérica: el visto bueno a implementar
   exige listar **qué archivos/flujos se tocan (si alguno) y por qué es
   seguro**. Hasta entonces: solo diseño / docs.

##### Auditoría de no-regresión (2026-09-13) — diseño; 0 código

**Veredicto:** P2 se puede implementar **sin tocar** GECLISA / P1b /
`fill.js` / Traditum / print de foja anestésica Mayo·Aero·públicos, si se
respeta el perímetro abajo. Lo que se toca es casi todo **nuevo** + un
anillo fino de navegación/caché/contrato (con OK explícito).

**Intacto a propósito (no tocar en P2):**

| Flujo / pieza | Archivos / zona | Por qué queda intacto |
|---|---|---|
| GECLISA inyección + cola | `chrome-extension-geclisa-batch/**`, `fill.js`, `fill-dev.js`, `vendor/fill.js`, `js/10-geclisa-ui.js`, `js/20-geclisa-send.js`, `js/39-geclisa-queue.js`, `views/geclisa.html`, `views/foja/mayo-geclisa.html` | P2 = qx **nativa Aero** (y luego P3 públicos). Mayo no edita qx en AnesFact; no hay IDs ni fill nuevos. |
| P1b PDF combinado | GET `ReporteListadoInternado` + alias `docs.qx = { aliasOf: 'anest' }` en sync/adjuntos (`js/17-sync-export.js` y caminos P1b ya cerrados) | Semántica Mayo: qx = PDF bajado de GECLISA / alias. P2 **no** reinterpreta ese alias ni escribe foja qx nativa para Mayo. |
| Foja anestésica print | `js/12-imprimir-aero.js` (Aero + públicos), camino Mayo/examen | Print qx = **módulo nuevo** (cáscara quirúrgica). No clonar ni reescribir el print anestésico. |
| Foja anestésica clínica | `js/08-foja.js`, `views/foja/**` (técnica, drogas, vitals, Mayo) | Editor qx aparte. Sync diag (§2) = lectura/alerta + escritura acotada a campos de intervención (`diag` / procedimiento), no al cuerpo de la foja anestésica. |
| evweb hoy | Dock/lista, marcas locales, `go('nom')`, checklist | Misma tubería de facturación (§1). P2 aporta **documento** (PDF/adjunto) al paquete AnesFact; no automatiza ADAARC. |
| Traditum (P4) | 0 código hoy; nomenclador `data/nomenclador.js` | P2 no implementa Traditum. Catálogo clínico ≠ `NOM`. No mezclar. |
| QR preop paciente | `valoracion.html`, `js/valoracion-form.js`, `js/31-valoracion-qr.js`, `af-qr-*` | QR **cirujano** = canal distinto. Alergias = **leer** lo ya guardado; no reescribir submit preop ni `resetFojaUIDom`. |

**Qué sí tocaría una implementación P2 (anillo + piezas nuevas):**

| Zona | Qué | Riesgo / regla de seguridad |
|---|---|---|
| **Nuevo** | Vista `go('…')` foja qx, JS editor + print qx, datos de proformas, QR cirujano (página/función aparte), feedback simple, catálogo CIE (datos) | No pasa por `fill.js` ni extensión. |
| Contrato caché / nav | `js/load-views.js` (`VIEWS`), `js/load-scripts.js`, `sw.js`, `js/01-state.js` (`TITLES`), dock en shell, `CACHE_V` | Obligatorio al sumar vista/script. Checker `check-version-sync.mjs` en verde. Navegación solo `go(vista)`. |
| Contrato `S.cur` | Extender intervención con entidad foja qx (p. ej. objeto hermano de `foja`, no dentro del formulario anestésico) + sync suave de `diag` / cirugía hacia la ficha | **Contrato compartido** (`MAPA_SECCIONES.md`): listar impacto y OK explícito antes. No tocar `abrirInter` / `cargarFojaUI` de más. |
| Adjuntos `docs.qx` | Aero (y P3): PDF nativo o foto puede alimentar la ranura qx del paquete facturación | **Gate por institución:** en Mayo, P1b/alias y adjunto manual siguen dueños. Código P2 no debe pisar alias P1b ni asumir “siempre editor nativo”. |
| UI foja anestesia (mínimo) | Badge/alerta suave si qx trajo diag distinto; mostrar alergias en UI qx | Solo lectura + aviso; nunca bloqueo. No cambiar reglas GECLISA payload. |
| Facturación UI | Tildef / ranura qx cuando el PDF nativo exista (Aero) | Misma ranura conceptual; sin segundo camino de facturación. |

**Confirmaciones explícitas (marco P2):**

- **GECLISA + extensión + cola + `fill.js`:** intactos.
- **P1b (Mayo):** intacto; `docs.qx` alias no se redefine para Mayo.
- **evweb:** intacto como destino; P2 no es fill evweb.
- **Traditum:** intacto / sigue en P4; P2 no lo abre.
- **Fojas Mayo / Aeronáutico / públicos (anestesia):** print y editor anestésicos intactos; qx nativa solo donde el cierre lo pide (Aero primero; públicos = P3).
- **Mayo foja qx:** sigue GECLISA (baja/adjunto), no editor AnesFact en P2.

**Gate pendiente antes del primer commit de código:** revalidar esta tabla contra el diff propuesto (sobre todo `S.cur` y cualquier toque a `js/17-sync-export.js` / `docs.qx`). Si el diff entra en zona «Intacto», no hay OK.

---

#### P2 — Cáscara A4 (misma para todas las especialidades)

Regla: encabezado, datos, firma y pie **iguales** en todas las
especialidades. Solo cambia el **texto** del bloque Descripción (armado
desde proforma → slots → párrafo editable). Proformas filtradas por
especialidad del caso (`i.serv`); oferta Usar / Editar y usar / Desde cero.

**Orden impreso — campos exactos *antes* de la descripción:**

| # | Bloque | Campo impreso | Origen / notas |
|---|---|---|---|
| 1 | Encabezado | Título `FOJA QUIRÚRGICA` (+ institución si aplica, mismo espíritu que Aero) | Cáscara fija |
| 2 | Identidad | Paciente (apellido y nombre) | Intervención; solo lectura |
| 3 | Identidad | DNI | Intervención; solo lectura |
| 4 | Identidad | Sanatorio / institución | Intervención; solo lectura |
| 5 | Identidad | Fecha | Intervención; solo lectura |
| 6 | Identidad | Hora inicio de cirugía | Foja anestesia; **solo lectura** — la qx no escribe otro horario |
| 7 | Identidad | Hora fin de cirugía | Foja anestesia; **solo lectura** |
| 8 | Equipo | Cirujano | Editable en qx; puede partir de `i.ciru` |
| 9 | Equipo | 1er ayudante | Editable |
| 10 | Equipo | 2do ayudante | Editable (vacío si no hay) |
| 11 | Equipo | 3er ayudante | Editable (vacío si no hay) |
| 12 | Equipo | Instrumentador | Editable |
| 13 | Dx / op. | Diagnóstico preoperatorio | + código CIE (buscador; catálogo CIE a armar) |
| 14 | Dx / op. | Diagnóstico posoperatorio | + código CIE |
| 15 | Dx / op. | Operación indicada | Catálogo clínico (`CIRUGIAS` / especialidad), no ADAARC `NOM` |
| 16 | Dx / op. | Operación practicada | Idem; texto libre si no hay match |
| 17 | Dx / op. | Riesgo quirúrgico | Campo propio qx |
| 18 | Fijo clínico | Consentimiento informado firmado | **Sí / No** — obligatorio en todas |
| 19 | Fijo clínico | Conteo de gasas y compresas | Texto corto — obligatorio en todas |
| 20 | Fijo clínico | Antibiótico-profilaxis | **Sí / No** (+ detalle libre opcional si Sí) |

**Inmediatamente debajo (no son “previos”, pero cierran el documento):**

- **Descripción del procedimiento** — solo el texto final (sin UI de slots).
- **Grado de dificultad operatoria.**
- **Firma / sello virtual del cirujano** (nombre + M.P. + especialidad;
  espíritu `AfIdentidad`, identidad distinta a la del anestesista).
- **Pie** (mismo criterio de institución / colegio que el print Aero).

**Fuera de la cáscara impresa (UI):** alerta de alergias (§3); alerta suave
de discrepancia diag/cirugía vs foja anestesia (§2); formulario dinámico
de slots de la proforma (nunca se imprime).

**Catálogos (no mezclar):** clínico = `data/cirugias.js` (`CIRUGIAS`) +
CIE nuevo para dx; facturación = `data/nomenclador.js` (`NOM` ADAARC) solo
en el camino de complejidad / Traditum / evweb.

### P3 — Foja qx + QR cirujano · **públicos** · **mediano** (después de P2)

**Cierre:** públicos → SISalud, no evweb. Misma pieza que P2, destino
print A4 (upload SISalud vetado).

### P4 — Traditum APROSS · **grande** · reconocimiento 2026-09-10 (sin código)

**Cierre:** `docs/CIERRE_ARQUITECTURA_FACTURACION.md` § APROSS / Traditum
+ sub-estados `auth_status`. Sigue **0 líneas** en `js/` / `views/` /
extensión. El ciclo operativo confirmado con Huerta (2026-09-10) está
en «Ciclo de vida» más abajo; no contradice el cierre: lo detalla
(foto → Nueva Solicitud → consultar → ramas, incluida validación
parcial y baja de complejidad de a un nivel).

**Por qué no antes:** APROSS-only. PAMI y ART no pasan por acá. P1 solo
adjunta; P1b junta fojas para evweb **sin** Traditum.

Lo que sigue es **reconocimiento en vivo** (Gestor de Ambulatorio,
cuenta personal de la Dra. Huerta). No se tocaron credenciales. No
automatizar desde este archivo.

#### Dominios (cross-origin real)

| Pieza | Dónde |
|---|---|
| Login / menú | `menu.traditum.com` |
| Gestión | `aprossgestores.traditum.com` — `Forms/FrmGestionAmbulatorios.aspx` |

El DOM de gestión **no** se lee desde el menú con JS de página. Una
extensión futura necesita un content script que matchee
`aprossgestores.traditum.com` (no el de login).

#### Gestor Ambulatorio — dos usos

1. **Nueva Solicitud** — formulario mapeado abajo (alta).
2. **Consultar** las ya cargadas, filtro Estado: Validada / Sujeta a
   Auditoría / Rechazada (resultado). El procedimiento de cada rama
   está en «Ciclo de vida».

#### Ciclo de vida (confirmado Huerta)

Reconocimiento en vivo; cuenta personal de la Dra. Huerta; no se
tocaron credenciales. **Nada implementado.**

1. En **AnesFact** se saca foto de la autorización que trae la
   secretaria (hoy a mano; P1 = ranura auth cuando se use).
2. Traditum → Gestor de Ambulatorio → **Nueva Solicitud**. Cargar
   según el mapa: prestador fijo; afiliado / diagnóstico / fecha
   desde la foto; Cód. Práctica = `1601` + complejidad del catálogo
   ADAARC (`go('nom')`).
3. **Hueco AnesFact:** no hay estado tipo «Pendiente de autorizar en
   Traditum» (ni el `auth_status` del cierre en la foja). Terreno
   nuevo a diseñar; no codear ahora.
4. Más tarde se vuelve a Traditum a **consultar**, filtrando por
   Validada / Sujeta a Auditoría / Rechazada.

**Ramas al consultar**

| Resultado | Qué se hace |
|---|---|
| **Validada** | Se exporta desde Traditum y se sube a **evweb**. |
| **Rechazada** (por complejidad) | Se reclama como **evento nuevo**, bajando **un** nivel de complejidad por vez (`5→4`, si rechaza otra vez `4→3`, …). **Nunca saltar** niveles. Caso real confirmado (sin nombre acá): partió en 5 y validó en 3, de a uno. |
| **Validación parcial** | Una misma cirugía, dos procedimientos / dos códigos (dos complejidades). En la **misma** solicitud una prestación puede validarse y la otra no. La parte validada **se sube igual a evweb**, sin esperar a que se resuelva la otra. |
| **Sujeta a Auditoría** | No se actúa. Esperar a que APROSS resuelva (pasa a Validada o Rechazada). |

Esto cierra el ciclo de vida documentado de P4. Sigue sin parser de
foto, sin content script y sin estados en la foja.

#### Nueva Solicitud — campos (confirmado Huerta)

Prestador **Efector** y **Prescriptor**: ambos fijos = Huerta,
matrícula **32393**. El prescriptor **no** es el cirujano.

| Campo | ID (`input`) | Origen del dato |
|---|---|---|
| Prestador Efector | fijo (UI) | Huerta, MP 32393 |
| Prestador Prescriptor | fijo (UI) | Huerta (no el cirujano) |
| Nro. Credencial (afiliado) | `bodyContent_PID_txtNroIDAfiliado` | N° afiliado **APROSS**. Tres fuentes, cruzables: (1) foto de la autorización que da la secretaria; (2) QR de valoración preanestésica si el paciente lo cargó; (3) foja GECLISA |
| Cod. Diagnóstico | `bodyContent_DG1_txtNroDDDiagnostico` | Código APROSS de la autorización (ej. `K80`). **Solo la foto**; no está en otro lado de AnesFact |
| Fecha Prescripción | `bodyContent_AUT_dtFechaPrescripcion` | Fecha de la autorización — de la foto |
| Fecha Realización | `bodyContent_PRE_dtFechaPrestacion` | Debe **coincidir** con Fecha Prescripción |
| Cód. Práctica | `bodyContent_PRE_txtCodigoPrestacion` | `1601` + complejidad, **sin separadores** (comp. 5 → `160105`). Complejidad ya está en AnesFact: vista evweb / **Prácticas ADAARC** (`go('nom')`, `data/nomenclador.js`: cada ítem trae `cod` + `comp` 1–5) |
| Cantidad Solicitada | visible en el form (ID a anotar si se automatiza) | Normalmente `1` |
| Observaciones | `bodyContent_NTE_txtObservacion01` | Texto libre: qué cirugía hizo el cirujano |
| Enviar | `bodyContent_btnAceptar` | Envía la solicitud |

#### Catálogo evweb (ADAARC) — referencia permanente

Extracción 2026-09-12 de los desplegables reales
`select#body_cboObraSocial` y `select#body_cboSanatorios` en
`frmCargaDeIntervencion.aspx?accion=agregar` (`adaarc.evweb.com.ar`).

Archivo completo (307 obras sociales + 397 sanatorios, Córdoba):
`docs/evweb_catalogo_completo.md`. Formato
`value_interno|código_visible - Nombre` — el `value` HTML ≠ el código
visible (ej. APROSS: `259` interno / `300` en pantalla).

Al inicio del archivo: tabla de entradas de la práctica Huerta
(APROSS, PAMI+Mayo, Mayo, Aeronáutico — typo real **HOSPITA** sin L,
no corregir al automatizar —, OSPA, IOSFA, APOS+Mayo, Allende, 3 ART).
Solo referencia; **no** codear fill de evweb desde acá.

#### Carga en evweb — mecánica por obra social (confirmado 2026-09-12)

Prueba en vivo en `frmCargaDeIntervencion.aspx` (modo agregar),
cambiando la obra social:

| Obra social (value interno) | ¿Campo «Transacción N°»? |
|---|---|
| APROSS (`259`) | **Sí** |
| PAMI Sanatorio Mayo (`382`) | No |
| Federación Patronal ART (`228`) | No |
| IOSFA (`105`) | No |
| SIPSSA-OSPA (`31`) | No |

**Confirmado:** «Transacción N°» es **exclusivo de APROSS**. El resto
muestra la misma sección genérica «Documentación electrónica»
(Seleccionar archivos… / Cargar), **sin** etiqueta obligatoria distinta
entre obras. Traditum + N° de Transacción = paso extra **solo** APROSS;
la mecánica de adjuntos en evweb es la misma para las demás.

**Corrección:** la etiqueta «AUTORIZACIÓN DE OBRA SOCIAL» vista en un
caso APROSS ya cargado (modo *ver*) **no** aparece como campo fijo en
modo *agregar*, ni siquiera en APROSS. Probable nombre escrito a mano
al subir ese PDF — **no** darlo por etiqueta del sistema hasta ver más
casos.

**Pregunta abierta (humana, no software):** ¿hay forma de conseguir
autorizaciones de obra social sin depender de la secretaria del
sanatorio (p. ej. auditores de la asociación)? Que Huerta lo converse
con ADAARC; no se resuelve en código.

#### No es

- No es `fill.js` ni IDs GECLISA.
- No es fill automático de evweb (eso viene **después** de `validado`
  en APROSS; en el resto, sin Traditum).
- No hay parser de foto ni content script todavía.

### P5 — Bloqueados / no ahora

- Firma digital de consentimiento (abogado).
- Upload SISalud (ESTADO: no investigar).
- Fill de evweb (extensión tipo GECLISA): no hay mapeo de pantallas;
  el cierre lo deja para «después de diagramar evweb/Traditum».
- Allende.

### P6 — Buzón de mail AnesFact para autorizaciones · **idea 2026-09-01** · **no diseñar / no codear**

**Separado de P1b / Lote B.** P1b baja el PDF combinado de fojas desde
GECLISA. Esto es la **autorización de mutual** que hoy llega por
WhatsApp o mail personal de secretarias/auditores, sin orden, y alguien
la cuelga a mano en la ranura auth (P1). No es GET GECLISA, no es
Traditum (**P4**), no es el QR de recepción de PDFs de la auditoría
Mayo.

**Idea (una frase):** un mail propio de AnesFact; el sistema lee ese
buzón, identifica de qué paciente/foja es cada autorización, y la
adjunta sola a la ranura correspondiente.

**Preguntas abiertas** (cuando se retome; no responder acá):

1. ¿Cómo identificar a qué paciente/foja corresponde cada mail
   (asunto, contenido del PDF adjunto, remitente)?
2. ¿Hace falta un servicio de correo con API (lectura automática) o
   alcanza un mail normal?
3. ¿Volumen aproximado de autorizaciones por día, para dimensionar
   prioridad?

Ranura destino = auth (`docs.auth` / § 1c), no pisar el combinado
GECLISA en `docs.anest`. Sin lote de código, sin proveedor, sin
prioridad en el orden de § 4.

---

## 3. Fases — riel U (interfaz), aparte

Leer entero `docs/DISENO_PC_HOME.md` antes de codear. Módulos = `go(vista)`.

### U1 — Shell PC: institución primero + lista de fojas · **mediano**

Soltar `max-width:520px` en un breakpoint, columna instituciones,
filtro (ya existe `home-san` / `afGoFojasFiltrado`), dock oculto en PC.
**Sin** bandejas de Traditum/evweb (eso espera estados de P).
**Sin** tuberías nuevas.

**Riesgo:** `styles.css` es global — el móvil no debe cambiar de
comportamiento. Probar ambos anchos. No es «cero archivos de móvil».

### U2 — Bandejas de trabajo en esa columna · **grande**

Preop / fojas / colas / listos destino. Depende de datos que P1–P4
vayan creando. No arrancar U2 con Traditum a 0 líneas (la bandeja
quedaría vacía o inventada).

### U3 — Móvil, misma lógica · **grande**

Etapa 2 de `DISENO_PC_HOME.md`. Chrome propio; no fork de foja.

**No paralelizar U1 con un lote que toque `fill.js` o la cola GECLISA.**
U1 + P1 en paralelo solo si P1 se limita a `facturacion.html` + el JS de
docs ya escrito, y U1 no edita esos archivos.

---

## 4. Orden sugerido (revisar juntos)

```
ahora     P1b B+C codeado 12.57 / 0.5.12 — probar GET; pendiente filtro fechas
   │
   ├─ riel P:  P1 adjuntos (hecho 12.55) → P1b A persistir N° → B GET → C reintento qx
   │            → P2 Aero qx+QR (grande) → P3 públicos (mediano) → P4 Traditum (grande)
   │            P6 buzón auth = idea anotada; no entra en este orden
   │
   └─ riel U:  U1 PC shell (mediano) ──después──► U2 bandejas ──► U3 móvil
```

Primera fase de **código** recomendada cuando se arranque: **P1** o **U1**,
nunca las dos en el mismo lote, nunca P2/P4 mezclado con U1.

Huerta hoy ya opera Mayo (QR + foja + GECLISA) y Aero (foja + marca
evweb a mano). P1 es el parche que el código casi tiene. U1 es el
dolor de PC (columna 520px) y no completa ninguna tubería.

---

## 5. Qué no hacer

- No llamar «evweb directo» a la marca local ni al copiar/pegar.
- No fusionar los tres QRs.
- No implementar consentimiento digital.
- No un SKU «plan Cirugía» (visión en Home; planes hoy = cupo de lugares).
- No Allende.
- No «completar SISalud» = upload hasta que Diego quite el veto.
- No duplicar ni mezclar patología/procedimiento en un módulo genérico
  cuando ya existe especialidad auditada dueña (ver **P2 — Regla de
  organización del catálogo**; no tocar OK de semilla ajenos sin OK
  explícito).
