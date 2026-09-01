# Roadmap de escalamiento — AnesFact

**Diseño, no implementar desde este archivo.** Auditado contra código
(2026-08-31), no contra supuestos. Fuentes: este repo +
`docs/CIERRE_ARQUITECTURA_FACTURACION.md` + `docs/DISENO_PC_HOME.md`.

Dos rieles que **no se mezclan en la misma fase**:

| Riel | Qué es | Qué no es |
|---|---|---|
| **U — Interfaz** | Home por institución, PC/móvil (`DISENO_PC_HOME.md`) | Traditum, foja qx, SISalud upload |
| **P — Tuberías** | Completar destinos (adjuntos, foja qx, QR cirujano, Traditum) | Rediseño de dock/Home/520px |

Intactos en ambos rieles: `fill.js`, IDs GECLISA, forma de `S.cur`,
`abrirInter` / `cargarFojaUI`. Navegación nueva solo por `go(vista)`.

---

## 1. Auditoría — qué hay en código vs qué es solo doc

Leyenda: **sí** = construido y usable · **parcial** = hay piezas, no el
flujo cerrado · **no** = 0 código o solo diseño.

### Mayo

| Pieza | Estado | Evidencia |
|---|---|---|
| QR preop | **sí** | `af-qr-create` / `submit` / `peek`; selector de lugar; prefoja; catálogo Mayo |
| Foja anestésica | **sí** | Foja + UI Mayo (sector/cama/quirófano GECLISA) |
| Inyección GECLISA | **sí** | Cola `js/39-geclisa-queue.js` + extensión **0.5.10**; fill; **nunca** click en Guardar |
| Camino a evweb «directo» | **parcial / no automatizado** | No hay fill ni API a `adaarc.evweb.com.ar`. Fojas: modal **Imprimir HC de internación** (IDs en **P1b**; 2026-08-31). Auth: **no** está en esa lista — archivo aparte (P1 / WhatsApp / otro). PAMI = solo el PDF combinado |
| Traditum (APROSS) | **no** | 0 matches en `js/` / `views/`. Diseño en el cierre. Flujo operativo: GECLISA (auth) → Traditum (buscar esa auth) → 3 estados. Fase **P4** |
| QR recepción PDFs (secretaria) | **no** | Distinto del Escanear IA (Gemini) |
| Foja qx nativa / QR cirujano | **no (a propósito)** | En Mayo la qx vive en GECLISA |

### Aeronáutico

| Pieza | Estado | Evidencia |
|---|---|---|
| Foja anestésica nativa | **sí** | Misma foja + `imprimirFoja()`; `destino_final: evweb` |
| Foja quirúrgica (editor / QR) | **no** | No hay vista ni modelo de foja qx. `S.cur.docs.qx` es un **adjunto** en JS (`adjuntarDoc`), no un formulario |
| QR al cirujano | **no** | Solo existe QR de valoración paciente |
| Escaneo de autorizaciones | **parcial** | (1) Herramientas → Escanear: Gemini extrae campos y manda a Facturación; **no** es el QR de recepción ni parseo Traditum. (2) P1 **12.55**: 3 ranuras en Facturación; no exige las tres llenas |
| evweb | **parcial** | Dock evweb = lista Aero pendiente de **marca local**. Toggle «Enviar a ADAARC/evweb», copiar campos, abrir evweb a mano. No hay automatización |

### Públicos (Córdoba / Misericordia / San Roque)

| Pieza | Estado | Evidencia |
|---|---|---|
| QR preop | **sí** | Mismo tubo QR; `cfg_id` por lugar; especialidad genérica / cirujano a mano si no hay nómina |
| Foja anestésica | **sí** | Select lugar; quirófanos Córdoba 9 / Misericordia 4; San Roque texto; print A4 (header compose o PNG Misericordia); pie **sin** ADAARC si `afFojaEsSisalud` |
| Foja quirúrgica* | **no** | Requisito en matriz Home / cierre; 0 código |
| QR al cirujano* | **no** | Idem |
| SISalud | **parcial** | Print A4 **sí**. Subida a SISalud: **no investigar todavía** (ESTADO). No hay fill ni API |

