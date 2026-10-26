import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { UserRole } from '../../types/database'

export function RoleGate({ roles }: { roles: UserRole[] }) {
  const { profile } = useAuth()
  if (!profile || !roles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
