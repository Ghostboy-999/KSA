import { Navigate, Outlet } from 'react-router-dom'
import { FullScreenLoader } from '../components/ui/Loading'
import { useAuth } from '../contexts/AuthContext'
import { useMinDuration, useSinceAppStart } from '../hooks/useMinDuration'
import { ClientPortalPage } from '../pages/ClientPortalPage'
import type { UserRole } from '../types/database'

interface Props {
  roles?: UserRole[]
}

export function ProtectedRoute({ roles }: Props) {
  const { session, profile, profileError, loading, signingOut, refreshProfile, signOut } = useAuth()
  // Bienvenida mínima al abrir la app: lo justo para ver la animación, sin hacer esperar
  const splash = useSinceAppStart(1400)
  // Al entrar, la carga del perfil se ve al menos un momento (sin parpadeo)
  const waitingProfile = useMinDuration(!!session && (!profile || profile.id !== session.user.id) && !profileError, 900)

  if (signingOut) {
    return <FullScreenLoader key="salir" steps={['Cerrando sesión', 'Hasta pronto']} />
  }

  if (loading || (splash && session)) {
    return <FullScreenLoader />
  }

  if (!session) return <Navigate to="/login" replace />

  // Recién iniciada la sesión el perfil tarda un momento en llegar:
  // mientras tanto no es "cuenta inactiva", es "cargando".
  if (waitingProfile || !profile || profile.id !== session.user.id) {
    if (profileError) {
      return (
        <div className="mx-auto max-w-md space-y-3 p-6 text-center">
          <h1 className="text-xl font-bold">No se pudo cargar tu perfil</h1>
          <p>Revisa tu conexión e inténtalo de nuevo.</p>
          <div className="flex justify-center gap-2">
            <button type="button" className="btn-touch btn-primary" onClick={() => void refreshProfile()}>
              Reintentar
            </button>
            <button type="button" className="btn-touch btn-ghost" onClick={() => void signOut()}>
              Salir
            </button>
          </div>
        </div>
      )
    }
    return <FullScreenLoader />
  }

  if (!profile.active) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <h1 className="mb-2 text-xl font-bold">Cuenta inactiva</h1>
        <p>Contacte al administrador.</p>
      </div>
    )
  }

  // Los clientes solo tienen su portal, en cualquier ruta
  if (profile.role === 'cliente') return <ClientPortalPage />

  if (roles && !roles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
