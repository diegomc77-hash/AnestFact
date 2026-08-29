-- AnesFact 015 — Lote 1 planes: Demo 1 mes + 5 fojas/semana (servidor)
-- No toca sanatorios_permitidos, Huerta, ni tope de lugares (lotes 2–3).
-- Semana: lunes en America/Argentina/Cordoba.
-- Backfill Demo existente: reloj desde ahora (no vencer cuentas viejas al aplicar).

ALTER TABLE public.anesfact_usuarios
  ADD COLUMN IF NOT EXISTS demo_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;

UPDATE public.anesfact_usuarios
SET
  demo_started_at = COALESCE(demo_started_at, now()),
  plan_expires_at = COALESCE(plan_expires_at, COALESCE(demo_started_at, now()) + interval '1 month')
WHERE plan = 'demo'
  AND COALESCE(rol, 'user') IS DISTINCT FROM 'admin';

CREATE OR REPLACE FUNCTION public.af_semana_lunes_ar()
RETURNS date
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT (
    (timezone('America/Argentina/Cordoba', now()))::date
    - (EXTRACT(ISODOW FROM (timezone('America/Argentina/Cordoba', now()))::date)::int - 1)
  );
$$;

REVOKE ALL ON FUNCTION public.af_semana_lunes_ar() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.af_guard_usuario_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.af_is_admin() THEN
    NEW.plan := 'demo';
    NEW.rol := 'user';
    NEW.activo := true;
    IF NEW.sanatorios_permitidos IS NULL THEN
      NEW.sanatorios_permitidos := ARRAY['Hospital Aeronáutico'];
    END IF;
    IF NEW.demo_started_at IS NULL THEN
      NEW.demo_started_at := now();
    END IF;
    IF NEW.plan_expires_at IS NULL THEN
      NEW.plan_expires_at := NEW.demo_started_at + interval '1 month';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

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
    NEW.sanatorios_permitidos := OLD.sanatorios_permitidos;
    NEW.demo_started_at := OLD.demo_started_at;
    NEW.plan_expires_at := OLD.plan_expires_at;
    IF current_setting('anesfact.allow_foja_counter', true) IS DISTINCT FROM '1' THEN
      NEW.fojas_semana := OLD.fojas_semana;
      NEW.semana_reset := OLD.semana_reset;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE UPDATE (fojas_semana, semana_reset, demo_started_at, plan_expires_at)
  ON public.anesfact_usuarios FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.af_assert_plan(p_feature text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_activo boolean;
  v_rol text;
  v_fojas int;
  v_reset date;
  v_sans text[];
  v_expires timestamptz;
  v_monday date;
  v_feat text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'no_auth');
  END IF;

  SELECT plan, activo, rol, fojas_semana, semana_reset, sanatorios_permitidos, plan_expires_at
  INTO v_plan, v_activo, v_rol, v_fojas, v_reset, v_sans, v_expires
  FROM public.anesfact_usuarios
  WHERE id = auth.uid();

  IF v_rol = 'admin' THEN
    RETURN json_build_object('ok', true, 'plan', 'pro', 'admin', true, 'sanatorios', v_sans);
  END IF;

  IF NOT COALESCE(v_activo, false) OR v_plan = 'bloqueado' THEN
    RETURN json_build_object('ok', false, 'error', 'bloqueado', 'plan', COALESCE(v_plan, 'bloqueado'));
  END IF;

  v_plan := COALESCE(v_plan, 'demo');
  v_feat := COALESCE(p_feature, '');

  IF v_plan = 'demo' AND v_expires IS NOT NULL AND now() >= v_expires THEN
    RETURN json_build_object('ok', false, 'error', 'demo_vencido', 'plan', v_plan, 'plan_expires_at', v_expires);
  END IF;

  IF v_feat = 'imprimir' AND v_plan = 'demo' THEN
    RETURN json_build_object('ok', false, 'error', 'upgrade', 'feature', 'imprimir', 'plan', v_plan);
  END IF;
  IF v_feat = 'geclisa' AND v_plan = 'demo' THEN
    RETURN json_build_object('ok', false, 'error', 'upgrade', 'feature', 'geclisa', 'plan', v_plan);
  END IF;
  IF v_feat = 'foja' AND v_plan = 'demo' THEN
    v_monday := public.af_semana_lunes_ar();
    IF v_reset IS NULL OR v_reset < v_monday THEN
      v_fojas := 0;
    END IF;
    IF COALESCE(v_fojas, 0) >= 5 THEN
      RETURN json_build_object(
        'ok', false,
        'error', 'limite_semanal',
        'plan', v_plan,
        'fojas_semana', v_fojas,
        'fojas_limite', 5
      );
    END IF;
  END IF;

  RETURN json_build_object(
    'ok', true,
    'plan', v_plan,
    'sanatorios', COALESCE(v_sans, ARRAY['Hospital Aeronáutico']),
    'fojas_semana', COALESCE(v_fojas, 0),
    'fojas_limite', 5,
    'plan_expires_at', v_expires
  );
