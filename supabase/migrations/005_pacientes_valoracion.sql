-- AnesFact — Pacientes cifrados + valoración preanestésica (QR)
-- Ejecutar DESPUÉS de 001–004 en Supabase SQL Editor.
--
-- PRINCIPIO: no reemplaza anesfact_datos ni el flujo de foja actual.
--   • paciente_id / valoracion_id son OPCIONALES en la intervención (fase app).
--   • Cifrado nombre/DNI solo vía Edge Functions (secreto AF_ENCRYPTION_KEY).
--   • Este SQL crea tablas, RLS e índices; la lógica crypto va en Edge Functions.
--
-- Secreto requerido (Supabase → Edge Functions → Secrets):
--   AF_ENCRYPTION_KEY  = 32 bytes random, base64 (AES-256-GCM)
--   APP_PII_SALT       = 32+ bytes random, base64 (SHA-256 para dni_hash)

-- ---------------------------------------------------------------------------
-- 1) Normalización DNI (pública, sin salt — útil en app y Edge)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.af_normalize_dni(p_dni text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(regexp_replace(trim(coalesce(p_dni, '')), '\D', '', 'g'), '');
$$;

-- ---------------------------------------------------------------------------
-- 2) Pacientes — identidad mínima cifrada
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anesfact_pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_enc text NOT NULL,
  dni_enc text NOT NULL,
  dni_hash text NOT NULL,
  crypto_version smallint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT anesfact_pacientes_owner_dni_unique UNIQUE (owner_id, dni_hash)
);

CREATE INDEX IF NOT EXISTS anesfact_pacientes_dni_hash_idx
  ON public.anesfact_pacientes (owner_id, dni_hash);

CREATE INDEX IF NOT EXISTS anesfact_pacientes_owner_idx
  ON public.anesfact_pacientes (owner_id);

COMMENT ON TABLE public.anesfact_pacientes IS
  'Identidad cifrada por anestesista. Sin duplicados: UNIQUE(owner_id, dni_hash).';

-- ---------------------------------------------------------------------------
-- 3) Tokens QR — desacoplados de foja
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anesfact_qr_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  max_uses integer NOT NULL DEFAULT 3 CHECK (max_uses > 0),
  uses_count integer NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
  contexto jsonb NOT NULL DEFAULT '{}'::jsonb,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS anesfact_qr_tokens_owner_idx
  ON public.anesfact_qr_tokens (owner_id, created_at DESC);

COMMENT ON COLUMN public.anesfact_qr_tokens.contexto IS
  'Opcional: {sanatorio, servicio, nota}. Sin datos de paciente.';

