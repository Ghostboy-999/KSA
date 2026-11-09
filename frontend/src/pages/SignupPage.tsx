import { useState, type FormEvent } from 'react'
import { BusyLabel } from '../components/ui/Loading'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export function SignupPage() {
  const { session, loading } = useAuth()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setSubmitting(true)
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim(), phone: phone.trim() },
        emailRedirectTo: window.location.origin,
      },
    })
    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    // Con confirmación de correo activa no hay sesión hasta confirmar
    if (!data.session) setSentTo(email.trim())
  }

  const input = 'w-full rounded-xl border-2 border-steel-400 px-4 py-3 text-lg'

  return (
    <div className="flex min-h-full flex-col bg-ksa-black">
      <div className="hazard-stripe" aria-hidden="true" />
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
        <img src="/logo-ksa.png" alt="KSA S.A.S Servicios Industriales" className="anim-fade-in w-48 max-w-full" />
        <div className="anim-fade-up w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl" style={{ animationDelay: '120ms' }}>
          <div className="hazard-stripe" aria-hidden="true" />
          {sentTo ? (
            <div className="anim-fade-in space-y-4 p-6">
              <h1 className="text-2xl font-bold">📬 Revisa tu correo</h1>
              <p className="text-steel-700">
                Te enviamos un enlace a <strong>{sentTo}</strong>. Ábrelo para activar tu cuenta y
                luego ingresa.
              </p>
              <Link to="/login" className="btn-touch btn-primary block w-full text-center">
                Ir a ingresar
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4 p-6">
              <div>
                <h1 className="text-3xl font-bold text-steel-900">Crear cuenta</h1>
                <p className="text-steel-600">
                  Para seguir tus órdenes y enviarnos solicitudes de trabajo.
                </p>
              </div>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">Nombre o empresa</span>
                <input required autoComplete="name" className={input} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">Teléfono</span>
                <input type="tel" autoComplete="tel" className={input} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">Correo</span>
                <input type="email" required autoComplete="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} />
                <span className="mt-1 block text-xs text-steel-600">
                  Usa el mismo correo que diste en KSA para ver tus órdenes.
                </span>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">Contraseña</span>
                <input type="password" required minLength={8} autoComplete="new-password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">Repite la contraseña</span>
                <input type="password" required minLength={8} autoComplete="new-password" className={input} value={password2} onChange={(e) => setPassword2(e.target.value)} />
              </label>
              {error && <p key={error} className="anim-slide-down rounded-lg bg-red-100 px-3 py-2 text-sm text-danger" role="alert">{error}</p>}
              <button type="submit" className="btn-touch btn-primary w-full" disabled={submitting}>
                <BusyLabel busy={submitting} busyText="Creando…">Crear cuenta</BusyLabel>
              </button>
              <p className="text-center text-sm">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="font-semibold underline">
                  Ingresar
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
      <div className="hazard-stripe" aria-hidden="true" />
    </div>
  )
}
