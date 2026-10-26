import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useInventory } from '../hooks/useInventory'

export function InventoryPage() {
  const { profile, user } = useAuth()
  const isManager = profile?.role === 'admin' || profile?.role === 'gerente'
  const { materials, shortages, loading, error, addStock } = useInventory()
  const [materialId, setMaterialId] = useState('')
  const [qty, setQty] = useState('10')
  const [reason, setReason] = useState('Compra / ingreso')
  const [msg, setMsg] = useState<string | null>(null)

  async function onAddStock(e: FormEvent) {
    e.preventDefault()
    if (!user || !materialId) return
    const err = await addStock(materialId, Number(qty), reason, user.id)
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
        <h2 className="text-2xl font-bold">Inventario de aceros</h2>
        <p className="text-steel-600">
          Stock, mínimos y alertas de faltantes antes de pasar a taller.
        </p>
      </div>

      {msg && (
        <p className="rounded-lg bg-white px-3 py-2 text-sm font-medium shadow">{msg}</p>
      )}
      {error && <p className="text-danger">{error}</p>}
      {loading && <p>Cargando…</p>}

      {shortages.length > 0 && (
        <section className="rounded-xl border-2 border-danger bg-red-50 p-4">
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
                <span className="font-mono font-semibold">
                  falta {s.qty_shortage} {s.unit}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {belowMin.length > 0 && (
        <section className="rounded-xl border-2 border-amber-dark bg-amber-50 p-4">
          <h3 className="mb-2 text-lg font-bold text-amber-dark">
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

      <section className="overflow-x-auto rounded-xl bg-white shadow">
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
            {materials.map((m) => {
              const low = Number(m.stock_qty) < Number(m.min_stock)
              return (
                <tr
                  key={m.id}
                  className={`border-b border-steel-200 ${low ? 'bg-amber-50' : ''}`}
                >
                  <td className="px-3 py-3 font-semibold">{m.name}</td>
                  <td className="px-3 py-3 font-mono">{m.grade}</td>
                  <td className="px-3 py-3 font-mono">
                    {m.stock_qty} {m.unit}
                  </td>
                  <td className="px-3 py-3 font-mono">
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

      {isManager && (
        <form
          onSubmit={onAddStock}
          className="space-y-3 rounded-xl bg-white p-4 shadow"
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
          <button type="submit" className="btn-touch btn-primary w-full">
            Registrar ingreso
          </button>
        </form>
      )}
    </div>
  )
}
