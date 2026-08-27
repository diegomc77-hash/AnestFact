-- AnesFact 014 — af_admin_set_plan preserva sanatorios extra
-- Unión: default del plan nuevo + lo que el usuario ya tenía de más.
-- No pisa extras (SISalud de Huerta, etc.). Sin extras = mismo default de siempre.
-- No cambia DEFAULTS.pro del cliente ni el select de la PWA.

CREATE OR REPLACE FUNCTION public.af_sanatorios_union_plan(p_plan text, p_existing text[])
RETURNS text[]
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH d AS (
    SELECT CASE lower(trim(COALESCE(p_plan, '')))
      WHEN 'demo' THEN ARRAY['Hospital Aeronáutico']::text[]
      WHEN 'basico' THEN ARRAY['Hospital Aeronáutico','Sanatorio Mayo']::text[]
      WHEN 'pro' THEN ARRAY['Hospital Aeronáutico','Sanatorio Mayo','Clínica Allende','Clínica Privada Córdoba']::text[]
      ELSE ARRAY[]::text[]
    END AS def
  )
  SELECT d.def || COALESCE(ARRAY(
    SELECT DISTINCT n
    FROM unnest(COALESCE(p_existing, ARRAY[]::text[])) AS n
    WHERE n IS NOT NULL
      AND btrim(n) <> ''
      AND NOT (n = ANY (d.def))
  ), ARRAY[]::text[])
  FROM d;
$$;

REVOKE ALL ON FUNCTION public.af_sanatorios_union_plan(text, text[]) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.af_admin_set_plan(p_user_id uuid, p_plan text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_plan text;
  v_old text[];
  v_sans text[];
BEGIN
  IF NOT public.af_is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id requerido';
  END IF;
  v_plan := lower(trim(p_plan));
  IF v_plan NOT IN ('demo', 'basico', 'pro', 'bloqueado') THEN
    RAISE EXCEPTION 'plan inválido: %', p_plan;
  END IF;

  SELECT email::text INTO v_email FROM auth.users WHERE id = p_user_id;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'usuario no existe en auth';
  END IF;

  SELECT sanatorios_permitidos INTO v_old
  FROM public.anesfact_usuarios
  WHERE id = p_user_id;

  v_sans := public.af_sanatorios_union_plan(v_plan, v_old);

  INSERT INTO public.anesfact_usuarios (id, email, plan, rol, activo, fojas_semana, semana_reset, sanatorios_permitidos)
  VALUES (p_user_id, v_email, v_plan, 'user', true, 0, CURRENT_DATE, v_sans)
  ON CONFLICT (id) DO UPDATE SET
    plan = EXCLUDED.plan,
    email = COALESCE(NULLIF(anesfact_usuarios.email, ''), EXCLUDED.email),
    fojas_semana = CASE WHEN EXCLUDED.plan <> 'demo' THEN 0 ELSE anesfact_usuarios.fojas_semana END,
    semana_reset = CASE WHEN EXCLUDED.plan <> 'demo' THEN CURRENT_DATE ELSE anesfact_usuarios.semana_reset END,
    sanatorios_permitidos = EXCLUDED.sanatorios_permitidos;

  UPDATE public.anesfact_usuarios
  SET plan = v_plan, sanatorios_permitidos = v_sans
  WHERE id = p_user_id;

  RETURN json_build_object('ok', true, 'id', p_user_id, 'plan', v_plan, 'email', v_email, 'sanatorios', v_sans);
END;
$$;

REVOKE ALL ON FUNCTION public.af_admin_set_plan(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_admin_set_plan(uuid, text) TO authenticated;
