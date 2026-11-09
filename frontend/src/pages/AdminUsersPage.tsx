import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { staggerStyle } from '../lib/motion'
import { supabase } from '../lib/supabase'
import { ROLE_LABELS, type Profile, type UserRole } from '../types/database'

export function AdminUsersPage() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function load() {
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')
    if (err) setError(err.message)
    setProfiles((data as Profile[]) ?? [])
  }

  useEffect(() => {
    void load()
  }, [])

  async function updateRole(id: string, role: UserRole) {
    const { error: err } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id)
    setMsg(err?.message ?? 'Rol actualizado')
    await load()
  }

  async function toggleActive(p: Profile) {
    const { error: err } = await supabase
      .from('profiles')
      .update({ active: !p.active })
      .eq('id', p.id)
    setMsg(err?.message ?? (p.active ? 'Usuario desactivado' : 'Usuario activado'))
    await load()
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Usuarios</h2>
        <p className="mt-1 max-w-prose text-steel-600">
          Las cuentas nuevas entran como cliente. Para sumar a alguien del equipo, créale la cuenta
          en Supabase (Authentication, Users) y cámbiale aquí el rol.
        </p>
        <details className="mt-2 max-w-prose text-sm text-steel-600">
          <summary className="cursor-pointer font-semibold text-steel-700">¿No queda ningún administrador?</summary>
          <p className="mt-2">Ejecuta esto en el SQL Editor de Supabase con el correo de la persona:</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-ksa-black p-3 text-xs text-ksa-yellow">
{`update profiles set role = 'admin'
where id = (select id from auth.users where email = 'su@correo.com');`}
          </pre>
        </details>
      </div>

      {msg && <p key={msg} className="anim-slide-down panel px-3 py-2 text-sm" role="status">{msg}</p>}
      {error && <p className="text-danger">{error}</p>}

      <ul className="space-y-3">
        {profiles.map((p, i) => {
          const isMe = p.id === user?.id
          return (
          <li
            key={p.id}
            style={staggerStyle(i)}
            className="stagger card-lift flex flex-col gap-2 panel p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-display text-xl font-bold">
                {p.full_name}
                {isMe && <span className="ml-2 rounded-md bg-ksa-yellow px-2 py-0.5 font-sans text-sm text-ksa-black">Tú</span>}
              </p>
              <p className="text-steel-600">
                {ROLE_LABELS[p.role]}, {p.active ? 'activo' : 'inactivo'}
              </p>
            </div>
            {isMe ? (
              <p className="max-w-xs text-sm text-steel-600">
                Tu propio rol y estado no se cambian desde aquí, para que la cuenta nunca se quede sin
                administrador. Pídeselo a otro administrador.
              </p>
            ) : (
            <div className="flex flex-wrap gap-2">
              <select
                className="btn-touch border-2 border-steel-300 bg-white"
                value={p.role}
                onChange={(e) => void updateRole(p.id, e.target.value as UserRole)}
              >
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={`btn-touch ${p.active ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => void toggleActive(p)}
              >
                {p.active ? 'Desactivar' : 'Activar'}
              </button>
            </div>
            )}
          </li>
          )
        })}
      </ul>
    </div>
  )
}
