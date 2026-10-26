import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ROLE_LABELS } from '../../types/database'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'btn-touch flex-auto shrink-0 whitespace-nowrap text-center text-sm sm:text-base',
    isActive ? 'btn-primary' : 'btn-secondary',
  ].join(' ')

export function AppShell() {
  const { profile, signOut } = useAuth()
  const isManager = profile?.role === 'admin' || profile?.role === 'gerente'
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="flex min-h-full flex-col bg-steel-100">
      <header className="sticky top-0 z-20 bg-ksa-black text-steel-100">
        <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo-ksa.png"
              alt="KSA S.A.S Servicios Industriales"
              className="h-14 w-auto"
            />
            <div className="hidden sm:block">
              <p className="text-xs uppercase tracking-widest text-ksa-green">
                Servicios Industriales
              </p>
              <h1 className="text-xl font-bold text-ksa-yellow sm:text-2xl">KSA Taller</h1>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">{profile?.full_name}</p>
            <p className="text-ksa-yellow">
              {profile ? ROLE_LABELS[profile.role] : ''}
            </p>
          </div>
        </div>
        <div className="hazard-stripe" aria-hidden="true" />
      </header>

      <nav className="sticky top-[5rem] z-10 border-b border-steel-200 bg-steel-100/95 px-2 py-2 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto">
          <NavLink to="/" end className={linkClass}>
            Tablero
          </NavLink>
          {(isManager || profile?.role === 'trabajador') && (
            <NavLink to="/inventario" className={linkClass}>
              Inventario
            </NavLink>
          )}
          {isManager && (
            <NavLink to="/nueva-orden" className={linkClass}>
              Nueva OT
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/usuarios" className={linkClass}>
              Usuarios
            </NavLink>
          )}
          <button type="button" className="btn-touch btn-ghost shrink-0" onClick={() => void signOut()}>
            Salir
          </button>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-4">
        <Outlet />
      </main>
    </div>
  )
}
