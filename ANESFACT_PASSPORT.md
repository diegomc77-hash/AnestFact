# AnesFact — Pasaporte técnico

PWA de fojas anestésicas (Aero + Mayo/GECLISA). Repo `diegomc77-hash/AnestFact`. Prod: `https://diegomc77-hash.github.io/AnestFact/`. Cache/SW **v12.21**, UI v8.5. Dueño `diegomc77@gmail.com`. Uso clínico: Dra. Huerta.

---

## 1. Stack técnico

Vanilla JS, sin bundler. `index.html` carga `seguridad.js` (solo GitHub Pages + localhost) → `supabase-keepalive.js` → `load-scripts.js` (~50 JS, bust `?v=12.21`) → `load-views.js` (HTML por vista). PWA: `sw.js` + `manifest.json`.

| Área | Archivos |
|------|----------|
| Núcleo | `js/00-env`, `01-state` (`S`), `06-nav-core` (`go`/`toast`), `07-intervenciones`, `08-foja` |
| Aero | `12-imprimir-aero`, `16-vitals-grid` (`VG`) |
| Mayo/GECLISA | `19-examen-mayo`, `20-geclisa-send`, `39-geclisa-queue`, `fill.js` v13, extensión Chrome **0.5.5** |
| Clínica | `21-metodos` (38 KB), `22-tecnica` (35 KB), `23-reglas-clinicas` + `data/reglas-clinicas.js` |
| Cuenta | `28-auth`, `29-plans`, `30-admin`, `35-sanatorios-plan`, `36-identidad`, `37-firma`, `38-sesiones` |
| QR preop | `31-valoracion-qr`, `40-valoracion-preop-sync`, `valoracion.html` + Edge Functions |
| Datos | `data/nomenclador.js` (174 KB), cirugías, drogas, cirujanos, obras sociales |

**Servicios:** Supabase proyecto `xntvibfsuubedplptvzs` (Auth, Postgres, Edge; **anon key pública**, datos vía RLS). GitHub Pages + Action keepalive 08:00/20:00 UTC. GECLISA `http://sanatoriomayo.myvnc.com:84/`. Apps Script **apagado** (fuga entre usuarios). `S.key` / `af_k` = API key opcional de escaneo IA.

**SQL:** 001–006 + **007b** (no el 007 con shares) + 008a/008 (token/firma/sesiones). **009** no ejecutar hasta inventario legacy vacío.

---

## 2. Estructura de datos

**`anesfact_usuarios`:** id→auth.users, email, nombre, matricula, matricula_especial, plan, rol, activo, fojas_semana, semana_reset, sanatorios_permitidos[], firma_png, firma_certificada_at, firma_matricula_snapshot. RLS propio/admin. Trigger: no auto-pro; firma certificada inmutable.

**`anesfact_datos`:** clave, datos (JSON texto), owner_id, expires_at. Sync `anesfact_sync_<uid>` solo dueño. Help `anesfact_help_*` insert user / read admin. Anon: solo puente no-sync con TTL. Payload: `{intervs, cirujanos, key, guardado, version, total}`.

**`anesfact_geclisa_tokens`:** token hex 48, paciente_ref, payload jsonb, expires +2 h, used_at. REST deny-all; RPC create (auth) / consume (anon, 1 uso).

**`anesfact_sessions`:** UNIQUE(user_id, device_type pc|mobile) — 1 PC + 1 móvil.

**QR:** `anesfact_pacientes` (nombre_enc, dni_enc, dni_hash, UNIQUE owner+hash; INSERT solo Edge). `anesfact_qr_tokens`. `anesfact_valoraciones` (jsonb A–F, asa_sugerido, alertas, motivo/resultado, estado; INSERT Edge). `anesfact_foja_vinculos` UNIQUE(owner, interv_id). **No usar** `anesfact_shares`.

