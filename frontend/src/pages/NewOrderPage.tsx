import { useEffect, useState, type FormEvent } from 'react'
import { BusyLabel } from '../components/ui/Loading'
import { Dot, Initial, PlusBadge, Select } from '../components/ui/Select'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { updateRequestStatus } from '../hooks/useClientRequests'
import { createOrder } from '../hooks/useOrders'
import { supabase } from '../lib/supabase'
import { PRIORITY_DOT, PRIORITY_LABELS, type Client, type ClientRequest, type OrderPriority, type Profile } from '../types/database'

export function NewOrderPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const requestId = useSearchParams()[0].get('solicitud')
  const [clients, setClients] = useState<Client[]>([])
  const [listsLoading, setListsLoading] = useState(true)
  const [workers, setWorkers] = useState<Profile[]>([])
  const [newClientName, setNewClientName] = useState('')
  const [clientId, setClientId] = useState('')
  const [code, setCode] = useState(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const n = String(Math.floor(Math.random() * 900) + 100)
    return `OT-${y}${m}-${n}`
  })
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<OrderPriority>('media')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void Promise.all([
      supabase.from('clients').select('*').order('name'),
      supabase
        .from('profiles')
        .select('*')
        .eq('role', 'trabajador')
        .eq('active', true),
    ]).then(([c, w]) => {
      setClients((c.data as Client[]) ?? [])
      setWorkers((w.data as Profile[]) ?? [])
      setListsLoading(false)
    })
  }, [])

  // Desde una solicitud de cliente: precargar cliente, descripción y fecha
  useEffect(() => {
    if (!requestId) return
    void supabase
      .from('client_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle()
      .then(({ data }) => {
        const r = data as ClientRequest | null
        if (!r) return
        setClientId(r.client_id)
        setDescription(
          [
            r.description,
            r.measures && `Medidas: ${r.measures}`,
            r.quantity > 1 && `Cantidad: ${r.quantity}`,
          ]
            .filter(Boolean)
            .join('\n'),
        )
        if (r.desired_date) setDueDate(r.desired_date)
      })
  }, [requestId])

  async function ensureClient(): Promise<string | null> {
    if (clientId) return clientId
    if (!newClientName.trim()) return null
    const { data, error: err } = await supabase
      .from('clients')
      .insert({ name: newClientName.trim() })
      .select('*')
      .single()
    if (err || !data) {
      setError(err?.message ?? 'No se pudo crear el cliente')
      return null
    }
    return (data as Client).id
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError(null)

    const cid = await ensureClient()
    if (!cid) {
      setError('Seleccione o cree un cliente')
      setSaving(false)
      return
    }

    const { data, error: err } = await createOrder({
      code: code.trim(),
      client_id: cid,
      description: description.trim(),
      priority,
      due_date: dueDate || null,
      assignee_id: assigneeId || null,
      created_by: user.id,
    })

    setSaving(false)
    if (err || !data) {
      setError(err ?? 'Error al crear')
      return
    }
    if (requestId) {
      const reqErr = await updateRequestStatus(requestId, 'aceptada', { order_id: data.id })
      if (reqErr) console.error('No se pudo marcar la solicitud como aceptada', reqErr)
    }
    navigate(`/orden/${data.id}`)
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4">
      <h2 className="page-title">Nueva orden de trabajo</h2>
      {requestId && (
        <p className="rounded-lg border-2 border-ksa-green bg-white px-3 py-2 text-sm">
          Desde una solicitud de cliente: al crear la orden, la solicitud queda aceptada y el
          cliente verá el código.
        </p>
      )}
      <p className="text-steel-600">
        Un solo formulario: cliente, descripción, fecha y prioridad.
      </p>

      <label className="block">
        <span className="mb-1 block font-semibold">Código OT</span>
        <input
          required
          className="w-full rounded-xl border-2 border-steel-400 px-4 py-3 text-lg"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </label>

      <Select
        label="Cliente"
        value={clientId}
        busy={listsLoading}
        busyText="Cargando clientes…"
        onChange={(v) => {
          setClientId(v)
          if (v) setNewClientName('')
        }}
        options={[
          { value: '', label: 'Cliente nuevo', hint: 'Escribe el nombre abajo', lead: <PlusBadge /> },
          ...clients.map((c) => ({ value: c.id, label: c.name, hint: c.phone ?? c.email ?? undefined, lead: <Initial name={c.name} /> })),
        ]}
      />

      {!clientId && (
        <label className="block">
          <span className="mb-1 block font-semibold">Nombre del cliente nuevo</span>
          <input
            className="w-full rounded-xl border-2 border-steel-400 px-4 py-3 text-lg"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            placeholder="Ej. Constructora XYZ"
          />
        </label>
      )}

      <label className="block">
        <span className="mb-1 block font-semibold">Descripción del trabajo</span>
        <textarea
          required
          rows={3}
          className="w-full rounded-xl border-2 border-steel-400 px-4 py-3 text-lg"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Reparación cilindro hidráulico excavadora…"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <Select<OrderPriority>
          label="Prioridad"
          value={priority}
          onChange={setPriority}
          options={(['baja', 'media', 'alta', 'urgente'] as OrderPriority[]).map((p) => ({
            value: p,
            label: PRIORITY_LABELS[p],
            lead: <Dot className={PRIORITY_DOT[p]} />,
          }))}
        />

        <label className="block">
          <span className="mb-1 block font-semibold">Fecha compromiso</span>
          <input
            type="date"
            className="w-full rounded-xl border-2 border-steel-400 px-4 py-3 text-lg"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </label>
      </div>

      <Select
        label="Responsable (opcional)"
        value={assigneeId}
        busy={listsLoading}
        busyText="Cargando trabajadores…"
        onChange={setAssigneeId}
        options={[
          { value: '', label: 'Sin asignar', hint: 'Cualquier trabajador la puede tomar' },
          ...workers.map((w) => ({ value: w.id, label: w.full_name, lead: <Initial name={w.full_name} /> })),
        ]}
      />

      {error && <p key={error} className="anim-slide-down text-danger" role="alert">{error}</p>}

      <button type="submit" className="btn-touch btn-primary w-full" disabled={saving}>
        <BusyLabel busy={saving} busyText="Guardando…">Crear orden</BusyLabel>
      </button>
    </form>
  )
}
