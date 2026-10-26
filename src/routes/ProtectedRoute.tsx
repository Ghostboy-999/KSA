import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { UserRole } from '../types/database'

interface Props {
  roles?: UserRole[]
}

export function ProtectedRoute({ roles }: Props) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center text-lg font-semibold">
        Cargando…
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (!profile?.active) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <h1 className="mb-2 text-xl font-bold">Cuenta inactiva</h1>
        <p>Contacte al administrador.</p>
      </div>
    )
  }

  if (roles && !roles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }

  if (profile.role === 'cliente') {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <h1 className="mb-2 text-xl font-bold">Vista cliente</h1>
        <p>Disponible en una fase posterior (seguimiento de estado).</p>
      </div>
    )
  }

  return <Outlet />
}
