-- AnesFact v8 — Admin ve TODOS los usuarios de auth (incluso sin fila en anesfact_usuarios)
-- Ejecutar en Supabase → SQL Editor

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
    au.id,
    COALESCE(u.email, au.email::text),
    COALESCE(u.nombre, ''),
    u.matricula,
    COALESCE(u.plan, 'demo'),
    COALESCE(u.rol, 'user'),
    COALESCE(u.fojas_semana, 0),
    COALESCE(u.activo, true),
    COALESCE(u.created_at, au.created_at),
    COALESCE((
      SELECT jsonb_array_length(COALESCE((d.datos::jsonb)->'intervs', '[]'::jsonb))::integer
      FROM public.anesfact_datos d
      WHERE d.owner_id = au.id OR d.clave = 'anesfact_sync_' || au.id::text
      ORDER BY CASE WHEN d.owner_id = au.id THEN 0 ELSE 1 END
      LIMIT 1
    ), 0) AS sync_fojas
  FROM auth.users au
  LEFT JOIN public.anesfact_usuarios u ON u.id = au.id
  ORDER BY COALESCE(u.created_at, au.created_at) DESC NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.af_admin_list_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_admin_list_users() TO authenticated;
