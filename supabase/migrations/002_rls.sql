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
