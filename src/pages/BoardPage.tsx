import { useMemo, useState } from 'react'
import { KanbanBoard } from '../components/orders/KanbanBoard'
import { OrderCard } from '../components/orders/OrderCard'
import { useAuth } from '../contexts/AuthContext'
import { checkOrderCanEnterShop } from '../hooks/useInventory'
import { useOrders, workshopLoad } from '../hooks/useOrders'
import { STAGE_LABELS, nextStage, type Order } from '../types/database'

export function BoardPage() {
  const { profile } = useAuth()
  const isWorker = profile?.role === 'trabajador'
  const { orders, loading, error, updateStage } = useOrders({
    assigneeId: isWorker ? profile?.id : undefined,
    activeOnly: true,
  })
  const [view, setView] = useState<'kanban' | 'lista'>('kanban')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = useMemo(() => workshopLoad(orders), [orders])

  async function advance(order: Order) {
    const next = nextStage(order.stage)
    if (!next) return

    setBusyId(order.id)
    setToast(null)

    if (next === 'en_taller') {
      const check = await checkOrderCanEnterShop(order.id)
      if (!check.ok) {
        const names = check.shortages
          .map((s) => `${s.material_name} (−${s.qty_shortage} ${s.unit})`)
          .join(', ')
        setToast(
          names
            ? `Faltantes: ${names}. No se puede pasar a taller.`
            : check.error ?? 'Hay faltantes de material.',
        )
        setBusyId(null)
        return
      }
    }

    const err = await updateStage(order.id, next)
    if (err) setToast(err)
    else setToast(`${order.code} → ${STAGE_LABELS[next]}`)
    setBusyId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">
            {isWorker ? 'Mis órdenes del día' : 'Tablero de órdenes'}
          </h2>
          <p className="text-steel-600">
            Carga en taller:{' '}
            <strong className="text-steel-900">{load.total}</strong> activas
            {load.byStage.en_taller != null && (
              <> · {load.byStage.en_taller} en piso</>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className={`btn-touch ${view === 'kanban' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView('kanban')}
          >
            Kanban
          </button>
          <button
            type="button"
            className={`btn-touch ${view === 'lista' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView('lista')}
          >
            Lista
          </button>
        </div>
      </div>

      {toast && (
        <div className="rounded-xl border-2 border-steel-700 bg-white px-4 py-3 text-sm font-medium">
          {toast}
        </div>
      )}

      {loading && <p className="text-lg">Cargando órdenes…</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && view === 'kanban' && (
        <KanbanBoard orders={orders} onAdvance={advance} busyId={busyId} />
      )}

      {!loading && view === 'lista' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onAdvance={advance}
              busy={busyId === order.id}
            />
          ))}
          {orders.length === 0 && (
            <p className="text-steel-600">No hay órdenes activas.</p>
          )}
        </div>
      )}
    </div>
  )
}