-- ---------------------------------------------------------------------------
-- 4) Valoraciones — datos clínicos (sin nombre/DNI en claro)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anesfact_valoraciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.anesfact_pacientes(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qr_token_id uuid REFERENCES public.anesfact_qr_tokens(id) ON DELETE SET NULL,
  -- Contexto del episodio / cirugía (mismo paciente puede valorarse varias veces)
  diagnostico_cirugia text NOT NULL DEFAULT '',
  fecha_cirugia_programada date,
  motivo_valoracion text NOT NULL DEFAULT 'primera'
    CHECK (motivo_valoracion IN (
      'primera', 'reprogramacion', 'no_presentacion', 'nueva_cirugia', 'control', 'correccion_datos'
    )),
  resultado_episodio text NOT NULL DEFAULT 'pendiente'
    CHECK (resultado_episodio IN (
      'pendiente', 'operado', 'no_presentado', 'suspendido', 'cancelado'
    )),
  -- Bloques A–F (ver docs/VALORACION_QR.md)
  datos_basicos jsonb NOT NULL DEFAULT '{}'::jsonb,
  antecedentes jsonb NOT NULL DEFAULT '{}'::jsonb,
  medicacion jsonb NOT NULL DEFAULT '[]'::jsonb,
  antec_anestesicos jsonb NOT NULL DEFAULT '{}'::jsonb,
  ayuno jsonb NOT NULL DEFAULT '{}'::jsonb,
  extras jsonb NOT NULL DEFAULT '{}'::jsonb,
  estudios_extraidos jsonb NOT NULL DEFAULT '{}'::jsonb,
  texto_libre text,
  -- Reglas determinísticas (Edge / app)
  asa_sugerido text,
  alertas_reglas jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Metadatos
  source text NOT NULL DEFAULT 'qr_paciente'
    CHECK (source IN ('qr_paciente', 'anestesista')),
  estado text NOT NULL DEFAULT 'enviada'
    CHECK (estado IN ('borrador', 'enviada', 'revisada', 'importada_foja')),
  es_urgencia boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  reemplaza_id uuid REFERENCES public.anesfact_valoraciones(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  editado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS anesfact_valoraciones_paciente_idx
  ON public.anesfact_valoraciones (paciente_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS anesfact_valoraciones_owner_idx
  ON public.anesfact_valoraciones (owner_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS anesfact_valoraciones_episodio_idx
  ON public.anesfact_valoraciones (paciente_id, resultado_episodio, submitted_at DESC);

COMMENT ON COLUMN public.anesfact_valoraciones.diagnostico_cirugia IS
  'Cirugía prevista — clave para distinguir 2da valoración vs misma cirugía reprogramada';
COMMENT ON COLUMN public.anesfact_valoraciones.motivo_valoracion IS
  'primera | reprogramacion | no_presentacion | nueva_cirugia | control | correccion_datos';
COMMENT ON COLUMN public.anesfact_valoraciones.resultado_episodio IS
  'pendiente hasta operar; no_presentado si no se operó; anestesista actualiza al vincular foja';
COMMENT ON COLUMN public.anesfact_valoraciones.datos_basicos IS
  '{edad, sexo, peso_kg, talla_cm, imc, obra_social, afiliado} — sin nombre/dni';
COMMENT ON COLUMN public.anesfact_valoraciones.antecedentes IS
  '{chips:[], anticoag:{farmaco,ultima_dosis,suspendio}, alergias:{medicamentos,latex,iodado,otros}}';
COMMENT ON COLUMN public.anesfact_valoraciones.ayuno IS
  '{solido_at, liquido_at} — relevante si es_urgencia=true';
COMMENT ON COLUMN public.anesfact_valoraciones.extras IS
  '{tabaco, alcohol, protesis_dental, movilidad_cervical, marcapasos_dai, infeccion_fiebre, viaje_tvp}';

-- ---------------------------------------------------------------------------
-- 5) Vínculo foja ↔ paciente (auditoría; la intervención sigue en anesfact_datos)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anesfact_foja_vinculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.anesfact_pacientes(id) ON DELETE CASCADE,
  valoracion_id uuid REFERENCES public.anesfact_valoraciones(id) ON DELETE SET NULL,
  interv_id text NOT NULL,
  linked_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT anesfact_foja_vinculos_owner_interv_unique UNIQUE (owner_id, interv_id)
);

CREATE INDEX IF NOT EXISTS anesfact_foja_vinculos_paciente_idx
  ON public.anesfact_foja_vinculos (paciente_id);

-- ---------------------------------------------------------------------------
-- 6) RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.anesfact_pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anesfact_qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anesfact_valoraciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anesfact_foja_vinculos ENABLE ROW LEVEL SECURITY;

-- Pacientes: sin acceso directo desde cliente (solo Edge Functions con service role).
-- Admin puede listar metadatos sin descifrar.
DROP POLICY IF EXISTS pacientes_admin_select ON public.anesfact_pacientes;
CREATE POLICY pacientes_admin_select ON public.anesfact_pacientes
  FOR SELECT USING (public.af_is_admin());

-- QR tokens: el anestesista ve/gestiona los suyos
DROP POLICY IF EXISTS qr_tokens_select_own ON public.anesfact_qr_tokens;
CREATE POLICY qr_tokens_select_own ON public.anesfact_qr_tokens
  FOR SELECT USING (owner_id = auth.uid() OR public.af_is_admin());

DROP POLICY IF EXISTS qr_tokens_insert_own ON public.anesfact_qr_tokens;
CREATE POLICY qr_tokens_insert_own ON public.anesfact_qr_tokens
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS qr_tokens_update_own ON public.anesfact_qr_tokens;
CREATE POLICY qr_tokens_update_own ON public.anesfact_qr_tokens
  FOR UPDATE USING (owner_id = auth.uid());

-- Valoraciones: lectura y edición por dueño (corrección anestesista)
DROP POLICY IF EXISTS valoraciones_select_own ON public.anesfact_valoraciones;
CREATE POLICY valoraciones_select_own ON public.anesfact_valoraciones
  FOR SELECT USING (owner_id = auth.uid() OR public.af_is_admin());

DROP POLICY IF EXISTS valoraciones_update_own ON public.anesfact_valoraciones;
CREATE POLICY valoraciones_update_own ON public.anesfact_valoraciones
  FOR UPDATE USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- INSERT valoraciones/pacientes: denegado al cliente — solo Edge Functions
-- (sin policy INSERT = deny by default con RLS ON)

-- Vínculos foja
DROP POLICY IF EXISTS foja_vinculos_select_own ON public.anesfact_foja_vinculos;
CREATE POLICY foja_vinculos_select_own ON public.anesfact_foja_vinculos
  FOR SELECT USING (owner_id = auth.uid() OR public.af_is_admin());

DROP POLICY IF EXISTS foja_vinculos_insert_own ON public.anesfact_foja_vinculos;
CREATE POLICY foja_vinculos_insert_own ON public.anesfact_foja_vinculos
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS foja_vinculos_update_own ON public.anesfact_foja_vinculos;
CREATE POLICY foja_vinculos_update_own ON public.anesfact_foja_vinculos
  FOR UPDATE USING (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 7) Trigger updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.af_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pacientes_updated ON public.anesfact_pacientes;
CREATE TRIGGER trg_pacientes_updated
  BEFORE UPDATE ON public.anesfact_pacientes
  FOR EACH ROW EXECUTE FUNCTION public.af_set_updated_at();

DROP TRIGGER IF EXISTS trg_valoraciones_updated ON public.anesfact_valoraciones;
CREATE TRIGGER trg_valoraciones_updated
  BEFORE UPDATE ON public.anesfact_valoraciones
  FOR EACH ROW EXECUTE FUNCTION public.af_set_updated_at();

-- ---------------------------------------------------------------------------
-- 8) RPC: última valoración de un paciente (sin descifrar PII)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.af_valoracion_latest(p_paciente_id uuid)
RETURNS public.anesfact_valoraciones
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.*
  FROM public.anesfact_valoraciones v
  WHERE v.paciente_id = p_paciente_id
    AND (v.owner_id = auth.uid() OR public.af_is_admin())
  ORDER BY v.submitted_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.af_valoracion_latest(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_valoracion_latest(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 9) RPC: listar valoraciones de un paciente (elegir episodio al vincular foja)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.af_valoraciones_list(p_paciente_id uuid)
RETURNS SETOF public.anesfact_valoraciones
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.*
  FROM public.anesfact_valoraciones v
  WHERE v.paciente_id = p_paciente_id
    AND (v.owner_id = auth.uid() OR public.af_is_admin())
  ORDER BY v.submitted_at DESC;
$$;

REVOKE ALL ON FUNCTION public.af_valoraciones_list(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_valoraciones_list(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 10) RPC: marcar resultado episodio (no presentado, operado, etc.)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.af_valoracion_set_resultado(
  p_valoracion_id uuid,
  p_resultado text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_resultado NOT IN ('pendiente','operado','no_presentado','suspendido','cancelado') THEN
    RETURN false;
  END IF;
  UPDATE public.anesfact_valoraciones
  SET resultado_episodio = p_resultado,
      editado_por = auth.uid(),
      source = 'anestesista',
      estado = CASE WHEN estado = 'importada_foja' THEN estado ELSE 'revisada' END
  WHERE id = p_valoracion_id
    AND owner_id = auth.uid();
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.af_valoracion_set_resultado(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_valoracion_set_resultado(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 11) RPC: historial de fojas vinculadas a un paciente (cloud)
--     La app también lista S.intervs locales con mismo paciente_id / DNI.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.af_vinculos_por_paciente(p_paciente_id uuid)
RETURNS TABLE (
  interv_id text,
  valoracion_id uuid,
  linked_at timestamptz,
  diagnostico_cirugia text,
  fecha_cirugia_programada date,
  valoracion_fecha timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    fv.interv_id,
    fv.valoracion_id,
    fv.linked_at,
    coalesce(v.diagnostico_cirugia, ''),
    v.fecha_cirugia_programada,
    v.submitted_at
  FROM public.anesfact_foja_vinculos fv
  LEFT JOIN public.anesfact_valoraciones v ON v.id = fv.valoracion_id
  WHERE fv.paciente_id = p_paciente_id
    AND (fv.owner_id = auth.uid() OR public.af_is_admin())
  ORDER BY fv.linked_at DESC;
$$;

REVOKE ALL ON FUNCTION public.af_vinculos_por_paciente(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_vinculos_por_paciente(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Edge Functions a implementar (Deno, secretos AF_ENCRYPTION_KEY + APP_PII_SALT):
--
--   af_qr_create          JWT → insert qr_tokens, return URL
--   af_qr_submit          token público → cifrar nombre/dni, upsert paciente (misma identidad),
--                         SIEMPRE insert valoración nueva (nunca pisa clínica anterior)
--   af_paciente_match     JWT + dni → lista valoraciones + alertas si hay >1 pendiente
--   af_paciente_import    JWT + valoracion_id → JSON para UI (sin cache)
--   af_valoracion_update  JWT → corrección anestesista (UPDATE valoraciones)
--   af_estudio_extract    memoria → estudios_extraidos, descartar imagen
-- ---------------------------------------------------------------------------
