-- KSA Taller — Inconvenientes reportados en una orden
-- El trabajador reporta (falta de material, daño de máquina…) y gerencia lo ve
-- al instante y lo marca como resuelto.

create type public.issue_type as enum (
  'falta_material',
  'dano_maquinaria',
  'problema_tecnico',
  'error_medidas',
  'retraso_externo',
  'otro'
);

create type public.issue_status as enum ('abierto', 'resuelto');

create table public.order_issues (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  type public.issue_type not null,
  description text not null check (length(trim(description)) > 0),
  status public.issue_status not null default 'abierto',
  reported_by uuid references public.profiles (id) on delete set null default auth.uid(),
  resolution text,
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index order_issues_order_idx on public.order_issues (order_id);
create index order_issues_open_idx on public.order_issues (created_at desc) where status = 'abierto';

-- Quién y cuándo resolvió lo pone la base, no el cliente.
-- Al crear: siempre abierto y a nombre de quien tiene la sesión.
create or replace function public.order_issue_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.reported_by := auth.uid();
    end if;
    new.status := 'abierto';
    new.resolution := null;
    new.resolved_by := null;
    new.resolved_at := null;
  elsif new.status is distinct from old.status then
    if new.status = 'resuelto' then
      new.resolved_by := auth.uid();
      new.resolved_at := now();
    else
      new.resolved_by := null;
      new.resolved_at := null;
    end if;
  end if;
  return new;
end;
$$;

create trigger order_issues_defaults
  before insert or update on public.order_issues
  for each row execute function public.order_issue_defaults();

revoke execute on function public.order_issue_defaults() from public, anon, authenticated;

-- ========== RLS ==========
alter table public.order_issues enable row level security;

-- Se ve el inconveniente si se ve la orden (la subconsulta aplica el RLS de orders).
create policy "order_issues_select"
  on public.order_issues for select to authenticated
  using (
    public.is_staff()
    and exists (select 1 from public.orders o where o.id = order_id)
  );

-- Cualquier miembro del equipo reporta sobre una orden que puede ver.
create policy "order_issues_insert"
  on public.order_issues for insert to authenticated
  with check (
    public.is_staff()
    and exists (select 1 from public.orders o where o.id = order_id)
  );

-- Solo gerencia resuelve o reabre.
create policy "order_issues_update_manager"
  on public.order_issues for update to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "order_issues_delete_admin"
  on public.order_issues for delete to authenticated
  using (public.current_role() = 'admin');

-- Aviso en tiempo real a gerencia
alter publication supabase_realtime add table public.order_issues;
