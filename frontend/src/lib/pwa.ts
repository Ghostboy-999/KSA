/**
 * Actualización automática de la app instalada (PWA).
 *
 * El service worker se publica con skipWaiting + clientsClaim, así que en cuanto
 * hay una versión nueva toma el control; aquí recargamos la página para usarla.
 * Si la persona está a mitad de algo, avisamos en vez de recargar de golpe.
 */

export const UPDATE_READY_EVENT = 'ksa:update-ready'

const CHECK_EVERY_MS = 5 * 60 * 1000
// Durante los primeros segundos nadie está escribiendo aún: se recarga sin preguntar
const SILENT_WINDOW_MS = 15 * 1000

let updateReady = false

export function isUpdateReady() {
  return updateReady
}

export function applyUpdate() {
  window.location.reload()
}

export function setupAutoUpdate() {
  if (!('serviceWorker' in navigator)) return

  const hadController = !!navigator.serviceWorker.controller

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // La primera instalación también dispara este evento: ahí no hay nada que actualizar
    if (!hadController || updateReady) return
    updateReady = true
    if (performance.now() < SILENT_WINDOW_MS || document.visibilityState === 'hidden') {
      applyUpdate()
    } else {
      window.dispatchEvent(new Event(UPDATE_READY_EVENT))
    }
  })

  const check = () => {
    void navigator.serviceWorker.getRegistration().then((r) => r?.update())
  }

  window.setInterval(check, CHECK_EVERY_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check()
    // Si la versión nueva ya está lista y la pestaña quedó en segundo plano, se aplica sola
    else if (updateReady) applyUpdate()
  })
}
