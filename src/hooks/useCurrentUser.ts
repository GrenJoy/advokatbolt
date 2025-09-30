import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export function useCurrentUser() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { session } = useAuthStore()

  useEffect(() => {
    const fetchUser = async () => {
      if (!session?.user) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        // Получаем данные юриста по email
        const { data, error } = await supabase
          .from('lawyers')
          .select('*')
          .eq('email', session.user.email)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching lawyer:', error)
        }

        setUser(data || { 
          id: '00000000-0000-0000-0000-000000000000',
          email: session.user.email,
          name: session.user.email?.split('@')[0] || 'User'
        })
      } catch (error) {
        console.error('Error in useCurrentUser:', error)
        setUser({
          id: '00000000-0000-0000-0000-000000000000',
          email: session?.user?.email || 'user@example.com',
          name: 'User'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [session])

  return { user, loading }
}