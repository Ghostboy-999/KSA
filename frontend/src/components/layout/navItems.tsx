import type { ReactNode } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useClientRequests } from '../../hooks/useClientRequests'
import { useIssues } from '../../hooks/useIssues'

/* Íconos de trazo, del mismo grosor que la tipografía */
const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
)
export const ICONS = {
  board: icon(<><rect x="3" y="4" width="5" height="16" rx="1" /><rect x="10" y="4" width="5" height="10" rx="1" /><rect x="17" y="4" width="4" height="13" rx="1" /></>),
  stock: icon(<><path d="M3 8l9-5 9 5-9 5-9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>),
  calendar: icon(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /><path d="M8 14h2M14 14h2M8 17.5h2" /></>),
  add: icon(<><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M12 8v8M8 12h8" /></>),
  alert: icon(<><path d="M12 3l9.5 17h-19L12 3z" /><path d="M12 10v4M12 17.5v.5" /></>),
  inbox: icon(<><path d="M3 13l3-8h12l3 8v6H3v-6z" /><path d="M3 13h5l1.5 2h5L16 13h5" /></>),
  chart: icon(<><path d="M4 20V4M4 20h16" /><rect x="7" y="12" width="3" height="5" rx="0.5" /><rect x="12" y="8" width="3" height="9" rx="0.5" /><rect x="17" y="5" width="3" height="12" rx="0.5" /></>),
  users: icon(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 010 7M18 14.8c1.8.8 3 2.6 3.5 5.2" /></>),
  menu: icon(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4.2-6 8-6s7 2 8 6" /></>),
  logout: icon(<><path d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4" /><path d="M10 8l-4 4 4 4M6 12h10" /></>),
  chevron: icon(<path d="M9 5l7 7-7 7" />),
}

export interface NavItem {
  to: string
  label: string
  short: string
  icon: ReactNode
  badge?: number
  badgeTone?: 'danger' | 'yellow'
  end?: boolean
  /** Va en la barra inferior del celular; el resto queda en Menú */
  primary?: boolean
}

/** Secciones según el rol, con los contadores en vivo */
export function useNavItems() {
  const { profile } = useAuth()
  const isManager = profile?.role === 'admin' || profile?.role === 'gerente'
  const isAdmin = profile?.role === 'admin'
  const { issues: openIssues } = useIssues({ enabled: isManager })
  const { requests: openRequests } = useClientRequests({ onlyOpen: true, enabled: isManager })

  const items: NavItem[] = [
    { to: '/', label: 'Tablero', short: 'Tablero', icon: ICONS.board, end: true, primary: true },
    { to: '/inventario', label: 'Inventario', short: 'Inventario', icon: ICONS.stock, primary: true },
    { to: '/calendario', label: 'Calendario', short: 'Calendario', icon: ICONS.calendar, primary: true },
    ...(isManager
      ? [
          { to: '/nueva-orden', label: 'Nueva orden', short: 'Nueva', icon: ICONS.add },
          { to: '/inconvenientes', label: 'Inconvenientes', short: 'Avisos', icon: ICONS.alert, badge: openIssues.length, badgeTone: 'danger' as const },
          { to: '/solicitudes', label: 'Solicitudes', short: 'Pedidos', icon: ICONS.inbox, badge: openRequests.length, badgeTone: 'yellow' as const },
          { to: '/indicadores', label: 'Indicadores', short: 'Indicadores', icon: ICONS.chart },
        ]
      : []),
    ...(isAdmin ? [{ to: '/usuarios', label: 'Usuarios', short: 'Usuarios', icon: ICONS.users }] : []),
  ]

  return { items, isManager, openIssues }
}
