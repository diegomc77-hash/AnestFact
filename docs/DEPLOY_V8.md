# Publicar AnesFact v8 (GitHub Pages)

## Antes de publicar (Supabase — una sola vez)

En [supabase.com](https://supabase.com) → SQL Editor, en orden:

1. `supabase/migrations/001_auth_plans_rls.sql`
2. `supabase/migrations/002_admin_panel.sql`
3. `supabase/migrations/003_owner_bootstrap.sql`

## Copiar dev → producción

Carpeta **desarrollo** (la que probás en localhost):

`C:\Proyectos_Medicos\AnestFact2\version cursor AnestFact`

Carpeta **producción** (GitHub Pages):

`C:\Proyectos_Medicos\Anestfact\AnestFact`  
(o donde tengas clonado `diegomc77-hash/AnestFact`)

### PowerShell (copiar todo excepto .git)

```powershell
$dev = "C:\Proyectos_Medicos\AnestFact2\version cursor AnestFact"
$prod = "C:\Proyectos_Medicos\Anestfact\AnestFact"

robocopy $dev $prod /E /XD .git backup .github /XF .gitignore
```

Revisá que en producción existan: `index.html` (título **v8**), `js/28-auth.js`, `views/auth.html`, `sw.js`.

## Subir a GitHub

```powershell
cd $prod
git status
git add -A
git commit -m "AnesFact v8: login, planes, admin, buscador fojas"
git push origin main
```

GitHub Pages tarda 1–3 minutos. Abrí:

`https://diegomc77-hash.github.io/AnestFact/`

## Después del deploy

1. **Ctrl+Shift+R** en el celular y la PC (borra caché PWA vieja).
2. Registrarse / ingresar con email.
3. Dueño (`diegomc77@gmail.com`): al entrar queda **admin** automático (script 003).
4. Dra. Huerta: registrarse → vos en panel ★ → plan **pro** → vincular backup legacy.

## Si sigue viendo v7.22

- Borrar datos del sitio en el navegador (Application → Clear site data).
- Desinstalar PWA vieja e instalar de nuevo desde la URL de GitHub.
