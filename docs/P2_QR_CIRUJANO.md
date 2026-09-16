# P2 — QR cirujano / `fojaQx` (diseño confirmado)

**Estado (2026-09-16):** Paso 1 **cerrado en código** (flag, stub,
cáscara, botón, sync omit). Pausado hasta prueba en vivo Dra. Huerta
(Aero/Córdoba). **Paso 2 (QR) no arranca** sin esa confirmación.

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

## No hacer aún

- No Edge / PWA / tablas hasta OK al gate §8 Paso 1.
- No modificar valoración preop.
- No hardcodear gating a un solo nombre de sanatorio.
