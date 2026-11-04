-- =====================================================================
-- TELAS JY: limpiar los datos de PRUEBA de la base de datos real
--
-- Cómo usarlo, en este orden:
--   PASO 1. Corre SOLO las consultas del PASO 1 (son SELECT, no borran nada) y revisa
--           la lista. Si aparece algo que NO es de prueba, no sigas y avísame.
--   PASO 2. Quita los "-- " del inicio de los DELETE del PASO 2 y corre solo esas líneas.
--   PASO 3. Corre la consulta del PASO 3 para comprobar cuánto quedó.
--   PASO 4. Es opcional y peligroso: lee la advertencia antes de tocarlo.
--
-- Qué se considera "de prueba" (cualquiera de las dos reglas):
--   a) el nombre del cliente EMPIEZA con PRUEBA, en mayúsculas (por ejemplo "PRUEBA Adelanto");
--   b) el celular EMPIEZA con 7000000 (por ejemplo 70000001, 70000002...).
-- Los pedidos nuevos ya no llevan nombre, por eso la regla del celular es la principal.
-- Si escribiste "Prueba" con minúsculas, cambia la palabra "like" por "ilike" en las consultas
-- (ilike no distingue mayúsculas de minúsculas).
-- =====================================================================


-- ---------------------------------------------------------------------
-- PASO 1. REVISAR (no borra nada)
-- ---------------------------------------------------------------------

-- 1a) Pedidos que se borrarían: número, cliente, total y cuántos pagos tienen.
--     "pagos" cuenta todos (también los anulados). "pagado" suma solo los que no están anulados.
select
  p.numero,
  coalesce(p.cliente_nombre, '(sin nombre)') as cliente,
  p.cliente_celular as celular,
  p.estado,
  (select coalesce(sum(i.subtotal), 0) from public.pedido_items i where i.pedido_id = p.id)
    + p.costo_envio as total,
  (select count(*) from public.pagos g where g.pedido_id = p.id) as pagos,
  (select coalesce(sum(g.efectivo + g.qr), 0) from public.pagos g
    where g.pedido_id = p.id and not g.anulado) as pagado
from public.pedidos p
where coalesce(p.cliente_nombre, '') like 'PRUEBA%' or p.cliente_celular like '7000000%'
order by p.numero;

-- 1b) Clientes de prueba que se borrarían (solo los que no tengan ningún otro pedido).
select c.celular, coalesce(c.nombre, '(sin nombre)') as nombre
from public.clientes c
where (coalesce(c.nombre, '') like 'PRUEBA%' or c.celular like '7000000%')
  and not exists (
    select 1 from public.pedidos p
    where p.cliente_celular = c.celular
      and not (coalesce(p.cliente_nombre, '') like 'PRUEBA%' or p.cliente_celular like '7000000%')
  )
order by c.celular;

-- 1c) Control: cuántos pedidos NO son de prueba. Estos no se tocan.
select count(*) as pedidos_que_no_se_tocan
from public.pedidos
where not (coalesce(cliente_nombre, '') like 'PRUEBA%' or cliente_celular like '7000000%');


-- ---------------------------------------------------------------------
-- PASO 2. BORRAR (desactivado: solo quita los "-- " después de revisar el PASO 1)
--
-- Los cortes y los pagos de cada pedido se borran solos junto con el pedido.
-- OJO: esto borra pagos de verdad (incluso anulados). Está bien para datos de prueba,
-- pero nunca lo uses con pedidos reales: en la app los pagos anulados no se borran.
-- Los dos DELETE van en este orden: primero los pedidos y después los clientes.
-- ---------------------------------------------------------------------

-- delete from public.pedidos
-- where coalesce(cliente_nombre, '') like 'PRUEBA%' or cliente_celular like '7000000%';

-- delete from public.clientes c
-- where (coalesce(c.nombre, '') like 'PRUEBA%' or c.celular like '7000000%')
--   and not exists (select 1 from public.pedidos p where p.cliente_celular = c.celular);


-- ---------------------------------------------------------------------
-- PASO 3. COMPROBAR cuánto quedó (solo lee)
-- ---------------------------------------------------------------------

select
  (select count(*) from public.pedidos)       as pedidos_que_quedan,
  (select count(*) from public.pedido_items)  as cortes_que_quedan,
  (select count(*) from public.pagos)         as pagos_que_quedan,
  (select count(*) from public.clientes)      as clientes_que_quedan;


-- ---------------------------------------------------------------------
-- PASO 4 (OPCIONAL). Reiniciar la numeración de pedidos desde 1
--
-- ADVERTENCIA: úsalo SOLO si la tabla de pedidos quedó completamente vacía
-- (pedidos_que_quedan = 0 en el PASO 3). Si todavía hay pedidos reales y reinicias,
-- los números nuevos se repetirían con los que ya existen y habría confusión o errores.
-- Este bloque tiene un seguro: si la tabla no está vacía, se detiene con un mensaje
-- y no cambia nada.
-- ---------------------------------------------------------------------

-- do $$
-- begin
--   if (select count(*) from public.pedidos) = 0 then
--     alter table public.pedidos alter column numero restart with 1;
--   else
--     raise exception 'La tabla de pedidos no está vacía: no se reinicia la numeración';
--   end if;
-- end $$;
