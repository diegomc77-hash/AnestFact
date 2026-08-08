-- AnesFact 008 — BORRADOR (revisión; NO ejecutar hasta confirmar)
-- Prerrequisito: 001–006 + 007b (NO el 007 con shares).
--
-- Cubre (servidor):
--   A) Quitar acceso admin a fojas ajenas (get/set_user_sync)
--   B) Puente GECLISA por token de un solo uso (2 h)
--   C) Firma profesional certificada (1 vez, ligada a matrícula)
--   D) Sesiones concurrentes: 1 PC + 1 móvil por cuenta
--
-- Cubre (contrato app; NO es SQL):
--   E) Cifrado at-rest de localStorage (Web Crypto AES-GCM + clave derivada)
--   F) Export JSON cifrado con contraseña (mismo esquema; import pide clave)
--
-- Tras ejecutar este SQL hay que desplegar cambios de app:
--   - Quitar “Ver fojas” / adminViewAs / adminPushViewAsSync
--   - enviarAGeclisa + fill.js → token
--   - Config: subir firma 1 vez → certificar
--   - 01-state / sync: cifrar af_i_* local
--   - exportarDatos / importarDatos con passphrase
--   - login: af_register_session(device_type)

-- ═══════════════════════════════════════════════════════════
-- A) ADMIN: solo planes — eliminar lectura/escritura de sync ajeno
-- ═══════════════════════════════════════════════════════════

-- Revocar y eliminar RPCs peligrosas del 006
REVOKE ALL ON FUNCTION public.af_admin_get_user_sync(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.af_admin_get_user_sync(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.af_admin_set_user_sync(uuid, json) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.af_admin_set_user_sync(uuid, json) FROM authenticated;

DROP FUNCTION IF EXISTS public.af_admin_get_user_sync(uuid);
DROP FUNCTION IF EXISTS public.af_admin_set_user_sync(uuid, json);

-- Legacy backups (af_admin_legacy_backups / af_admin_link_backup):
--   SE DEJAN INTACTAS. No son parte del hardening de hoy.
--   Limpieza UI + DROP → migration 009 solo si el inventario está vacío.

-- Si existiera la tabla/shares del 007 viejo (no del 007b), neutralizar
DROP FUNCTION IF EXISTS public.af_admin_link_share(uuid, uuid);
DROP FUNCTION IF EXISTS public.af_is_share_partner(uuid);
DROP TABLE IF EXISTS public.anesfact_shares;

-- af_admin_list_users + af_admin_set_plan SE MANTIENEN (activar/desactivar Free/Pro).
-- Comentario de producto: "Free" = plan demo; "Pro" = plan pro (o basico según panel).

-- ═══════════════════════════════════════════════════════════
-- B) GECLISA — token aleatorio de un solo uso (TTL 2 h)
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_bytes
-- ═══════════════════════════════════════════════════════════
-- Si ya corriste 008a_geclisa_tokens_only.sql para probar, este bloque
-- es idempotente (CREATE IF NOT EXISTS / CREATE OR REPLACE).
-- El bookmarklet/fill.js pedirá SOLO el token (no DNI en la URL del puente).
-- El JSON consumido sigue incluyendo dni/paciente reales para pegar en GECLISA.

CREATE TABLE IF NOT EXISTS public.anesfact_geclisa_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- DNI / clave lógica del paciente (solo servidor; no va en la URL pública del bridge)
  paciente_ref text NOT NULL,
  -- Payload clínico completo (mismo JSON que hoy se manda a GECLISA)
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  CONSTRAINT geclisa_token_nonempty CHECK (length(trim(token)) >= 32)
);

