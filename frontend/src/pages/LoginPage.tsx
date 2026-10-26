import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { session, signIn, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error: err } = await signIn(email.trim(), password)
    if (err) setError(err)
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-full flex-col bg-ksa-black">
      <div className="hazard-stripe" aria-hidden="true" />
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
        <img
          src="/logo-ksa.png"
          alt="KSA S.A.S Servicios Industriales"
          className="w-56 max-w-full sm:w-72"
        />
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
        >
          <div className="hazard-stripe" aria-hidden="true" />
          <div className="p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-ksa-green">
              Servicios Industriales KSA
            </p>
            <h1 className="mb-1 text-3xl font-bold text-steel-900">Ingresar</h1>
            <p className="mb-6 text-steel-600">Órdenes e inventario del taller</p>

            <label className="mb-4 block">
              <span className="mb-1 block text-sm font-semibold">Correo</span>
              <input
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-xl border-2 border-steel-400 px-4 py-3 text-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="mb-4 block">
              <span className="mb-1 block text-sm font-semibold">Contraseña</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-xl border-2 border-steel-400 px-4 py-3 text-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error && (
              <p className="mb-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-touch btn-primary w-full"
              disabled={submitting}
            >
              {submitting ? 'Entrando…' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
      <div className="hazard-stripe" aria-hidden="true" />
    </div>
  )
}
