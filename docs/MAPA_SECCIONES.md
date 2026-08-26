# Mapa de secciones AnesFact

Las reglas por glob se activan al tocar archivos. Si el chat es temático y no hay archivos abiertos, leé la sección acá y `@` la regla correspondiente.

**Versiones:** no las copies de memoria. Corré `node tools/check-version-sync.mjs`.

## Contrato compartido — parar y avisar antes de tocar

Ninguna sección es dueña de estos archivos. Un cambio acá puede romper QR, foja, GECLISA y caché a la vez.

| Archivo | Por qué es de todos |
|---|---|
| `sw.js`, `js/load-scripts.js`, `js/load-views.js`, `js/24-sw-register.js` | Precache + `CACHE_V`. Si agregás un script/vista, va en **ambos** lados. |
| `index.html`, `valoracion.html` | `?v=` local = `CACHE_V`. El checker falla si no. |
| `js/01-state.js` (`S.cur`) | Estado de foja. QR importa acá; GECLISA lee acá. |
| `data/valoracion/alertas-seguridad.js` | Helper único paciente + Home. No reimplementar. |
| `data/medicacion-habitual.js`, `data/cirujanos-esp.js` | Catálogos usados por QR y foja. |
| `supabase/functions/_shared/*` | QR submit, tokens, CORS. Backend de más de una sección. |

Tres detectores de alertas distintos — no fusionarlos sin listar impacto:

- `data/valoracion/alertas-seguridad.js` — anticoag/alergias (paciente + badge Home)
- `js/23-reglas-clinicas.js` — alertas de foja
- `supabase/functions/_shared/rules.ts` — ASA/alertas al submit QR

## Secciones (un chat dueño a la vez)

| Sección | Dueña de | No es dueña de |
|---|---|---|
| GECLISA | `chrome-extension-geclisa-batch/**`, `fill.js`, `fill-dev.js`, `js/10-geclisa-ui.js`, `js/20-geclisa-send.js`, `js/39-geclisa-queue.js`, `views/geclisa.html`, `views/foja/mayo-geclisa.html`, bookmarklets `geclisa_*` | `fill.js` raíz = bookmarklet; `vendor/fill.js` = copia de la extensión. Confirmá cuál. |
| QR / valoración | `valoracion.html`, `js/valoracion-form.js`, `js/31-valoracion-qr.js`, `js/40-valoracion-preop-sync.js`, `data/valoracion/**`, `js/estudios/**`, `supabase/functions/af-qr-*`. Doc: `docs/VALORACION_QR.md` | Importar a foja: solo campos vacíos, nunca `resetFojaUIDom()`. |
| Sync / backend | `supabase/**`, `js/17-sync-export.js`, `js/28-auth.js`, `js/00-env.js`, `js/supabase-keepalive.js` | Deploy Edge ≠ push frontend. Confirmación por separado. |
| Multi-institución | `js/35-sanatorios-plan.js`, `data/valoracion/cfg-instituciones.js`, `js/12-imprimir-aero.js`, `js/19-examen-mayo.js`, `js/29-plans.js` | Cirujanos (`data/cirujanos-esp.js`) es contrato compartido. |
| Deploy / versionado | bump de `CACHE_V` y listas SW. Checker obligatorio. | Títulos UI (`AnesFact v8`) no son `CACHE_V`. |
| Foja / PWA core | `js/08-foja.js`, `js/07-intervenciones.js`, `views/foja/**`, drogas/vitals/nomenclador/técnica | `S.cur` vive en `js/01-state.js` (contrato). |

## Semáforo

Antes de laburar: casillero **En curso** en `docs/ESTADO_PROYECTO.md`. Si otra sección está locked, no toques sus archivos ni el contrato.
