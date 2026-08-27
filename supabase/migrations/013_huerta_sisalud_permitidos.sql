-- AnesFact 013 — SISalud en el plan de Huerta (solo su fila)
-- No cambia DEFAULTS.pro ni af_admin_set_plan (otros Pro siguen igual).
-- Allende no se toca (string legado «Clínica Allende» queda en el array).

UPDATE public.anesfact_usuarios
SET sanatorios_permitidos =
  COALESCE(sanatorios_permitidos, ARRAY[]::text[])
  || ARRAY(
       SELECT n
       FROM unnest(ARRAY[
         'Hospital Misericordia',
         'Hospital Córdoba',
         'Hospital San Roque'
       ]::text[]) AS n
       WHERE NOT (n = ANY (COALESCE(sanatorios_permitidos, ARRAY[]::text[])))
     )
WHERE id = '27b1b367-f395-413a-8383-78189022d267';
