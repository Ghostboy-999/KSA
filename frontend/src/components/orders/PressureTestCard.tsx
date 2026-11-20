import { useState, type FormEvent } from 'react'
import { formatDateTime } from '../../lib/format'
import { recordOrderTest } from '../../hooks/useOrderTests'
import { TEST_CHECKLIST, type OrderTest } from '../../types/database'
import { BusyLabel } from '../ui/Loading'

interface FormProps {
  orderId: string
  onRecorded: (passed: boolean) => void
}

/** Checklist → presión → resultado y reproceso, como en el mockup 08 */
export function PressureTestForm({ orderId, onRecorded }: FormProps) {
  const [checks, setChecks] = useState<boolean[]>(() => TEST_CHECKLIST.map(() => false))
  const [psi, setPsi] = useState('')
  const [passed, setPassed] = useState<boolean | null>(null)
  const [rework, setRework] = useState(false)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allChecked = checks.every(Boolean)
  const psiValue = Number(psi)
  const canSubmit = allChecked && psi !== '' && psiValue > 0 && passed !== null && !busy

  async function submit(ev: FormEvent) {
    ev.preventDefault()
    if (!canSubmit || passed === null) return
    setBusy(true)
    setError(null)
    const err = await recordOrderTest({
      order_id: orderId,
      checklist: TEST_CHECKLIST.map((item, i) => ({ item, ok: checks[i] })),
      pressure_psi: psiValue,
      passed,
      rework: passed ? rework : true,
      notes: notes.trim() || null,
    })
    setBusy(false)
    if (err) setError(err)
    else onRecorded(passed)
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset>
        <legend className="mb-2 font-display text-base font-bold tracking-wide text-steel-700">1 · Checklist antes de presurizar</legend>
        <ul className="space-y-1.5">
          {TEST_CHECKLIST.map((item, i) => (
            <li key={item}>
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg bg-steel-100 px-3 py-2">
                <input
                  type="checkbox"
                  className="h-6 w-6 shrink-0 accent-ksa-green"
                  checked={checks[i]}
                  onChange={(e) => setChecks((c) => c.map((v, j) => (j === i ? e.target.checked : v)))}
                />
                <span className={checks[i] ? 'text-steel-900' : 'text-steel-700'}>{item}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset disabled={!allChecked} className="transition-opacity disabled:opacity-50">
        <legend className="mb-2 font-display text-base font-bold tracking-wide text-steel-700">2 · Prueba de presión</legend>
        <label className="block">
          <span className="sr-only">Presión alcanzada en PSI</span>
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-ksa-black px-4 py-3">
            <input
              type="number"
              inputMode="decimal"
              min="1"
              step="0.1"
              placeholder="0"
              className="w-40 bg-transparent text-right font-display text-5xl font-bold text-ksa-yellow tabular-nums outline-none placeholder:text-steel-600"
              value={psi}
              onChange={(e) => setPsi(e.target.value)}
            />
            <span className="font-display text-4xl font-bold text-ksa-yellow">PSI</span>
          </div>
        </label>

        <p className="mt-4 mb-2 font-semibold">¿Mantuvo la presión sin fugas?</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={passed === true}
            className={`btn-touch border-2 ${passed === true ? 'border-ksa-green bg-ksa-green text-white' : 'border-steel-400 bg-white'}`}
            onClick={() => setPassed(true)}
          >
            Sí, aprobó
          </button>
          <button
            type="button"
            aria-pressed={passed === false}
            className={`btn-touch border-2 ${passed === false ? 'border-danger bg-danger text-white' : 'border-steel-400 bg-white'}`}
            onClick={() => setPassed(false)}
          >
            No aprobó
          </button>
        </div>
      </fieldset>

      {passed !== null && (
        <fieldset className="anim-fade-up">
          <legend className="mb-2 font-display text-base font-bold tracking-wide text-steel-700">3 · Reproceso</legend>
          {passed ? (
            <div className="segmented w-full" role="group" aria-label="Reproceso">
              <button type="button" className="flex-1" aria-pressed={!rework} onClick={() => setRework(false)}>
                Ninguno
              </button>
              <button type="button" className="flex-1" aria-pressed={rework} onClick={() => setRework(true)}>
                Hubo reproceso
              </button>
            </div>
          ) : (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-danger">
              La orden vuelve a taller para reproceso (o a materiales si falta algo).
            </p>
          )}
          <textarea
            className="mt-3 w-full rounded-lg border-2 border-steel-400 bg-white p-3"
            rows={2}
            placeholder={passed ? 'Observaciones (opcional)' : '¿Dónde fugó o qué falló?'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </fieldset>
      )}

      {error && <p className="text-danger">{error}</p>}

      <button type="submit" className={`btn-touch w-full ${passed === false ? 'btn-danger' : 'btn-primary'}`} disabled={!canSubmit}>
        <BusyLabel busy={busy} busyText="Registrando…">
          {passed === false ? 'Registrar y devolver a taller' : 'Firmar y pasar a Lista'}
        </BusyLabel>
      </button>
      {!allChecked && <p className="text-center text-sm text-steel-600">Marque todo el checklist para habilitar la prueba.</p>}
    </form>
  )
}

/** Historial de pruebas de la orden */
export function PressureTestHistory({ tests }: { tests: OrderTest[] }) {
  if (tests.length === 0) return <p className="text-steel-600">Todavía no hay pruebas registradas.</p>
  return (
    <ul className="space-y-2">
      {tests.map((t) => (
        <li key={t.id} className={`rounded-lg border-l-[6px] bg-steel-100 px-3 py-2 ${t.passed ? 'border-l-ksa-green' : 'border-l-danger'}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-display text-lg font-bold tabular-nums">
              {t.pressure_psi != null ? `${t.pressure_psi} PSI` : 'Sin presión'} · {t.passed ? 'Aprobó' : 'No aprobó'}
            </span>
            {t.rework && <span className="rounded bg-warn px-2 py-0.5 text-sm font-semibold text-white">Reproceso</span>}
          </div>
          <p className="text-sm text-steel-600">
            {t.tester?.full_name ?? 'Equipo'}, {formatDateTime(t.created_at)}
          </p>
          {t.notes && <p className="text-steel-700">{t.notes}</p>}
        </li>
      ))}
    </ul>
  )
}
