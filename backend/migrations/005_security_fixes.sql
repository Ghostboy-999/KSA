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
