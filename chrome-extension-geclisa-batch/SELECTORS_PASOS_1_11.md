# Selectores — pasos 1–12 (código v0.4.4)

Sin Guardar. Panel internados: **fechaCirugia + sector + horaInicio** (no fecha de ingreso).

## Separación de datos

| Dato | Uso |
|------|-----|
| N° Atención (modal búsqueda) | Ubicar fila tras filtros |
| fechaCirugia / horaInicio / sector (AnesFact) | Filtro panel `#ddlSector` + Fecha/Hora |
| fechaCirugia / horaInicio (token) | fill.js → campos clínicos |

## Paso 7a — reintentos panel

1. `fechaCirugia` + sector foja + `horaInicio`
2. misma fecha/sector, hora −1 h
3. misma fecha + horaInicio, otros sectores: PISO → VIP → UTI → UTI2 → UCI → GUARDIA → HOSPITAL DE DIA → HEMODINAMIA VIRTUAL → PRE-QUIRÚRGICO (sin repetir el primario)
4. Si nada → pausa con combinaciones; sin clicks a ciegas

Selector sector: `#ddlSector` (texto exacto del option).

## Paso 12 — fill.js

Token → `__AFG_GECLISA_TOKEN` + `vendor/fill.js`. Popup: revisá y guardá a mano.
