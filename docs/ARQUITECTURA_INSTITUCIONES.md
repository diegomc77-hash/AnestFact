# Arquitectura instituciones (evweb / GECLISA / SISalud)

Brief cerrado 2026-08-27. Semilla SQL **010** aplicada en el proyecto Supabase linked (solo catálogo; la PWA no lo lee todavía). El código de producción sigue siendo 2 caminos por nombre (`Sanatorio Mayo` vs `Hospital Aeronáutico` + `indexOf('aero')`).

## Tres patrones (no dos)

| Patrón | Confirmado | Qué es | Ejemplo |
|---|---|---|---|
| 1. Con GECLISA | sí | HC vive en Geclisa (fuente de verdad) | Sanatorio Mayo |
| 2. Con sistema propio | sí | Foja en ejecutable local viejo → se inyecta en la app web in-house | Sanatorio Allende (`app.sanatorioallende.com`). N sistemas, no un solo “Allende” |
| 3. Sin sistema digital propio | sí (Aero); público a confirmar carga | Foja AnesFact A4 / PDF / foto | 3a Aeronáutico → **evweb**. 3b hospitales públicos/provinciales → **SISalud** |

3a y 3b comparten plantilla de foja; **no** comparten destino.

## Ajuste al pedido de campos (punto 2)

Si `destino_final` va **aparte**, `tipo_sistema` **no** debe llevar `sin_sistema_evweb` / `sin_sistema_sisalud`: eso vuelve a mezclar las dos dimensiones.

### `tipo_sistema` — catálogo extensible (tabla, no enum en JS)

Cómo se produce / dónde vive la foja clínica:

- `geclisa`
- `sistema_propio`
- `sin_sistema` — papel / AnesFact A4 / PDF-foto
- `a_confirmar` — default del listado aún no desarrollado

Valores nuevos = filas en `af_tipo_sistema`, no `switch` hardcodeado.

### `destino_final` — catálogo aparte

A dónde se **entrega** (marca local hoy; integración después):

- `geclisa`
- `evweb`
- `sisalud`
- `sistema_propio`
- `a_confirmar`

| Institución | tipo_sistema | destino_final |
|---|---|---|
| Sanatorio Mayo | `geclisa` | `geclisa` |
| Sanatorio Allende | `sistema_propio` | `sistema_propio` |
| Hospital Aeronáutico | `sin_sistema` | `evweb` |
| Hospital Córdoba (y resto público) | `sin_sistema` | `sisalud` |
| Resto del listado | `a_confirmar` | `a_confirmar` |

### Entidad `Institución` (mínimo)

- `id` estable (`mayo`, `allende_cerro`, `aeronautico`, `h_cordoba`, …)
- `nombre` (display)
- `nombre_aliases` — hoy el plan dice `Clínica Allende`; el brief dice **Sanatorio Allende**
- `tipo_sistema` → FK al catálogo
- `destino_final` → FK al catálogo
- `meta` **jsonb** — solo para `sistema_propio` (y extras de print). No columnas fijas por sanatorio
- `red_id` + `sede` opcionales (La Cañada: una red, varias ciudades)
- `ambito`: `publico` / `privado` / `otro`
- `localidad`, `activo`, `desarrollado` (false hasta que haya flujo)

`meta` ejemplo Allende (sin implementar el flujo):

```json
{
  "portal_url": "https://app.sanatorioallende.com",
  "carga_local": "exe_legacy",
  "inyeccion": "a_confirmar"
}
```

`meta` ejemplo print A4 (`sin_sistema`):

```json
{
  "plantilla": "a4_papel",
  "header": {
    "logo_id": "provincia_cba",
    "titulo": "Hospital Córdoba"
  }
}
```

Aero puede usar el mismo `plantilla: a4_papel` con `logo_id` propio o null + `titulo: "Hospital Aeronáutico"`.

## ¿El header de la A4 alcanza? (hospitales públicos)

