-- =====================================================================
-- TELAS JY: esquema completo para Supabase
-- Pégalo completo en Supabase > SQL Editor > New query y toca "Run".
-- Se puede ejecutar más de una vez sin romper nada.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. TABLAS
-- ---------------------------------------------------------------------

-- Perfil de cada usuario (solo existen dos: dueño y vendedora)
create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  rol text not null check (rol in ('dueno','vendedora')),
  nombre text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);
create unique index if not exists perfiles_un_usuario_por_rol on public.perfiles (rol);

-- Horario de ingreso de la vendedora (0 = domingo ... 6 = sábado), hora de Bolivia
create table if not exists public.horarios (
  dia smallint primary key check (dia between 0 and 6),
  permitido boolean not null default false,
  desde time not null default '08:00',
  hasta time not null default '19:00',
  check (hasta > desde)
);
insert into public.horarios (dia, permitido, desde, hasta) values
  (0, false, '08:00', '14:00'),
  (1, true,  '08:00', '19:00'),
  (2, true,  '08:00', '19:00'),
  (3, true,  '08:00', '19:00'),
  (4, true,  '08:00', '19:00'),
  (5, true,  '08:00', '19:00'),
  (6, true,  '08:00', '14:00')
on conflict (dia) do nothing;

-- Historial de accesos
create table if not exists public.accesos (
  id bigint generated always as identity primary key,
  usuario_id uuid,
  usuario text not null,
  tipo text not null check (tipo in ('Ingreso','Intento fuera de horario')),
  creado_en timestamptz not null default now()
);

-- Ajustes (una sola fila): recargo de doble forro y envío a trópico
create table if not exists public.ajustes (
  id smallint primary key default 1 check (id = 1),
  recargo_forro integer not null default 70 check (recargo_forro >= 0),
  envio_tropico integer not null default 20 check (envio_tropico >= 0)
);
insert into public.ajustes (id) values (1) on conflict (id) do nothing;

-- Lista de diseños con su muestra de tela
create table if not exists public.disenos (
  id bigint generated always as identity primary key,
  nombre text not null,
  patron text not null default 'liso' check (patron in ('liso','floral','rayas','lunares')),
  color text not null default '#9AA0B0' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);
create unique index if not exists disenos_nombre_unico on public.disenos (lower(nombre));

-- Clientes (para autocompletar el nombre por el celular)
create table if not exists public.clientes (
  celular text primary key,
  nombre text,
  creado_en timestamptz not null default now()
);

-- Pedidos
create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero integer generated always as identity,
  cliente_celular text not null references public.clientes(celular),
  cliente_nombre text,
  tipo_entrega text not null check (tipo_entrega in ('retiro','envio')),
  envio_nombre text,
  envio_celular text,
  envio_ciudad text,
  envio_tropico boolean not null default false,
  costo_envio integer not null default 0,
  fecha_entrega date not null,
  fecha_entregado date,
  estado text not null default 'en_proceso'
    check (estado in ('en_proceso','listo','entregado','cancelado')),
  creado_por uuid default auth.uid(),
  creado_en timestamptz not null default now()
);
create unique index if not exists pedidos_numero_unico on public.pedidos (numero);

-- Cortes de cada pedido (cada fila es un corte individual)
create table if not exists public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  orden smallint not null default 0,
  diseno text not null,
  cm numeric(8,2) not null check (cm > 0),
  precio_metro numeric(8,2) not null check (precio_metro > 0),
  doble_forro boolean not null default false,
  color_forro text,
  recargo integer not null default 0,
  hecho boolean not null default false,
  hecho_en timestamptz,
  -- subtotal redondeado SIEMPRE hacia arriba a Bs enteros (cálculo en centavos)
  subtotal integer generated always as
    (ceil((round(cm * precio_metro) + recargo * 100) / 100.0)::integer) stored,
  check (not doble_forro or coalesce(trim(color_forro), '') <> '')
);
create index if not exists pedido_items_pedido on public.pedido_items (pedido_id);

