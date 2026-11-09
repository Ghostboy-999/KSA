import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { RequestPhotos } from '../components/requests/RequestPhotos'
import { useAuth } from '../contexts/AuthContext'
import {
  claimClientAccount,
  fetchClientOrders,
  submitClientRequest,
  useClientRequests,
} from '../hooks/useClientRequests'
import {
  REQUEST_STATUS_LABELS,
  STAGES,
  STAGE_LABELS,
  type ClientOrder,
  type RequestStatus,
} from '../types/database'

const statusColor: Record<RequestStatus, string> = {
  pendiente: 'bg-steel-700',
  en_revision: 'bg-warn',
  aceptada: 'bg-ksa-green',
  rechazada: 'bg-danger',
}

function StageProgress({ order }: { order: ClientOrder }) {
  const i = STAGES.indexOf(order.stage)
  return (
    <div>
      <div className="flex gap-1" aria-hidden="true">
        {STAGES.map((s, n) => (
          <span key={s} className={`h-2 flex-1 rounded ${n <= i ? 'bg-ksa-green' : 'bg-steel-200'}`} />
        ))}
      </div>
      <p className="mt-1 text-sm font-semibold">
        {STAGE_LABELS[order.stage]}{' '}
        <span className="font-normal text-steel-600">
          (paso {i + 1} de {STAGES.length})
        </span>
      </p>
    </div>
  )
}

function NewRequestForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [description, setDescription] = useState('')
  const [measures, setMeasures] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [desiredDate, setDesiredDate] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    const error = await submitClientRequest({
      userId,
      description,
      measures,
      quantity: Math.max(1, Number(quantity) || 1),
      desiredDate,
      photos,
    })
    setBusy(false)
    if (error) setErr(error)
    else onDone()
  }

  const input = 'w-full rounded-xl border-2 border-steel-400 bg-white px-4 py-3'

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl bg-white p-4 shadow">
      <h3 className="text-lg font-bold">Nueva solicitud</h3>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">¿Qué necesitas?</span>
        <textarea required rows={4} className={input} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej. Reja metálica para ventana, pintura anticorrosiva…" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Medidas y especificaciones</span>
        <textarea rows={2} className={input} value={measures} onChange={(e) => setMeasures(e.target.value)} placeholder="Ej. 2 m de ancho x 1,2 m de alto, tubo de 1 pulgada" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Cantidad</span>
          <input type="number" min="1" step="1" required className={input} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">¿Para cuándo? (opcional)</span>
          <input type="date" className={input} value={desiredDate} onChange={(e) => setDesiredDate(e.target.value)} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Fotos (opcional, hasta 5)</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="block w-full text-sm"
          onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, 5))}
        />
        {photos.length > 0 && (
          <span className="mt-1 block text-xs text-steel-600">{photos.length} foto(s) seleccionada(s)</span>
        )}
      </label>
      {err && <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-danger">{err}</p>}
      <button type="submit" className="btn-touch btn-primary w-full" disabled={busy}>
        {busy ? 'Enviando…' : 'Enviar solicitud'}
      </button>
    </form>
  )
}

export function ClientPortalPage() {
  const { profile, user, signOut } = useAuth()
  const [orders, setOrders] = useState<ClientOrder[]>([])
  const [linked, setLinked] = useState<boolean | null>(null)
  const [ordersErr, setOrdersErr] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const { requests, loading: reqLoading } = useClientRequests()

  const loadOrders = useCallback(async () => {
    const claim = await claimClientAccount(false)
    setLinked(!!claim.clientId)
    const res = await fetchClientOrders()
    setOrders(res.orders)
    setOrdersErr(res.error)
  }, [])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  return (
    <div className="flex min-h-full flex-col bg-steel-100">
      <header className="bg-ksa-black text-steel-100">
        <div className="mx-auto flex h-[4.5rem] max-w-3xl items-center justify-between gap-3 px-4">
          <img src="/logo-ksa.png" alt="KSA S.A.S Servicios Industriales" className="h-14 w-auto" />
          <div className="flex items-center gap-3 text-right text-sm">
            <div>
              <p className="font-semibold">{profile?.full_name}</p>
              <p className="text-ksa-yellow">Cliente</p>
            </div>
            <button type="button" className="btn-touch border-2 border-steel-400 bg-transparent text-steel-100" onClick={() => void signOut()}>
              Salir
            </button>
          </div>
        </div>
        <div className="hazard-stripe" aria-hidden="true" />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-3 py-4 sm:px-4">
        {notice && (
          <p className="rounded-xl border-2 border-ksa-green bg-white px-4 py-3 font-medium">{notice}</p>
        )}

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-2xl font-bold">Mis solicitudes</h2>
            {!showForm && (
              <button type="button" className="btn-touch btn-primary" onClick={() => { setNotice(null); setShowForm(true) }}>
                + Nueva solicitud
              </button>
            )}
          </div>
          {showForm && user && (
            <NewRequestForm
              userId={user.id}
              onDone={() => {
                setShowForm(false)
                setNotice('Solicitud enviada. KSA la revisará y te contactará.')
                void loadOrders()
              }}
            />
          )}
          {reqLoading && <p>Cargando…</p>}
          {!reqLoading && requests.length === 0 && !showForm && (
            <p className="rounded-xl bg-white px-4 py-3 text-steel-600 shadow">
              Aún no has enviado solicitudes.
            </p>
          )}
          <ul className="space-y-3">
            {requests.map((r) => (
              <li key={r.id} className="rounded-xl bg-white p-4 shadow">
                <div className="flex items-start justify-between gap-2">
                  <p className="whitespace-pre-line font-semibold">{r.description}</p>
                  <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold uppercase text-white ${statusColor[r.status]}`}>
                    {REQUEST_STATUS_LABELS[r.status]}
                  </span>
                </div>
                {r.measures && <p className="mt-1 text-sm text-steel-700">Medidas: {r.measures}</p>}
                <p className="mt-1 text-xs text-steel-600">
                  Cantidad {r.quantity}
                  {r.desired_date && ` · Para ${r.desired_date}`} · Enviada{' '}
                  {new Date(r.created_at).toLocaleDateString('es-CO')}
                </p>
                {r.response && (
                  <p className="mt-2 rounded-lg bg-steel-100 px-3 py-2 text-sm">
                    <strong>KSA:</strong> {r.response}
                  </p>
                )}
                {r.orders?.code && (
                  <p className="mt-1 text-sm">
                    Orden creada: <span className="font-mono font-bold">{r.orders.code}</span>
                  </p>
                )}
                <RequestPhotos paths={r.photo_paths} />
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Mis órdenes</h2>
          {ordersErr && <p className="text-danger">{ordersErr}</p>}
          {linked === false && orders.length === 0 && (
            <p className="rounded-xl bg-white px-4 py-3 text-steel-600 shadow">
              No encontramos órdenes con tu correo. Si ya trabajaste con KSA, pide que registren
              este correo en tu ficha de cliente.
            </p>
          )}
          {linked && orders.length === 0 && (
            <p className="rounded-xl bg-white px-4 py-3 text-steel-600 shadow">
              Todavía no tienes órdenes.
            </p>
          )}
          <ul className="space-y-3">
            {orders.map((o) => (
              <li key={o.id} className="space-y-2 rounded-xl border-2 border-steel-700 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-bold">{o.code}</p>
                    <p className="font-semibold">{o.description}</p>
                  </div>
                  {o.due_date && (
                    <span className="shrink-0 rounded bg-steel-200 px-2 py-1 text-xs">
                      Entrega: {o.due_date}
                    </span>
                  )}
                </div>
                <StageProgress order={o} />
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
