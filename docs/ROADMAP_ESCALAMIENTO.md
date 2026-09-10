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
(**P4**).

Formulario + print + QR distinto al de preop. Copia para el anestesista.

**Riesgo:** alto. No mezclar con `valoracion.html`. Extender `S.cur` solo
con OK explícito.

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

#### No es

- No es `fill.js` ni IDs GECLISA.
- No es evweb ADAARC (eso viene **después** de `validado`).
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