-- Pagos
create table if not exists public.pagos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  efectivo integer not null default 0 check (efectivo >= 0),
  qr integer not null default 0 check (qr >= 0),
  verificado boolean not null default false,
  verificado_por uuid,
  verificado_en timestamptz,
  anulado boolean not null default false,
  motivo_anulacion text,
  anulado_por uuid,
  anulado_en timestamptz,
  creado_por uuid default auth.uid(),
  creado_en timestamptz not null default now(),
  check (efectivo + qr > 0),
  check (not anulado or coalesce(trim(motivo_anulacion), '') <> '')
);
create index if not exists pagos_pedido on public.pagos (pedido_id);

-- Retiros de efectivo (solo monto y fecha)
create table if not exists public.retiros (
  id uuid primary key default gen_random_uuid(),
  monto integer not null check (monto > 0),
  fecha date not null default ((now() at time zone 'America/La_Paz')::date),
  creado_por uuid default auth.uid(),
  creado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 1b. AJUSTES A TABLAS YA CREADAS (para bases que tenían la versión anterior)
-- ---------------------------------------------------------------------

-- El nombre del cliente es opcional (los datos pueden llegar después)
alter table public.clientes alter column nombre drop not null;
alter table public.pedidos  alter column cliente_nombre drop not null;

-- Nombre, celular y ciudad del envío son opcionales al crear el pedido. La restricción que
-- los exigía tenía un nombre automático: se busca por su definición y se borra si existe.
-- Si ya no existe, no pasa nada.
do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.pedidos'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%envio_nombre is not null%'
  loop
    execute format('alter table public.pedidos drop constraint %I', r.conname);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 2. FUNCIONES DE PERMISOS Y HORARIO
-- ---------------------------------------------------------------------

create or replace function public.es_dueno()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'dueno' and activo
  );
$$;

create or replace function public.dentro_de_horario()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.horarios h
    where h.dia = extract(dow from (now() at time zone 'America/La_Paz'))::int
      and h.permitido
      and (now() at time zone 'America/La_Paz')::time >= h.desde
      and (now() at time zone 'America/La_Paz')::time <  h.hasta
  );
$$;

-- El dueño siempre puede; la vendedora solo si está activa y dentro de su horario
create or replace function public.puede_operar()
returns boolean language sql stable security definer set search_path = public as $$
  select public.es_dueno()
      or (
        exists (select 1 from public.perfiles
                where id = auth.uid() and rol = 'vendedora' and activo)
        and public.dentro_de_horario()
      );
$$;

-- Estado de acceso del usuario actual (también funciona fuera de horario)
create or replace function public.estado_acceso()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  p public.perfiles;
  h public.horarios;
  v_ahora timestamp := (now() at time zone 'America/La_Paz');
  v_dentro boolean;
begin
  select * into p from public.perfiles where id = auth.uid();
  if not found then
    return jsonb_build_object('rol', null);
  end if;
  select * into h from public.horarios where dia = extract(dow from v_ahora)::int;
  v_dentro := p.activo and (
    p.rol = 'dueno'
    or (coalesce(h.permitido, false)
        and coalesce(v_ahora::time >= h.desde, false)
        and coalesce(v_ahora::time <  h.hasta, false))
  );
  return jsonb_build_object(
    'rol', p.rol,
    'activo', p.activo,
    'dentro', v_dentro,
    'hoy_permitido', coalesce(h.permitido, false),
    'desde', h.desde,
    'hasta', h.hasta,
    'ahora', to_char(v_ahora, 'HH24:MI'),
    'segundos_restantes',
      case when v_dentro and p.rol = 'vendedora'
           then extract(epoch from (h.hasta - v_ahora::time))::int
           else null end,
    'horario', (select jsonb_agg(jsonb_build_object(
                  'dia', x.dia, 'permitido', x.permitido,
                  'desde', x.desde, 'hasta', x.hasta) order by x.dia)
                from public.horarios x)
  );
end $$;

-- Registra el ingreso (o el intento fuera de horario) y devuelve el estado
create or replace function public.registrar_acceso()
returns jsonb language plpgsql security definer set search_path = public as $$
declare e jsonb;
begin
  e := public.estado_acceso();
  if e->>'rol' is null then
    return e;
  end if;
  insert into public.accesos (usuario_id, usuario, tipo)
  values (
    auth.uid(),
    case when e->>'rol' = 'dueno' then 'Dueño' else 'Vendedora' end,
    case when (e->>'dentro')::boolean then 'Ingreso' else 'Intento fuera de horario' end
  );
  return e;