**Casi sí, no es rediseñar la plantilla.** `js/12-imprimir-aero.js` ya es una sola hoja A4 (`FOJA DE ANESTESIA` + gráfico + firma). No hay encabezado de institución hoy: solo el `h1`. Parametrizar un bloque header (logo + nombre) es el cambio de plantilla.

Lo que **no** es “solo el header” y conviene tenerlo en `meta` / `destino_final`, sin tocar el cuerpo clínico:

- El pie de firma dice **«Anestesiólogo/a · ADAARC»** (`js/36-identidad-anestesista.js`). ADAARC es el circuito evweb; en SISalud probablemente no va. Eso es una línea del pie, no otra foja.
- Sala/cama de Aero están hardcodeadas en `views/nueva.html`. Un público puede usar los mismos campos libres o un catálogo chico por institución; no obliga a otra plantilla A4.
- Logo: un archivo Provincia de Córdoba + el **nombre** del hospital cubre el listado público. No hace falta un SVG por hospital para arrancar.

Conclusión: **misma plantilla A4**, header parametrizable + pie/colegio según `destino_final`. No clonar `imprimir-aero.js` por hospital.

## Pendiente (no investigar ahora)

**Cómo se sube la foja/PDF a SISalud** (¿portal con login? ¿mismo patrón que Geclisa sin API pública? ¿otra cosa?). Abrir ese frente cuando se ataque un hospital público en serio.

## Semilla de catálogo (todas Córdoba)

`desarrollado=false` salvo Mayo y Aero. Allende: patrón confirmado, flujo **no** desarrollado.

### Públicos Capital — patrón SISalud (`sin_sistema` / `sisalud` cuando se confirme)

Hospital Córdoba, Hospital Nacional de Clínicas, Hospital Misericordia, Hospital Rawson, Hospital Tránsito Cáceres de Allende, Hospital San Roque, Hospital de Niños Santísima Trinidad, Hospital Pediátrico del Niño Jesús, Hospital Materno Neonatal, Hospital Materno Provincial, Hospital Neuropsiquiátrico, Instituto del Quemado.

### Públicos interior — SISalud a confirmar

Hospital Domingo Funes (Punilla), Hospital Romagosa (Deán Funes), Hospital Arturo Illía (La Calera), Hospital Urrutia (Unquillo), Hospital René Favaloro (Huinca Renancó), Hospital Pedro Vella (Corral de Bustos), Hospital Garofalo (Villa Huidobro).

### Privados Capital

| Nombre | tipo / destino hoy |
|---|---|
| Sanatorio Mayo | `geclisa` / `geclisa` (desarrollado) |
| Sanatorio Allende | `sistema_propio` / `sistema_propio` (patrón sí, flujo no) |
| Hospital Privado Universitario | `a_confirmar` |
| Clínica Reina Fabiola | `a_confirmar` |
| Clínica Vélez Sarsfield | `a_confirmar` |
| Hospital Italiano de Córdoba | `a_confirmar` |
| Sanatorio Morra | `a_confirmar` |
| Sanatorio Francés | `a_confirmar` |
| Sanatorio del Salvador | `a_confirmar` |
| Sanatorio Aconcagua | `a_confirmar` |
| Clínica Chutro | `a_confirmar` |
| Hospital Ferreyra (ex Hospital Español) | `a_confirmar` |
| Clínica Privada Córdoba | `a_confirmar` (está en el plan Pro de Huerta; no salía en el listado web) |

Más: Hospital Aeronáutico = `sin_sistema` / `evweb` (desarrollado para print + marca evweb).

### Red interior — sistema a confirmar

Sanatorio de la Cañada: Córdoba Capital, Villa María, Río Tercero, Cruz del Eje, Cosquín, Capilla del Monte. Una `red_id`, una fila por sede.

## Qué no hacer todavía

- No implementar carga Allende, SISalud ni N instituciones en la UI.
- No copiar lógica Mayo “por las dudas” (`04-multi-institucion`).
- No hardcodear `if (san === 'Hospital Córdoba')` en JS: leer catálogo.
- Planes (`js/35-sanatorios-plan.js` / SQL) hoy filtran **nombres**. Cuando exista la tabla, filtrar por `id`.
