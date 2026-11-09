import { useState } from 'react'
import { BusyLabel } from '../ui/Loading'
import { staggerStyle } from '../../lib/motion'
import { Link } from 'react-router-dom'
import { setIssueResolved } from '../../hooks/useIssues'
import { ISSUE_TYPE_LABELS, type OrderIssue } from '../../types/database'

interface Props {
  issue: OrderIssue
  canResolve: boolean
  showOrder?: boolean
  onChanged?: () => void
  index?: number
}

export function IssueItem({ issue, canResolve, showOrder, onChanged, index = 0 }: Props) {
  const [resolution, setResolution] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const open = issue.status === 'abierto'

  async function toggle(resolved: boolean) {
    setBusy(true)
    setErr(null)
    const e = await setIssueResolved(issue.id, resolved, resolution)
    setBusy(false)
    if (e) setErr(e)
    else {
      setResolution('')
      onChanged?.()
    }
  }

  return (
    <li
      style={staggerStyle(index)}
      className={`stagger rounded-lg border-l-4 px-3 py-2 transition-colors duration-500 ${open ? 'border-danger bg-red-50' : 'border-ksa-green bg-steel-100'}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">
          {showOrder && issue.orders && (
            <Link to={`/orden/${issue.order_id}`} className="mr-2 font-mono underline">
              {issue.orders.code}
            </Link>
          )}
          {ISSUE_TYPE_LABELS[issue.type]}
        </p>
        <span
          className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${open ? 'bg-danger text-white' : 'bg-ksa-green text-white'}`}
        >
          {open ? 'Abierto' : 'Resuelto'}
        </span>
      </div>
      <p className="mt-1 whitespace-pre-line text-steel-800">{issue.description}</p>
      <p className="mt-1 text-xs text-steel-600">
        {issue.reporter?.full_name ?? '—'} ·{' '}
        {new Date(issue.created_at).toLocaleString('es-CO')}
      </p>

      {!open && (
        <p className="mt-1 text-sm text-steel-700">
          <strong>Solución:</strong> {issue.resolution || 'sin nota'}
          <span className="text-xs text-steel-600">
            {' '}
            · {issue.resolver?.full_name ?? '—'}
            {issue.resolved_at && ` · ${new Date(issue.resolved_at).toLocaleString('es-CO')}`}
          </span>
        </p>
      )}

      {canResolve && open && (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            className="btn-touch flex-1 border-2 border-steel-400 bg-white"
            placeholder="¿Cómo se solucionó? (opcional)"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          />
          <button
            type="button"
            className="btn-touch btn-success"
            disabled={busy}
            onClick={() => void toggle(true)}
          >
            <BusyLabel busy={busy} busyText="Guardando…">Marcar resuelto</BusyLabel>
          </button>
        </div>
      )}
      {canResolve && !open && (
        <button
          type="button"
          className="btn-touch btn-ghost mt-2 text-sm"
          disabled={busy}
          onClick={() => void toggle(false)}
        >
          <BusyLabel busy={busy} busyText="Reabriendo…">Reabrir</BusyLabel>
        </button>
      )}
      {err && <p className="mt-1 text-sm text-danger">{err}</p>}
    </li>
  )
}
