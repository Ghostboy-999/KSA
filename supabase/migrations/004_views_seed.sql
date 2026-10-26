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
