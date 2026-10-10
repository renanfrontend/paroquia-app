import { useCallback, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type UserRole = Database['public']['Enums']['user_role']

interface UseAuthReturn {
  session: Session | null
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAdmin: boolean
  isLeader: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

/**
 * Hook central de autenticação:
 * - Sessão Supabase persistida
 * - Profile carregado da tabela public.profiles
 * - Helpers de role (admin/leader) para gates de UI
 */
export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data
  }, [])

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession()

      if (!isMounted) return

      setSession(initialSession)

      if (isMounted) setIsLoading(false)
    }

    init().catch((error) => {
      console.error('Error restoring session:', error)
      if (isMounted) setIsLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!isMounted) return
        // Nunca aguardar chamadas Supabase no callback: ele mantém o lock do Auth.
        setSession(newSession)
      },
    )

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [fetchProfile])

  const userId = session?.user.id
  useEffect(() => {
    let cancelled = false
    setProfile(null)
    if (userId) {
      fetchProfile(userId).then((data) => {
        if (!cancelled) setProfile(data)
      }).catch((error) => console.error('Error loading profile:', error))
    }
    return () => { cancelled = true }
  }, [userId, fetchProfile])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return
    const profileData = await fetchProfile(session.user.id)
    setProfile(profileData)
  }, [session, fetchProfile])

  const hasRole = (roles: UserRole[]): boolean =>
    profile !== null && roles.includes(profile.role)

  return {
    session,
    user: session?.user ?? null,
    profile,
    isLoading,
    isAdmin: hasRole(['ADMIN_PARISH']),
    isLeader: hasRole(['ADMIN_PARISH', 'PASTORAL_LEADER']),
    signOut,
    refreshProfile,
  }
}
