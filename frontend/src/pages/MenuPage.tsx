import { Link, useOutletContext } from 'react-router-dom'
import { Badge, type ShellContext } from '../components/layout/AppShell'
import { ICONS } from '../components/layout/navItems'
import { useAuth } from '../contexts/AuthContext'
import { staggerStyle } from '../lib/motion'
import { ROLE_LABELS } from '../types/database'

function initials(name: string | undefined) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

/** Menú por rol (mockup 03): todo lo que no cabe en la barra inferior */
export function MenuPage() {
  const { profile, signOut } = useAuth()
  const { items } = useOutletContext<ShellContext>()

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <header className="flex flex-col items-center gap-2 pt-2 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-ksa-yellow font-display text-3xl font-bold text-ksa-black">
          {initials(profile?.full_name)}
        </span>
        <h2 className="page-title">{profile?.full_name}</h2>
        <p className="font-semibold text-steel-600">{profile ? ROLE_LABELS[profile.role] : ''}</p>
      </header>

      <nav aria-label="Menú" className="panel divide-y divide-steel-200 overflow-hidden">
        {items.map((it, i) => (
          <Link key={it.to} to={it.to} className="stagger flex min-h-16 items-center gap-3 px-4 hover:bg-steel-100" style={staggerStyle(i)}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-steel-100 text-steel-800">{it.icon}</span>
            <span className="flex-1 font-display text-lg font-semibold">{it.label}</span>
            {!!it.badge && <Badge n={it.badge} tone={it.badgeTone ?? 'yellow'} />}
            <span className="text-steel-400">{ICONS.chevron}</span>
          </Link>
        ))}
        <button
          type="button"
          className="flex min-h-16 w-full items-center gap-3 px-4 text-left text-danger hover:bg-red-50"
          onClick={() => void signOut()}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">{ICONS.logout}</span>
          <span className="flex-1 font-display text-lg font-semibold">Cerrar sesión</span>
        </button>
      </nav>
    </div>
  )
}
