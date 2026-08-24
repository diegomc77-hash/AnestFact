-- =============================================================================
-- DRAFT — NO APLICAR. Esperar validación de docs/ARQUITECTURA_CASOS_EVWEB.md
-- =============================================================================
-- AnesFact 010 — Casos de facturación, intake QR, políticas institución×mutual
--
-- No reemplaza anesfact_datos ni anesfact_qr_tokens (valoración paciente).
-- No toca fill.js / GECLISA tokens.
--
-- Prerrequisito conceptual: 001–009 + anesfact_pacientes (005).
-- Extensiones: pgcrypto (ya en 008). pg_cron NO es requisito: el purge
-- corre en GitHub Action / Edge Function.
-- =============================================================================

-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1) Catálogos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anesfact_instituciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nombre text NOT NULL,
  usa_geclisa boolean NOT NULL DEFAULT false,
  fuente_foja_evweb text NOT NULL DEFAULT 'anesfact'
    CHECK (fuente_foja_evweb IN ('anesfact', 'geclisa', 'ninguna')),
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.anesfact_mutuales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nombre text NOT NULL,
  -- "os_varias" agrupa OSDE/IOSFA/etc. El nombre concreto vive en casos.obra_social
  auth_mode_default text NOT NULL DEFAULT 'upload'
    CHECK (auth_mode_default IN ('none', 'upload', 'traditum', 'geclisa')),
  requiere_foja_anest_evweb boolean NOT NULL DEFAULT true,
  requiere_foja_qx_evweb boolean NOT NULL DEFAULT true,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.anesfact_workflow_policies (
  institucion_id uuid NOT NULL REFERENCES public.anesfact_instituciones(id) ON DELETE CASCADE,
  mutual_id uuid NOT NULL REFERENCES public.anesfact_mutuales(id) ON DELETE CASCADE,
  requisitos jsonb NOT NULL,
  notas text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (institucion_id, mutual_id)
);

COMMENT ON COLUMN public.anesfact_workflow_policies.requisitos IS
  '{version, slots: {foja_anest_anesfact, foja_qx_anesfact, foja_geclisa, autorizacion}}';

-- ---------------------------------------------------------------------------
-- 2) Casos (expediente de facturación; la foja clínica sigue en anesfact_datos)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anesfact_casos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institucion_id uuid NOT NULL REFERENCES public.anesfact_instituciones(id),
  mutual_id uuid NOT NULL REFERENCES public.anesfact_mutuales(id),
  paciente_id uuid REFERENCES public.anesfact_pacientes(id) ON DELETE SET NULL,
  interv_id text,
  fecha_cirugia date,
  obra_social text,
  afiliado_hash text,
  complejidad smallint,
  requisitos_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  caso_status text NOT NULL DEFAULT 'abierto'
    CHECK (caso_status IN ('abierto', 'cerrado', 'anulado')),
  auth_status text NOT NULL DEFAULT 'pendiente_doc'
    CHECK (auth_status IN ('no_aplica', 'pendiente_doc', 'pendiente_externo', 'autorizado', 'rechazado')),
  geclisa_status text NOT NULL DEFAULT 'no_aplica'
    CHECK (geclisa_status IN ('no_aplica', 'pendiente_envio', 'enviado', 'foja_bajada')),
  evweb_status text NOT NULL DEFAULT 'bloqueado'
    CHECK (evweb_status IN ('bloqueado', 'listo', 'cargado', 'facturado', 'rechazado')),
  origen text NOT NULL DEFAULT 'foja'
    CHECK (origen IN ('foja', 'intake_auth', 'intake_qx', 'manual')),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT anesfact_casos_owner_interv_unique UNIQUE (owner_id, interv_id)
);

CREATE INDEX IF NOT EXISTS anesfact_casos_owner_fecha_idx
  ON public.anesfact_casos (owner_id, fecha_cirugia DESC);
CREATE INDEX IF NOT EXISTS anesfact_casos_bandeja_idx
  ON public.anesfact_casos (institucion_id, mutual_id, evweb_status, auth_status);
CREATE INDEX IF NOT EXISTS anesfact_casos_paciente_idx
  ON public.anesfact_casos (paciente_id, fecha_cirugia);

COMMENT ON TABLE public.anesfact_casos IS
  'Expediente de facturación. interv_id apunta a la foja en anesfact_datos; puede ser NULL si el intake llegó antes.';

