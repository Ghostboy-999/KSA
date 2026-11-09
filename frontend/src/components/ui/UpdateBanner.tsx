import { useEffect, useState } from 'react'
import { UPDATE_READY_EVENT, applyUpdate, isUpdateReady } from '../../lib/pwa'

/** Aviso flotante cuando hay una versión nueva lista y la persona está usando la app */
export function UpdateBanner() {
  const [ready, setReady] = useState(isUpdateReady)

  useEffect(() => {
    const on = () => setReady(true)
    window.addEventListener(UPDATE_READY_EVENT, on)
    return () => window.removeEventListener(UPDATE_READY_EVENT, on)
  }, [])

  if (!ready) return null
  return (
    <div className="anim-slide-down fixed inset-x-3 top-3 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-ksa-black px-4 py-3 text-steel-100 shadow-2xl ring-2 ring-ksa-yellow" role="status">
      <span className="font-semibold">Hay una versión nueva de la app.</span>
      <button type="button" className="btn-touch btn-primary shrink-0" onClick={applyUpdate}>
        Actualizar
      </button>
    </div>
  )
}
