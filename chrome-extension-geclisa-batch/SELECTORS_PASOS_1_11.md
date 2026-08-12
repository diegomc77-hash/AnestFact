# Selectores — pasos 1–12 (código v0.4.0)

Paciente prueba fill: **Lucero / Joaquín Jesús**. Sin Guardar.

## Paso 12 — fill.js

1. Tras plantilla abierta, wait `#8054` en algún frame.
2. Inyectar `globalThis.__AFG_GECLISA_TOKEN` + `__AFG_FILL_SILENT` (MAIN world, top).
3. Ejecutar `vendor/fill.js` (copia empaquetada; mismo mapeo que prod).
4. Poll `__AFG_FILL_RESULT` → `{ ok, camposOk, fechaCirugia, horaInicio }`.
5. Popup: **«Foja completada, revisá y guardá manualmente»**.

Token (prueba): pegar en popup el de AnesFact «Enviar a GECLISA».  
Clínico en foja: `fechaCirugia` / `horaInicio` del **payload del token** (nunca fecha de ingreso del modal).

## Separación

| Dato | Uso |
|------|-----|
| Fecha de ingreso (modal GECLISA) | Solo panel / Opciones |
| fechaCirugia / horaInicio (token) | fill.js → campos clínicos |
