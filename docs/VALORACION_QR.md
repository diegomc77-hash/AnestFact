# Valoración preanestésica + QR

Flujo correcto (no altera foja ni facturación existentes):

1. **QR / valoración** (opcional, puede ser días antes)
2. **Foja anestésica** (Aero AnesFact o Mayo GECLISA)
3. **Facturación evweb** (al final: auth, foja qx, ADAARC)

---

## Reglas de oro — no romper fojas

Estas reglas aplican a **toda** implementación en la app:

| Regla | Motivo |
|-------|--------|
| `paciente_id` y `valoracion_id` en `S.cur` son **opcionales** | Sin vínculo, la app funciona igual que hoy |
| **Nunca** llamar `resetFojaUIDom()` al importar valoración | Evita borrar drogas, vitals, GECLISA |
| Importar solo con **acción explícita** (modal “¿Vincular?”) | No autollenar silenciosamente |
| Panel **N fojas + fechas** al detectar paciente | Evita mezclar reintervenciones |
| Modal **nueva foja / revalorar / retomar** | Anestesista decide episodio |
| Solo escribir campos **vacíos**, salvo confirmación | Protege trabajo ya hecho |
| **No tocar** `fill.js`, IDs GECLISA, `imprimirFoja()`, bookmarklet | Flujos Mayo/Aero intactos |
| Nombre/DNI descifrados **solo en memoria** de sesión | No `localStorage` en claro |
| Sync `anesfact_datos` sigue guardando `S.cur` completo | Compatibilidad hacia atrás |

### Mapeo seguro valoración → foja (fase app)

| Origen (valoración) | Destino (solo si vacío) |
|---------------------|-------------------------|
| `datos_basicos.peso_kg` | `#f-peso` |
| `datos_basicos.edad` | `#f-edad` |
| `datos_basicos.sexo` | `#f-sexo` |
| `datos_basicos.obra_social` | `#f-obra` |
| `datos_basicos.afiliado` | `#f-afil` |
| Descifrado `nombre` | `#f-pac` |
| `antecedentes.chips` | `_antecedentes` + chips Mayo/Técnica |
| `medicacion[]` | texto en `#fj-obs-geclisa` o obs (no pisa drogas) |
| `alertas_reglas` | panel `#alertas-clinicas` (informativo) |
| `asa_sugerido` | sugerencia en `#fj-asa` **solo si vacío** |

---

## Cuestionario QR (bloques confirmados)

### Bloque A — Datos básicos

- Nombre, DNI → **cifrados** en `anesfact_pacientes`
- Edad, sexo
- Peso (kg), talla (cm) → **IMC calculado** en formulario y guardado en `datos_basicos.imc`
- Obra social, N° afiliado → en `datos_basicos` (RLS, no cifrado extra)

### Bloque A2 — Episodio / cirugía (obligatorio en QR)

- Diagnóstico o tipo de cirugía programada
- Motivo de esta valoración (primera / reprogramación / no presentación / nueva cirugía / control)
- Fecha de cirugía programada (opcional)

### Bloque B — Antecedentes

Chips: HTA, diabetes, cardiopatía, marcapasos/CI, IRC, EPOC, asma, SAOS, obesidad, embarazo

- Anticoagulante/antiagregante: fármaco + última dosis / cuándo suspendió
- Alergias: medicamentos, látex, iodado, otros (texto)

### Bloque C — Medicación habitual

Lista: `{ nombre, dosis, horario, via }[]`

### Bloque D — Antecedentes anestésicos

- Cirugías previas (texto)
- Anestesias previas (texto)
- Problemas: vía difícil, NVPO, alergia fármacos, hipertermia maligna familiar, despertar intraoperatorio

### Bloque E — Ayuno y funcional

- Última comida sólida / líquido claro → **solo si `es_urgencia = true`**
- Capacidad funcional: ¿sube 2 pisos sin detenerse?

### Bloque F — Extras

