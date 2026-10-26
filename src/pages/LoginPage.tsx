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
    <div className="flex min-h-full items-center justify-center bg-gradient-to-b from-steel-900 to-steel-700 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-dark">
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
      </form>
    </div>
  )
}
