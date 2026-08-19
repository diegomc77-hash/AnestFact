# AnesFact — Pasaporte para otro agente

Leé **este archivo primero**. No explores el repo a ciegas: es PWA vanilla, ~40 JS globales, sin bundler ni tests. El dueño es Diego (`diegomc77@gmail.com`); uso clínico Dra. Huerta. Prod: `https://diegomc77-hash.github.io/AnestFact/`. Cache **v12.21**. UI v8.5.

**Prompt para pegarle al agente siguiente** (copiar tal cual):

> Trabajás en AnesFact. Antes de cualquier cambio leé `ANESFACT_PASSPORT.md`. Respetá la sección 6 (no tocar). Si cambiás JS/HTML/CSS, bump de cache v12.21 → 12.22 en `js/load-scripts.js`, `js/load-views.js`, `sw.js`, `js/24-sw-register.js`, `index.html`, `valoracion.html`. No uses React/TS/npm de app. No ejecutes SQL 007 (shares) ni 009. No pises campos de foja al importar QR. Preguntá si no está en el pasaporte.

**Reglas operativas**

1. Vanilla JS + `var` globales. Un archivo nuevo de app va en `js/load-scripts.js` (orden importa).
2. Tras editar UI/JS: subir **los 6** busts de cache juntos (arriba). Si no, la PWA sirve código viejo.
3. No tocar `fill.js` ni IDs GECLISA salvo pedido explícito. Hay copia en `chrome-extension-geclisa-batch/vendor/fill.js` — si cambiás uno, el otro.
4. SQL: 001–006 + **007b** + 008a/008. Nunca `007_security_hardening.sql` (shares). `009` no, hasta inventario legacy vacío.
5. QR: `paciente_id` / `valoracion_id` opcionales. Nunca `resetFojaUIDom()` al importar. Solo llenar campos vacíos.
6. Alertas anticoag/alergia: avisar, **no** indicar suspender medicación.
7. Apps Script compartido está apagado a propósito (fuga entre usuarios). Sync = solo `anesfact_sync_<uid>`.
8. Local: `npx serve .` (las vistas usan `fetch`). Dominio: solo Pages + localhost (`seguridad.js`).

**Dónde buscar (no listar todo el repo)**

| Tema | Ir a |
|------|------|
| Estado / foja / save | `js/01-state.js`, `07-intervenciones.js`, `08-foja.js` |
| Nav / toast | `js/06-nav-core.js` (`go`, `toast`) |
| Gráfico Aero | `js/16-vitals-grid.js` (`VG`) |
| Impresión Aero | `js/12-imprimir-aero.js` |
| GECLISA token / payload | `js/20-geclisa-send.js`, `fill.js` |
| Cola GECLISA | `js/39-geclisa-queue.js`, `chrome-extension-geclisa-batch/` |
| Auth / planes / admin | `js/28-auth.js`, `29-plans.js`, `30-admin.js` |
| QR paciente | `js/31-valoracion-qr.js`, `valoracion.html`, `js/valoracion-form.js`, `js/40-valoracion-preop-sync.js` |
| Sync / tombstones | `js/17-sync-export.js` |
| Reglas clínicas | `data/reglas-clinicas.js`, `js/23-reglas-clinicas.js` |
| Alertas sangre/alergia | `data/valoracion/alertas-seguridad.js` |
| SQL / RLS | `supabase/migrations/` |
| Edge QR | `supabase/functions/af-qr-create`, `af-qr-submit` |

---

## 1. Stack técnico

`index.html` → `seguridad.js` → `js/supabase-keepalive.js` → `js/load-scripts.js` (~50 scripts `?v=12.21`) → `js/load-views.js`. PWA: `sw.js`, `manifest.json`.

| Área | Archivos |
|------|----------|
| Núcleo | `js/00-env.js`, `01-state.js` (`S`), `06-nav-core.js`, `07-intervenciones.js`, `08-foja.js` |
| Aero | `12-imprimir-aero.js`, `16-vitals-grid.js` |
| Mayo/GECLISA | `19-examen-mayo.js`, `20-geclisa-send.js`, `39-geclisa-queue.js`, `fill.js` v13, extensión **0.5.5** |
| Clínica | `21-metodos.js` (37 KB), `22-tecnica.js` (35 KB), `23-reglas-clinicas.js` |
| Cuenta | `28-auth.js`, `29-plans.js`, `30-admin.js`, `35–38` (sanatorios, identidad, firma, sesiones) |
| QR | `31-valoracion-qr.js`, `40-valoracion-preop-sync.js`, `valoracion.html` |
| Catálogos | `data/nomenclador.js` (174 KB), cirugías, drogas, cirujanos, obras sociales |

