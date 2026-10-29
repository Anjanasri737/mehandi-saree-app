import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext()

const ADMIN_EMAIL = 'anjanasri034@gmail.com'
const homeUrl = () => window.location.origin + window.location.pathname

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // Only decides what to SHOW. The real protection is Supabase's security rules.
  useEffect(() => {
    let cancelled = false

    async function checkAdmin() {
      if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
        setIsAdmin(false)
        return
      }
      const { data, error } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!cancelled) setIsAdmin(!error && !!data)
    }

    checkAdmin()
    return () => {
      cancelled = true
    }
  }, [user])

  const signUp = (email, password) => supabase.auth.signUp({ email, password })
  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signOut = () => supabase.auth.signOut()

  const signInWithProvider = (provider) =>
    supabase.auth.signInWithOAuth({ provider, options: { redirectTo: homeUrl() } })

  const resetPassword = (email) =>
    supabase.auth.resetPasswordForEmail(email, { redirectTo: homeUrl() })

  const updatePassword = async (newPassword) => {
    const result = await supabase.auth.updateUser({ password: newPassword })
    if (!result.error) setRecovering(false)
    return result
  }

  return (
    <AuthContext.Provider
      value={{
        user, loading, isAdmin, recovering,
        signUp, signIn, signOut,
        signInWithProvider, resetPassword, updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}