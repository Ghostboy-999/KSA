import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RoleGate } from './components/auth/RoleGate'
import { AppShell } from './components/layout/AppShell'
import { AuthProvider } from './contexts/AuthContext'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { BoardPage } from './pages/BoardPage'
import { InventoryPage } from './pages/InventoryPage'
import { IssuesPage } from './pages/IssuesPage'
import { LoginPage } from './pages/LoginPage'
import { NewOrderPage } from './pages/NewOrderPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { RequestsPage } from './pages/RequestsPage'
import { SignupPage } from './pages/SignupPage'
import { ProtectedRoute } from './routes/ProtectedRoute'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<SignupPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<BoardPage />} />
              <Route path="inventario" element={<InventoryPage />} />
              <Route path="orden/:id" element={<OrderDetailPage />} />
              <Route element={<RoleGate roles={['admin', 'gerente']} />}>
                <Route path="nueva-orden" element={<NewOrderPage />} />
                <Route path="inconvenientes" element={<IssuesPage />} />
                <Route path="solicitudes" element={<RequestsPage />} />
              </Route>
              <Route element={<RoleGate roles={['admin']} />}>
                <Route path="usuarios" element={<AdminUsersPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
