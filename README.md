# AnesFact v7 (rama de prueba — desglose modular)

PWA para fojas anestésicas. Esta copia es la **versión de desarrollo**; la producción de la Dra. Huerta sigue en el repo principal.

## Estructura

- `index.html` — app principal (desglosada)
- `styles.css` — estilos
- `data/nomenclador.js` — nomenclador ADAARC (NOM)
- `js/supabase-keepalive.js` — ping a Supabase al abrir la app
- `seguridad.js` — login y dominio autorizado
- `fill.js` — bookmarklet GECLISA
- `backup/AnesFact_6-12.monolith.html` — respaldo del index monolítico original

## Supabase (mantener siempre activo)

El plan free de Supabase **pausa el proyecto ~7 días sin actividad**. Hay dos mecanismos:

| Mecanismo | Cuándo actúa |
|-----------|--------------|
| `js/supabase-keepalive.js` | Al abrir la app y cada 6 h mientras está abierta |
| GitHub Action `supabase-keepalive.yml` | **2 veces al día** aunque nadie abra la app |

### Paso 1 — Activar Supabase (solo si está pausado)

1. Entrá a [supabase.com](https://supabase.com) → proyecto **xntvibfsuubedplptvzs**
2. Si dice **Paused**, tocá **Restore project**

### Paso 2 — Configurar el ping automático en GitHub

1. Subí este repo a GitHub (o agregá el workflow al repo de producción `diegomc77-hash/AnestFact`)
2. **Settings → Secrets and variables → Actions → New repository secret**
3. Crear **un solo secret**:
   - Nombre: `SUPABASE_ANON_KEY`
   - Valor: la **anon key** del proyecto (Supabase → Project Settings → API → `anon` `public`)
4. **Actions** → habilitar workflows si GitHub lo pide
5. Probar: **Actions → Supabase keepalive → Run workflow**

Si el ping falla con HTTP distinto de 200/206, el proyecto está pausado o la key es incorrecta.

### Paso 3 — Verificar que funciona

- En GitHub: **Actions** → debería aparecer una ejecución verde cada ~12 h
- En Supabase: **Project Settings → Usage** — debería registrar actividad periódica

## GitHub Pages

Publicar esta carpeta como Pages (rama `main` o `gh-pages`). Mismo Supabase que producción para pruebas GECLISA.
