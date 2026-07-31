# Ejecutar migración valoración QR (paso a paso)

**Tiempo:** ~10 minutos.  
**Quién:** vos en el navegador (Supabase).  
**Yo:** Edge Functions y PWA ya están en el repo — ver `docs/DESPLEGAR_QR.md`.

---

## Paso 1 — Abrir Supabase

1. Entrá a [https://supabase.com](https://supabase.com) → tu proyecto AnesFact.
2. Menú izquierdo → **SQL Editor** → **New query**.

---

## Paso 2 — Ejecutar migración 005

### Aviso de Supabase “operaciones destructivas”

Es **normal**. El archivo `005_pacientes_valoracion.sql` incluye `DROP POLICY IF EXISTS` y `DROP TRIGGER IF EXISTS` para poder re-ejecutarse sin error. **No borra** tus fojas ni `anesfact_datos`.

| Qué NO toca el 005 | Qué SÍ hace |
|--------------------|-------------|
| `anesfact_datos` (sync de fojas) | Crea 4 tablas **nuevas** vacías |
| `anesfact_usuarios` | Políticas RLS en esas tablas nuevas |
| Intervenciones en la app | Funciones RPC nuevas |

**Si es la primera vez** y el aviso te incomoda, usá el archivo sin DROP:

`supabase/migrations/005_pacientes_valoracion_first_run.sql`

### Pasos

1. En tu PC abrí **uno** de estos archivos:
   - **Recomendado primera vez:** `005_pacientes_valoracion_first_run.sql`
   - O el completo: `005_pacientes_valoracion.sql` (confirmá el aviso de Supabase — es seguro si nunca corriste el 005)
2. Copiá **todo** el contenido.
3. Pegalo en el SQL Editor de Supabase.
4. Clic **Run** (o “Confirmar” si pide por operaciones destructivas).
5. Debe decir **Success**.

Si falla por `af_is_admin` no existe → ejecutá antes `002_admin_panel.sql`.

---

## Paso 3 — Verificar tablas

En SQL Editor, corré:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'anesfact_%'
ORDER BY 1;
```

Deberías ver entre otras:
- `anesfact_pacientes`
- `anesfact_qr_tokens`
- `anesfact_valoraciones`
- `anesfact_foja_vinculos`

---

## Paso 4 — Secretos (después, cuando despleguemos Edge Functions)

Supabase → **Project Settings** → **Edge Functions** → **Secrets**

| Nombre | Valor |
|--------|--------|
| `AF_ENCRYPTION_KEY` | 32 bytes random en base64 (generar una sola vez) |
| `APP_PII_SALT` | otro 32 bytes random en base64 |

**Generar en PowerShell (ejemplo):**

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Ejecutá dos veces → una clave para cada secret. **Guardalas en un lugar seguro** (no en GitHub).

---

## Paso 5 — Desplegar Edge Functions

Seguí la guía completa: **`docs/DESPLEGAR_QR.md`**

Resumen: generar secrets → `supabase link` → `supabase secrets set` → `supabase functions deploy af-qr-create af-qr-submit`

---

## Paso 6 — Qué sigue (fase app, sin tocar foja)

1. Match DNI en Nueva → **lista de valoraciones** para elegir episodio
2. Import manual a foja (solo campos vacíos)

**Todavía NO tocamos foja ni GECLISA** hasta que probemos QR end-to-end.

---

## Si algo falla

Copiá el mensaje de error del SQL Editor y pegalo en el chat.
