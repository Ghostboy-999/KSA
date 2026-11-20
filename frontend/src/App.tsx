import { lazy, Suspense, type ComponentType } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RoleGate } from './components/auth/RoleGate'
import { AppShell } from './components/layout/AppShell'
import { FullScreenLoader } from './components/ui/Loading'
import { UpdateBanner } from './components/ui/UpdateBanner'
import { AuthProvider } from './contexts/AuthContext'
import { BoardPage } from './pages/BoardPage'
import { LoginPage } from './pages/LoginPage'
import { ProtectedRoute } from './routes/ProtectedRoute'

// Cada pantalla se descarga cuando se abre; el tablero y el ingreso van en la carga inicial
const page = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })))

const AdminUsersPage = page(() => import('./pages/AdminUsersPage'), 'AdminUsersPage')
const CalendarPage = page(() => import('./pages/CalendarPage'), 'CalendarPage')
const IndicatorsPage = page(() => import('./pages/IndicatorsPage'), 'IndicatorsPage')
const InventoryPage = page(() => import('./pages/InventoryPage'), 'InventoryPage')
const IssuesPage = page(() => import('./pages/IssuesPage'), 'IssuesPage')
const MenuPage = page(() => import('./pages/MenuPage'), 'MenuPage')
const NewOrderPage = page(() => import('./pages/NewOrderPage'), 'NewOrderPage')
const OrderDetailPage = page(() => import('./pages/OrderDetailPage'), 'OrderDetailPage')
const RequestsPage = page(() => import('./pages/RequestsPage'), 'RequestsPage')
const SignupPage = page(() => import('./pages/SignupPage'), 'SignupPage')

export default function App() {
  return (
    <AuthProvider>
      <UpdateBanner />
      <BrowserRouter>
        <Suspense fallback={<FullScreenLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<SignupPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route index element={<BoardPage />} />
                <Route path="inventario" element={<InventoryPage />} />
                <Route path="calendario" element={<CalendarPage />} />
                <Route path="menu" element={<MenuPage />} />
                <Route path="orden/:id" element={<OrderDetailPage />} />
                <Route element={<RoleGate roles={['admin', 'gerente']} />}>
                  <Route path="nueva-orden" element={<NewOrderPage />} />
                  <Route path="inconvenientes" element={<IssuesPage />} />
                  <Route path="solicitudes" element={<RequestsPage />} />
                  <Route path="indicadores" element={<IndicatorsPage />} />
                </Route>
                <Route element={<RoleGate roles={['admin']} />}>
                  <Route path="usuarios" element={<AdminUsersPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
