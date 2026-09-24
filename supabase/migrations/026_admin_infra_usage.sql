-- 026: RPC admin — uso de infraestructura (Ticket 4).
-- Ver docs/AVISO_INFRA_GRANTS_MIGRACION.md §4.
-- storage_size_bytes puede ser 0 hasta que exista el bucket (025).

CREATE OR REPLACE FUNCTION public.af_admin_infra_usage()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage, auth
AS $$
DECLARE
  v_db_bytes bigint;
  v_storage_bytes bigint;
  v_mau integer;
  v_datos integer;
  v_pacientes integer;
  v_qr integer;
  v_valoraciones integer;
  v_vinculos integer;
BEGIN
  IF NOT public.af_is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT pg_database_size(current_database()) INTO v_db_bytes;

  BEGIN
    SELECT COALESCE(SUM(COALESCE((metadata->>'size')::bigint, 0)), 0)
      INTO v_storage_bytes
      FROM storage.objects
     WHERE bucket_id = 'anesfact-docs';
  EXCEPTION WHEN OTHERS THEN
    v_storage_bytes := NULL;
  END;

  -- MAU aprox: usuarios auth con last_sign_in en los últimos 30 días
  SELECT COUNT(*)::integer INTO v_mau
  FROM auth.users
  WHERE last_sign_in_at IS NOT NULL
    AND last_sign_in_at > (now() - interval '30 days');

  SELECT COUNT(*)::integer INTO v_datos FROM public.anesfact_datos;
  SELECT COUNT(*)::integer INTO v_pacientes FROM public.anesfact_pacientes;
  SELECT COUNT(*)::integer INTO v_qr FROM public.anesfact_qr_tokens;
  SELECT COUNT(*)::integer INTO v_valoraciones FROM public.anesfact_valoraciones;
  SELECT COUNT(*)::integer INTO v_vinculos FROM public.anesfact_foja_vinculos;

  RETURN json_build_object(
    'ok', true,
    'db_size_bytes', v_db_bytes,
    'storage_size_bytes', v_storage_bytes,
    'mau_count', v_mau,
    'datos_rows', v_datos,
    'pacientes_rows', v_pacientes,
    'qr_tokens_rows', v_qr,
    'valoraciones_rows', v_valoraciones,
    'vinculos_rows', v_vinculos,
    'limits', json_build_object(
      'db_bytes', 524288000,
      'storage_bytes', 1073741824,
      'mau', 50000
    ),
    'ts', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.af_admin_infra_usage() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.af_admin_infra_usage() TO authenticated;
