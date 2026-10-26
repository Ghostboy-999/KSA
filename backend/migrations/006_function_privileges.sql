-- KSA Taller — Quitar funciones internas de la API (/rest/v1/rpc/...)
-- Supabase da EXECUTE a anon y authenticated en toda función nueva de public.

-- 1. Funciones de triggers: nadie las llama directamente.
--    Postgres no revisa EXECUTE al disparar un trigger, así que siguen funcionando.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_privileges() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.log_order_stage_change() from public, anon, authenticated;
revoke execute on function public.apply_stock_movement() from public, anon, authenticated;
revoke execute on function public.prevent_en_taller_without_stock() from public, anon, authenticated;

-- 2. Helpers de RLS: las políticas los ejecutan como el usuario con sesión,
--    así que authenticated los necesita; anon no.
revoke execute on function public.current_role() from public, anon;
revoke execute on function public.is_staff() from public, anon;
revoke execute on function public.is_manager() from public, anon;
grant execute on function public.current_role() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_manager() to authenticated;
