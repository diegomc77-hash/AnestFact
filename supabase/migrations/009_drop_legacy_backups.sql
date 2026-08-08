-- AnesFact 009 — Quitar RPCs y UI de backups legacy (pre-v8)
-- Prerrequisito: inventario limpio (sin filas huérfanas con datos reales).
-- NO ejecutar hasta confirmar revisión.
--
-- App companion (mismo release):
--   - views/admin.html: sin sección "Backups legacy (pre-v8)"
--   - js/30-admin.js: loadAdminPanel solo llama af_admin_list_users

-- ═══════════════════════════════════════════════════════════
-- DROP RPCs legacy (002_admin_panel.sql)
-- ═══════════════════════════════════════════════════════════

REVOKE ALL ON FUNCTION public.af_admin_legacy_backups() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.af_admin_legacy_backups() FROM authenticated;
REVOKE ALL ON FUNCTION public.af_admin_link_backup(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.af_admin_link_backup(text, uuid) FROM authenticated;

DROP FUNCTION IF EXISTS public.af_admin_legacy_backups();
DROP FUNCTION IF EXISTS public.af_admin_link_backup(text, uuid);

-- Nota: no borra filas de anesfact_datos.
-- Sync activas (UUID + legacy Huerta ya vinculada) quedan intactas.
-- af_admin_list_users / af_admin_set_plan se mantienen.
