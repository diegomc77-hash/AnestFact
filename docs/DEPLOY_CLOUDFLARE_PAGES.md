# Deploy AnesFact en Cloudflare (Ticket 3)

Reemplazo gradual de GitHub Pages (ToS SaaS). GitHub Pages puede seguir vivo hasta apagarlo a propósito.

**Nota (Bug 2, 2026-09-23):** el proyecto quedó como **Worker con assets estáticos** (`npx wrangler deploy`), no Pages clásico. La URL real es `*.workers.dev`, no `*.pages.dev`.

## URL de producción

- **Producción:** `https://anestfact.diegomc77.workers.dev`
- **Previews de rama:** `https://<rama>-anestfact.diegomc77.workers.dev`

## Una vez en el dashboard de Cloudflare

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → proyecto **anestfact** (conectado al repo GitHub).
2. Build settings típicos (Workers Builds / wrangler):
   - Deploy con assets estáticos desde la raíz del repo
   - Obligatorio: `.assetsignore` en la raíz (excluye `tools/`, `backup/`) — sin eso falla con `Asset too large` (>25 MB)
3. Tras cada push a `main`, el check GitHub **Workers Builds: anestfact** debe quedar en Success.
4. Probar login + sync en `https://anestfact.diegomc77.workers.dev`.

Dominio custom (opcional, después): Custom domains. Si agregás uno nuevo, sumarlo a `DOMINIOS_EXACTOS` en `seguridad.js` y a `host_permissions` / `externally_connectable` / content_scripts de `chrome-extension-geclisa-batch/manifest.json`, y a `ANESFACT_TAB_URLS` + `isAllowedAnesFactExternalSender` en `background.js`. Recargar la extensión.

## Código ya preparado en el repo

| Archivo | Qué |
|---|---|
| `.assetsignore` | Excluye `tools/` y `backup/` del upload |
| `seguridad.js` | Autoriza `anestfact.diegomc77.workers.dev` y previews `*-anestfact.diegomc77.workers.dev` |
| Extensión ≥ **0.6.27** | Hosts Workers (`*.diegomc77.workers.dev` en match patterns; el bridge solo acepta sufijo `-anestfact…`) |
| GitHub Pages | Sigue autorizado (`diegomc77-hash.github.io`) hasta que lo cortes |

## Supabase Auth — redirect URLs

En Supabase → Authentication → URL Configuration, agregar (y quitar las de `.pages.dev` si quedaron):

- `https://anestfact.diegomc77.workers.dev`
- `https://anestfact.diegomc77.workers.dev/**` (si pedís wildcards)
- Previews si los usás: `https://*-anestfact.diegomc77.workers.dev/**`

Sin eso el login/recovery puede fallar en el dominio nuevo aunque `seguridad.js` deje pasar.

## Nota PHI / BAA

Los datos de pacientes van navegador ↔ Supabase; el hosting estático no los aloja. Ver `docs/AVISO_INFRA_GRANTS_MIGRACION.md` §3.