end $$;

-- Crea un pedido completo (cliente + pedido + cortes + adelanto opcional) en un solo paso.
-- Solo el celular y al menos un corte son obligatorios; el nombre y los datos de envío son
-- opcionales. El celular se normaliza: sin espacios, guiones, paréntesis ni "+", y sin el 591
-- inicial cuando el número tiene 11 dígitos (+591 7123 4567 queda como 71234567).
-- El adelanto llega en pago_efectivo y pago_qr (Bs enteros, opcionales). Si es mayor que 0
-- se guarda como un pago del pedido; el trigger de pagos aplica las reglas de siempre
-- (no supera el saldo, nace sin verificar, fecha y autor los pone la base de datos).
-- Si algo falla, no se guarda ni el pedido ni el pago.
create or replace function public.crear_pedido(p jsonb)
returns integer language plpgsql as $$
declare
  v_id uuid;
  v_num integer;
  it jsonb;
  i smallint := 0;
  v_cel text;
  v_nom text;
  v_ef integer := 0;
  v_qr integer := 0;
begin
  v_cel := regexp_replace(coalesce(p->>'celular', ''), '[[:space:]()+-]', '', 'g');
  if v_cel ~ '^591[0-9]{8}$' then
    v_cel := substr(v_cel, 4);
  end if;
  v_nom := nullif(trim(coalesce(p->>'nombre', '')), '');
  if v_cel = '' then
    raise exception 'Falta el celular del cliente';
  end if;
  if jsonb_array_length(coalesce(p->'items', '[]'::jsonb)) = 0 then
    raise exception 'El pedido necesita al menos un corte';
  end if;
  if coalesce(p->>'pago_efectivo', '0') !~ '^[0-9]{1,9}$'
     or coalesce(p->>'pago_qr', '0') !~ '^[0-9]{1,9}$' then
    raise exception 'El adelanto debe ser un número entero de Bs';
  end if;
  v_ef := coalesce(p->>'pago_efectivo', '0')::integer;
  v_qr := coalesce(p->>'pago_qr', '0')::integer;

  insert into public.clientes (celular, nombre) values (v_cel, v_nom)
  on conflict (celular) do update set nombre = coalesce(excluded.nombre, clientes.nombre);

  insert into public.pedidos (
    cliente_celular, cliente_nombre, tipo_entrega,
    envio_nombre, envio_celular, envio_ciudad, envio_tropico, fecha_entrega
  ) values (
    v_cel, v_nom, p->>'entrega',
    nullif(trim(p->>'envio_nombre'), ''),
    nullif(trim(p->>'envio_celular'), ''),
    nullif(trim(p->>'envio_ciudad'), ''),
    coalesce((p->>'tropico')::boolean, false),
    (p->>'fecha_entrega')::date
  ) returning id, numero into v_id, v_num;

  for it in select * from jsonb_array_elements(p->'items') loop
    i := i + 1;
    insert into public.pedido_items (pedido_id, orden, diseno, cm, precio_metro, doble_forro, color_forro)
    values (
      v_id, i, it->>'diseno',
      (it->>'cm')::numeric, (it->>'precio_metro')::numeric,
      coalesce((it->>'doble_forro')::boolean, false),
      nullif(trim(it->>'color_forro'), '')
    );
  end loop;

  if v_ef + v_qr > 0 then
    insert into public.pagos (pedido_id, efectivo, qr) values (v_id, v_ef, v_qr);
  end if;

  return v_num;
end $$;

-- Guarda el horario completo de la vendedora (solo el dueño)
create or replace function public.guardar_horarios(p jsonb)
returns void language plpgsql as $$
declare x jsonb;
begin
  if not public.es_dueno() then
    raise exception 'Solo el dueño puede cambiar el horario';
  end if;
  for x in select * from jsonb_array_elements(p) loop
    update public.horarios
       set permitido = (x->>'permitido')::boolean,
           desde = (x->>'desde')::time,
           hasta = (x->>'hasta')::time
     where dia = (x->>'dia')::smallint;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 3. REGLAS AUTOMÁTICAS (TRIGGERS)
