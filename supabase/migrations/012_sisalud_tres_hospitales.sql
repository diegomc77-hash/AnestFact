-- AnesFact 012 — Tres hospitales públicos SISalud (print A4)
-- No cambia sanatorios_permitidos ni el select de la PWA.

UPDATE public.anesfact_instituciones
SET
  tipo_sistema = 'sin_sistema',
  destino_final = 'sisalud',
  desarrollado = true,
  meta = jsonb_build_object(
    'plantilla', 'a4_papel',
    'header', jsonb_build_object(
      'mode', 'png',
      'asset', 'assets/foja-headers/hospital-misericordia-header.png',
      'oficial', true,
      'linea2', 'NUEVO SIGLO'
    )
  )
WHERE id = 'h_misericordia';

UPDATE public.anesfact_instituciones
SET
  tipo_sistema = 'sin_sistema',
  destino_final = 'sisalud',
  desarrollado = true,
  meta = jsonb_build_object(
    'plantilla', 'a4_papel',
    'header', jsonb_build_object(
      'mode', 'compose',
      'oficial', false,
      'lineas', jsonb_build_array('HOSPITAL', 'CÓRDOBA')
    )
  )
WHERE id = 'h_cordoba';

UPDATE public.anesfact_instituciones
SET
  tipo_sistema = 'sin_sistema',
  destino_final = 'sisalud',
  desarrollado = true,
  meta = jsonb_build_object(
    'plantilla', 'a4_papel',
    'header', jsonb_build_object(
      'mode', 'compose',
      'oficial', false,
      'lineas', jsonb_build_array('HOSPITAL', 'SAN ROQUE')
    )
  )
WHERE id = 'h_san_roque';
