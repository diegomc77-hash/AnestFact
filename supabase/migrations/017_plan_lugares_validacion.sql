-- AnesFact 017 — Lote 3 planes: 1 público / N lugares (Aero cuenta)
-- Rechaza (no recorta). Firma no se toca: es otra regla.
-- DEFAULTS.pro vacío en SQL (ya no el paquete de 4).
-- Override >3 solo vía af_admin_set_privados_override (auditado).

-- ═══════════════════════════════════════════════════════════
-- Columna + auditoría
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.anesfact_usuarios
  ADD COLUMN IF NOT EXISTS privados_max_override integer;

ALTER TABLE public.anesfact_usuarios
  DROP CONSTRAINT IF EXISTS anesfact_usuarios_privados_max_override_chk;
ALTER TABLE public.anesfact_usuarios
  ADD CONSTRAINT anesfact_usuarios_privados_max_override_chk
  CHECK (privados_max_override IS NULL OR privados_max_override > 3);

CREATE TABLE IF NOT EXISTS public.anesfact_plan_audit (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  admin_id uuid,
  user_id uuid,
  action text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.anesfact_plan_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plan_audit_admin_select" ON public.anesfact_plan_audit;
CREATE POLICY "plan_audit_admin_select" ON public.anesfact_plan_audit
  FOR SELECT USING (public.af_is_admin());
GRANT SELECT ON public.anesfact_plan_audit TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.anesfact_plan_audit FROM anon, authenticated;

-- ═══════════════════════════════════════════════════════════
-- Helpers
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.af_normalize_sanatorios(p_nombres text[])
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(ARRAY(
    SELECT s.x
    FROM (
      SELECT btrim(n) AS x, min(ord) AS ord
      FROM unnest(COALESCE(p_nombres, ARRAY[]::text[])) WITH ORDINALITY AS t(n, ord)
      WHERE n IS NOT NULL AND btrim(n) <> ''
      GROUP BY btrim(n)
    ) s
    ORDER BY s.ord
  ), ARRAY[]::text[]);
$$;

REVOKE ALL ON FUNCTION public.af_normalize_sanatorios(text[]) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.af_lugar_ambito(p_nombre text)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT i.ambito
      FROM public.anesfact_instituciones i
      WHERE i.nombre = p_nombre
         OR p_nombre = ANY (i.nombre_aliases)
      ORDER BY CASE WHEN i.nombre = p_nombre THEN 0 ELSE 1 END
      LIMIT 1
    ),
    'privado'
  );
$$;

