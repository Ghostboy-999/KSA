import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Skeleton, SkeletonList } from '../components/ui/Loading'
import { useAuth } from '../contexts/AuthContext'
import { useMinDuration } from '../hooks/useMinDuration'
import { useOrders } from '../hooks/useOrders'
import { isOverdue } from '../lib/format'
import { staggerStyle } from '../lib/motion'
import { PRIORITY_LABELS, STAGE_LABELS, type Order } from '../types/database'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const priorityBadge: Record<Order['priority'], string> = {
  baja: 'bg-steel-200 text-steel-700',
  media: 'bg-steel-800 text-white',
  alta: 'bg-warn text-white',
  urgente: 'bg-danger text-white',
}

/** "2026-11-20" del día local, sin pasar por UTC */
function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function monthTitle(d: Date) {
  const s = d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }).replace(' de ', ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function shortMonth(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', { month: 'short' }).replace('.', '').toUpperCase()
}

export function CalendarPage() {
  const { profile } = useAuth()
  const isWorker = profile?.role === 'trabajador'
  const { orders, loading, error } = useOrders({
    assigneeId: isWorker ? profile?.id : undefined,
    activeOnly: true,
  })
  const showLoading = useMinDuration(loading, 600)

  const [today] = useState(() => dayKey(new Date()))
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selected, setSelected] = useState<string | null>(null)

  // Órdenes por día de entrega
  const byDay = useMemo(() => {
    const map = new Map<string, Order[]>()
    for (const o of orders) {
      if (!o.due_date) continue
      const k = o.due_date.slice(0, 10)
      map.set(k, [...(map.get(k) ?? []), o])
    }
    return map
  }, [orders])

  // Celdas del mes, empezando el lunes
  const cells = useMemo(() => {
    const first = new Date(month)
    const offset = (first.getDay() + 6) % 7
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
    ]
  }, [month])

  const list = useMemo(() => {
    const dated = orders.filter((o) => o.due_date).sort((a, b) => a.due_date!.localeCompare(b.due_date!))
    if (selected) return dated.filter((o) => o.due_date!.slice(0, 10) === selected)
    // Próximas: vencidas primero y luego desde hoy
    return dated.slice(0, 12)
  }, [orders, selected])

  const undated = orders.filter((o) => !o.due_date).length

  function shiftMonth(n: number) {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1))
    setSelected(null)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="page-title">Calendario</h2>
        <p className="mt-1 text-steel-600">Fechas compromiso de {isWorker ? 'tus órdenes' : 'las órdenes activas'}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <section className="panel p-4" aria-label="Mes">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-2xl font-bold">{monthTitle(month)}</h3>
            <div className="flex gap-2">
              <button type="button" className="calendar-nav" aria-label="Mes anterior" onClick={() => shiftMonth(-1)}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
              </button>
              <button type="button" className="calendar-nav" aria-label="Mes siguiente" onClick={() => shiftMonth(1)}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center" role="grid">
            {WEEKDAYS.map((w, i) => (
              <span key={i} className="pb-1 font-display text-sm font-bold text-steel-600">
                {w}
              </span>
            ))}
            {cells.map((d, i) => {
              if (!d) return <span key={`e${i}`} />
              const k = dayKey(d)
              const n = byDay.get(k)?.length ?? 0
              const late = n > 0 && k < today
              const isSel = selected === k
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={isSel}
                  aria-label={`${d.getDate()}${n ? `, ${n} ${n === 1 ? 'entrega' : 'entregas'}` : ''}`}
                  onClick={() => setSelected(isSel ? null : k)}
                  className={`relative mx-auto flex h-10 w-10 items-center justify-center rounded-full font-display text-lg font-semibold tabular-nums transition-colors ${
                    isSel
                      ? 'bg-ksa-yellow text-ksa-black'
                      : n
                        ? late
                          ? 'bg-danger text-white'
                          : 'bg-ksa-black text-white'
                        : k === today
                          ? 'ring-2 ring-ksa-yellow'
                          : 'text-steel-800 hover:bg-steel-100'
                  }`}
                >
                  {d.getDate()}
                  {n > 1 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ksa-yellow px-1 font-sans text-[0.65rem] font-bold text-ksa-black">
                      {n}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-steel-600">
            <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-ksa-black" /> Entrega</span>
            <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-danger" /> Vencida</span>
            <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full ring-2 ring-ksa-yellow" /> Hoy</span>
          </div>
        </section>

        <section aria-label="Entregas">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h3 className="text-xl font-bold">
              {selected
                ? `Entregas del ${new Date(`${selected}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}`
                : 'Entregas próximas'}
            </h3>
            {selected && (
              <button type="button" className="font-semibold text-steel-700 underline" onClick={() => setSelected(null)}>
                Ver todas
              </button>
            )}
          </div>

          {showLoading && (
            <>
              <Skeleton className="mb-3 h-5 w-40" />
              <SkeletonList count={3} lines={1} />
            </>
          )}
          {error && <p className="text-danger">{error}</p>}

          {!showLoading && !error && list.length === 0 && (
            <p className="panel p-4 text-steel-600">
              {selected ? 'Ninguna entrega ese día.' : 'No hay órdenes activas con fecha compromiso.'}
            </p>
          )}

          {!showLoading && list.length > 0 && (
            <ul className="space-y-2">
              {list.map((o, i) => {
                const late = isOverdue(o.due_date)
                return (
                  <li key={o.id} className="stagger" style={staggerStyle(i)}>
                    <Link to={`/orden/${o.id}`} className="card-lift panel flex items-center gap-3 p-3">
                      <span className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg font-display leading-none ${late ? 'bg-danger text-white' : 'bg-ksa-yellow text-ksa-black'}`}>
                        <span className="text-2xl font-bold tabular-nums">{o.due_date!.slice(8, 10)}</span>
                        <span className="text-xs font-bold">{shortMonth(o.due_date!.slice(0, 10))}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-sm font-bold tracking-wide text-steel-600">{o.code} · {STAGE_LABELS[o.stage]}</span>
                        <span className="block truncate font-display text-lg font-bold">{o.clients?.name}</span>
                        {late && <span className="block text-sm font-semibold text-danger">Vencida</span>}
                      </span>
                      <span className={`shrink-0 rounded px-2 py-0.5 font-display text-sm font-bold uppercase ${priorityBadge[o.priority]}`}>
                        {PRIORITY_LABELS[o.priority]}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}

          {!showLoading && undated > 0 && !selected && (
            <p className="mt-3 text-sm text-steel-600">
              {undated === 1 ? '1 orden activa no tiene' : `${undated} órdenes activas no tienen`} fecha compromiso.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
