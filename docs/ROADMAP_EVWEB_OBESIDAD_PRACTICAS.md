# Roadmap — Obesidad Mórbida + Prácticas en la cola evweb

_Generado la noche del 21→22 de septiembre 2026. Continuación del fix de "channel closed" (bridge v0.6.24)._

## Ya está hecho (no repetir)

1. **Bridge v0.6.24**: arreglado el bug de "message channel closed" al subir documentos a EVWEB (el `__doPostBack` recargaba la página real y el content script moría antes de responder). Probado y confirmado: sube y clasifica los 3 documentos OK.
2. **AnesFact v12.89**: la cola de evweb (`js/40-evweb-queue.js`) ahora manda `obesidadMorbida` (de `S.cur.ob`) y `pracs[]` (de `S.cur.pracs`, formato `{cod, desc, comp}`) dentro del snapshot de cada ítem — antes se perdían al encolar.
3. **Catálogo de prácticas EVWEB escaneado** (15 obras: APROSS/PAMI/IOSFA + 12 de tandas 1–3 ART/mutuales Huerta): **25885** filas único `obraId|codigo`. Base: `docs/evweb_practicas_apross_pami_iosfa.csv`. Tandas: `docs/evweb_practicas_tanda{1,2,3}_*.csv`. Match runtime: `data/evweb-practicas-match.js`.
4. **Endpoint real de EVWEB para prácticas** (no está en ningún doc previo):
   - `POST /Pages/Asociaciones/WSautocomplete.asmx/GetAvaliableTags3`
   - Body: `{"DescripcionConCodigo": "<termino>", "idObraSocial": "<id>"}`
   - Respuesta: `{"d": ["<codigoEvweb> - <descripcion>&<param1>&<param2>", ...]}`
   - **El catálogo de prácticas es por obra social**, no es un catálogo único (a diferencia de Obra Social/Sanatorio que sí son un solo desplegable).
5. **Selectores DOM confirmados en EVWEB** (`frmCargaDeIntervencion.aspx`):
   - `body_chkObesidad` — checkbox Obesidad Mórbida
   - `body_chkCantidades` — checkbox "¿Carga por Cantidades?" (no tocar, fuera de alcance)
   - `body_txtCodigoPractica` — input de búsqueda de prácticas (necesita eventos de teclado reales, no basta con dispatch de `input` sintético)
   - `body_hfIdNomenclador`, `body_hfNomencladorPorcentaje`, `body_hfNomencladorCantidad` — hidden fields junto al buscador; su rol exacto al seleccionar una sugerencia **no se terminó de confirmar en vivo** (la prueba con Enter/click no dejó ver un resultado claro — falta que Cursor lo confirme con calma, sin apuro de producción).

## Lo que falta — para Cursor

### 1. Motor de matching dentro de AnesFact (antes de mandar a EVWEB) — **hecho 12.90**
Por cada práctica que Huerta carga en la foja (`S.cur.pracs[]`, código tipo `EN.MA14` del nomenclador ADAARC), buscar la fila correspondiente en `docs/evweb_practicas_apross_pami_iosfa.csv` cruzando por **texto de la descripción** (no por código — son catálogos distintos) y por la obra social de la foja. Guardar el `codigoEvweb` resuelto junto a la práctica.

- Si hay **un solo match claro** → guardarlo, listo para autocompletar.
- Si hay **varios candidatos o ninguno** → dejar sin resolver, se busca a mano en EVWEB como hoy.

Implementación: `data/evweb-practicas-match.js` (gen. `tools/gen-evweb-practicas-match.mjs`) + `afeResolvePracEvweb` / `afeSnapshotPracs` en `js/40-evweb-queue.js`. Solo exacto o mismos tokens. **`AFE_OBRA_MAP` (PWA 12.92):** 15 mutuales — 382 PAMI, 105 IOSFA, 259 APROSS, 228 Federación Patronal ART, 119 OMINT ART, 258 Experta ART, 433 Andina ART, 76 Horizonte, 227 Berkley, 37 OSPECOR, 5 La Holando ART, 263 Prevención, 437 APOS Mayo, 420 Provincia ART, 70 Productores de Frutas.

**Ticket 13 (PWA 13.15):** código **9000** `EVALUACION PRE ANESTESICA-EV` como práctica extra (checkbox Facturación) para 9 mutuales en `AFE_PREANEST_OBRAS` (PAMI + 8 ART). CSV `docs/evweb_practicas_preanest_9000.csv` → regen match. No IOSFA / APROSS / demás.

### 2. Fill automático en EVWEB (`FILL_PAMI`, ya recibe `obesidadMorbida` y `pracs[]`) — **hecho ext 0.6.25**
1. Tildar `body_chkObesidad` si `obesidadMorbida` es true.
2. Por cada práctica:
   - Si tiene `codigoEvweb` resuelto (paso 1): escribir la descripción en `body_txtCodigoPractica` simulando tecleo real, esperar el desplegable, y seleccionar la opción que matchea ese código exacto — no la primera que aparezca.
   - Si no tiene código resuelto: escribir la descripción igual, dejar el desplegable abierto, y que Huerta elija y confirme a mano (mismo patrón "revisá y finalizá" que ya usa el resto del flujo).
3. Nunca autoseleccionar a ciegas por texto — la seguridad de facturación depende de elegir el código correcto.

Implementación: `fillEvwebPracticas` / `setEvwebObesidadCheckbox` en `content/evweb.js`. Diag `prac_selected` / `prac_left_open`. Pendiente smoke en vivo (hidden fields hfIdNomenclador / botón Agregar si hay varias).

### 3. Pendiente de definir con Sole (no avanzar solo)
- Smoke en vivo: cola EVWEB con foja de mutual nueva (no PAMI/IOSFA/APROSS) → `codigoEvweb` resuelto al encolar.
- Ritmo de re-scan si EVWEB cambia nomenclador (sesión real Sole).