REVOKE ALL ON FUNCTION public.af_lugar_ambito(text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.af_plan_privados_cap(p_plan text, p_override integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE lower(trim(COALESCE(p_plan, '')))
    WHEN 'demo' THEN 1
    WHEN 'basico' THEN 2
    WHEN 'pro' THEN COALESCE(p_override, 3)
    ELSE 0
  END;
$$;

REVOKE ALL ON FUNCTION public.af_plan_privados_cap(text, integer) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.af_plan_lugares_check(
  p_plan text,
  p_nombres text[],
  p_override integer
)
RETURNS json
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_names text[];
  v_plan text;
  v_n_pub int := 0;
  v_n_priv int := 0;
  v_cap int;
  v_nom text;
  v_amb text;
BEGIN
  v_plan := lower(trim(COALESCE(p_plan, '')));
  v_names := public.af_normalize_sanatorios(p_nombres);

  IF v_plan = 'bloqueado' THEN
    RETURN json_build_object(
      'ok', true,
      'plan', v_plan,
      'n_publicos', 0,
      'n_privados', 0,
      'cap_privados', 0,
      'sanatorios', v_names
    );
  END IF;

  FOREACH v_nom IN ARRAY COALESCE(v_names, ARRAY[]::text[])
  LOOP
    v_amb := public.af_lugar_ambito(v_nom);
    IF v_amb = 'publico' THEN
      v_n_pub := v_n_pub + 1;
    ELSE
      v_n_priv := v_n_priv + 1;
    END IF;
  END LOOP;

  v_cap := public.af_plan_privados_cap(v_plan, p_override);

  IF v_n_pub > 1 THEN
    RETURN json_build_object(
      'ok', false,
      'error', 'max_un_publico',
      'n_publicos', v_n_pub,
      'n_privados', v_n_priv,
      'cap_privados', v_cap,
      'sanatorios', v_names,
      'message', 'Máximo 1 hospital público por cuenta (hay ' || v_n_pub || '). Es exclusivo, no acumulable.'
    );
  END IF;

  IF v_n_priv > v_cap THEN
    RETURN json_build_object(
      'ok', false,
      'error', 'max_privados',
      'n_publicos', v_n_pub,
      'n_privados', v_n_priv,
      'cap_privados', v_cap,
      'sanatorios', v_names,
      'message', 'El plan ' || v_plan || ' permite hasta ' || v_cap
        || ' lugares no públicos (Aero cuenta). Hay ' || v_n_priv
        || CASE WHEN v_plan = 'pro' THEN '. Para más de 3, el admin carga un tope extra (override).' ELSE '.' END
    );
  END IF;

  RETURN json_build_object(
    'ok', true,
    'plan', v_plan,
    'n_publicos', v_n_pub,
    'n_privados', v_n_priv,
    'cap_privados', v_cap,
    'sanatorios', v_names
  );
END;
$$;

REVOKE ALL ON FUNCTION public.af_plan_lugares_check(text, text[], integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_plan_lugares_check(text, text[], integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.af_plan_audit_write(
  p_user_id uuid,
  p_action text,
  p_detail jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.anesfact_plan_audit (admin_id, user_id, action, detail)
  VALUES (auth.uid(), p_user_id, p_action, COALESCE(p_detail, '{}'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.af_plan_audit_write(uuid, text, jsonb) FROM PUBLIC;

-- Default Pro vacío (ya no el paquete de 4). set_plan no une defaults.
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

-- ═══════════════════════════════════════════════════════════
-- Trigger: congelar override + sanatorios en self-update
-- ═══════════════════════════════════════════════════════════

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
    IF current_setting('anesfact.allow_foja_counter', true) IS DISTINCT FROM '1' THEN
      NEW.fojas_semana := OLD.fojas_semana;
      NEW.semana_reset := OLD.semana_reset;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE UPDATE (fojas_semana, semana_reset, demo_started_at, plan_expires_at, sanatorios_permitidos, privados_max_override)
  ON public.anesfact_usuarios FROM anon, authenticated;

-- ═══════════════════════════════════════════════════════════
-- af_assert_plan: overload con p_sanatorio (no toca firma)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.af_assert_plan(p_feature text, p_sanatorio text DEFAULT NULL)
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
  v_san text;
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
  v_san := nullif(btrim(COALESCE(p_sanatorio, '')), '');

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

  IF v_san IS NOT NULL THEN
    IF NOT (v_san = ANY (COALESCE(v_sans, ARRAY[]::text[]))) THEN
      RETURN json_build_object(
        'ok', false,
        'error', 'sanatorio_no_permitido',
        'plan', v_plan,
        'sanatorio', v_san,
        'sanatorios', COALESCE(v_sans, ARRAY[]::text[])
      );
    END IF;
  END IF;

  RETURN json_build_object(
    'ok', true,
    'plan', v_plan,
    'sanatorios', COALESCE(v_sans, ARRAY[]::text[]),
    'fojas_semana', COALESCE(v_fojas, 0),
    'fojas_limite', 5,
    'plan_expires_at', v_expires
  );
END;
$$;

REVOKE ALL ON FUNCTION public.af_assert_plan(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_assert_plan(text, text) TO authenticated;

-- ═══════════════════════════════════════════════════════════
-- af_admin_set_plan: conserva array, valida, no une el paquete de 4
-- ═══════════════════════════════════════════════════════════

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
  IF v_plan NOT IN ('demo', 'basico', 'pro', 'bloqueado') THEN
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

-- ═══════════════════════════════════════════════════════════
-- af_admin_set_sanatorios
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.af_admin_set_sanatorios(p_user_id uuid, p_nombres text[])
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_rol text;
  v_override integer;
  v_sans text[];
  v_old text[];
  v_check json;
BEGIN
  IF NOT public.af_is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id requerido';
  END IF;

  SELECT plan, rol, privados_max_override, sanatorios_permitidos
  INTO v_plan, v_rol, v_override, v_old
  FROM public.anesfact_usuarios
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'usuario sin perfil en anesfact_usuarios';
  END IF;

  v_sans := public.af_normalize_sanatorios(p_nombres);

  IF COALESCE(v_rol, 'user') IS DISTINCT FROM 'admin' THEN
    v_check := public.af_plan_lugares_check(COALESCE(v_plan, 'demo'), v_sans, v_override);
    IF (v_check->>'ok') IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION '%', COALESCE(v_check->>'message', 'lugares inválidos para el plan')
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  UPDATE public.anesfact_usuarios
  SET sanatorios_permitidos = v_sans
  WHERE id = p_user_id;

  PERFORM public.af_plan_audit_write(p_user_id, 'set_sanatorios', json_build_object(
    'antes', COALESCE(v_old, ARRAY[]::text[]),
    'despues', v_sans
  )::jsonb);

  RETURN json_build_object(
    'ok', true,
    'id', p_user_id,
    'plan', v_plan,
    'sanatorios', v_sans
  );
END;
$$;

REVOKE ALL ON FUNCTION public.af_admin_set_sanatorios(uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_admin_set_sanatorios(uuid, text[]) TO authenticated;

-- ═══════════════════════════════════════════════════════════
-- Override >3 (solo este RPC)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.af_admin_set_privados_override(p_user_id uuid, p_max integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_rol text;
  v_sans text[];
  v_old integer;
  v_check json;
BEGIN
  IF NOT public.af_is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id requerido';
  END IF;
  IF p_max IS NOT NULL AND p_max <= 3 THEN
    RAISE EXCEPTION 'el tope extra tiene que ser mayor a 3 (o vacío para volver al default)';
  END IF;

  SELECT plan, rol, sanatorios_permitidos, privados_max_override
  INTO v_plan, v_rol, v_sans, v_old
  FROM public.anesfact_usuarios
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'usuario sin perfil en anesfact_usuarios';
  END IF;

  IF COALESCE(v_rol, 'user') IS DISTINCT FROM 'admin' THEN
    v_check := public.af_plan_lugares_check(COALESCE(v_plan, 'demo'), v_sans, p_max);
    IF (v_check->>'ok') IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION '%', COALESCE(v_check->>'message', 'el array actual no entra en ese tope')
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  UPDATE public.anesfact_usuarios
  SET privados_max_override = p_max
  WHERE id = p_user_id;

  PERFORM public.af_plan_audit_write(p_user_id, 'set_privados_override', json_build_object(
    'antes', v_old,
    'despues', p_max
  )::jsonb);

  RETURN json_build_object(
    'ok', true,
    'id', p_user_id,
    'privados_max_override', p_max
  );
END;
$$;

REVOKE ALL ON FUNCTION public.af_admin_set_privados_override(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_admin_set_privados_override(uuid, integer) TO authenticated;

-- ═══════════════════════════════════════════════════════════
-- Listado admin: array + override
-- ═══════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.af_admin_list_users();

CREATE FUNCTION public.af_admin_list_users()
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
  sync_fojas integer,
  sanatorios_permitidos text[],
  privados_max_override integer
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
    ), 0) AS sync_fojas,
    COALESCE(u.sanatorios_permitidos, ARRAY[]::text[]),
    u.privados_max_override
  FROM auth.users au
  LEFT JOIN public.anesfact_usuarios u ON u.id = au.id
  ORDER BY COALESCE(u.created_at, au.created_at) DESC NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.af_admin_list_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_admin_list_users() TO authenticated;

NOTIFY pgrst, 'reload schema';
