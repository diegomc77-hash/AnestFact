**Este documento es la fuente completa de la decisión de rediseñar Home por institución (no por foja). Antes de tocar este tema, leer todo el archivo — no asumir nada de memoria, ni el usuario ni el asistente.**

# Diseño Home — AnesFact (Opción A)

**Estado: diseño, no implementado.** Guía de intención para cuando se
aborde el desarrollo. No reemplaza ni contradice las correcciones
técnicas de la sección 8 (plan actual, GECLISA, bandejas, etc.).

Fuente de flujo: `docs/CIERRE_ARQUITECTURA_FACTURACION.md`.

---

## Estado actual — PC hoy (producción)

Revisado en `styles.css` (no es una impresión). En pantallas anchas **no hay
layout de escritorio**.

- `html,body` tienen `max-width: 520px` y `margin: 0 auto` (regla global,
  línea 12). Toda la PWA — Home, foja, Preop, Instituciones, dock — vive
  en esa columna.
- El único `@media (min-width: 520px)` del CSS de la app **no** suelta
  ese tope: solo mueve el banner de «instalar PWA» (`.af-install-banner`)
  a la esquina. No hay breakpoint de dos columnas, sidebar ni grilla PC.
- Dock y barra de foja están `position: fixed` centrados en el viewport
  (`left: 50%` + `translateX(-50%)`), con tope ~504px. En un monitor
  ancho quedan como la tira del celular, flotando al medio.

**Qué se ve:** el mismo layout del celular (una sola columna, pensada
para ~520px), centrada, con **espacio vacío a izquierda y derecha**. El
fondo (`--bg`) llena la ventana; el contenido no. El problema de PC no
es solo «falta el diseño nuevo»: **hoy la experiencia en escritorio es
mala** — app de teléfono en el medio de la pantalla.

`valoracion.html` (QR paciente) también está capado a 520px; es otra
superficie, mismo patrón.

Esto no cambia el orden de etapas (PC primero). Deja explícito *por qué*
esa etapa existe.

---

## 0. Visión / objetivo (aspiracional)

No implementar todavía. Guía de diseño a futuro.

**Especialidades.** La escalabilidad a otras especialidades (cirujanos,
anatomopatólogos) es un objetivo real, no descartado. La corrección de que
«plan solo Cirugía» no existe hoy como SKU es correcta **para el sistema
actual**, pero no cierra la puerta a un tipo de plan nuevo si el negocio
lo justifica. El diseño deja la puerta abierta (módulos agrupados por
especialidad: Anestesia / Cirugía / lo que se sume) **sin construir el
SKU ahora**. Hoy los planes son cupo de lugares (Demo / Básico / Max /
Pro), no de especialidad.

**Institución primero, PC y móvil.** El rediseño de «elegir institución
primero» se quiere para **PC y para móvil**, no solo escritorio. Se sigue
haciendo por **etapas: PC primero**; la meta final es la misma lógica en
ambos. El móvil actual no se toca hasta su etapa.

**Home no es solo un lanzador.** Las baldosas de módulo son atajos. El
peso de la columna derecha, cuando se construya, son las **bandejas de
trabajo** de esa institución (preop, fojas, colas, listos a destino). Ver
sección 8.

**Herramientas globales** (todas las instituciones): Ayuda y Ajustes, en
el header. No dependen del lugar.

---

## 1. Layout general

Dos columnas dentro de un contenedor con borde redondeado:

```
┌──────────────────────────────────────────────────────────┐
│ AnesFact (verde) · Dra. Huerta            Ayuda  ⚙️        │  ← header fijo
├───────────────┬──────────────────────────────────────────┤
│ Instituciones │  [Nombre institución]                     │
│               │  Módulos disponibles en tu plan            │
│ ● Mayo        │                                            │
│   Aeronáutico │  Anestesia                                 │
│   + Pedir     │  ┌────────┐ ┌────────┐ ┌────────┐         │
│     lugar     │  │ Foja   │ │ QR     │ │ dest.  │         │
│               │  └────────┘ └────────┘ └────────┘         │
│               │                                            │
│               │  (filas de especialidad futuras)          │
│               │                                            │
│               │  Bandejas / lista de esa institución      │
├───────────────┴──────────────────────────────────────────┤
│ ℹ️ AnesFact es una herramienta complementaria: no          │  ← leyenda fija
│    reemplaza el criterio médico. Respeta secreto médico.  │
└──────────────────────────────────────────────────────────┘
```

