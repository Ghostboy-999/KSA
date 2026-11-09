import { useState, type FormEvent } from 'react'
import { useMinDuration } from '../hooks/useMinDuration'
import { BusyLabel, Skeleton } from '../components/ui/Loading'
import { staggerStyle } from '../lib/motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useInventory } from '../hooks/useInventory'

export function InventoryPage() {
  const { profile, user } = useAuth()
  const isManager = profile?.role === 'admin' || profile?.role === 'gerente'
  const { materials, shortages, loading: rawLoading, error, addStock } = useInventory()
  const loading = useMinDuration(rawLoading, 600)
  const [materialId, setMaterialId] = useState('')
  const [qty, setQty] = useState('10')
  const [reason, setReason] = useState('Compra / ingreso')
  const [msg, setMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function onAddStock(e: FormEvent) {
    e.preventDefault()
    if (!user || !materialId) return
    setSaving(true)
    const err = await addStock(materialId, Number(qty), reason, user.id)
    setSaving(false)
    setMsg(err ?? 'Stock actualizado')
    if (!err) {
      setQty('10')
      setMaterialId('')
    }
  }

  const belowMin = materials.filter((m) => Number(m.stock_qty) < Number(m.min_stock))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="page-title">Inventario de aceros</h2>
        <p className="text-steel-600">
          Stock, mínimos y alertas de faltantes antes de pasar a taller.
        </p>
      </div>

      {msg && (
        <p key={msg} className="anim-slide-down panel px-3 py-2 text-sm font-medium" role="status">{msg}</p>
      )}
      {error && <p className="text-danger">{error}</p>}
      {loading && (
        <div className="space-y-2 panel p-4" role="status" aria-label="Cargando inventario">
          <Skeleton className="h-8 w-full" />
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      )}

      {shortages.length > 0 && (
        <section className="anim-slide-down rounded-xl border-2 border-danger bg-red-50 p-4">
          <h3 className="mb-2 text-lg font-bold text-danger">
            Faltantes en órdenes activas
          </h3>
          <ul className="space-y-2 text-sm">
            {shortages.map((s) => (
              <li key={`${s.order_id}-${s.material_id}`} className="flex flex-wrap justify-between gap-2">
                <span>
                  <Link className="font-bold underline" to={`/orden/${s.order_id}`}>
                    {s.order_code}
                  </Link>{' '}
                  · {s.material_name}
                  {s.supplier_name ? ` (${s.supplier_name})` : ''}
                </span>
                <span className="font-display font-bold tabular-nums">
                  falta {s.qty_shortage} {s.unit}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {belowMin.length > 0 && (
        <section className="anim-slide-down rounded-xl border-2 border-warn bg-ksa-yellow-soft p-4">
          <h3 className="mb-2 text-lg font-bold text-warn">
            Bajo mínimo de reposición
          </h3>
          <ul className="space-y-1 text-sm">
            {belowMin.map((m) => (
              <li key={m.id}>
                {m.name} ({m.grade}): {m.stock_qty} / mín. {m.min_stock} {m.unit}
              </li>
            ))}
          </ul>
        </section>
      )}

      {!loading && (
      <section className="anim-fade-up panel overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-steel-800 text-white">
            <tr>
              <th className="px-3 py-3">Material</th>
              <th className="px-3 py-3">Grado</th>
              <th className="px-3 py-3">Stock</th>
              <th className="px-3 py-3">Mínimo</th>
              <th className="px-3 py-3">Proveedor</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m, i) => {
              const low = Number(m.stock_qty) < Number(m.min_stock)
              return (
                <tr
                  key={m.id}
                  style={staggerStyle(i)}
                  className={`stagger border-b border-steel-200 transition-colors hover:bg-steel-100 ${low ? 'bg-ksa-yellow-soft' : ''}`}
                >
                  <td className="px-3 py-3 font-semibold">{m.name}</td>
                  <td className="px-3 py-3 tabular-nums">{m.grade}</td>
                  <td className="px-3 py-3 tabular-nums">
                    {m.stock_qty} {m.unit}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {m.min_stock} {m.unit}
                  </td>
                  <td className="px-3 py-3">
                    {m.suppliers?.name ?? '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
      )}

      {isManager && (
        <form
          onSubmit={onAddStock}
          className="space-y-3 panel p-4"
        >
          <h3 className="text-lg font-bold">Ingresar stock</h3>
          <select
            required
            className="btn-touch w-full border-2 border-steel-400 bg-white text-left"
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
          >
            <option value="">Material…</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.grade})
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              className="btn-touch w-32 border-2 border-steel-400"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            <input
              className="btn-touch flex-1 border-2 border-steel-400"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo"
            />
          </div>
          <button type="submit" className="btn-touch btn-primary w-full" disabled={saving}>
            <BusyLabel busy={saving} busyText="Registrando…">Registrar ingreso</BusyLabel>
          </button>
        </form>
      )}
    </div>
  )
}
