import { useEffect, useState, type ReactNode } from 'react'
import { staggerStyle } from '../../lib/motion'

const DEFAULT_STEPS = ['Encendiendo el taller', 'Revisando las órdenes', 'Contando el inventario', 'Casi listo']

/** Pantalla completa de carga con la marca KSA */
export function FullScreenLoader({ steps = DEFAULT_STEPS }: { steps?: string[] }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 650)
    return () => clearInterval(t)
  }, [steps.length])

  return (
    <div
      className="flex min-h-full flex-col items-center justify-center gap-8 bg-ksa-black px-6 text-steel-100"
      role="status"
      aria-live="polite"
    >
      <div className="relative">
        <span className="loader-glow" aria-hidden="true" />
        <img src="/logo-ksa.png" alt="KSA S.A.S Servicios Industriales" className="loader-logo relative w-48 max-w-[60vw]" />
      </div>

      <div className="w-64 max-w-[75vw]">
        <div className="loader-track" aria-hidden="true">
          <div className="loader-fill">
            <div className="hazard-loader" />
            <span className="loader-sparks">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
        </div>
        <p key={step} className="loader-step mt-4 text-center font-display text-lg font-semibold tracking-wide text-ksa-yellow">
          {steps[step]}…
        </p>
      </div>
    </div>
  )
}

export function Spinner({ className = '' }: { className?: string }) {
  return <span className={`spinner ${className}`} aria-hidden="true" />
}

/** Contenido de botón con indicador mientras trabaja */
export function BusyLabel({ busy, busyText, children }: { busy: boolean; busyText: string; children: ReactNode }) {
  return busy ? (
    <span className="inline-flex items-center justify-center gap-2">
      <Spinner />
      {busyText}
    </span>
  ) : (
    <>{children}</>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

/** Tarjeta fantasma mientras llegan los datos */
export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="panel space-y-3 border-l-[6px] border-l-steel-300 p-4">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`h-3 ${i % 2 ? 'w-1/2' : 'w-5/6'}`} />
      ))}
    </div>
  )
}

export function SkeletonList({ count = 3, lines = 2, label = 'Cargando…' }: { count?: number; lines?: number; label?: string }) {
  return (
    <div className="space-y-3" role="status" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="stagger" style={staggerStyle(i)}>
          <SkeletonCard lines={lines} />
        </div>
      ))}
    </div>
  )
}

export function KanbanSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex gap-3 overflow-x-hidden pb-4" role="status" aria-label="Cargando órdenes">
      {Array.from({ length: columns }, (_, c) => (
        <div key={c} className="stagger w-72 shrink-0 space-y-2 rounded-2xl bg-steel-200/70 p-2 sm:w-80" style={staggerStyle(c)}>
          <div className="flex items-center justify-between px-2 py-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          {Array.from({ length: c % 2 ? 1 : 2 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ))}
    </div>
  )
}