### Transversal (no es de una institución)

| Pieza | Estado |
|---|---|
| Consentimiento informado (firma digital) | **bloqueado legal** — camino papel+foto = mismo hueco que adjuntos |
| Home por institución / bandejas | **no** — PC hoy = `max-width:520px` centrado (`DISENO_PC_HOME.md`) |
| Allende | Fuera de alcance (patrón `sistema_propio`) |

---

## 1b. Tuberías Mayo × mutual (detalle operativo)

Fuente de la matriz: `docs/CIERRE_ARQUITECTURA_FACTURACION.md` (secciones
«Matriz», «Mayo × mutual», «APROSS / Traditum»). Acá está **copiado el
cómo se arma cada paquete**, para no reconstruirlo de memoria. El cierre
sigue siendo la norma si hay conflicto.

Inyección AnesFact → GECLISA (foja anestésica) **ya está**. El sentido
**inverso** de las fojas ya no es «buscar a ciegas»: es el modal de
impresión del Panel de Internados (**P1b**, IDs verificados). La auth
no sale de ahí. Eso no es P2 (P2 es foja qx **nativa Aero**, sin
GECLISA).

### PAMI (el más simple)

- **Qué va a evweb:** foja de cirugía + foja de anestesia. **Sin**
  autorización aparte.
- **Dónde viven:** ambas en GECLISA (Mayo). **Cómo se bajan:** un solo
  archivo (`Reporte.pdf`) con las dos juntas — ver § 1c.
- **Hoy:** la doctora las busca y baja a mano, sube a evweb a mano.
- **Fases:** recolección = **P1b**. P1 (adjuntos AnesFact) no sustituye
  esto. P4 Traditum **no aplica**.

### ART / obras genéricas (3 papeles)

- **Qué va a evweb:** foja anestesia + foja cirugía + autorización de
  mutual.
- **Dónde:** fojas en GECLISA (**un PDF combinado**, no dos archivos);
  auth en GECLISA (documentos) y/o llega por WhatsApp (QR recepción /
  adjunto P1) — **archivo aparte**.
- **Falta automatizar:** P1b = PDF combinado por el modal de impresión
  (abajo). La auth **casi nunca** está en ese modal (APROSS/ART);
  sigue siendo archivo aparte (P1 / WhatsApp / otro lado de GECLISA).
- **Fases:** P1 = colgar auth (o el combinado) en AnesFact si no está
  en GECLISA; **P1b** = búsqueda/recolección en GECLISA; P4 no aplica.

### APROSS (Traditum, no «3 papeles a evweb» primero)

Flujo cerrado en `CIERRE_ARQUITECTURA_FACTURACION.md`:

1. Buscar la **autorización** en GECLISA (no se usan las fojas para
   Traditum).
2. Entrar a **Traditum** (usuario **solo** de la doctora).
3. Buscar **esa misma** autorización ahí.
4. Resultado: **exactamente 3 estados** (no hay otro conjunto en el
   cierre ni en PR7):

   | Estado | Qué significa |
   |---|---|
   | `validado` | Pasa a listo_evweb (después se arma el paquete a ADAARC) |
   | `sujeto_a_auditoria` | Espera pasiva; no bloquea el resto; no es alerta agresiva |
   | `rechazado` | Alerta a la doctora → baja complejidad → reintenta |

   `enviado` en el cierre es «ya se mandó a Traditum», no un resultado
   de la búsqueda. Los 3 del usuario = validado / auditoría / rechazado.

5. Recién con `validado` (o el criterio de listo_evweb del cierre) se
   sube a evweb. Fojas clínicas vs `cirugia_autorizada`: no conciliar.

- **Fase:** **P4**. P1b no automatiza Traditum.

