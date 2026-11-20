-- KSA Taller — Prueba hidráulica por orden
-- En la etapa "pruebas" el equipo registra el checklist, la presión y si la pieza aprobó.
-- Si aprueba, la orden pasa a "lista"; si no, vuelve a "en_taller" (o a "materiales" si faltan).
-- Cada prueba queda en el historial y alimenta el indicador de reprocesos.

create table public.order_tests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  checklist jsonb not null default '[]'::jsonb check (jsonb_typeof(checklist) = 'array'),
  pressure_psi numeric(8, 1) check (pressure_psi is null or pressure_psi >= 0),
  passed boolean not null,
  rework boolean not null default false,
  notes text,
  tested_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index order_tests_order_idx on public.order_tests (order_id, created_at desc);

-- Quién firma lo pone la base; si no aprobó, cuenta como reproceso.
-- Después mueve la orden de etapa (el historial lo registra orders_log_stage).
create or replace function public.order_test_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.tested_by := auth.uid();
  end if;
  if not new.passed then
    new.rework := true;
  end if;
  new.created_at := now();
  return new;
end;
$$;

create or replace function public.apply_order_test()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.passed then
    update public.orders set stage = 'lista' where id = new.order_id and stage = 'pruebas';
  else
    begin
      update public.orders set stage = 'en_taller' where id = new.order_id and stage = 'pruebas';
    exception when others then
      -- prevent_en_taller_without_stock: faltan materiales para el reproceso
      update public.orders set stage = 'materiales' where id = new.order_id and stage = 'pruebas';
    end;
  end if;
  return new;
end;
$$;

create trigger order_tests_defaults
  before insert on public.order_tests
  for each row execute function public.order_test_defaults();

create trigger order_tests_apply
  after insert on public.order_tests
  for each row execute function public.apply_order_test();

revoke execute on function public.order_test_defaults() from public, anon, authenticated;
revoke execute on function public.apply_order_test() from public, anon, authenticated;

-- ========== RLS ==========
alter table public.order_tests enable row level security;

-- Se ve la prueba si se ve la orden (la subconsulta aplica el RLS de orders).
create policy "order_tests_select"
  on public.order_tests for select to authenticated
  using (
    public.is_staff()
    and exists (select 1 from public.orders o where o.id = order_id)
  );

-- Registra quien puede mover la orden, y solo mientras está en pruebas.
create policy "order_tests_insert"
  on public.order_tests for insert to authenticated
  with check (
    public.is_staff()
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.stage = 'pruebas'
        and (public.is_manager() or o.assignee_id = auth.uid() or o.assignee_id is null)
    )
  );

-- Las pruebas no se editan; gerencia puede borrar un registro equivocado.
create policy "order_tests_delete_manager"
  on public.order_tests for delete to authenticated
  using (public.is_manager());