-- ---------------------------------------------------------------------

-- Pedido nuevo: siempre "en proceso" y el costo de envío lo fija el servidor
create or replace function public.pedidos_antes_insertar()
returns trigger language plpgsql as $$
begin
  new.estado := 'en_proceso';
  new.fecha_entregado := null;
  new.creado_por := auth.uid();
  new.creado_en := now();
  if new.tipo_entrega = 'envio' and new.envio_tropico then
    new.costo_envio := coalesce((select envio_tropico from public.ajustes where id = 1), 20);
  else
    new.costo_envio := 0;
  end if;
  if new.tipo_entrega = 'retiro' then
    new.envio_tropico := false;
    new.envio_nombre := null;
    new.envio_celular := null;
    new.envio_ciudad := null;
  end if;
  return new;
end $$;
drop trigger if exists t_pedidos_insertar on public.pedidos;
create trigger t_pedidos_insertar before insert on public.pedidos
  for each row execute function public.pedidos_antes_insertar();

-- Pedido: la vendedora solo puede cambiar el estado (nunca cancelar) y los datos de envío.
-- Todo lo demás es solo del dueño. El costo de envío siempre lo calcula el servidor.
create or replace function public.pedidos_antes_actualizar()
returns trigger language plpgsql as $$
declare
  v_total integer;
  v_pagado integer;
begin
  if not public.es_dueno() then
    if (to_jsonb(new) - array['estado','fecha_entregado','envio_nombre','envio_celular',
                              'envio_ciudad','envio_tropico','costo_envio'])
       is distinct from
       (to_jsonb(old) - array['estado','fecha_entregado','envio_nombre','envio_celular',
                              'envio_ciudad','envio_tropico','costo_envio']) then
      raise exception 'Solo el dueño puede cambiar los datos del pedido';
    end if;
    if new.estado = 'cancelado' and old.estado <> 'cancelado' then
      raise exception 'Solo el dueño puede cancelar pedidos';
    end if;
    if old.estado = 'cancelado' then
      raise exception 'Solo el dueño puede reabrir un pedido cancelado';
    end if;
  end if;

  -- Datos de envío: un texto vacío cuenta como "sin dato"
  new.envio_nombre  := nullif(trim(new.envio_nombre), '');
  new.envio_celular := nullif(trim(new.envio_celular), '');
  new.envio_ciudad  := nullif(trim(new.envio_ciudad), '');

  -- Solo se pueden cambiar en un pedido de envío que no esté cancelado (dueño y vendedora)
  if (new.envio_nombre, new.envio_celular, new.envio_ciudad, new.envio_tropico)
     is distinct from
     (old.envio_nombre, old.envio_celular, old.envio_ciudad, old.envio_tropico)
     and (old.tipo_entrega <> 'envio' or old.estado = 'cancelado') then
    raise exception 'Los datos de envío solo se pueden cambiar en un pedido de envío que no esté cancelado';
  end if;

  -- El costo de envío lo fija el servidor: al cambiar el trópico se recalcula con los
  -- ajustes actuales, y cualquier otro cambio manual del costo se rechaza
  if new.envio_tropico is distinct from old.envio_tropico then
    if new.tipo_entrega = 'envio' and new.envio_tropico then
      new.costo_envio := coalesce((select envio_tropico from public.ajustes where id = 1), 20);
    else
      new.costo_envio := 0;
    end if;
  elsif new.costo_envio is distinct from old.costo_envio then
    raise exception 'El costo de envío lo calcula el sistema; no se puede cambiar a mano';
  end if;

  -- El nuevo total no puede quedar por debajo de lo que ya se pagó
  if new.costo_envio is distinct from old.costo_envio then
    select coalesce(sum(subtotal), 0) into v_total
      from public.pedido_items where pedido_id = new.id;
    v_total := v_total + new.costo_envio;
    select coalesce(sum(efectivo + qr), 0) into v_pagado
      from public.pagos where pedido_id = new.id and not anulado;
    if v_total < v_pagado then
      raise exception 'No se puede cambiar el envío: el nuevo total (% Bs) sería menor que lo ya pagado (% Bs). Primero anula un pago.', v_total, v_pagado;
    end if;
  end if;

  -- La fecha de entrega la fija el servidor: hoy al pasar a "entregado", y no se toca después
  if new.estado = 'entregado' then
    if old.estado = 'entregado' then
      new.fecha_entregado := old.fecha_entregado;
    else
      new.fecha_entregado := (now() at time zone 'America/La_Paz')::date;
    end if;
  else
    new.fecha_entregado := null;
  end if;
  return new;