-- ---------------------------------------------------------------------------
-- 3) Documentos (Storage, no base64 en el blob de sync)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anesfact_caso_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id uuid NOT NULL REFERENCES public.anesfact_casos(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL
    CHECK (kind IN (
      'foja_anest_anesfact', 'foja_qx_anesfact', 'foja_geclisa', 'autorizacion', 'otro'
    )),
  is_current boolean NOT NULL DEFAULT true,
  storage_path text,
  sha256 text,
  mime text,
  bytes integer,
  extracted jsonb NOT NULL DEFAULT '{}'::jsonb,
  ocr_confianza text,
  purge_after timestamptz,
  purged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS anesfact_caso_docs_caso_idx
  ON public.anesfact_caso_documentos (caso_id, kind, is_current);
CREATE INDEX IF NOT EXISTS anesfact_caso_docs_purge_idx
  ON public.anesfact_caso_documentos (purge_after)
  WHERE purged_at IS NULL AND storage_path IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4) Autorizaciones (historial; Traditum = una fila pending_external)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anesfact_caso_autorizaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id uuid NOT NULL REFERENCES public.anesfact_casos(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  canal text NOT NULL
    CHECK (canal IN ('upload', 'traditum', 'geclisa', 'manual')),
  status text NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente', 'autorizado', 'rechazado', 'vencido')),
  documento_id uuid REFERENCES public.anesfact_caso_documentos(id) ON DELETE SET NULL,
  complejidad_solicitada smallint,
  complejidad_autorizada smallint,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS anesfact_caso_auth_pend_idx
  ON public.anesfact_caso_autorizaciones (owner_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- 5) Intake QR secretaria (distinto de anesfact_qr_tokens / valoración paciente)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anesfact_intake_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institucion_id uuid NOT NULL REFERENCES public.anesfact_instituciones(id),
  kind text NOT NULL CHECK (kind IN ('autorizacion', 'foja_qx')),
  token_hash text NOT NULL UNIQUE,
  pin_hash text,
  label text,
  activo boolean NOT NULL DEFAULT true,
  revocado_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.anesfact_intake_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid NOT NULL REFERENCES public.anesfact_intake_tokens(id) ON DELETE RESTRICT,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institucion_id uuid NOT NULL REFERENCES public.anesfact_instituciones(id),
  kind text NOT NULL CHECK (kind IN ('autorizacion', 'foja_qx')),
  caso_id uuid REFERENCES public.anesfact_casos(id) ON DELETE SET NULL,
  storage_path text,
  extracted jsonb NOT NULL DEFAULT '{}'::jsonb,
  dni_hash text,
  afiliado_hash text,
  match_score numeric,
  match_reason text,
  estado text NOT NULL DEFAULT 'recibido'
    CHECK (estado IN ('recibido', 'matcheado', 'ambiguo', 'sin_caso', 'descartado')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS anesfact_intake_huerfanos_idx
  ON public.anesfact_intake_submissions (owner_id, estado, created_at DESC)
  WHERE caso_id IS NULL;

-- ---------------------------------------------------------------------------
-- 6) Lotes evweb (sesión miércoles/viernes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anesfact_evweb_lotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institucion_id uuid REFERENCES public.anesfact_instituciones(id),
  fecha_sesion date NOT NULL,
  cerrado_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.anesfact_evweb_lote_items (
  lote_id uuid NOT NULL REFERENCES public.anesfact_evweb_lotes(id) ON DELETE CASCADE,
  caso_id uuid NOT NULL REFERENCES public.anesfact_casos(id) ON DELETE CASCADE,
  resultado text NOT NULL DEFAULT 'pendiente'
    CHECK (resultado IN ('pendiente', 'cargado', 'salteado', 'error')),
  nota text,
  PRIMARY KEY (lote_id, caso_id)
);

-- ---------------------------------------------------------------------------
-- 7) Membresía (fase 2: secretaria). MVP puede omitirse.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anesfact_institucion_miembros (
  institucion_id uuid NOT NULL REFERENCES public.anesfact_instituciones(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol text NOT NULL CHECK (rol IN ('anestesista', 'secretaria')),
  PRIMARY KEY (institucion_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 8) Vista de bandeja (derivada; no es estado persistido)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.anesfact_casos_bandeja AS
SELECT
  c.*,
  CASE
    WHEN c.evweb_status = 'facturado' THEN 'facturado'
    WHEN c.evweb_status = 'cargado' THEN 'cargado'
    WHEN c.evweb_status = 'rechazado' THEN 'rechazado_evweb'
    WHEN c.evweb_status = 'listo' THEN 'listo_evweb'
    WHEN c.auth_status IN ('pendiente_doc', 'pendiente_externo', 'rechazado')
         AND c.auth_status IS DISTINCT FROM 'no_aplica'
      THEN 'esperando_autorizacion'
    WHEN c.geclisa_status IN ('pendiente_envio', 'enviado') THEN 'esperando_geclisa'
    WHEN c.paciente_id IS NULL OR c.interv_id IS NULL THEN 'huerfanos'
    ELSE 'faltan_documentos'
  END AS bandeja
FROM public.anesfact_casos c
WHERE c.caso_status = 'abierto';

-- ---------------------------------------------------------------------------
-- 9) Trigger: al facturar, programar purge; al rechazar, cancelarlo
--     El DELETE en Storage lo hace un job (Action / Edge), no este trigger.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.af_casos_set_purge()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.evweb_status = 'facturado'
     AND (OLD.evweb_status IS DISTINCT FROM 'facturado') THEN
    UPDATE public.anesfact_caso_documentos
    SET purge_after = now() + interval '14 days'
    WHERE caso_id = NEW.id
      AND purged_at IS NULL
      AND storage_path IS NOT NULL;
  ELSIF NEW.evweb_status IN ('rechazado', 'listo', 'bloqueado')
        AND OLD.evweb_status IN ('facturado', 'cargado') THEN
    UPDATE public.anesfact_caso_documentos
    SET purge_after = NULL
    WHERE caso_id = NEW.id
      AND purged_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_casos_purge ON public.anesfact_casos;
CREATE TRIGGER trg_casos_purge
  AFTER UPDATE OF evweb_status ON public.anesfact_casos
  FOR EACH ROW EXECUTE FUNCTION public.af_casos_set_purge();

-- ---------------------------------------------------------------------------
-- 10) Seed Mayo / Aero × PAMI / APROSS / ART / os_varias
--     Ajustar si las preguntas abiertas del doc cambian Aero+PAMI o APROSS+Geclisa.
-- ---------------------------------------------------------------------------
INSERT INTO public.anesfact_instituciones (codigo, nombre, usa_geclisa, fuente_foja_evweb)
VALUES
  ('mayo', 'Sanatorio Mayo', true,  'geclisa'),
  ('aero', 'Hospital Aeronáutico', false, 'anesfact')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.anesfact_mutuales (
  codigo, nombre, auth_mode_default,
  requiere_foja_anest_evweb, requiere_foja_qx_evweb
) VALUES
  ('pami',     'PAMI',                    'none',     true,  true),
  ('apross',   'APROSS',                  'traditum', false, false),
  ('art',      'ART',                     'upload',   true,  true),
  ('os_varias','Obras sociales varias',   'geclisa',  true,  true)
ON CONFLICT (codigo) DO NOTHING;

-- Políticas: se cargan a mano tras validar las 6 preguntas del doc.
-- Ejemplo (comentado):
--
-- APROSS + Mayo: evweb sin fojas; auth Traditum; Geclisa igual se usa para HC.
-- PAMI + Aero: fojas AnesFact; auth none.
-- os_varias + Aero: auth_mode override a 'upload' (no hay Geclisa).

-- ---------------------------------------------------------------------------
-- 11) RLS (esqueleto). Afinar al implementar.
--     Cliente autenticado: dueño. Intake: solo Edge (service role).
-- ---------------------------------------------------------------------------
ALTER TABLE public.anesfact_instituciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anesfact_mutuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anesfact_workflow_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anesfact_casos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anesfact_caso_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anesfact_caso_autorizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anesfact_intake_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anesfact_intake_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anesfact_evweb_lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anesfact_evweb_lote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anesfact_institucion_miembros ENABLE ROW LEVEL SECURITY;

