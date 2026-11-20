-- KSA Taller — Cerrar rls_auto_enable() a la API
-- Supabase crea esta función de event trigger para activar RLS en cada tabla nueva de public.
-- No viene de nuestras migraciones y no se borra: solo se quita de /rest/v1/rpc.
-- Postgres no revisa EXECUTE al disparar un event trigger, así que sigue funcionando.

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
