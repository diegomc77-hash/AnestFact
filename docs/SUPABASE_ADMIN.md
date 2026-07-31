# Supabase — Panel admin AnesFact v8

Guía paso a paso para activar el **modo dios** sin perder las fojas de la Dra. Huerta.

## Qué hace el panel

- Lista usuarios registrados (email, plan, fojas en nube).
- Cambia plan: `demo` / `basico` / `pro` / `bloqueado`.
- Muestra backups **legacy** (clave antigua `anesfact_sync_HUERTA_MARIA_SOLEDAD`).
- Permite **vincular** un backup legacy a un usuario (no borra datos).

La seguridad está en **Supabase**, no en el botón de la app:
- Solo cuentas con `rol = 'admin'` pueden listar/editar otros usuarios.
- Un usuario normal **no puede** auto-asignarse admin (trigger en la base).
- La app **no** incluye la service role key (la llave maestra).

---

## Paso 1 — Ejecutar migraciones SQL

En [supabase.com](https://supabase.com) → tu proyecto → **SQL Editor**:

1. Si aún no lo hiciste: ejecutar `supabase/migrations/001_auth_plans_rls.sql`
2. Ejecutar `supabase/migrations/002_admin_panel.sql`

---

## Paso 2 — Crear tu cuenta admin

1. Abrí AnesFact v8 → **Registrate** con tu email (ej. `anesfact@gmail.com`).
2. En Supabase → **SQL Editor**, ejecutá (reemplazá el email):

```sql
UPDATE anesfact_usuarios
SET rol = 'admin', plan = 'pro', email = 'anesfact@gmail.com'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'anesfact@gmail.com' LIMIT 1
);
```

3. Cerrá sesión en AnesFact y volvé a entrar.
4. Deberías ver una **estrella ★** en la barra superior → Panel admin.

---

## Paso 3 — Dra. Huerta (sin perder fojas)

### Las fojas viejas NO se borran

La app v8 sigue leyendo el backup legacy `anesfact_sync_HUERTA_MARIA_SOLEDAD` como respaldo.  
Eso está en `js/17-sync-export.js` y **no se tocó**.

### Cuando la Dra. se registre

1. Que cree su cuenta en AnesFact (mismo email que uses en producción).
2. En el **Panel admin** (★) o en SQL:

```sql
UPDATE anesfact_usuarios
SET plan = 'pro'
WHERE nombre ILIKE '%HUERTA%'
   OR email ILIKE '%huerta%';
```

3. Opcional — vincular el backup legacy a su UUID (desde el panel o SQL):

```sql
SELECT af_admin_link_backup(
  'anesfact_sync_HUERTA_MARIA_SOLEDAD',
  '<uuid-de-la-dra>'
);
```

Al iniciar sesión, el sync hará **merge** (local + nube + legacy), no reemplazo ciego.

---

## Paso 4 — Activar clientes que pagan

Desde el panel admin:

1. ★ → lista de usuarios.
2. Cambiá **Plan** a `basico` o `pro`.
3. **Guardar**.
4. El colega cierra sesión y vuelve a entrar.

O por SQL:

```sql
UPDATE anesfact_usuarios SET plan = 'pro' WHERE email = 'colega@email.com';
```

Para suspender: `plan = 'bloqueado'`.

---

## Paso 5 — RLS en fojas (cuando todo funcione)

Solo cuando v8 esté en producción y Huerta migrada, descomentá y ejecutá el bloque final de `001_auth_plans_rls.sql` (RLS en `anesfact_datos`).

Hasta entonces, los datos legacy siguen accesibles con la clave anon + fallbacks de la app.

---

## Preguntas frecuentes

**¿Tengo que cargar cada usuario a mano?**  
No. Se registran solos → quedan en `demo` → vos subís el plan desde el panel.

**¿Alguien puede hackearse admin desde la app?**  
No, si ejecutaste `002_admin_panel.sql`. El trigger bloquea cambios de `rol`/`plan` propios; solo un admin ya existente puede editar a otros.

**¿Dónde veo emails si no aparecen?**  
Usuarios viejos pueden no tener email en la tabla. Al volver a iniciar sesión, la app lo sincroniza. O actualizalo en SQL.

**¿Qué pasa si el panel dice "Sin permisos admin"?**  
Falta el paso 2 (UPDATE con `rol = 'admin'`) o no ejecutaste `002_admin_panel.sql`.
