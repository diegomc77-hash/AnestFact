# Desplegar valoración QR (Edge Functions)

Después de ejecutar la migración 005, seguí estos pasos para activar QR + formulario paciente.

---

## 1 — Generar secrets (una sola vez)

PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Ejecutá **dos veces** → una clave para `AF_ENCRYPTION_KEY` y otra para `APP_PII_SALT`.  
Guardalas en un gestor de contraseñas (**no** subir a GitHub).

---

## 2 — Supabase CLI

Si no tenés la CLI:

```powershell
npm install -g supabase
supabase login
```

En la carpeta del repo:

```powershell
cd "C:\Proyectos_Medicos\AnestFact2\version cursor AnestFact"
supabase link --project-ref xntvibfsuubedplptvzs
```

---

## 3 — Cargar secrets en Supabase

Dashboard → **Project Settings** → **Edge Functions** → **Secrets**,  
o por CLI:

```powershell
supabase secrets set AF_ENCRYPTION_KEY="PEGAR_CLAVE_1" APP_PII_SALT="PEGAR_CLAVE_2"
```

---

## 4 — Desplegar funciones

```powershell
supabase functions deploy af-qr-create
supabase functions deploy af-qr-submit
```

`af-qr-create` exige JWT (anestesista logueado).  
`af-qr-submit` es pública (solo con token QR válido).

---

## 5 — Probar

1. Subí el repo a GitHub Pages (o abrí local con servidor).
2. Iniciá sesión en AnesFact → Home → **Generar QR valoración preanestésica**.
3. Abrí el enlace (o escaneá el QR) en el celular del paciente.
4. Completá y enviá el formulario.
5. En Supabase → **Table Editor** → `anesfact_valoraciones` debería aparecer una fila nueva.

---

## Archivos en el repo

| Archivo | Rol |
|---------|-----|
| `supabase/functions/af-qr-create/` | Crea token QR (30 días) |
| `supabase/functions/af-qr-submit/` | Recibe formulario paciente, cifra PII |
| `valoracion.html` | Formulario paciente (sin login) |
| `js/31-valoracion-qr.js` | Botón + modal QR en Home |

---

## Qué sigue (sin tocar foja aún)

- `af_paciente_match` — buscar por DNI hash al crear foja
- `af_paciente_import` — import manual a campos vacíos
- Lista N valoraciones + N fojas en modal

---

## Errores frecuentes

| Error | Causa |
|-------|--------|
| `Faltan secrets AF_ENCRYPTION_KEY` | No cargaste secrets o no redeployaste |
| `Sesión inválida` al generar QR | No estás logueado en AnesFact |
| `Enlace inválido` en paciente | Token mal copiado o QR de otro proyecto |
| CORS / 404 en submit | Función no desplegada o nombre incorrecto |
