import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createOrder } from '../hooks/useOrders'
import { supabase } from '../lib/supabase'
import type { Client, OrderPriority, Profile } from '../types/database'

export function NewOrderPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
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
    })
  }, [])

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
    navigate(`/orden/${data.id}`)
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4">
      <h2 className="text-2xl font-bold">Nueva orden de trabajo</h2>
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

      <label className="block">
        <span className="mb-1 block font-semibold">Cliente existente</span>
        <select
          className="w-full rounded-xl border-2 border-steel-400 px-4 py-3 text-lg"
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value)
            if (e.target.value) setNewClientName('')
          }}
        >
          <option value="">— Nuevo cliente abajo —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

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
        <label className="block">
          <span className="mb-1 block font-semibold">Prioridad</span>
          <select
            className="w-full rounded-xl border-2 border-steel-400 px-4 py-3 text-lg"
            value={priority}
            onChange={(e) => setPriority(e.target.value as OrderPriority)}
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        </label>

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

      <label className="block">
        <span className="mb-1 block font-semibold">Responsable (opcional)</span>
        <select
          className="w-full rounded-xl border-2 border-steel-400 px-4 py-3 text-lg"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
        >
          <option value="">Sin asignar</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.full_name}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-danger">{error}</p>}

      <button type="submit" className="btn-touch btn-primary w-full" disabled={saving}>
        {saving ? 'Guardando…' : 'Crear orden'}
      </button>
    </form>
  )
}
