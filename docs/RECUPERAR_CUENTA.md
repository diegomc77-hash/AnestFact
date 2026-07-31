# Recuperar cuenta bloqueada (diegomc77@gmail.com u otra)

## Error: `email rate limit exceeded`

Supabase **bloqueó todos los emails de auth** (~1 hora) porque hubo muchos intentos de recuperación seguidos.

**Eso afecta también** el botón «Reset password» del panel — **sigue intentando mandar un mail** y falla igual.

**Solución:** cambiar la contraseña **sin email** (opciones A o B abajo).

---

## Opción A — La más fácil (sin mails, ~2 min)

### 1. Desactivar confirmación de email (temporal)

Supabase → **Authentication** → **Providers** → **Email** → **Confirm email: OFF** → Save.

### 2. Borrar el usuario atascado y crearlo de nuevo

**Authentication** → **Users** → `diegomc77@gmail.com` → **Delete user** (confirmá).

Luego **Add user** → **Create new user**:

| Campo | Valor |
|--------|--------|
| Email | `diegomc77@gmail.com` |
| Password | La que quieras usar (ej. `AnesFact2026!`) |
| Auto Confirm User | **ON** ✓ |

### 3. Admin en la base (SQL Editor)

Copiá el **User UID** del usuario recién creado (Authentication → Users → click en el email → copiar UUID).

```sql
INSERT INTO anesfact_usuarios (id, email, nombre, plan, rol, activo, fojas_semana)
VALUES (
  'PEGÁ-AQUÍ-EL-UUID',
  'diegomc77@gmail.com',
  'MC DIEGO',
  'pro',
  'admin',
  true,
  0
)
ON CONFLICT (id) DO UPDATE
SET rol = 'admin', plan = 'pro', email = 'diegomc77@gmail.com', activo = true;
```

### 4. Entrar a AnesFact

Login con `diegomc77@gmail.com` y la contraseña que pusiste en el paso 2.

---

## Opción B — Con service_role (sin borrar usuario)

Si no querés borrar el usuario:

1. Supabase → **Project Settings** → **API** → copiá **`service_role`** (secreta — **nunca** la pongas en la app).
2. En **Authentication** → **Users** → abrí `diegomc77@gmail.com` → copiá el **User UID**.
3. En PowerShell (reemplazá `TU_SERVICE_ROLE` y el UUID):

```powershell
$uid = "UUID-DEL-USUARIO"
$key = "TU_SERVICE_ROLE"
$headers = @{
  "apikey" = $key
  "Authorization" = "Bearer $key"
  "Content-Type" = "application/json"
}
$body = '{"password":"AnesFact2026!","email_confirm":true}'
Invoke-RestMethod -Uri "https://xntvibfsuubedplptvzs.supabase.co/auth/v1/admin/users/$uid" -Method PUT -Headers $headers -Body $body
```

4. Login en AnesFact con esa contraseña.

---

## Opción C — Solo confirmar email (si la contraseña ya es la correcta)

A veces el login falla porque el mail **nunca se confirmó**, no porque la clave esté mal.

SQL Editor:

```sql
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email = 'diegomc77@gmail.com';
```

Probá ingresar con la contraseña que usaste al registrarte. Si sigue fallando, usá **Opción A**.

---

## Opción D — Esperar

El límite de emails se renueva solo (~**60 minutos**). Después podés usar «Olvidé mi contraseña» otra vez. **No hace falta esperar** si usás A o B.

---

## Evitar que vuelva a pasar

| Dónde | Qué hacer |
|--------|-----------|
| Auth → Providers → Email | **Confirm email: OFF** en desarrollo |
| Auth → URL Configuration | `http://localhost:3000/**`, `http://localhost:8888/**`, `https://diegomc77-hash.github.io/AnestFact/**` |
| Recuperación | No spamear «Olvidé contraseña» — máx. 1 cada 15 min |

---

## Después de entrar

Deberías ver **★** en la barra (admin). Si no:

```sql
UPDATE anesfact_usuarios
SET rol = 'admin', plan = 'pro'
WHERE email = 'diegomc77@gmail.com';
```
