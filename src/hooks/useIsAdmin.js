import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

export function useIsAdmin() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!user) {
      setIsAdmin(false)
      return
    }
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (cancelled) return
      if (error) console.log(error.message)
      setIsAdmin(data === true)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  return isAdmin
}