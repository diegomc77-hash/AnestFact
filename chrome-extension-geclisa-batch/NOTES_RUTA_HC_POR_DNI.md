# Ruta alternativa: Historias clínicas por DNI (no implementada)

**Estado:** documentada 2026-08-10 · **no implementar todavía**.  
**Prioridad actual:** conectar `fill.js` al flujo 1–11 existente (internados).  
**Confirmado con:** Ferreyra, Maximiliano — DNI `035870193` / `35870193` (ya dado de alta; el camino internados falló / no aplica).

## Por qué existe esta nota

El flujo actual (`Historias clínicas internados` → panel + Fecha de ingreso del modal) funciona con Lucero y Bescos **mientras siguen internados**. Ferreyra (alta / VIP) expone el límite: depende del panel de internados y de fecha/hora de ingreso.

Esta ruta busca por DNI en el padrón general → no exige internado activo.

## Mapa confirmado (capturas reales)

1. Sidebar → **"Historias clínicas"** (≠ **"Historias clínicas internados"** del flujo actual).
2. Pantalla con campo **D.N.I.** (arriba izq.) → escribir DNI → lupa al lado del campo.
3. Modal **"Búsqueda de Pacientes"** (≠ "Búsqueda de Pacientes internados"):
   - Campos: Apellido, Nombre, N° Documento, N° H. Clínica, Cód. O.S.
   - Sin filtro “solo internado activo”.
4. Buscar → fila → Seleccionar.
5. Vuelve a pantalla con **Datos Personales** cargados.
6. Filtro **Desde / Hasta / Área** (Área ≈ “Internado”; también Ambulatorio, etc.) → acota evoluciones.
7. Pestaña **"Antecedentes y Evolución"**.
8. Mismos paneles: Evoluciones | **Protocolos Quirúrgicos y Anestésicos** → **Nuevo** → Lista de Plantillas → `FOJA ANESTESICA 01_04_2022` → Seleccionar.  
   (= pasos 8–11 del mapa actual).

## Evaluación (cuándo conviene incorporarlo)

| Criterio | Flujo actual (internados) | Ruta HC por DNI |
|----------|---------------------------|-----------------|
| Paciente internado hoy | OK (Lucero, Bescos) | También OK |
| Paciente de alta / histórico | Frágil o imposible | **Diseñado para esto** |
| Complejidad código | Alta: ingreso modal, ±1 día, horas, N° Atención en panel | Menor en filtros; hay que mapear DNI + lupa + pestaña + Área |
| Dato requerido | Apellido/nombre (+ ingreso del modal) | **DNI** (AnesFact ya lo tiene) |
| Sector VIP / cambio sector | Auto al seleccionar internado | Irrelevante / otro modelo (Área) |

**Recomendación:** no migrar ahora. Después de fill.js + lote básico:

1. Prototipar esta ruta como **Plan B** (si internados pausa `internado_nro_not_found` / alta), o  
2. Si el lote real es mayormente post-alta / ambulatorio, evaluar como **entrada por defecto** y dejar internados solo si aporta algo (p. ej. atajo quirófano).

Al implementar: clicks trusted donde el inspector diga generic/no-focusable; botones nativos con click normal; **nunca** mezclar fecha de ingreso (nav) con `fechaCirugia`/`horaInicio` (clínico → fill.js).

## Relación con fill.js

fill.js sigue yendo al final, con payload clínico de la foja (`fechaCirugia`, `horaInicio`, etc.), independiente de cómo se llegó a la plantilla abierta.
