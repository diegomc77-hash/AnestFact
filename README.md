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

## Supabase (evitar pausa por inactividad)

1. En [supabase.com](https://supabase.com): si el proyecto está **Paused**, hacer **Restore**.
2. La app hace ping al abrir y cada 6 h mientras está abierta.
3. En GitHub: **Settings → Secrets → Actions**, crear:
   - `SUPABASE_URL` = `https://xntvibfsuubedplptvzs.supabase.co`
   - `SUPABASE_ANON_KEY` = (anon key del proyecto)
4. El workflow `.github/workflows/supabase-keepalive.yml` hace ping **diario** aunque nadie abra la app.

## GitHub Pages

Publicar esta carpeta como Pages (rama `main` o `gh-pages`). Mismo Supabase que producción para pruebas GECLISA.
