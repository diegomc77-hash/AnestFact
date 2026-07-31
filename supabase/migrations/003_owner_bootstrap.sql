-- AnesFact — Auto-admin para el dueño (sin repetir SQL manual)
-- Ejecutar UNA VEZ en Supabase SQL Editor (después de 002).
-- Solo el email autorizado puede reclamar admin (verificado contra auth.users).

CREATE OR REPLACE FUNCTION public.af_claim_owner_admin(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  auth_email text;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT lower(email) INTO auth_email FROM auth.users WHERE id = uid LIMIT 1;
  IF auth_email IS NULL OR auth_email <> lower(trim(p_email)) THEN
    RETURN false;
  END IF;

  -- Solo emails dueño (agregar otros si hace falta)
  IF lower(trim(p_email)) NOT IN ('diegomc77@gmail.com') THEN
    RETURN false;
  END IF;

  UPDATE public.anesfact_usuarios
  SET rol = 'admin', plan = 'pro', email = auth_email
  WHERE id = uid;

  IF NOT FOUND THEN
    INSERT INTO public.anesfact_usuarios (id, email, nombre, plan, rol, activo, fojas_semana)
    VALUES (uid, auth_email, '', 'pro', 'admin', true, 0)
    ON CONFLICT (id) DO UPDATE
    SET rol = 'admin', plan = 'pro', email = EXCLUDED.email;
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.af_claim_owner_admin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_claim_owner_admin(text) TO authenticated;
