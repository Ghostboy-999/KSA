import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { authErrorMessage } from '../lib/authErrors'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  /** El perfil no se pudo cargar (error de red o de permisos), no que esté inactivo */
  profileError: boolean
  loading: boolean
  /** Cerrando sesión: se muestra la pantalla de despedida */
  signingOut: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error cargando perfil', error)
    return null
  }
  return data as Profile | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const refreshProfile = useCallback(async () => {
    if (!session?.user) {
      setProfile(null)
      return
    }
    const p = await fetchProfile(session.user.id)
    setProfile(p)
    setProfileError(!p)
  }, [session?.user])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session?.user) {
        const p = await fetchProfile(data.session.user.id)
        setProfile(p)
        setProfileError(!p)
      }
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (next?.user) {
        const uid = next.user.id
        // Fuera del callback: supabase-js recomienda no llamar a la API dentro de él
        setTimeout(() => {
          void fetchProfile(uid).then((p) => {
            setProfile(p)
            setProfileError(!p)
          })
        }, 0)
      } else {
        setProfile(null)
        setProfileError(false)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: authErrorMessage(error) }
  }, [])

  const signOut = useCallback(async () => {
    setSigningOut(true)
    // Lo justo para ver la despedida: la sesión se cierra en paralelo
    await Promise.all([supabase.auth.signOut(), new Promise((r) => setTimeout(r, 1100))])
    setProfile(null)
    setSigningOut(false)
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      profileError,
      loading,
      signingOut,
      signIn,
      signOut,
      refreshProfile,
    }),
    [session, profile, profileError, loading, signingOut, signIn, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
