-- AnesFact 008a — SOLO tokens GECLISA (prueba segura ANTES del 008 completo)
-- Prerrequisito: 007b (af_assert_plan + RLS).
--
-- Qué hace:
--   • Crea tabla anesfact_geclisa_tokens + RPCs create/consume
--   • NO dropea af_admin_get/set_user_sync
--   • NO toca firma ni sesiones
--   • NO borra el puente viejo por DNI en anesfact_datos
--
-- Así podés probar: AnesFact (token) → bookmarklet → consume
-- sin cortar el flujo DNI todavía.
--
-- El 008 completo re-aplica estas mismas funciones (CREATE OR REPLACE) sin conflicto.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_bytes para el token

-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.anesfact_geclisa_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paciente_ref text NOT NULL,
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

DROP POLICY IF EXISTS geclisa_tokens_deny_all ON public.anesfact_geclisa_tokens;
CREATE POLICY geclisa_tokens_deny_all ON public.anesfact_geclisa_tokens
  FOR ALL USING (false) WITH CHECK (false);

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

  v_assert := public.af_assert_plan('geclisa');
  IF COALESCE((v_assert->>'ok')::boolean, false) IS NOT TRUE THEN
    RETURN v_assert;
  END IF;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');

  INSERT INTO public.anesfact_geclisa_tokens (token, owner_id, paciente_ref, payload, expires_at)
  VALUES (v_token, v_uid, trim(p_paciente_ref), p_payload, v_exp);

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

  RETURN json_build_object(
    'ok', true,
    'payload', v_row.payload,
    'paciente_ref', v_row.paciente_ref
  );
END;
$$;

REVOKE ALL ON FUNCTION public.af_geclisa_consume_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_geclisa_consume_token(text) TO anon, authenticated;
