-- AnesFact 021 — quitar overload de 1 arg de af_assert_plan
--
-- En producción coexistían:
--   af_assert_plan(text)              — wrapper que llama a la de 2 args
--   af_assert_plan(text, text DEFAULT NULL)  — migración 017 (la correcta)
--
-- af_geclisa_create_token hace af_assert_plan('geclisa') → Postgres no
-- distingue (DEFAULT NULL) → "function is not unique" → mint GECLISA cae.
--
-- Este DROP deja solo la firma de 017. Las llamadas de 1 arg resuelven
-- al DEFAULT. No toca el cuerpo de 2 argumentos.

DROP FUNCTION IF EXISTS public.af_assert_plan(text);