---

## 1c. Empaquetado de adjuntos por institución (configurar después)

Hallazgo de la prueba P1 en vivo (2026-08-31): **GECLISA no entrega
dos archivos**. Baja **un solo PDF** (`Reporte.pdf`) con foja de
cirugía + foja anestésica juntas. En Facturación eso se cuelga en
**una** ranura (ej. Foja Anestésica) y la otra queda vacía — es el
uso correcto hoy, no un error del usuario.

P1 **sigue igual**: 3 ranuras genéricas; cada una acepta cualquier
archivo; **no** se exige que estén las tres completas. No codear
configuración por institución todavía. Cuando se diseñe, el patrón
es el de cirujanos / quirófanos (`CIRUJANOS_POR_LUGAR` /
`AF_FOJA_INST`): una tabla por lugar, no ifs sueltos en la UI.

El cierre (`CIERRE_ARQUITECTURA_FACTURACION.md`) sigue hablando de
«2 fojas» como **qué pide evweb**. Eso no cambia. Cambia **cómo
llegan** esos papeles a AnesFact.

| Institución | Cómo llegan las fojas | Autorización | Notas |
|---|---|---|---|
| **Sanatorio Mayo** | GECLISA: **un archivo** = qx + anestésica juntas | **Archivo aparte** (GECLISA y/o WhatsApp / P1) | P1b no debe asumir 2 descargas de protocolo. PAMI = ese PDF combinado, sin auth. ART/obras = combinado + auth |
| **Hospital Aeronáutico** | Fojas **desde AnesFact** (no hay GECLISA) | Foto sacada en AnesFact | Mientras no exista foja qx nativa (P2): la parte del cirujano llega como **foto aparte** → 2 fotos (auth + qx papel) más la foja anestésica que ya imprime la app |
| **Otras** (públicos, Allende, etc.) | **Pendiente** de relevar impresión / autorización de cada sistema | Idem | Caso por caso al sumar el lugar. No inventar el paquete |

No mezclar con P1 (ranuras genéricas). Alimenta P1b (Mayo), P2 (Aero
qx) y una config futura tipo catálogo, no un rediseño de Facturación
ahora.

---

## 2. Fases — riel P (tuberías)

Orden: más valor por caso real de Huerta, menos riesgo de romper GECLISA/foja.
**No** meter fases U aquí.

### P1 — Adjuntos en Facturación · **hecho en 12.55**

**Cierre:** `docs/CIERRE_ARQUITECTURA_FACTURACION.md` — matriz Mayo ×
mutual (PAMI sin auth; ART/obras = fojas + autorización; APROSS no usa
fojas para Traditum). P1 no implementa esa matriz: solo deja colgar
archivos en AnesFact.

UI en `#docs-card-body` (3 ranuras + badges). Pipeline: ≤500 KB tal
cual; imagen/PDF pesado → JPEG ~450 KB (`js/41-adjuntos-compress.js`).
PDF via pdf.js lazy `vendor/pdfjs/` (no `STATIC_CORE`). Fallo → original.

Las 3 ranuras son **genéricas y opcionales**: cualquier archivo en
cualquiera; no se fuerza completar las tres. En Mayo el PDF combinado
de GECLISA va en **una** ranura (§ 1c). No rediseñar slots por
institución en este lote.

**Valor:** Aero (foto auth / qx papel); Mayo ART/obras si la auth llegó
por mail/WhatsApp y **no** se va a buscar en GECLISA todavía.

**No es:** recolección en GECLISA (eso es **P1b**), Traditum (**P4**),
editor de foja qx (**P2**), config por institución (§ 1c).

**Riesgo:** `S.cur.docs` sigue data-URL. No tocar `fill.js`.

### P1b — Recolección Mayo en GECLISA → PDF combinado · **grande**

**Cierre:** misma matriz + § 1c. Hueco del «directo a evweb»: bajar las
fojas **antes** de subir a ADAARC. **No** automatizar desde este
archivo. Chat dueño GECLISA. **Nunca** click en Guardar.