- **Columna izquierda (220px fija)**: lista de instituciones del
  profesional. La activa se marca con borde de color propio + fondo
  levemente resaltado. Al final, **pedir lugar** (Ajustes / cupo de
  plan), no un alta libre de 40 hospitales.
- **Columna derecha (flexible)**: nombre de la institución activa;
  atajos de módulo por especialidad; debajo, bandejas/lista.
- **Header fijo**: siempre visible.
- **Footer fijo**: leyenda legal, siempre visible, nunca detrás de un
  click. Redacción exacta: abogado (Términos).

Navegación de módulos: `go(vista)` a pantallas existentes. Sin rutas
nuevas ni links hardcodeados.

---

## 2. Colores

- **Marca AnesFact**: verde `#22c55e`, fijo en el header, no cambia.
- **Cada institución tiene acento propio** (`:root` `--san-*`, paleta
  PWA 12.54), usado en punto de la lista, borde del ítem activo y punto
  del título a la derecha:

  | Institución | Variable | Hex |
  |---|---|---|
  | Sanatorio Mayo | `--san-mayo` | `#0ea5e9` |
  | Hospital Aeronáutico | `--san-aero` | `#8b5cf6` |
  | Hospital Córdoba | `--san-cordoba` | `#2563eb` |
  | Hospital Misericordia | `--san-misericordia` | `#c026d3` |
  | Hospital San Roque | `--san-san-roque` | `#0d9488` |
  | Sanatorio Allende | `--san-allende` | `#db2777` |
  | Otros | `--san-otro` | `#64748b` |

  Mayo y Aero son anclas (no reaprender). Allende está en paleta; el
  flujo `sistema_propio` sigue fuera de alcance.
- Íconos de **módulo** en verde de marca, no en color de institución:
  se distingue «esto es AnesFact» de «esto es tal lugar».

---

## 3. Herramientas por institución (matriz de intención)

Afila la versión anterior. Qué se **muestra** en Home según el lugar.
Módulos `*` = no construidos o bloqueados; el layout deja el hueco.

Tres QRs distintos (no un solo botón «QR»): preop paciente · recepción
de PDFs de mutual · QR al cirujano. Ver cierre de facturación.

| Institución | HC de fondo | Herramientas en Home | Destino de entrega |
|---|---|---|---|
| **Sanatorio Mayo** | GECLISA (inyección **siempre**, independiente de mutual) | QR preop · Foja · **GECLISA** (siempre visible) · **evweb** (ramificación por mutual **interna**, no un badge único en la baldosa) | evweb ADAARC |
| **Hospital Aeronáutico** | Ninguna (foja nativa AnesFact) | Foja anestésica · Foja quirúrgica* · QR al cirujano* · Escaneo de autorizaciones* · evweb · Consentimientos* (bloqueado legal) | evweb ADAARC |
| **Públicos** (Córdoba / Misericordia / San Roque) | SISalud (no GECLISA) | QR preop · Foja anestésica · **Foja quirúrgica*** · **QR al cirujano*** · **SISalud** (no se llama evweb) · Consentimientos* (mismo bloqueo legal) | SISalud |

`*` = requisito de producto **pendiente de construir** (o bloqueado
legal, en consentimientos). Mismo marcador y **mismo nivel** en Aero y
en públicos: foja quirúrgica + QR al cirujano no son un extra. Van a
SISalud (públicos) o evweb (Aero) junto con el resto cuando existan.
Detalle: `docs/CIERRE_ARQUITECTURA_FACTURACION.md`.

**Etiqueta del destino.** No usar «Facturación» igual en todos. Privadas:
**evweb**. Públicos: **SISalud**.

**Estado de evweb / Traditum.** Es por **caso × mutual**, no por
institución. La baldosa no lleva un solo paso («Esperando autorización»).
Sí puede llevar **contadores** (ej. 3 listos evweb · 1 Traditum · 2
esperando auth). El detalle vive en cada foja / bandeja.