- Tabaco / alcohol (cantidad)
- Prótesis dental / movilidad cervical
- Marcapasos / DAI (modelo opcional)
- Infección reciente / fiebre
- Viaje reciente / TVP previa

**No se pide teléfono.**

---

## Múltiples valoraciones y corrección

| Actor | Acción |
|-------|--------|
| Paciente (QR) | Cada envío crea **nueva fila** en `anesfact_valoraciones` — **nunca pisa** la clínica anterior |
| Paciente mismo DNI | **Upsert** solo identidad (`nombre_enc`, `dni_enc`); el historial clínico queda en filas separadas |
| Anestesista | Puede **editar** cualquier valoración (`UPDATE`) o marcar `resultado_episodio` |
| Al abrir foja | **Lista** valoraciones del paciente — el anestesista elige cuál vincular (no auto la última) |

### Mismo DNI, distinta cirugía o no presentación

Cada valoración lleva **contexto de episodio**:

| Campo | Uso |
|-------|-----|
| `diagnostico_cirugia` | Ej. "Colecistectomía", "Hernia inguinal" |
| `fecha_cirugia_programada` | Fecha prevista (opcional) |
| `motivo_valoracion` | `primera`, `reprogramacion`, `no_presentacion`, `nueva_cirugia`, `control`, `correccion_datos` |
| `resultado_episodio` | `pendiente`, `operado`, `no_presentado`, `suspendido`, `cancelado` |

**En el formulario QR (bloque extra al inicio):**
- Diagnóstico / tipo de cirugía programada *
- Motivo: primera vez / reprogramación / no me operaron la vez anterior / otra cirugía nueva
- Fecha programada (opcional)

### Alertas al vincular foja (app)

Cuando el DNI coincide:

1. Mostrar **lista** de valoraciones (fecha, diagnóstico, motivo, resultado).
2. **Alerta amarilla** si hay ≥2 con `resultado_episodio = 'pendiente'`.
3. **Alerta** si el diagnóstico en `#f-diag` difiere del de la valoración elegida.
4. Anestesista elige una fila → import → opcional marcar otras como `no_presentado`.

**Nunca** fusionar automáticamente dos cirugías distintas.

---

## Mismo paciente, varias fojas (reintervención / otra cirugía)

Un paciente puede tener **varias fojas** (intervenciones) en distintas fechas: otra patología, reintervención, reprogramación, etc.

| Concepto | Regla |
|----------|--------|
| **Identidad** | 1 `paciente_id` por DNI + anestesista |
| **Valoraciones QR** | N filas (una por episodio / cuestionario) |
| **Fojas AnesFact** | N intervenciones (`S.cur`), cada una con su fecha y diagnóstico |
| **Vínculo** | Cada foja se liga a `paciente_id` + **una** `valoracion_id` concreta |

### Aviso obligatorio al cargar DNI o abrir paciente

Cuando hay match (por DNI o `paciente_id`), **antes de importar nada**, mostrar panel:

```
Paciente: GARCIA Juan (DNI ****3456)
• 2 fojas previas en tu cuenta:
  — 12/03/2026 · Colecistectomía laparoscópica · Mayo · operado
  — 28/07/2026 · Hernia inguinal · Aeronáutico · borrador
• 3 valoraciones preanestésicas:
  — 10/03/2026 · Colecistectomía · primera · importada
  — 25/07/2026 · Hernia · primera · pendiente
  — 30/07/2026 · Hernia · no_presentacion · pendiente
```

(Fechas y diagnósticos visibles; DNI parcialmente enmascarado en listados.)

### Pregunta al anestesista (modal, no automático)

1. **¿Nueva foja** para otra cirugía / nueva fecha → crea intervención nueva, elige valoración a importar (o ninguna).
2. **¿Revalorar preanestésica?** → genera QR nuevo o edita valoración; **no** crea foja todavía.
3. **¿Retomar foja existente?** → abre la intervención de la lista (misma fecha/diag).
4. **¿Marcar episodio anterior?** → `no_presentado` / `operado` en valoración vieja.

