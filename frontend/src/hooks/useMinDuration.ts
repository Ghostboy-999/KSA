import { useEffect, useRef, useState } from 'react'

/**
 * Mantiene la carga visible al menos `ms` milisegundos desde que empezó,
 * para que las animaciones se alcancen a ver y no parpadeen.
 */
export function useMinDuration(active: boolean, ms: number) {
  const startedAt = useRef<number | null>(null)
  const [holding, setHolding] = useState(active)

  useEffect(() => {
    if (active) {
      startedAt.current ??= performance.now()
      return
    }
    if (startedAt.current === null) return
    const left = ms - (performance.now() - startedAt.current)
    const t = setTimeout(() => {
      startedAt.current = null
      setHolding(false)
    }, Math.max(0, left))
    return () => clearTimeout(t)
  }, [active, ms])

  // Si vuelve a cargar después de terminar, se vuelve a sostener
  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => setHolding(true), 0)
    return () => clearTimeout(t)
  }, [active])

  return active || holding
}

const APP_START = performance.now()

/** true hasta que pasan `ms` desde que abrió la app (pantalla de bienvenida). */
export function useSinceAppStart(ms: number) {
  const [waiting, setWaiting] = useState(() => performance.now() - APP_START < ms)
  useEffect(() => {
    if (!waiting) return
    const t = setTimeout(() => setWaiting(false), Math.max(0, ms - (performance.now() - APP_START)))
    return () => clearTimeout(t)
  }, [waiting, ms])
  return waiting
}
