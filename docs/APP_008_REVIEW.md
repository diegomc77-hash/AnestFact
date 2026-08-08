# App companion 008 — revisión (antes de SQL)

No ejecutar `008_security_firma_geclisa_sesiones.sql` hasta validar este código.

## Cambios

### 1) GECLISA token
- `js/20-geclisa-send.js` → `af_geclisa_create_token` (muestra/copia token; abre GECLISA)
- `fill.js` / `fill-dev.js` → `prompt` + `af_geclisa_consume_token` (anon)
- Payload clínico (DNI real) sin cambios de mapeo Mayo

### 2) Firma certificada
- `views/config.html` → card canvas + Certificar
- `js/37-firma-certificada.js` → RPCs `af_get_mi_firma` / `af_certificar_firma`
- `views/foja/firma.html` → preview read-only si certificada
- `js/12-imprimir-aero.js` → prioriza PNG certificada
- `js/05-vitals-sign.js` → usa certificada si existe

### 3) Sesiones 1 PC + 1 móvil
- `js/38-sesiones.js` → register + poll `af_check_session`
- Enganche en `js/28-auth.js` y `js/load-views.js`

### 4) Admin sin “Ver fojas”
- `js/30-admin.js` → solo Guardar plan
- Quitados view-as / follow / push sync
- Limpieza en `17-sync-export.js`, `01-state.js`, `36-identidad-anestesista.js`, `06-nav-core.js`

### Cache
- App **v11.1** (`load-scripts.js`, `sw.js`, `index.html`, views bust)

## Dependencia
Sin el SQL 008, GECLISA/firma muestran error claro “Falta ejecutar el SQL 008…”. Sesiones fallan en silencio (no expulsan).

## Bookmarklet GECLISA

El favorito **solo hace `fetch(fill.js?t=Date.now())`**. El cambio de DNI→token está en `fill.js` / `fill-dev.js`, no en la URL del marcador.

| Situación | Acción |
|-----------|--------|
| Marcador v3 (carga fill.js de Pages) | **No hace falta cambiar el link** cuando publiques el `fill.js` nuevo |
| Querés nombre “token” / marcador incrustado viejo | Reinstalar desde `geclisa-bookmarklets.html` |
| Prueba local | Usar marcador **DEV** → `localhost:8080/fill-dev.js` |

### Prueba antes del 008 completo
1. Correr **`008a_geclisa_tokens_only.sql`** (solo RPCs token; no corta DNI ni admin sync).
2. App local + Enviar a GECLISA → token.
3. Bookmarklet DEV en GECLISA → pegar token.
4. Si OK → 008 completo + deploy `fill.js` a Pages.
