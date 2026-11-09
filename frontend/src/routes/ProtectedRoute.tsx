import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ClientPortalPage } from '../pages/ClientPortalPage'
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

  // Los clientes solo tienen su portal, en cualquier ruta
  if (profile.role === 'cliente') return <ClientPortalPage />

  if (roles && !roles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