CREATE INDEX IF NOT EXISTS anesfact_geclisa_tokens_owner_idx
  ON public.anesfact_geclisa_tokens (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS anesfact_geclisa_tokens_exp_idx
  ON public.anesfact_geclisa_tokens (expires_at)
  WHERE used_at IS NULL;

ALTER TABLE public.anesfact_geclisa_tokens ENABLE ROW LEVEL SECURITY;

-- Nadie lee la tabla directo por REST (ni anon ni authenticated): solo RPCs
DROP POLICY IF EXISTS geclisa_tokens_deny_all ON public.anesfact_geclisa_tokens;
CREATE POLICY geclisa_tokens_deny_all ON public.anesfact_geclisa_tokens
  FOR ALL USING (false) WITH CHECK (false);

-- Crear token (usuario autenticado, plan con geclisa)
CREATE OR REPLACE FUNCTION public.af_geclisa_create_token(
  p_paciente_ref text,
  p_payload jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_assert json;
  v_token text;
  v_exp timestamptz := now() + interval '2 hours';
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'no_auth' USING ERRCODE = '42501';
  END IF;
  IF p_paciente_ref IS NULL OR length(trim(p_paciente_ref)) < 1 THEN
    RAISE EXCEPTION 'paciente_ref requerido';
  END IF;
  IF p_payload IS NULL THEN
    RAISE EXCEPTION 'payload requerido';
  END IF;

  -- Respetar plan (demo no GECLISA)
  v_assert := public.af_assert_plan('geclisa');
  IF COALESCE((v_assert->>'ok')::boolean, false) IS NOT TRUE THEN
    RETURN v_assert;
  END IF;

  -- Token opaco (no es DNI)
  v_token := encode(extensions.gen_random_bytes(24), 'hex');

  INSERT INTO public.anesfact_geclisa_tokens (token, owner_id, paciente_ref, payload, expires_at)
  VALUES (v_token, v_uid, trim(p_paciente_ref), p_payload, v_exp);

  -- Limpieza liviana de tokens vencidos del mismo dueño
  DELETE FROM public.anesfact_geclisa_tokens
  WHERE owner_id = v_uid AND (expires_at < now() - interval '1 day' OR used_at IS NOT NULL);

  RETURN json_build_object(
    'ok', true,
    'token', v_token,
    'expires_at', v_exp,
    'paciente_ref', trim(p_paciente_ref)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.af_geclisa_create_token(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_geclisa_create_token(text, jsonb) TO authenticated;

-- Consumir token (bookmarklet / fill.js). Un solo uso. Sin JWT de usuario
-- (corre con anon + apikey). SECURITY DEFINER valida token+TTL+unused.
CREATE OR REPLACE FUNCTION public.af_geclisa_consume_token(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.anesfact_geclisa_tokens%ROWTYPE;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 32 THEN
    RETURN json_build_object('ok', false, 'error', 'token_invalido');
  END IF;

  SELECT * INTO v_row
  FROM public.anesfact_geclisa_tokens
  WHERE token = trim(p_token)
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'token_desconocido');
  END IF;
  IF v_row.used_at IS NOT NULL THEN
    RETURN json_build_object('ok', false, 'error', 'token_ya_usado');
  END IF;
  IF v_row.expires_at < now() THEN
    RETURN json_build_object('ok', false, 'error', 'token_expirado');
  END IF;

  UPDATE public.anesfact_geclisa_tokens
  SET used_at = now()
  WHERE id = v_row.id;

  -- Devuelve el payload clínico (incluye DNI real para GECLISA)
  RETURN json_build_object(
    'ok', true,
    'payload', v_row.payload,
    'paciente_ref', v_row.paciente_ref
  );
END;
$$;

REVOKE ALL ON FUNCTION public.af_geclisa_consume_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_geclisa_consume_token(text) TO anon, authenticated;

-- Nota app: dejar de escribir puente por DNI en anesfact_datos.
-- Filas viejas geclisa-por-DNI pueden quedar hasta que venzan (expires_at) o se borren a mano.

-- ═══════════════════════════════════════════════════════════
-- C) FIRMA CERTIFICADA (una vez por cuenta, inmodificable)
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.anesfact_usuarios
  ADD COLUMN IF NOT EXISTS firma_png text,           -- data URL o base64 PNG
  ADD COLUMN IF NOT EXISTS firma_certificada_at timestamptz,
  ADD COLUMN IF NOT EXISTS firma_matricula_snapshot text; -- matrícula al certificar

-- Trigger: nadie (salvo admin) puede tocar firma ya certificada / plan / etc.
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

    -- Firma certificada: inmutable
    IF OLD.firma_certificada_at IS NOT NULL THEN
      NEW.firma_png := OLD.firma_png;
      NEW.firma_certificada_at := OLD.firma_certificada_at;
      NEW.firma_matricula_snapshot := OLD.firma_matricula_snapshot;
      -- Tampoco permitir cambiar matrícula después de certificar (evita “otro profesional”)
      NEW.matricula := OLD.matricula;
      NEW.matricula_especial := OLD.matricula_especial;
      NEW.nombre := OLD.nombre;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_af_guard_usuario_update ON public.anesfact_usuarios;
CREATE TRIGGER trg_af_guard_usuario_update
  BEFORE UPDATE ON public.anesfact_usuarios
  FOR EACH ROW EXECUTE FUNCTION public.af_guard_usuario_update();

-- Certificar firma (solo si aún no hay firma_certificada_at)
CREATE OR REPLACE FUNCTION public.af_certificar_firma(p_firma_png text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_mp text;
  v_nombre text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'no_auth' USING ERRCODE = '42501';
  END IF;
  IF p_firma_png IS NULL OR length(p_firma_png) < 100 THEN
    RAISE EXCEPTION 'firma inválida';
  END IF;
  -- Límite razonable (~800 KB data URL)
  IF length(p_firma_png) > 800000 THEN
    RAISE EXCEPTION 'firma demasiado grande';
  END IF;

  SELECT matricula, nombre INTO v_mp, v_nombre
  FROM public.anesfact_usuarios WHERE id = v_uid;

  IF v_mp IS NULL OR length(trim(v_mp)) < 1 THEN
    RETURN json_build_object('ok', false, 'error', 'matricula_requerida');
  END IF;
  IF v_nombre IS NULL OR length(trim(v_nombre)) < 2 THEN
    RETURN json_build_object('ok', false, 'error', 'nombre_requerido');
  END IF;

  UPDATE public.anesfact_usuarios
  SET
    firma_png = p_firma_png,
    firma_certificada_at = now(),
    firma_matricula_snapshot = trim(v_mp)
  WHERE id = v_uid
    AND firma_certificada_at IS NULL;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'ya_certificada');
  END IF;

  RETURN json_build_object(
    'ok', true,
    'firma_certificada_at', now(),
    'matricula', trim(v_mp)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.af_certificar_firma(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_certificar_firma(text) TO authenticated;

-- Lectura de la propia firma (para imprimir / foja)
CREATE OR REPLACE FUNCTION public.af_get_mi_firma()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  r record;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'no_auth');
  END IF;
  SELECT nombre, matricula, matricula_especial, firma_png, firma_certificada_at, firma_matricula_snapshot
  INTO r
  FROM public.anesfact_usuarios WHERE id = v_uid;

  RETURN json_build_object(
    'ok', true,
    'nombre', r.nombre,
    'matricula', r.matricula,
    'matricula_especial', r.matricula_especial,
    'firma_png', r.firma_png,
    'certificada', (r.firma_certificada_at IS NOT NULL),
    'firma_certificada_at', r.firma_certificada_at,
    'firma_matricula_snapshot', r.firma_matricula_snapshot
  );
END;
$$;

REVOKE ALL ON FUNCTION public.af_get_mi_firma() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_get_mi_firma() TO authenticated;

-- Reset de firma SOLO admin (soporte excepcional; no uso cotidiano)
CREATE OR REPLACE FUNCTION public.af_admin_reset_firma(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.af_is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  UPDATE public.anesfact_usuarios
  SET firma_png = NULL, firma_certificada_at = NULL, firma_matricula_snapshot = NULL
  WHERE id = p_user_id;
  RETURN json_build_object('ok', true, 'id', p_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.af_admin_reset_firma(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_admin_reset_firma(uuid) TO authenticated;

-- ═══════════════════════════════════════════════════════════
-- D) SESIONES: 1 PC + 1 móvil por cuenta (estilo WhatsApp)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.anesfact_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_type text NOT NULL CHECK (device_type IN ('pc', 'mobile')),
  session_id text NOT NULL,          -- uuid generado en el cliente al login
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_type)
);

CREATE INDEX IF NOT EXISTS anesfact_sessions_user_idx ON public.anesfact_sessions (user_id);

ALTER TABLE public.anesfact_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sessions_own ON public.anesfact_sessions;
CREATE POLICY sessions_own ON public.anesfact_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Registrar / reemplazar sesión del mismo tipo de dispositivo
CREATE OR REPLACE FUNCTION public.af_register_session(
  p_device_type text,
  p_session_id text,
  p_user_agent text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_prev text;
  v_kicked boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'no_auth' USING ERRCODE = '42501';
  END IF;
  IF p_device_type NOT IN ('pc', 'mobile') THEN
    RAISE EXCEPTION 'device_type inválido';
  END IF;
  IF p_session_id IS NULL OR length(trim(p_session_id)) < 8 THEN
    RAISE EXCEPTION 'session_id requerido';
  END IF;

  SELECT session_id INTO v_prev
  FROM public.anesfact_sessions
  WHERE user_id = v_uid AND device_type = p_device_type;

  IF v_prev IS NOT NULL AND v_prev <> trim(p_session_id) THEN
    v_kicked := true;
  END IF;

  INSERT INTO public.anesfact_sessions (user_id, device_type, session_id, user_agent, last_seen_at)
  VALUES (v_uid, p_device_type, trim(p_session_id), left(COALESCE(p_user_agent, ''), 240), now())
  ON CONFLICT (user_id, device_type) DO UPDATE SET
    session_id = EXCLUDED.session_id,
    user_agent = EXCLUDED.user_agent,
    last_seen_at = now(),
    created_at = CASE
      WHEN public.anesfact_sessions.session_id = EXCLUDED.session_id
      THEN public.anesfact_sessions.created_at
      ELSE now()
    END;

  RETURN json_build_object(
    'ok', true,
    'device_type', p_device_type,
    'session_id', trim(p_session_id),
    'replaced_previous', v_kicked
  );
END;
$$;

REVOKE ALL ON FUNCTION public.af_register_session(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_register_session(text, text, text) TO authenticated;

-- Heartbeat / validar que esta sesión sigue siendo la activa
CREATE OR REPLACE FUNCTION public.af_check_session(
  p_device_type text,
  p_session_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_cur text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'no_auth', 'valid', false);
  END IF;

  SELECT session_id INTO v_cur
  FROM public.anesfact_sessions
  WHERE user_id = v_uid AND device_type = p_device_type;

  IF v_cur IS NULL THEN
    RETURN json_build_object('ok', true, 'valid', false, 'error', 'sin_sesion');
  END IF;
  IF v_cur <> trim(p_session_id) THEN
    RETURN json_build_object('ok', true, 'valid', false, 'error', 'sesion_reemplazada');
  END IF;

  UPDATE public.anesfact_sessions
  SET last_seen_at = now()
  WHERE user_id = v_uid AND device_type = p_device_type;

  RETURN json_build_object('ok', true, 'valid', true);
END;
$$;

REVOKE ALL ON FUNCTION public.af_check_session(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_check_session(text, text) TO authenticated;

-- ═══════════════════════════════════════════════════════════
-- E–F) CONTRATO APP (no SQL) — cifrado local + export
-- ═══════════════════════════════════════════════════════════
-- E) localStorage at-rest
--    - Clave maestra: Web Crypto (PBKDF2/Argon2-wasm) derivada de:
--        (password local opcional) XOR (material en sesión JWT no persistido)
--      Recomendación práctica: al login, derivar AES-GCM key en memoria;
--      cifrar af_i_<uid> como { v:1, iv, ct }. Supabase sync sigue en claro
--      en servidor bajo RLS (o cifrado punta-a-punta en una fase 2).
--    - Sin contraseña local extra: usar non-extractable CryptoKey en memoria
--      + wrap con una key en IndexedDB ligada al origin (mejora robo de
--      backup de disco, no protege XSS).
--
-- F) Export JSON
--    - exportarDatos pide passphrase → AES-GCM → archivo .anesfact.json
--      { v:1, salt, iv, ct } ; importarDatos pide la misma passphrase.
--    - No guardar la passphrase en servidor.
--
-- Checklist app post-008:
--  [ ] 30-admin.js: quitar Ver fojas / set_user_sync
--  [ ] 20-geclisa-send.js + fill.js: create_token / consume_token
--  [ ] config + 05-vitals-sign: certificar firma; foja solo usa af_get_mi_firma
--  [ ] 01-state.js: cifrar/descifrar intervs locales
--  [ ] 17-sync-export.js: export/import con passphrase
--  [ ] 28-auth.js: af_register_session + polling af_check_session

-- ═══════════════════════════════════════════════════════════
-- FIN BORRADOR 008
-- ═══════════════════════════════════════════════════════════