**Estado `S`:** `{ intervs[], cur, hist:['home'], recog, recField, pendFiles[], key, signData, vitals[] }`. Foja: `id` (timestamp; QR=`preop_<uuid>`), `estado` (borrador|listo|enviado|enviado_geclisa|preoperatorio), `fecha,hora,pac,edad,sexo,dni,peso,ciru,serv,diag,san,sala,cama`, Mayo `mayo_sector/cama/quir/tipociru/posicion`, `obra,afil,docs,ob,env,pracs[],owner_id,_ts`, QR opcional `paciente_id,valoracion_id`. `foja{}`: tec*, asa, via, fin, tubo, ind, hint/hext, premed, atb, metodos, recup, obs, examen, mallampati, aldrete/bromage/ramsay, fluidos, antecedentes[], drogas[{n,d,v,grupo,causa}], vitals, sign, **vg_***, **aero_***, tiva, gases, mayo_vitals[], mon_*. Local: `af_i_<uid>`, tombstones `af_deleted_intervs_<uid>`.

**`VG` (Aero):** `{ cols:[{t:'HH:MM'}] c/5 min, cells:{'ci_val':{param,sym,color,val?}}, obs, fluidos, activeParam }`. Params: resp, pulso, ta, oximet, co2, operac, anest. Y=12.5–200.

**Clave paciente (token GECLISA):** DNI 7–9 dígitos sin ceros a la izq. → si no, `APELLIDO_NOMBRE_AAAAMMDD` (máx 20) → `sin_id_AAAAMMDD`. Localhost: prefijo `DEV_`. Es `p_paciente_ref` (no va en URL). El payload del token **sí** lleva DNI/nombre reales.

---

## 3. Límites actuales

Módulos grandes: nomenclador 174 KB; metodos 37; tecnica 35; valoracion-form 38; sync 26; intervenciones 22; queue 21; geclisa-send/imprimir ~20; fill.js 18. Extensión ~136 KB JS.

| Acción | Requests a Supabase |
|--------|---------------------|
| Abrir app (logueado) | keepalive + refresh JWT + GET perfil (+PATCH email) + GET plan + `af_register_session` + GET valoraciones (≤40) + GET sync |
| Guardar foja | 0 inmediato; debounce ~2,5 s: **GET sync + UPSERT de toda la lista** |
| 1.er save demo | + PATCH `fojas_semana` |
| Enviar GECLISA | `af_assert_plan` + `af_geclisa_create_token` |
| Bookmarklet | `af_geclisa_consume_token` (anon) |
| Heartbeat | `af_check_session` c/45 s |

Foja típica sin fotos **8–25 KB** JSON (VG 2 h +3–8 KB). Firma canvas +20–80 KB. 3 docs data-URL **0,5–3 MB**. Sync escribe **todas** las fojas en una fila; con adjuntos se choca localStorage (~5 MB) y el tamaño de fila.

---

## 4. Seguridad y acceso

Email/password Supabase; JWT en `Authorization`. Owner: RPC `af_claim_owner_admin` solo ese email. Fuente de planes: RPC `af_assert_plan`.

| Plan | Qué incluye |
|------|-------------|
| **demo** | 1 foja/semana; sin imprimir ni GECLISA; solo Hospital Aeronáutico; watermark secreto médico |
| **basico** | Fojas + imprimir + GECLISA; Aero + Sanatorio Mayo |
| **pro** | Igual + Clínica Allende + Clínica Privada Córdoba |
| **bloqueado** | Nada |
| **admin** | Como pro + panel planes/usuarios; **no** lee fojas ajenas (post-008) |

Pedido de plan = ticket `anesfact_help_*`. Facturación fuera de la app. PII QR cifrada en Edge (`AF_ENCRYPTION_KEY`, `APP_PII_SALT`).

---

## 5. Módulos y sus interfaces

Contrato global: `S`, `VG`, `AF_ENV`, `AF_AUTH` (signIn/Up, token, uid, isLoggedIn), `USER_PLAN`/`USER_PROFILE`/`USER_IS_ADMIN`, `go`/`toast`/`guardar`/`guardarFoja`, `checkPlan`/`assertPlanServer`.