Hoy la extensión **inyecta** foja anestésica; no **descarga**. Ruta HC
por DNI (`NOTES_RUTA_HC_POR_DNI.md`) es otro hueco (pacientes de alta)
y no es este lote salvo que se decida.

**PAMI:** solo el PDF combinado (sin auth) — el camino más corto.
**ART/obras:** combinado + auth **aparte**. **APROSS:** P1b no sustituye
Traditum (**P4**); las fojas de este modal no van a Traditum.

**No es P2:** P2 es foja qx **nativa** para Aero (sin GECLISA). Mayo no
edita qx en AnesFact.

#### Mecanismo verificado (2026-08-31, IDs reales, GECLISA 4.1)

Reemplaza la idea vaga de «buscar en GECLISA». Confirmado en vivo.

1. **Panel de Internados.** Al lado de **Opciones** (☰,
   `btnGrillaInternadoMore`) hay un botón de impresora:
   `button#btnImprimirPanelInternado.btn.btn-default`
   (clase `btnImprimirPanelInternado`).
2. Abre el modal **«Imprimir Historia Clínica de Internación»**:
   rango de fechas + checkboxes.
3. El modal tiene **más de una lista**. En una prueba en vivo
   (2026-08-31): **13 de 24** tildados por defecto. Incluye Eventos
   (Anamnesis, Evolución, Protocolo Quirúrgico, Protocolo Anestésico,
   Pedidos de Estudios, Indicaciones Médicas, Epicrisis, «Archivos1»,
   …) y una segunda sección **Archivos Adjuntos** cuyos IDs son por
   documento (`jqg_gridAdjuntos_51888` y similares) y **cambian por
   paciente**. El botón Imprimir es nuevo de GECLISA 4.1: la lista
   default puede crecer otra vez. **No** hardcodear «destildar estos
   N».
4. **Regla genérica (la que hay que automatizar):** al abrir el
   modal, recorrer **todos** los checkboxes tildados (Eventos +
   Adjuntos) y destildarlos; después tildar **únicamente**
   `jqg_gridEventos_ProtocoloQuirurgico` y
   `jqg_gridEventos_ProtocoloAnestesico`. Así no importa cuántos
   vengan marcados ni qué adjuntos tenga el paciente.
5. Click **Imprimir** → PDF combinado (qx + anestésica en un archivo,
   el `Reporte.pdf` de § 1c). Id del botón Imprimir del modal: **no
   relevado todavía**.

**La autorización no sale de este modal.** Confirmado por la usuaria:
en APROSS y ART casi nunca figura en esa lista; a veces no está en
ningún lado de GECLISA. P1b automatiza **solo fojas**. Auth = P1 /
WhatsApp / otro camino (P4 busca auth en GECLISA para Traditum, no
este modal).

Pendiente antes de codear: id del Imprimir del modal; qué hace el
rango de fechas (¿dejar default?). No inventar IDs. No mezclar con
`fill.js` de inyección.

**Riesgo:** alto (GECLISA / extensión). Un lote, chat dueño GECLISA.

### P2 — Foja quirúrgica nativa + QR cirujano · **Aero primero** · **grande**

**Cierre:** `docs/CIERRE_ARQUITECTURA_FACTURACION.md` — Aeronáutico:
foja anestesia nativa + foja cirugía (QR cirujano, pendiente) + foto
auth → evweb. Sin GECLISA, sin Traditum, solo IOSFA.

No incluye buscar nada en GECLISA (Mayo = **P1b**). No incluye Traditum
(**P4**).

Formulario + print + QR distinto al de preop. Copia para el anestesista.

**Riesgo:** alto. No mezclar con `valoracion.html`. Extender `S.cur` solo
con OK explícito.

### P3 — Foja qx + QR cirujano · **públicos** · **mediano** (después de P2)

