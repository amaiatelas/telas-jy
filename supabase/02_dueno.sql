-- =====================================================================
-- TELAS JY: convierte tu cuenta en la cuenta del DUEÑO
-- 1) Cambia PON_AQUI_TU_CORREO por el correo con el que creaste tu usuario
--    en Supabase (Authentication > Users). Déjalo entre comillas simples.
-- 2) Pega todo en SQL Editor y toca "Run".
-- =====================================================================

insert into public.perfiles (id, rol, nombre)
select id, 'dueno', 'Dueño'
from auth.users
where email = 'PON_AQUI_TU_CORREO'
on conflict (id) do update set rol = 'dueno', activo = true;

-- Comprobación: debe aparecer una fila con rol "dueno"
select p.rol, p.activo, u.email
from public.perfiles p
join auth.users u on u.id = p.id;
