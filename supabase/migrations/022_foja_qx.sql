-- 022: Foja quirúrgica firmada vía QR cirujano (Paso 2.2)
-- Inserts solo vía Edge (service role). El anestesista lee las propias.

CREATE TABLE IF NOT EXISTS public.anesfact_foja_qx (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qr_token_id uuid REFERENCES public.anesfact_qr_tokens(id) ON DELETE SET NULL,
  inter_id text NOT NULL,
  sanatorio text NOT NULL DEFAULT '',
  -- Cáscara + descripción + grado + firma (PNG data URL) + snapshot cabecera
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  firmada boolean NOT NULL DEFAULT true,
  firmada_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  CONSTRAINT anesfact_foja_qx_owner_inter_unique UNIQUE (owner_id, inter_id)
);

CREATE INDEX IF NOT EXISTS anesfact_foja_qx_owner_idx
  ON public.anesfact_foja_qx (owner_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS anesfact_foja_qx_inter_idx
  ON public.anesfact_foja_qx (owner_id, inter_id);

COMMENT ON TABLE public.anesfact_foja_qx IS
  'Foja quirúrgica sellada por cirujano (QR). Una fila por intervención; upsert al re-firmar.';
COMMENT ON COLUMN public.anesfact_foja_qx.payload IS
  'version, slots, texto, equipo, dx, clinicos, grado_dificultad, firma{png,nombre,mp,especialidad}, cabecera';
COMMENT ON COLUMN public.anesfact_foja_qx.inter_id IS
  'Id local de intervención AnesFact (S.cur.id), mismo que contexto.inter_id del token.';

ALTER TABLE public.anesfact_foja_qx ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS foja_qx_select_own ON public.anesfact_foja_qx;
CREATE POLICY foja_qx_select_own ON public.anesfact_foja_qx
  FOR SELECT USING (owner_id = auth.uid() OR public.af_is_admin());

-- Sin INSERT/UPDATE/DELETE para roles authenticated: solo service_role (Edge).

GRANT SELECT ON public.anesfact_foja_qx TO authenticated;
GRANT ALL ON public.anesfact_foja_qx TO service_role;

-- Data API grants (docs/AVISO_INFRA_GRANTS_MIGRACION.md — post-2026-10-30)
GRANT SELECT ON public.anesfact_foja_qx TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anesfact_foja_qx TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anesfact_foja_qx TO service_role;
