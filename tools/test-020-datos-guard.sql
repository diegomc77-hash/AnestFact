-- Prueba 020: no deja Demo a 5 ni vencida; restaura la fila; no toca fojas reales de nadie.
-- Claves de prueba se borran al final.

DO $$
DECLARE
  v_demo uuid;
  v_pro uuid := '27b1b367-f395-413a-8383-78189022d267';
  v_fojas int;
  v_reset date;
  v_exp timestamptz;
  v_monday date;
  v_clave text := 'anesfact_sync_punto3_test';
BEGIN
  SELECT id, fojas_semana, semana_reset, plan_expires_at
  INTO v_demo, v_fojas, v_reset, v_exp
  FROM public.anesfact_usuarios
  WHERE plan = 'demo' AND COALESCE(rol, 'user') IS DISTINCT FROM 'admin'
  ORDER BY created_at
  LIMIT 1;

  IF v_demo IS NULL THEN
    RAISE EXCEPTION '020 test: no hay usuario Demo';
  END IF;

  v_monday := public.af_semana_lunes_ar();

  -- Camino OK: Demo bajo el tope puede INSERT
  UPDATE public.anesfact_usuarios
  SET fojas_semana = 0, semana_reset = v_monday
  WHERE id = v_demo;

  INSERT INTO public.anesfact_datos (clave, datos, owner_id)
  VALUES (v_clave, '{"t":"punto3"}', v_demo);

  -- Tope >= 5: UPDATE de esa clave debe fallar
  UPDATE public.anesfact_usuarios
  SET fojas_semana = 5, semana_reset = v_monday
  WHERE id = v_demo;

  BEGIN
    UPDATE public.anesfact_datos SET datos = '{"t":"cap"}' WHERE clave = v_clave;
    RAISE EXCEPTION '020 test: UPDATE en tope debía rechazarse';
  EXCEPTION
    WHEN others THEN
      IF SQLERRM NOT LIKE '%demo_sync_bloqueado%' THEN RAISE; END IF;
  END;

  BEGIN
    INSERT INTO public.anesfact_datos (clave, datos, owner_id)
    VALUES ('anesfact_sync_punto3_cap2', '{"t":"punto3"}', v_demo);
    RAISE EXCEPTION '020 test: INSERT en tope debía rechazarse';
  EXCEPTION
    WHEN others THEN
      IF SQLERRM NOT LIKE '%demo_sync_bloqueado%' THEN RAISE; END IF;
  END;

  -- Vencida: también rechaza (contador de vuelta a 0 para aislar el motivo)
  UPDATE public.anesfact_usuarios
  SET fojas_semana = 0, semana_reset = v_monday, plan_expires_at = now() - interval '1 day'
  WHERE id = v_demo;

  BEGIN
    UPDATE public.anesfact_datos SET datos = '{"t":"exp"}' WHERE clave = v_clave;
    RAISE EXCEPTION '020 test: UPDATE vencida debía rechazarse';
  EXCEPTION
    WHEN others THEN
      IF SQLERRM NOT LIKE '%demo_sync_bloqueado%' THEN RAISE; END IF;
  END;

  -- Restaurar Demo exactamente
  UPDATE public.anesfact_usuarios
  SET fojas_semana = v_fojas, semana_reset = v_reset, plan_expires_at = v_exp
  WHERE id = v_demo;

  DELETE FROM public.anesfact_datos WHERE clave IN (v_clave, 'anesfact_sync_punto3_cap2');

  -- Pro (Huerta): escritura de clave throwaway OK
  INSERT INTO public.anesfact_datos (clave, datos, owner_id)
  VALUES ('anesfact_sync_punto3_pro', '{"t":"punto3"}', v_pro);
  DELETE FROM public.anesfact_datos WHERE clave = 'anesfact_sync_punto3_pro';

  -- Help no es sync: pasa aunque el owner sea Demo
  INSERT INTO public.anesfact_datos (clave, datos, owner_id)
  VALUES ('anesfact_help_punto3_test', '{"t":"punto3"}', v_demo);
  DELETE FROM public.anesfact_datos WHERE clave = 'anesfact_help_punto3_test';
END $$;

SELECT 'trigger_ok' AS status;

SELECT plan, rol, fojas_semana,
       array_length(sanatorios_permitidos, 1) AS n_lugares,
       sanatorios_permitidos
FROM public.anesfact_usuarios
WHERE id = '27b1b367-f395-413a-8383-78189022d267';

SELECT plan, rol, fojas_semana, plan_expires_at IS NOT NULL AS has_exp
FROM public.anesfact_usuarios
WHERE plan = 'demo' AND COALESCE(rol, 'user') IS DISTINCT FROM 'admin'
ORDER BY created_at
LIMIT 1;

SELECT tgname FROM pg_trigger
WHERE tgrelid = 'public.anesfact_datos'::regclass
  AND tgname = 'trg_anesfact_datos_demo_write';
