-- AnesFact 016 — Lote 2 planes: recorte Huerta a 3 lugares
-- Queda: Aero + Mayo + Hospital Córdoba (su único público).
-- Sale: Misericordia, San Roque, Clínica Allende, Clínica Privada Córdoba.
-- Solo su fila. No toca DEFAULTS.pro, af_admin_set_plan, ni el select JS (lote 3).
-- Cuidado hasta lote 3: Guardar plan Pro en el panel vuelve a unir el default de 4
-- (Allende string + Privada Córdoba). No guardar su plan hasta entonces.

UPDATE public.anesfact_usuarios
SET sanatorios_permitidos = ARRAY[
  'Hospital Aeronáutico',
  'Sanatorio Mayo',
  'Hospital Córdoba'
]::text[]
WHERE id = '27b1b367-f395-413a-8383-78189022d267';