end $$;
drop trigger if exists t_pedidos_actualizar on public.pedidos;
create trigger t_pedidos_actualizar before update on public.pedidos
  for each row execute function public.pedidos_antes_actualizar();

-- Eliminar pedido: solo el dueño (política de abajo) y solo si no tiene pagos registrados.
-- Los pagos nunca se borran (ni siquiera los anulados): un pedido con pagos se cancela, no se elimina.
create or replace function public.pedidos_antes_borrar()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.pagos where pedido_id = old.id) then
    raise exception 'Este pedido tiene pagos registrados. Cancélalo en lugar de eliminarlo';
  end if;
  return old;
end $$;
drop trigger if exists t_pedidos_borrar on public.pedidos;
create trigger t_pedidos_borrar before delete on public.pedidos
  for each row execute function public.pedidos_antes_borrar();

-- Corte nuevo: el recargo de doble forro lo fija el servidor. La vendedora solo puede
-- agregar cortes mientras se crea el pedido (nunca a un pedido que ya existe).
create or replace function public.items_antes_insertar()
returns trigger language plpgsql as $$
begin
  if not public.es_dueno() and not exists (
    select 1 from public.pedidos where id = new.pedido_id and creado_en = now()
  ) then
    raise exception 'Solo el dueño puede agregar cortes a un pedido ya creado';
  end if;
  new.recargo := case when new.doble_forro
    then coalesce((select recargo_forro from public.ajustes where id = 1), 70)
    else 0 end;
  new.hecho := false;
  new.hecho_en := null;
  return new;
end $$;
drop trigger if exists t_items_insertar on public.pedido_items;
create trigger t_items_insertar before insert on public.pedido_items
  for each row execute function public.items_antes_insertar();

-- Corte: la vendedora solo puede marcarlo como hecho o no hecho
create or replace function public.items_antes_actualizar()
returns trigger language plpgsql as $$
begin
  if not public.es_dueno() then
    if (to_jsonb(new) - array['hecho','hecho_en','subtotal'])
       is distinct from (to_jsonb(old) - array['hecho','hecho_en','subtotal']) then
      raise exception 'Solo el dueño puede cambiar los datos de un corte';
    end if;
  end if;
  if new.hecho and not old.hecho then
    new.hecho_en := now();
  elsif not new.hecho then
    new.hecho_en := null;
  end if;
  return new;
end $$;
drop trigger if exists t_items_actualizar on public.pedido_items;
create trigger t_items_actualizar before update on public.pedido_items
  for each row execute function public.items_antes_actualizar();

-- Pago nuevo: no puede superar el saldo y nace sin verificar
create or replace function public.pagos_antes_insertar()
returns trigger language plpgsql as $$
declare
  v_estado text;
  v_total integer;
  v_pagado integer;
begin
  -- "for update" bloquea el pedido: dos pagos a la vez no pueden pasarse del saldo
  select estado, costo_envio into v_estado, v_total
    from public.pedidos where id = new.pedido_id for update;
  if v_estado is null then
    raise exception 'No se encontró el pedido';
  end if;
  if v_estado = 'cancelado' then
    raise exception 'El pedido está cancelado';
  end if;
  v_total := v_total + coalesce((select sum(subtotal) from public.pedido_items
                                 where pedido_id = new.pedido_id), 0);
  select coalesce(sum(efectivo + qr), 0) into v_pagado
    from public.pagos where pedido_id = new.pedido_id and not anulado;
  if new.efectivo + new.qr > v_total - v_pagado then
    raise exception 'El monto supera el saldo del pedido';
  end if;
  new.creado_por := auth.uid();
  new.creado_en := now();
  new.verificado := false;
  new.verificado_por := null;
  new.verificado_en := null;
  new.anulado := false;
  new.motivo_anulacion := null;
  new.anulado_por := null;
  new.anulado_en := null;
  return new;
