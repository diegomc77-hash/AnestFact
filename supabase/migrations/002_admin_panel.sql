-- AnesFact v8 — Panel admin (modo dios) seguro
-- Ejecutar DESPUÉS de 001_auth_plans_rls.sql en Supabase → SQL Editor
--
-- Seguridad:
--   • Nunca se usa service_role en la app (solo anon + JWT del usuario).
--   • El rol admin solo se asigna con SQL (no desde la app por usuarios comunes).
--   • Trigger impide auto-promoción a admin o cambio de plan propio.
--   • Las funciones RPC verifican af_is_admin() en el servidor.

-- 1) Columnas extra en perfil
ALTER TABLE anesfact_usuarios
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS rol text DEFAULT 'user' CHECK (rol IN ('user', 'admin'));

CREATE INDEX IF NOT EXISTS anesfact_usuarios_email_idx ON anesfact_usuarios (lower(email));
CREATE INDEX IF NOT EXISTS anesfact_usuarios_rol_idx ON anesfact_usuarios (rol);

-- 2) Helper: ¿es admin la sesión actual?
CREATE OR REPLACE FUNCTION public.af_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.anesfact_usuarios
    WHERE id = auth.uid() AND rol = 'admin' AND activo = true
  );
$$;

REVOKE ALL ON FUNCTION public.af_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_is_admin() TO authenticated;

-- 3) Trigger: usuarios normales no pueden cambiar plan, rol ni activo
CREATE OR REPLACE FUNCTION public.af_guard_usuario_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.af_is_admin() AND auth.uid() = OLD.id THEN
    NEW.rol := OLD.rol;
    NEW.plan := OLD.plan;
    NEW.activo := OLD.activo;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_af_guard_usuario_update ON public.anesfact_usuarios;
CREATE TRIGGER trg_af_guard_usuario_update
  BEFORE UPDATE ON public.anesfact_usuarios
  FOR EACH ROW EXECUTE FUNCTION public.af_guard_usuario_update();

-- 4) Políticas RLS actualizadas
DROP POLICY IF EXISTS "usuarios_select_own" ON public.anesfact_usuarios;
DROP POLICY IF EXISTS "usuarios_update_own" ON public.anesfact_usuarios;

CREATE POLICY "usuarios_select" ON public.anesfact_usuarios
  FOR SELECT USING (public.af_is_admin() OR auth.uid() = id);

CREATE POLICY "usuarios_update" ON public.anesfact_usuarios
  FOR UPDATE USING (public.af_is_admin() OR auth.uid() = id);

-- INSERT sin cambios (solo fila propia al registrarse)

-- 5) RPC: listar usuarios (solo admin)
CREATE OR REPLACE FUNCTION public.af_admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  nombre text,
  matricula text,
  plan text,
  rol text,
  fojas_semana integer,
  activo boolean,
  created_at timestamptz,
  sync_fojas integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.af_is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.nombre,
    u.matricula,
    u.plan,
    u.rol,
    u.fojas_semana,
    u.activo,
    u.created_at,
    COALESCE((
      SELECT jsonb_array_length(COALESCE((d.datos::jsonb)->'intervs', '[]'::jsonb))::integer
      FROM public.anesfact_datos d
      WHERE d.owner_id = u.id OR d.clave = 'anesfact_sync_' || u.id::text
      ORDER BY CASE WHEN d.owner_id = u.id THEN 0 ELSE 1 END
      LIMIT 1
    ), 0) AS sync_fojas
  FROM public.anesfact_usuarios u
  ORDER BY u.created_at DESC NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.af_admin_list_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_admin_list_users() TO authenticated;

-- 6) RPC: backups legacy sin owner (ej. Dra. Huerta pre-v8)
CREATE OR REPLACE FUNCTION public.af_admin_legacy_backups()
RETURNS TABLE (
  clave text,
  owner_id uuid,
  sync_fojas integer,
  guardado text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.af_is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    d.clave,
    d.owner_id,
    jsonb_array_length(COALESCE((d.datos::jsonb)->'intervs', '[]'::jsonb))::integer AS sync_fojas,
    COALESCE((d.datos::jsonb)->>'guardado', '') AS guardado
  FROM public.anesfact_datos d
  WHERE d.owner_id IS NULL
     OR d.clave IN (
       'anesfact_sync_HUERTA_MARIA_SOLEDAD',
       'anesfact_sync_backup'
     )
  ORDER BY d.clave;
END;
$$;

REVOKE ALL ON FUNCTION public.af_admin_legacy_backups() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_admin_legacy_backups() TO authenticated;

-- 7) RPC: vincular backup legacy a un usuario (no borra datos)
CREATE OR REPLACE FUNCTION public.af_admin_link_backup(p_clave text, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.af_is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.anesfact_usuarios WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'user not found';
  END IF;
  UPDATE public.anesfact_datos
  SET owner_id = p_user_id
  WHERE clave = p_clave;
END;
$$;

REVOKE ALL ON FUNCTION public.af_admin_link_backup(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_admin_link_backup(text, uuid) TO authenticated;

-- =============================================================================
-- BOOTSTRAP (ejecutar manualmente UNA VEZ, reemplazá el email):
--
--   UPDATE anesfact_usuarios
--   SET rol = 'admin', plan = 'pro', email = 'tu@email.com'
--   WHERE email = 'tu@email.com'
--      OR id = (SELECT id FROM auth.users WHERE email = 'tu@email.com' LIMIT 1);
--
-- Dra. Huerta (después de registrarse):
--
--   UPDATE anesfact_usuarios SET plan = 'pro', email = 'huerta@...'
--   WHERE nombre ILIKE '%HUERTA%' OR email ILIKE '%huerta%';
--
-- Vincular fojas legacy a su cuenta (opcional, la app ya hace fallback):
--
--   SELECT af_admin_link_backup(
--     'anesfact_sync_HUERTA_MARIA_SOLEDAD',
--     '<uuid-de-huerta>'
--   );
-- =============================================================================
