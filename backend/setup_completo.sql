-- KSA Taller — Instalación completa (migraciones 001 a 005)
-- Generado a partir de backend/migrations/. Pegar entero en Supabase → SQL Editor → Run, una sola vez.

-- ============================================================
-- 001_schema.sql
-- ============================================================
-- KSA Taller — Esquema Fase 1
-- Ejecutar en Supabase SQL Editor (en orden: 001 → 002 → 003 → 004)

-- Roles de usuario
create type public.user_role as enum ('admin', 'gerente', 'trabajador', 'cliente');

-- Etapas de una orden de trabajo
create type public.order_stage as enum (
  'cotizada',
  'aprobada',
  'materiales',
  'en_taller',
  'pruebas',
  'lista',
  'entregada'
);

create type public.order_priority as enum ('baja', 'media', 'alta', 'urgente');

-- Perfiles (1:1 con auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'trabajador',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Clientes del taller
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

-- Proveedores de aceros / insumos
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

-- Inventario de materiales (aceros y otros)
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade text, -- 4140, 4340, 1045, etc.
  unit text not null default 'kg',
  stock_qty numeric(12, 2) not null default 0 check (stock_qty >= 0),
  min_stock numeric(12, 2) not null default 0 check (min_stock >= 0),
  supplier_id uuid references public.suppliers (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Órdenes de trabajo
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  client_id uuid not null references public.clients (id),
  description text not null,
  stage public.order_stage not null default 'cotizada',
  priority public.order_priority not null default 'media',
  due_date date,
  assignee_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  photo_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_stage_idx on public.orders (stage);
create index orders_assignee_idx on public.orders (assignee_id);
create index orders_due_date_idx on public.orders (due_date);

-- Historial de cambios de etapa
create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  from_stage public.order_stage,
  to_stage public.order_stage not null,
  user_id uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index order_events_order_idx on public.order_events (order_id, created_at desc);

-- Materiales requeridos por orden
create table public.order_materials (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  material_id uuid not null references public.materials (id),
  qty_required numeric(12, 2) not null check (qty_required > 0),
  qty_consumed numeric(12, 2) not null default 0 check (qty_consumed >= 0),
  unique (order_id, material_id)
);

-- Movimientos de stock (entrada/salida)
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id),
  order_id uuid references public.orders (id) on delete set null,
  qty_change numeric(12, 2) not null, -- negativo = salida
  reason text not null,
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index stock_movements_material_idx on public.stock_movements (material_id, created_at desc);

-- Storage bucket para fotos opcionales de piezas
insert into storage.buckets (id, name, public)
values ('order-photos', 'order-photos', true)
on conflict (id) do nothing;

-- ============================================================
-- 002_rls.sql
-- ============================================================
-- KSA Taller — Row Level Security por rol

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.suppliers enable row level security;
alter table public.materials enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;
alter table public.order_materials enable row level security;
alter table public.stock_movements enable row level security;

-- Helper: rol del usuario autenticado
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and active = true
      and role in ('admin', 'gerente', 'trabajador')
  );
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and active = true
      and role in ('admin', 'gerente')
  );
$$;

-- Al registrarse / crear usuario: perfil automático (el rol lo ajusta admin)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'trabajador')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========== PROFILES ==========
create policy "profiles_select_staff"
  on public.profiles for select
  to authenticated
  using (public.is_staff() or id = auth.uid());

create policy "profiles_update_self_or_admin"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.current_role() = 'admin')
  with check (id = auth.uid() or public.current_role() = 'admin');

create policy "profiles_admin_insert"
  on public.profiles for insert
  to authenticated
  with check (public.current_role() = 'admin');

-- ========== CLIENTS ==========
create policy "clients_select_staff"
  on public.clients for select to authenticated
  using (public.is_staff());

create policy "clients_write_manager"
  on public.clients for all to authenticated
  using (public.is_manager())
  with check (public.is_manager());

-- ========== SUPPLIERS ==========
create policy "suppliers_select_staff"
  on public.suppliers for select to authenticated
  using (public.is_staff());

create policy "suppliers_write_manager"
  on public.suppliers for all to authenticated
  using (public.is_manager())
  with check (public.is_manager());

