-- =====================================================================
-- TELAS JY: comprobar los cambios de "pedido sin datos" y datos de envío
-- Pégalo en Supabase > SQL Editor > New query y toca "Run".
-- Solo lee: no cambia ningún dato.
--
-- RESULTADO ESPERADO (una sola fila, los siete valores):
--   nombre_cliente_opcional   = true   (clientes.nombre ya acepta vacío)
--   nombre_pedido_opcional    = true   (pedidos.cliente_nombre ya acepta vacío)
--   restriccion_envio_quitada = true   (ya no se exige nombre, celular y ciudad del envío)
--   crear_pedido_ok           = true   (pide solo el celular, normaliza el celular y guarda el adelanto)
--   trigger_envio_ok          = true   (reglas de cambio de envío, costo y total contra lo pagado)
--   anon_puede                = false  (sin sesión iniciada NO se puede crear pedidos)
--   sesion_puede              = true   (con sesión iniciada SÍ)
-- Si algún valor es distinto, vuelve a pegar el archivo 01_esquema.sql completo.
-- =====================================================================

select
  (select is_nullable = 'YES' from information_schema.columns
    where table_schema = 'public' and table_name = 'clientes' and column_name = 'nombre')
                                                                          as nombre_cliente_opcional,
  (select is_nullable = 'YES' from information_schema.columns
    where table_schema = 'public' and table_name = 'pedidos' and column_name = 'cliente_nombre')
                                                                          as nombre_pedido_opcional,
  not exists (select 1 from pg_constraint
    where conrelid = 'public.pedidos'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%envio_nombre is not null%')   as restriccion_envio_quitada,
  (select prosrc not like '%Faltan los datos del cliente%'
      and prosrc like '%Falta el celular del cliente%'
      and prosrc like '%^591[0-9]{8}$%'
      and prosrc like '%insert into public.pagos%'
     from pg_proc where proname = 'crear_pedido')                         as crear_pedido_ok,
  (select prosrc like '%Los datos de envío solo se pueden cambiar%'
      and prosrc like '%El costo de envío lo calcula el sistema%'
      and prosrc like '%sería menor que lo ya pagado%'
     from pg_proc where proname = 'pedidos_antes_actualizar')             as trigger_envio_ok,
  has_function_privilege('anon', 'public.crear_pedido(jsonb)', 'execute')          as anon_puede,
  has_function_privilege('authenticated', 'public.crear_pedido(jsonb)', 'execute') as sesion_puede;
