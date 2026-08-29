-- AnesFact 020 — Punto 3B: no escribir sync de Demo vencida o en tope semanal
-- Solo INSERT/UPDATE de claves anesfact_sync_*. SELECT/pull no se toca.
-- No aplica a help, puente GECLISA, admin, ni planes basico/max/pro.
-- Semana: lunes America/Argentina/Cordoba (af_semana_lunes_ar), igual que af_consume_foja.
-- fojas_semana >= 5 (después del reset semanal): rechaza. El 5º consume deja el
-- contador en 5; esa foja queda en el dispositivo (capa A) y el POST a la nube
-- no pasa. Un POST directo tampoco.

CREATE OR REPLACE FUNCTION public.af_guard_datos_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_plan text;
  v_rol text;
  v_fojas int;
  v_reset date;
  v_expires timestamptz;
  v_monday date;
BEGIN
  IF NEW.clave IS NULL OR NEW.clave NOT LIKE 'anesfact_sync_%' THEN
    RETURN NEW;
  END IF;

  IF public.af_is_admin() THEN
    RETURN NEW;
  END IF;

  v_uid := COALESCE(NEW.owner_id, auth.uid());
  IF v_uid IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT plan, rol, fojas_semana, semana_reset, plan_expires_at
  INTO v_plan, v_rol, v_fojas, v_reset, v_expires
  FROM public.anesfact_usuarios
  WHERE id = v_uid;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF v_rol = 'admin' THEN
    RETURN NEW;
  END IF;

  IF COALESCE(v_plan, 'demo') IS DISTINCT FROM 'demo' THEN
    RETURN NEW;
  END IF;

  IF v_expires IS NOT NULL AND now() >= v_expires THEN
    RAISE EXCEPTION 'demo_sync_bloqueado: demo vencida'
      USING ERRCODE = 'P0001';
  END IF;

  v_monday := public.af_semana_lunes_ar();
  IF v_reset IS NULL OR v_reset < v_monday THEN
    v_fojas := 0;
  END IF;

  IF COALESCE(v_fojas, 0) >= 5 THEN
    RAISE EXCEPTION 'demo_sync_bloqueado: límite semanal (5 fojas)'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.af_guard_datos_write() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_anesfact_datos_demo_write ON public.anesfact_datos;
CREATE TRIGGER trg_anesfact_datos_demo_write
  BEFORE INSERT OR UPDATE ON public.anesfact_datos
  FOR EACH ROW
  EXECUTE FUNCTION public.af_guard_datos_write();