**Cierre:** públicos → SISalud, no evweb. Misma pieza que P2, destino
print A4 (upload SISalud vetado).

### P4 — Traditum APROSS · **grande**

**Cierre:** `docs/CIERRE_ARQUITECTURA_FACTURACION.md` § APROSS / Traditum
+ sub-estados `auth_status`. Flujo a implementar (no está en código):

1. Buscar la autorización en **GECLISA**.
2. Entrar a **Traditum** (login de la doctora, nunca secretaria).
3. Buscar **esa** autorización en Traditum.
4. Registrar uno de los **3 resultados**: `validado` |
   `sujeto_a_auditoria` | `rechazado` (confirmado: son esos, no otro
   trío).
5. `validado` → listo_evweb; auditoría → espera; rechazo → alerta y
   reintento. `cirugia_autorizada` vs `cirugia_clinica` sin conciliar.
   Parser = fila de prestaciones del PDF.

**Por qué no antes:** APROSS-only. PAMI y ART no pasan por acá. P1 solo
adjunta; P1b junta fojas para evweb **sin** Traditum.

### P5 — Bloqueados / no ahora

- Firma digital de consentimiento (abogado).
- Upload SISalud (ESTADO: no investigar).
- Fill de evweb (extensión tipo GECLISA): no hay mapeo de pantallas;
  el cierre lo deja para «después de diagramar evweb/Traditum».
- Allende.

---

## 3. Fases — riel U (interfaz), aparte

Leer entero `docs/DISENO_PC_HOME.md` antes de codear. Módulos = `go(vista)`.

### U1 — Shell PC: institución primero + lista de fojas · **mediano**

Soltar `max-width:520px` en un breakpoint, columna instituciones,
filtro (ya existe `home-san` / `afGoFojasFiltrado`), dock oculto en PC.
**Sin** bandejas de Traditum/evweb (eso espera estados de P).
**Sin** tuberías nuevas.

**Riesgo:** `styles.css` es global — el móvil no debe cambiar de
comportamiento. Probar ambos anchos. No es «cero archivos de móvil».

### U2 — Bandejas de trabajo en esa columna · **grande**

Preop / fojas / colas / listos destino. Depende de datos que P1–P4
vayan creando. No arrancar U2 con Traditum a 0 líneas (la bandeja
quedaría vacía o inventada).

### U3 — Móvil, misma lógica · **grande**

Etapa 2 de `DISENO_PC_HOME.md`. Chrome propio; no fork de foja.

**No paralelizar U1 con un lote que toque `fill.js` o la cola GECLISA.**
U1 + P1 en paralelo solo si P1 se limita a `facturacion.html` + el JS de
docs ya escrito, y U1 no edita esos archivos.

---

## 4. Orden sugerido (revisar juntos)

```
ahora     docs (este archivo) — hecho, sin código
   │
   ├─ riel P:  P1 adjuntos (chico) → P1b recolección GECLISA Mayo (grande)
   │            → P2 Aero qx+QR (grande) → P3 públicos (mediano) → P4 Traditum (grande)
   │
   └─ riel U:  U1 PC shell (mediano) ──después──► U2 bandejas ──► U3 móvil
```

Primera fase de **código** recomendada cuando se arranque: **P1** o **U1**,
nunca las dos en el mismo lote, nunca P2/P4 mezclado con U1.

Huerta hoy ya opera Mayo (QR + foja + GECLISA) y Aero (foja + marca
evweb a mano). P1 es el parche que el código casi tiene. U1 es el
dolor de PC (columna 520px) y no completa ninguna tubería.

---

## 5. Qué no hacer

- No llamar «evweb directo» a la marca local ni al copiar/pegar.
- No fusionar los tres QRs.
- No implementar consentimiento digital.
- No un SKU «plan Cirugía» (visión en Home; planes hoy = cupo de lugares).
- No Allende.
- No «completar SISalud» = upload hasta que Diego quite el veto.
