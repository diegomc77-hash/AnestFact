-- AnesFact v8 — Auth, planes y RLS
-- Ejecutar en Supabase SQL Editor (en este orden).
-- IMPORTANTE: aplicar RLS al final, cuando la app ya envía owner_id y JWT de usuario.

-- 1) Perfil de usuario / plan
CREATE TABLE IF NOT EXISTS anesfact_usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nombre text,
  matricula text,
  matricula_especial text,
  plan text DEFAULT 'demo' CHECK (plan IN ('demo', 'basico', 'pro', 'bloqueado')),
  fojas_semana integer DEFAULT 0,
  semana_reset date DEFAULT current_date,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE anesfact_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_select_own" ON anesfact_usuarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "usuarios_insert_own" ON anesfact_usuarios
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "usuarios_update_own" ON anesfact_usuarios
  FOR UPDATE USING (auth.uid() = id);

-- 2) owner_id en datos sync (tabla existente)
ALTER TABLE anesfact_datos
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS anesfact_datos_owner_idx ON anesfact_datos (owner_id);

-- Migración manual: usuarios existentes (ej. Dra. Huerta) → plan pro después del registro:
-- UPDATE anesfact_usuarios SET plan = 'pro' WHERE id = '<uuid-del-usuario>';

-- 3) RLS anesfact_datos — EJECUTAR CUANDO LA APP v8 ESTÉ DESPLEGADA
-- ALTER TABLE anesfact_datos ENABLE ROW LEVEL SECURITY;
--
-- DROP POLICY IF EXISTS "datos_select_own" ON anesfact_datos;
-- DROP POLICY IF EXISTS "datos_insert_own" ON anesfact_datos;
-- DROP POLICY IF EXISTS "datos_update_own" ON anesfact_datos;
--
-- CREATE POLICY "datos_select_own" ON anesfact_datos
--   FOR SELECT USING (owner_id = auth.uid());
--
-- CREATE POLICY "datos_insert_own" ON anesfact_datos
--   FOR INSERT WITH CHECK (owner_id = auth.uid());
--
-- CREATE POLICY "datos_update_own" ON anesfact_datos
--   FOR UPDATE USING (owner_id = auth.uid());