**Nunca** mezclar drogas, vitals ni texto de una foja en otra.

### De dónde sale el conteo de fojas

| Fuente | Qué lista |
|--------|-----------|
| `S.intervs` local/sync | Fojas con mismo `paciente_id` (o mismo DNI normalizado si aún no hay vínculo) |
| `anesfact_foja_vinculos` | Auditoría cloud por `paciente_id` |
| `anesfact_valoraciones` | Cuestionarios QR (`af_valoraciones_list`) |

La app **combina** local + Supabase en el panel de aviso.

### Alertas específicas

| Situación | Aviso |
|-----------|--------|
| ≥2 fojas mismo paciente | “Este paciente tiene **N fojas** registradas” + fechas |
| Nueva foja, diag distinto a valoración pendiente | “El diagnóstico no coincide con la valoración del 25/07” |
| Revaloración sin nueva foja | “Se creará valoración nueva; las fojas existentes no se modifican” |
| Importar valoración ya usada en otra foja | “Esta valoración ya se importó en foja del 12/03 — ¿usar igual para esta cirugía?” |

### Campos en intervención (fase app, opcionales)

```json
{
  "paciente_id": "uuid",
  "valoracion_id": "uuid",
  "episodio_diag": "Hernia inguinal",
  "episodio_fecha": "2026-07-28"
}
```

Sin estos campos la foja funciona **igual que hoy**.

---

## Esquema JSON de referencia

```json
{
  "datos_basicos": {
    "edad": 45,
    "sexo": "F",
    "peso_kg": 72,
    "talla_cm": 165,
    "imc": 26.4,
    "obra_social": "IOSFA",
    "afiliado": "D352042102"
  },
  "antecedentes": {
    "chips": ["HTA", "DBT2"],
    "anticoag": {
      "farmaco": "Rivaroxaban",
      "ultima_dosis": "2026-07-28",
      "suspendio": "2026-07-29"
    },
    "alergias": {
      "medicamentos": ["AINEs"],
      "latex": false,
      "iodado": false,
      "otros": ""
    }
  },
  "medicacion": [
    {"nombre": "Enalapril", "dosis": "10mg", "horario": "08:00", "via": "VO"}
  ],
  "antec_anestesicos": {
    "cirugias_previas": "Colecistectomía 2019",
    "anestesias_previas": "General sin incidentes",
    "via_dificil": false,
    "nvpo": true,
    "alergia_farmacos_anest": "",
    "hipertermia_maligna_familiar": false,
    "despertar_intraoperatorio": false
  },
  "ayuno": {
    "solido_at": null,
    "liquido_at": null
  },
  "extras": {
    "tabaco": false,
    "alcohol": "ocasional",
    "protesis_dental": true,
    "movilidad_cervical": "normal",
    "marcapasos_dai": "",
    "infeccion_fiebre": "",
    "viaje_tvp": false
  },
  "es_urgencia": false
}
```

---

## Cifrado (resumen)

| Dato | Almacenamiento |
|------|----------------|
| Nombre, DNI | AES-256-GCM en `anesfact_pacientes` (`nombre_enc`, `dni_enc`) |
| Búsqueda DNI | `dni_hash = SHA-256(APP_PII_SALT \|\| normalize(dni))` — solo backend |
| Clínicos | JSONB en `anesfact_valoraciones` + RLS por `owner_id` |
| Fotos estudios | Extraer valores → `estudios_extraidos`; **no** persistir imagen |

Secretos en Supabase Edge Functions: `AF_ENCRYPTION_KEY`, `APP_PII_SALT`.

---

## Migración

Ejecutar en SQL Editor:

`supabase/migrations/005_pacientes_valoracion.sql`

Después: desplegar Edge Functions (sin cambios en foja hasta que existan las RPC).
