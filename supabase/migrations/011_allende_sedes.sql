-- AnesFact 011 — Allende: 2 sedes (Cerro / Nueva Córdoba), sin "Clínica Allende"
-- Prerrequisito: 010 ya aplicada (existe fila id = 'allende').
-- Idempotente: si 010 nueva ya sembró las sedes, solo borra la fila genérica si quedó.

INSERT INTO public.anesfact_redes (id, nombre) VALUES
  ('allende', 'Sanatorio Allende')
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

INSERT INTO public.anesfact_instituciones
  (id, nombre, nombre_aliases, tipo_sistema, destino_final, meta, red_id, sede, ambito, localidad, activo, desarrollado)
VALUES
  (
    'allende_cerro',
    'Sanatorio Allende — Cerro de las Rosas',
    '{}',
    'sistema_propio',
    'sistema_propio',
    jsonb_build_object(
      'portal_url', 'https://app.sanatorioallende.com',
      'carga_local', 'exe_legacy',
      'inyeccion', 'a_confirmar',
      'flujo', 'Foja en ejecutable Windows legado; el informe se inyecta después en la app web del sanatorio.'
    ),
    'allende',
    'Cerro de las Rosas',
    'privado',
    'Córdoba Capital',
    true,
    false
  ),
  (
    'allende_nueva_cordoba',
    'Sanatorio Allende — Nueva Córdoba',
    '{}',
    'sistema_propio',
    'sistema_propio',
    jsonb_build_object(
      'portal_url', 'https://app.sanatorioallende.com',
      'carga_local', 'exe_legacy',
      'inyeccion', 'a_confirmar',
      'flujo', 'Foja en ejecutable Windows legado; el informe se inyecta después en la app web del sanatorio.'
    ),
    'allende',
    'Nueva Córdoba',
    'privado',
    'Córdoba Capital',
    true,
    false
  )
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

DELETE FROM public.anesfact_instituciones WHERE id = 'allende';
