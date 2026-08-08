# Seguridad AnesFact — paso 007 (obligatorio en Supabase)

## Modelo de uso (importante)

| Rol | Qué puede hacer |
|-----|-----------------|
| **Anestesista (plan pago)** | Solo su cuenta: sus pacientes, su nombre/matrícula en la foja. **No se presta la app.** |
| **Diego (admin / soporte)** | Ver fojas de un usuario para ayudar en conflictos. **No firma** como ese anestesista; la impresión usa la identidad del **titular**. |
| **Pareja share (SQL)** | Solo lectura cruzada de sync para soporte. No cambia quién es el profesional de la cuenta. |

## Qué se corrigió en la app (v11.0)

| Área | Cambio |
|------|--------|
| Identidad | Firma impresa / GECLISA usan perfil del titular (ya no Huerta hardcodeado) |
| Prestarse la app | Aviso al cambiar nombre/matrícula si ya hay identidad en servidor |
| Modo admin “Ver fojas” | No permite guardar anestesista; firma = titular |
| Aislamiento sync | Sin fallback Huerta/legacy |
| Plan | Trigger INSERT fuerza demo/user |
| Sanatorios | Por plan |
| Anti-captura | Solo pantalla (demo); no print/GECLISA |
| QR | Local, sin CDN con token |

## Qué tenés que ejecutar vos (1 vez)

1. Supabase → SQL Editor → `supabase/migrations/007_security_hardening.sql`

## Vincular soporte Diego ↔ Soledad (opcional)

```sql
SELECT af_admin_link_share('<uuid-diego>', '<uuid-soledad>');
```

## Límites honestos

- Cámara externa: no se bloquea al 100%.
- Consola del navegador: UI se puede intentar bypassear; servidor (RLS + RPC) es la defensa tras migrar SQL.
- GECLISA bookmarklet: puente por DNI con TTL 2 h (flujo Mayo).
