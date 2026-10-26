import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
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

  if (loading) return <p>Cargando…</p>
  if (!order) return <p>Orden no encontrada.</p>

  return (
    <div className="space-y-5">
      <Link to="/" className="btn-touch btn-ghost inline-flex text-sm">
        ← Tablero
      </Link>

      <header className="rounded-xl border-2 border-steel-700 bg-white p-4">
        <p className="font-mono text-sm font-bold">{order.code}</p>
        <h2 className="text-2xl font-bold">{order.clients?.name}</h2>
        <p className="mt-1 text-steel-700">{order.description}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded bg-steel-200 px-2 py-1">
            {STAGE_LABELS[order.stage]}
          </span>
          <span className="rounded bg-steel-200 px-2 py-1">
            {PRIORITY_LABELS[order.priority]}
          </span>
          {order.due_date && (
            <span className="rounded bg-steel-200 px-2 py-1">
              Compromiso: {order.due_date}
            </span>
          )}
        </div>
      </header>

      {msg && (
        <p className="rounded-lg bg-white px-3 py-2 text-sm font-medium shadow">{msg}</p>
      )}

      {isManager && (
        <section className="rounded-xl bg-white p-4 shadow">
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

      <section className="rounded-xl bg-white p-4 shadow">
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
                <span className="font-mono font-semibold">
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

      <section className="rounded-xl bg-white p-4 shadow">
        <h3 className="mb-2 text-lg font-bold">Foto inicial (opcional)</h3>
        {order.photo_url && (
          <img
            src={order.photo_url}
            alt="Estado inicial"
            className="mb-3 max-h-48 rounded-lg object-cover"
          />
        )}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="block w-full text-sm"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void uploadPhoto(f)
          }}
        />
      </section>

      <section className="rounded-xl bg-white p-4 shadow">
        <h3 className="mb-3 text-lg font-bold">Historial</h3>
        <ul className="space-y-2 text-sm">
          {events.map((ev) => (
            <li key={ev.id} className="border-b border-steel-200 pb-2">
              <span className="font-semibold">
                {ev.from_stage ? STAGE_LABELS[ev.from_stage] : '—'} →{' '}
                {STAGE_LABELS[ev.to_stage]}
              </span>
              <span className="text-steel-600">
                {' '}
                · {ev.profiles?.full_name ?? 'sistema'} ·{' '}
                {new Date(ev.created_at).toLocaleString('es-CO')}
              </span>
              {ev.note && <p className="text-steel-700">{ev.note}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
