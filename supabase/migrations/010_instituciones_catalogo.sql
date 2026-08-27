-- AnesFact 010 — Catálogo de instituciones (semilla, sin UI)
-- Ejecutar en Supabase → SQL Editor.
-- NO toca anesfact_datos, planes, GECLISA, ni el JS de la PWA.
-- Mayo / Aeronáutico en la app siguen resolviéndose por nombre en cliente.

-- ═══════════════════════════════════════════════════════════
-- Catálogos extensibles (no enum en código)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.anesfact_tipo_sistema (
  id text PRIMARY KEY,
  label text NOT NULL,
  sort integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.anesfact_destino_final (
  id text PRIMARY KEY,
  label text NOT NULL,
  sort integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.anesfact_redes (
  id text PRIMARY KEY,
  nombre text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.anesfact_instituciones (
  id text PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  nombre_aliases text[] NOT NULL DEFAULT '{}',
  tipo_sistema text NOT NULL REFERENCES public.anesfact_tipo_sistema(id),
  destino_final text NOT NULL REFERENCES public.anesfact_destino_final(id),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  red_id text REFERENCES public.anesfact_redes(id),
  sede text,
  ambito text NOT NULL CHECK (ambito IN ('publico', 'privado', 'otro')),
  localidad text,
  activo boolean NOT NULL DEFAULT true,
  desarrollado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS anesfact_instituciones_tipo_idx
  ON public.anesfact_instituciones (tipo_sistema);
CREATE INDEX IF NOT EXISTS anesfact_instituciones_destino_idx
  ON public.anesfact_instituciones (destino_final);
CREATE INDEX IF NOT EXISTS anesfact_instituciones_red_idx
  ON public.anesfact_instituciones (red_id);

ALTER TABLE public.anesfact_tipo_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anesfact_destino_final ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anesfact_redes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anesfact_instituciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tipo_sistema_select" ON public.anesfact_tipo_sistema;
CREATE POLICY "tipo_sistema_select" ON public.anesfact_tipo_sistema
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "destino_final_select" ON public.anesfact_destino_final;
CREATE POLICY "destino_final_select" ON public.anesfact_destino_final
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "redes_select" ON public.anesfact_redes;
CREATE POLICY "redes_select" ON public.anesfact_redes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "instituciones_select" ON public.anesfact_instituciones;
CREATE POLICY "instituciones_select" ON public.anesfact_instituciones
  FOR SELECT USING (true);

GRANT SELECT ON public.anesfact_tipo_sistema TO anon, authenticated;
GRANT SELECT ON public.anesfact_destino_final TO anon, authenticated;
GRANT SELECT ON public.anesfact_redes TO anon, authenticated;
GRANT SELECT ON public.anesfact_instituciones TO anon, authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.anesfact_tipo_sistema FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.anesfact_destino_final FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.anesfact_redes FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.anesfact_instituciones FROM anon, authenticated;

-- ═══════════════════════════════════════════════════════════
-- Semilla catálogos
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.anesfact_tipo_sistema (id, label, sort) VALUES
  ('geclisa', 'GECLISA', 10),
  ('sistema_propio', 'Sistema propio del sanatorio', 20),
  ('sin_sistema', 'Sin sistema digital propio (foja AnesFact / papel)', 30),
  ('a_confirmar', 'A confirmar', 90)
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, sort = EXCLUDED.sort;

INSERT INTO public.anesfact_destino_final (id, label, sort) VALUES
  ('geclisa', 'GECLISA', 10),
  ('evweb', 'evweb / ADAARC', 20),
  ('sisalud', 'SISalud', 30),
  ('sistema_propio', 'App / sistema propio', 40),
  ('a_confirmar', 'A confirmar', 90)
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, sort = EXCLUDED.sort;

INSERT INTO public.anesfact_redes (id, nombre) VALUES
  ('canada', 'Sanatorio de la Cañada')
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

-- ═══════════════════════════════════════════════════════════
-- Semilla instituciones
-- Mayo / Aero / Allende: tipo+destino confirmados.
-- Resto del listado: a_confirmar / a_confirmar (sin flujo).
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.anesfact_instituciones
  (id, nombre, nombre_aliases, tipo_sistema, destino_final, meta, red_id, sede, ambito, localidad, activo, desarrollado)
VALUES
  (
    'mayo',
    'Sanatorio Mayo',
    '{}',
    'geclisa',
    'geclisa',
    '{}'::jsonb,
    NULL, NULL,
    'privado',
    'Córdoba Capital',
    true,
    true
  ),
  (
    'allende',
    'Sanatorio Allende',
    ARRAY['Clínica Allende'],
    'sistema_propio',
    'sistema_propio',
    jsonb_build_object(
      'portal_url', 'https://app.sanatorioallende.com',
      'carga_local', 'exe_legacy',
      'inyeccion', 'a_confirmar',
      'flujo', 'Foja en ejecutable Windows legado; el informe se inyecta después en la app web del sanatorio.'
    ),
    NULL, NULL,
    'privado',
    'Córdoba Capital',
    true,
    false
  ),
  (
    'aeronautico',
    'Hospital Aeronáutico',
    '{}',
    'sin_sistema',
    'evweb',
    jsonb_build_object('plantilla', 'a4_papel'),
    NULL, NULL,
    'otro',
    'Córdoba Capital',
    true,
    true
  ),

  -- Públicos Capital
  ('h_cordoba', 'Hospital Córdoba', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'publico', 'Córdoba Capital', true, false),
  ('h_clinicas', 'Hospital Nacional de Clínicas', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'publico', 'Córdoba Capital', true, false),
  ('h_misericordia', 'Hospital Misericordia', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'publico', 'Córdoba Capital', true, false),
  ('h_rawson', 'Hospital Rawson', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'publico', 'Córdoba Capital', true, false),
  ('h_transito_caceres', 'Hospital Tránsito Cáceres de Allende', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'publico', 'Córdoba Capital', true, false),
  ('h_san_roque', 'Hospital San Roque', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'publico', 'Córdoba Capital', true, false),
  ('h_ninos_trinidad', 'Hospital de Niños Santísima Trinidad', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'publico', 'Córdoba Capital', true, false),
  ('h_nino_jesus', 'Hospital Pediátrico del Niño Jesús', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'publico', 'Córdoba Capital', true, false),
  ('h_materno_neonatal', 'Hospital Materno Neonatal', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'publico', 'Córdoba Capital', true, false),
  ('h_materno_provincial', 'Hospital Materno Provincial', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'publico', 'Córdoba Capital', true, false),
  ('h_neuropsiquiatrico', 'Hospital Neuropsiquiátrico', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'publico', 'Córdoba Capital', true, false),
  ('h_quemado', 'Instituto del Quemado', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'publico', 'Córdoba Capital', true, false),

  -- Públicos interior
  ('h_domingo_funes', 'Hospital Domingo Funes', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'publico', 'Punilla', true, false),
  ('h_romagosa', 'Hospital Romagosa', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'publico', 'Deán Funes', true, false),
  ('h_illia', 'Hospital Arturo Illía', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'publico', 'La Calera', true, false),
  ('h_urrutia', 'Hospital Urrutia', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'publico', 'Unquillo', true, false),
  ('h_favaloro', 'Hospital René Favaloro', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'publico', 'Huinca Renancó', true, false),
  ('h_vella', 'Hospital Pedro Vella', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'publico', 'Corral de Bustos', true, false),
  ('h_garofalo', 'Hospital Garofalo', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'publico', 'Villa Huidobro', true, false),

  -- Privados Capital (Allende y Mayo arriba)
  ('privado_universitario', 'Hospital Privado Universitario', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'privado', 'Córdoba Capital', true, false),
  ('reina_fabiola', 'Clínica Reina Fabiola', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'privado', 'Córdoba Capital', true, false),
  ('velez_sarsfield', 'Clínica Vélez Sarsfield', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'privado', 'Córdoba Capital', true, false),
  ('italiano_cba', 'Hospital Italiano de Córdoba', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'privado', 'Córdoba Capital', true, false),
  ('morra', 'Sanatorio Morra', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'privado', 'Córdoba Capital', true, false),
  ('frances', 'Sanatorio Francés', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'privado', 'Córdoba Capital', true, false),
  ('salvador', 'Sanatorio del Salvador', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'privado', 'Córdoba Capital', true, false),
  ('aconcagua', 'Sanatorio Aconcagua', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'privado', 'Córdoba Capital', true, false),
  ('chutro', 'Clínica Chutro', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'privado', 'Córdoba Capital', true, false),
  ('ferreyra', 'Hospital Ferreyra', ARRAY['Hospital Español'], 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'privado', 'Córdoba Capital', true, false),
  ('privada_cordoba', 'Clínica Privada Córdoba', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, NULL, NULL, 'privado', 'Córdoba Capital', true, false),

  -- Red La Cañada
  ('canada_capital', 'Sanatorio de la Cañada — Córdoba Capital', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, 'canada', 'Córdoba Capital', 'privado', 'Córdoba Capital', true, false),
  ('canada_villa_maria', 'Sanatorio de la Cañada — Villa María', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, 'canada', 'Villa María', 'privado', 'Villa María', true, false),
  ('canada_rio_tercero', 'Sanatorio de la Cañada — Río Tercero', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, 'canada', 'Río Tercero', 'privado', 'Río Tercero', true, false),
  ('canada_cruz_del_eje', 'Sanatorio de la Cañada — Cruz del Eje', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, 'canada', 'Cruz del Eje', 'privado', 'Cruz del Eje', true, false),
  ('canada_cosquin', 'Sanatorio de la Cañada — Cosquín', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, 'canada', 'Cosquín', 'privado', 'Cosquín', true, false),
  ('canada_capilla', 'Sanatorio de la Cañada — Capilla del Monte', '{}', 'a_confirmar', 'a_confirmar', '{}'::jsonb, 'canada', 'Capilla del Monte', 'privado', 'Capilla del Monte', true, false)

ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  nombre_aliases = EXCLUDED.nombre_aliases,
  tipo_sistema = EXCLUDED.tipo_sistema,
  destino_final = EXCLUDED.destino_final,
  meta = EXCLUDED.meta,
  red_id = EXCLUDED.red_id,
  sede = EXCLUDED.sede,
  ambito = EXCLUDED.ambito,
  localidad = EXCLUDED.localidad,
  activo = EXCLUDED.activo,
  desarrollado = EXCLUDED.desarrollado;