| API | Expone | Necesita |
|-----|--------|----------|
| `AfIdentidad` | get, firmaHtml | USER_PROFILE |
| `AfSanatoriosPlan` | list, filterSelect, assertCurrent | plan |
| `AfFirma` / `AfSesiones` | PNG certificada; 1 PC+1 móvil | RPC 008 |
| `AfCaptureGuard` | overlay anti-captura | demo/bloqueado |
| `afMintGeclisaToken` + cola | token + payload clínico | plan geclisa, `S.cur` |
| `afSyncValoracionesPreop` | cards Home preop | JWT + valoraciones |
| `getAlertasClinicas` | panel reglas | `REGLAS_CLINICAS`, `S.cur` |

Vistas: home, nueva, foja, facturacion, nom, geclisa, resumen, config, escanear, ayuda, admin. Foja partida: tiempos, mayo-quir, tecnica, drogas, metodos, mayo-geclisa, vitals, fluidos, recuperacion, observaciones, firma, acciones.

---

## 6. Lo que no se puede tocar

- `fill.js` y mapeo de IDs GECLISA; `imprimirFoja` / impresión Aero.
- `guardarFoja` / `guardarFojaVG` (no perder `vg_*`). Tombstones de borrado (sync no resucita fojas).
- Triggers de plan/firma y RLS sync-solo-dueño.
- QR: `paciente_id`/`valoracion_id` opcionales; no `resetFojaUIDom()` al importar; no pisar campos ya llenos.
- Aero: solo quirófanos 1–3. Alertas anticoag/alergia: **avisar, no indicar suspender**. DNI AR 7–9: warning, no bloquea.

**IDs GECLISA (ancla `#8054`):** 8027/28/31 apellido/nombre/DNI · 8049 Qx · 8050 tipo · 8054 dx · 8057 anestesista · 8058 fecha · 8061/63 inicio/fin **HH:MM:SS** · 8065 cirujano · 8067 posición · 8070 métodos · 8072 nivel regional · 8075 texto monitoreo · 8077 medicamentos · 8079 materiales · 8083/85 edad/peso · 8088 examen · 8090 ASA · 8091 emergencia · radios EtCO2 8095/96, PAM 8099/00, ECG 8103/04, SAT 8107/08, PANI 8111/12, DECUB 8115/16 · 8119 premed · 8121 inducción · 8123 mantenimiento · grilla 5–240 min (SIST 8134…8319 + pares diast/sato2/eco2/fc/pam) · balances 8448–8455 · recup 8458 · obs 8460 · `txtFechaGestion`/`txtHoraGestion`.

**Reglas clínicas (ayuda, no protocolo):** contextos IRC / IC-cardio / CEC / anticoag. Evitar AINE+aminoglucósidos en IRC; pancuronio en cardio; precaución propofol/morfina/succinilcolina.

---

## 7. Estado actual de desarrollo

**Terminado.** Foja Aero (gráfico, impresión, 3 Qx + nómina) y Mayo (técnica, vitales, fill). Auth, planes, admin. Sync por uid + tombstones. Token GECLISA 1 uso + cola + extensión. Firma y sesiones (código listo; hace falta SQL 008 en el proyecto). QR Mayo Etapa 1 (un uso, 48 h, cards Home, DNI completo al clínico, alertas). Bromage/Ramsay. Keepalive.

**En progreso.** Cola GECLISA (mint on-demand, fillOk → `enviado_geclisa`). Valoración QR → foja (vínculo opcional, sin autollenar). Parsers de estudios.

**Pendiente.** Cifrado at-rest de `af_i_*` y export con clave (008 E–F, **no hay código**). Sync E2E. RPCs `af_paciente_match` / `af_paciente_import` / `af_valoracion_update`. Flujos Allende/Córdoba. Migración 009. Confirmar en Supabase que está **007b+008**, no el 007 con shares.

*Fuente: `main` @ `6d16398` (ago 2026).*
