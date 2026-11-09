import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { KanbanSkeleton, Skeleton, SkeletonList } from '../components/ui/Loading'
import { useMinDuration } from '../hooks/useMinDuration'
import { staggerStyle } from '../lib/motion'
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
  const showLoading = useMinDuration(loading, 700)

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
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="page-title">{isWorker ? 'Mis órdenes del día' : 'Tablero de órdenes'}</h2>
          {showLoading ? (
            <Skeleton className="mt-2 h-5 w-48" />
          ) : (
            <p className="mt-1 text-steel-600">
              <strong key={load.total} className="anim-pop inline-block font-display text-xl text-steel-900">
                {load.total}
              </strong>{' '}
              {load.total === 1 ? 'orden activa' : 'órdenes activas'} en el taller
              {load.byStage.en_taller != null && (
                <>
                  , {load.byStage.en_taller} en piso
                </>
              )}
            </p>
          )}
        </div>

        <div className="segmented" role="group" aria-label="Vista">
          <button type="button" aria-pressed={view === 'kanban'} onClick={() => setView('kanban')}>
            Kanban
          </button>
          <button type="button" aria-pressed={view === 'lista'} onClick={() => setView('lista')}>
            Lista
          </button>
        </div>
      </div>

      {toast && (
        <div key={toast} className="anim-slide-down panel border-l-[6px] border-l-ksa-black px-4 py-3 font-medium" role="status">
          {toast}
        </div>
      )}

      {showLoading && (view === 'kanban' ? <KanbanSkeleton /> : <SkeletonList count={4} />)}
      {error && <p className="text-danger">{error}</p>}

      {!showLoading && !error && orders.length === 0 && (
        <div className="anim-fade-up panel flex flex-col items-start gap-4 border-l-[6px] border-l-ksa-yellow p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-bold">{isWorker ? 'No tienes órdenes asignadas' : 'Todavía no hay órdenes activas'}</h3>
            <p className="text-steel-600">
              {isWorker
                ? 'Cuando gerencia te asigne una orden aparecerá aquí.'
                : 'Crea la primera orden de trabajo y la verás avanzar por las etapas del taller.'}
            </p>
          </div>
          {!isWorker && (
            <Link to="/nueva-orden" className="btn-touch btn-primary shrink-0">
              Crear orden
            </Link>
          )}
        </div>
      )}

      {!showLoading && orders.length > 0 && view === 'kanban' && (
        <KanbanBoard orders={orders} onAdvance={advance} busyId={busyId} />
      )}

      {!showLoading && orders.length > 0 && view === 'lista' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {orders.map((order, i) => (
            <div key={order.id} className="stagger" style={staggerStyle(i)}>
              <OrderCard order={order} onAdvance={advance} busy={busyId === order.id} showStage />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
