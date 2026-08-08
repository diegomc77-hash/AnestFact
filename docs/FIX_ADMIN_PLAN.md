# Fix admin: plan Pro que vuelve a Demo + ver fojas de otro usuario

## Por qué pasaba

Al guardar el plan desde el panel admin, la app hacía un **UPSERT** (insert+update).  
Supabase solo permite **INSERT de tu propia fila** (`auth.uid() = id`).  
Al intentar crear/actualizar el plan de la Dra. Huerta, el servidor **rechazaba** el guardado.  
En pantalla parecía “pro”, pero al refrescar `loadUserPlan` leía la base → seguía en **demo**.

## Qué tenés que hacer vos (obligatorio)

1. Abrí [Supabase](https://supabase.com) → proyecto AnesFact → **SQL Editor**.
2. Abrí el archivo del proyecto:
   `supabase/migrations/006_admin_set_plan_view_fojas.sql`
3. Copiá **todo** el contenido → pegá en SQL Editor → **Run**.
4. En la app (local o online): **Ctrl+F5**.
5. Panel admin ★ → Dra. Huerta → plan **pro** → **Guardar plan**.
6. Refrescá: debe quedar en **pro**.

## Ver sus pacientes como admin

En el panel admin, por cada usuario:

| Botón | Qué hace |
|-------|----------|
| **Ver fojas** | Carga sus pacientes en tu Home (banner naranja) |
| **Seguir al abrir** | Cada vez que abras la app como admin, entrás directo a sus fojas |
| **Volver a mis fojas** | En el banner naranja, vuelve a tu lista |

Mientras ves sus fojas, si guardás en la nube, se guarda **en su cuenta** (no en la tuya).

## No subir a GitHub Pages hasta probar

Probalo primero en local. Cuando confirme que el plan queda en pro tras refresh, ahí lo subimos.
