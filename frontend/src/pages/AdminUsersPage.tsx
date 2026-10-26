import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ROLE_LABELS, type Profile, type UserRole } from '../types/database'

export function AdminUsersPage() {
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
        <h2 className="text-2xl font-bold">Usuarios</h2>
        <p className="text-steel-600">
          Cree usuarios en Supabase → Authentication → Users. Luego asigne el rol aquí.
          El primer admin: después de crear su cuenta, ejecute en SQL (ver también backend/README.md):
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-steel-900 p-3 text-xs text-amber-safe">
{`update profiles set role = 'admin'
where id = (select id from auth.users where email = 'su@correo.com');`}
        </pre>
      </div>

      {msg && <p className="rounded bg-white px-3 py-2 text-sm shadow">{msg}</p>}
      {error && <p className="text-danger">{error}</p>}

      <ul className="space-y-3">
        {profiles.map((p) => (
          <li
            key={p.id}
            className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-bold">{p.full_name}</p>
              <p className="text-sm text-steel-600">
                {ROLE_LABELS[p.role]} · {p.active ? 'Activo' : 'Inactivo'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="btn-touch border-2 border-steel-400 bg-white text-sm"
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
                className={`btn-touch text-sm ${p.active ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => void toggleActive(p)}
              >
                {p.active ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