-- ========== MATERIALS ==========
create policy "materials_select_staff"
  on public.materials for select to authenticated
  using (public.is_staff());

create policy "materials_write_manager"
  on public.materials for insert to authenticated
  with check (public.is_manager());

create policy "materials_update_manager"
  on public.materials for update to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "materials_delete_admin"
  on public.materials for delete to authenticated
  using (public.current_role() = 'admin');

-- ========== ORDERS ==========
create policy "orders_select_staff"
  on public.orders for select to authenticated
  using (
    public.is_manager()
    or (public.current_role() = 'trabajador' and (assignee_id = auth.uid() or assignee_id is null or stage in ('en_taller', 'pruebas', 'materiales')))
    or (public.current_role() = 'cliente' and client_id in (
      -- reserva Fase 3: link cliente↔auth vía metadata; por ahora clientes no leen
      select id from public.clients where false
    ))
  );

create policy "orders_insert_manager"
  on public.orders for insert to authenticated
  with check (public.is_manager());

create policy "orders_update_staff"
  on public.orders for update to authenticated
  using (
    public.is_manager()
    or (public.current_role() = 'trabajador' and (assignee_id = auth.uid() or assignee_id is null))
  )
  with check (
    public.is_manager()
    or (public.current_role() = 'trabajador' and (assignee_id = auth.uid() or assignee_id is null))
  );

create policy "orders_delete_admin"
  on public.orders for delete to authenticated
  using (public.current_role() = 'admin');

-- ========== ORDER EVENTS ==========
create policy "order_events_select_staff"
  on public.order_events for select to authenticated
  using (public.is_staff());

create policy "order_events_insert_staff"
  on public.order_events for insert to authenticated
  with check (public.is_staff());

-- ========== ORDER MATERIALS ==========
create policy "order_materials_select_staff"
  on public.order_materials for select to authenticated
  using (public.is_staff());

create policy "order_materials_write_staff"
  on public.order_materials for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ========== STOCK MOVEMENTS ==========
create policy "stock_movements_select_staff"
  on public.stock_movements for select to authenticated
  using (public.is_staff());

create policy "stock_movements_insert_staff"
  on public.stock_movements for insert to authenticated
  with check (public.is_staff());

-- Storage: fotos de órdenes
create policy "order_photos_select_staff"
  on storage.objects for select to authenticated
  using (bucket_id = 'order-photos' and public.is_staff());

create policy "order_photos_insert_staff"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'order-photos' and public.is_staff());

create policy "order_photos_update_staff"
  on storage.objects for update to authenticated
  using (bucket_id = 'order-photos' and public.is_staff());

-- ============================================================
-- 003_triggers.sql
-- ============================================================
-- KSA Taller — Triggers: historial de etapas + stock

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create trigger materials_set_updated_at
  before update on public.materials
  for each row execute function public.set_updated_at();

-- Registrar cambio de etapa en order_events
create or replace function public.log_order_stage_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (order_id, from_stage, to_stage, user_id, note)
    values (new.id, null, new.stage, auth.uid(), 'Orden creada');
    return new;
  end if;

  if old.stage is distinct from new.stage then
    insert into public.order_events (order_id, from_stage, to_stage, user_id)
    values (new.id, old.stage, new.stage, auth.uid());
  end if;

  return new;
end;
$$;

create trigger orders_log_stage
  after insert or update of stage on public.orders
  for each row execute function public.log_order_stage_change();

-- Aplicar movimiento de stock al inventario
create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_qty numeric(12, 2);
begin
  update public.materials
  set stock_qty = stock_qty + new.qty_change
  where id = new.material_id
  returning stock_qty into new_qty;

  if new_qty is null then
    raise exception 'Material no encontrado';
  end if;

  if new_qty < 0 then
    raise exception 'Stock insuficiente para este movimiento';
  end if;

  return new;
end;
$$;

create trigger stock_movements_apply
  after insert on public.stock_movements
  for each row execute function public.apply_stock_movement();

