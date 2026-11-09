import type { ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useClientRequests } from '../../hooks/useClientRequests'
import { useIssues } from '../../hooks/useIssues'
import { ROLE_LABELS } from '../../types/database'
import { AppVersion } from '../ui/AppVersion'

/* Íconos de trazo, del mismo grosor que la tipografía */
const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
)
const ICONS = {
  board: icon(<><rect x="3" y="4" width="5" height="16" rx="1" /><rect x="10" y="4" width="5" height="10" rx="1" /><rect x="17" y="4" width="4" height="13" rx="1" /></>),
  stock: icon(<><path d="M3 8l9-5 9 5-9 5-9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>),
  add: icon(<><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M12 8v8M8 12h8" /></>),
  alert: icon(<><path d="M12 3l9.5 17h-19L12 3z" /><path d="M12 10v4M12 17.5v.5" /></>),
  inbox: icon(<><path d="M3 13l3-8h12l3 8v6H3v-6z" /><path d="M3 13h5l1.5 2h5L16 13h5" /></>),
  users: icon(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 010 7M18 14.8c1.8.8 3 2.6 3.5 5.2" /></>),
}

interface Item {
  to: string
  label: string
  short: string
  icon: ReactNode
  badge?: number
  badgeTone?: 'danger' | 'yellow'
  end?: boolean
}

function Badge({ n, tone }: { n: number; tone: 'danger' | 'yellow' }) {
  return (
    <span
      key={n}
      className={`anim-pop inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-sans text-xs font-bold ${tone === 'danger' ? 'bg-danger text-white' : 'bg-ksa-yellow text-ksa-black'}`}
    >
      {n}
    </span>
  )
}

export function AppShell() {
  const { profile, signOut } = useAuth()
  const isManager = profile?.role === 'admin' || profile?.role === 'gerente'
  const isAdmin = profile?.role === 'admin'
  const { issues: openIssues } = useIssues({ enabled: isManager })
  const { pathname } = useLocation()
  const onIssuesPage = pathname === '/inconvenientes'
  const { requests: openRequests } = useClientRequests({ onlyOpen: true, enabled: isManager })

  const items: Item[] = [
    { to: '/', label: 'Tablero', short: 'Tablero', icon: ICONS.board, end: true },
    { to: '/inventario', label: 'Inventario', short: 'Inventario', icon: ICONS.stock },
    ...(isManager
      ? [
          { to: '/nueva-orden', label: 'Nueva orden', short: 'Nueva', icon: ICONS.add },
          { to: '/inconvenientes', label: 'Inconvenientes', short: 'Avisos', icon: ICONS.alert, badge: openIssues.length, badgeTone: 'danger' as const },
          { to: '/solicitudes', label: 'Solicitudes', short: 'Pedidos', icon: ICONS.inbox, badge: openRequests.length, badgeTone: 'yellow' as const },
        ]
      : []),
    ...(isAdmin ? [{ to: '/usuarios', label: 'Usuarios', short: 'Usuarios', icon: ICONS.users }] : []),
  ]

  return (
    <div className="flex min-h-full flex-col bg-steel-100">
      <header className="sticky top-0 z-30 bg-ksa-black text-steel-100">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:h-[4.5rem]">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <img src="/logo-ksa.png" alt="KSA S.A.S Servicios Industriales" className="h-11 w-auto md:h-12" />
            <span className="hidden font-display text-2xl font-bold text-ksa-yellow lg:block">KSA Taller</span>
          </Link>

          <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Secciones">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                className={({ isActive }) =>
                  `group relative flex h-[4.5rem] items-center gap-2 px-3 font-display text-lg font-semibold transition-colors ${isActive ? 'text-ksa-yellow' : 'text-steel-300 hover:text-white'}`
                }
              >
                {({ isActive }) => (
                  <>
                    {it.label}
                    {!!it.badge && <Badge n={it.badge} tone={it.badgeTone ?? 'yellow'} />}
                    <span
                      className={`absolute inset-x-2 bottom-0 h-1 rounded-t bg-ksa-yellow transition-transform duration-200 ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50'}`}
                      aria-hidden="true"
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="font-semibold">{profile?.full_name}</p>
              <p className="text-sm text-ksa-yellow">{profile ? ROLE_LABELS[profile.role] : ''}</p>
            </div>
            <button
              type="button"
              className="rounded-lg border-2 border-steel-700 px-3 py-2 font-display font-semibold text-steel-200 transition-colors hover:border-ksa-yellow hover:text-ksa-yellow"
              onClick={() => void signOut()}
            >
              Salir
            </button>
          </div>
        </div>
        <div className="hazard-stripe" aria-hidden="true" />
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-3 pt-5 pb-28 sm:px-4 md:pb-10">
        {isManager && !onIssuesPage && openIssues.length > 0 && (
          <Link
            to="/inconvenientes"
            className="anim-alert mb-5 flex items-center justify-between gap-3 rounded-2xl border-2 border-danger bg-white px-4 py-3 font-semibold text-danger"
            role="alert"
          >
            <span className="flex items-center gap-2">
              {ICONS.alert}
              {openIssues.length === 1
                ? `Inconveniente abierto en ${openIssues[0].orders?.code ?? 'una orden'}`
                : `${openIssues.length} inconvenientes abiertos`}
            </span>
            <span className="shrink-0 underline">Revisar</span>
          </Link>
        )}
        <div key={pathname} className="anim-fade-up">
          <Outlet />
        </div>
        <AppVersion className="mt-10 text-center text-steel-600" />
      </main>

      {/* Navegación inferior en el celular: al alcance del pulgar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t-4 border-ksa-yellow bg-ksa-black pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Secciones"
      >
        <div className="flex">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                `relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 pt-2 pb-2 font-display text-[0.8rem] font-semibold transition-colors ${isActive ? 'text-ksa-yellow' : 'text-steel-400'}`
              }
            >
              {it.icon}
              {it.short}
              {!!it.badge && (
                <span className="absolute top-1 left-1/2 ml-2">
                  <Badge n={it.badge} tone={it.badgeTone ?? 'yellow'} />
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
