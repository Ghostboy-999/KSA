import { useState } from 'react'
import { IssueItem } from '../components/issues/IssueItem'
import { useIssues } from '../hooks/useIssues'

export function IssuesPage() {
  const [showResolved, setShowResolved] = useState(false)
  const { issues, loading, error, reload } = useIssues({ includeResolved: showResolved })
  const open = issues.filter((i) => i.status === 'abierto')
  const resolved = issues.filter((i) => i.status === 'resuelto')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Inconvenientes</h2>
          <p className="text-steel-600">
            <strong className="text-steel-900">{open.length}</strong>{' '}
            {open.length === 1 ? 'abierto' : 'abiertos'}
          </p>
        </div>
        <button
          type="button"
          className={`btn-touch ${showResolved ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setShowResolved((v) => !v)}
        >
          {showResolved ? 'Ocultar resueltos' : 'Ver resueltos'}
        </button>
      </div>

      {loading && <p>Cargando…</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && (
        <ul className="space-y-3">
          {open.map((i) => (
            <IssueItem key={i.id} issue={i} canResolve showOrder onChanged={() => void reload()} />
          ))}
          {open.length === 0 && (
            <li className="rounded-lg bg-white px-3 py-4 text-steel-600 shadow">
              No hay inconvenientes abiertos.
            </li>
          )}
        </ul>
      )}

      {showResolved && resolved.length > 0 && (
        <section>
          <h3 className="mb-2 text-lg font-bold">Resueltos recientes</h3>
          <ul className="space-y-3">
            {resolved.map((i) => (
              <IssueItem key={i.id} issue={i} canResolve showOrder onChanged={() => void reload()} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