Ramificación Mayo (dentro de evweb, no en la etiqueta de la baldosa):

- PAMI: 2 fojas desde GECLISA, sin autorización aparte.
- ART / obras: fojas GECLISA + autorización (QR recepción o docs).
- APROSS: Traditum primero (login de la doctora); después evweb.

**Mayo y Cirugía nativa.** La foja quirúrgica de Mayo se **baja de
GECLISA**; no hay editor AnesFact ni QR al cirujano en ese lugar.
«Evolución» no está definida en el cierre: no dibujarla hasta que exista
producto.

**Allende / sistema_propio:** no entra en esta matriz hasta que haya
flujo.

---

## 4. Elementos globales (no dependen de institución)

- **Ayuda**: header, junto al nombre del profesional.
- **Ajustes** (⚙️): idem.

---

## 5. Escalabilidad

- **Una sola institución** (p. ej. Demo): no hay paso «elegí
  institución»; entra al panel de esa; la columna izquierda se colapsa u
  oculta.
- **Nueva especialidad** (Cirugía como producto, Patología, etc.): fila
  más en la matriz y agrupación nueva de tarjetas. Mismo patrón. El SKU
  de plan por especialidad, **si el negocio lo justifica**, se suma
  después; hoy no filtrar Home como si ya existiera.
- **Pedir lugar**: cupo del plan (1 público máx., N no-públicos),
  `desarrollado ∩ permitidos`. No combo libre.

---

## 6. Alcance y etapas

| Etapa | Qué |
|---|---|
| **Ahora** | Solo documentación. Cero código. |
| **1 — PC** | Shell dos columnas, institución primero, mismas vistas por `go(vista)`. Breakpoint ~900px: se suelta `max-width: 520px`, se oculta el dock. |
| **2 — Móvil** | Misma lógica (institución primero + módulos + bandejas), rediseño propio de chrome. El móvil de producción no se toca hasta esta etapa. |

No es un fork de la app. `styles.css`, Home, topbar y nav son
compartidos. Lo honesto: CSS + `go()`, no «cero archivos de móvil» en
la etapa PC.

Tamaño real: **grande** si incluye tablero por institución (bandejas).
**Mediano** solo si es ensanchar y sidebar sobre las vistas de hoy.

---

## 7. Pendiente antes de implementar

- Opción visual A (dos columnas) = base elegida; B/C/D quedan
  descartadas salvo que el profesional pida reabrir.
- Leyenda legal del footer: abogado (Términos).
- No implementar con otras tareas urgentes en curso.
- Consentimiento informado: **bloqueado** (firma electrónica gris en
  AR/Córdoba). Camino provisorio: papel + foto, mismo patrón que
  autorizaciones. Verificar cita legal con el abogado.
- Traditum, foja qx nativa, QR cirujano, QR recepción de PDFs: diseño
  de facturación, no de este lote de Home.

---

## 8. Correcciones técnicas (estado actual — no contradicen la visión)

Siguen vigentes cuando se codee. La sección 0 es aspiracional; esta es
el sistema de hoy.

1. Paleta `--san-*` 12.54 (no Mayo violeta / Aero coral).
2. Home: atajos **y** bandejas; no solo 6 baldosas.
3. Mayo: baldosa **GECLISA** siempre; no esconderla en evweb.
4. Badge de destino = contadores por caso, no un estado en la baldosa.
5. Públicos: etiqueta **SISalud**, no evweb.
6. Cirugía nativa / QR cirujano: requisito en la matriz §3 para **Aero
   y públicos** (ambos `*`). Mayo baja qx de GECLISA; no hay editor ni
   QR cirujano ahí.
7. Planes actuales = cupo de **lugares**, no especialidad. Un plan
   «solo Cirugía» sería SKU nuevo (visión §0).
8. «+ Agregar» = pedir lugar / Ajustes, no alta libre. Allende fuera.
9. Tres QRs: no fusionar en un módulo.
10. Etapa PC primero; móvil misma lógica después. Módulos = `go(vista)`.
    Intactos: `fill.js`, IDs GECLISA, forma de `S.cur`,
    `abrirInter` / `cargarFojaUI`.
