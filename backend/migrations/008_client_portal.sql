-- KSA Taller — Portal de clientes
-- Los clientes crean su propia cuenta, ven el estado de sus órdenes y envían
-- solicitudes con medidas y fotos. Gerencia revisa y las convierte en órdenes.
--
-- Requiere en Supabase Auth: "Allow new users to sign up" activado y
-- "Confirm email" activado (la cuenta se vincula a la ficha de cliente solo
-- con el correo confirmado).

-- 1. Toda cuenta nueva entra como 'cliente'.
--    Antes entraba como 'trabajador': con el registro abierto, cualquiera vería el taller.
--    El equipo se crea igual (Authentication → Users) y el admin le sube el rol en Usuarios.
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
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    'cliente'
  );
  return new;
end;
$$;

alter table public.profiles alter column role set default 'cliente';

-- 2. Cuenta ↔ ficha de cliente
alter table public.clients
  add column user_id uuid unique references auth.users (id) on delete set null;

create index clients_email_lower_idx on public.clients (lower(email));

-- Cliente activo con sesión
create or replace function public.is_client()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active = true and role = 'cliente'
  );
$$;

-- Ficha de cliente de quien tiene la sesión (null si no es cliente o no está vinculada)
create or replace function public.my_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.id
  from public.clients c
  where c.user_id = auth.uid() and public.is_client();
$$;

-- Vincula la cuenta con su ficha por correo confirmado.
-- Si no hay ficha con ese correo y create_if_missing, crea una nueva.
create or replace function public.claim_client_account(create_if_missing boolean default false)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_confirmed timestamptz;
  v_meta jsonb;
  v_client uuid;
begin
  if v_uid is null or not public.is_client() then
    return null;
  end if;

  select id into v_client from public.clients where user_id = v_uid;
  if v_client is not null then
    return v_client;
  end if;

  select email, email_confirmed_at, raw_user_meta_data
    into v_email, v_confirmed, v_meta
  from auth.users where id = v_uid;

  if v_email is null or v_confirmed is null then
    return null;
  end if;

  -- Ficha existente con el mismo correo y sin cuenta (la más antigua)
  select id into v_client
  from public.clients
  where lower(email) = lower(v_email) and user_id is null
  order by created_at
  limit 1
  for update skip locked;

  if v_client is not null then
    update public.clients set user_id = v_uid where id = v_client;
    return v_client;
  end if;

  if not create_if_missing then
    return null;
  end if;

  insert into public.clients (name, email, phone, user_id)
  values (
    coalesce(
      nullif(trim(v_meta->>'full_name'), ''),
      (select full_name from public.profiles where id = v_uid),
      split_part(v_email, '@', 1)
    ),
    v_email,
    nullif(trim(v_meta->>'phone'), ''),
    v_uid
  )
  returning id into v_client;

  return v_client;
end;
$$;

-- El cliente ve su propia ficha
create policy "clients_select_own"
  on public.clients for select to authenticated
  using (user_id = auth.uid() and public.is_client());

-- 3. Órdenes del cliente: solo campos pensados para él (sin notas internas ni responsable).
--    La tabla orders sigue cerrada para clientes.
create or replace function public.client_orders()
returns table (
  id uuid,
  code text,
  description text,
  stage public.order_stage,
  priority public.order_priority,
  due_date date,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select o.id, o.code, o.description, o.stage, o.priority, o.due_date, o.created_at, o.updated_at
  from public.orders o
  where o.client_id = public.my_client_id()
  order by (o.stage = 'entregada'), o.created_at desc;
$$;

-- 4. Solicitudes de clientes
create type public.request_status as enum ('pendiente', 'en_revision', 'aceptada', 'rechazada');

create table public.client_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  description text not null check (length(trim(description)) > 0),
  measures text,
  quantity integer not null default 1 check (quantity > 0),
  desired_date date,
  photo_paths text[] not null default '{}',
  status public.request_status not null default 'pendiente',
  response text,
  order_id uuid references public.orders (id) on delete set null,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index client_requests_client_idx on public.client_requests (client_id, created_at desc);
create index client_requests_pending_idx on public.client_requests (created_at desc)
  where status in ('pendiente', 'en_revision');

create or replace function public.client_request_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p text;
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.created_by := auth.uid();
      -- Las fotos deben estar en la carpeta del propio usuario
      foreach p in array new.photo_paths loop
        if split_part(p, '/', 1) <> auth.uid()::text then
          raise exception 'Foto fuera de la carpeta del usuario: %', p;
        end if;
      end loop;
    end if;
    new.status := 'pendiente';
    new.response := null;
    new.order_id := null;
    new.reviewed_by := null;
    new.reviewed_at := null;
  elsif new.status is distinct from old.status then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

create trigger client_requests_guard
  before insert or update on public.client_requests
  for each row execute function public.client_request_guard();

alter table public.client_requests enable row level security;

create policy "client_requests_select"
  on public.client_requests for select to authenticated
  using (public.is_manager() or client_id = public.my_client_id());

create policy "client_requests_insert_client"
  on public.client_requests for insert to authenticated
  with check (public.is_client() and client_id = public.my_client_id());

create policy "client_requests_update_manager"
  on public.client_requests for update to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "client_requests_delete_admin"
  on public.client_requests for delete to authenticated
  using (public.current_role() = 'admin');

alter publication supabase_realtime add table public.client_requests;

-- 5. Fotos de solicitudes: bucket privado, carpeta por usuario
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('request-photos', 'request-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do nothing;

create policy "request_photos_insert_client"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'request-photos'
    and public.is_client()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "request_photos_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'request-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_manager())
  );

-- 6. Permisos de funciones (ver 006)
revoke execute on function public.client_request_guard() from public, anon, authenticated;
revoke execute on function public.is_client() from public, anon;
revoke execute on function public.my_client_id() from public, anon;
revoke execute on function public.claim_client_account(boolean) from public, anon;
revoke execute on function public.client_orders() from public, anon;
grant execute on function public.is_client() to authenticated;
grant execute on function public.my_client_id() to authenticated;
grant execute on function public.claim_client_account(boolean) to authenticated;
grant execute on function public.client_orders() to authenticated;
