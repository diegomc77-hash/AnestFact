-- AnesFact 019 — INSERT Demo no inflable + matrícula única + alerta cluster
-- 1) No-admin: siempre Aero, sin override, reloj Demo ahora (ignora el JSON del cliente).
-- 2) Misma M.P. (solo dígitos) = una cuenta. Bloquea otra Demo con otro email.
-- 3) Varias Demo en el mismo lugar en 7 días: no bloquea; deja rastro en anesfact_plan_audit.

CREATE OR REPLACE FUNCTION public.af_matricula_norm(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT regexp_replace(lower(trim(COALESCE(p, ''))), '[^0-9]', '', 'g');
$$;

REVOKE ALL ON FUNCTION public.af_matricula_norm(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_matricula_norm(text) TO authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS anesfact_usuarios_matricula_norm_uidx
  ON public.anesfact_usuarios (public.af_matricula_norm(matricula))
  WHERE public.af_matricula_norm(matricula) <> '';

CREATE OR REPLACE FUNCTION public.af_guard_usuario_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mp text;
  v_otro uuid;
BEGIN
  IF NOT public.af_is_admin() THEN
    NEW.plan := 'demo';
    NEW.rol := 'user';
    NEW.activo := true;
    NEW.sanatorios_permitidos := ARRAY['Hospital Aeronáutico']::text[];
    NEW.privados_max_override := NULL;
    NEW.demo_started_at := now();
    NEW.plan_expires_at := NEW.demo_started_at + interval '1 month';
    NEW.fojas_semana := 0;

    v_mp := public.af_matricula_norm(NEW.matricula);
    IF v_mp IS NULL OR length(v_mp) < 4 THEN
      RAISE EXCEPTION 'M.P. requerida (mínimo 4 dígitos). Sin matrícula no se abre Demo.'
        USING ERRCODE = 'P0001';
    END IF;

    SELECT u.id INTO v_otro
    FROM public.anesfact_usuarios u
    WHERE public.af_matricula_norm(u.matricula) = v_mp
      AND u.id IS DISTINCT FROM NEW.id
    LIMIT 1;

    IF v_otro IS NOT NULL THEN
      RAISE EXCEPTION 'Esta matrícula ya tiene cuenta en AnesFact. Ingresá con el email original o pedile al admin que reactive esa cuenta. No se abre otra Demo.'
        USING ERRCODE = 'P0001';
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
    NEW.privados_max_override := OLD.privados_max_override;
    NEW.demo_started_at := OLD.demo_started_at;
    NEW.plan_expires_at := OLD.plan_expires_at;
    NEW.matricula := OLD.matricula;
    IF current_setting('anesfact.allow_foja_counter', true) IS DISTINCT FROM '1' THEN
      NEW.fojas_semana := OLD.fojas_semana;
      NEW.semana_reset := OLD.semana_reset;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE INSERT (
  plan, rol,
  sanatorios_permitidos, privados_max_override,
  demo_started_at, plan_expires_at
) ON public.anesfact_usuarios FROM anon, authenticated;

REVOKE UPDATE (
  fojas_semana, semana_reset, demo_started_at, plan_expires_at,
  sanatorios_permitidos, privados_max_override, matricula, plan, rol
) ON public.anesfact_usuarios FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.af_flag_demo_lugar_cluster()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lugar text;
  v_n int;
BEGIN
  IF NEW.plan IS DISTINCT FROM 'demo' THEN
    RETURN NEW;
  END IF;
  IF COALESCE(NEW.rol, 'user') = 'admin' THEN
    RETURN NEW;
  END IF;

  FOREACH v_lugar IN ARRAY COALESCE(NEW.sanatorios_permitidos, ARRAY[]::text[])
  LOOP
    IF v_lugar IS NULL OR btrim(v_lugar) = '' THEN
      CONTINUE;
    END IF;
    SELECT count(*)::int INTO v_n
    FROM public.anesfact_usuarios u
    WHERE u.plan = 'demo'
      AND COALESCE(u.rol, 'user') IS DISTINCT FROM 'admin'
      AND u.created_at >= now() - interval '7 days'
      AND v_lugar = ANY (COALESCE(u.sanatorios_permitidos, ARRAY[]::text[]));

    IF v_n >= 3 THEN
      INSERT INTO public.anesfact_plan_audit (admin_id, user_id, action, detail)
      VALUES (
        NULL,
        NEW.id,
        'demo_lugar_cluster',
        json_build_object(
          'lugar', v_lugar,
          'n_demo_7d', v_n,
          'ventana_dias', 7,
          'matricula_norm', public.af_matricula_norm(NEW.matricula)
        )::jsonb
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_af_flag_demo_lugar_cluster ON public.anesfact_usuarios;
CREATE TRIGGER trg_af_flag_demo_lugar_cluster
  AFTER INSERT ON public.anesfact_usuarios
  FOR EACH ROW EXECUTE FUNCTION public.af_flag_demo_lugar_cluster();

NOTIFY pgrst, 'reload schema';
