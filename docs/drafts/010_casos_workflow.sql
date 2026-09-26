-- =============================================================================
-- DRAFT — NO APLICAR hasta el mapeo pantalla a pantalla de evweb/Traditum.
-- Arquitectura cerrada: docs/ARQUITECTURA_CASOS_EVWEB.md (24-08-2026).
-- =============================================================================
-- AnesFact 010 — Casos de facturación, intake QR, políticas institución×mutual
--
-- No reemplaza anesfact_datos ni anesfact_qr_tokens (valoración paciente).
-- No toca fill.js / GECLISA tokens.
--
-- Cierre de producto:
--   * Geclisa se dispara por institución (Mayo = siempre), no por mutual.
--   * Aero atiende IOSFA, no PAMI. Sin fila Aero×PAMI.
--   * cirugia_clinica vs cirugia_autorizada (Traditum no usa el dato real).
--   * auth_status Traditum: enviado → validado | sujeto_a_auditoria | rechazado.
--   * Purge autorización al confirmar OCR; fojas 14 d post-facturado.
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
  -- os_varias agrupa OSDE/etc. El nombre concreto vive en casos.obra_social.
  -- iosfa es fila propia (Aero). En Mayo, IOSFA cae en os_varias salvo override.
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
  '{version, slots, geclisa:{required}} — geclisa.required sigue a institucion.usa_geclisa, no a la mutual';

-- ---------------------------------------------------------------------------
-- 2) Casos
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
  -- Traditum: no enviar el dato clínico si difiere del papel.
  cirugia_clinica jsonb NOT NULL DEFAULT '{}'::jsonb,
  cirugia_autorizada jsonb NOT NULL DEFAULT '{}'::jsonb,
  requisitos_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  caso_status text NOT NULL DEFAULT 'abierto'
    CHECK (caso_status IN ('abierto', 'cerrado', 'anulado')),
  auth_status text NOT NULL DEFAULT 'pendiente_doc'
    CHECK (auth_status IN (
      'no_aplica', 'pendiente_doc', 'enviado',
      'validado', 'sujeto_a_auditoria', 'autorizado', 'rechazado'
    )),
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
CREATE INDEX IF NOT EXISTS anesfact_casos_alerta_auth_idx
  ON public.anesfact_casos (owner_id, auth_status)
  WHERE auth_status = 'rechazado';

COMMENT ON TABLE public.anesfact_casos IS
  'Expediente de facturación. interv_id → foja en anesfact_datos (NULL si el intake llegó antes). Dos cirugías el mismo día = dos interv_id = dos filas.';
COMMENT ON COLUMN public.anesfact_casos.cirugia_clinica IS
  'Lo que hizo la doctora. Va a foja / evweb.';
COMMENT ON COLUMN public.anesfact_casos.cirugia_autorizada IS
  'Lo que dice el papel Traditum. Va al envío de validación. No se concilia con cirugia_clinica.';

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
  ocr_confirmado_at timestamptz,
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
-- 4) Autorizaciones (historial; Traditum = intentos)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anesfact_caso_autorizaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id uuid NOT NULL REFERENCES public.anesfact_casos(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  canal text NOT NULL
    CHECK (canal IN ('upload', 'traditum', 'geclisa', 'manual')),
  status text NOT NULL DEFAULT 'pendiente'
    CHECK (status IN (
      'pendiente', 'enviado', 'validado', 'sujeto_a_auditoria', 'rechazado', 'vencido'
    )),
  documento_id uuid REFERENCES public.anesfact_caso_documentos(id) ON DELETE SET NULL,
  complejidad_solicitada smallint,
  complejidad_autorizada smallint,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb, -- copia de cirugia_autorizada al enviar
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS anesfact_caso_auth_pend_idx
  ON public.anesfact_caso_autorizaciones (owner_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- 5) Intake QR secretaria (distinto de anesfact_qr_tokens)
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
-- 7) Membresía (fase 2). MVP: secretaria sube por QR+PIN, no confirma matches.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anesfact_institucion_miembros (
  institucion_id uuid NOT NULL REFERENCES public.anesfact_instituciones(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol text NOT NULL CHECK (rol IN ('anestesista', 'secretaria')),
  PRIMARY KEY (institucion_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 8) Vista de bandeja
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.anesfact_casos_bandeja AS
SELECT
  c.*,
  (c.cirugia_clinica IS DISTINCT FROM '{}'::jsonb
    AND c.cirugia_autorizada IS DISTINCT FROM '{}'::jsonb
    AND c.cirugia_clinica IS DISTINCT FROM c.cirugia_autorizada) AS discrepancia_cirugia,
  CASE
    WHEN c.evweb_status = 'facturado' THEN 'facturado'
    WHEN c.evweb_status = 'cargado' THEN 'cargado'
    WHEN c.evweb_status = 'rechazado' THEN 'rechazado_evweb'
    WHEN c.auth_status = 'rechazado' THEN 'alerta_auth'
    WHEN c.evweb_status = 'listo' THEN 'listo_evweb'
    WHEN c.auth_status IN ('pendiente_doc', 'enviado', 'sujeto_a_auditoria') THEN 'esperando_autorizacion'
    WHEN c.geclisa_status IN ('pendiente_envio', 'enviado') THEN 'esperando_geclisa'
    WHEN c.paciente_id IS NULL OR c.interv_id IS NULL THEN 'huerfanos'
    ELSE 'faltan_documentos'
  END AS bandeja
FROM public.anesfact_casos c
WHERE c.caso_status = 'abierto';

-- ---------------------------------------------------------------------------
-- 9) Purge: trigger solo setea purge_after. Storage lo borra un job.
--    Autorización: al confirmar OCR → ahora.
--    Fojas: 14 días después de facturado.
--    Rechazo (auth o evweb) cancela purge pendiente (purged_at IS NULL).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.af_docs_set_purge_on_ocr()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.kind = 'autorizacion'
     AND NEW.ocr_confirmado_at IS NOT NULL
     AND (OLD.ocr_confirmado_at IS DISTINCT FROM NEW.ocr_confirmado_at)
     AND NEW.purged_at IS NULL
     AND NEW.storage_path IS NOT NULL THEN
    NEW.purge_after := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_docs_purge_ocr ON public.anesfact_caso_documentos;
CREATE TRIGGER trg_docs_purge_ocr
  BEFORE UPDATE OF ocr_confirmado_at ON public.anesfact_caso_documentos
  FOR EACH ROW EXECUTE FUNCTION public.af_docs_set_purge_on_ocr();

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
      AND kind IN ('foja_anest_anesfact', 'foja_qx_anesfact', 'foja_geclisa', 'otro')
      AND purged_at IS NULL
      AND storage_path IS NOT NULL;
  END IF;

  IF (NEW.evweb_status = 'rechazado' AND OLD.evweb_status IS DISTINCT FROM 'rechazado')
     OR (NEW.auth_status = 'rechazado' AND OLD.auth_status IS DISTINCT FROM 'rechazado') THEN
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
  AFTER UPDATE OF evweb_status, auth_status ON public.anesfact_casos
  FOR EACH ROW EXECUTE FUNCTION public.af_casos_set_purge();

-- ---------------------------------------------------------------------------
-- 10) Seed — sin Aero×PAMI
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
  ('iosfa',    'IOSFA',                   'upload',   true,  true),
  ('os_varias','Obras sociales varias',   'geclisa',  true,  true)