-- Catálogos: lectura autenticada
DROP POLICY IF EXISTS inst_select_auth ON public.anesfact_instituciones;
CREATE POLICY inst_select_auth ON public.anesfact_instituciones
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS mut_select_auth ON public.anesfact_mutuales;
CREATE POLICY mut_select_auth ON public.anesfact_mutuales
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS pol_select_auth ON public.anesfact_workflow_policies;
CREATE POLICY pol_select_auth ON public.anesfact_workflow_policies
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS casos_owner ON public.anesfact_casos;
CREATE POLICY casos_owner ON public.anesfact_casos
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.af_is_admin())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS docs_owner ON public.anesfact_caso_documentos;
CREATE POLICY docs_owner ON public.anesfact_caso_documentos
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.af_is_admin())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS authz_owner ON public.anesfact_caso_autorizaciones;
CREATE POLICY authz_owner ON public.anesfact_caso_autorizaciones
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.af_is_admin())
  WITH CHECK (owner_id = auth.uid());

-- Tokens / submissions: el dueño lista metadatos; INSERT público solo vía Edge (sin policy = deny)
DROP POLICY IF EXISTS intake_tokens_select_own ON public.anesfact_intake_tokens;
CREATE POLICY intake_tokens_select_own ON public.anesfact_intake_tokens
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.af_is_admin());

DROP POLICY IF EXISTS intake_sub_select_own ON public.anesfact_intake_submissions;
CREATE POLICY intake_sub_select_own ON public.anesfact_intake_submissions
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.af_is_admin());

DROP POLICY IF EXISTS lotes_owner ON public.anesfact_evweb_lotes;
CREATE POLICY lotes_owner ON public.anesfact_evweb_lotes
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.af_is_admin())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS lote_items_owner ON public.anesfact_evweb_lote_items;
CREATE POLICY lote_items_owner ON public.anesfact_evweb_lote_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.anesfact_evweb_lotes l
      WHERE l.id = lote_id AND (l.owner_id = auth.uid() OR public.af_is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.anesfact_evweb_lotes l
      WHERE l.id = lote_id AND l.owner_id = auth.uid()
    )
  );
