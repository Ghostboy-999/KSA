-- KSA Taller — Nunca quedarse sin administrador
-- El 9 nov la única cuenta admin se cambió a 'gerente' desde la pantalla Usuarios
-- y nadie pudo volver a gestionar roles desde la app.

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.active is distinct from old.active)
     and auth.uid() is not null then
    -- Solo un admin cambia roles o estado
    if coalesce(public.current_role()::text, '') <> 'admin' then
      raise exception 'Solo un administrador puede cambiar el rol o el estado de un usuario';
    end if;
    -- Nadie cambia su propio rol ni se desactiva a sí mismo
    if new.id = auth.uid() then
      raise exception 'No puedes cambiar tu propio rol ni desactivarte; pídeselo a otro administrador';
    end if;
  end if;

  -- Siempre debe quedar al menos un admin activo (también desde el SQL Editor)
  if old.role = 'admin' and old.active
     and (new.role is distinct from 'admin' or not new.active)
     and not exists (
       select 1 from public.profiles
       where id <> old.id and role = 'admin' and active
     ) then
    raise exception 'Debe quedar al menos un administrador activo';
  end if;

  return new;
end;
$$;

revoke execute on function public.protect_profile_privileges() from public, anon, authenticated;
