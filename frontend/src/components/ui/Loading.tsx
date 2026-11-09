import type { ReactNode } from 'react'
import { staggerStyle } from '../../lib/motion'

/** Pantalla completa de carga con la marca KSA */
export function FullScreenLoader({ label = 'Cargando…', dark = true }: { label?: string; dark?: boolean }) {
  return (
    <div
      className={`flex min-h-full flex-col items-center justify-center gap-6 px-6 ${dark ? 'bg-ksa-black text-steel-100' : 'bg-steel-100 text-steel-900'}`}
      role="status"
      aria-live="polite"
    >
      <img src="/logo-ksa.png" alt="" className="logo-breathe w-44 max-w-[60vw]" />
      <div className="hazard-loader w-56 max-w-[70vw]" aria-hidden="true" />
      <p className="anim-fade-in text-sm font-semibold uppercase tracking-widest">{label}</p>
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
    <div className="space-y-3 rounded-xl bg-white p-4 shadow">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-5 w-3/4" />
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
        <div key={c} className="stagger w-72 shrink-0 space-y-2 rounded-xl bg-steel-200/80 p-2 sm:w-80" style={staggerStyle(c)}>
          <div className="flex items-center justify-between px-1 py-1">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          {Array.from({ length: c % 2 ? 1 : 2 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ))}
    </div>
  )
}
