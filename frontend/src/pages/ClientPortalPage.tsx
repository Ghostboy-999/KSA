import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { AppVersion } from '../components/ui/AppVersion'
import { useMinDuration } from '../hooks/useMinDuration'
import { PhotoPicker } from '../components/ui/PhotoPicker'
import { formatDate } from '../lib/format'
import { BusyLabel, SkeletonList } from '../components/ui/Loading'
import { staggerStyle } from '../lib/motion'
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
          <span key={s} className="h-2 flex-1 overflow-hidden rounded bg-steel-200">
            {n <= i && <span className="grow-x block h-full bg-ksa-green" style={staggerStyle(n)} />}
          </span>
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
    <form onSubmit={submit} className="anim-fade-up space-y-3 panel p-4">
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
      <div>
        <span className="mb-1 block text-sm font-semibold">Fotos (opcional, hasta 5)</span>
        <PhotoPicker
          label={photos.length ? 'Cambiar fotos' : 'Agregar fotos'}
          multiple
          hint={photos.length ? (photos.length === 1 ? '1 foto lista para enviar' : `${photos.length} fotos listas para enviar`) : undefined}
          onPick={(files) => setPhotos(files.slice(0, 5))}
        />
      </div>
      {err && <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-danger">{err}</p>}
      <button type="submit" className="btn-touch btn-primary w-full" disabled={busy}>
        <BusyLabel busy={busy} busyText={photos.length ? 'Subiendo fotos…' : 'Enviando…'}>Enviar solicitud</BusyLabel>
      </button>
    </form>
  )
}

export function ClientPortalPage() {
  const { profile, user, signOut } = useAuth()
  const [orders, setOrders] = useState<ClientOrder[]>([])
  const [linked, setLinked] = useState<boolean | null>(null)
  const [ordersErr, setOrdersErr] = useState<string | null>(null)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const { requests, loading: rawReqLoading } = useClientRequests()
  const reqLoading = useMinDuration(rawReqLoading, 600)

  const loadOrders = useCallback(async () => {
    const claim = await claimClientAccount(false)
    setLinked(!!claim.clientId)
    const res = await fetchClientOrders()
    setOrders(res.orders)
    setOrdersErr(res.error)
    setOrdersLoading(false)
  }, [])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  return (
    <div className="flex min-h-full flex-col bg-steel-100">
      <header className="bg-ksa-black text-steel-100">
        <div className="mx-auto flex h-[4.5rem] max-w-3xl items-center justify-between gap-3 px-4">
          <img src="/logo-ksa.png" alt="KSA S.A.S Servicios Industriales" className="anim-fade-in h-14 w-auto" />
          <div className="flex items-center gap-3 text-right text-sm">
            <div>
              <p className="font-semibold">{profile?.full_name}</p>
              <p className="text-ksa-yellow">Cliente</p>
            </div>
            <button type="button" className="rounded-lg border-2 border-steel-700 px-3 py-2 font-display font-semibold text-steel-200 transition-colors hover:border-ksa-yellow hover:text-ksa-yellow" onClick={() => void signOut()}>
              Salir
            </button>
          </div>
        </div>
        <div className="hazard-stripe" aria-hidden="true" />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-3 py-4 sm:px-4">
        {notice && (
          <p key={notice} className="anim-slide-down rounded-xl border-2 border-ksa-green bg-white px-4 py-3 font-medium" role="status">{notice}</p>
        )}

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h2 className="page-title">Mis solicitudes</h2>
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
          {reqLoading && <SkeletonList count={2} />}
          {!reqLoading && requests.length === 0 && !showForm && (
            <p className="panel px-4 py-3 text-steel-600">
              Aún no has enviado solicitudes.
            </p>
          )}
          <ul className="space-y-3">
            {requests.map((r, n) => (
              <li key={r.id} className="stagger card-lift panel p-4" style={staggerStyle(n)}>
                <div className="flex items-start justify-between gap-2">
                  <p className="whitespace-pre-line font-semibold">{r.description}</p>
                  <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold uppercase text-white ${statusColor[r.status]}`}>
                    {REQUEST_STATUS_LABELS[r.status]}
                  </span>
                </div>
                {r.measures && <p className="mt-1 text-sm text-steel-700">Medidas: {r.measures}</p>}
                <p className="mt-1 text-xs text-steel-600">
                  Cantidad: {r.quantity}. Enviada el {formatDate(r.created_at)}
                  {r.desired_date && `, para el ${formatDate(r.desired_date)}`}.
                </p>
                {r.response && (
                  <p className="mt-2 rounded-lg bg-steel-100 px-3 py-2 text-sm">
                    <strong>KSA:</strong> {r.response}
                  </p>
                )}
                {r.orders?.code && (
                  <p className="mt-1 text-sm">
                    Orden creada: <span className="font-display font-bold">{r.orders.code}</span>
                  </p>
                )}
                <RequestPhotos paths={r.photo_paths} />
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="page-title">Mis órdenes</h2>
          {ordersErr && <p className="text-danger">{ordersErr}</p>}
          {ordersLoading && <SkeletonList count={2} lines={1} />}
          {!ordersLoading && linked === false && orders.length === 0 && (
            <p className="panel px-4 py-3 text-steel-600">
              No encontramos órdenes con tu correo. Si ya trabajaste con KSA, pide que registren
              este correo en tu ficha de cliente.
            </p>
          )}
          {!ordersLoading && linked && orders.length === 0 && (
            <p className="panel px-4 py-3 text-steel-600">
              Todavía no tienes órdenes.
            </p>
          )}
          <ul className="space-y-3">
            {orders.map((o, n) => (
              <li key={o.id} className="stagger card-lift panel space-y-3 border-l-[6px] border-l-ksa-yellow p-4" style={staggerStyle(n)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display font-bold tracking-wide text-steel-600">{o.code}</p>
                    <p className="font-display text-xl font-bold leading-tight">{o.description}</p>
                  </div>
                  {o.due_date && (
                    <span className="shrink-0 rounded-md bg-steel-100 px-2 py-1 text-sm">
                      Entrega {formatDate(o.due_date)}
                    </span>
                  )}
                </div>
                <StageProgress order={o} />
              </li>
            ))}
          </ul>
        </section>
        <AppVersion className="pt-6 text-center text-steel-600" />
      </main>
    </div>
  )
}
