-- =====================================================================
-- TELAS JY: comprobar que la función crear_pedido (con adelanto) quedó bien
-- Pégalo en Supabase > SQL Editor > New query y toca "Run".
-- Solo lee: no cambia ningún dato.
--
-- RESULTADO ESPERADO (una sola fila):
--   funcion_ok   = true    (la función incluye el adelanto y guarda el pago)
--   anon_puede   = false   (sin sesión iniciada NO se puede ejecutar)
--   sesion_puede = true    (con sesión iniciada SÍ se puede ejecutar)
-- Si algún valor es distinto, vuelve a pegar la función crear_pedido de 01_esquema.sql.
-- =====================================================================

select
  (select prosrc like '%pago_efectivo%' and prosrc like '%insert into public.pagos%'
     from pg_proc where proname = 'crear_pedido')                          as funcion_ok,
  has_function_privilege('anon', 'public.crear_pedido(jsonb)', 'execute')          as anon_puede,
  has_function_privilege('authenticated', 'public.crear_pedido(jsonb)', 'execute') as sesion_puede;
