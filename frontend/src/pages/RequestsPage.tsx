import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RequestPhotos } from '../components/requests/RequestPhotos'
import { updateRequestStatus, useClientRequests } from '../hooks/useClientRequests'
import { REQUEST_STATUS_LABELS, type ClientRequest, type RequestStatus } from '../types/database'

const statusColor: Record<RequestStatus, string> = {
  pendiente: 'bg-danger',
  en_revision: 'bg-warn',
  aceptada: 'bg-ksa-green',
  rechazada: 'bg-steel-700',
}

function RequestCard({ req }: { req: ClientRequest }) {
  const navigate = useNavigate()
  const [response, setResponse] = useState(req.response ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const open = req.status === 'pendiente' || req.status === 'en_revision'

  async function setStatus(status: RequestStatus) {
    setBusy(true)
    setErr(null)
    const e = await updateRequestStatus(req.id, status, { response: response.trim() || null })
    setBusy(false)
    if (e) setErr(e)
  }

  return (
    <li className="space-y-2 rounded-xl bg-white p-4 shadow">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold">{req.clients?.name ?? 'Cliente'}</p>
          <p className="text-xs text-steel-600">
            {[req.clients?.phone, req.clients?.email].filter(Boolean).join(' · ')}
          </p>
        </div>
        <span className={`rounded px-2 py-0.5 text-xs font-bold uppercase text-white ${statusColor[req.status]}`}>
          {REQUEST_STATUS_LABELS[req.status]}
        </span>
      </div>
      <p className="whitespace-pre-line">{req.description}</p>
      {req.measures && <p className="text-sm text-steel-700">Medidas: {req.measures}</p>}
      <p className="text-xs text-steel-600">
        Cantidad {req.quantity}
        {req.desired_date && ` · Para ${req.desired_date}`} · Recibida{' '}
        {new Date(req.created_at).toLocaleString('es-CO')}
      </p>
      <RequestPhotos paths={req.photo_paths} />

      {req.order_id && req.orders?.code && (
        <p className="text-sm">
          Orden:{' '}
          <Link to={`/orden/${req.order_id}`} className="font-mono font-bold underline">
            {req.orders.code}
          </Link>
        </p>
      )}

      {open ? (
        <div className="space-y-2 border-t border-steel-200 pt-2">
          <input
            className="btn-touch w-full border-2 border-steel-400 bg-white"
            placeholder="Respuesta para el cliente (opcional)"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-touch btn-primary flex-1"
              disabled={busy}
              onClick={() => navigate(`/nueva-orden?solicitud=${req.id}`)}
            >
              Crear orden
            </button>
            {req.status === 'pendiente' && (
              <button type="button" className="btn-touch btn-ghost flex-1" disabled={busy} onClick={() => void setStatus('en_revision')}>
                En revisión
              </button>
            )}
            <button type="button" className="btn-touch btn-danger flex-1" disabled={busy} onClick={() => void setStatus('rechazada')}>
              Rechazar
            </button>
          </div>
        </div>
      ) : (
        req.response && (
          <p className="text-sm text-steel-700">
            <strong>Respuesta:</strong> {req.response}
          </p>
        )
      )}
      {err && <p className="text-sm text-danger">{err}</p>}
    </li>
  )
}

export function RequestsPage() {
  const [showAll, setShowAll] = useState(false)
  const { requests, loading, error } = useClientRequests({ onlyOpen: !showAll })
  const openCount = requests.filter((r) => r.status === 'pendiente' || r.status === 'en_revision').length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Solicitudes de clientes</h2>
          <p className="text-steel-600">
            <strong className="text-steel-900">{openCount}</strong> por atender
          </p>
        </div>
        <button
          type="button"
          className={`btn-touch ${showAll ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? 'Solo abiertas' : 'Ver todas'}
        </button>
      </div>
      {loading && <p>Cargando…</p>}
      {error && <p className="text-danger">{error}</p>}
      {!loading && requests.length === 0 && (
        <p className="rounded-xl bg-white px-4 py-3 text-steel-600 shadow">No hay solicitudes.</p>
      )}
      <ul className="space-y-3">
        {requests.map((r) => (
          <RequestCard key={r.id} req={r} />
        ))}
      </ul>
    </div>
  )
}