**Servicios:** Supabase `xntvibfsuubedplptvzs` (Auth + Postgres + Edge; anon key pública, datos por RLS). GitHub Pages + Action keepalive 08:00/20:00 UTC. GECLISA `http://sanatoriomayo.myvnc.com:84/`. `S.key`/`af_k` = API key opcional de escaneo IA.

---

## 2. Estructura de datos

**`anesfact_usuarios`:** id→auth.users, email, nombre, matricula, matricula_especial, plan, rol, activo, fojas_semana, semana_reset, sanatorios_permitidos[], firma_*. RLS propio/admin. Trigger: no auto-pro; firma certificada inmutable.

**`anesfact_datos`:** clave, datos (JSON texto), owner_id, expires_at. Sync `anesfact_sync_<uid>` solo dueño. Help `anesfact_help_*` insert user / read admin. Anon: puente no-sync con TTL. Payload: `{intervs, cirujanos, key, guardado, version, total}`.

**`anesfact_geclisa_tokens`:** token hex 48, paciente_ref, payload jsonb, +2 h, used_at. REST deny-all; RPC create (auth) / consume (anon, 1 uso).

**`anesfact_sessions`:** UNIQUE(user_id, pc|mobile). **QR:** `anesfact_pacientes` (enc + dni_hash; INSERT solo Edge), `anesfact_qr_tokens`, `anesfact_valoraciones` (jsonb A–F), `anesfact_foja_vinculos`. **No usar** `anesfact_shares`.

**`S`:** `{ intervs[], cur, hist:['home'], recog, recField, pendFiles[], key, signData, vitals[] }`. Foja: `id` (timestamp; QR=`preop_<uuid>`), `estado` (borrador|listo|enviado|enviado_geclisa|preoperatorio), `fecha,hora,pac,edad,sexo,dni,peso,ciru,serv,diag,san,sala,cama`, Mayo `mayo_sector/cama/quir/tipociru/posicion`, `obra,afil,docs,ob,env,pracs[],owner_id,_ts`, QR opcional `paciente_id,valoracion_id`. `foja{}`: tec*, asa, via, fin, tubo, ind, hint/hext, premed, atb, metodos, recup, obs, examen, mallampati, aldrete/bromage/ramsay, fluidos, antecedentes[], drogas[{n,d,v,grupo,causa}], vitals, sign, **vg_***, **aero_***, tiva, gases, mayo_vitals[], mon_*. Local: `af_i_<uid>`, tombstones `af_deleted_intervs_<uid>`.

**`VG`:** `{ cols:[{t:'HH:MM'}] c/5 min, cells:{'ci_val':{param,sym,color,val?}}, obs, fluidos, activeParam }`. Params: resp, pulso, ta, oximet, co2, operac, anest.

**Clave paciente (token):** DNI 7–9 sin ceros izq. → si no `APELLIDO_NOMBRE_AAAAMMDD` → `sin_id_AAAAMMDD`. Localhost: `DEV_`. Eso es `p_paciente_ref` (no va en URL). El payload **sí** lleva DNI/nombre reales.

---

## 3. Límites

Módulos grandes: nomenclador 174 KB; metodos 37; tecnica 35; valoracion-form 38; sync 26; fill.js 18.

| Acción | Requests |
|--------|----------|
| Abrir app logueado | keepalive + refresh JWT + GET perfil (+PATCH email) + plan + `af_register_session` + GET valoraciones ≤40 + GET sync |
| Guardar foja | 0 inmediato; debounce ~2,5 s: GET sync + **UPSERT de toda la lista** |
| GECLISA | `af_assert_plan` + `af_geclisa_create_token`; bookmarklet: `af_geclisa_consume_token` |
| Heartbeat | `af_check_session` c/45 s |

Foja sin fotos **8–25 KB**. Docs data-URL **0,5–3 MB**. Sync = todas las fojas en **una** fila; localStorage ~5 MB.

---

## 4. Seguridad y planes

