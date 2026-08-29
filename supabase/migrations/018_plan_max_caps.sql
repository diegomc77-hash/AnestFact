-- AnesFact 018 — Caps de lugares: Básico 1 / Max 2 / Pro 3
-- 1 público sigue transversal. Aero cuenta. Rechaza, no recorta.
-- No toca arrays existentes (Huerta sigue Pro).

ALTER TABLE public.anesfact_usuarios DROP CONSTRAINT IF EXISTS anesfact_usuarios_plan_check;
ALTER TABLE public.anesfact_usuarios
  ADD CONSTRAINT anesfact_usuarios_plan_check
  CHECK (plan IN ('demo', 'basico', 'max', 'pro', 'bloqueado'));

CREATE OR REPLACE FUNCTION public.af_plan_privados_cap(p_plan text, p_override integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE lower(trim(COALESCE(p_plan, '')))
    WHEN 'demo' THEN 1
    WHEN 'basico' THEN 1
    WHEN 'max' THEN 2
    WHEN 'pro' THEN COALESCE(p_override, 3)
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.af_sanatorios_union_plan(p_plan text, p_existing text[])
RETURNS text[]
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH d AS (
    SELECT CASE lower(trim(COALESCE(p_plan, '')))
      WHEN 'demo' THEN ARRAY['Hospital Aeronáutico']::text[]
      WHEN 'basico' THEN ARRAY[]::text[]
      WHEN 'max' THEN ARRAY[]::text[]
      WHEN 'pro' THEN ARRAY[]::text[]
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
  v_old_plan text;
  v_started timestamptz;
  v_expires timestamptz;
  v_override integer;
  v_rol text;
  v_sans text[];
  v_check json;
BEGIN
  IF NOT public.af_is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id requerido';
  END IF;
  v_plan := lower(trim(p_plan));
  IF v_plan NOT IN ('demo', 'basico', 'max', 'pro', 'bloqueado') THEN
    RAISE EXCEPTION 'plan inválido: %', p_plan;
  END IF;

  SELECT email::text INTO v_email FROM auth.users WHERE id = p_user_id;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'usuario no existe en auth';
  END IF;

  SELECT sanatorios_permitidos, plan, demo_started_at, plan_expires_at, privados_max_override, rol
  INTO v_old, v_old_plan, v_started, v_expires, v_override, v_rol
  FROM public.anesfact_usuarios
  WHERE id = p_user_id;

  IF v_old IS NULL THEN
    v_sans := CASE v_plan
      WHEN 'demo' THEN ARRAY['Hospital Aeronáutico']::text[]
      ELSE ARRAY[]::text[]
    END;
  ELSE
    v_sans := public.af_normalize_sanatorios(v_old);
  END IF;

  IF COALESCE(v_rol, 'user') IS DISTINCT FROM 'admin' THEN
    v_check := public.af_plan_lugares_check(v_plan, v_sans, v_override);
    IF (v_check->>'ok') IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION '%', COALESCE(v_check->>'message', 'plan no admite esos lugares')
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF v_plan = 'demo' THEN
    IF COALESCE(v_old_plan, '') = 'demo' AND v_started IS NOT NULL THEN
      NULL;
    ELSE
      v_started := now();
      v_expires := v_started + interval '1 month';
    END IF;
  ELSE
    v_expires := NULL;
  END IF;

  INSERT INTO public.anesfact_usuarios (
    id, email, plan, rol, activo, fojas_semana, semana_reset, sanatorios_permitidos,
    demo_started_at, plan_expires_at, privados_max_override
  )
  VALUES (
    p_user_id, v_email, v_plan, 'user', true, 0, CURRENT_DATE, v_sans,
    v_started, v_expires, v_override
  )
  ON CONFLICT (id) DO UPDATE SET
    plan = EXCLUDED.plan,
    email = COALESCE(NULLIF(anesfact_usuarios.email, ''), EXCLUDED.email),
    fojas_semana = CASE WHEN EXCLUDED.plan <> 'demo' THEN 0 ELSE anesfact_usuarios.fojas_semana END,
    semana_reset = CASE WHEN EXCLUDED.plan <> 'demo' THEN CURRENT_DATE ELSE anesfact_usuarios.semana_reset END,
    sanatorios_permitidos = EXCLUDED.sanatorios_permitidos,
    demo_started_at = COALESCE(EXCLUDED.demo_started_at, anesfact_usuarios.demo_started_at),
    plan_expires_at = EXCLUDED.plan_expires_at;

  UPDATE public.anesfact_usuarios
  SET plan = v_plan,
      sanatorios_permitidos = v_sans,
      demo_started_at = v_started,
      plan_expires_at = v_expires
  WHERE id = p_user_id;

  PERFORM public.af_plan_audit_write(p_user_id, 'set_plan', json_build_object(
    'plan', v_plan,
    'sanatorios', v_sans
  )::jsonb);

  RETURN json_build_object(
    'ok', true,
    'id', p_user_id,
    'plan', v_plan,
    'email', v_email,
    'sanatorios', v_sans,
    'plan_expires_at', v_expires
  );
END;
$$;

REVOKE ALL ON FUNCTION public.af_admin_set_plan(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_admin_set_plan(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
