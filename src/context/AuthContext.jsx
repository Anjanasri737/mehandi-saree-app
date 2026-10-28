import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext()

const ADMIN_EMAIL = 'anjanasri034@gmail.com'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // Check admin rights whenever the logged-in user changes.
  // This only decides what to SHOW. The real protection is in Supabase (RLS),
  // so someone changing this value in the browser still cannot upload or delete.
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

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}