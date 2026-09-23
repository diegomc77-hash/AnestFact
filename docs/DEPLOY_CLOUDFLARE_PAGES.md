# Deploy AnesFact en Cloudflare Pages (Ticket 3)

Reemplazo gradual de GitHub Pages (ToS SaaS). GitHub Pages puede seguir vivo hasta apagarlo a propósito.

## Una vez en el dashboard de Cloudflare

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Repo: el mismo de AnesFact (producción o el que ya pushea Pages).
3. Build settings:
   - **Framework preset:** None
   - **Build command:** (vacío)
   - **Build output directory:** `/` (raíz del repo estático)
4. **Project name:** `anestfact` → URL fija `https://anestfact.pages.dev` (ya autorizada en `seguridad.js` y en la extensión).
5. Deploy. Probar login + sync en esa URL.

## `.assetsignore` (obligatorio)

Cloudflare rechaza archivos >25 MB. En la raíz del repo está `.assetsignore` que excluye `tools/` (incluye `tools/apk-ref/app.zip` ~63 MB) y `backup/`. Sin ese archivo el build falla con `Asset too large`.

Dominio custom (opcional, después): Pages → Custom domains. Si agregás uno nuevo, sumarlo a `DOMINIOS_EXACTOS` en `seguridad.js` y a `host_permissions` / `externally_connectable` / content_scripts de `chrome-extension-geclisa-batch/manifest.json`, y a `ANESFACT_TAB_URLS` + `isAllowedAnesFactExternalSender` en `background.js`. Recargar la extensión.

## Código ya preparado en el repo

| Archivo | Qué |
|---|---|
| `.assetsignore` | Excluye `tools/` y `backup/` del upload a Pages |
| `seguridad.js` | Autoriza `anestfact.pages.dev` y `*.anestfact.pages.dev` |
| Extensión ≥ **0.6.26** | `host_permissions`, bridge, external sender |
| GitHub Pages | Sigue autorizado (`diegomc77-hash.github.io`) hasta que lo cortes |

## Supabase Auth — redirect URLs

En Supabase → Authentication → URL Configuration, agregar:

- `https://anestfact.pages.dev`
- `https://anestfact.pages.dev/**` (si pedís wildcards)
- Previews si los usás: `https://*.anestfact.pages.dev/**`

Sin eso el login/recovery puede fallar en el dominio nuevo aunque `seguridad.js` deje pasar.

## Nota PHI / BAA

Los datos de pacientes van navegador ↔ Supabase; el hosting estático no los aloja. Ver `docs/AVISO_INFRA_GRANTS_MIGRACION.md` §3.