ON CONFLICT (codigo) DO NOTHING;

-- Políticas (ids por codigo). Geclisa.required sigue a la institución.
INSERT INTO public.anesfact_workflow_policies (institucion_id, mutual_id, requisitos, notas)
SELECT i.id, m.id, p.requisitos, p.notas
FROM public.anesfact_instituciones i
JOIN public.anesfact_mutuales m ON true
JOIN (VALUES
  ('mayo', 'pami',
    '{"version":1,"geclisa":{"required":true},"slots":{"foja_anest_anesfact":{"required_for_evweb":false},"foja_qx_anesfact":{"required_for_evweb":false},"foja_geclisa":{"required_for_evweb":true},"autorizacion":{"required_for_evweb":false,"auth_mode":"none"}}}'::jsonb,
    'PAMI Mayo: Geclisa siempre; evweb sin autorización'),
  ('mayo', 'apross',
    '{"version":1,"geclisa":{"required":true},"slots":{"foja_anest_anesfact":{"required_for_evweb":false},"foja_qx_anesfact":{"required_for_evweb":false},"foja_geclisa":{"required_for_evweb":false},"autorizacion":{"required_for_evweb":true,"auth_mode":"traditum"}}}'::jsonb,
    'APROSS: Geclisa igual (HC); evweb = paciente+complejidad+Traditum'),
  ('mayo', 'art',
    '{"version":1,"geclisa":{"required":true},"slots":{"foja_anest_anesfact":{"required_for_evweb":false},"foja_qx_anesfact":{"required_for_evweb":false},"foja_geclisa":{"required_for_evweb":true},"autorizacion":{"required_for_evweb":true,"auth_mode":"upload"}}}'::jsonb,
    'ART: QR autorización + foja Geclisa a evweb'),
  ('mayo', 'os_varias',
    '{"version":1,"geclisa":{"required":true},"slots":{"foja_anest_anesfact":{"required_for_evweb":false},"foja_qx_anesfact":{"required_for_evweb":false},"foja_geclisa":{"required_for_evweb":true},"autorizacion":{"required_for_evweb":true,"auth_mode":"geclisa"}}}'::jsonb,
    'OS varias: autorización en Geclisa'),
  ('aero', 'iosfa',
    '{"version":1,"geclisa":{"required":false},"slots":{"foja_anest_anesfact":{"required_for_evweb":true},"foja_qx_anesfact":{"required_for_evweb":true},"foja_geclisa":{"required_for_evweb":false},"autorizacion":{"required_for_evweb":true,"auth_mode":"upload"}}}'::jsonb,
    'Aero IOSFA: ambas fojas nativas + foto autorización. Sin Geclisa, sin Traditum')
) AS p(inst, mut, requisitos, notas)
  ON p.inst = i.codigo AND p.mut = m.codigo
ON CONFLICT (institucion_id, mutual_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 11) RLS (esqueleto). Intake INSERT solo vía Edge (service role).
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