end $$;
drop trigger if exists t_pagos_insertar on public.pagos;
create trigger t_pagos_insertar before insert on public.pagos
  for each row execute function public.pagos_antes_insertar();

-- Pago: solo se puede verificar o anular; los montos nunca cambian
create or replace function public.pagos_antes_actualizar()
returns trigger language plpgsql as $$
begin
  if (to_jsonb(new) - array['verificado','verificado_por','verificado_en',
                            'anulado','motivo_anulacion','anulado_por','anulado_en'])
     is distinct from
     (to_jsonb(old) - array['verificado','verificado_por','verificado_en',
                            'anulado','motivo_anulacion','anulado_por','anulado_en']) then
    raise exception 'Los montos de un pago no se pueden cambiar';
  end if;
  if old.anulado then
    raise exception 'Un pago anulado no se puede modificar';
  end if;
  if new.verificado and not old.verificado then
    new.verificado_por := auth.uid();
    new.verificado_en := now();
  elsif not new.verificado then
    new.verificado_por := null;
    new.verificado_en := null;
  end if;
  if new.anulado and not old.anulado then
    new.anulado_por := auth.uid();
    new.anulado_en := now();
  end if;
  return new;
end $$;
drop trigger if exists t_pagos_actualizar on public.pagos;
create trigger t_pagos_actualizar before update on public.pagos
  for each row execute function public.pagos_antes_actualizar();

-- Retiro: la fecha siempre es la de hoy (hora de Bolivia)
create or replace function public.retiros_antes_insertar()
returns trigger language plpgsql as $$
begin
  new.fecha := (now() at time zone 'America/La_Paz')::date;
  new.creado_por := auth.uid();
  new.creado_en := now();
  return new;
end $$;
drop trigger if exists t_retiros_insertar on public.retiros;
create trigger t_retiros_insertar before insert on public.retiros
  for each row execute function public.retiros_antes_insertar();

-- ---------------------------------------------------------------------
-- 4. SEGURIDAD: quién puede ver y cambiar cada cosa
-- ---------------------------------------------------------------------

alter table public.perfiles     enable row level security;
alter table public.horarios     enable row level security;
alter table public.accesos      enable row level security;
alter table public.ajustes      enable row level security;
alter table public.disenos      enable row level security;
alter table public.clientes     enable row level security;
alter table public.pedidos      enable row level security;
alter table public.pedido_items enable row level security;
alter table public.pagos        enable row level security;
alter table public.retiros      enable row level security;

-- perfiles: cada uno ve el suyo; el dueño ve todos. Las cuentas se crean con la función de Netlify.
drop policy if exists perfiles_ver on public.perfiles;
create policy perfiles_ver on public.perfiles for select to authenticated
  using (id = auth.uid() or public.es_dueno());

-- horarios: solo el dueño (la vendedora consulta el suyo con estado_acceso())
drop policy if exists horarios_ver on public.horarios;
create policy horarios_ver on public.horarios for select to authenticated
  using (public.es_dueno());
drop policy if exists horarios_editar on public.horarios;
create policy horarios_editar on public.horarios for update to authenticated
  using (public.es_dueno()) with check (public.es_dueno());

-- accesos: solo el dueño los ve (se escriben con registrar_acceso())
drop policy if exists accesos_ver on public.accesos;
create policy accesos_ver on public.accesos for select to authenticated
  using (public.es_dueno());

-- ajustes: ambos leen; solo el dueño cambia
drop policy if exists ajustes_ver on public.ajustes;
create policy ajustes_ver on public.ajustes for select to authenticated
  using (public.puede_operar());
drop policy if exists ajustes_editar on public.ajustes;
create policy ajustes_editar on public.ajustes for update to authenticated
  using (public.es_dueno()) with check (public.es_dueno());

