import { useEffect, useState, type FormEvent } from 'react'
import { useMinDuration } from '../hooks/useMinDuration'
import { PhotoPicker } from '../components/ui/PhotoPicker'
import { formatDate, formatDateTime, isOverdue } from '../lib/format'
import { Skeleton, SkeletonList } from '../components/ui/Loading'
import { staggerStyle } from '../lib/motion'
import { Link, useParams } from 'react-router-dom'
import { IssueItem } from '../components/issues/IssueItem'
import { IssueReportForm } from '../components/issues/IssueReportForm'
import { useAuth } from '../contexts/AuthContext'
import { useIssues } from '../hooks/useIssues'
import { supabase } from '../lib/supabase'
import {
  PRIORITY_LABELS,
  STAGE_LABELS,
  type Material,
  type Order,
  type OrderEvent,
  type OrderMaterial,
  type Profile,
} from '../types/database'

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const isManager = profile?.role === 'admin' || profile?.role === 'gerente'

  const [order, setOrder] = useState<Order | null>(null)
  const [events, setEvents] = useState<OrderEvent[]>([])
  const [orderMats, setOrderMats] = useState<OrderMaterial[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [workers, setWorkers] = useState<Profile[]>([])
  const [matId, setMatId] = useState('')
  const [qty, setQty] = useState('1')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const showSkeleton = useMinDuration(loading, 600)
  const { issues, reload: reloadIssues } = useIssues({ orderId: id, enabled: !!id })
  const openIssues = issues.filter((i) => i.status === 'abierto').length

  async function load() {
    if (!id) return
    setLoading(true)

    const [o, e, om, m, w] = await Promise.all([
      supabase
        .from('orders')
        .select('*, clients ( name, phone ), profiles:assignee_id ( full_name )')
        .eq('id', id)
        .single(),
      supabase
        .from('order_events')
        .select('*, profiles:user_id ( full_name )')
        .eq('order_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('order_materials')
        .select('*, materials ( name, grade, unit, stock_qty )')
        .eq('order_id', id),
      supabase.from('materials').select('*').order('name'),
      supabase
        .from('profiles')
        .select('*')
        .eq('role', 'trabajador')
        .eq('active', true),
    ])

    setOrder((o.data as Order) ?? null)
    setEvents((e.data as OrderEvent[]) ?? [])
    setOrderMats((om.data as OrderMaterial[]) ?? [])
    setMaterials((m.data as Material[]) ?? [])
    setWorkers((w.data as Profile[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [id])

  async function addMaterial(ev: FormEvent) {
    ev.preventDefault()
    if (!id || !matId) return
    const { error } = await supabase.from('order_materials').insert({
      order_id: id,
      material_id: matId,
      qty_required: Number(qty),
    })
    setMsg(error?.message ?? 'Material agregado')
    setMatId('')
    setQty('1')
    await load()
  }

  async function assignWorker(assigneeId: string) {
    if (!id) return
    const { error } = await supabase
      .from('orders')
      .update({ assignee_id: assigneeId || null })
      .eq('id', id)
    setMsg(error?.message ?? 'Responsable actualizado')
    await load()
  }

  async function uploadPhoto(file: File) {
    if (!id || !order) return
    const path = `${id}/${Date.now()}-${file.name}`
    const { error: upErr } = await supabase.storage
      .from('order-photos')
      .upload(path, file)
    if (upErr) {
      setMsg(upErr.message)
      return
    }
    const { data } = supabase.storage.from('order-photos').getPublicUrl(path)
    await supabase.from('orders').update({ photo_url: data.publicUrl }).eq('id', id)
    setMsg('Foto guardada')
    await load()
  }

  // Solo la primera carga muestra esqueleto; las recargas no hacen parpadear la página
  if (showSkeleton && !order)
    return (
      <div className="space-y-5" role="status" aria-label="Cargando orden">
        <Skeleton className="h-12 w-32" />
        <div className="space-y-3 rounded-xl border-2 border-steel-200 bg-white p-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        </div>
        <SkeletonList count={3} />
      </div>
    )
  if (!order) return <p>Orden no encontrada.</p>

  return (
    <div className="space-y-5">
      <Link to="/" className="inline-flex items-center gap-1 font-display text-lg font-semibold text-steel-700 hover:text-ksa-black">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        Volver al tablero
      </Link>

      <header className="anim-fade-up panel border-l-[6px] border-l-ksa-yellow p-5">
        <p className="font-display text-lg font-bold tracking-wide text-steel-600">{order.code}</p>
        <h2 className="page-title">{order.clients?.name}</h2>
        <p className="mt-1 text-steel-700">{order.description}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded-md bg-ksa-black px-2.5 py-1 font-semibold text-ksa-yellow">
            {STAGE_LABELS[order.stage]}
          </span>
          <span className="rounded-md bg-steel-100 px-2.5 py-1">
            Prioridad {PRIORITY_LABELS[order.priority].toLowerCase()}
          </span>
          {order.due_date && (
            <span className={`rounded-md px-2.5 py-1 ${order.stage !== 'entregada' && isOverdue(order.due_date) ? 'bg-red-50 font-semibold text-danger' : 'bg-steel-100'}`}>
              Entrega {formatDate(order.due_date)}
            </span>
          )}
        </div>
      </header>

      {msg && (
        <p key={msg} className="anim-slide-down panel px-3 py-2 text-sm font-medium" role="status">{msg}</p>
      )}

      <section className="stagger panel p-4" style={staggerStyle(1)}>
        <h3 className="mb-3 text-lg font-bold">
          Inconvenientes
          {openIssues > 0 && (
            <span className="ml-2 rounded bg-danger px-2 py-0.5 text-sm text-white">
              {openIssues} abierto{openIssues === 1 ? '' : 's'}
            </span>
          )}
        </h3>
        {issues.length > 0 && (
          <ul className="mb-3 space-y-2">
            {issues.map((i) => (
              <IssueItem
                key={i.id}
                issue={i}
                canResolve={isManager}
                onChanged={() => void reloadIssues()}
              />
            ))}
          </ul>
        )}
        <IssueReportForm orderId={order.id} onReported={() => void reloadIssues()} />
      </section>

      {isManager && (
        <section className="stagger panel p-4" style={staggerStyle(2)}>
          <h3 className="mb-2 text-lg font-bold">Asignar responsable</h3>
          <select
            className="btn-touch w-full border-2 border-steel-400 bg-white text-left"
            value={order.assignee_id ?? ''}
            onChange={(e) => void assignWorker(e.target.value)}
          >
            <option value="">Sin asignar</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name}
              </option>
            ))}
          </select>
        </section>
      )}

      <section className="stagger panel p-4" style={staggerStyle(3)}>
        <h3 className="mb-3 text-lg font-bold">Materiales de la orden</h3>
        <ul className="mb-4 space-y-2">
          {orderMats.map((om) => {
            const need = om.qty_required - om.qty_consumed
            const short = (om.materials?.stock_qty ?? 0) < need
            return (
              <li
                key={om.id}
                className={`flex justify-between rounded-lg px-3 py-2 ${short ? 'bg-red-100' : 'bg-steel-100'}`}
              >
                <span>
                  {om.materials?.name} ({om.materials?.grade})
                </span>
                <span className="font-display font-bold tabular-nums">
                  {om.qty_required} {om.materials?.unit}
                  {short && ' · FALTA'}
                </span>
              </li>
            )
          })}
          {orderMats.length === 0 && (
            <li className="text-steel-600">Sin materiales cargados.</li>
          )}
        </ul>

        {isManager && (
          <form onSubmit={addMaterial} className="flex flex-col gap-2 sm:flex-row">
            <select
              required
              className="btn-touch flex-1 border-2 border-steel-400 bg-white text-left"
              value={matId}
              onChange={(e) => setMatId(e.target.value)}
            >
              <option value="">Material…</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — stock {m.stock_qty} {m.unit}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              className="btn-touch w-full border-2 border-steel-400 sm:w-28"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            <button type="submit" className="btn-touch btn-primary">
              Agregar
            </button>
          </form>
        )}
      </section>

      <section className="stagger panel p-4" style={staggerStyle(4)}>
        <h3 className="mb-2 text-lg font-bold">Foto inicial (opcional)</h3>
        {order.photo_url && (
          <img
            src={order.photo_url}
            alt="Estado inicial"
            className="mb-3 max-h-48 rounded-lg object-cover"
          />
        )}
        <PhotoPicker
          label={order.photo_url ? 'Cambiar foto' : 'Tomar o elegir foto'}
          capture
          onPick={(files) => void uploadPhoto(files[0])}
        />
      </section>

      <section className="stagger panel p-4" style={staggerStyle(5)}>
        <h3 className="mb-3 text-lg font-bold">Historial</h3>
        <ul className="space-y-2 text-sm">
          {events.map((ev) => (
            <li key={ev.id} className="border-b border-steel-200 pb-2">
              <span className="font-semibold">
                {ev.from_stage
                  ? `De ${STAGE_LABELS[ev.from_stage].toLowerCase()} a ${STAGE_LABELS[ev.to_stage].toLowerCase()}`
                  : `Creada como ${STAGE_LABELS[ev.to_stage].toLowerCase()}`}
              </span>
              <span className="block text-steel-600">
                {ev.profiles?.full_name ?? 'Automático'}, {formatDateTime(ev.created_at)}
              </span>
              {ev.note && <p className="text-steel-700">{ev.note}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
