import { STAGES, STAGE_LABELS, type Order, type OrderStage } from '../../types/database'
import { staggerStyle } from '../../lib/motion'
import { OrderCard } from './OrderCard'

interface Props {
  orders: Order[]
  onAdvance: (order: Order) => void
  busyId: string | null
  hideDelivered?: boolean
}

export function KanbanBoard({ orders, onAdvance, busyId, hideDelivered = true }: Props) {
  const stages = hideDelivered
    ? STAGES.filter((s) => s !== 'entregada')
    : STAGES

  const byStage = stages.reduce<Record<OrderStage, Order[]>>(
    (acc, stage) => {
      acc[stage] = orders.filter((o) => o.stage === stage)
      return acc
    },
    {} as Record<OrderStage, Order[]>,
  )

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {stages.map((stage, col) => (
        <section
          style={staggerStyle(col)}
          key={stage}
          className="stagger w-72 shrink-0 rounded-xl bg-steel-200/80 p-2 sm:w-80"
        >
          <header className="mb-2 flex items-center justify-between px-1">
            <h3 className="font-bold text-steel-900">{STAGE_LABELS[stage]}</h3>
            <span
              key={byStage[stage].length}
              className="anim-pop rounded-full bg-steel-800 px-2 py-0.5 text-xs font-bold text-white"
            >
              {byStage[stage].length}
            </span>
          </header>
          <div className="flex flex-col gap-2">
            {byStage[stage].map((order, i) => (
              <div key={order.id} className="stagger" style={staggerStyle(col + i)}>
                <OrderCard order={order} onAdvance={onAdvance} busy={busyId === order.id} />
              </div>
            ))}
            {byStage[stage].length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-steel-600">Vacío</p>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
