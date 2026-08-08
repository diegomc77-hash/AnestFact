-- AnesFact — Fix: admin puede setear plan (persiste) + ver/guardar fojas de otro usuario
-- Ejecutar en Supabase → SQL Editor (logueado como dueño del proyecto)

-- 1) Admin puede INSERTAR perfiles ajenos (upsert / primer alta)
DROP POLICY IF EXISTS "usuarios_insert_own" ON public.anesfact_usuarios;
CREATE POLICY "usuarios_insert" ON public.anesfact_usuarios
  FOR INSERT WITH CHECK (public.af_is_admin() OR auth.uid() = id);

-- 2) RPC segura: setear plan (crea fila si no existe)
CREATE OR REPLACE FUNCTION public.af_admin_set_plan(p_user_id uuid, p_plan text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_plan text;
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

  INSERT INTO public.anesfact_usuarios (id, email, plan, rol, activo, fojas_semana, semana_reset)
  VALUES (
    p_user_id,
    v_email,
    v_plan,
    'user',
    true,
    CASE WHEN v_plan = 'demo' THEN 0 ELSE 0 END,
    CURRENT_DATE
  )
  ON CONFLICT (id) DO UPDATE SET
    plan = EXCLUDED.plan,
    email = COALESCE(NULLIF(anesfact_usuarios.email, ''), EXCLUDED.email),
    fojas_semana = CASE WHEN EXCLUDED.plan <> 'demo' THEN 0 ELSE anesfact_usuarios.fojas_semana END,
    semana_reset = CASE WHEN EXCLUDED.plan <> 'demo' THEN CURRENT_DATE ELSE anesfact_usuarios.semana_reset END;

  -- No degradar ni tocar rol admin si ya es admin
  UPDATE public.anesfact_usuarios
  SET plan = v_plan
  WHERE id = p_user_id;

  RETURN json_build_object('ok', true, 'id', p_user_id, 'plan', v_plan, 'email', v_email);
END;
$$;

REVOKE ALL ON FUNCTION public.af_admin_set_plan(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_admin_set_plan(uuid, text) TO authenticated;

-- 3) RPC: admin lee fojas nube de un usuario
CREATE OR REPLACE FUNCTION public.af_admin_get_user_sync(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_datos text;
  v_clave text;
BEGIN
  IF NOT public.af_is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id requerido';
  END IF;

  v_clave := 'anesfact_sync_' || p_user_id::text;

  SELECT d.datos INTO v_datos
  FROM public.anesfact_datos d
  WHERE d.owner_id = p_user_id OR d.clave = v_clave
  ORDER BY CASE WHEN d.owner_id = p_user_id THEN 0 ELSE 1 END, d.clave
  LIMIT 1;

  IF v_datos IS NULL THEN
    RETURN json_build_object('ok', true, 'intervs', '[]'::json, 'empty', true, 'clave', v_clave);
  END IF;

  RETURN json_build_object(
    'ok', true,
    'empty', false,
    'clave', v_clave,
    'datos', v_datos::json
  );
END;
$$;

REVOKE ALL ON FUNCTION public.af_admin_get_user_sync(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_admin_get_user_sync(uuid) TO authenticated;

-- 4) RPC: admin guarda fojas en la nube del usuario (modo "ver como")
CREATE OR REPLACE FUNCTION public.af_admin_set_user_sync(p_user_id uuid, p_datos json)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clave text;
  v_n integer;
BEGIN
  IF NOT public.af_is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS NULL OR p_datos IS NULL THEN
    RAISE EXCEPTION 'parámetros requeridos';
  END IF;

  v_clave := 'anesfact_sync_' || p_user_id::text;
  v_n := COALESCE(jsonb_array_length(COALESCE((p_datos::jsonb)->'intervs', '[]'::jsonb)), 0);

  UPDATE public.anesfact_datos
  SET datos = p_datos::text, owner_id = p_user_id
  WHERE clave = v_clave;

  IF NOT FOUND THEN
    INSERT INTO public.anesfact_datos (clave, datos, owner_id)
    VALUES (v_clave, p_datos::text, p_user_id);
  END IF;

  RETURN json_build_object('ok', true, 'clave', v_clave, 'fojas', v_n);
END;
$$;

REVOKE ALL ON FUNCTION public.af_admin_set_user_sync(uuid, json) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_admin_set_user_sync(uuid, json) TO authenticated;
