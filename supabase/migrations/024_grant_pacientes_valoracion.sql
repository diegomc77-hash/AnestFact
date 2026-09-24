-- 024: Data API GRANT patch for tablas de 005 + foja_qx (022).
-- Idempotente. Ver docs/AVISO_INFRA_GRANTS_MIGRACION.md Ticket 1.
-- Ejecutar en SQL Editor de Supabase (producción) una vez.
-- También quedó embebido en 005 / 005_first_run para db reset / proyectos nuevos.

GRANT SELECT ON public.anesfact_pacientes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anesfact_pacientes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anesfact_pacientes TO service_role;

GRANT SELECT ON public.anesfact_qr_tokens TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anesfact_qr_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anesfact_qr_tokens TO service_role;

GRANT SELECT ON public.anesfact_valoraciones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anesfact_valoraciones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anesfact_valoraciones TO service_role;

GRANT SELECT ON public.anesfact_foja_vinculos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anesfact_foja_vinculos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anesfact_foja_vinculos TO service_role;

-- foja_qx (022): completar checklist Data API (INSERT/UPDATE/DELETE quedan bloqueados por RLS)
GRANT SELECT ON public.anesfact_foja_qx TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anesfact_foja_qx TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anesfact_foja_qx TO service_role;
