-- KSA Taller — Esquema Fase 1
-- Ejecutar en Supabase SQL Editor (en orden: 001 → 002 → 003 → 004)

-- Roles de usuario
create type public.user_role as enum ('admin', 'gerente', 'trabajador', 'cliente');

-- Etapas de una orden de trabajo
create type public.order_stage as enum (
  'cotizada',
  'aprobada',
  'materiales',
  'en_taller',
  'pruebas',
  'lista',
  'entregada'
);

create type public.order_priority as enum ('baja', 'media', 'alta', 'urgente');

-- Perfiles (1:1 con auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'trabajador',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Clientes del taller
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

-- Proveedores de aceros / insumos
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

-- Inventario de materiales (aceros y otros)
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade text, -- 4140, 4340, 1045, etc.
  unit text not null default 'kg',
  stock_qty numeric(12, 2) not null default 0 check (stock_qty >= 0),
  min_stock numeric(12, 2) not null default 0 check (min_stock >= 0),
  supplier_id uuid references public.suppliers (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Órdenes de trabajo
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  client_id uuid not null references public.clients (id),
  description text not null,
  stage public.order_stage not null default 'cotizada',
  priority public.order_priority not null default 'media',
  due_date date,
  assignee_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  photo_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_stage_idx on public.orders (stage);
create index orders_assignee_idx on public.orders (assignee_id);
create index orders_due_date_idx on public.orders (due_date);

-- Historial de cambios de etapa
create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  from_stage public.order_stage,
  to_stage public.order_stage not null,
  user_id uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index order_events_order_idx on public.order_events (order_id, created_at desc);

-- Materiales requeridos por orden
create table public.order_materials (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  material_id uuid not null references public.materials (id),
  qty_required numeric(12, 2) not null check (qty_required > 0),
  qty_consumed numeric(12, 2) not null default 0 check (qty_consumed >= 0),
  unique (order_id, material_id)
);

-- Movimientos de stock (entrada/salida)
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id),
  order_id uuid references public.orders (id) on delete set null,
  qty_change numeric(12, 2) not null, -- negativo = salida
  reason text not null,
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index stock_movements_material_idx on public.stock_movements (material_id, created_at desc);

-- Storage bucket para fotos opcionales de piezas
insert into storage.buckets (id, name, public)
values ('order-photos', 'order-photos', true)
on conflict (id) do nothing;