-- Bloquear paso a en_taller si hay faltantes
create or replace function public.prevent_en_taller_without_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  shortage_count int;
begin
  if new.stage = 'en_taller' and (old.stage is distinct from 'en_taller') then
    select count(*) into shortage_count
    from public.order_materials om
    join public.materials m on m.id = om.material_id
    where om.order_id = new.id
      and m.stock_qty < (om.qty_required - om.qty_consumed);

    if shortage_count > 0 then
      raise exception 'No se puede pasar a en_taller: hay materiales faltantes. Revise inventario.';
    end if;
  end if;

  return new;
end;
$$;

create trigger orders_block_en_taller
  before update of stage on public.orders
  for each row execute function public.prevent_en_taller_without_stock();

-- ============================================================
-- 004_views_seed.sql
-- ============================================================
-- KSA Taller — Vista de faltantes + datos semilla de aceros

-- Faltantes por orden (comparación order_materials vs stock)
create or replace view public.order_shortages as
select
  om.order_id,
  o.code as order_code,
  o.stage,
  o.due_date,
  om.material_id,
  m.name as material_name,
  m.grade,
  m.unit,
  om.qty_required,
  om.qty_consumed,
  m.stock_qty,
  greatest(om.qty_required - om.qty_consumed - m.stock_qty, 0) as qty_shortage,
  s.name as supplier_name
from public.order_materials om
join public.orders o on o.id = om.order_id
join public.materials m on m.id = om.material_id
left join public.suppliers s on s.id = m.supplier_id
where o.stage not in ('entregada')
  and (om.qty_required - om.qty_consumed) > m.stock_qty;

-- Materiales bajo mínimo de reposición
create or replace view public.materials_below_min as
select
  m.*,
  s.name as supplier_name
from public.materials m
left join public.suppliers s on s.id = m.supplier_id
where m.stock_qty < m.min_stock;

-- Permisos de lectura sobre vistas
grant select on public.order_shortages to authenticated;
grant select on public.materials_below_min to authenticated;

-- Realtime: publicar cambios del tablero
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_materials;
alter publication supabase_realtime add table public.materials;

-- Proveedor ejemplo + aceros típicos del taller
insert into public.suppliers (name, phone, notes)
select 'Aceros del Pacífico', '3000000000', 'Proveedor principal Cali'
where not exists (
  select 1 from public.suppliers where name = 'Aceros del Pacífico'
);

insert into public.materials (name, grade, unit, stock_qty, min_stock, supplier_id, notes)
select
  v.name, v.grade, v.unit, v.stock_qty, v.min_stock, s.id, v.notes
from public.suppliers s
cross join (
  values
    ('Acero 4140', '4140', 'kg', 120, 40, 'Barras / ejes'),
    ('Acero 4340', '4340', 'kg', 80, 30, 'Alta resistencia'),
    ('Acero 1045', '1045', 'kg', 200, 50, 'Uso general'),
    ('Acero inox 304', '304', 'kg', 45, 20, 'Cilindros / tapas')
) as v(name, grade, unit, stock_qty, min_stock, notes)
where s.name = 'Aceros del Pacífico'
  and not exists (select 1 from public.materials m where m.grade = v.grade);

-- ============================================================
-- 005_security_fixes.sql
-- ============================================================
-- KSA Taller — Correcciones de seguridad sobre 002 y 004

-- 1. El rol de un usuario nuevo siempre es 'trabajador'.
--    Antes se tomaba de raw_user_meta_data, y cualquiera podía registrarse como admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'trabajador'
  );
  return new;
end;
$$;

-- 2. Solo un admin puede cambiar role o active de un perfil.
--    La política profiles_update_self_or_admin deja editar el propio perfil,
--    pero no debe permitir subirse de rol ni reactivarse.
--    Sin auth.uid() (SQL Editor / service_role) se permite, para poder promover al primer admin.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.active is distinct from old.active)
     and auth.uid() is not null
     and coalesce(public.current_role()::text, '') <> 'admin' then
    raise exception 'Solo un administrador puede cambiar el rol o el estado de un usuario';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_privileges on public.profiles;
create trigger profiles_protect_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- 3. Las vistas respetan el RLS de quien consulta (por defecto se ejecutan como su dueño).
alter view public.order_shortages set (security_invoker = true);
alter view public.materials_below_min set (security_invoker = true);

-- 4. search_path fijo en la función de updated_at (alerta del advisor de Supabase).
alter function public.set_updated_at() set search_path = public;