END;
$$;

REVOKE ALL ON FUNCTION public.af_assert_plan(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_assert_plan(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.af_consume_foja()
RETURNS json
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_activo boolean;
  v_rol text;
  v_fojas int;
  v_reset date;
  v_expires timestamptz;
  v_monday date;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'no_auth');
  END IF;

  SELECT plan, activo, rol, fojas_semana, semana_reset, plan_expires_at
  INTO v_plan, v_activo, v_rol, v_fojas, v_reset, v_expires
  FROM public.anesfact_usuarios
  WHERE id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'no_auth');
  END IF;

  IF v_rol = 'admin' THEN
    RETURN json_build_object('ok', true, 'plan', 'pro', 'admin', true, 'consumed', false, 'fojas_semana', COALESCE(v_fojas, 0));
  END IF;

  IF NOT COALESCE(v_activo, false) OR v_plan = 'bloqueado' THEN
    RETURN json_build_object('ok', false, 'error', 'bloqueado', 'plan', COALESCE(v_plan, 'bloqueado'));
  END IF;

  v_plan := COALESCE(v_plan, 'demo');

  IF v_plan <> 'demo' THEN
    RETURN json_build_object('ok', true, 'plan', v_plan, 'consumed', false, 'fojas_semana', COALESCE(v_fojas, 0));
  END IF;

  IF v_expires IS NOT NULL AND now() >= v_expires THEN
    RETURN json_build_object('ok', false, 'error', 'demo_vencido', 'plan', v_plan, 'plan_expires_at', v_expires);
  END IF;

  v_monday := public.af_semana_lunes_ar();
  IF v_reset IS NULL OR v_reset < v_monday THEN
    v_fojas := 0;
  END IF;

  IF COALESCE(v_fojas, 0) >= 5 THEN
    RETURN json_build_object('ok', false, 'error', 'limite_semanal', 'plan', v_plan, 'fojas_semana', v_fojas, 'fojas_limite', 5);
  END IF;

  PERFORM set_config('anesfact.allow_foja_counter', '1', true);

  UPDATE public.anesfact_usuarios
  SET fojas_semana = COALESCE(v_fojas, 0) + 1,
      semana_reset = v_monday
  WHERE id = auth.uid();

  RETURN json_build_object(
    'ok', true,
    'plan', v_plan,
    'consumed', true,
    'fojas_semana', COALESCE(v_fojas, 0) + 1,
    'fojas_limite', 5,
    'plan_expires_at', v_expires
  );
END;
$$;

REVOKE ALL ON FUNCTION public.af_consume_foja() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_consume_foja() TO authenticated;

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

  SELECT sanatorios_permitidos, plan, demo_started_at, plan_expires_at
  INTO v_old, v_old_plan, v_started, v_expires
  FROM public.anesfact_usuarios
  WHERE id = p_user_id;

  v_sans := public.af_sanatorios_union_plan(v_plan, v_old);

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
    demo_started_at, plan_expires_at
  )
  VALUES (
    p_user_id, v_email, v_plan, 'user', true, 0, CURRENT_DATE, v_sans,
    v_started, v_expires
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
