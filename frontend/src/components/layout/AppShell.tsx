import { Suspense } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ROLE_LABELS } from '../../types/database'
import { AppVersion } from '../ui/AppVersion'
import { SkeletonList } from '../ui/Loading'
import { ICONS, useNavItems, type NavItem } from './navItems'

export interface ShellContext {
  items: NavItem[]
}

export function Badge({ n, tone }: { n: number; tone: 'danger' | 'yellow' }) {
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
  const { items, isManager, openIssues } = useNavItems()
  const { pathname } = useLocation()
  const onIssuesPage = pathname === '/inconvenientes'

  // Celular: secciones principales y "Menú" con el resto (mockup 03)
  const secondary = items.filter((it) => !it.primary)
  const menuBadge = secondary.reduce((n, it) => n + (it.badge ?? 0), 0)
  const bottomItems: NavItem[] = [
    ...items.filter((it) => it.primary),
    { to: '/menu', label: 'Menú', short: 'Menú', icon: ICONS.menu, badge: menuBadge, badgeTone: secondary.some((it) => it.badgeTone === 'danger' && it.badge) ? 'danger' : 'yellow' },
  ]

  return (
    <div className="flex min-h-full flex-col bg-steel-100">
      <header className="sticky top-0 z-30 bg-ksa-black text-steel-100">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 lg:h-[4.5rem]">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <img src="/logo-ksa.png" alt="KSA S.A.S Servicios Industriales" className="h-11 w-auto md:h-12" />
            <span className="hidden font-display text-2xl font-bold text-ksa-yellow md:block lg:hidden">KSA Taller</span>
          </Link>

          <nav className="hidden flex-1 items-center gap-0.5 lg:flex" aria-label="Secciones">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                className={({ isActive }) =>
                  `group relative flex h-[4.5rem] items-center gap-1.5 px-2.5 font-display text-[1.05rem] font-semibold whitespace-nowrap transition-colors ${isActive ? 'text-ksa-yellow' : 'text-steel-300 hover:text-white'}`
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
            <div className="text-right leading-tight lg:hidden xl:block">
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-3 pt-5 pb-28 sm:px-4 lg:pb-10">
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
          <Suspense fallback={<SkeletonList count={3} />}>
            <Outlet context={{ items } satisfies ShellContext} />
          </Suspense>
        </div>
        <AppVersion className="mt-10 text-center text-steel-600" />
      </main>

      {/* Navegación inferior en el celular: al alcance del pulgar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t-4 border-ksa-yellow bg-ksa-black pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Secciones"
      >
        <div className="flex">
          {bottomItems.map((it) => (
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
