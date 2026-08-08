-- AnesFact 007 — Endurecimiento de seguridad
-- Ejecutar en Supabase → SQL Editor (como dueño del proyecto)
-- Orden: después de 001–006.

-- ═══════════════════════════════════════════════════════════
-- 1) Columnas de plan / sanatorios / expiración GECLISA
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.anesfact_usuarios
  ADD COLUMN IF NOT EXISTS sanatorios_permitidos text[];

ALTER TABLE public.anesfact_datos
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Completar owner_id en sync por UUID cuando se pueda
UPDATE public.anesfact_datos
SET owner_id = substring(clave from 'anesfact_sync_([0-9a-fA-F-]{36})')::uuid
WHERE owner_id IS NULL
  AND clave ~ '^anesfact_sync_[0-9a-fA-F-]{36}$';

-- Defaults de sanatorios según plan (solo si está vacío)
UPDATE public.anesfact_usuarios
SET sanatorios_permitidos = CASE plan
  WHEN 'demo' THEN ARRAY['Hospital Aeronáutico']
  WHEN 'basico' THEN ARRAY['Hospital Aeronáutico','Sanatorio Mayo']
  WHEN 'pro' THEN ARRAY['Hospital Aeronáutico','Sanatorio Mayo','Clínica Allende','Clínica Privada Córdoba']
  WHEN 'bloqueado' THEN ARRAY[]::text[]
  ELSE ARRAY['Hospital Aeronáutico']
END
WHERE sanatorios_permitidos IS NULL;

-- ═══════════════════════════════════════════════════════════
-- 2) Compartir fojas entre pareja (Diego ↔ Soledad)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.anesfact_shares (
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (owner_id, partner_id),
  CHECK (owner_id <> partner_id)
);

CREATE INDEX IF NOT EXISTS anesfact_shares_partner_idx ON public.anesfact_shares (partner_id);

ALTER TABLE public.anesfact_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shares_select ON public.anesfact_shares;
CREATE POLICY shares_select ON public.anesfact_shares
  FOR SELECT USING (
    public.af_is_admin()
    OR auth.uid() = owner_id
    OR auth.uid() = partner_id
  );

-- Solo admin gestiona shares
DROP POLICY IF EXISTS shares_admin_all ON public.anesfact_shares;
CREATE POLICY shares_admin_all ON public.anesfact_shares
  FOR ALL USING (public.af_is_admin()) WITH CHECK (public.af_is_admin());