Auth email/password; JWT en `Authorization`. Owner: `af_claim_owner_admin` solo `diegomc77@gmail.com`. Planes: RPC `af_assert_plan`.

| Plan | Incluye |
|------|---------|
| **demo** | 1 foja/semana; sin imprimir ni GECLISA; solo Aeronáutico; watermark |
| **basico** | Fojas + imprimir + GECLISA; Aero + Mayo |
| **pro** | + Allende + Clínica Privada Córdoba |
| **bloqueado** | Nada |
| **admin** | Como pro + panel planes; **no** lee fojas ajenas |

Pedido de plan = ticket `anesfact_help_*`. Facturación fuera de la app. PII QR cifrada en Edge (`AF_ENCRYPTION_KEY`, `APP_PII_SALT`).

---

## 5. Módulos e interfaces

Globales: `S`, `VG`, `AF_ENV`, `AF_AUTH` (signIn/Up, token, uid, isLoggedIn), `USER_PLAN`/`USER_PROFILE`/`USER_IS_ADMIN`, `go`/`toast`/`guardar`/`guardarFoja`, `checkPlan`/`assertPlanServer`.

| API | Rol |
|-----|-----|
| `AfIdentidad` | nombre/MP del titular |
| `AfSanatoriosPlan` | filtra `#f-san` |
| `AfFirma` / `AfSesiones` | PNG 1 vez; 1 PC+1 móvil (SQL 008) |
| `AfCaptureGuard` | overlay demo/bloqueado |
| `afMintGeclisaToken` | arma payload + token |
| `afSyncValoracionesPreop` | cards Home preop |
| `getAlertasClinicas` | panel reglas |

Vistas: home, nueva, foja, facturacion, nom, geclisa, resumen, config, escanear, ayuda, admin. Foja: tiempos, mayo-quir, tecnica, drogas, metodos, mayo-geclisa, vitals, fluidos, recuperacion, observaciones, firma, acciones.

---

## 6. No tocar (salvo pedido explícito)

- `fill.js` + IDs GECLISA; `imprimirFoja` / `js/12-imprimir-aero.js`.
- `guardarFoja` / `guardarFojaVG` (no perder `vg_*`). Tombstones de delete.
- Triggers plan/firma; RLS sync-solo-dueño.
- Import QR: no resetear foja, no pisar campos llenos.
- Aero: solo Qx 1–3. DNI 7–9: warning, no bloquea save.

**IDs GECLISA (ancla `#8054`):** 8027/28/31 apellido/nombre/DNI · 8049 Qx · 8050 tipo · 8054 dx · 8057 anestesista · 8058 fecha · 8061/63 inicio/fin **HH:MM:SS** · 8065 cirujano · 8067 posición · 8070 métodos · 8072 nivel regional · 8075 monitoreo · 8077 medicamentos · 8079 materiales · 8083/85 edad/peso · 8088 examen · 8090 ASA · 8091 emergencia · radios EtCO2 8095/96, PAM 8099/00, ECG 8103/04, SAT 8107/08, PANI 8111/12, DECUB 8115/16 · 8119 premed · 8121 inducción · 8123 mantenimiento · grilla 5–240 min (SIST 8134…8319 + diast/sato2/eco2/fc/pam) · 8448–8455 balances · 8458 recup · 8460 obs · `txtFechaGestion`/`txtHoraGestion`.

**Clínica (ayuda, no protocolo):** IRC / IC-cardio / CEC / anticoag. Evitar AINE+aminoglucósidos en IRC; pancuronio en cardio; precaución propofol/morfina/succinilcolina.

---

## 7. Estado

**Listo:** foja Aero (gráfico, impresión, 3 Qx) y Mayo (fill). Auth/planes/admin. Sync uid + tombstones. Token GECLISA 1 uso + cola + extensión. Firma/sesiones (código; SQL 008 en el proyecto). QR Mayo Etapa 1. Bromage/Ramsay.

**En curso:** cola GECLISA fillOk → `enviado_geclisa`. QR → foja sin autollenar. Parsers de estudios.

**No hacer salvo pedido:** cifrado `af_i_*` / export con clave (008 E–F, no hay código). Sync E2E. RPCs `af_paciente_match` / `af_paciente_import` / `af_valoracion_update`. Flujos Allende/Córdoba. SQL 009. No “arreglar” shares.

*Fuente código: `main` @ `6d16398`.*
