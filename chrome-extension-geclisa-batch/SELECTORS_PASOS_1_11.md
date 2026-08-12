# Selectores — pasos 1–12 (código v0.4.6)

Sin Guardar. **Sin modal** `#btnBuscarPaciente`.

## Búsqueda (panel internados)

1. `#ddlUbicacion` = `2` (Sanatorio Mayo)
2. `#ddlSector` = sector AnesFact (texto exacto, ej. `UTI`, `PRE-QUIRÚRGICO`)
3. Fecha = `fechaCirugia`, Hora = `horaInicio`
4. Click **Consultar** (no Buscar Paciente)
5. Ubicar fila por apellido/nombre en el grid
6. Reintentos: hora −1 h mismo sector → otros sectores
7. Pausa con combinaciones si no hay fila; sin clicks a ciegas
8. Opciones → Evoluciones → Nuevo → plantilla → fill.js

| Dato | Uso |
|------|-----|
| sector / fechaCirugia / horaInicio | Filtros panel + Consultar |
| fechaCirugia / horaInicio (token) | fill.js clínico |
