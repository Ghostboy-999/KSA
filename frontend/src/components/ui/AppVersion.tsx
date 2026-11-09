const built = new Date(__BUILD_TIME__)
const when = built.toLocaleString('es-CO', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

/** Versión publicada, para saber de un vistazo si la app está al día */
export function AppVersion({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs ${className}`}>
      Versión {__APP_VERSION__} ({__APP_COMMIT__}), publicada el {when}
    </p>
  )
}
