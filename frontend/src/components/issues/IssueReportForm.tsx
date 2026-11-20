import { useState, type FormEvent } from 'react'
import { BusyLabel } from '../ui/Loading'
import { Select } from '../ui/Select'
import { reportIssue } from '../../hooks/useIssues'
import { ISSUE_TYPES, ISSUE_TYPE_LABELS, type IssueType } from '../../types/database'

interface Props {
  orderId: string
  onReported?: () => void
}

export function IssueReportForm({ orderId, onReported }: Props) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<IssueType>('falta_material')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function submit(ev: FormEvent) {
    ev.preventDefault()
    if (!description.trim()) return
    setBusy(true)
    const err = await reportIssue({ order_id: orderId, type, description })
    setBusy(false)
    if (err) {
      setMsg(err)
      return
    }
    setMsg('Inconveniente reportado. Gerencia ya lo puede ver.')
    setDescription('')
    setType('falta_material')
    setOpen(false)
    onReported?.()
  }

  if (!open) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          className="btn-touch btn-danger w-full"
          onClick={() => {
            setMsg(null)
            setOpen(true)
          }}
        >
          ⚠ Reportar inconveniente
        </button>
        {msg && <p className="anim-slide-down text-sm font-medium text-ksa-green" role="status">{msg}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="anim-fade-up space-y-2">
      <Select<IssueType>
        id="issue-type"
        label="¿Qué pasó?"
        value={type}
        onChange={setType}
        options={ISSUE_TYPES.map((t) => ({ value: t, label: ISSUE_TYPE_LABELS[t] }))}
      />
      <textarea
        required
        rows={3}
        className="w-full rounded-lg border-2 border-steel-400 bg-white p-3"
        placeholder="Describe el problema: qué falta, qué máquina, qué medida…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex gap-2">
        <button type="button" className="btn-touch btn-ghost flex-1" onClick={() => setOpen(false)}>
          Cancelar
        </button>
        <button type="submit" className="btn-touch btn-danger flex-[1.4]" disabled={busy}>
          <BusyLabel busy={busy} busyText="Enviando…">Enviar reporte</BusyLabel>
        </button>
      </div>
      {msg && <p className="text-sm text-danger">{msg}</p>}
    </form>
  )
}
