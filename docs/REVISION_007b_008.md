# Revisión conjunta 007b + 008 (antes de ejecutar)

## Orden propuesto

1. Revisar ambos archivos (este doc + SQL).
2. Ejecutar **solo** `007b_security_hardening.sql`.
3. Probar login / sync / set plan.
4. Ejecutar **`008_security_firma_geclisa_sesiones.sql`**.
5. Desplegar app que use las RPCs nuevas.

**No ejecutar** `007_security_hardening.sql` (el de shares).

---

## 007b — qué hace

| Incluye | No incluye |
|---------|------------|
| RLS sync solo dueño | Shares / pareja |
| Triggers anti auto-pro | Lectura admin de fojas |
| `expires_at` en `anesfact_datos` | Token GECLISA 1 uso |
| `af_assert_plan` | Firma certificada |
| `af_admin_set_plan` + sanatorios | Sesiones / crypto local |

Archivo: `supabase/migrations/007b_security_hardening.sql`

---

## 008 — qué hace (borrador)

| Bloque | SQL | App después |
|--------|-----|-------------|
| **A Admin** | DROP `af_admin_get/set_user_sync`; shares si existían. Legacy backups → **009** | Quitar “Ver fojas” |
| **B GECLISA** | Tabla + `af_geclisa_create_token` / `af_geclisa_consume_token` | `enviarAGeclisa` + `fill.js` |
| **C Firma** | Columnas + `af_certificar_firma` / `af_get_mi_firma` / reset admin | Config 1 vez; foja sin canvas |
| **D Sesiones** | `anesfact_sessions` + register/check | Login: 1 PC + 1 móvil |
| **E–F Crypto** | Solo contrato en comentarios | localStorage + export con clave |

Archivo: `supabase/migrations/008_security_firma_geclisa_sesiones.sql`

---

## Qué NO cambia en GECLISA clínico

El JSON que se pega en GECLISA **sigue llevando DNI real**.  
Solo cambia el **acceso temporal** (token opaco de un uso, 2 h).

---

## Riesgos a tener en cuenta al revisar

1. Tras el 008, “Ver fojas” del panel admin **dejará de funcionar** (a propósito).
2. `af_geclisa_consume_token` es ejecutable por `anon` (necesario para el bookmarklet); el secreto es el token de 48 hex chars + un solo uso.
3. Firma en DB como `text` (data URL): tamaño limitado a ~800 KB en la RPC.
4. Crypto local / export: **no están en el SQL**; hay que implementarlos en JS en el mismo release.
