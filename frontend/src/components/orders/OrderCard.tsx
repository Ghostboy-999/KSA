import { Link } from 'react-router-dom'
import { formatDate, isOverdue } from '../../lib/format'
import { BusyLabel } from '../ui/Loading'
import {
  ADVANCE_LABELS,
  PRIORITY_LABELS,
  STAGE_LABELS,
  nextStage,
  openIssueCount,
  type Order,
} from '../../types/database'

/* La prioridad se lee de un vistazo en el borde de la tarjeta */
const priorityEdge: Record<Order['priority'], string> = {
  baja: 'border-l-steel-300',
  media: 'border-l-steel-700',
  alta: 'border-l-warn',
  urgente: 'border-l-danger',
}

const priorityText: Record<Order['priority'], string> = {
  baja: 'text-steel-600',
  media: 'text-steel-700',
  alta: 'text-warn',
  urgente: 'text-danger',
}

interface Props {
  order: Order
  onAdvance?: (order: Order) => void
  busy?: boolean
  showStage?: boolean
}

export function OrderCard({ order, onAdvance, busy, showStage = false }: Props) {
  const next = nextStage(order.stage)
  const issues = openIssueCount(order)
  const late = order.stage !== 'entregada' && isOverdue(order.due_date)

  return (
    <article className={`card-lift panel border-l-[6px] p-3 ${priorityEdge[order.priority]}`}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p className="font-display text-base font-bold tracking-wide text-steel-700">{order.code}</p>
        <span className={`font-display text-sm font-bold ${priorityText[order.priority]}`}>
          Prioridad {PRIORITY_LABELS[order.priority].toLowerCase()}
        </span>
      </div>
      <p className="font-display text-xl font-bold leading-tight">{order.clients?.name}</p>
      <p className="mt-1 mb-3 line-clamp-2 text-steel-700">{order.description}</p>

      <div className="mb-3 flex flex-wrap gap-1.5 text-sm">
        {issues > 0 && (
          <span className="rounded-md bg-danger px-2 py-0.5 font-semibold text-white">
            {issues === 1 ? '1 inconveniente' : `${issues} inconvenientes`}
          </span>
        )}
        {showStage && <span className="rounded-md bg-steel-100 px-2 py-0.5">{STAGE_LABELS[order.stage]}</span>}
        {order.due_date && (
          <span className={`rounded-md px-2 py-0.5 ${late ? 'bg-red-50 font-semibold text-danger' : 'bg-steel-100'}`}>
            {late ? 'Vencida el' : 'Entrega'} {formatDate(order.due_date)}
          </span>
        )}
        {order.profiles?.full_name && (
          <span className="rounded-md bg-steel-100 px-2 py-0.5">{order.profiles.full_name}</span>
        )}
      </div>

      <div className="flex gap-2">
        <Link to={`/orden/${order.id}`} className="btn-touch btn-ghost flex-1 text-center">
          Ver
        </Link>
        {next && onAdvance && (
          <button
            type="button"
            className="btn-touch btn-primary flex-[1.6]"
            disabled={busy}
            onClick={() => onAdvance(order)}
          >
            <BusyLabel busy={!!busy} busyText="Moviendo…">{ADVANCE_LABELS[next]}</BusyLabel>
          </button>
        )}
      </div>
    </article>
  )
}
