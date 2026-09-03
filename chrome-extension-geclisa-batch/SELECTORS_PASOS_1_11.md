# Selectores — pasos 1–12 (código v0.4.8)

Sin Guardar. **Sin modal** `#btnBuscarPaciente`.

## Búsqueda (panel internados)

1. `#ddlUbicacion` = `2` (Sanatorio Mayo)
2. `#ddlSector` = sector AnesFact (texto exacto, ej. `UTI`, `PRE-QUIRÚRGICO`)
3. Fecha = `fechaCirugia` en `#txtFechaConsulta` (datepicker: `setDate` o flechas de mes + día; no solo tipeo). Hora = `horaInicio`
4. Click **Consultar** (no Buscar Paciente)
5. Ubicar fila por apellido/nombre en el grid (capa 1)
6. Reintentos: hora −1 h → otros sectores
7. Opciones → **Evoluciones** → leer encabezado `APELLIDO, NOMBRE - N° Atención: …`
   - Apellido exacto; nombre **tolerante** (esperado prefijo por tokens del real, p.ej. `DANIEL` ⊆ `DANIEL ALFREDO`)
   - Si no coincide → **PAUSA** (no toca Nuevo)
   - Si coincide → capturar `nroAtencion` del encabezado y seguir
8. Nuevo → plantilla → fill.js

| Dato | Uso |
|------|-----|
| sector / fechaCirugia / horaInicio | Filtros panel + Consultar |
| Nombre en fila panel | Capa 1 de seguridad |
| Encabezado Evolución | Capa 2 antes de Nuevo; captura N° Atención |
| fechaCirugia / horaInicio (token) | fill.js clínico |
