-- AnesFact 023 — updated_at en anesfact_datos: permite chequear "¿cambió algo?"
-- pidiendo solo esta columna, antes de bajar el JSON completo (columna `datos`,
-- que puede pesar varios MB). Aditivo puro: agrega columna + trigger, no toca
-- filas existentes ni RLS.

ALTER TABLE public.anesfact_datos
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.af_datos_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_anesfact_datos_touch_updated_at ON public.anesfact_datos;
CREATE TRIGGER trg_anesfact_datos_touch_updated_at
  BEFORE INSERT OR UPDATE ON public.anesfact_datos
  FOR EACH ROW
  EXECUTE FUNCTION public.af_datos_touch_updated_at();
