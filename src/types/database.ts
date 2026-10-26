export type UserRole = 'admin' | 'gerente' | 'trabajador' | 'cliente'

export type OrderStage =
  | 'cotizada'
  | 'aprobada'
  | 'materiales'
  | 'en_taller'
  | 'pruebas'
  | 'lista'
  | 'entregada'

export type OrderPriority = 'baja' | 'media' | 'alta' | 'urgente'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  active: boolean
  created_at: string
}

export interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  created_at: string
}

export interface Supplier {
  id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  created_at: string
}

export interface Material {
  id: string
  name: string
  grade: string | null
  unit: string
  stock_qty: number
  min_stock: number
  supplier_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  suppliers?: Pick<Supplier, 'name'> | null
}

export interface Order {
  id: string
  code: string
  client_id: string
  description: string
  stage: OrderStage
  priority: OrderPriority
  due_date: string | null
  assignee_id: string | null
  created_by: string | null
  photo_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
  clients?: Pick<Client, 'name' | 'phone'> | null
  profiles?: Pick<Profile, 'full_name'> | null
}

export interface OrderMaterial {
  id: string
  order_id: string
  material_id: string
  qty_required: number
  qty_consumed: number
  materials?: Pick<Material, 'name' | 'grade' | 'unit' | 'stock_qty'> | null
}

export interface OrderEvent {
  id: string
  order_id: string
  from_stage: OrderStage | null
  to_stage: OrderStage
  user_id: string | null
  note: string | null
  created_at: string
  profiles?: Pick<Profile, 'full_name'> | null
}

export interface OrderShortage {
  order_id: string
  order_code: string
  stage: OrderStage
  due_date: string | null
  material_id: string
  material_name: string
  grade: string | null
  unit: string
  qty_required: number
  qty_consumed: number
  stock_qty: number
  qty_shortage: number
  supplier_name: string | null
}

export const STAGES: OrderStage[] = [
  'cotizada',
  'aprobada',
  'materiales',
  'en_taller',
  'pruebas',
  'lista',
  'entregada',
]

export const STAGE_LABELS: Record<OrderStage, string> = {
  cotizada: 'Cotizada',
  aprobada: 'Aprobada',
  materiales: 'Materiales',
  en_taller: 'En taller',
  pruebas: 'Pruebas',
  lista: 'Lista',
  entregada: 'Entregada',
}

export const PRIORITY_LABELS: Record<OrderPriority, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  gerente: 'Gerencia',
  trabajador: 'Trabajador',
  cliente: 'Cliente',
}

export function nextStage(stage: OrderStage): OrderStage | null {
  const i = STAGES.indexOf(stage)
  if (i < 0 || i >= STAGES.length - 1) return null
  return STAGES[i + 1]
}
