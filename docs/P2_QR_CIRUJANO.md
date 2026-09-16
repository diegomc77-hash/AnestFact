# P2 — QR cirujano / `fojaQx` (diseño confirmado)

**Estado (2026-09-16):** Paso 1–2.1 CERRADOS en prod. **Paso 2.2 en curso**
(formulario+firma+`af-qx-submit`+pull). A–E OK Diego. Parte 1 SQL local
(`022_foja_qx.sql`) — sin apply prod aún.

Índice: `docs/ESTADO_PROYECTO.md` · Marco: `docs/ROADMAP_ESCALAMIENTO.md`.

---

## Principio

Misma arquitectura que el QR de valoración del paciente (token,
contexto, sync con dedup), **canal paralelo**. No tocar `af-qr-*` /
`valoracion.html` / `js/31-valoracion-qr.js` / sync preop.

`fojaQx` es **herramienta independiente** de la suite AnesFact (junto a
evweb, GECLISA, Traditum) — entidad hermana de `foja`, **no** sub-función
del editor anestésico. El botón desde foja abierta es solo el primer
incremento de entrada; dock / pantalla de suite = después.

---

## Decisiones cerradas (Huerta)

### Clínicas / producto (2026-09-15)

1. Cabecera: especialidad **visible**.
2. Nombre: `fojaQx` (`S.cur.fojaQx`).
3. QR: **un solo uso** por intervención (criterio Mayo preop).
4. Generación QR: solo desde **foja abierta** (no lista Home).
5. Firma: en el **celular** del cirujano (QR); foja sellada sin firma
   posterior en la app.
6. Institución: **heredada del token**; sin selector al escanear.

### Alcance por institución (2026-09-16)

| Institución | `fojaQx` | Rol |
|---|---|---|
| Aeronáutico | **activo** desde Paso 1 | Documentación + paquete facturación AnesFact (evweb) cuando corresponda |
| Hospitales públicos (SISalud) | **activo** desde Paso 1 | Solo documentación; **sin** circuito de cobro |
| Mayo | **no activo** ahora | Qx real sigue GECLISA; flag off |

Gating = **flag configurable por institución** (p. ej. en
`AF_FOJA_INST`), **no** `if (san === 'Hospital Aeronáutico')`. Deja
puerta abierta a una «AnesFact versión cirugía» que algún día llegue a
Mayo sin rehacer el gating.

### Entrada Paso 1 / id / stub (Diego + Huerta)

- Entrada: **solo botón** en foja abierta (Aero + públicos). Dock después.
- Id de vista: `fojaQx`.
- Stub tipado: `{ version: 1, slots: {}, texto: '', firmada: false }`
  (campos mínimos; se amplían en pasos siguientes).

### Sync / export

Incluir `fojaQx` en payload hacia Supabase **solo** si la institución
tiene el flag habilitado. Mayo (u otras off): no viaja — evita tráfico
inerte.

---

## Flujo (resumen)

| Quién | Qué |
|---|---|
| Huerta (app, foja abierta, inst. habilitada) | Genera QR → token con sanatorio, especialidad, cirujano, Dx/op, `inter_id` |
| Cirujano (móvil) | Cabecera (especialidad visible) → proformas → **firma en QR** → submit |
| App | Sync → `S.cur.fojaQx` (dedup); sellada; print / `docs.qx` donde aplique facturación |

Piezas nuevas tentativas: `af-qx-create` / peek / submit + página
pública + sync dedicado. **Intacto:** tubo `af-qr-*` preop.

---

## Orden de implementación (tras gate §8 OK Diego)

1. Modelo `fojaQx` + vista cáscara (Aero + públicos; Mayo off por flag) —
   sin QR.
2. Create / submit / página cirujano (mínimo).
3. Sync + dedup + sellado por firma móvil.
4. Filtro catálogo + match operación.
5. Print + `docs.qx` donde corresponda facturación (Aero; no públicos).
6. Ampliar instituciones vía flag (p. ej. Mayo) sin rehacer motor.

Contrato compartido (`MAPA_SECCIONES.md`): OK explícito antes de tocar
`js/01-state.js` / intervenciones / sync.

---

**Pendiente futuro (escalabilidad; no implementar ahora):** cirujano
iniciando foja quirúrgica sin intervención previa de anestesia — ver
nota en `docs/ROADMAP_ESCALAMIENTO.md` § P2. Hoy fojaQx sigue atada a
intervención nacida del flujo anestesia.

## Paso 2.2 (en curso)

A–E confirmados (cáscara completa sin CIE; sin proformas; canvas+MP;
pull+sync misma entrega; contrato sync con diff literal + smoke «prueba»).

- Parte 1: `022_foja_qx.sql` — **aplicada en prod** (tabla + RLS).
- Parte 2 (código local): `af-qx-submit`; peek con `hora_ini`/`hora_fin`;
  create contexto desde app con horas.
- Parte 3 OK Diego: `foja-qx.html` form+canvas+submit; TTL foja_qx **7 días**.
- Parte 4 (código local): `js/43-foja-qx-sync.js` pull → `S.cur.fojaQx`;
  omite `firma.png` en sync nube; hook initApp + al abrir fojaQx.
  **`js/17-sync-export.js` sin cambios** (usa `afIntervsPayloadForSync` ya existente).
- **Pendiente:** bump CACHE_V + deploy Edge (`af-qx-submit`, `af-qx-peek`,
  `af-qx-create` 7d) + Pages + smoke «prueba».

## Paso 2.1 (cerrado)

- Reutiliza `anesfact_qr_tokens` con `contexto.modo = 'foja_qx'`.
- Edge nuevas: `af-qx-create`, `af-qx-peek`.
- Edge valoración endurecidas (misma entrega): `af-qr-peek` /
  `af-qr-submit` / `af-qr-create` rechazan tokens `foja_qx`.
- UI: botón «QR cirujano» + modal; stub público `foja-qx.html`.
- Al regenerar: invalida tokens `foja_qx` previos del mismo `inter_id`.

## No hacer aún

- No motor de proformas / slots / CIE (después de 2.2).
- No inicio independiente de fojaQx sin intervención de anestesia
  (pendiente suite completa; ver ROADMAP).
- No cambiar el flujo de valoración preop más allá del filtro de modo.