-- diseños: ambos leen; solo el dueño agrega o cambia
drop policy if exists disenos_ver on public.disenos;
create policy disenos_ver on public.disenos for select to authenticated
  using (public.puede_operar());
drop policy if exists disenos_agregar on public.disenos;
create policy disenos_agregar on public.disenos for insert to authenticated
  with check (public.es_dueno());
drop policy if exists disenos_editar on public.disenos;
create policy disenos_editar on public.disenos for update to authenticated
  using (public.es_dueno()) with check (public.es_dueno());

-- clientes
drop policy if exists clientes_ver on public.clientes;
create policy clientes_ver on public.clientes for select to authenticated
  using (public.puede_operar());
drop policy if exists clientes_agregar on public.clientes;
create policy clientes_agregar on public.clientes for insert to authenticated
  with check (public.puede_operar());
drop policy if exists clientes_editar on public.clientes;
create policy clientes_editar on public.clientes for update to authenticated
  using (public.puede_operar()) with check (public.puede_operar());

-- pedidos (los cambios delicados los limita el trigger según el rol)
drop policy if exists pedidos_ver on public.pedidos;
create policy pedidos_ver on public.pedidos for select to authenticated
  using (public.puede_operar());
drop policy if exists pedidos_agregar on public.pedidos;
create policy pedidos_agregar on public.pedidos for insert to authenticated
  with check (public.puede_operar());
drop policy if exists pedidos_editar on public.pedidos;
create policy pedidos_editar on public.pedidos for update to authenticated
  using (public.puede_operar()) with check (public.puede_operar());
drop policy if exists pedidos_borrar on public.pedidos;
create policy pedidos_borrar on public.pedidos for delete to authenticated
  using (public.es_dueno());

-- cortes
drop policy if exists items_ver on public.pedido_items;
create policy items_ver on public.pedido_items for select to authenticated
  using (public.puede_operar());
drop policy if exists items_agregar on public.pedido_items;
create policy items_agregar on public.pedido_items for insert to authenticated
  with check (public.puede_operar());
drop policy if exists items_editar on public.pedido_items;
create policy items_editar on public.pedido_items for update to authenticated
  using (public.puede_operar()) with check (public.puede_operar());

-- pagos: ambos registran; solo el dueño verifica y anula
drop policy if exists pagos_ver on public.pagos;
create policy pagos_ver on public.pagos for select to authenticated
  using (public.puede_operar());
drop policy if exists pagos_agregar on public.pagos;
create policy pagos_agregar on public.pagos for insert to authenticated
  with check (public.puede_operar());
drop policy if exists pagos_editar on public.pagos;
create policy pagos_editar on public.pagos for update to authenticated
  using (public.es_dueno()) with check (public.es_dueno());

-- retiros: solo el dueño
drop policy if exists retiros_ver on public.retiros;
create policy retiros_ver on public.retiros for select to authenticated
  using (public.es_dueno());
drop policy if exists retiros_agregar on public.retiros;
create policy retiros_agregar on public.retiros for insert to authenticated
  with check (public.es_dueno());

-- ---------------------------------------------------------------------
-- 5. PERMISOS DE ACCESO A LAS TABLAS Y FUNCIONES
-- ---------------------------------------------------------------------

revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select, insert, update on all tables in schema public to authenticated;
grant delete on public.pedidos to authenticated;
grant usage, select on all sequences in schema public to authenticated;

revoke all on function public.es_dueno()           from public, anon;
revoke all on function public.dentro_de_horario()  from public, anon;
revoke all on function public.puede_operar()       from public, anon;
revoke all on function public.estado_acceso()      from public, anon;
revoke all on function public.registrar_acceso()   from public, anon;
revoke all on function public.crear_pedido(jsonb)  from public, anon;
revoke all on function public.guardar_horarios(jsonb) from public, anon;

grant execute on function public.es_dueno()           to authenticated;
grant execute on function public.dentro_de_horario()  to authenticated;
grant execute on function public.puede_operar()       to authenticated;
grant execute on function public.estado_acceso()      to authenticated;
grant execute on function public.registrar_acceso()   to authenticated;
grant execute on function public.crear_pedido(jsonb)  to authenticated;
grant execute on function public.guardar_horarios(jsonb) to authenticated;
