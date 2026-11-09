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

export type IssueType =
  | 'falta_material'
  | 'dano_maquinaria'
  | 'problema_tecnico'
  | 'error_medidas'
  | 'retraso_externo'
  | 'otro'

export type IssueStatus = 'abierto' | 'resuelto'

export type RequestStatus = 'pendiente' | 'en_revision' | 'aceptada' | 'rechazada'

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
  user_id?: string | null
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
  order_issues?: Pick<OrderIssue, 'status'>[]
}

/** Lo que un cliente ve de sus órdenes (función client_orders). */
export interface ClientOrder {
  id: string
  code: string
  description: string
  stage: OrderStage
  priority: OrderPriority
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface ClientRequest {
  id: string
  client_id: string
  created_by: string | null
  description: string
  measures: string | null
  quantity: number
  desired_date: string | null
  photo_paths: string[]
  status: RequestStatus
  response: string | null
  order_id: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  clients?: Pick<Client, 'name' | 'phone' | 'email'> | null
  orders?: Pick<Order, 'code'> | null
}

export interface OrderIssue {
  id: string
  order_id: string
  type: IssueType
  description: string
  status: IssueStatus
  reported_by: string | null
  resolution: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  reporter?: Pick<Profile, 'full_name'> | null
  resolver?: Pick<Profile, 'full_name'> | null
  orders?: Pick<Order, 'code' | 'description'> | null
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

export const ISSUE_TYPES: IssueType[] = [
  'falta_material',
  'dano_maquinaria',
  'problema_tecnico',
  'error_medidas',
  'retraso_externo',
  'otro',
]

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  falta_material: 'Falta de material',
  dano_maquinaria: 'Daño de maquinaria',
  problema_tecnico: 'Problema técnico',
  error_medidas: 'Error en medidas o especificaciones',
  retraso_externo: 'Retraso por causa externa',
  otro: 'Otro',
}

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
}

export function openIssueCount(order: Pick<Order, 'order_issues'>): number {
  return order.order_issues?.filter((i) => i.status === 'abierto').length ?? 0
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
