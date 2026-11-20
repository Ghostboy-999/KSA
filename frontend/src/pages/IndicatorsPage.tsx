import { useEffect, useMemo, useState } from 'react'
import { Skeleton } from '../components/ui/Loading'
import { useMinDuration } from '../hooks/useMinDuration'
import { supabase } from '../lib/supabase'
import { staggerStyle } from '../lib/motion'
import { STAGES, STAGE_LABELS, type OrderEvent, type OrderStage } from '../types/database'

type OrderRow = { id: string; stage: OrderStage; due_date: string | null }
type EventRow = Pick<OrderEvent, 'order_id' | 'to_stage' | 'created_at'>
type TestRow = { order_id: string; passed: boolean; rework: boolean }

interface Data {
  orders: OrderRow[]
  events: EventRow[]
  shortOrderIds: Set<string>
  tests: TestRow[]
}

const DAY = 86_400_000
/** Etapas en las que se mide cuánto se demora el taller */
const MEASURED: OrderStage[] = STAGES.filter((s) => s !== 'entregada')

function pct(n: number, d: number) {
  return d === 0 ? null : Math.round((n / d) * 100)
}

/** Fecha local (YYYY-MM-DD) de un timestamp */
function localDay(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function compute({ orders, events, shortOrderIds, tests }: Data) {
  const byOrder = new Map<string, EventRow[]>()
  for (const e of events) byOrder.set(e.order_id, [...(byOrder.get(e.order_id) ?? []), e])
  for (const list of byOrder.values()) list.sort((a, b) => a.created_at.localeCompare(b.created_at))

  // 1. Entregadas a tiempo: el día de entrega no pasa de la fecha compromiso
  const delivered = orders.filter((o) => o.stage === 'entregada' && o.due_date)
  let onTime = 0
  for (const o of delivered) {
    const ev = [...(byOrder.get(o.id) ?? [])].reverse().find((e) => e.to_stage === 'entregada')
    if (ev && localDay(ev.created_at) <= o.due_date!.slice(0, 10)) onTime++
  }

  // 2. Órdenes activas sin faltantes de material
  const active = orders.filter((o) => o.stage !== 'entregada')
  const complete = active.filter((o) => !shortOrderIds.has(o.id)).length

  // 3. Reprocesos por cada 100 órdenes probadas
  const tested = new Set(tests.map((t) => t.order_id))
  const reworks = tests.filter((t) => t.rework || !t.passed).length

  // 4. Días promedio en cada etapa (solo tramos terminados)
  const sums = new Map<OrderStage, { total: number; n: number }>()
  for (const list of byOrder.values()) {
    for (let i = 0; i < list.length - 1; i++) {
      const s = list[i].to_stage
      const ms = new Date(list[i + 1].created_at).getTime() - new Date(list[i].created_at).getTime()
      const cur = sums.get(s) ?? { total: 0, n: 0 }
      sums.set(s, { total: cur.total + ms, n: cur.n + 1 })
    }
  }
  const stageDays = MEASURED.map((s) => {
    const v = sums.get(s)
    return { stage: s, days: v ? v.total / v.n / DAY : null, n: v?.n ?? 0 }
  })
  const measured = stageDays.filter((s) => s.days != null)
  const bottleneck = measured.length >= 2 ? measured.reduce((a, b) => (b.days! > a.days! ? b : a)) : null

  return {
    onTimePct: pct(onTime, delivered.length),
    deliveredCount: delivered.length,
    completePct: pct(complete, active.length),
    completeCount: complete,
    activeCount: active.length,
    reworkPer100: tested.size ? Math.round((reworks / tested.size) * 100) : null,
    testedCount: tested.size,
    stageDays,
    bottleneck,
    totalOrders: orders.length,
  }
}

function fmtDays(d: number) {
  return d < 1 ? d.toLocaleString('es-CO', { maximumFractionDigits: 1 }) : d.toLocaleString('es-CO', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
}

/** Anillo de porcentaje en SVG */
function Donut({ value }: { value: number | null }) {
  const r = 52
  const c = 2 * Math.PI * r
  const v = value ?? 0
  return (
    <svg viewBox="0 0 128 128" className="h-40 w-40" role="img" aria-label={value == null ? 'Sin datos' : `${value} por ciento`}>
      <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-steel-200)" strokeWidth="16" />
      <circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke="var(--color-ksa-green)"
        strokeWidth="16"
        strokeLinecap="round"
        strokeDasharray={`${(c * v) / 100} ${c}`}
        transform="rotate(-90 64 64)"
        className="donut-arc"
      />
      <text x="64" y="64" textAnchor="middle" dominantBaseline="central" className="fill-ksa-black font-display text-[1.9rem] font-bold">
        {value == null ? '—' : `${value}%`}
      </text>
    </svg>
  )
}

function Stat({ value, label, hint }: { value: string; label: string; hint: string }) {
  return (
    <div className="panel p-4">
      <p className="font-display text-4xl font-bold tabular-nums">{value}</p>
      <p className="font-semibold">{label}</p>
      <p className="text-sm text-steel-600">{hint}</p>
    </div>
  )
}

export function IndicatorsPage() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const showLoading = useMinDuration(!data && !error, 600)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [o, e, s, t] = await Promise.all([
        supabase.from('orders').select('id, stage, due_date'),
        supabase.from('order_events').select('order_id, to_stage, created_at'),
        supabase.from('order_shortages').select('order_id'),
        supabase.from('order_tests').select('order_id, passed, rework'),
      ])
      if (cancelled) return
      const err = o.error ?? e.error ?? s.error ?? t.error
      if (err) {
        setError(err.message)
        return
      }
      setData({
        orders: (o.data ?? []) as OrderRow[],
        events: (e.data ?? []) as EventRow[],
        shortOrderIds: new Set(((s.data ?? []) as { order_id: string }[]).map((r) => r.order_id)),
        tests: (t.data ?? []) as TestRow[],
      })
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const k = useMemo(() => (data ? compute(data) : null), [data])
  const maxDays = k ? Math.max(0, ...k.stageDays.map((s) => s.days ?? 0)) : 0
  const fewData = k != null && k.deliveredCount < 5

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="page-title">Indicadores del taller</h2>
          <p className="mt-1 text-steel-600">Calculados con las órdenes, el historial de etapas y las pruebas</p>
        </div>
        {fewData && (
          <span className="rounded-md bg-ksa-yellow px-2.5 py-1 font-display text-sm font-bold uppercase text-ksa-black">
            Pocos datos aún
          </span>
        )}
      </div>

      {error && <p className="text-danger">{error}</p>}

      {showLoading && (
        <div className="grid gap-4 md:grid-cols-2" role="status" aria-label="Calculando indicadores">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      )}

      {!showLoading && k && (
        <>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <section className="stagger panel flex flex-col items-center p-5 text-center" style={staggerStyle(0)}>
              <Donut value={k.onTimePct} />
              <p className="mt-2 font-display text-xl font-bold">Órdenes entregadas a tiempo</p>
              <p className="text-sm text-steel-600">
                {k.deliveredCount === 0
                  ? 'Aún no hay órdenes entregadas con fecha compromiso.'
                  : `De ${k.deliveredCount} ${k.deliveredCount === 1 ? 'entregada' : 'entregadas'} con fecha compromiso`}
              </p>
            </section>

            <div className="grid grid-cols-2 content-start gap-4">
              <div className="stagger" style={staggerStyle(1)}>
                <Stat
                  value={k.completePct == null ? '—' : `${k.completePct}%`}
                  label="Materiales completos"
                  hint={k.activeCount ? `${k.completeCount} de ${k.activeCount} órdenes activas sin faltantes` : 'Sin órdenes activas'}
                />
              </div>
              <div className="stagger" style={staggerStyle(2)}>
                <Stat
                  value={k.reworkPer100 == null ? '—' : String(k.reworkPer100)}
                  label="Reprocesos por 100"
                  hint={k.testedCount ? `${k.testedCount} ${k.testedCount === 1 ? 'orden probada' : 'órdenes probadas'}` : 'Sin pruebas hidráulicas aún'}
                />
              </div>
              <div className="stagger col-span-2" style={staggerStyle(3)}>
                <Stat value={String(k.totalOrders)} label="Órdenes registradas" hint={`${k.activeCount} activas, ${k.totalOrders - k.activeCount} entregadas`} />
              </div>
            </div>
          </div>

          <section className="stagger panel p-5" style={staggerStyle(4)}>
            <h3 className="mb-4 text-xl font-bold">Días promedio por etapa</h3>
            <ul className="space-y-3">
              {k.stageDays.map((s) => {
                const isNeck = k.bottleneck?.stage === s.stage
                const w = s.days != null && maxDays > 0 ? Math.max(3, (s.days / maxDays) * 100) : 0
                return (
                  <li key={s.stage} className="grid grid-cols-[6.5rem_1fr_3.5rem] items-center gap-3">
                    <span className="font-semibold">{STAGE_LABELS[s.stage]}</span>
                    <span className="h-4 overflow-hidden rounded-full bg-steel-100">
                      {s.days != null && (
                        <span
                          className={`bar-grow block h-full rounded-full ${isNeck ? 'bg-warn' : 'bg-ksa-black'}`}
                          style={{ width: `${w}%` }}
                        />
                      )}
                    </span>
                    <span className="text-right font-display text-lg font-bold tabular-nums">
                      {s.days == null ? '—' : fmtDays(s.days)}
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="mt-4 text-sm">
              {k.bottleneck ? (
                <span className="font-semibold text-warn">
                  {STAGE_LABELS[k.bottleneck.stage]} es el cuello de botella ({fmtDays(k.bottleneck.days!)} días en promedio).
                </span>
              ) : (
                <span className="text-steel-600">Hace falta que más órdenes cambien de etapa para medir tiempos.</span>
              )}
            </p>
          </section>
        </>
      )}
    </div>
  )
}
