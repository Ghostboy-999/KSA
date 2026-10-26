import { Link } from 'react-router-dom'
import {
  PRIORITY_LABELS,
  STAGE_LABELS,
  nextStage,
  type Order,
} from '../../types/database'

const priorityColor: Record<Order['priority'], string> = {
  baja: 'bg-steel-400',
  media: 'bg-steel-700',
  alta: 'bg-warn',
  urgente: 'bg-danger',
}

interface Props {
  order: Order
  onAdvance?: (order: Order) => void
  busy?: boolean
}

export function OrderCard({ order, onAdvance, busy }: Props) {
  const next = nextStage(order.stage)

  return (
    <article className="rounded-xl border-2 border-steel-700 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-bold text-steel-800">{order.code}</p>
          <p className="text-base font-semibold leading-tight">{order.clients?.name}</p>
        </div>
        <span
          className={`rounded px-2 py-1 text-xs font-bold uppercase text-white ${priorityColor[order.priority]}`}
        >
          {PRIORITY_LABELS[order.priority]}
        </span>
      </div>

      <p className="mb-2 line-clamp-2 text-sm text-steel-700">{order.description}</p>

      <div className="mb-3 flex flex-wrap gap-2 text-xs text-steel-600">
        <span className="rounded bg-steel-200 px-2 py-1">{STAGE_LABELS[order.stage]}</span>
        {order.due_date && (
          <span className="rounded bg-steel-200 px-2 py-1">
            Compromiso: {order.due_date}
          </span>
        )}
        {order.profiles?.full_name && (
          <span className="rounded bg-steel-200 px-2 py-1">
            {order.profiles.full_name}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Link to={`/orden/${order.id}`} className="btn-touch btn-ghost flex-1 text-center text-sm">
          Ver
        </Link>
        {next && onAdvance && (
          <button
            type="button"
            className="btn-touch btn-primary flex-[1.4] text-sm"
            disabled={busy}
            onClick={() => onAdvance(order)}
          >
            → {STAGE_LABELS[next]}
          </button>
        )}
      </div>
    </article>
  )
}
