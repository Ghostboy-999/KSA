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