CREATE OR REPLACE FUNCTION public.af_is_share_partner(p_owner uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.anesfact_shares
    WHERE (owner_id = p_owner AND partner_id = auth.uid())
       OR (partner_id = p_owner AND owner_id = auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.af_is_share_partner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_is_share_partner(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.af_admin_link_share(p_owner uuid, p_partner uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.af_is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_owner IS NULL OR p_partner IS NULL OR p_owner = p_partner THEN
    RAISE EXCEPTION 'ids inválidos';
  END IF;
  INSERT INTO public.anesfact_shares (owner_id, partner_id)
  VALUES (p_owner, p_partner)
  ON CONFLICT DO NOTHING;
  INSERT INTO public.anesfact_shares (owner_id, partner_id)
  VALUES (p_partner, p_owner)
  ON CONFLICT DO NOTHING;
  RETURN json_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.af_admin_link_share(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_admin_link_share(uuid, uuid) TO authenticated;

-- ═══════════════════════════════════════════════════════════
-- 3) Trigger INSERT: forzar plan=demo, rol=user (anti auto-pro/admin)
-- ═══════════════════════════════════════════════════════════
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
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_af_guard_usuario_insert ON public.anesfact_usuarios;
CREATE TRIGGER trg_af_guard_usuario_insert
  BEFORE INSERT ON public.anesfact_usuarios
  FOR EACH ROW EXECUTE FUNCTION public.af_guard_usuario_insert();

-- También proteger sanatorios_permitidos en UPDATE
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
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_af_guard_usuario_update ON public.anesfact_usuarios;
CREATE TRIGGER trg_af_guard_usuario_update
  BEFORE UPDATE ON public.anesfact_usuarios
  FOR EACH ROW EXECUTE FUNCTION public.af_guard_usuario_update();

-- ═══════════════════════════════════════════════════════════
-- 4) RLS en anesfact_datos (sync aislado; GECLISA temporal; help admin)
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.anesfact_datos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "datos_select_own" ON public.anesfact_datos;
DROP POLICY IF EXISTS "datos_insert_own" ON public.anesfact_datos;
DROP POLICY IF EXISTS "datos_update_own" ON public.anesfact_datos;
DROP POLICY IF EXISTS datos_select_auth ON public.anesfact_datos;
DROP POLICY IF EXISTS datos_insert_auth ON public.anesfact_datos;
DROP POLICY IF EXISTS datos_update_auth ON public.anesfact_datos;
DROP POLICY IF EXISTS datos_select_anon_bridge ON public.anesfact_datos;
DROP POLICY IF EXISTS datos_insert_anon_bridge ON public.anesfact_datos;
DROP POLICY IF EXISTS datos_update_anon_bridge ON public.anesfact_datos;
DROP POLICY IF EXISTS datos_help_admin ON public.anesfact_datos;

-- Auth: sync propio + pareja + admin; help solo admin; bridge GECLISA si no venció
CREATE POLICY datos_select_auth ON public.anesfact_datos
  FOR SELECT TO authenticated
  USING (
    public.af_is_admin()
    OR (
      clave LIKE 'anesfact_help_%' AND public.af_is_admin()
    )
    OR (
      clave LIKE 'anesfact_sync_%'
      AND (
        owner_id = auth.uid()
        OR public.af_is_share_partner(owner_id)
      )
    )
    OR (
      clave NOT LIKE 'anesfact_sync_%'
      AND clave NOT LIKE 'anesfact_help_%'
      AND (expires_at IS NULL OR expires_at > now())
    )
  );

CREATE POLICY datos_insert_auth ON public.anesfact_datos
  FOR INSERT TO authenticated
  WITH CHECK (
    public.af_is_admin()
    OR (
      clave LIKE 'anesfact_sync_%'
      AND owner_id = auth.uid()
    )
    OR (
      clave LIKE 'anesfact_help_%'
      AND (owner_id = auth.uid() OR owner_id IS NULL)
    )
    OR (
      clave NOT LIKE 'anesfact_sync_%'
      AND clave NOT LIKE 'anesfact_help_%'
    )
  );

CREATE POLICY datos_update_auth ON public.anesfact_datos
  FOR UPDATE TO authenticated
  USING (
    public.af_is_admin()
    OR (clave LIKE 'anesfact_sync_%' AND (owner_id = auth.uid() OR public.af_is_share_partner(owner_id)))
    OR (clave NOT LIKE 'anesfact_sync_%' AND clave NOT LIKE 'anesfact_help_%')
  )
  WITH CHECK (
    public.af_is_admin()
    OR (clave LIKE 'anesfact_sync_%' AND owner_id = auth.uid())
    OR (clave NOT LIKE 'anesfact_sync_%' AND clave NOT LIKE 'anesfact_help_%')
  );

-- Anon: SOLO puente GECLISA (no sync, no help), con TTL
CREATE POLICY datos_select_anon_bridge ON public.anesfact_datos
  FOR SELECT TO anon
  USING (
    clave NOT LIKE 'anesfact_sync_%'
    AND clave NOT LIKE 'anesfact_help_%'
    AND (expires_at IS NULL OR expires_at > now())
  );

CREATE POLICY datos_insert_anon_bridge ON public.anesfact_datos
  FOR INSERT TO anon
  WITH CHECK (
    clave NOT LIKE 'anesfact_sync_%'
    AND clave NOT LIKE 'anesfact_help_%'
  );

CREATE POLICY datos_update_anon_bridge ON public.anesfact_datos
  FOR UPDATE TO anon
  USING (
    clave NOT LIKE 'anesfact_sync_%'
    AND clave NOT LIKE 'anesfact_help_%'
  )
  WITH CHECK (
    clave NOT LIKE 'anesfact_sync_%'
    AND clave NOT LIKE 'anesfact_help_%'
  );

-- ═══════════════════════════════════════════════════════════
-- 5) RPC: assert plan (cliente debe consultar; servidor es fuente de verdad)
-- ═══════════════════════════════════════════════════════════
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
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'no_auth');
  END IF;

  SELECT plan, activo, rol, fojas_semana, semana_reset, sanatorios_permitidos
  INTO v_plan, v_activo, v_rol, v_fojas, v_reset, v_sans
  FROM public.anesfact_usuarios
  WHERE id = auth.uid();

  IF v_rol = 'admin' THEN
    RETURN json_build_object('ok', true, 'plan', 'pro', 'admin', true, 'sanatorios', v_sans);
  END IF;

  IF NOT COALESCE(v_activo, false) OR v_plan = 'bloqueado' THEN
    RETURN json_build_object('ok', false, 'error', 'bloqueado', 'plan', COALESCE(v_plan, 'bloqueado'));
  END IF;

  v_plan := COALESCE(v_plan, 'demo');

  IF p_feature = 'imprimir' AND v_plan = 'demo' THEN
    RETURN json_build_object('ok', false, 'error', 'upgrade', 'feature', 'imprimir', 'plan', v_plan);
  END IF;
  IF p_feature = 'geclisa' AND v_plan = 'demo' THEN
    RETURN json_build_object('ok', false, 'error', 'upgrade', 'feature', 'geclisa', 'plan', v_plan);
  END IF;
  IF p_feature = 'foja' AND v_plan = 'demo' THEN
    IF v_reset IS DISTINCT FROM CURRENT_DATE
       AND date_trunc('week', v_reset::timestamptz) IS DISTINCT FROM date_trunc('week', now()) THEN
      v_fojas := 0;
    END IF;
    -- Semana ISO approx: si semana_reset no es de esta semana, reset mental
    IF v_reset IS NULL OR date_trunc('week', COALESCE(v_reset, CURRENT_DATE)::timestamp)
         <> date_trunc('week', CURRENT_DATE::timestamp) THEN
      v_fojas := 0;
    END IF;
    IF COALESCE(v_fojas, 0) >= 1 THEN
      RETURN json_build_object('ok', false, 'error', 'limite_semanal', 'plan', v_plan, 'fojas_semana', v_fojas);
    END IF;
  END IF;

  RETURN json_build_object(
    'ok', true,
    'plan', v_plan,
    'sanatorios', COALESCE(v_sans, ARRAY['Hospital Aeronáutico']),
    'fojas_semana', COALESCE(v_fojas, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.af_assert_plan(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_assert_plan(text) TO authenticated;

-- Al setear plan, actualizar sanatorios por defecto
CREATE OR REPLACE FUNCTION public.af_admin_set_plan(p_user_id uuid, p_plan text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_plan text;
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

  v_sans := CASE v_plan
    WHEN 'demo' THEN ARRAY['Hospital Aeronáutico']
    WHEN 'basico' THEN ARRAY['Hospital Aeronáutico','Sanatorio Mayo']
    WHEN 'pro' THEN ARRAY['Hospital Aeronáutico','Sanatorio Mayo','Clínica Allende','Clínica Privada Córdoba']
    ELSE ARRAY[]::text[]
  END;

  INSERT INTO public.anesfact_usuarios (id, email, plan, rol, activo, fojas_semana, semana_reset, sanatorios_permitidos)
  VALUES (p_user_id, v_email, v_plan, 'user', true, 0, CURRENT_DATE, v_sans)
  ON CONFLICT (id) DO UPDATE SET
    plan = EXCLUDED.plan,
    email = COALESCE(NULLIF(anesfact_usuarios.email, ''), EXCLUDED.email),
    fojas_semana = CASE WHEN EXCLUDED.plan <> 'demo' THEN 0 ELSE anesfact_usuarios.fojas_semana END,
    semana_reset = CASE WHEN EXCLUDED.plan <> 'demo' THEN CURRENT_DATE ELSE anesfact_usuarios.semana_reset END,
    sanatorios_permitidos = EXCLUDED.sanatorios_permitidos;

  UPDATE public.anesfact_usuarios SET plan = v_plan, sanatorios_permitidos = v_sans WHERE id = p_user_id;

  RETURN json_build_object('ok', true, 'id', p_user_id, 'plan', v_plan, 'email', v_email, 'sanatorios', v_sans);
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 6) Notas post-migración (manual)
-- ═══════════════════════════════════════════════════════════
-- Vincular pareja (reemplazar UUIDs reales de Diego y Soledad):
--   SELECT af_admin_link_share('<uuid-diego>', '<uuid-soledad>');
--
-- GECLISA: filas viejas sin expires_at siguen legibles hasta que la app
-- escriba con TTL (2 h). Sync y help ya no son legibles por anon.
